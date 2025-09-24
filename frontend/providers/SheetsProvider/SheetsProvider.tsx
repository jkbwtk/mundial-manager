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
  calculateElos,
  calculateGlicko2Ratings,
  DEFAULT_ELO,
  DEFAULT_GLICKO2_RATING,
  DEFAULT_GLICKO2_RD,
  DEFAULT_GLICKO2_VOLATILITY,
  formatDate,
  formatDuration,
  formatMatchLabel,
  type Glicko2Rating,
  getPlayersFromMatch,
  getPlayersFromTeam,
} from '#flib/sheetUtils';
import type {
  DayStats,
  EloStats,
  GeneralStats,
  Glicko2Stats,
  MatchStats,
  PlayerStats,
} from '#frontend/types';
import { useTRPC } from '#providers/TRPCProvider';
import type { Match, SheetMetadata } from '#shared/types/Sheets';

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
  eloStats: () => EloStats;
  glicko2Stats: () => Glicko2Stats;
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
    eloStats: () => {
      throw new Error('SheetsContext: eloStats() called before provider');
    },
    glicko2Stats: () => {
      throw new Error('SheetsContext: glicko2Stats() called before provider');
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

      playerElos: {},
      teamElos: {},
      teamIndividualElos: {},
      hybridElos: {},

      playerGlicko2: {},
      teamGlicko2: {},
      teamIndividualGlicko2: {},
      hybridGlicko2: {},
    };

    const matchMap: Map<number, MatchStats> = new Map();

    let previousPlayerElos = structuredClone(defaultStats.playerElos);
    let previousTeamElos = structuredClone(defaultStats.teamElos);
    let previousTeamIndividualElos = structuredClone(
      defaultStats.teamIndividualElos,
    );
    let previousHybridElos = structuredClone(defaultStats.hybridElos);

    let previousPlayerGlicko2 = structuredClone(defaultStats.playerGlicko2);
    let previousTeamGlicko2 = structuredClone(defaultStats.teamGlicko2);
    let previousTeamIndividualGlicko2 = structuredClone(
      defaultStats.teamIndividualGlicko2,
    );
    let previousHybridGlicko2 = structuredClone(defaultStats.hybridGlicko2);

    for (const match of state.matches) {
      if (matchMap.has(match.id) === false) {
        matchMap.set(match.id, structuredClone(defaultStats));
      }

      const stats = matchMap.get(match.id)!;

      stats.goalsPerMinute = match.duration
        ? (60 * (match.score1 + match.score2)) / (match.duration || 1)
        : 0;

      stats.playerElos = calculateElos(match, previousPlayerElos, 'player');
      stats.teamElos = calculateElos(match, previousTeamElos, 'team');
      stats.teamIndividualElos = calculateElos(
        match,
        previousTeamIndividualElos,
        'team-individual',
      );
      stats.hybridElos = calculateElos(match, previousHybridElos, 'hybrid');

      stats.playerGlicko2 = calculateGlicko2Ratings(
        match,
        previousPlayerGlicko2,
        'player',
      );
      stats.teamGlicko2 = calculateGlicko2Ratings(
        match,
        previousTeamGlicko2,
        'team',
      );
      stats.teamIndividualGlicko2 = calculateGlicko2Ratings(
        match,
        previousTeamIndividualGlicko2,
        'team-individual',
      );
      stats.hybridGlicko2 = calculateGlicko2Ratings(
        match,
        previousHybridGlicko2,
        'hybrid',
      );

      previousPlayerElos = structuredClone(stats.playerElos);
      previousTeamElos = structuredClone(stats.teamElos);
      previousTeamIndividualElos = structuredClone(stats.teamIndividualElos);
      previousHybridElos = structuredClone(stats.hybridElos);

      previousPlayerGlicko2 = structuredClone(stats.playerGlicko2);
      previousTeamGlicko2 = structuredClone(stats.teamGlicko2);
      previousTeamIndividualGlicko2 = structuredClone(
        stats.teamIndividualGlicko2,
      );
      previousHybridGlicko2 = structuredClone(stats.hybridGlicko2);
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

  const eloStats = createMemo<EloStats>(() => {
    const matches = Object.values(matchStats()).toReversed();

    const currentElos =
      matches.shift() ??
      ({
        playerElos: {},
        teamElos: {},
        teamIndividualElos: {},
        hybridElos: {},
      } as MatchStats);

    const previousElos = {
      playerElos: {},
      teamElos: {},
      teamIndividualElos: {},
      hybridElos: {},
    } as MatchStats;

    const missingPlayerElos = new Set<string>(
      Object.keys(currentElos.playerElos),
    );
    const missingTeamElos = new Set<string>(Object.keys(currentElos.teamElos));
    const missingTeamIndividualElos = new Set<string>(
      Object.keys(currentElos.teamIndividualElos),
    );
    const missingHybridElos = new Set<string>(
      Object.keys(currentElos.hybridElos),
    );

    for (const matchStat of matches) {
      for (const player of missingPlayerElos) {
        if (matchStat.playerElos[player] !== undefined) {
          previousElos.playerElos[player] = matchStat.playerElos[player];
          missingPlayerElos.delete(player);
        }
      }

      for (const team of missingTeamElos) {
        if (matchStat.teamElos[team] !== undefined) {
          previousElos.teamElos[team] = matchStat.teamElos[team];
          missingTeamElos.delete(team);
        }
      }

      for (const team of missingTeamIndividualElos) {
        if (matchStat.teamIndividualElos[team] !== undefined) {
          previousElos.teamIndividualElos[team] =
            matchStat.teamIndividualElos[team];
          missingTeamIndividualElos.delete(team);
        }
      }

      for (const player of missingHybridElos) {
        if (matchStat.hybridElos[player] !== undefined) {
          previousElos.hybridElos[player] = matchStat.hybridElos[player];
          missingHybridElos.delete(player);
        }
      }

      if (
        missingPlayerElos.size === 0 &&
        missingTeamElos.size === 0 &&
        missingHybridElos.size === 0
      ) {
        break;
      }
    }

    return {
      labels: state.matches.map(formatMatchLabel),
      individualPlayers: Array.from(Object.keys(currentElos.playerElos)).sort(
        (a, b) => a.localeCompare(b),
      ),
      teams: Array.from(Object.keys(currentElos.teamElos)).sort((a, b) =>
        a.localeCompare(b),
      ),
      teamIndividualPlayers: Array.from(
        Object.keys(currentElos.teamIndividualElos),
      ).sort((a, b) => a.localeCompare(b)),
      hybridPlayers: Array.from(Object.keys(currentElos.hybridElos)).sort(
        (a, b) => a.localeCompare(b),
      ),

      playerElos: currentElos.playerElos,
      teamElos: currentElos.teamElos,
      teamIndividualElos: currentElos.teamIndividualElos,
      hybridElos: currentElos.hybridElos,

      playerElosChange: Object.fromEntries(
        Object.entries(currentElos.playerElos).map(([player, elo]) => [
          player,
          elo - (previousElos.playerElos[player] ?? DEFAULT_ELO),
        ]),
      ),
      teamElosChange: Object.fromEntries(
        Object.entries(currentElos.teamElos).map(([team, elo]) => [
          team,
          elo - (previousElos.teamElos[team] ?? DEFAULT_ELO),
        ]),
      ),
      teamIndividualElosChange: Object.fromEntries(
        Object.entries(currentElos.teamIndividualElos).map(([team, elo]) => [
          team,
          elo - (previousElos.teamIndividualElos[team] ?? DEFAULT_ELO),
        ]),
      ),
      hybridElosChange: Object.fromEntries(
        Object.entries(currentElos.hybridElos).map(([player, elo]) => [
          player,
          elo - (previousElos.hybridElos[player] ?? DEFAULT_ELO),
        ]),
      ),
    };
  });

  const glicko2Stats = createMemo<Glicko2Stats>(() => {
    const matches = Object.values(matchStats()).toReversed();

    const currentGlicko2 =
      matches.shift() ??
      ({
        playerGlicko2: {},
        teamGlicko2: {},
        teamIndividualGlicko2: {},
        hybridGlicko2: {},
      } as MatchStats);

    const previousGlicko2 = {
      playerGlicko2: {},
      teamGlicko2: {},
      teamIndividualGlicko2: {},
      hybridGlicko2: {},
    } as MatchStats;

    const defaultRating: Glicko2Rating = {
      rating: DEFAULT_GLICKO2_RATING,
      rd: DEFAULT_GLICKO2_RD,
      volatility: DEFAULT_GLICKO2_VOLATILITY,
    };

    const missingPlayerGlicko2 = new Set<string>(
      Object.keys(currentGlicko2.playerGlicko2),
    );
    const missingTeamGlicko2 = new Set<string>(
      Object.keys(currentGlicko2.teamGlicko2),
    );
    const missingTeamIndividualGlicko2 = new Set<string>(
      Object.keys(currentGlicko2.teamIndividualGlicko2),
    );
    const missingHybridGlicko2 = new Set<string>(
      Object.keys(currentGlicko2.hybridGlicko2),
    );

    for (const matchStat of matches) {
      for (const player of missingPlayerGlicko2) {
        if (matchStat.playerGlicko2[player] !== undefined) {
          previousGlicko2.playerGlicko2[player] =
            matchStat.playerGlicko2[player];
          missingPlayerGlicko2.delete(player);
        }
      }

      for (const team of missingTeamGlicko2) {
        if (matchStat.teamGlicko2[team] !== undefined) {
          previousGlicko2.teamGlicko2[team] = matchStat.teamGlicko2[team];
          missingTeamGlicko2.delete(team);
        }
      }

      for (const team of missingTeamIndividualGlicko2) {
        if (matchStat.teamIndividualGlicko2[team] !== undefined) {
          previousGlicko2.teamIndividualGlicko2[team] =
            matchStat.teamIndividualGlicko2[team];
          missingTeamIndividualGlicko2.delete(team);
        }
      }

      for (const player of missingHybridGlicko2) {
        if (matchStat.hybridGlicko2[player] !== undefined) {
          previousGlicko2.hybridGlicko2[player] =
            matchStat.hybridGlicko2[player];
          missingHybridGlicko2.delete(player);
        }
      }

      if (
        missingPlayerGlicko2.size === 0 &&
        missingTeamGlicko2.size === 0 &&
        missingHybridGlicko2.size === 0
      ) {
        break;
      }
    }

    const calculateRatingChange = (
      current: Glicko2Rating,
      previous?: Glicko2Rating,
    ): Glicko2Rating => {
      const prev = previous ?? defaultRating;
      return {
        rating: current.rating - prev.rating,
        rd: current.rd - prev.rd,
        volatility: current.volatility - prev.volatility,
      };
    };

    return {
      labels: state.matches.map(formatMatchLabel),
      individualPlayers: Array.from(
        Object.keys(currentGlicko2.playerGlicko2),
      ).sort((a, b) => a.localeCompare(b)),
      teams: Array.from(Object.keys(currentGlicko2.teamGlicko2)).sort((a, b) =>
        a.localeCompare(b),
      ),
      teamIndividualPlayers: Array.from(
        Object.keys(currentGlicko2.teamIndividualGlicko2),
      ).sort((a, b) => a.localeCompare(b)),
      hybridPlayers: Array.from(Object.keys(currentGlicko2.hybridGlicko2)).sort(
        (a, b) => a.localeCompare(b),
      ),

      playerGlicko2: currentGlicko2.playerGlicko2,
      teamGlicko2: currentGlicko2.teamGlicko2,
      teamIndividualGlicko2: currentGlicko2.teamIndividualGlicko2,
      hybridGlicko2: currentGlicko2.hybridGlicko2,

      playerGlicko2Change: Object.fromEntries(
        Object.entries(currentGlicko2.playerGlicko2).map(([player, rating]) => [
          player,
          calculateRatingChange(rating, previousGlicko2.playerGlicko2[player]),
        ]),
      ),
      teamGlicko2Change: Object.fromEntries(
        Object.entries(currentGlicko2.teamGlicko2).map(([team, rating]) => [
          team,
          calculateRatingChange(rating, previousGlicko2.teamGlicko2[team]),
        ]),
      ),
      teamIndividualGlicko2Change: Object.fromEntries(
        Object.entries(currentGlicko2.teamIndividualGlicko2).map(
          ([team, rating]) => [
            team,
            calculateRatingChange(
              rating,
              previousGlicko2.teamIndividualGlicko2[team],
            ),
          ],
        ),
      ),
      hybridGlicko2Change: Object.fromEntries(
        Object.entries(currentGlicko2.hybridGlicko2).map(([player, rating]) => [
          player,
          calculateRatingChange(rating, previousGlicko2.hybridGlicko2[player]),
        ]),
      ),
    };
  });

  const actions: SheetsContextActions = {
    initialize,
    playerStats,
    generalStats,
    matchStats,
    dayStats,
    eloStats,
    glicko2Stats,
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
