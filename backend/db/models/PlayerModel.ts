import { and, count, eq, isNull } from 'drizzle-orm';
import type { DB, TX } from '#backend/db/database';
import { Model } from '#backend/db/models/Model';
import { playersTable } from '#backend/db/schema';
import type { PlayerSelectSchema } from '#backend/types/db/player';
import {
  ConvertDrizzleErrors,
  DatabaseError,
  NotFoundError,
} from '#blib/modelErrors';
import {
  Player,
  type PlayerCreate,
  type PlayerUpdate,
} from '#shared/types/api/player';

export class PlayerModel extends Model<PlayerSelectSchema, typeof Player> {
  protected publicSchema = Player;

  @ConvertDrizzleErrors()
  public static async create(db: DB, leagueUuid: string, data: PlayerCreate) {
    const [instance] = await db
      .insert(playersTable)
      .values({ ...data, leagueUuid })
      .returning();

    if (!instance) {
      throw new DatabaseError('Failed to create player', {});
    }

    return new PlayerModel(db, instance);
  }

  @ConvertDrizzleErrors()
  public static async update(db: DB, leagueUuid: string, data: PlayerUpdate) {
    const { uuid, ...updateData } = data;

    const instance = await db.transaction(async (tx) => {
      const existingInstance = await PlayerModel._getById(tx, uuid);
      if (!existingInstance) {
        throw new NotFoundError('Player not found for update', {
          uuid: { value: uuid, errorType: 'Player not found' },
        });
      }

      const [instance] = await tx
        .update(playersTable)
        .set(updateData)
        .where(
          and(
            eq(playersTable.leagueUuid, leagueUuid),
            eq(playersTable.uuid, uuid),
            isNull(playersTable.$deletedAt),
          ),
        )
        .returning();

      if (!instance) {
        throw new DatabaseError('Failed to update player', {
          uuid: { value: uuid, errorType: 'Player not found' },
        });
      }

      return instance;
    });

    return new PlayerModel(db, instance);
  }

  @ConvertDrizzleErrors()
  public static async delete(db: DB, leagueUuid: string, uuid: string) {
    const [instance] = await db
      .update(playersTable)
      .set({ $deletedAt: new Date() })
      .where(
        and(
          eq(playersTable.leagueUuid, leagueUuid),
          eq(playersTable.uuid, uuid),
          isNull(playersTable.$deletedAt),
        ),
      )
      .returning();

    if (!instance) {
      throw new DatabaseError('Failed to delete player', {
        uuid: { value: uuid, errorType: 'Player not found' },
      });
    }

    return new PlayerModel(db, instance);
  }

  public static async _getById(db: DB | TX, uuid: string) {
    const instance = await db.query.playersTable.findFirst({
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
    const instance = await PlayerModel._getById(db, uuid);

    if (!instance) {
      return null;
    }
    return new PlayerModel(db, instance);
  }

  @ConvertDrizzleErrors()
  public static async getAll(
    db: DB,
    leagueUuid: string,
    limit?: number,
    offset?: number,
  ) {
    const instances = await db.query.playersTable.findMany({
      where: {
        leagueUuid,
        $deletedAt: {
          isNull: true,
        },
      },
      limit,
      offset,
    });

    return instances.map((instance) => new PlayerModel(db, instance));
  }

  @ConvertDrizzleErrors()
  public static async count(db: DB, leagueUuid: string) {
    const result = await db
      .select({
        count: count(),
      })
      .from(playersTable)
      .where(
        and(
          eq(playersTable.leagueUuid, leagueUuid),
          isNull(playersTable.$deletedAt),
        ),
      );

    return Number(result[0]?.count ?? 0);
  }
}
