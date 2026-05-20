import z from 'zod';
import type { DB } from '#backend/db/database';

const BaseModelType = z.object({
  uuid: z.uuid(),
});

type BaseModelType = z.infer<typeof BaseModelType>;

export abstract class Model<T extends BaseModelType, Public extends z.ZodType> {
  public instance: T;
  protected db: DB;

  protected abstract publicSchema: Public;

  public get uuid() {
    return this.instance.uuid;
  }

  public constructor(db: DB, instance: T) {
    this.db = db;
    this.instance = instance;
  }

  public serialize(): z.infer<typeof this.publicSchema> {
    return this.publicSchema.parse(this.instance);
  }
}
