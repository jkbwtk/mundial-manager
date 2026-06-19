import type { DB, TX } from '#backend/db/database';
import { ModelOps } from '#backend/db/models/ModelOps';
import { matchEventsTable } from '#backend/db/schema';
import {
  MatchEventInsertSchema,
  MatchEventSelectSchema,
  MatchEventUpdateSchema,
} from '#backend/types/db/matchEvent';
import { ConvertDrizzleErrors } from '#blib/modelErrors';
import {
  MatchEvent,
  type MatchEventCreate,
  MatchEventQueryMeta,
  type MatchEventUpdate,
} from '#shared/types/api/matchEvent';

export class MatchEventModel extends ModelOps({
  table: matchEventsTable,
  tableName: 'matchEventsTable',
  selectSchema: MatchEventSelectSchema,
  createSchema: MatchEventInsertSchema,
  updateSchema: MatchEventUpdateSchema,
  queryMetaSchema: MatchEventQueryMeta,
  publicSchema: MatchEvent,
}) {
  public static async mapToPublic(
    _db: DB | TX,
    data: MatchEventSelectSchema,
  ): Promise<MatchEvent> {
    const { payload, ...rest } = data;

    return {
      ...rest,
      ...payload,
    };
  }

  @ConvertDrizzleErrors()
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

  @ConvertDrizzleErrors()
  public static async create(
    db: DB | TX,
    leagueUuid: string,
    data: MatchEventCreate,
  ) {
    const { matchUuid, type, time, ...payload } = data;

    return super.create(db, leagueUuid, {
      matchUuid,
      type,
      time,
      payload,
    });
  }

  @ConvertDrizzleErrors()
  public static async update(
    db: DB | TX,
    leagueUuid: string,
    data: MatchEventUpdate,
  ) {
    const { uuid, matchUuid, type, time, ...payload } = data;

    return super.update(db, leagueUuid, {
      uuid,
      matchUuid,
      type,
      time,
      payload,
    });
  }
}
