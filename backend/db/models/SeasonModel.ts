import { and, count, eq, isNull } from 'drizzle-orm';
import type { DB } from '#backend/db/database';
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
  type SeasonUpdate,
} from '#shared/types/api/season';

export class SeasonModel extends Model<SeasonSelectSchema, typeof Season> {
  protected publicSchema = Season;

  public get uuid() {
    return this.instance.uuid;
  }

  @ConvertDrizzleErrors('SeasonModel')
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

  @ConvertDrizzleErrors('SeasonModel')
  public static async update(db: DB, leagueUuid: string, data: SeasonUpdate) {
    const { uuid, ...updateData } = data;

    const existingSeason = await SeasonModel.getById(db, leagueUuid, uuid);
    if (!existingSeason) {
      throw new NotFoundError('Season not found for update', {
        uuid: { value: uuid, errorType: 'Season not found' },
      });
    }

    for (const strategy of Object.values(SeasonModel.validationStrategies)) {
      await strategy(db, leagueUuid, {
        ...existingSeason.serialize(),
        ...updateData,
      });
    }

    const [season] = await db
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
      throw new NotFoundError('Failed to update season', {
        uuid: { value: uuid, errorType: 'Season not found' },
      });
    }

    return new SeasonModel(db, season);
  }

  @ConvertDrizzleErrors('SeasonModel')
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

  @ConvertDrizzleErrors('SeasonModel')
  public static async getById(db: DB, leagueUuid: string, uuid: string) {
    const season = await db.query.seasonsTable.findFirst({
      where: {
        uuid,
        leagueUuid,
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

  @ConvertDrizzleErrors('SeasonModel')
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

  @ConvertDrizzleErrors('SeasonModel')
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

  @ConvertDrizzleErrors('SeasonModel')
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
    correctSeasonDates: (_db: DB, _leagueUuid: string, data: SeasonCreate) => {
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
    noSeasonOverlap: async (db: DB, leagueUuid: string, data: SeasonCreate) => {
      const overlappingSeason = await db.query.seasonsTable.findFirst({
        where: {
          AND: [
            {
              leagueUuid,
              $deletedAt: { isNull: true },
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
