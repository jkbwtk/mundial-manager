import { ModelOps } from '#backend/db/models/ModelOps';
import { ballsTable } from '#backend/db/schema';
import { createTextSearchSql } from '#backend/db/utils';
import { BallSelectSchema } from '#backend/types/db/ball';
import {
  Ball,
  BallCreate,
  BallQueryMeta,
  BallUpdate,
} from '#shared/types/api/ball';

export class BallModel extends ModelOps({
  table: ballsTable,
  tableName: 'ballsTable',
  publicSchema: Ball,
  selectSchema: BallSelectSchema,
  createSchema: BallCreate,
  updateSchema: BallUpdate,
  queryMetaSchema: BallQueryMeta,
  searchSql: createTextSearchSql({
    vector: ballsTable.searchVectors,
    text: [ballsTable.name, ballsTable.alias],
  }),
}) {}
