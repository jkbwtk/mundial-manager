import { query } from '@solidjs/router';
import { type Accessor, createMemo } from 'solid-js';
import {
  type EntityLookup,
  usePlayerLookup,
  useSeasonLookup,
} from '#flib/entityLookup';
import { createResilientAsync } from '#flib/resilientAsync';
import { queryPeriodStats, queryStatsPeriods } from '#flib/trpcCalls';
import type { Player } from '#shared/types/api/player';
import type { Season } from '#shared/types/api/season';
import type { PeriodStats } from '#shared/types/api/stats';
import type { AggregateStats } from '#shared/types/stats/generalStats';
import type { PlayerStats } from '#shared/types/stats/playerStats';

export interface SeasonStanding {
  playerUuid: string;

  rating: number;
  ratingChange: number;

  stats: PlayerStats | null;
}

interface SeasonSummary {
  keys: string[];
  index: number;

  current: PeriodStats | null;
  previous: PeriodStats | null;
}

export interface SeasonSummaryData {
  keys: Accessor<string[]>;
  index: Accessor<number>;

  season: Accessor<Season | null>;
  players: EntityLookup<Player>;

  stats: Accessor<AggregateStats | null>;
  standings: Accessor<SeasonStanding[]>;
  playerStats: Accessor<[playerUuid: string, stats: PlayerStats][]>;
  pending: Accessor<boolean>;
}

function getSeasonStats(key: string | undefined): Promise<PeriodStats | null> {
  return key === undefined
    ? Promise.resolve(null)
    : queryPeriodStats({ type: 'SEASON', key });
}

const querySeasonSummary = query(
  async (selected: string | null): Promise<SeasonSummary> => {
    const { keys } = await queryStatsPeriods('SEASON');
    const index = selected === null ? keys.length - 1 : keys.indexOf(selected);
    const [current, previous] = await Promise.all([
      getSeasonStats(keys[index]),
      getSeasonStats(keys[index - 1]),
    ]);

    return { keys, index, current, previous };
  },
  'querySeasonSummary',
);

function getSeasonRatings(stats: PeriodStats | null | undefined) {
  return (stats?.ratings ?? []).filter(
    (entry) => entry.system === 'ELO' && entry.subject === 'HYBRID',
  );
}

export function createSeasonSummaryData(
  selected: Accessor<string | null>,
): SeasonSummaryData {
  const seasons = useSeasonLookup();
  const players = usePlayerLookup();

  const summary = createResilientAsync(selected, querySeasonSummary);

  const keys = () => summary.latest?.keys ?? [];
  const index = () => summary.latest?.index ?? -1;

  const season = () => {
    const uuid = keys()[index()];

    return uuid === undefined ? null : seasons.get(uuid);
  };

  const playerStats = createMemo(() =>
    (summary.latest?.current?.players ?? []).map(
      (entry): [string, PlayerStats] => [entry.uuid, entry.stats],
    ),
  );

  const standings = createMemo((): SeasonStanding[] => {
    const previousRatings = new Map(
      getSeasonRatings(summary.latest?.previous).map((entry) => [
        entry.uuid,
        entry.rating.rating,
      ]),
    );
    const stats = new Map(playerStats());

    return getSeasonRatings(summary.latest?.current)
      .toSorted((a, b) => b.rating.rating - a.rating.rating)
      .map((entry) => ({
        playerUuid: entry.uuid,

        rating: entry.rating.rating,
        ratingChange:
          entry.rating.rating -
          (previousRatings.get(entry.uuid) ?? entry.previous.rating),

        stats: stats.get(entry.uuid) ?? null,
      }));
  });

  return {
    keys,
    index,

    season,
    players,
    stats: () => summary.latest?.current?.general ?? null,
    standings,
    playerStats,
    pending: summary.pending,
  };
}
