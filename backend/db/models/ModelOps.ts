import {
  type AnyColumn,
  and,
  asc,
  count,
  desc,
  eq,
  getColumns,
  inArray,
  isNull,
  type SQL,
} from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type z from 'zod';
import type { DB, TX } from '#backend/db/database';
import type * as schema from '#backend/db/schema';
import {
  ConvertDrizzleErrors,
  DatabaseError,
  type ModelErrorFields,
  NotFoundError,
} from '#blib/modelErrors';
import { ModelErrorTypeEnum } from '#shared/modelErrors';
import type { QueryMetaSchema } from '#shared/types/api/queryMeta';

type Schema = typeof schema;

type LeagueScopedShape = PgTable & {
  uuid: AnyColumn;
  leagueUuid: AnyColumn;
  $deletedAt: AnyColumn;
};

export type LeagueScopedTable = {
  [Key in keyof Schema]: Schema[Key] extends LeagueScopedShape
    ? Schema[Key]
    : never;
}[keyof Schema];

type ModelSchema = z.ZodObject | z.ZodDiscriminatedUnion<z.ZodObject[], string>;

type SortField<QueryMetaSchemaType extends QueryMetaSchema> = NonNullable<
  z.infer<QueryMetaSchemaType>['sorting']
>['field'];

type SortFieldsCheck<
  Table extends LeagueScopedTable,
  QueryMetaSchemaType extends QueryMetaSchema,
> =
  Exclude<
    SortField<QueryMetaSchemaType>,
    keyof Table['$inferSelect']
  > extends never
    ? unknown
    : {
        queryMetaSchema: `Unknown sort field: ${Exclude<SortField<QueryMetaSchemaType>, keyof Table['$inferSelect'] | symbol>}`;
      };

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
  Table extends LeagueScopedTable,
  CreateSchema extends ModelSchema,
  UpdateSchema extends ModelSchema,
  QueryMetaSchemaType extends QueryMetaSchema,
> {
  table: Table;
  createSchema: CreateSchema;
  updateSchema: UpdateSchema;
  queryMetaSchema: QueryMetaSchemaType;
  searchSql?: {
    ranking: (search: string) => SQL;
    where: (search: string) => SQL;
    orderBy: SQL[];
  };
  filterSql?: (
    table: Table,
    meta: z.infer<QueryMetaSchemaType>,
  ) => SQL | undefined;
}

export function ModelOps<
  Table extends LeagueScopedTable,
  CreateSchema extends ModelSchema,
  UpdateSchema extends ModelSchema,
  QueryMetaSchemaType extends QueryMetaSchema,
>(
  metadata: ModelOpsMetadata<
    Table,
    CreateSchema,
    UpdateSchema,
    QueryMetaSchemaType
  > &
    SortFieldsCheck<Table, QueryMetaSchemaType>,
) {
  type Row = Table['$inferSelect'];
  type InsertRow = Omit<Table['$inferInsert'], 'leagueUuid'>;
  type Data = z.infer<CreateSchema>;
  type Meta = z.infer<QueryMetaSchemaType>;

  const table: LeagueScopedTable = metadata.table;
  const columns: Record<string, AnyColumn> = getColumns(table);

  const getFilters = (leagueUuid: string, meta: Meta) =>
    and(
      eq(table.leagueUuid, leagueUuid),
      isNull(table.$deletedAt),
      metadata.searchSql && meta.search
        ? metadata.searchSql.where(meta.search)
        : undefined,
      metadata.filterSql?.(metadata.table, meta),
    );

  const getOrderBy = (meta: Meta): SQL[] => {
    if (metadata.searchSql && meta.search) {
      const { ranking, orderBy } = metadata.searchSql;

      return [desc(ranking(meta.search)), ...orderBy, asc(table.uuid)];
    }

    const field = meta.sorting?.field ?? '$createdAt';
    const column = columns[field];

    if (column === undefined) {
      throw new DatabaseError('Unknown sort field', {
        sorting: { value: field, errorType: ModelErrorTypeEnum.INVALID_FORMAT },
      });
    }

    return [meta.sorting?.direction === 'desc' ? desc(column) : asc(column)];
  };

  // biome-ignore lint/complexity/noStaticOnlyClass: yeah
  class ModelOps {
    @ConvertDrizzleErrors()
    public static async count(
      db: DB | TX,
      leagueUuid: string,
      meta: Meta = {} as Meta,
    ) {
      const request = await db
        .select({
          count: count(),
        })
        .from(table)
        .where(getFilters(leagueUuid, meta));

      return Number(request[0]?.count ?? 0);
    }

    @ConvertDrizzleErrors()
    public static async getAll(
      db: DB | TX,
      leagueUuid: string,
      meta: Meta = {} as Meta,
    ) {
      const instances = db
        .select()
        .from(table)
        .where(getFilters(leagueUuid, meta))
        .orderBy(...getOrderBy(meta))
        .$dynamic();

      if (meta.pagination) {
        instances.limit(meta.pagination.limit).offset(meta.pagination.offset);
      }

      return (await instances) as Row[];
    }

    @ConvertDrizzleErrors()
    public static async getById(db: DB | TX, leagueUuid: string, uuid: string) {
      const [instance] = await db
        .select()
        .from(table)
        .where(
          and(
            eq(table.leagueUuid, leagueUuid),
            eq(table.uuid, uuid),
            isNull(table.$deletedAt),
          ),
        );

      return (instance as Row | undefined) ?? null;
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

      const instances = await db
        .select()
        .from(table)
        .where(
          and(
            eq(table.leagueUuid, leagueUuid),
            inArray(table.uuid, uniqueUuids),
            isNull(table.$deletedAt),
          ),
        );

      return instances as Row[];
    }

    public static async runStrategies<Kind extends ModelStrategyKind>(
      kind: Kind,
      context: StrategyContextOf<Data, Row, Kind>,
    ) {
      const strategies = (this.strategies[kind] ?? {}) as Record<
        string,
        Strategy<typeof context>
      >;

      for (const strategy of Object.values(strategies)) {
        await strategy(context);
      }
    }

    public static async prepareCreate(
      _db: DB | TX,
      _leagueUuid: string,
      data: Data,
    ): Promise<{ next: Data; row: InsertRow }> {
      return { next: data, row: data as InsertRow };
    }

    public static async prepareUpdate(
      _db: DB | TX,
      _leagueUuid: string,
      previous: Row,
      data: Partial<Data>,
    ): Promise<{ next: Data; row: Partial<InsertRow> }> {
      return {
        next: { ...previous, ...data } as Data,
        row: data as Partial<InsertRow>,
      };
    }

    @ConvertDrizzleErrors()
    public static async create(db: DB | TX, leagueUuid: string, data: Data) {
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

        const [created] = (await tx
          .insert(table)
          .values({ ...row, leagueUuid } as LeagueScopedTable['$inferInsert'])
          .returning()) as Row[];

        if (!created) {
          throw new DatabaseError('Failed to create instance', {});
        }

        await this.runStrategies('postCreate', {
          db: tx,
          leagueUuid,
          created,
        });

        return created;
      });

      return instance;
    }

    @ConvertDrizzleErrors()
    public static async update(
      db: DB | TX,
      leagueUuid: string,
      data: z.infer<UpdateSchema>,
    ) {
      const { uuid, ...updateData } = data as { uuid: string } & Partial<Data>;

      const instance = await db.transaction(async (tx) => {
        const previous = await ModelOps.getByIdOrThrow(tx, leagueUuid, uuid);

        const { next, row } = await this.prepareUpdate(
          tx,
          leagueUuid,
          previous,
          updateData as Partial<Data>,
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

        const [updated] = (await tx
          .update(table)
          .set(row as Partial<LeagueScopedTable['$inferInsert']>)
          .where(
            and(
              eq(table.leagueUuid, leagueUuid),
              eq(table.uuid, uuid),
              isNull(table.$deletedAt),
            ),
          )
          .returning()) as Row[];

        if (!updated) {
          throw new DatabaseError('Failed to update instance', {
            uuid: { value: uuid, errorType: ModelErrorTypeEnum.NOT_FOUND },
          });
        }

        await this.runStrategies('postUpdate', {
          db: tx,
          leagueUuid,
          updated,
          previous,
        });

        return updated;
      });

      return instance;
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

        const [deleted] = (await tx
          .update(table)
          .set({ $deletedAt: new Date() })
          .where(
            and(
              eq(table.leagueUuid, leagueUuid),
              eq(table.uuid, uuid),
              isNull(table.$deletedAt),
            ),
          )
          .returning()) as Row[];

        if (!deleted) {
          throw new DatabaseError('Failed to delete instance', {
            uuid: { value: uuid, errorType: ModelErrorTypeEnum.NOT_FOUND },
          });
        }

        await this.runStrategies('postDelete', {
          db: tx,
          leagueUuid,
          deleted,
        });

        return deleted;
      });

      return instance;
    }

    public static defineStrategies(
      strategies: ModelStrategies<Data, Row>,
    ): ModelStrategies<Data, Row> {
      return strategies;
    }

    public static strategies: ModelStrategies<Data, Row> = {};
  }

  return ModelOps;
}
