import type { DB } from '#backend/db/database';
import { Model } from '#backend/db/models/Model';
import { seasonsTable } from '#backend/db/schema';
import type { SeasonSelectSchema } from '#backend/types/db/season';
import { Season } from '#shared/types/api/season';

export class SeasonModel extends Model<SeasonSelectSchema, typeof Season> {
  protected publicSchema = Season;

  public static async create(db: DB, leagueUuid: string, data: Season) {
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
}
