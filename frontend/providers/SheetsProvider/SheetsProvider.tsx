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
  cacheMatches,
  calculateDayStats,
  calculateMatchStats,
  defaultDayStats,
  defaultMatch,
  defaultMatchStats,
  loadCachedMatches,
  loadCreatedMatches,
  saveCreatedMatches,
} from '#flib/sheetUtils';
import type { DayStats, LatestStats, MatchStats } from '#frontend/types';
import { useTRPC } from '#providers/TRPCProvider';
import { getMatchHash } from '#shared/matchUtils';
import type { Match, MatchCreate, SheetMetadata } from '#shared/types/Sheets';

export interface SheetsContextState {
  ready: boolean;
  metadata: SheetMetadata;
  matches: Match[];
  createdMatches: Record<string, MatchCreate>;
}

export interface SheetsContextActions {
  initialize: () => Promise<void>;
  matchStats: () => Record<number, MatchStats>;
  dayStats: () => Record<number, DayStats>;
  latest: () => LatestStats;
  matchHashMap: () => Record<string, Match>;

  createMatch: (match: MatchCreate) => Promise<Match>;
  syncCreatedMatch: (hash: string) => Promise<Match>;
  syncCreatedMatches: (hashes: string[]) => Promise<Match[]>;
  removeCreatedMatch: (hash: string) => void;
  clearCreatedMatches: () => void;
}

export type SheetsContextValue = [
  state: SheetsContextState,
  actions: SheetsContextActions,
];

const getDefaultState = (): SheetsContextState => ({
  ready: false,
  metadata: {
    title: 'Loading...',
    timezone: 'UTC',
    locale: 'en-US',
    rows: 0,
    columns: 0,
  },
  matches: loadCachedMatches() ?? [],
  createdMatches: loadCreatedMatches() ?? {},
});

const SheetsContext = createContext<SheetsContextValue>([
  structuredClone(getDefaultState()),
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
    matchHashMap: () => {
      throw new Error('SheetsContext: matchHashMap() called before provider');
    },

    createMatch: () => {
      throw new Error('SheetsContext: addMatch() called before provider');
    },
    syncCreatedMatch: () => {
      throw new Error(
        'SheetsContext: syncCreatedMatch() called before provider',
      );
    },
    syncCreatedMatches: () => {
      throw new Error('SheetsContext: createMatches() called before provider');
    },
    removeCreatedMatch: () => {
      throw new Error(
        'SheetsContext: removeCreatedMatch() called before provider',
      );
    },
    clearCreatedMatches: () => {
      throw new Error(
        'SheetsContext: clearCreatedMatches() called before provider',
      );
    },
  },
]);

export const SheetsProvider: ParentComponent = (props) => {
  const [{ client }] = useTRPC();

  const [state, setState] = createStore<SheetsContextState>(getDefaultState());

  let onMatchAddedSubscription: Unsubscribable | null = null;

  const initialize = async () => {
    const [metadata, matches] = await Promise.all([
      client.sheets.metadata.query(),
      client.sheets.matches.query(),
    ]);

    cacheMatches(matches);

    batch(() => {
      setState('metadata', metadata);
      setState('matches', matches);
      setState('ready', true);
    });

    subscribeToEvents();
  };

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

  const matchHashMap = createMemo(() => {
    const map: Record<string, Match> = {};

    for (const match of state.matches) {
      map[match.hash] = match;
    }

    return map;
  });

  async function createMatch(match: MatchCreate): Promise<Match> {
    setState('createdMatches', getMatchHash(match), match);
    saveCreatedMatches(state.createdMatches);

    const createdMatch = await client.sheets.createMatch.mutate(match);

    return createdMatch;
  }

  async function syncCreatedMatch(hash: string): Promise<Match> {
    const createdMatches = state.createdMatches;

    const match = createdMatches[hash];

    if (!match) {
      throw new Error(`No created match found with hash: ${hash}`);
    }

    return await client.sheets.createMatch.mutate(match);
  }

  async function syncCreatedMatches(hashes: string[]): Promise<Match[]> {
    const createdMatches = state.createdMatches;

    const matchesToCreate = hashes.map((hash) => {
      const match = createdMatches[hash];

      if (!match) {
        throw new Error(`No created match found with hash: ${hash}`);
      }

      return match;
    });

    return client.sheets.createMatches.mutate(matchesToCreate);
  }

  function removeCreatedMatch(hash: string) {
    setState('createdMatches', hash, undefined!);
    saveCreatedMatches(state.createdMatches);
  }

  function clearCreatedMatches() {
    setState('createdMatches', {});
    saveCreatedMatches(state.createdMatches);
  }

  const actions: SheetsContextActions = {
    initialize,
    matchStats,
    latest,
    dayStats,
    matchHashMap,

    createMatch,
    syncCreatedMatch,
    syncCreatedMatches,
    removeCreatedMatch,
    clearCreatedMatches,
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
