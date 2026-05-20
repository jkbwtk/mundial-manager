import { and, count, eq, isNull } from 'drizzle-orm';
import type { DB, TX } from '#backend/db/database';
import { Model } from '#backend/db/models/Model';
import { seasonsTable } from '#backend/db/schema';
import type { SeasonSelectSchema } from '#backend/types/db/season';
import {
  ConvertDrizzleErrors,
  DatabaseError,
  NotFoundError,
  StrategyValidationError,
} from '#blib/modelErrors';
import {
  Season,
  type SeasonCreate,
  type SeasonStrategy,
  type SeasonUpdate,
} from '#shared/types/api/season';

export class SeasonModel extends Model<SeasonSelectSchema, typeof Season> {
  protected publicSchema = Season;

  @ConvertDrizzleErrors()
  public static async create(db: DB, leagueUuid: string, data: SeasonCreate) {
    for (const strategy of Object.values(SeasonModel.validationStrategies)) {
      await strategy(db, leagueUuid, data);
    }

    const [season] = await db
      .insert(seasonsTable)
      .values({ ...data, leagueUuid })
      .returning();

    if (!season) {
      throw new DatabaseError('Failed to create season', {});
    }

    return new SeasonModel(db, season);
  }

  @ConvertDrizzleErrors()
  public static async update(db: DB, leagueUuid: string, data: SeasonUpdate) {
    const { uuid, ...updateData } = data;

    const season = await db.transaction(async (tx) => {
      const existingSeason = await SeasonModel._getById(tx, leagueUuid, uuid);
      if (!existingSeason) {
        throw new NotFoundError('Season not found for update', {
          uuid: { value: uuid, errorType: 'Season not found' },
        });
      }

      const mergedData: SeasonStrategy = {
        ...existingSeason,
        ...updateData,
      };

      for (const strategy of Object.values(SeasonModel.validationStrategies)) {
        await strategy(tx, leagueUuid, mergedData);
      }

      const [season] = await tx
        .update(seasonsTable)
        .set(updateData)
        .where(
          and(
            eq(seasonsTable.leagueUuid, leagueUuid),
            eq(seasonsTable.uuid, uuid),
            isNull(seasonsTable.$deletedAt),
          ),
        )
        .returning();

      if (!season) {
        throw new DatabaseError('Failed to update season', {
          uuid: { value: uuid, errorType: 'Season not found' },
        });
      }

      return season;
    });

    return new SeasonModel(db, season);
  }

  @ConvertDrizzleErrors()
  public static async delete(db: DB, leagueUuid: string, uuid: string) {
    const [season] = await db
      .update(seasonsTable)
      .set({ $deletedAt: new Date() })
      .where(
        and(
          eq(seasonsTable.leagueUuid, leagueUuid),
          eq(seasonsTable.uuid, uuid),
          isNull(seasonsTable.$deletedAt),
        ),
      )
      .returning();

    if (!season) {
      throw new DatabaseError('Failed to delete season', {
        uuid: { value: uuid, errorType: 'Season not found' },
      });
    }

    return new SeasonModel(db, season);
  }

  public static async _getById(db: DB | TX, leagueUuid: string, uuid: string) {
    const season = await db.query.seasonsTable.findFirst({
      where: {
        uuid,
        leagueUuid,
        $deletedAt: {
          isNull: true,
        },
      },
    });

    return season ?? null;
  }

  @ConvertDrizzleErrors()
  public static async getById(db: DB, leagueUuid: string, uuid: string) {
    const season = await SeasonModel._getById(db, leagueUuid, uuid);

    if (!season) {
      return null;
    }

    return new SeasonModel(db, season);
  }

  @ConvertDrizzleErrors()
  public static async getAll(
    db: DB,
    leagueId: string,
    limit?: number,
    offset?: number,
  ) {
    const seasons = await db.query.seasonsTable.findMany({
      where: {
        leagueUuid: leagueId,
        $deletedAt: {
          isNull: true,
        },
      },
      limit,
      offset,
    });

    return seasons.map((season) => new SeasonModel(db, season));
  }

  @ConvertDrizzleErrors()
  public static async count(db: DB, leagueId: string) {
    const result = await db
      .select({
        count: count(),
      })
      .from(seasonsTable)
      .where(
        and(
          eq(seasonsTable.leagueUuid, leagueId),
          isNull(seasonsTable.$deletedAt),
        ),
      );

    return Number(result[0]?.count ?? 0);
  }

  @ConvertDrizzleErrors()
  public static async getByDate(db: DB, leagueId: string, date: Date) {
    const season = await db.query.seasonsTable.findFirst({
      where: {
        leagueUuid: leagueId,
        startDate: {
          lte: date,
        },
        endDate: {
          gt: date,
        },
        $deletedAt: {
          isNull: true,
        },
      },
    });

    if (!season) {
      return null;
    }

    return new SeasonModel(db, season);
  }

  public static validationStrategies = {
    correctSeasonDates: (
      _db: DB | TX,
      _leagueUuid: string,
      data: SeasonStrategy,
    ) => {
      if (data.startDate >= data.endDate) {
        throw new StrategyValidationError('Invalid season dates', {
          startDate: {
            value: data.startDate,
            errorType: 'INVALID_DATE_RANGE',
          },
          endDate: {
            value: data.endDate,
            errorType: 'INVALID_DATE_RANGE',
          },
        });
      }
    },
    noSeasonOverlap: async (
      db: DB | TX,
      leagueUuid: string,
      data: SeasonStrategy,
    ) => {
      const overlappingSeason = await db.query.seasonsTable.findFirst({
        where: {
          AND: [
            {
              leagueUuid,
              $deletedAt: { isNull: true },
            },
            {
              NOT: {
                uuid: data.uuid,
              },
            },
            {
              OR: [
                {
                  startDate: {
                    lte: data.startDate,
                  },
                  endDate: {
                    gt: data.startDate,
                  },
                },
                {
                  startDate: {
                    lt: data.endDate,
                  },
                  endDate: {
                    gte: data.endDate,
                  },
                },
                {
                  startDate: {
                    gte: data.startDate,
                  },
                  endDate: {
                    lte: data.endDate,
                  },
                },
              ],
            },
          ],
        },
      });

      if (overlappingSeason) {
        throw new StrategyValidationError(
          'Season dates overlap with an existing season',
          {
            startDate: {
              value: data.startDate,
              errorType: 'DATE_OVERLAP',
            },
            endDate: {
              value: data.endDate,
              errorType: 'DATE_OVERLAP',
            },
          },
        );
      }
    },
  };
}
