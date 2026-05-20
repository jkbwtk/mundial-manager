import type { DB } from '#backend/db/database';
import { Model } from '#backend/db/models/Model';
import { ballsTable } from '#backend/db/schema';
import type { BallSelectSchema } from '#backend/types/db/ball';
import { ConvertDrizzleErrors } from '#blib/modelErrors';
import { Ball, type BallCreate } from '#shared/types/api/ball';

export class BallModel extends Model<BallSelectSchema, typeof Ball> {
  protected publicSchema = Ball;

  @ConvertDrizzleErrors()
  public static async create(db: DB, leagueUuid: string, data: BallCreate) {
    const [ball] = await db
      .insert(ballsTable)
      .values({ ...data, leagueUuid })
      .returning();

    if (!ball) {
      throw new Error('Failed to create ball');
    }

    return new BallModel(db, ball);
  }

  @ConvertDrizzleErrors()
  public static async getById(db: DB, uuid: string) {
    const ball = await db.query.ballsTable.findFirst({
      where: {
        uuid,
        $deletedAt: {
          isNull: true,
        },
      },
    });

    if (!ball) {
      return null;
    }

    return new BallModel(db, ball);
  }

  @ConvertDrizzleErrors()
  public static async getAll(db: DB, leagueUuid: string) {
    const balls = await db.query.ballsTable.findMany({
      where: {
        leagueUuid,
        $deletedAt: {
          isNull: true,
        },
      },
    });

    return balls.map((ball) => new BallModel(db, ball));
  }
}
