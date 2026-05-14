import type z from 'zod';
import type { DB } from '#backend/db/database';

export abstract class Model<T, Public extends z.ZodType> {
  public instance: T;
  protected db: DB;

  protected abstract publicSchema: Public;

  public constructor(db: DB, instance: T) {
    this.db = db;
    this.instance = instance;
  }

  public serialize(): z.infer<typeof this.publicSchema> {
    return this.publicSchema.parse(this.instance);
  }
}
