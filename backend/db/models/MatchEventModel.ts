import type { DB, TX } from '#backend/db/database';
import { ModelOps } from '#backend/db/models/ModelOps';
import { matchEventsTable } from '#backend/db/schema';
import { MatchEventSelectSchema } from '#backend/types/db/matchEvent';
import {
  MatchEventCreate,
  MatchEventQueryMeta,
  MatchEventUpdate,
} from '#shared/types/api/matchEvent';

export class MatchEventModel extends ModelOps({
  table: matchEventsTable,
  tableName: 'matchEventsTable',
  selectSchema: MatchEventSelectSchema,
  createSchema: MatchEventCreate,
  updateSchema: MatchEventUpdate,
  queryMetaSchema: MatchEventQueryMeta,
}) {
  public static async getByMatchId(
    db: DB | TX,
    leagueUuid: string,
    matchUuid: string,
    meta: MatchEventQueryMeta = {},
  ) {
    const instances = await db.query.matchEventsTable.findMany({
      where: {
        leagueUuid,
        matchUuid,
        $deletedAt: {
          isNull: true,
        },
      },
      orderBy: {
        [meta.sorting?.field ?? '$createdAt']: meta.sorting?.direction ?? 'asc',
      },
      limit: meta.pagination?.limit,
      offset: meta.pagination?.offset,
    });

    return instances;
  }
}
