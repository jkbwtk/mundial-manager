import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  lte,
  or,
  type SQL,
  sql,
} from 'drizzle-orm';
import type { DB, TX } from '#backend/db/database';
import {
  isMatchAfter,
  isMatchAtOrAfter,
  type MatchLike,
  matchOrderBy,
} from '#backend/db/matchOrder';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import { MatchModel } from '#backend/db/models/MatchModel';
import { SeasonModel } from '#backend/db/models/SeasonModel';
import { matchesTable, statsFramesTable } from '#backend/db/schema';
import type { StatsInvalidation } from '#backend/types/statsInvalidation';
import { ConvertDrizzleErrors, NotFoundError } from '#blib/modelErrors';
import { ALL_BUCKET_KEY, getStatsDayKey } from '#shared/stats/buckets';
import { getRatingBucket, parseRatingBucket } from '#shared/stats/ratingStats';
import {
  calculateStatsFrame,
  createStatsEngine,
  getStatsResumeFilters,
  isStatsContextCurrent,
  restoreStatsEngine,
} from '#shared/stats/statsEngine';
import { MatchStatusEnum } from '#shared/types/api/match';
import { MatchEvent } from '#shared/types/api/matchEvent';
import { SeasonConfig } from '#shared/types/api/season';
import {
  GeneralStatsFrame,
  type GeneralStatsFramePaginated,
  type GeneralStatsQuery,
  PlayerStatsFrame,
  type PlayerStatsFramePaginated,
  type PlayerStatsQuery,
  RatingStatsFrame,
  type RatingStatsFramePaginated,
  type RatingStatsQuery,
} from '#shared/types/api/statsFrame';
import type { StatsSeason } from '#shared/types/stats/bucket';
import {
  StatsContext,
  type StatsEngine,
  type StatsMatch,
} from '#shared/types/stats/statsEngine';
import {
  STATS_CONTEXT_MODULE,
  type StatsFrameEntry,
} from '#shared/types/stats/statsFrame';
import {
  type StatsModuleId,
  StatsModuleIds,
} from '#shared/types/stats/statsModule';
import { getChunks } from '#shared/utils';

interface StatsFrameFilter {
  module: StatsModuleId;
  buckets: string[];
  bucketKeys?: string[];
  subjects?: string[];
  from?: Date;
  to?: Date;

  history: boolean;
  pagination?: { limit: number; offset: number };
  sorting?: { field: string; direction: 'asc' | 'desc' };
}

interface StatsRestorePoint {
  engine: StatsEngine;
  match: MatchLike;
}

const STATS_LOCK_NAMESPACE = 8412;
const INSERT_CHUNK_SIZE = 1000;
const DEFAULT_LIMIT = 1000;

const StatsMatchStatuses = [MatchStatusEnum.FINISHED, MatchStatusEnum.CANCELED];

const FrameColumns = {
  seq: statsFramesTable.seq,
  matchUuid: statsFramesTable.matchUuid,
  matchStartDate: statsFramesTable.matchStartDate,
  day: statsFramesTable.day,
  bucket: statsFramesTable.bucket,
  bucketKey: statsFramesTable.bucketKey,
  subject: statsFramesTable.subject,
  payload: statsFramesTable.payload,
};

function getEarliestSeq(next: number, sequences: (number | null)[]): number {
  return Math.min(next, ...sequences.filter((seq) => seq !== null));
}

function getFrameConditions(
  leagueUuid: string,
  filter: StatsFrameFilter,
): SQL | undefined {
  return and(
    eq(statsFramesTable.leagueUuid, leagueUuid),
    eq(statsFramesTable.module, filter.module),
    inArray(statsFramesTable.bucket, filter.buckets),
    filter.bucketKeys && inArray(statsFramesTable.bucketKey, filter.bucketKeys),
    filter.subjects && inArray(statsFramesTable.subject, filter.subjects),
    filter.from && gte(statsFramesTable.matchStartDate, filter.from),
    filter.to && lte(statsFramesTable.matchStartDate, filter.to),
  );
}

function getAllBucketConditions(leagueUuid: string): SQL | undefined {
  return and(
    eq(statsFramesTable.leagueUuid, leagueUuid),
    eq(statsFramesTable.module, 'GENERAL'),
    eq(statsFramesTable.bucket, 'ALL'),
    eq(statsFramesTable.bucketKey, ALL_BUCKET_KEY),
    eq(statsFramesTable.subject, ''),
  );
}

// biome-ignore lint/complexity/noStaticOnlyClass: yeah
export class StatsFrameModel {
  @ConvertDrizzleErrors()
  protected static async lock(tx: TX, leagueUuid: string): Promise<void> {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${STATS_LOCK_NAMESPACE}, hashtext(${leagueUuid}))`,
    );
  }

  @ConvertDrizzleErrors()
  protected static async getNextSeq(
    db: DB | TX,
    leagueUuid: string,
  ): Promise<number> {
    const [frame] = await db
      .select({ seq: statsFramesTable.seq })
      .from(statsFramesTable)
      .where(eq(statsFramesTable.leagueUuid, leagueUuid))
      .orderBy(desc(statsFramesTable.seq))
      .limit(1);

    return (frame?.seq ?? -1) + 1;
  }

  @ConvertDrizzleErrors()
  protected static async getFirstSeq(
    db: DB | TX,
    leagueUuid: string,
    where: SQL | undefined,
  ): Promise<number | null> {
    const [frame] = await db
      .select({ seq: statsFramesTable.seq })
      .from(statsFramesTable)
      .innerJoin(
        matchesTable,
        eq(matchesTable.uuid, statsFramesTable.matchUuid),
      )
      .where(
        and(
          eq(statsFramesTable.leagueUuid, leagueUuid),
          eq(statsFramesTable.module, STATS_CONTEXT_MODULE),
          where,
        ),
      )
      .orderBy(asc(statsFramesTable.seq))
      .limit(1);

    return frame?.seq ?? null;
  }

  @ConvertDrizzleErrors()
  protected static async getInvalidationSeq(
    db: DB | TX,
    leagueUuid: string,
    invalidation: StatsInvalidation,
  ): Promise<number> {
    const next = await this.getNextSeq(db, leagueUuid);

    switch (invalidation.source) {
      case 'MATCH': {
        const match = await MatchModel.getById(
          db,
          leagueUuid,
          invalidation.uuid,
        );

        return getEarliestSeq(next, [
          await this.getFirstSeq(
            db,
            leagueUuid,
            eq(statsFramesTable.matchUuid, invalidation.uuid),
          ),
          match
            ? await this.getFirstSeq(
                db,
                leagueUuid,
                isMatchAtOrAfter(match)(matchesTable),
              )
            : null,
        ]);
      }

      case 'SEASON': {
        const season = await SeasonModel.getById(
          db,
          leagueUuid,
          invalidation.uuid,
        );
        const [frame] = await db
          .select({ seq: statsFramesTable.seq })
          .from(statsFramesTable)
          .where(
            and(
              eq(statsFramesTable.leagueUuid, leagueUuid),
              eq(statsFramesTable.module, 'GENERAL'),
              eq(statsFramesTable.bucket, 'SEASON'),
              eq(statsFramesTable.bucketKey, invalidation.uuid),
            ),
          )
          .orderBy(asc(statsFramesTable.seq))
          .limit(1);

        return getEarliestSeq(next, [
          frame?.seq ?? null,
          season
            ? await this.getFirstSeq(
                db,
                leagueUuid,
                gte(statsFramesTable.matchStartDate, season.startDate),
              )
            : null,
        ]);
      }

      case 'LEAGUE':
        return next;
    }
  }

  @ConvertDrizzleErrors()
  protected static async getStatsMatches(
    db: DB | TX,
    leagueUuid: string,
    where: { after?: MatchLike } = {},
  ): Promise<StatsMatch[]> {
    const instances = await db.query.matchesTable.findMany({
      where: {
        leagueUuid,
        status: {
          in: StatsMatchStatuses,
        },
        $deletedAt: {
          isNull: true,
        },
        ...(where.after === undefined
          ? {}
          : { RAW: isMatchAfter(where.after) }),
      },

      with: {
        timeline: {
          where: {
            $deletedAt: {
              isNull: true,
            },
          },
        },
      },

      orderBy: matchOrderBy(),
    });

    return instances.map(({ timeline, ...instance }) => ({
      ...instance,
      events: MatchEvent.array().parse(timeline?.events ?? []),
    }));
  }

  @ConvertDrizzleErrors()
  protected static async getStatsSeasons(
    db: DB | TX,
    leagueUuid: string,
  ): Promise<StatsSeason[]> {
    const instances = await db.query.seasonsTable.findMany({
      where: {
        leagueUuid,
        $deletedAt: {
          isNull: true,
        },
      },
      columns: {
        uuid: true,
        startDate: true,
        endDate: true,
        config: true,
      },
    });

    return instances.map((season) => ({
      ...season,
      config: SeasonConfig.parse(season.config),
    }));
  }

  @ConvertDrizzleErrors()
  protected static async getContext(
    db: DB | TX,
    leagueUuid: string,
    seq?: number,
  ) {
    const [frame] = await db
      .select({
        seq: statsFramesTable.seq,
        matchUuid: statsFramesTable.matchUuid,
        payload: statsFramesTable.payload,
      })
      .from(statsFramesTable)
      .where(
        and(
          eq(statsFramesTable.leagueUuid, leagueUuid),
          eq(statsFramesTable.module, STATS_CONTEXT_MODULE),
          seq === undefined ? undefined : eq(statsFramesTable.seq, seq),
        ),
      )
      .orderBy(desc(statsFramesTable.seq))
      .limit(1);

    const context = StatsContext.safeParse(frame?.payload);

    if (frame === undefined || !context.success) return null;

    return { matchUuid: frame.matchUuid, context: context.data };
  }

  @ConvertDrizzleErrors()
  protected static async restoreEngine(
    db: DB | TX,
    leagueUuid: string,
    timeZone: string,
    seq: number,
  ): Promise<StatsRestorePoint | null> {
    const frame = await this.getContext(db, leagueUuid, seq);

    if (frame === null || !isStatsContextCurrent(frame.context, timeZone)) {
      return null;
    }

    const match = await MatchModel.getById(db, leagueUuid, frame.matchUuid);

    if (match === null) return null;

    const filters = getStatsResumeFilters(frame.context);
    const conditions = StatsModuleIds.flatMap((module) =>
      filters[module].map((filter) =>
        and(
          eq(statsFramesTable.module, module),
          eq(statsFramesTable.bucket, filter.bucket),
          eq(statsFramesTable.bucketKey, filter.bucketKey),
        ),
      ),
    );

    const entries =
      conditions.length === 0
        ? []
        : await db
            .selectDistinctOn(
              [
                statsFramesTable.module,
                statsFramesTable.bucket,
                statsFramesTable.bucketKey,
                statsFramesTable.subject,
              ],
              {
                module: statsFramesTable.module,
                bucket: statsFramesTable.bucket,
                bucketKey: statsFramesTable.bucketKey,
                subject: statsFramesTable.subject,
                payload: statsFramesTable.payload,
              },
            )
            .from(statsFramesTable)
            .where(
              and(
                eq(statsFramesTable.leagueUuid, leagueUuid),
                lte(statsFramesTable.seq, seq),
                or(...conditions),
              ),
            )
            .orderBy(
              statsFramesTable.module,
              statsFramesTable.bucket,
              statsFramesTable.bucketKey,
              statsFramesTable.subject,
              desc(statsFramesTable.seq),
            );

    const engine = restoreStatsEngine(frame.context, entries);

    return engine === null ? null : { engine, match };
  }

  @ConvertDrizzleErrors()
  protected static async getRestoreSeq(
    db: DB | TX,
    leagueUuid: string,
    before: number,
  ): Promise<number | null> {
    const [frame] = await db
      .select({ seq: statsFramesTable.seq })
      .from(statsFramesTable)
      .where(
        and(
          getAllBucketConditions(leagueUuid),
          lt(statsFramesTable.seq, before),
        ),
      )
      .orderBy(desc(statsFramesTable.seq))
      .limit(1);

    return frame?.seq ?? null;
  }

  @ConvertDrizzleErrors()
  protected static async insertFrames(
    tx: TX,
    leagueUuid: string,
    engine: StatsEngine,
    matches: StatsMatch[],
    seasons: StatsSeason[],
  ): Promise<void> {
    const frames = matches.flatMap((match) => {
      const entries: StatsFrameEntry[] = calculateStatsFrame(
        engine,
        match,
        seasons,
      );
      const { seq, timezone } = engine.context;
      const day = match.startDate
        ? getStatsDayKey(match.startDate, timezone)
        : null;

      return entries.map((entry) => ({
        ...entry,
        leagueUuid,
        matchUuid: match.uuid,
        seq,
        day,
        matchStartDate: match.startDate,
      }));
    });

    for (const chunk of getChunks(frames, INSERT_CHUNK_SIZE)) {
      await tx.insert(statsFramesTable).values(chunk).onConflictDoNothing();
    }
  }

  @ConvertDrizzleErrors()
  public static async recalculate(
    db: DB | TX,
    leagueUuid: string,
    invalidation: StatsInvalidation | null,
  ): Promise<number> {
    return db.transaction(async (tx) => {
      await this.lock(tx, leagueUuid);

      const league = await LeagueModel.getById(tx, leagueUuid);

      if (league === null) {
        throw new NotFoundError('League not found', ['uuid']);
      }

      const timeZone = league.instance.timezone;
      const seasons = await this.getStatsSeasons(tx, leagueUuid);

      const before =
        invalidation === null
          ? 0
          : await this.getInvalidationSeq(tx, leagueUuid, invalidation);
      const restoreSeq = await this.getRestoreSeq(tx, leagueUuid, before);
      const restored =
        restoreSeq === null
          ? null
          : await this.restoreEngine(tx, leagueUuid, timeZone, restoreSeq);
      const engine = restored?.engine ?? createStatsEngine(timeZone);

      await tx
        .delete(statsFramesTable)
        .where(
          and(
            eq(statsFramesTable.leagueUuid, leagueUuid),
            gt(statsFramesTable.seq, engine.context.seq),
          ),
        );

      const matches = await this.getStatsMatches(tx, leagueUuid, {
        after: restored?.match,
      });

      await this.insertFrames(tx, leagueUuid, engine, matches, seasons);

      return matches.length;
    });
  }

  @ConvertDrizzleErrors()
  public static async getStaleLeagueUuids(db: DB | TX): Promise<string[]> {
    const [leagues, frames] = await Promise.all([
      LeagueModel.getAll(db),
      db
        .selectDistinctOn([statsFramesTable.leagueUuid], {
          leagueUuid: statsFramesTable.leagueUuid,
          payload: statsFramesTable.payload,
        })
        .from(statsFramesTable)
        .where(eq(statsFramesTable.module, STATS_CONTEXT_MODULE))
        .orderBy(statsFramesTable.leagueUuid, desc(statsFramesTable.seq)),
    ]);

    const contexts = new Map(
      frames.map((frame) => [frame.leagueUuid, frame.payload]),
    );

    return leagues.flatMap((league) => {
      const context = StatsContext.safeParse(contexts.get(league.uuid));

      if (
        context.success &&
        isStatsContextCurrent(context.data, league.instance.timezone)
      ) {
        return [];
      }

      return [league.uuid];
    });
  }

  @ConvertDrizzleErrors()
  protected static async getFrames(
    db: DB | TX,
    leagueUuid: string,
    filter: StatsFrameFilter,
  ) {
    const where = getFrameConditions(leagueUuid, filter);
    const pagination = filter.pagination ?? { limit: DEFAULT_LIMIT, offset: 0 };
    const field = filter.sorting?.field ?? 'date';
    const direction =
      filter.sorting?.direction ?? (filter.history ? 'asc' : 'desc');
    const order = direction === 'asc' ? asc : desc;

    const source = filter.history
      ? db.select(FrameColumns).from(statsFramesTable).where(where).as('frames')
      : db
          .selectDistinctOn(
            [
              statsFramesTable.bucket,
              statsFramesTable.bucketKey,
              statsFramesTable.subject,
            ],
            FrameColumns,
          )
          .from(statsFramesTable)
          .where(where)
          .orderBy(
            statsFramesTable.bucket,
            statsFramesTable.bucketKey,
            statsFramesTable.subject,
            desc(statsFramesTable.seq),
          )
          .as('frames');

    const [data, [total]] = await Promise.all([
      db
        .select({
          matchUuid: source.matchUuid,
          matchStartDate: source.matchStartDate,
          day: source.day,
          bucket: source.bucket,
          bucketKey: source.bucketKey,
          subject: source.subject,
          payload: source.payload,
        })
        .from(source)
        .orderBy(
          field === 'date'
            ? order(source.seq)
            : order(sql`(${source.payload} ->> ${field})::double precision`),
          order(source.seq),
          asc(source.subject),
        )
        .limit(pagination.limit)
        .offset(pagination.offset),
      db.select({ total: count() }).from(source),
    ]);

    return { data, total: total?.total ?? 0 };
  }

  @ConvertDrizzleErrors()
  public static async getGeneral(
    db: DB | TX,
    leagueUuid: string,
    query: GeneralStatsQuery,
  ): Promise<GeneralStatsFramePaginated> {
    const { data, total } = await this.getFrames(db, leagueUuid, {
      ...query,
      module: 'GENERAL',
      buckets: [query.bucket],
    });

    return {
      data: GeneralStatsFrame.array().parse(
        data.map(({ subject: _subject, payload, ...frame }) => ({
          ...frame,
          stats: payload,
        })),
      ),
      total,
    };
  }

  @ConvertDrizzleErrors()
  public static async getPlayers(
    db: DB | TX,
    leagueUuid: string,
    query: PlayerStatsQuery,
  ): Promise<PlayerStatsFramePaginated> {
    const { data, total } = await this.getFrames(db, leagueUuid, {
      ...query,
      module: 'PLAYERS',
      buckets: [query.bucket],
      subjects: query.players,
    });

    return {
      data: PlayerStatsFrame.array().parse(
        data.map(({ subject, payload, ...frame }) => ({
          ...frame,
          playerUuid: subject,
          stats: payload,
        })),
      ),
      total,
    };
  }

  @ConvertDrizzleErrors()
  public static async getRatings(
    db: DB | TX,
    leagueUuid: string,
    query: RatingStatsQuery,
  ): Promise<RatingStatsFramePaginated> {
    const epoch =
      query.epoch ??
      (query.history
        ? undefined
        : (await this.getContext(db, leagueUuid))?.context.ratingEpoch);

    const { data, total } = await this.getFrames(db, leagueUuid, {
      ...query,
      module: 'RATINGS',
      buckets: [getRatingBucket(query.system, query.subject)],
      bucketKeys: epoch === undefined ? undefined : [epoch],
      subjects: query.subjectUuids,
    });

    return {
      data: RatingStatsFrame.array().parse(
        data.map(({ bucket, bucketKey, subject, payload, ...frame }) => {
          const [system, ratingSubject] = parseRatingBucket(bucket) ?? [];

          return {
            ...frame,
            system,
            subject: ratingSubject,
            epoch: bucketKey,
            subjectUuid: subject,
            rating: payload,
          };
        }),
      ),
      total,
    };
  }
}
