import type { DB, TX } from '#backend/db/database';
import type { TeamConfigurationSelectSchema } from '#backend/types/db/teamConfiguration';
import { ConvertDrizzleErrors } from '#blib/modelErrors';

// biome-ignore lint/complexity/noStaticOnlyClass: yeah
export class TeamConfigurationModel {
  @ConvertDrizzleErrors()
  public static async get(
    db: DB | TX,
    leagueUuid: string,
    uuids: Iterable<string>,
  ): Promise<TeamConfigurationSelectSchema[]> {
    const uniqueUuids = [...new Set(uuids)];

    if (uniqueUuids.length === 0) return [];

    return db.query.teamConfigurationsTable.findMany({
      where: {
        leagueUuid,
        uuid: {
          in: uniqueUuids,
        },
        $deletedAt: {
          isNull: true,
        },
      },
    });
  }
}
