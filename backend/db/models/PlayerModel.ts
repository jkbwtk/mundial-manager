import { ModelOps } from '#backend/db/models/ModelOps';
import { playersTable } from '#backend/db/schema';
import { createTextSearchSql } from '#backend/db/utils';
import {
  PlayerCreate,
  PlayerQueryMeta,
  PlayerUpdate,
} from '#shared/types/api/player';

export class PlayerModel extends ModelOps({
  table: playersTable,
  createSchema: PlayerCreate,
  updateSchema: PlayerUpdate,
  queryMetaSchema: PlayerQueryMeta,
  searchSql: createTextSearchSql({
    vector: playersTable.searchVectors,
    text: [playersTable.name, playersTable.alias],
  }),
}) {}
