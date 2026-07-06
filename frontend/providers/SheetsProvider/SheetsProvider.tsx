import {
  batch,
  createContext,
  createMemo,
  onMount,
  useContext,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import { calculateMatchData } from '#flib/matchDataUtils';
import {
  cacheMatches,
  loadCachedMatches,
  loadCreatedMatches,
  saveCreatedMatches,
} from '#flib/sheetUtils';
import { trpcClient } from '#flib/trpcClient';
import type {
  DayStats,
  MatchData,
  MatchDataFrame,
  MatchStats,
  MonthStats,
  SeasonStats,
  SessionStats,
  WeekStats,
} from '#frontend/types';
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
  sessionStats: () => Record<string, SessionStats>;
  dayStats: () => Record<number, DayStats>;
  weekStats: () => Record<string, WeekStats>;
  monthStats: () => Record<string, MonthStats>;
  seasonStats: () => Record<string, SeasonStats>;
  matchData: () => MatchData;
  latest: () => MatchDataFrame;
  matchHashMap: () => Record<string, Match>;

  createLocalMatch: (match: MatchCreate) => void;
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
  matches: [],
  createdMatches: {},
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
    sessionStats: () => {
      throw new Error('SheetsContext: sessionStats() called before provider');
    },
    dayStats: () => {
      throw new Error('SheetsContext: dayStats() called before provider');
    },
    weekStats: () => {
      throw new Error('SheetsContext: weekStats() called before provider');
    },
    monthStats: () => {
      throw new Error('SheetsContext: monthStats() called before provider');
    },
    seasonStats: () => {
      throw new Error('SheetsContext: seasonStats() called before provider');
    },
    matchData: () => {
      throw new Error('SheetsContext: matchData() called before provider');
    },
    matchHashMap: () => {
      throw new Error('SheetsContext: matchHashMap() called before provider');
    },

    createLocalMatch: () => {
      throw new Error(
        'SheetsContext: createLocalMatch() called before provider',
      );
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
  const [state, setState] = createStore<SheetsContextState>(getDefaultState());

  const initialize = async () => {
    batch(() => {
      setState('createdMatches', loadCreatedMatches() ?? {});
      setState('matches', loadCachedMatches() ?? []);
    });

    const [matches] = await Promise.all([trpcClient.matches.getLegacy.query()]);

    cacheMatches(matches);

    batch(() => {
      setState('matches', matches);
      setState('ready', true);
    });
  };

  const matchData = createMemo(() => calculateMatchData(state.matches));

  const matchStats = createMemo<Record<number, MatchStats>>(() => {
    return matchData().frames.reduce(
      (acc, frame) => {
        acc[frame.match.id] = frame.matchStats;
        return acc;
      },
      {} as Record<number, MatchStats>,
    );
  });

  const sessionStats = createMemo<Record<string, SessionStats>>(() => {
    return Object.fromEntries(
      Array.from(Object.entries(matchData().sessionStats)).map(
        ([session, aggregate]) => {
          return [session, aggregate.frame.sessionStats];
        },
      ),
    );
  });

  const dayStats = createMemo<Record<number, DayStats>>(() => {
    return Object.fromEntries(
      Array.from(Object.entries(matchData().dayStats)).map(
        ([day, aggregate]) => {
          return [day, aggregate.frame.dayStats];
        },
      ),
    );
  });

  const weekStats = createMemo(() => {
    return Object.fromEntries(
      Array.from(Object.entries(matchData().weekStats)).map(
        ([week, aggregate]) => {
          return [week, aggregate.frame.weekStats];
        },
      ),
    );
  });

  const monthStats = createMemo(() => {
    return Object.fromEntries(
      Array.from(Object.entries(matchData().monthStats)).map(
        ([month, aggregate]) => {
          return [month, aggregate.frame.monthStats];
        },
      ),
    );
  });

  const seasonStats = createMemo(() => {
    return Object.fromEntries(
      Array.from(Object.entries(matchData().seasonStats)).map(
        ([season, aggregate]) => {
          return [season, aggregate.frame.seasonStats];
        },
      ),
    );
  });

  const latest = createMemo<MatchDataFrame>(() => {
    return matchData().latest;
  });

  const matchHashMap = createMemo(() => {
    const map: Record<string, Match> = {};

    for (const match of state.matches) {
      map[match.hash] = match;
    }

    return map;
  });

  function createLocalMatch(match: MatchCreate): void {
    setState('createdMatches', getMatchHash(match), match);
    saveCreatedMatches(state.createdMatches);
  }

  async function createMatch(match: MatchCreate): Promise<Match> {
    createLocalMatch(match);

    const createdMatch = await trpcClient.matches.createLegacy.mutate(match);

    return createdMatch;
  }

  async function syncCreatedMatch(hash: string): Promise<Match> {
    const createdMatches = state.createdMatches;

    const match = createdMatches[hash];

    if (!match) {
      throw new Error(`No created match found with hash: ${hash}`);
    }

    return await trpcClient.matches.createLegacy.mutate(match);
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

    return Promise.all(
      matchesToCreate.map((match) =>
        trpcClient.matches.createLegacy.mutate(match),
      ),
    );
  }

  function removeCreatedMatch(hash: string) {
    setState('createdMatches', hash, undefined!);
    saveCreatedMatches(state.createdMatches);
  }

  function clearCreatedMatches() {
    setState('createdMatches', Object.keys(state.createdMatches), undefined!);
    saveCreatedMatches(state.createdMatches);
  }

  const actions: SheetsContextActions = {
    initialize,
    matchStats,
    latest,
    sessionStats,
    dayStats,
    weekStats,
    monthStats,
    seasonStats,
    matchData,
    matchHashMap,

    createLocalMatch,
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
  });

  return (
    <SheetsContext.Provider value={[state, actions]}>
      {props.children}
    </SheetsContext.Provider>
  );
};

export const useSheets = () => useContext(SheetsContext);
