import { sql } from 'drizzle-orm';
import { ModelOps } from '#backend/db/models/ModelOps';
import { ballsTable } from '#backend/db/schema';
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
  searchSql: {
    ranking: (
      search,
    ) => sql`setweight(to_tsvector('english', ${ballsTable.name}), 'A') || \
          setweight(to_tsvector('english', ${ballsTable.alias}), 'B') || \
          setweight(to_tsvector('english', coalesce(${ballsTable.description}, '')), 'C'), to_tsquery('english', ${search})`,
    where: (
      search,
    ) => sql`setweight(to_tsvector('english', ${ballsTable.name}), 'A') || \
          setweight(to_tsvector('english', ${ballsTable.alias}), 'B') || \
          setweight(to_tsvector('english', coalesce(${ballsTable.description}, '')), 'C') \
          @@ to_tsquery('english', ${search})`,
  },
}) {}
