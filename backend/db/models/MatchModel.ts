import z from 'zod';
import type { DB } from '#backend/db/database';
import { ModelOps } from '#backend/db/models/ModelOps';
import { matchesTable } from '#backend/db/schema';
import { MatchSelectSchema } from '#backend/types/db/match';
import { MatchCreate, MatchUpdate } from '#shared/types/api/match';
import { getValueHash } from '#shared/utils';

export class MatchModel extends ModelOps({
  table: matchesTable,
  tableName: 'matchesTable',
  selectSchema: MatchSelectSchema,
  createSchema: MatchCreate.extend({
    hash: z.string(),
  }),
  updateSchema: MatchUpdate.extend({
    hash: z.string(),
  }),
}) {
  public static create(db: DB, leagueUuid: string, data: MatchCreate) {
    const hash = getValueHash({
      leagueUuid,
      startDate: data.startDate,
      duration: data.duration,
      pauseDuration: data.pauseDuration,
      status: data.status,
    });

    return super.create(db, leagueUuid, { ...data, hash });
  }

  public static update(db: DB, leagueUuid: string, data: MatchUpdate) {
    const hash = getValueHash({
      leagueUuid,
      startDate: data.startDate,
      duration: data.duration,
      pauseDuration: data.pauseDuration,
      status: data.status,
    });

    return super.update(db, leagueUuid, { ...data, hash });
  }
}
