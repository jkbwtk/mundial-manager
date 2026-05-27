import { and, count, eq, isNull } from 'drizzle-orm';
import type { DB, TX } from '#backend/db/database';
import { Model } from '#backend/db/models/Model';
import { matchesTable } from '#backend/db/schema';
import type { MatchSelectSchema } from '#backend/types/db/match';
import {
  ConvertDrizzleErrors,
  DatabaseError,
  NotFoundError,
} from '#blib/modelErrors';
import {
  Match,
  type MatchCreate,
  type MatchUpdate,
} from '#shared/types/api/match';

export class MatchModel extends Model<MatchSelectSchema, typeof Match> {
  protected publicSchema = Match;

  @ConvertDrizzleErrors()
  public static async create(db: DB, leagueUuid: string, data: MatchCreate) {
    const hash = 'TODO';

    const [instance] = await db
      .insert(matchesTable)
      .values({ ...data, leagueUuid, hash })
      .returning();

    if (!instance) {
      throw new DatabaseError('Failed to create match', {});
    }

    return new MatchModel(db, instance);
  }

  @ConvertDrizzleErrors()
  public static async update(db: DB, leagueUuid: string, data: MatchUpdate) {
    const { uuid, ...updateData } = data;

    const instance = await db.transaction(async (tx) => {
      const existingInstance = await MatchModel._getById(tx, uuid);
      if (!existingInstance) {
        throw new NotFoundError('Match not found for update', {
          uuid: { value: uuid, errorType: 'Match not found' },
        });
      }

      const [instance] = await tx
        .update(matchesTable)
        .set(updateData)
        .where(
          and(
            eq(matchesTable.leagueUuid, leagueUuid),
            eq(matchesTable.uuid, uuid),
            isNull(matchesTable.$deletedAt),
          ),
        )
        .returning();

      if (!instance) {
        throw new DatabaseError('Failed to update match', {
          uuid: { value: uuid, errorType: 'Match not found' },
        });
      }

      return instance;
    });

    return new MatchModel(db, instance);
  }

  @ConvertDrizzleErrors()
  public static async delete(db: DB, leagueUuid: string, uuid: string) {
    const [instance] = await db
      .update(matchesTable)
      .set({ $deletedAt: new Date() })
      .where(
        and(
          eq(matchesTable.leagueUuid, leagueUuid),
          eq(matchesTable.uuid, uuid),
          isNull(matchesTable.$deletedAt),
        ),
      )
      .returning();

    if (!instance) {
      throw new DatabaseError('Failed to delete match', {
        uuid: { value: uuid, errorType: 'Match not found' },
      });
    }

    return new MatchModel(db, instance);
  }

  public static async _getById(db: DB | TX, uuid: string) {
    const instance = await db.query.matchesTable.findFirst({
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
  public static async getById(db: DB, uuid: string) {
    const instance = await MatchModel._getById(db, uuid);

    if (!instance) {
      return null;
    }
    return new MatchModel(db, instance);
  }

  @ConvertDrizzleErrors()
  public static async getAll(
    db: DB,
    leagueUuid: string,
    limit?: number,
    offset?: number,
  ) {
    const instances = await db.query.matchesTable.findMany({
      where: {
        leagueUuid,
        $deletedAt: {
          isNull: true,
        },
      },
      limit,
      offset,
    });

    return instances.map((instance) => new MatchModel(db, instance));
  }

  @ConvertDrizzleErrors()
  public static async count(db: DB, leagueUuid: string) {
    const result = await db
      .select({
        count: count(),
      })
      .from(matchesTable)
      .where(
        and(
          eq(matchesTable.leagueUuid, leagueUuid),
          isNull(matchesTable.$deletedAt),
        ),
      );

    return Number(result[0]?.count ?? 0);
  }
}
