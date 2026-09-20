import {
  and,
  count,
  desc,
  eq,
  getColumns,
  inArray,
  isNull,
  type SQL,
} from 'drizzle-orm';
import type z from 'zod';
import type { DB, TX } from '#backend/db/database';
import type { BaseModelType } from '#backend/db/Instance';
import type {
  ballsTable,
  matchesTable,
  matchTimelinesTable,
  playersTable,
  seasonsTable,
  tablesTable,
} from '#backend/db/schema';
import type { QueryMetaSchema } from '#backend/types/trpc';
import {
  ConvertDrizzleErrors,
  DatabaseError,
  type ModelErrorFields,
  NotFoundError,
} from '#blib/modelErrors';
import { ModelErrorTypeEnum } from '#shared/modelErrors';

export type LeagueScopedTablesUnion =
  | typeof seasonsTable
  | typeof tablesTable
  | typeof ballsTable
  | typeof playersTable
  | typeof matchesTable
  | typeof matchTimelinesTable;

export type StrategyContext<Fields> = {
  db: DB | TX;
  leagueUuid: string;
} & Fields;

export type Strategy<Context> = (context: Context) => Promise<void> | void;

export type WriteContext<Data, Row> =
  | StrategyContext<{ op: 'create'; next: Data; previous: null }>
  | StrategyContext<{ op: 'update'; next: Data; previous: Row }>;

export interface ModelStrategies<Data, Row> {
  preWrite?: Record<string, Strategy<WriteContext<Data, Row>>>;

  preCreate?: Record<string, Strategy<StrategyContext<{ next: Data }>>>;
  postCreate?: Record<string, Strategy<StrategyContext<{ created: Row }>>>;

  preUpdate?: Record<
    string,
    Strategy<StrategyContext<{ next: Data; previous: Row }>>
  >;
  postUpdate?: Record<
    string,
    Strategy<StrategyContext<{ updated: Row; previous: Row }>>
  >;

  preDelete?: Record<string, Strategy<StrategyContext<{ previous: Row }>>>;
  postDelete?: Record<string, Strategy<StrategyContext<{ deleted: Row }>>>;
}

export type ModelStrategyKind = keyof ModelStrategies<unknown, unknown>;

export type StrategyContextOf<
  Data,
  Row,
  Kind extends ModelStrategyKind,
> = Parameters<NonNullable<ModelStrategies<Data, Row>[Kind]>[string]>[0];

export interface ModelOpsMetadata<
  Table extends LeagueScopedTablesUnion,
  TableName extends keyof DB['query'],
  PublicSchema extends
    | z.ZodObject
    | z.ZodDiscriminatedUnion<z.ZodObject[], string>,
  SelectSchema extends BaseModelType,
  CreateSchema extends
    | z.ZodObject
    | z.ZodDiscriminatedUnion<z.ZodObject[], string>,
  UpdateSchema extends
    | z.ZodObject
    | z.ZodDiscriminatedUnion<z.ZodObject[], string>,
  QueryMetaSchemaType extends QueryMetaSchema,
> {
  table: Table;
  tableName: TableName;
  publicSchema: PublicSchema;
  selectSchema: z.ZodType<SelectSchema>;
  createSchema: CreateSchema;
  updateSchema: UpdateSchema;
  queryMetaSchema: QueryMetaSchemaType;
  searchSql?: {
    ranking: (search: string) => SQL;
    where: (search: string) => SQL;
  };
}

export function ModelOps<
  Table extends LeagueScopedTablesUnion,
  TableName extends keyof DB['query'],
  PublicSchema extends
    | z.ZodObject
    | z.ZodDiscriminatedUnion<z.ZodObject[], string>,
  SelectSchema extends BaseModelType,
  CreateSchema extends
    | z.ZodObject
    | z.ZodDiscriminatedUnion<z.ZodObject[], string>,
  UpdateSchema extends
    | z.ZodObject
    | z.ZodDiscriminatedUnion<z.ZodObject[], string>,
  QueryMetaSchemaType extends QueryMetaSchema,
>(
  metadata: ModelOpsMetadata<
    Table,
    TableName,
    PublicSchema,
    SelectSchema,
    CreateSchema,
    UpdateSchema,
    QueryMetaSchemaType
  >,
) {
  // biome-ignore lint/complexity/noStaticOnlyClass: yeah
  class ModelOps {
    protected static readonly table = metadata.table;
    protected static readonly tableUnion: LeagueScopedTablesUnion =
      metadata.table;
    protected static readonly tableName = metadata.tableName;
    protected static readonly publicSchema = metadata.publicSchema;
    protected static readonly selectSchema = metadata.selectSchema;
    protected static readonly createSchema = metadata.createSchema;
    protected static readonly updateSchema = metadata.updateSchema;
    protected static readonly queryMetaSchema = metadata.queryMetaSchema;
    protected static readonly searchSql = metadata.searchSql;

    @ConvertDrizzleErrors()
    public static async count(db: DB | TX, leagueUuid: string) {
      const request = await db
        .select({
          count: count(),
        })
        .from(ModelOps.tableUnion)
        .where(
          and(
            eq(ModelOps.tableUnion.leagueUuid, leagueUuid),
            isNull(ModelOps.tableUnion.$deletedAt),
          ),
        );

      return Number(request[0]?.count ?? 0);
    }

    @ConvertDrizzleErrors()
    public static async getAll(
      db: DB | TX,
      leagueUuid: string,
      meta: z.infer<QueryMetaSchemaType> = {} as z.infer<QueryMetaSchemaType>,
    ) {
      if (ModelOps.searchSql && meta.search) {
        const { ranking, where } = ModelOps.searchSql;

        const instances = await db
          .select({
            ...getColumns(ModelOps.tableUnion),
            rank: ranking(meta.search),
          })
          .from(ModelOps.tableUnion)
          .where(
            and(
              eq(ModelOps.tableUnion.leagueUuid, leagueUuid),
              isNull(ModelOps.tableUnion.$deletedAt),
              where(meta.search),
            ),
          )
          .orderBy((t) => desc(t.rank))
          .limit(meta.pagination?.limit ?? 0)
          .offset(meta.pagination?.offset ?? 0);

        return instances as unknown as SelectSchema[];
      }

      const instances = await db.query[ModelOps.tableName]
        // @ts-expect-error
        .findMany({
          where: {
            leagueUuid,
            $deletedAt: {
              isNull: true,
            },
          },
          orderBy: {
            [meta.sorting?.field ?? '$createdAt']:
              meta.sorting?.direction ?? 'asc',
          },
          limit: meta.pagination?.limit,
          offset: meta.pagination?.offset,
        });

      return instances as unknown as SelectSchema[];
    }

    @ConvertDrizzleErrors()
    public static async getById(db: DB | TX, leagueUuid: string, uuid: string) {
      const instance = await db.query[ModelOps.tableName]
        // @ts-expect-error
        .findFirst({
          where: {
            uuid,
            leagueUuid,

            $deletedAt: {
              isNull: true,
            },
          },
        });

      return (instance as unknown as SelectSchema) ?? null;
    }

    @ConvertDrizzleErrors()
    public static async getByIdOrThrow(
      db: DB | TX,
      leagueUuid: string,
      uuid: string,
      errorFields: ModelErrorFields = ['uuid'],
    ) {
      const instance = await ModelOps.getById(db, leagueUuid, uuid);

      if (!instance) {
        throw new NotFoundError('Instance not found', errorFields);
      }

      return instance;
    }

    @ConvertDrizzleErrors()
    public static async getByIds(
      db: DB | TX,
      leagueUuid: string,
      uuids: Iterable<string>,
    ) {
      const uniqueUuids = [...new Set(uuids)];

      if (uniqueUuids.length === 0) return [];

      const instances = await db.query[ModelOps.tableName]
        // @ts-expect-error
        .findMany({
          where: {
            leagueUuid,
            uuid: { in: uniqueUuids },

            $deletedAt: {
              isNull: true,
            },
          },
        });

      return instances as unknown as SelectSchema[];
    }

    protected static async runStrategies<Kind extends ModelStrategyKind>(
      kind: Kind,
      context: StrategyContextOf<z.infer<CreateSchema>, SelectSchema, Kind>,
    ) {
      const strategies = (this.strategies[kind] ?? {}) as Record<
        string,
        Strategy<typeof context>
      >;

      for (const strategy of Object.values(strategies)) {
        await strategy(context);
      }
    }

    protected static async prepareCreate(
      _db: DB | TX,
      _leagueUuid: string,
      data: z.infer<CreateSchema>,
    ): Promise<{ next: z.infer<CreateSchema>; row: object }> {
      return { next: data, row: data };
    }

    protected static async prepareUpdate(
      _db: DB | TX,
      _leagueUuid: string,
      previous: SelectSchema,
      data: Record<string, unknown>,
    ): Promise<{ next: z.infer<CreateSchema>; row: object }> {
      return {
        next: { ...previous, ...data } as z.infer<CreateSchema>,
        row: data,
      };
    }

    @ConvertDrizzleErrors()
    public static async create(
      db: DB | TX,
      leagueUuid: string,
      data: z.infer<CreateSchema>,
    ) {
      const instance = await db.transaction(async (tx) => {
        const { next, row } = await this.prepareCreate(tx, leagueUuid, data);

        await this.runStrategies('preWrite', {
          db: tx,
          leagueUuid,
          op: 'create',
          next,
          previous: null,
        });
        await this.runStrategies('preCreate', {
          db: tx,
          leagueUuid,
          next,
        });

        const [created] = await tx
          .insert(ModelOps.tableUnion)
          // biome-ignore lint/suspicious/noExplicitAny: row shape is defined by the model
          .values({ ...row, leagueUuid } as any)
          .returning();

        if (!created) {
          throw new DatabaseError('Failed to create instance', {});
        }

        await this.runStrategies('postCreate', {
          db: tx,
          leagueUuid,
          created: created as unknown as SelectSchema,
        });

        return created;
      });

      return instance as unknown as SelectSchema;
    }

    @ConvertDrizzleErrors()
    public static async update(
      db: DB | TX,
      leagueUuid: string,
      data: z.infer<UpdateSchema>,
    ) {
      const { uuid, ...updateData } = data;

      const instance = await db.transaction(async (tx) => {
        const previous = await ModelOps.getByIdOrThrow(
          tx,
          leagueUuid,
          uuid as string,
        );

        const { next, row } = await this.prepareUpdate(
          tx,
          leagueUuid,
          previous,
          updateData,
        );

        await this.runStrategies('preWrite', {
          db: tx,
          leagueUuid,
          op: 'update',
          next,
          previous,
        });
        await this.runStrategies('preUpdate', {
          db: tx,
          leagueUuid,
          next,
          previous,
        });

        const [updated] = await tx
          .update(ModelOps.tableUnion)
          .set(row)
          .where(
            and(
              eq(ModelOps.tableUnion.leagueUuid, leagueUuid),
              eq(ModelOps.tableUnion.uuid, uuid as string),
              isNull(ModelOps.tableUnion.$deletedAt),
            ),
          )
          .returning();

        if (!updated) {
          throw new DatabaseError('Failed to update instance', {
            uuid: { value: uuid, errorType: ModelErrorTypeEnum.NOT_FOUND },
          });
        }

        await this.runStrategies('postUpdate', {
          db: tx,
          leagueUuid,
          updated: updated as unknown as SelectSchema,
          previous,
        });

        return updated;
      });

      return instance as unknown as SelectSchema;
    }

    @ConvertDrizzleErrors()
    public static async delete(db: DB | TX, leagueUuid: string, uuid: string) {
      const instance = await db.transaction(async (tx) => {
        const previous = await ModelOps.getByIdOrThrow(tx, leagueUuid, uuid);

        await this.runStrategies('preDelete', {
          db: tx,
          leagueUuid,
          previous,
        });

        const [deleted] = await tx
          .update(ModelOps.tableUnion)
          .set({ $deletedAt: new Date() })
          .where(
            and(
              eq(ModelOps.tableUnion.leagueUuid, leagueUuid),
              eq(ModelOps.tableUnion.uuid, uuid),
              isNull(ModelOps.tableUnion.$deletedAt),
            ),
          )
          .returning();

        if (!deleted) {
          throw new DatabaseError('Failed to delete instance', {
            uuid: { value: uuid, errorType: ModelErrorTypeEnum.NOT_FOUND },
          });
        }

        await this.runStrategies('postDelete', {
          db: tx,
          leagueUuid,
          deleted: deleted as unknown as SelectSchema,
        });

        return deleted;
      });

      return instance as unknown as SelectSchema;
    }

    @ConvertDrizzleErrors()
    public static async createMany(
      db: DB | TX,
      leagueUuid: string,
      data: z.infer<CreateSchema>[],
    ) {
      if (data.length === 0) return [];

      const rows: object[] = [];

      for (const item of data) {
        const { row } = await this.prepareCreate(db, leagueUuid, item);

        rows.push({ ...row, leagueUuid });
      }

      const created = await db
        .insert(ModelOps.tableUnion)
        // biome-ignore lint/suspicious/noExplicitAny :yeah
        .values(rows as any)
        .returning();

      return created as unknown as SelectSchema[];
    }

    @ConvertDrizzleErrors()
    public static async updateMany(
      db: DB | TX,
      leagueUuid: string,
      updates: readonly { uuid: string; data: z.infer<CreateSchema> }[],
    ) {
      for (const { uuid, data } of updates) {
        const { row } = await this.prepareCreate(db, leagueUuid, data);

        await db
          .update(ModelOps.tableUnion)
          .set(row)
          .where(
            and(
              eq(ModelOps.tableUnion.leagueUuid, leagueUuid),
              eq(ModelOps.tableUnion.uuid, uuid),
              isNull(ModelOps.tableUnion.$deletedAt),
            ),
          );
      }
    }

    @ConvertDrizzleErrors()
    public static async deleteMany(
      db: DB | TX,
      leagueUuid: string,
      uuids: string[],
    ) {
      if (uuids.length === 0) return [];

      const deleted = await db
        .update(ModelOps.tableUnion)
        .set({ $deletedAt: new Date() })
        .where(
          and(
            eq(ModelOps.tableUnion.leagueUuid, leagueUuid),
            inArray(ModelOps.tableUnion.uuid, [...uuids]),
            isNull(ModelOps.tableUnion.$deletedAt),
          ),
        )
        .returning();

      return deleted as unknown as SelectSchema[];
    }

    @ConvertDrizzleErrors()
    public static async mapToPublic(
      _db: DB | TX,
      data: SelectSchema,
    ): Promise<z.infer<PublicSchema>> {
      return data as unknown as z.infer<PublicSchema>;
    }

    public static defineStrategies(
      strategies: ModelStrategies<z.infer<CreateSchema>, SelectSchema>,
      // biome-ignore lint/suspicious/noExplicitAny: yeah
    ): ModelStrategies<any, any> {
      return strategies;
    }

    // biome-ignore lint/suspicious/noExplicitAny: yeah
    public static strategies: ModelStrategies<any, any> = {};
  }

  return ModelOps;
}
