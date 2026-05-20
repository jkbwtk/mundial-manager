import { and, count, eq, isNull } from 'drizzle-orm';
import type { DB, TX } from '#backend/db/database';
import { Model } from '#backend/db/models/Model';
import { ballsTable } from '#backend/db/schema';
import type { BallSelectSchema } from '#backend/types/db/ball';
import {
  ConvertDrizzleErrors,
  DatabaseError,
  NotFoundError,
} from '#blib/modelErrors';
import { Ball, type BallCreate, type BallUpdate } from '#shared/types/api/ball';

export class BallModel extends Model<BallSelectSchema, typeof Ball> {
  protected publicSchema = Ball;

  @ConvertDrizzleErrors()
  public static async create(db: DB, leagueUuid: string, data: BallCreate) {
    const [ball] = await db
      .insert(ballsTable)
      .values({ ...data, leagueUuid })
      .returning();

    if (!ball) {
      throw new DatabaseError('Failed to create ball', {});
    }

    return new BallModel(db, ball);
  }

  @ConvertDrizzleErrors()
  public static async update(db: DB, leagueUuid: string, data: BallUpdate) {
    const { uuid, ...updateData } = data;

    const ball = await db.transaction(async (tx) => {
      const existingTable = await BallModel._getById(tx, uuid);
      if (!existingTable) {
        throw new NotFoundError('Ball not found for update', {
          uuid: { value: uuid, errorType: 'Ball not found' },
        });
      }

      const [ball] = await tx
        .update(ballsTable)
        .set(updateData)
        .where(
          and(
            eq(ballsTable.leagueUuid, leagueUuid),
            eq(ballsTable.uuid, uuid),
            isNull(ballsTable.$deletedAt),
          ),
        )
        .returning();

      if (!ball) {
        throw new DatabaseError('Failed to update ball', {
          uuid: { value: uuid, errorType: 'Ball not found' },
        });
      }

      return ball;
    });

    return new BallModel(db, ball);
  }

  @ConvertDrizzleErrors()
  public static async delete(db: DB, leagueUuid: string, uuid: string) {
    const [ball] = await db
      .update(ballsTable)
      .set({ $deletedAt: new Date() })
      .where(
        and(
          eq(ballsTable.leagueUuid, leagueUuid),
          eq(ballsTable.uuid, uuid),
          isNull(ballsTable.$deletedAt),
        ),
      )
      .returning();

    if (!ball) {
      throw new DatabaseError('Failed to delete ball', {
        uuid: { value: uuid, errorType: 'Ball not found' },
      });
    }

    return new BallModel(db, ball);
  }

  public static async _getById(db: DB | TX, uuid: string) {
    const ball = await db.query.ballsTable.findFirst({
      where: {
        uuid,
        $deletedAt: {
          isNull: true,
        },
      },
    });

    return ball ?? null;
  }

  @ConvertDrizzleErrors()
  public static async getById(db: DB, uuid: string) {
    const ball = await BallModel._getById(db, uuid);

    if (!ball) {
      return null;
    }
    return new BallModel(db, ball);
  }

  @ConvertDrizzleErrors()
  public static async getAll(
    db: DB,
    leagueUuid: string,
    limit?: number,
    offset?: number,
  ) {
    const balls = await db.query.ballsTable.findMany({
      where: {
        leagueUuid,
        $deletedAt: {
          isNull: true,
        },
      },
      limit,
      offset,
    });

    return balls.map((ball) => new BallModel(db, ball));
  }

  @ConvertDrizzleErrors()
  public static async count(db: DB, leagueUuid: string) {
    const result = await db
      .select({
        count: count(),
      })
      .from(ballsTable)
      .where(
        and(
          eq(ballsTable.leagueUuid, leagueUuid),
          isNull(ballsTable.$deletedAt),
        ),
      );

    return Number(result[0]?.count ?? 0);
  }
}
