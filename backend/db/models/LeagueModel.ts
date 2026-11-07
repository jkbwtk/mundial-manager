import { and, count, eq, isNull } from 'drizzle-orm';
import type { DB, TX } from '#backend/db/database';
import { GoalTypeModel } from '#backend/db/models/GoalTypeModel';
import { leaguesTable } from '#backend/db/schema';
import {
  ConvertDrizzleErrors,
  DatabaseError,
  type ModelErrorFields,
  NotFoundError,
} from '#blib/modelErrors';
import type { LeagueCreate, LeagueUpdate } from '#shared/types/api/league';

// biome-ignore lint/complexity/noStaticOnlyClass: yeah
export class LeagueModel {
  @ConvertDrizzleErrors()
  public static async create(db: DB, data: LeagueCreate) {
    const [league] = await db.insert(leaguesTable).values(data).returning();

    if (!league) {
      throw new DatabaseError('Failed to create league', {});
    }

    await GoalTypeModel.createDefaults(db, league.uuid);

    return league;
  }

  @ConvertDrizzleErrors()
  public static async update(db: DB, data: LeagueUpdate) {
    const { uuid, ...updateData } = data;

    const [league] = await db
      .update(leaguesTable)
      .set(updateData)
      .where(and(eq(leaguesTable.uuid, uuid), isNull(leaguesTable.$deletedAt)))
      .returning();

    if (!league) {
      throw new NotFoundError('League not found', ['uuid']);
    }

    return league;
  }

  @ConvertDrizzleErrors()
  public static async delete(db: DB, uuid: string) {
    const [league] = await db
      .update(leaguesTable)
      .set({ $deletedAt: new Date() })
      .where(and(eq(leaguesTable.uuid, uuid), isNull(leaguesTable.$deletedAt)))
      .returning();

    if (!league) {
      throw new NotFoundError('League not found', ['uuid']);
    }

    return league;
  }

  @ConvertDrizzleErrors()
  public static async getById(db: DB | TX, uuid: string) {
    const instance = await db.query.leaguesTable.findFirst({
      where: {
        uuid,
        $deletedAt: {
          isNull: true,
        },
      },
    });

    return instance ?? null;
  }

  @ConvertDrizzleErrors()
  public static async getByIdOrThrow(
    db: DB | TX,
    uuid: string,
    errorFields: ModelErrorFields = ['uuid'],
  ) {
    const instance = await this.getById(db, uuid);

    if (!instance) {
      throw new NotFoundError('League not found', errorFields);
    }

    return instance;
  }

  @ConvertDrizzleErrors()
  public static async getAll(db: DB | TX, limit?: number, offset?: number) {
    return db.query.leaguesTable.findMany({
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
  }

  @ConvertDrizzleErrors()
  public static async count(db: DB) {
    const result = await db
      .select({
        count: count(),
      })
      .from(leaguesTable)
      .where(isNull(leaguesTable.$deletedAt));

    return Number(result.at(0)?.count ?? 0);
  }
}
