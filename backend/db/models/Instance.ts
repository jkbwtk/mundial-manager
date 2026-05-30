import z from 'zod';
import type { DB } from '#backend/db/database';

export const BaseModelType = z.object({
  uuid: z.uuid(),
  leagueUuid: z.uuid(),
});

export type BaseModelType = z.infer<typeof BaseModelType>;

export function Instance<T extends BaseModelType, Public extends z.ZodObject>(
  publicSchema: Public,
) {
  class Instance {
    protected db: DB;
    protected publicSchema = publicSchema;

    public instance: T;

    public constructor(db: DB, instance: T) {
      this.db = db;
      this.instance = instance;
    }

    public serialize(): z.infer<Public> {
      return this.publicSchema.parse(this.instance);
    }
  }

  return Instance;
}
