import type { DB } from '#backend/db/database';
import { Model } from '#backend/db/models/Model';
import { leaguesTable } from '#backend/db/schema';
import {
  LeagueInsertSchema,
  LeaguePublicSchema,
  type LeagueSelectSchema,
} from '#backend/types/db/league';

export class LeagueModel extends Model<
  LeagueSelectSchema,
  typeof LeaguePublicSchema
> {
  protected publicSchema = LeaguePublicSchema;

  public static async create(db: DB, data: LeagueInsertSchema) {
    const parsedData = LeagueInsertSchema.parse(data);

    const [league] = await db
      .insert(leaguesTable)
      .values(parsedData)
      .returning();

    if (!league) {
      throw new Error('Failed to create league');
    }

    return new LeagueModel(db, league);
  }

  public static async getById(db: DB, uuid: string) {
    const league = await db.query.leaguesTable.findFirst({
      where: {
        uuid,
        $deletedAt: {
          isNull: true,
        },
      },
    });

    if (!league) {
      return null;
    }

    return new LeagueModel(db, league);
  }

  public static async getAll(db: DB, limit?: number, offset?: number) {
    const leagues = await db.query.leaguesTable.findMany({
      limit,
      offset,
      where: {
        $deletedAt: {
          isNull: true,
        },
      },
      orderBy: {
        $createdAt: 'asc',
      },
    });

    return leagues.map((league) => new LeagueModel(db, league));
  }
}
