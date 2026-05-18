import { and, count, eq, isNull } from 'drizzle-orm';
import type { DB } from '#backend/db/database';
import { Model } from '#backend/db/models/Model';
import { leaguesTable } from '#backend/db/schema';
import type { LeagueSelectSchema } from '#backend/types/db/league';
import {
  ConvertDrizzleErrors,
  DatabaseError,
  NotFoundError,
} from '#blib/modelErrors';
import {
  League,
  type LeagueCreate,
  type LeagueUpdate,
} from '#shared/types/api/league';

export class LeagueModel extends Model<LeagueSelectSchema, typeof League> {
  protected publicSchema = League;

  public get uuid() {
    return this.instance.uuid;
  }

  @ConvertDrizzleErrors('LeagueModel')
  public static async create(db: DB, data: LeagueCreate) {
    const [league] = await db.insert(leaguesTable).values(data).returning();

    if (!league) {
      throw new DatabaseError('Failed to create league', {});
    }

    return new LeagueModel(db, league);
  }

  @ConvertDrizzleErrors('LeagueModel')
  public static async update(db: DB, data: LeagueUpdate) {
    const { uuid, ...updateData } = data;

    const [league] = await db
      .update(leaguesTable)
      .set(updateData)
      .where(and(eq(leaguesTable.uuid, uuid), isNull(leaguesTable.$deletedAt)))
      .returning();

    if (!league) {
      throw new NotFoundError('League not found', {
        uuid: { value: uuid, errorType: 'League not found' },
      }).toTRPCError();
    }

    return new LeagueModel(db, league);
  }

  @ConvertDrizzleErrors('LeagueModel')
  public static async delete(db: DB, uuid: string) {
    const [league] = await db
      .update(leaguesTable)
      .set({ $deletedAt: new Date() })
      .where(and(eq(leaguesTable.uuid, uuid), isNull(leaguesTable.$deletedAt)))
      .returning();

    if (!league) {
      throw new NotFoundError('League not found', {
        uuid: { value: uuid, errorType: 'League not found' },
      }).toTRPCError();
    }

    return new LeagueModel(db, league);
  }

  @ConvertDrizzleErrors('LeagueModel')
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

  @ConvertDrizzleErrors('LeagueModel')
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

  @ConvertDrizzleErrors('LeagueModel')
  public static async count(db: DB) {
    const result = await db
      .select({
        count: count(),
      })
      .from(leaguesTable)
      .where(isNull(leaguesTable.$deletedAt));

    return result.at(0)?.count ?? 0;
  }
}
