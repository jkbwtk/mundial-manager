import type { Unsubscribable } from '@trpc/server/observable';
import {
  batch,
  createContext,
  createMemo,
  onCleanup,
  onMount,
  useContext,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import { isServer } from 'solid-js/web';
import {
  calculateMatchStats,
  defaultMatch,
  defaultMatchStats,
  formatDate,
  formatDuration,
} from '#flib/sheetUtils';
import type { DayStats, LatestStats, MatchStats } from '#frontend/types';
import { useTRPC } from '#providers/TRPCProvider';
import type { Match, SheetMetadata } from '#shared/types/Sheets';

export interface SheetsContextState {
  ready: boolean;
  metadata: SheetMetadata;
  matches: Match[];
}

export interface SheetsContextActions {
  initialize: () => Promise<void>;
  matchStats: () => Record<number, MatchStats>;
  dayStats: () => Record<number, DayStats>;
  latest: () => LatestStats;
}

export type SheetsContextValue = [
  state: SheetsContextState,
  actions: SheetsContextActions,
];

const defaultState: SheetsContextState = {
  ready: false,
  metadata: {
    title: 'Loading...',
    timezone: 'UTC',
    locale: 'en-US',
    rows: 0,
    columns: 0,
  },
  matches: [],
};

const SheetsContext = createContext<SheetsContextValue>([
  structuredClone(defaultState),
  {
    initialize: () => {
      throw new Error('SheetsContext: initialize() called before provider');
    },
    matchStats: () => {
      throw new Error('SheetsContext: matchStats() called before provider');
    },
    latest: () => {
      throw new Error(
        'SheetsContext: latestMatchStats() called before provider',
      );
    },
    dayStats: () => {
      throw new Error('SheetsContext: dayStats() called before provider');
    },
  },
]);

export const SheetsProvider: ParentComponent = (props) => {
  const [{ client }] = useTRPC();

  const [state, setState] = createStore<SheetsContextState>(
    SheetsContext.defaultValue[0],
  );

  let onMatchAddedSubscription: Unsubscribable | null = null;

  const initialize = async () => {
    const cachedMatches = loadCachedMatches();

    if (cachedMatches) {
      setState('matches', cachedMatches);
    }

    const [metadata, matches] = await Promise.all([
      client.sheets.metadata.query(),
      client.sheets.matches.query(),
    ]);

    cacheMatches(matches);
    subscribeToEvents();

    batch(() => {
      setState('metadata', metadata);
      setState('matches', matches);
      setState('ready', true);
    });
  };

  function cacheMatches(matches: Match[]) {
    if (isServer) {
      return;
    }

    localStorage.setItem('matchesCache', JSON.stringify(matches));
  }

  function loadCachedMatches(): Match[] | null {
    if (isServer) {
      return null;
    }

    const cached = localStorage.getItem('matchesCache');

    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Match[];

        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  function subscribeToEvents() {
    if (isServer) {
      return;
    }

    if (onMatchAddedSubscription === null) {
      onMatchAddedSubscription = client.sheets.onMatchAdded.subscribe(void 0, {
        onData: ({ data: match }) => {
          setState('matches', state.matches.length, match);
          cacheMatches(state.matches);
        },

        onError: (err) => {
          console.error(
            'SheetsProvider: onMatchAdded subscription error:',
            err,
          );
        },
      });
    }
  }

  function unsubscribeFromEvents() {
    if (onMatchAddedSubscription) {
      onMatchAddedSubscription.unsubscribe();
    }
  }

  const matchStats = createMemo<Record<number, MatchStats>>(() => {
    const matches = state.matches;

    let previousStats: MatchStats | undefined;

    const matchStats = Object.fromEntries(
      matches.map((match) => {
        const stats = calculateMatchStats(match, previousStats);

        previousStats = stats;

        return [match.id, stats] as const;
      }),
    );

    return matchStats;
  });

  const dayStats = createMemo<Record<number, DayStats>>(() => {
    const defaultStats: DayStats = {
      date: 0,
      humanDate: '',

      players: [],

      matches: 0,
      goals: 0,
      playtime: 0,
      playtimeFormatted: '',

      averageMatchDuration: 0,
      averageMatchDurationFormatted: '',
      averageGoals: 0,

      goalsPerMinute: 0,

      _matchesWithDuration: 0,
      _goalsWithDuration: 0,
    };

    const dayMap: Map<number, DayStats> = new Map();

    for (const match of state.matches) {
      if (match.date === null) {
        continue;
      }

      if (dayMap.has(match.date) === false) {
        dayMap.set(match.date, {
          ...structuredClone(defaultStats),
          humanDate: formatDate(match.date),
          date: match.date,
        });
      }

      const stats = dayMap.get(match.date)!;

      stats.matches += 1;
      stats._matchesWithDuration += match.duration ? 1 : 0;
      stats._goalsWithDuration += match.duration
        ? match.score1 + match.score2
        : 0;

      stats.goals += match.score1 + match.score2;
      stats.playtime += match.duration ?? 0;

      const team1Players = match.team1.split(/\s+/g);
      const team2Players = match.team2.split(/\s+/g);
      const players = [...team1Players, ...team2Players];

      for (const player of players) {
        if (player && stats.players.includes(player) === false) {
          stats.players.push(player);
        }
      }
    }

    for (const [, stats] of dayMap) {
      stats.averageMatchDuration =
        stats.playtime / (stats._matchesWithDuration || 1);

      stats.averageGoals = stats.goals / (stats.matches || 1);

      stats.goalsPerMinute = stats.playtime
        ? (60 * stats._goalsWithDuration) / stats.playtime
        : 0;

      stats.playtimeFormatted = formatDuration(stats.playtime);
      stats.averageMatchDurationFormatted = formatDuration(
        stats.averageMatchDuration,
      );
    }

    return Object.fromEntries(dayMap);
  });

  const latest = createMemo<LatestStats>(() => {
    const match = state.matches.at(-1) ?? defaultMatch;
    const stats = matchStats()[match.id] ?? defaultMatchStats;

    return { match, matchStats: stats };
  });

  const actions: SheetsContextActions = {
    initialize,
    matchStats,
    latest,
    dayStats,
  };

  onMount(() => {
    actions.initialize().catch((error) => {
      console.error('Failed to load sheet metadata:', error);
    });

    window.addEventListener('beforeunload', () => {
      unsubscribeFromEvents();
    });
  });

  onCleanup(() => {
    unsubscribeFromEvents();
  });

  return (
    <SheetsContext.Provider value={[state, actions]}>
      {props.children}
    </SheetsContext.Provider>
  );
};

export const useSheets = () => useContext(SheetsContext);
