import { and, count, eq, isNull } from 'drizzle-orm';
import type { DB } from '#backend/db/database';
import { Model, StrategyValidationError } from '#backend/db/models/Model';
import { seasonsTable } from '#backend/db/schema';
import type { SeasonSelectSchema } from '#backend/types/db/season';
import { Season, type SeasonCreate } from '#shared/types/api/season';

export class SeasonModel extends Model<SeasonSelectSchema, typeof Season> {
  protected publicSchema = Season;

  public get uuid() {
    return this.instance.uuid;
  }

  public static async create(db: DB, leagueUuid: string, data: SeasonCreate) {
    for (const strategy of Object.values(SeasonModel.validationStrategies)) {
      await strategy(db, leagueUuid, data);
    }

    const [season] = await db
      .insert(seasonsTable)
      .values({ ...data, leagueUuid })
      .returning();

    if (!season) {
      throw new Error('Failed to create season');
    }

    return new SeasonModel(db, season);
  }

  public static async getById(db: DB, uuid: string) {
    const season = await db.query.seasonsTable.findFirst({
      where: {
        uuid,
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

  public static async getCurrent(db: DB, leagueId: string) {
    const now = new Date();

    const season = await db.query.seasonsTable.findFirst({
      where: {
        leagueUuid: leagueId,
        startDate: {
          lte: now,
        },
        endDate: {
          gt: now,
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
        throw new StrategyValidationError('Invalid season dates');
      }
    },
    noSeasonOverlap: async (db: DB, leagueUuid: string, data: SeasonCreate) => {
      const overlappingSeason = await db.query.seasonsTable.findFirst({
        where: {
          leagueUuid: leagueUuid,
          $or: [
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
          $deletedAt: {
            isNull: true,
          },
        },
      });

      if (overlappingSeason) {
        throw new StrategyValidationError(
          'Season dates overlap with an existing season',
        );
      }
    },
  };
}
