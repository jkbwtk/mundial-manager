import type { DB } from '#backend/db/database';
import { Model } from '#backend/db/models/Model';
import { matchSpectatorsTable } from '#backend/db/schema';
import type { MatchSpectatorSelectSchema } from '#backend/types/db/matchSpectator';
import { ConvertDrizzleErrors } from '#blib/modelErrors';
import {
  MatchSpectator,
  type MatchSpectatorCreate,
} from '#shared/types/api/matchSpectator';

export class MatchSpectatorModel extends Model<
  MatchSpectatorSelectSchema,
  typeof MatchSpectator
> {
  protected publicSchema = MatchSpectator;

  @ConvertDrizzleErrors('MatchSpectatorModel')
  public static async create(
    db: DB,
    leagueUuid: string,
    data: MatchSpectatorCreate,
  ) {
    const [spectator] = await db
      .insert(matchSpectatorsTable)
      .values({ ...data, leagueUuid })
      .returning();

    if (!spectator) {
      throw new Error('Failed to create match spectator');
    }

    return new MatchSpectatorModel(db, spectator);
  }

  @ConvertDrizzleErrors('MatchSpectatorModel')
  public static async getById(db: DB, uuid: string) {
    const spectator = await db.query.matchSpectatorsTable.findFirst({
      where: {
        uuid,
        $deletedAt: {
          isNull: true,
        },
      },
    });

    if (!spectator) {
      return null;
    }

    return new MatchSpectatorModel(db, spectator);
  }

  @ConvertDrizzleErrors('MatchSpectatorModel')
  public static async getForMatch(db: DB, matchUuid: string) {
    const spectators = await db.query.matchSpectatorsTable.findMany({
      where: {
        matchUuid,
        $deletedAt: {
          isNull: true,
        },
      },
      orderBy: {
        $createdAt: 'asc',
      },
    });

    return spectators.map(
      (spectator) => new MatchSpectatorModel(db, spectator),
    );
  }

  @ConvertDrizzleErrors('MatchSpectatorModel')
  public static async getForPlayer(db: DB, playerUuid: string) {
    const spectators = await db.query.matchSpectatorsTable.findMany({
      where: {
        playerUuid,
        $deletedAt: {
          isNull: true,
        },
      },
      orderBy: {
        $createdAt: 'asc',
      },
    });

    return spectators.map(
      (spectator) => new MatchSpectatorModel(db, spectator),
    );
  }
}
