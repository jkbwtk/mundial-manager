import { sql } from 'drizzle-orm';
import { ModelOps } from '#backend/db/models/ModelOps';
import { playersTable } from '#backend/db/schema';
import { PlayerSelectSchema } from '#backend/types/db/player';
import {
  Player,
  PlayerCreate,
  PlayerQueryMeta,
  PlayerUpdate,
} from '#shared/types/api/player';

export class PlayerModel extends ModelOps({
  table: playersTable,
  tableName: 'playersTable',
  publicSchema: Player,
  selectSchema: PlayerSelectSchema,
  createSchema: PlayerCreate,
  updateSchema: PlayerUpdate,
  queryMetaSchema: PlayerQueryMeta,
  searchSql: {
    ranking: (
      search,
    ) => sql`setweight(to_tsvector('english', ${playersTable.name}), 'A') || \
            setweight(to_tsvector('english', ${playersTable.alias}), 'B'), to_tsquery('english', ${search})`,
    where: (
      search,
    ) => sql`setweight(to_tsvector('english', ${playersTable.name}), 'A') || \
            setweight(to_tsvector('english', ${playersTable.alias}), 'B') \
            @@ to_tsquery('english', ${search})`,
  },
}) {}
