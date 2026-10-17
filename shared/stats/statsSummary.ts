import { defaultPlayerStats } from '#shared/defaults/playerStats';
import { getMatchSidePlayers } from '#shared/matchTimeline';
import { mergeBallStats } from '#shared/stats/ballStats';
import { mergeAggregateStats } from '#shared/stats/generalStats';
import { calculateLuckStats } from '#shared/stats/luckStats';
import { calculatePlayerStats } from '#shared/stats/playerStats';
import { getStatsPeriodKeys, getStatsRowKey } from '#shared/stats/statsPeriod';
import { calculateTableStats } from '#shared/stats/tableStats';
import type {
  BallStatsEntry,
  GeneralStatsSeries,
  GeneralStatsSeriesField,
  LuckStatsEntry,
  PlayerStatsEntry,
  RatingHistory,
  RatingStatsEntry,
  StatsPeriodType,
  TableStatsEntry,
} from '#shared/types/api/stats';
import type { BallStats } from '#shared/types/stats/ballStats';
import type { AggregateStats } from '#shared/types/stats/generalStats';
import type { PlayerStats } from '#shared/types/stats/playerStats';
import type { RatingValue } from '#shared/types/stats/ratingStats';
import type { StatsRatingChange, StatsRow } from '#shared/types/stats/statsRow';
import type { TableStats } from '#shared/types/stats/tableStats';

interface RatingSummary {
  change: StatsRatingChange;
  previous: RatingValue;
  playerUuids: string[];
}

function getRatingKey(change: StatsRatingChange): string {
  return `${change.system}|${change.subject}|${change.epoch}|${change.uuid}`;
}

function getRatingPlayers(row: StatsRow, change: StatsRatingChange): string[] {
  if (change.subject !== 'TEAM') return [change.uuid];

  return getMatchSidePlayers(
    row.match,
    change.uuid === row.match.side1TeamConfigurationUuid ? 'SIDE_1' : 'SIDE_2',
  );
}

function isCurrentRating(row: StatsRow, change: StatsRatingChange): boolean {
  return (
    change.epoch ===
    (change.system === 'SKILL' ? row.seasonKey : row.ratingEpoch)
  );
}

function getRatingSummaries(
  rows: StatsRow[],
  period: StatsRow[],
): Map<string, RatingSummary> {
  const last = period.at(-1);
  const first = period.at(0);
  const summaries = new Map<string, RatingSummary>();

  if (last === undefined || first === undefined) return summaries;

  for (const row of rows.slice(0, last.index + 1)) {
    const isBefore = row.index < first.index;

    for (const change of row.ratings) {
      const key = getRatingKey(change);

      summaries.set(key, {
        change,
        previous: isBefore
          ? change.after
          : (summaries.get(key)?.previous ?? change.before),
        playerUuids: getRatingPlayers(row, change),
      });
    }
  }

  return new Map(
    [...summaries].filter(([, { change }]) => isCurrentRating(last, change)),
  );
}

export function calculateGeneralSummary(
  rows: StatsRow[],
): AggregateStats | null {
  if (rows.length === 0) return null;

  return rows.map((row) => row.general).reduce(mergeAggregateStats);
}

export function calculatePlayerSummaries(
  rows: StatsRow[],
  playerUuid?: string,
): PlayerStatsEntry[] {
  const players = new Map<string, PlayerStats>();

  for (const row of rows) {
    for (const player of row.players) {
      if (playerUuid !== undefined && player.uuid !== playerUuid) continue;

      players.set(
        player.uuid,
        calculatePlayerStats(
          players.get(player.uuid) ?? defaultPlayerStats,
          row,
          player,
        ),
      );
    }
  }

  return [...players].map(([uuid, stats]) => ({ uuid, stats }));
}

export function calculateTableSummaries(rows: StatsRow[]): TableStatsEntry[] {
  const tables = new Map<string, TableStats>();

  for (const row of rows) {
    const { tableUuid } = row.match;

    if (!tableUuid) continue;

    tables.set(
      tableUuid,
      calculateTableStats(tables.get(tableUuid) ?? null, row),
    );
  }

  return [...tables].map(([uuid, stats]) => ({ uuid, stats }));
}

export function calculateBallSummaries(rows: StatsRow[]): BallStatsEntry[] {
  const balls = new Map<string, BallStats>();

  for (const row of rows) {
    for (const ball of row.balls) {
      const previous = balls.get(ball.uuid);

      balls.set(
        ball.uuid,
        previous === undefined
          ? ball.stats
          : mergeBallStats(previous, ball.stats),
      );
    }
  }

  return [...balls].map(([uuid, stats]) => ({ uuid, stats }));
}

export function calculateLuckSummaries(rows: StatsRow[]): LuckStatsEntry[] {
  return calculateLuckStats(rows).map(([uuid, stats]) => ({ uuid, stats }));
}

export function calculateRatingSummaries(
  rows: StatsRow[],
  period: StatsRow[],
): RatingStatsEntry[] {
  return [...getRatingSummaries(rows, period).values()].map(
    ({ change, previous, playerUuids }) => ({
      system: change.system,
      subject: change.subject,
      uuid: change.uuid,
      epoch: change.epoch,
      playerUuids,

      rating: change.after,
      previous,
    }),
  );
}

export function calculateRatingHistory(period: StatsRow[]): RatingHistory {
  const last = period.at(-1);

  if (last === undefined) return { matchStartDates: [], series: [] };

  const series = new Map<string, RatingHistory['series'][number]>();

  for (const [index, row] of period.entries()) {
    for (const change of row.ratings) {
      if (!isCurrentRating(last, change)) continue;

      series
        .getOrInsertComputed(getRatingKey(change), () => ({
          system: change.system,
          subject: change.subject,
          subjectUuid: change.uuid,
          playerUuids: getRatingPlayers(row, change),
          points: [],
        }))
        .points.push([index, Math.round(change.after.rating * 100) / 100]);
    }
  }

  return {
    matchStartDates: period.map((row) => row.match.startDate),
    series: [...series.values()],
  };
}

export function calculateGeneralStatsSeries(
  rows: StatsRow[],
  type: StatsPeriodType,
  fields: GeneralStatsSeriesField[],
): GeneralStatsSeries {
  const keys = getStatsPeriodKeys(rows, type);
  const groups = new Map<string, StatsRow[]>(keys.map((key) => [key, []]));

  for (const row of rows) {
    const key = getStatsRowKey(row, type);

    if (key !== null) groups.get(key)?.push(row);
  }

  const stats = [...groups.values()].map(calculateGeneralSummary);

  return {
    keys,
    values: Object.fromEntries(
      fields.map((field) => [
        field,
        stats.map((entry) => entry?.[field] ?? null),
      ]),
    ),
  };
}
