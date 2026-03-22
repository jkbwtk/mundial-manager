import { Extractor } from '#components/ChartBuilder/Extractor';
import type { DropdownOption } from '#components/Dropdown';
import type { StatType } from '#components/StatPaginatorWidget';
import { formatDuration, generateTeamColor } from '#flib/sheetUtils';
import { getTeamColor } from '#flib/teamColors';
import type {
  AggregateStats,
  BaseStats,
  EloRatings,
  GeneralStats,
  Glicko2Ratings,
  MatchData,
  MatchDataFrame,
  PlayerStats,
} from '#frontend/types';
import { useSheets } from '#providers/SheetsProvider';
import type { Match } from '#shared/types/Sheets';
import { quickSwitch } from '#shared/utils';
import variables from '#styles/variables.module.scss';

export type DataSource =
  | 'match'
  | 'base'
  | 'aggregate'
  | 'general'
  | 'player'
  | 'elo'
  | 'glicko2';

export type ChartType = 'line' | 'bar';

export type ComplexChartType =
  | Record<DataSource, ChartType>
  | ({
      [key in DataSource]?: ChartType;
    } & { default: ChartType });

export type ChartUnit = 'duration' | 'count' | 'rating' | 'ratio' | 'frequency';

export type DataSourceTypeMap = {
  match: Match;
  base: BaseStats;
  aggregate: AggregateStats;
  general: GeneralStats;
  player: Record<string, PlayerStats>;
  elo: EloRatings;
  glicko2: Glicko2Ratings;
};

export type RegistryEntryInternal<D extends DataSource> = {
  id: string;
  label: string;

  type: ChartType | ComplexChartType;
  unit: ChartUnit;

  dataSources: D[];
  getEntities?: () => string[];
  getEntityColor?: (ctx: Context) => string | undefined;
  extractor: (
    ext: Extractor<DataSourceTypeMap[D], Context>,
  ) => Extractor<DataSourceTypeMap[D], Context, number | null>;
};

export type RegistryEntry<D extends DataSource> = Omit<
  RegistryEntryInternal<D>,
  'extractor'
> & {
  extractor: Extractor<DataSourceTypeMap[D], Context, number | null>;
};

export type Context = {
  grouping: StatType;
  dataSource: DataSource;

  entity?: string;
  entry: RegistryEntry<DataSource>;
};

export function getSourceFromFrame(
  frame: MatchDataFrame,
  ctx: Context,
):
  | Match
  | BaseStats
  | AggregateStats
  | GeneralStats
  | Record<string, PlayerStats>
  | EloRatings
  | Glicko2Ratings {
  switch (ctx.dataSource) {
    case 'match':
      return frame.match;
    case 'base':
      switch (ctx.grouping) {
        case 'match':
          return frame.matchStats;
        case 'session':
          return frame.sessionStats;
        case 'day':
          return frame.dayStats;
        case 'week':
          return frame.weekStats;
        case 'month':
          return frame.monthStats;
        case 'season':
          return frame.seasonStats;
        default:
          throw new Error(
            `Unsupported grouping for base data source: ${ctx.grouping}`,
          );
      }
    case 'aggregate':
      switch (ctx.grouping) {
        case 'session':
          return frame.sessionStats;
        case 'day':
          return frame.dayStats;
        case 'week':
          return frame.weekStats;
        case 'month':
          return frame.monthStats;
        case 'season':
          return frame.seasonStats;
        default:
          throw new Error(
            `Unsupported grouping for aggregate data source: ${ctx.grouping}`,
          );
      }
    case 'general':
      return frame.generalStats;
    case 'player':
      return frame.playerStats;
    case 'elo':
      return frame.eloRatings;
    case 'glicko2':
      return frame.glicko2Ratings;
    default:
      throw new Error(`Unsupported data source: ${ctx.dataSource}`);
  }
}

export const DataSourceGroupingSupport = {
  match: new Set(['match']),
  base: new Set(['match', 'session', 'day', 'week', 'month', 'season']),
  aggregate: new Set(['session', 'day', 'week', 'month', 'season']),
  general: new Set(['match', 'session', 'day', 'week', 'month', 'season']),
  player: new Set(['match', 'session', 'day', 'week', 'month', 'season']),
  elo: new Set(['match', 'session', 'day', 'week', 'month', 'season']),
  glicko2: new Set(['match', 'session', 'day', 'week', 'month', 'season']),
} as const satisfies Record<DataSource, Set<StatType>>;

export function getFramesFromStatType(
  matchData: MatchData,
  statType: StatType,
): MatchDataFrame[] {
  switch (statType) {
    case 'match':
      return matchData.frames;
    case 'session':
      return Object.values(matchData.sessionStats).map(
        (aggregate) => aggregate.frame,
      );
    case 'day':
      return Object.values(matchData.dayStats).map(
        (aggregate) => aggregate.frame,
      );
    case 'week':
      return Object.values(matchData.weekStats).map(
        (aggregate) => aggregate.frame,
      );
    case 'month':
      return Object.values(matchData.monthStats).map(
        (aggregate) => aggregate.frame,
      );
    case 'season':
      return Object.values(matchData.seasonStats).map(
        (aggregate) => aggregate.frame,
      );
    default:
      throw new Error(`Unsupported stat type: ${statType}`);
  }
}

export function getLabelsFromFrames(
  frames: MatchDataFrame[],
  statType: StatType,
): string[] {
  switch (statType) {
    case 'match':
      return frames.map((frame) => frame.matchStats.label);
    case 'session':
      return frames.map((frame) => frame.sessionStats.humanSession);
    case 'day':
      return frames.map((frame) => frame.dayStats.humanDate);
    case 'week':
      return frames.map((frame) => frame.weekStats.humanWeek);
    case 'month':
      return frames.map((frame) => frame.monthStats.humanMonth);
    case 'season':
      return frames.map((frame) => frame.seasonStats.season.label);
    default:
      return [];
  }
}

export function getDataFromFrame(
  ctx: Context,
  frame: MatchDataFrame,
): number | null {
  const source = getSourceFromFrame(frame, ctx);
  return ctx.entry.extractor.extract(source, ctx);
}

export function getChartType(ctx: Context): ChartType {
  if (typeof ctx.entry.type === 'string') {
    return ctx.entry.type;
  }

  if ('default' in ctx.entry.type) {
    return ctx.entry.type[ctx.dataSource] ?? ctx.entry.type.default;
  }

  return ctx.entry.type[ctx.dataSource];
}

export function getPlayerEntities(): string[] {
  const [, { latest }] = useSheets();

  return latest().generalStats.players;
}

export function getTeamEntities(): string[] {
  const [, { latest }] = useSheets();

  return latest().generalStats.teams;
}

export function formatUnit(val: number, unit: ChartUnit): string {
  switch (unit) {
    case 'duration':
      return formatDuration(val);
    default:
      return val.toFixed(2);
  }
}

export const GroupingOptions = [
  { label: 'Match', value: 'match' },
  { label: 'Session', value: 'session' },
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Season', value: 'season' },
] satisfies DropdownOption<StatType>[];

export const registry = Object.fromEntries(
  GroupingOptions.map((e) => [e.value, {}]),
) as Record<
  StatType,
  Record<DataSource, Record<string, RegistryEntry<DataSource>>>
>;

export function register<D extends DataSource>(
  entry: RegistryEntryInternal<D>,
) {
  const { extractor: build, ...rest } = entry;
  const internal = {
    ...rest,
    extractor: build(new Extractor()),
  };

  for (const ds of entry.dataSources) {
    for (const grouping of DataSourceGroupingSupport[ds]) {
      const subRegistry = registry[grouping][ds] ?? {};

      // @ts-expect-error
      subRegistry[entry.id] = internal;
      registry[grouping][ds] = subRegistry;
    }
  }
}

function getGeneratedTeamColor(ctx: Context): string | undefined {
  return ctx.entity ? generateTeamColor(ctx.entity) : undefined;
}

function getFloorColor(floor: number): string | undefined {
  return quickSwitch(floor, {
    1: variables.red,
    2: variables.green,
    3: variables.yellow,
    4: variables.blue,
    default: undefined,
  });
}

function extractEntity<T>(data: Record<string, T>, ctx: Context): T | null {
  if (!ctx.entity) return null;
  return data[ctx.entity] ?? null;
}

register({
  id: 'match-duration',
  label: 'Match Duration',

  type: 'bar',
  unit: 'duration',

  dataSources: ['match'],
  extractor: (ext) => ext.chain((data) => data.duration),
});

register({
  id: 'match-pause-duration',
  label: 'Match Pause Duration',

  type: 'bar',
  unit: 'duration',

  dataSources: ['match'],
  extractor: (ext) => ext.chain((data) => data.pauseDuration),
});

register({
  id: 'ball-out-count',
  label: 'Ball Outs',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'count',

  dataSources: ['base', 'aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.ballOutCount),
});

register({
  id: 'position-change-count',
  label: 'Position Changes',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'count',

  dataSources: ['base', 'aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.positionChangeCount),
});

register({
  id: 'own-goal-count',
  label: 'Own Goals',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'count',

  dataSources: ['base', 'aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.ownGoalCount),
});

register({
  id: 'average-time-between-goals',
  label: 'Avg. Time Between Goals',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'duration',

  dataSources: ['base', 'aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.averageTimeBetweenGoals),
});

register({
  id: 'longest-time-between-goals',
  label: 'Longest Time Between Goals',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'duration',

  dataSources: ['base', 'aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.longestTimeBetweenGoals),
});

register({
  id: 'shortest-time-between-goals',
  label: 'Shortest Time Between Goals',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'duration',

  dataSources: ['base', 'aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.shortestTimeBetweenGoals),
});

register({
  id: 'goals-per-minute',
  label: 'Goals Per Minute',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'frequency',

  dataSources: ['base', 'aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.goalsPerMinute),
});

register({
  id: 'players',
  label: 'Players',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'count',

  dataSources: ['aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.players.length),
});

register({
  id: 'matches',
  label: 'Matches',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'count',

  dataSources: ['aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.matches),
});

register({
  id: 'goals',
  label: 'Goals',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'count',

  dataSources: ['aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.goals),
});

register({
  id: 'playtime',
  label: 'Playtime',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'duration',

  dataSources: ['aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.playtime),
});

register({
  id: 'individual-playtime',
  label: 'Individual Playtime',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'duration',

  dataSources: ['aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.individualPlaytime),
});

register({
  id: 'average-match-duration',
  label: 'Avg. Match Duration',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'duration',

  dataSources: ['aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.averageMatchDuration),
});

register({
  id: 'average-goals',
  label: 'Avg. Goals',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'count',

  dataSources: ['aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.averageGoals),
});

register({
  id: 'average-ball-outs-per-match',
  label: 'Avg. Ball Outs Per Match',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'count',

  dataSources: ['aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.averageBallOutsPerMatch),
});

register({
  id: 'average-position-changes-per-match',
  label: 'Avg. Position Changes Per Match',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'count',

  dataSources: ['aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.averagePositionChangesPerMatch),
});

register({
  id: 'average-own-goals-per-match',
  label: 'Avg. Own Goals Per Match',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'count',

  dataSources: ['aggregate', 'general'],
  extractor: (ext) => ext.chain((data) => data.averageOwnGoalsPerMatch),
});

register({
  id: 'floor-match-count',
  label: 'Floor Match Count',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'count',

  dataSources: ['aggregate', 'general'],
  getEntities: () => {
    const [, { latest }] = useSheets();

    return latest().generalStats.floors.map((floor) => floor.toString());
  },
  getEntityColor: (ctx) =>
    ctx.entity ? getFloorColor(Number.parseInt(ctx.entity, 10)) : undefined,
  extractor: (ext) =>
    ext.chain(
      (data, ctx) =>
        data.floorMatchCount[Number.parseInt(ctx.entity!, 10)] ?? null,
    ),
});

register({
  id: 'color-win-count',
  label: 'Color Win Count',

  type: {
    general: 'line',
    default: 'bar',
  },
  unit: 'count',

  dataSources: ['aggregate', 'general'],
  getEntities: () => {
    const [, { latest }] = useSheets();

    return latest().generalStats.colors;
  },
  getEntityColor: (ctx) => (ctx.entity ? getTeamColor(ctx.entity) : undefined),
  extractor: (ext) =>
    ext.chain((data, ctx) => data.colorWinCount[ctx.entity!] ?? null),
});

register({
  id: 'total-playtime-extrapolated',
  label: 'Total Playtime (Extrapolated)',

  type: 'line',
  unit: 'duration',

  dataSources: ['general'],
  extractor: (ext) => ext.chain((data) => data.totalPlaytimeExtrapolated),
});

register({
  id: 'total-individual-playtime-extrapolated',
  label: 'Total Individual Playtime (Extrapolated)',

  type: 'line',
  unit: 'duration',

  dataSources: ['general'],
  extractor: (ext) =>
    ext.chain((data) => data.totalIndividualPlaytimeExtrapolated),
});

register({
  id: 'teams',
  label: 'Teams',

  type: 'line',
  unit: 'count',

  dataSources: ['general'],
  extractor: (ext) => ext.chain((data) => data.teams.length),
});

register({
  id: 'player-playtime',
  label: 'Playtime',

  type: 'line',
  unit: 'duration',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.playtime),
});

register({
  id: 'player-matches',
  label: 'Matches',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.matches),
});

register({
  id: 'player-average-match-duration',
  label: 'Avg. Match Duration',

  type: 'line',
  unit: 'duration',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.averageMatchDuration),
});

register({
  id: 'player-wins',
  label: 'Wins',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) => ext.chain(extractEntity).chain((player) => player.wins),
});

register({
  id: 'player-losses',
  label: 'Losses',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) => ext.chain(extractEntity).chain((player) => player.losses),
});

register({
  id: 'player-win-ratio',
  label: 'Win Ratio',

  type: 'line',
  unit: 'ratio',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.winRatio),
});

register({
  id: 'player-goals-for',
  label: 'Goals For',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.goalsFor),
});

register({
  id: 'player-goals-against',
  label: 'Goals Against',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.goalsAgainst),
});

register({
  id: 'player-goal-difference',
  label: 'Goal Difference',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.goalDifference),
});

register({
  id: 'player-goal-ratio',
  label: 'Goal Ratio',

  type: 'line',
  unit: 'ratio',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.goalRatio),
});

register({
  id: 'player-own-goals',
  label: 'Own Goals',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.ownGoals),
});

register({
  id: 'player-current-win-streak',
  label: 'Current Win Streak',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.currentWinStreak),
});

register({
  id: 'player-longest-win-streak',
  label: 'Longest Win Streak',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.longestWinStreak),
});

register({
  id: 'player-current-loss-streak',
  label: 'Current Loss Streak',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.currentLossStreak),
});

register({
  id: 'player-longest-loss-streak',
  label: 'Longest Loss Streak',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.longestLossStreak),
});

register({
  id: 'player-matches-in-day',
  label: 'Matches In Day',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.matchesInDay),
});

register({
  id: 'player-most-matches-in-day',
  label: 'Most Matches In Day',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.mostMatchesInDay),
});

register({
  id: 'player-matches-in-season',
  label: 'Matches In Season',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.matchesInSeason),
});

register({
  id: 'player-most-matches-in-season',
  label: 'Most Matches In Season',

  type: 'line',
  unit: 'count',

  dataSources: ['player'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext.chain(extractEntity).chain((player) => player.mostMatchesInSeason),
});

register({
  id: 'rating-elo-player',
  label: 'Player Elo Rating',

  type: 'line',
  unit: 'rating',

  dataSources: ['elo'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext
      .chain((data, ctx) => data.playerElos[ctx.entity!])
      .chain((elo) => elo.rating),
});

register({
  id: 'rating-elo-hybrid',
  label: 'Hybrid Elo Rating',

  type: 'line',
  unit: 'rating',

  dataSources: ['elo'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext
      .chain((data, ctx) => data.hybridElos[ctx.entity!])
      .chain((elo) => elo.rating),
});

register({
  id: 'rating-elo-team-individual',
  label: 'Team Individual Elo Rating',

  type: 'line',
  unit: 'rating',

  dataSources: ['elo'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext
      .chain((data, ctx) => data.teamIndividualElos[ctx.entity!])
      .chain((elo) => elo.rating),
});

register({
  id: 'rating-elo-team',
  label: 'Team Elo Rating',

  type: 'line',
  unit: 'rating',

  dataSources: ['elo'],
  getEntities: getTeamEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext
      .chain((data, ctx) => data.teamElos[ctx.entity!])
      .chain((elo) => elo.rating),
});

register({
  id: 'rating-glicko2-player',
  label: 'Player Glicko-2 Rating',

  type: 'line',
  unit: 'rating',

  dataSources: ['glicko2'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext
      .chain((data, ctx) => data.playerGlicko2[ctx.entity!])
      .chain((glicko2) => glicko2.rating),
});

register({
  id: 'rating-glicko2-hybrid',
  label: 'Hybrid Glicko-2 Rating',

  type: 'line',
  unit: 'rating',

  dataSources: ['glicko2'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext
      .chain((data, ctx) => data.hybridGlicko2[ctx.entity!])
      .chain((glicko2) => glicko2.rating),
});

register({
  id: 'rating-glicko2-team-individual',
  label: 'Team Individual Glicko-2 Rating',

  type: 'line',
  unit: 'rating',

  dataSources: ['glicko2'],
  getEntities: getPlayerEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext
      .chain((data, ctx) => data.teamIndividualGlicko2[ctx.entity!])
      .chain((glicko2) => glicko2.rating),
});

register({
  id: 'rating-glicko2-team',
  label: 'Team Glicko-2 Rating',

  type: 'line',
  unit: 'rating',

  dataSources: ['glicko2'],
  getEntities: getTeamEntities,
  getEntityColor: getGeneratedTeamColor,
  extractor: (ext) =>
    ext
      .chain((data, ctx) => data.teamGlicko2[ctx.entity!])
      .chain((glicko2) => glicko2.rating),
});
