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
  calculateDayStats,
  calculateMatchStats,
  defaultDayStats,
  defaultMatch,
  defaultMatchStats,
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
      onMatchAddedSubscription = client.sheets.onMatchAdded.subscribe(
        {
          lastEventId: latest().match.id,
        },
        {
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
        },
      );
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
    const aggregated: Map<number, Match[]> = new Map();

    for (const match of state.matches) {
      if (match.date === null) continue;

      let list = aggregated.get(match.date);

      if (list === undefined) {
        list = [];
        aggregated.set(match.date, list);
      }

      list.push(match);
    }

    const days = Array.from(aggregated.keys()).sort((a, b) => a - b);

    let previousStats: DayStats | undefined;

    const dayStats = Object.fromEntries(
      days.map((date) => {
        const matches = aggregated.get(date)!.sort((a, b) => a.id - b.id);

        const lastMatch = matches.at(-1)!;
        const lastMatchStats = matchStats()[lastMatch.id] ?? defaultMatchStats;

        const stats = calculateDayStats(matches, lastMatchStats, previousStats);

        previousStats = stats;

        return [date, stats] as const;
      }),
    );

    return dayStats;
  });

  const latest = createMemo<LatestStats>(() => {
    const match = state.matches.at(-1) ?? defaultMatch;
    const stats = matchStats()[match.id] ?? defaultMatchStats;
    const day = dayStats()[match.date ?? -1] ?? defaultDayStats;

    return { match, matchStats: stats, dayStats: day };
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
