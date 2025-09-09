import {
  batch,
  createContext,
  createMemo,
  onMount,
  useContext,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import type { GeneralStats, MatchStats, PlayerStats } from '#frontend/types';
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
  playerStats: () => Record<string, PlayerStats>;
  generalStats: () => GeneralStats;
  matchStats: () => Record<number, MatchStats>;
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
    playerStats: () => {
      throw new Error('SheetsContext: playerStats() called before provider');
    },
    generalStats: () => {
      throw new Error('SheetsContext: generalStats() called before provider');
    },
    matchStats: () => {
      throw new Error('SheetsContext: matchStats() called before provider');
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

  const uniquePlayers = createMemo(() => {
    const playersSet: Set<string> = new Set();

    for (const match of state.matches) {
      const players = [match.team1, match.team2].join(' ').split(/\s+/g);

      for (const player of players) {
        if (player) {
          playersSet.add(player);
        }
      }
    }

    return Array.from(playersSet).sort((a, b) => a.localeCompare(b));
  });

  const playerStats = createMemo<Record<string, PlayerStats>>(() => {
    const defaultStats: PlayerStats = {
      player: '',

      totalPlaytime: 0,
      totalMatches: 0,

      averageMatchDuration: 0,

      wins: 0,
      losses: 0,
      winRatio: 0,

      goalsFor: 0,
      goalsAgainst: 0,

      goalDifference: 0,
      goalRatio: 0,

      _matchesWithDuration: 0,
    };

    const playerMap: Map<string, PlayerStats> = new Map(
      uniquePlayers().map((p) => [p, structuredClone(defaultStats)]),
    );

    for (const match of state.matches) {
      const team1Players = match.team1.split(/\s+/g);
      const team2Players = match.team2.split(/\s+/g);
      const players = [...team1Players, ...team2Players];

      for (const player of players) {
        const stats = playerMap.get(player) ?? structuredClone(defaultStats);

        stats.totalPlaytime += match.duration ?? 0;
        stats.totalMatches += 1;

        stats._matchesWithDuration += match.duration ? 1 : 0;

        const isTeam1 = team1Players.includes(player);

        const playerGoals = isTeam1 ? match.score1 : match.score2;
        const opponentGoals = isTeam1 ? match.score2 : match.score1;

        stats.goalsFor += playerGoals;
        stats.goalsAgainst += opponentGoals;

        if (playerGoals > opponentGoals) {
          stats.wins += 1;
        } else if (playerGoals < opponentGoals) {
          stats.losses += 1;
        }
      }
    }

    for (const [player, stats] of playerMap) {
      stats.player = player;

      stats.averageMatchDuration =
        stats.totalPlaytime / (stats._matchesWithDuration || 1);

      stats.winRatio = stats.wins / (stats.losses || 1);

      stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
      stats.goalRatio = stats.goalsFor / (stats.goalsAgainst || 1);
    }

    return Object.fromEntries(playerMap);
  });

  const generalStats = createMemo<GeneralStats>(() => {
    const totalMatches = state.matches.length;

    const _matchesWithDuration = state.matches.filter((m) => m.duration).length;

    const totalGoals = state.matches.reduce(
      (total, match) => total + match.score1 + match.score2,
      0,
    );

    const totalPlaytime = state.matches.reduce(
      (total, match) => total + (match.duration ?? 0),
      0,
    );

    const totalIndividualPlaytime = Object.values(playerStats()).reduce(
      (total, stats) => total + stats.totalPlaytime,
      0,
    );

    const averageMatchDuration = totalPlaytime / _matchesWithDuration || 1;

    const totalPlaytimeExtrapolated =
      totalPlaytime +
      (averageMatchDuration * totalMatches - _matchesWithDuration);

    const totalIndividualPlaytimeExtrapolated =
      totalIndividualPlaytime +
      Object.values(playerStats()).reduce((total, stats) => {
        return (
          total +
          averageMatchDuration *
            (stats.totalMatches - stats._matchesWithDuration)
        );
      }, 0);

    return {
      totalMatches,
      totalGoals,
      uniquePlayers: uniquePlayers(),

      totalPlaytime,
      totalIndividualPlaytime,

      averageMatchDuration,

      totalPlaytimeExtrapolated,
      totalIndividualPlaytimeExtrapolated,
    };
  });

  const matchStats = createMemo<Record<number, MatchStats>>(() => {
    const defaultStats: MatchStats = {
      id: -1,
      goalsPerMinute: 0,
    };

    const matchMap: Map<number, MatchStats> = new Map(
      state.matches.map((m) => [m.id, structuredClone(defaultStats)]),
    );

    for (const match of state.matches) {
      const stats = matchMap.get(match.id) ?? structuredClone(defaultStats);

      stats.goalsPerMinute = match.duration
        ? (60 * (match.score1 + match.score2)) / (match.duration || 1)
        : 0;
    }

    for (const [id, stats] of matchMap) {
      stats.id = id;
    }

    return Object.fromEntries(matchMap);
  });

  const actions: SheetsContextActions = {
    initialize,
    playerStats,
    generalStats,
    matchStats,
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
