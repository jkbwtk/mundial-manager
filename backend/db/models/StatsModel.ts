import {
  and,
  eq,
  getColumns,
  inArray,
  isNull,
  type SQL,
  sql,
} from 'drizzle-orm';
import type { DB, TX } from '#backend/db/database';
import { matchOrderBy } from '#backend/db/matchOrder';
import { GoalTypeModel } from '#backend/db/models/GoalTypeModel';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import { MatchModel } from '#backend/db/models/MatchModel';
import { SeasonModel } from '#backend/db/models/SeasonModel';
import {
  goalTypesTable,
  leaguesTable,
  matchesTable,
  matchTimelinesTable,
  seasonsTable,
} from '#backend/db/schema';
import { publishLeagueEvent } from '#blib/leagueEvents';
import { ConvertDrizzleErrors, NotFoundError } from '#blib/modelErrors';
import { logger } from '#shared/logger';
import { getStatsDayKey, getStatsSeason } from '#shared/stats/buckets';
import { calculateHeadToHead } from '#shared/stats/headToHead';
import { getMatchPrediction } from '#shared/stats/matchPrediction';
import {
  calculateLineupHeadToHead,
  calculateMatchPreviewPlayer,
} from '#shared/stats/matchPreview';
import { getStatsRatingState } from '#shared/stats/ratingStats';
import {
  getStatsPeriodKeys,
  getStatsPeriodRows,
} from '#shared/stats/statsPeriod';
import { calculateStatsRows, createStatsEngine } from '#shared/stats/statsRow';
import {
  calculateBallSummaries,
  calculateGeneralStatsSeries,
  calculateGeneralSummary,
  calculateLuckSummaries,
  calculatePlayerSummaries,
  calculateRatingHistory,
  calculateRatingSummaries,
  calculateTableSummaries,
} from '#shared/stats/statsSummary';
import type { HeadToHead, HeadToHeadQuery } from '#shared/types/api/headToHead';
import {
  DecidedMatchStatuses,
  EndedMatchStatuses,
} from '#shared/types/api/match';
import { SeasonConfig } from '#shared/types/api/season';
import type {
  GeneralStatsSeries,
  GeneralStatsSeriesQuery,
  MatchPrediction,
  MatchPredictionQuery,
  MatchPreview,
  PeriodMatch,
  PeriodMatchQuery,
  PeriodStats,
  PeriodStatsQuery,
  PlayerProfileStats,
  PlayerProfileStatsQuery,
  RatingHistory,
  RatingHistoryQuery,
  StatsPeriods,
  StatsPeriodsQuery,
  StatsVersion,
} from '#shared/types/api/stats';
import type {
  StatsEngine,
  StatsMatch,
  StatsPeriodRows,
  StatsRow,
} from '#shared/types/stats/statsRow';

interface StatsStoreEntry {
  version: StatsVersion;
  inputs: string;
  fingerprints: string[];

  engine: StatsEngine;
  rows: StatsRow[];
  periods: Map<string, PeriodStats>;
}

interface StatsStoreSlot {
  entry: StatsStoreEntry | null;
  building: Promise<StatsStoreEntry> | null;
  dirty: boolean;
}

type StatsVersionParts = {
  inputs: string;
  checksum: string;
};

interface StatsMatchFingerprintSource {
  uuid: string;
  $updateCounter: number;
  timelineUpdateCounter: number | null;
}

interface StatsMatches {
  matches: StatsMatch[];
  fingerprints: string[];
}

const STATS_STORE_SIZE = 8;
const STATS_PERIOD_CACHE_SIZE = 32;
const STATS_TOUCH_WAIT_MS = 500;

const StatsInputTables = [seasonsTable, goalTypesTable];

const statsTimelineJoin = and(
  eq(matchTimelinesTable.matchUuid, matchesTable.uuid),
  isNull(matchTimelinesTable.$deletedAt),
)!;

const slots = new Map<string, StatsStoreSlot>();
const pendingVersionParts = new Map<string, Promise<StatsVersionParts>>();

function getStatsMatchConditions(leagueUuid: string, filter?: SQL): SQL {
  return and(
    eq(matchesTable.leagueUuid, leagueUuid),
    inArray(matchesTable.status, EndedMatchStatuses),
    eq(matchesTable.hidden, false),
    isNull(matchesTable.$deletedAt),
    filter,
  )!;
}

function getInputsSql(leagueUuid: string): SQL {
  const tables = StatsInputTables.map(
    (table) =>
      sql`(select concat_ws(':', count(*), sum(${table.$updateCounter})) from ${table} where ${table.leagueUuid} = ${leagueUuid})`,
  );

  return sql`concat_ws('/', ${sql.join(tables, sql`, `)}, (select ${leaguesTable.$updateCounter} from ${leaguesTable} where ${leaguesTable.uuid} = ${leagueUuid}))`;
}

function getChecksumSql(leagueUuid: string): SQL {
  return sql`(select concat_ws(':', count(*), sum(${matchesTable.$updateCounter}), sum(${matchTimelinesTable.$updateCounter})) from ${matchesTable} left join ${matchTimelinesTable} on ${statsTimelineJoin} where ${getStatsMatchConditions(leagueUuid)})`;
}

function getStatsMatchFingerprint(match: StatsMatchFingerprintSource): string {
  return `${match.uuid}:${match.$updateCounter}:${match.timelineUpdateCounter}`;
}

function isStatsAppend(previous: string[], current: string[]): boolean {
  return (
    current.length > previous.length &&
    previous.every((fingerprint, index) => fingerprint === current[index])
  );
}

function getStatsSlot(leagueUuid: string): StatsStoreSlot {
  const slot = slots.get(leagueUuid) ?? {
    entry: null,
    building: null,
    dirty: false,
  };

  slots.delete(leagueUuid);
  slots.set(leagueUuid, slot);

  for (const key of slots.keys()) {
    if (slots.size <= STATS_STORE_SIZE) break;

    slots.delete(key);
  }

  return slot;
}

function getMatchPeriodRows(
  rows: StatsRow[],
  period: StatsPeriodRows,
): StatsRow[] {
  const row = period.rows[0];

  if (row === undefined || row.day === null) return period.rows;

  return rows.filter(
    (candidate) => candidate.day === row.day && candidate.index <= row.index,
  );
}

function getHeadToHeadMatches(
  rows: StatsRow[],
): Parameters<typeof calculateHeadToHead>[0] {
  return rows.flatMap((row) =>
    DecidedMatchStatuses.includes(row.match.status)
      ? [{ ...row.match, winningSide: row.winningSide }]
      : [],
  );
}

function getMostMatches(
  rows: StatsRow[],
  playerUuid: string,
  getKey: (row: StatsRow) => string | null,
): number {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const key = getKey(row);
    const isPlaying = row.players.some(
      (player) => player.uuid === playerUuid && player.side !== null,
    );

    if (key === null || !isPlaying) continue;

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Math.max(0, ...counts.values());
}

// biome-ignore lint/complexity/noStaticOnlyClass: yeah
export class StatsModel {
  @ConvertDrizzleErrors()
  protected static async getVersionParts(
    db: DB | TX,
    leagueUuid: string,
  ): Promise<StatsVersionParts> {
    const result = await db.execute<StatsVersionParts>(
      sql`select ${getInputsSql(leagueUuid)} as inputs, ${getChecksumSql(leagueUuid)} as checksum`,
    );

    return result.rows[0]!;
  }

  protected static getCurrentVersionParts(
    db: DB,
    leagueUuid: string,
  ): Promise<StatsVersionParts> {
    const pending = pendingVersionParts.get(leagueUuid);

    if (pending !== undefined) return pending;

    const parts = this.getVersionParts(db, leagueUuid).finally(() =>
      pendingVersionParts.delete(leagueUuid),
    );

    pendingVersionParts.set(leagueUuid, parts);

    return parts;
  }

  @ConvertDrizzleErrors()
  protected static async getStatsMatchFingerprints(
    db: DB | TX,
    leagueUuid: string,
  ): Promise<{ uuid: string; fingerprint: string }[]> {
    const instances = await db
      .select({
        uuid: matchesTable.uuid,
        $updateCounter: matchesTable.$updateCounter,
        timelineUpdateCounter: matchTimelinesTable.$updateCounter,
      })
      .from(matchesTable)
      .leftJoin(matchTimelinesTable, statsTimelineJoin)
      .where(getStatsMatchConditions(leagueUuid))
      .orderBy(...matchOrderBy()(matchesTable));

    return instances.map((instance) => ({
      uuid: instance.uuid,
      fingerprint: getStatsMatchFingerprint(instance),
    }));
  }

  @ConvertDrizzleErrors()
  protected static async getStatsMatches(
    db: DB | TX,
    leagueUuid: string,
    uuids: string[] | null,
  ): Promise<StatsMatches> {
    const instances = await db
      .select({
        ...getColumns(matchesTable),
        events: matchTimelinesTable.events,
        timelineUpdateCounter: matchTimelinesTable.$updateCounter,
      })
      .from(matchesTable)
      .leftJoin(matchTimelinesTable, statsTimelineJoin)
      .where(
        getStatsMatchConditions(
          leagueUuid,
          uuids === null ? undefined : inArray(matchesTable.uuid, uuids),
        ),
      )
      .orderBy(...matchOrderBy()(matchesTable));

    return {
      matches: instances.map(
        ({ timelineUpdateCounter: _counter, ...instance }): StatsMatch => ({
          ...instance,
          events: instance.events ?? [],
        }),
      ),
      fingerprints: instances.map(getStatsMatchFingerprint),
    };
  }

  @ConvertDrizzleErrors()
  protected static async createEntry(
    db: DB | TX,
    leagueUuid: string,
    parts: StatsVersionParts,
  ): Promise<StatsStoreEntry> {
    const league = await LeagueModel.getByIdOrThrow(db, leagueUuid);
    const seasons = await SeasonModel.getAll(db, leagueUuid);
    const goalTypes = await GoalTypeModel.getAll(db, leagueUuid);
    const { matches, fingerprints } = await this.getStatsMatches(
      db,
      leagueUuid,
      null,
    );

    const engine = createStatsEngine({
      timeZone: league.instance.timezone,
      seasons: seasons.map((season) => ({
        ...season,
        config: SeasonConfig.parse(season.config),
      })),
      goalTypes,
    });

    return {
      version: `${parts.inputs}/${parts.checksum}`,
      inputs: parts.inputs,
      fingerprints,

      engine,
      rows: calculateStatsRows(engine, matches),
      periods: new Map(),
    };
  }

  @ConvertDrizzleErrors()
  protected static async buildEntry(
    db: DB,
    leagueUuid: string,
    previous: StatsStoreEntry | null,
  ): Promise<StatsStoreEntry> {
    return db.transaction(
      async (tx) => {
        const parts = await this.getVersionParts(tx, leagueUuid);
        const version = `${parts.inputs}/${parts.checksum}`;

        if (version === previous?.version) return previous;

        if (previous === null || parts.inputs !== previous.inputs) {
          return this.createEntry(tx, leagueUuid, parts);
        }

        const current = await this.getStatsMatchFingerprints(tx, leagueUuid);

        if (
          !isStatsAppend(
            previous.fingerprints,
            current.map(({ fingerprint }) => fingerprint),
          )
        ) {
          return this.createEntry(tx, leagueUuid, parts);
        }

        const { matches, fingerprints } = await this.getStatsMatches(
          tx,
          leagueUuid,
          current.slice(previous.fingerprints.length).map(({ uuid }) => uuid),
        );

        return {
          ...previous,
          version,
          fingerprints: [...previous.fingerprints, ...fingerprints],
          rows: [
            ...previous.rows,
            ...calculateStatsRows(previous.engine, matches),
          ],
          periods: new Map(),
        };
      },
      { isolationLevel: 'repeatable read', accessMode: 'read only' },
    );
  }

  protected static async rebuild(
    db: DB,
    leagueUuid: string,
    slot: StatsStoreSlot,
  ): Promise<StatsStoreEntry> {
    try {
      const entry = await this.buildEntry(db, leagueUuid, slot.entry);

      if (entry.version !== slot.entry?.version) {
        slot.entry = entry;
        publishLeagueEvent(leagueUuid, {
          topic: 'STATS',
          version: entry.version,
        });
      }

      return entry;
    } finally {
      slot.building = null;

      if (slot.dirty) {
        slot.dirty = false;
        this.touch(db, leagueUuid);
      }
    }
  }

  public static touch(db: DB, leagueUuid: string): Promise<StatsStoreEntry> {
    const slot = getStatsSlot(leagueUuid);

    if (slot.building !== null) {
      slot.dirty = true;

      return slot.building;
    }

    slot.building = this.rebuild(db, leagueUuid, slot);
    slot.building.catch((err) => {
      logger.error('Failed to calculate stats of league %s', leagueUuid, {
        label: ['StatsModel', 'touch'],
        error: err,
      });
    });

    return slot.building;
  }

  public static async touchAfterWrite(
    db: DB,
    leagueUuid: string,
  ): Promise<void> {
    await Promise.race([
      this.touch(db, leagueUuid).catch(() => null),
      new Promise((resolve) => setTimeout(resolve, STATS_TOUCH_WAIT_MS)),
    ]);
  }

  @ConvertDrizzleErrors()
  protected static async getEntry(
    db: DB,
    leagueUuid: string,
  ): Promise<StatsStoreEntry> {
    const slot = getStatsSlot(leagueUuid);

    if (slot.entry === null) return this.touch(db, leagueUuid);

    const { inputs, checksum } = await this.getCurrentVersionParts(
      db,
      leagueUuid,
    );

    if (`${inputs}/${checksum}` !== slot.entry.version) {
      this.touch(db, leagueUuid);
    }

    return slot.entry;
  }

  protected static async getRows(
    db: DB,
    leagueUuid: string,
  ): Promise<StatsRow[]> {
    return (await this.getEntry(db, leagueUuid)).rows;
  }

  public static async getVersion(
    db: DB,
    leagueUuid: string,
  ): Promise<StatsVersion> {
    const slot = getStatsSlot(leagueUuid);

    return (slot.entry ?? (await this.touch(db, leagueUuid))).version;
  }

  public static async getPeriods(
    db: DB,
    leagueUuid: string,
    query: StatsPeriodsQuery,
  ): Promise<StatsPeriods> {
    const rows = await this.getRows(db, leagueUuid);

    return { type: query.type, keys: getStatsPeriodKeys(rows, query.type) };
  }

  public static async getPeriodStats(
    db: DB,
    leagueUuid: string,
    query: PeriodStatsQuery,
  ): Promise<PeriodStats> {
    const { rows, periods } = await this.getEntry(db, leagueUuid);
    const key = JSON.stringify(query.period);
    const cached = periods.get(key);

    if (cached !== undefined) return cached;

    const period = getStatsPeriodRows(rows, query.period);

    if (period === null) {
      throw new NotFoundError('Stats period not found', ['period']);
    }

    const stats: PeriodStats = {
      period: {
        key: period.key,
        day: period.rows.at(-1)?.day ?? null,
        index: period.index,
        count: period.count,
      },

      general: calculateGeneralSummary(
        query.period?.type === 'MATCH'
          ? getMatchPeriodRows(rows, period)
          : period.rows,
      ),
      players: calculatePlayerSummaries(period.rows),
      tables: calculateTableSummaries(period.rows),
      balls: calculateBallSummaries(period.rows),
      ratings: calculateRatingSummaries(rows, period.rows),
      luck: calculateLuckSummaries(period.rows),
    };

    if (periods.size >= STATS_PERIOD_CACHE_SIZE) periods.clear();

    periods.set(key, stats);

    return stats;
  }

  @ConvertDrizzleErrors()
  public static async getPeriodMatch(
    db: DB,
    leagueUuid: string,
    query: PeriodMatchQuery,
  ): Promise<PeriodMatch | null> {
    const rows = await this.getRows(db, leagueUuid);
    const period = getStatsPeriodRows(rows, query.period);
    const row = period?.rows.at(-1 - query.offset);

    if (period === null || row === undefined) return null;

    return {
      timeline: await MatchModel.getTimeline(db, leagueUuid, row.match.uuid),
      index: query.offset,
      total: period.rows.length,
    };
  }

  @ConvertDrizzleErrors()
  public static async getPlayerProfileStats(
    db: DB,
    leagueUuid: string,
    query: PlayerProfileStatsQuery,
  ): Promise<PlayerProfileStats> {
    const [rows, league, seasons] = await Promise.all([
      this.getRows(db, leagueUuid),
      LeagueModel.getById(db, leagueUuid),
      SeasonModel.getAll(db, leagueUuid),
    ]);

    const now = new Date();
    const today = getStatsDayKey(now, league?.instance.timezone ?? 'UTC');
    const season = getStatsSeason({ startDate: now, labels: {} }, seasons);
    const { playerUuid } = query;

    const lastMatch = rows.findLast((row) =>
      row.players.some(
        (player) => player.uuid === playerUuid && player.side !== null,
      ),
    );

    const getStats = (filter: (row: StatsRow) => boolean) =>
      calculatePlayerSummaries(rows.filter(filter), playerUuid).at(0)?.stats ??
      null;

    return {
      all: getStats(() => true),
      today: getStats((row) => row.day === today),
      season: getStats((row) => row.seasonKey === season?.uuid),

      mostMatchesInSeason: getMostMatches(
        rows,
        playerUuid,
        (row) => row.seasonKey,
      ),
      lastMatchDate: lastMatch?.match.startDate ?? null,

      ratings: calculateRatingSummaries(rows, rows).filter(
        (entry) => entry.uuid === playerUuid,
      ),
      headToHead: calculateHeadToHead(getHeadToHeadMatches(rows), playerUuid),
    };
  }

  public static async getHeadToHead(
    db: DB,
    leagueUuid: string,
    query: HeadToHeadQuery,
  ): Promise<HeadToHead[]> {
    const rows = await this.getRows(db, leagueUuid);
    const isInRange = (startDate: Date | null) =>
      startDate !== null &&
      (query.from === undefined || startDate >= query.from) &&
      (query.to === undefined || startDate <= query.to);

    return calculateHeadToHead(
      getHeadToHeadMatches(
        rows.filter(({ match }) => isInRange(match.startDate)),
      ),
      query.playerUuid,
    );
  }

  public static async getMatchPrediction(
    db: DB,
    leagueUuid: string,
    query: MatchPredictionQuery,
  ): Promise<MatchPrediction | null> {
    const { engine } = await this.getEntry(db, leagueUuid);

    return getMatchPrediction(engine, query, new Date());
  }

  public static async getMatchPreview(
    db: DB,
    leagueUuid: string,
    query: MatchPredictionQuery,
  ): Promise<MatchPreview> {
    const { engine, rows } = await this.getEntry(db, leagueUuid);
    const elo = getStatsRatingState(
      engine,
      'ELO',
      'HYBRID',
      engine.ratingEpoch,
    );

    return {
      prediction: getMatchPrediction(engine, query, new Date()),
      headToHead: calculateLineupHeadToHead(rows, query),
      players: [...query.playersSide1, ...query.playersSide2].map((uuid) =>
        calculateMatchPreviewPlayer(
          rows,
          uuid,
          elo?.ratings.get(uuid)?.rating ?? null,
        ),
      ),
    };
  }

  public static async getGeneralStatsSeries(
    db: DB,
    leagueUuid: string,
    query: GeneralStatsSeriesQuery,
  ): Promise<GeneralStatsSeries> {
    const rows = await this.getRows(db, leagueUuid);

    return calculateGeneralStatsSeries(rows, query.type, query.fields);
  }

  public static async getRatingHistory(
    db: DB,
    leagueUuid: string,
    query: RatingHistoryQuery,
  ): Promise<RatingHistory> {
    const rows = await this.getRows(db, leagueUuid);
    const period = getStatsPeriodRows(rows, query.period);

    return calculateRatingHistory(period?.rows ?? []);
  }
}
