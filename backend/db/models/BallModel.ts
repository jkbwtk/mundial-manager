import { ModelOps } from '#backend/db/models/ModelOps';
import { ballsTable } from '#backend/db/schema';
import { BallSelectSchema } from '#backend/types/db/ball';
import { BallCreate, BallUpdate } from '#shared/types/api/ball';

export class ballModel extends ModelOps({
  table: ballsTable,
  tableName: 'ballsTable',
  selectSchema: BallSelectSchema,
  createSchema: BallCreate,
  updateSchema: BallUpdate,
}) {}
