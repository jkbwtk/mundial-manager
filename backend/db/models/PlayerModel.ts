import { ModelOps } from '#backend/db/models/ModelOps';
import { playersTable } from '#backend/db/schema';
import { PlayerSelectSchema } from '#backend/types/db/player';
import {
  PlayerCreate,
  PlayerQueryMeta,
  PlayerUpdate,
} from '#shared/types/api/player';

export class PlayerModel extends ModelOps({
  table: playersTable,
  tableName: 'playersTable',
  selectSchema: PlayerSelectSchema,
  createSchema: PlayerCreate,
  updateSchema: PlayerUpdate,
  queryMetaSchema: PlayerQueryMeta,
}) {}
