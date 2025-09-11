import {
  batch,
  createContext,
  createMemo,
  onMount,
  useContext,
} from 'solid-js';
import { createStore } from 'solid-js/store';
import {
  formatDate,
  formatDuration,
  getPlayersFromMatch,
  getPlayersFromTeam,
} from '#flib/sheetUtils';
import type {
  DayStats,
  GeneralStats,
  MatchStats,
  PlayerStats,
} from '#frontend/types';
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
  dayStats: () => Record<number, DayStats>;
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
      const players = getPlayersFromMatch(match);

      for (const player of players) {
        playersSet.add(player);
      }
    }

    return Array.from(playersSet).sort((a, b) => a.localeCompare(b));
  });

  const playerStats = createMemo<Record<string, PlayerStats>>(() => {
    const defaultStats: PlayerStats = {
      player: '',

      totalPlaytime: 0,
      totalPlaytimeFormatted: '',
      totalMatches: 0,

      averageMatchDuration: 0,
      averageMatchDurationFormatted: '',

      wins: 0,
      losses: 0,
      winRatio: 0,

      goalsFor: 0,
      goalsAgainst: 0,

      goalDifference: 0,
      goalRatio: 0,

      _matchesWithDuration: 0,
    };

    const playerMap: Map<string, PlayerStats> = new Map();

    for (const match of state.matches) {
      const team1Players = getPlayersFromTeam(match.team1);
      const team2Players = getPlayersFromTeam(match.team2);
      const players = [...team1Players, ...team2Players];

      for (const player of players) {
        if (playerMap.has(player) === false) {
          playerMap.set(player, structuredClone(defaultStats));
        }

        const stats = playerMap.get(player)!;

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

      stats.totalPlaytimeFormatted = formatDuration(stats.totalPlaytime);
      stats.averageMatchDurationFormatted = formatDuration(
        stats.averageMatchDuration,
      );
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

    const totalPlaytimeFormatted = formatDuration(totalPlaytime);

    const totalIndividualPlaytime = Object.values(playerStats()).reduce(
      (total, stats) => total + stats.totalPlaytime,
      0,
    );

    const totalIndividualPlaytimeFormatted = formatDuration(
      totalIndividualPlaytime,
    );

    const averageMatchDuration = totalPlaytime / _matchesWithDuration || 1;

    const averageMatchDurationFormatted = formatDuration(averageMatchDuration);

    const averageGoals = totalGoals / (totalMatches || 1);

    const totalPlaytimeExtrapolated =
      totalPlaytime +
      (averageMatchDuration * totalMatches - _matchesWithDuration);

    const totalPlaytimeExtrapolatedFormatted = formatDuration(
      totalPlaytimeExtrapolated,
    );

    const totalIndividualPlaytimeExtrapolated =
      totalIndividualPlaytime +
      Object.values(playerStats()).reduce((total, stats) => {
        return (
          total +
          averageMatchDuration *
            (stats.totalMatches - stats._matchesWithDuration)
        );
      }, 0);

    const totalIndividualPlaytimeExtrapolatedFormatted = formatDuration(
      totalIndividualPlaytimeExtrapolated,
    );

    return {
      totalMatches,
      totalGoals,
      uniquePlayers: uniquePlayers(),

      totalPlaytime,
      totalPlaytimeFormatted,
      totalIndividualPlaytime,
      totalIndividualPlaytimeFormatted,

      averageMatchDuration,
      averageMatchDurationFormatted,
      averageGoals,

      totalPlaytimeExtrapolated,
      totalPlaytimeExtrapolatedFormatted,
      totalIndividualPlaytimeExtrapolated,
      totalIndividualPlaytimeExtrapolatedFormatted,
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

  const actions: SheetsContextActions = {
    initialize,
    playerStats,
    generalStats,
    matchStats,
    dayStats,
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
