import {
  batch,
  createContext,
  createMemo,
  onMount,
  useContext,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import type { MatchPlaytimeStat } from '#frontend/types';
import { useTRPC } from '#providers/TRPCProvider';
import type { Match } from '#shared/types/Sheets';
import type { SheetMetadata } from '#shared/types/Sheets';

export interface SheetsContextState {
  ready: boolean;
  metadata: SheetMetadata;
  matches: Match[];
}

export interface SheetsContextActions {
  initialize: () => Promise<void>;
  playtimeStats: () => MatchPlaytimeStat[];
  totalPlaytime: () => number;
  totalIndividualPlaytime: () => number;
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
    playtimeStats: () => {
      throw new Error('SheetsContext: playtimeStats() called before provider');
    },
    totalPlaytime: () => {
      throw new Error('SheetsContext: totalPlaytime() called before provider');
    },
    totalIndividualPlaytime: () => {
      throw new Error(
        'SheetsContext: totalIndividualPlaytime() called before provider',
      );
    },
  },
]);

export const SheetsProvider: ParentComponent = (props) => {
  const [{ client }] = useTRPC();

  const [state, setState] = createStore<SheetsContextState>(
    SheetsContext.defaultValue[0],
  );

  const initialize = async () => {
    const [metadata, matches] = await Promise.all([
      client.sheets.metadata.query(),
      client.sheets.matches.query(),
    ]);

    batch(() => {
      setState('metadata', metadata);
      setState('matches', matches);
      setState('ready', true);
    });
  };

  const playtimeStats = createMemo(() => {
    const statsMap: Map<string, number> = new Map();

    for (const match of state.matches) {
      const players = [match.team1, match.team2].join(' ').split(/\s+/g);

      for (const player of players) {
        const playtime = statsMap.get(player) ?? 0;

        statsMap.set(player, playtime + (match.duration ?? 0));
      }
    }

    return Array.from(statsMap.entries()).map(([player, time]) => ({
      player,
      time,
    }));
  });

  const totalPlaytime = createMemo(() => {
    return state.matches.reduce((total, match) => {
      return total + (match.duration ?? 0);
    }, 0);
  });

  const totalIndividualPlaytime = createMemo(() => {
    const stats = playtimeStats();
    return stats.reduce((total, stat) => total + stat.time, 0);
  });

  const actions: SheetsContextActions = {
    initialize,
    playtimeStats,
    totalPlaytime,
    totalIndividualPlaytime,
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
