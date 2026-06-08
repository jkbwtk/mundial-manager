import type { BaseModelType } from '#backend/db/Instance';

export class List<
  T extends BaseModelType,
  TR extends BaseModelType,
  R extends Record<string, Record<string, BaseModelType>>,
> {
  protected instances: Record<string, T> = {};
  protected relations: R = {} as R;

  public constructor(instances: T[], relations: R) {
    this.relations = relations;

    for (const instance of instances) {
      this.instances[instance.uuid] = instance;
    }
  }

  public getById(id: string) {
    return this.instances[id] ?? null;
  }

  public getByIdWithRelations(_id: string): TR | null {
    throw new Error('getByIdWithRelations not implemented for this list');
  }

  public getAll() {
    return Object.values(this.instances);
  }

  public getAllWithRelations(): TR[] {
    throw new Error('getAllWithRelations not implemented for this list');
  }

  public getRelated<K extends keyof R>(
    relationKey: K,
    relatedId: string,
  ): R[K][string] {
    const relation = this.relations[relationKey];

    if (!relation) {
      throw new Error(`Relation ${String(relationKey)} not found in list`);
    }

    const instance = relation[relatedId];

    if (!instance) {
      throw new Error(
        `Instance with id ${relatedId} not found in list for relation ${String(relationKey)}`,
      );
    }

    return instance as R[K][string];
  }
}
