import z from 'zod';
import type { DB } from '#backend/db/database';

export const BaseModelType = z.object({
  uuid: z.uuid(),
  leagueUuid: z.uuid(),
});

export type BaseModelType = z.infer<typeof BaseModelType>;

export function Instance<T extends BaseModelType>(_selectSchema: z.ZodType<T>) {
  class Instance {
    protected db: DB;

    public instance: T;

    public constructor(db: DB, instance: T) {
      this.db = db;
      this.instance = instance;
    }
  }

  return Instance;
}
