import type { DB } from '#backend/db/database';
import { Model } from '#backend/db/models/Model';
import { seasonsTable } from '#backend/db/schema';
import {
  SeasonInsertSchema,
  SeasonPublicSchema,
  type SeasonSelectSchema,
} from '#backend/types/db/season';

export class SeasonModel extends Model<
  SeasonSelectSchema,
  typeof SeasonPublicSchema
> {
  protected publicSchema = SeasonPublicSchema;

  public static async create(db: DB, data: SeasonInsertSchema) {
    const parsedData = SeasonInsertSchema.parse(data);

    const [season] = await db
      .insert(seasonsTable)
      .values(parsedData)
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
