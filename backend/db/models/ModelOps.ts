import { and, count, eq, isNull } from 'drizzle-orm';
import type z from 'zod';
import type { DB, TX } from '#backend/db/database';
import type { BaseModelType } from '#backend/db/models/Instance';
import type {
  ballsTable,
  matchesTable,
  playersTable,
  seasonsTable,
  tablesTable,
} from '#backend/db/schema';
import {
  ConvertDrizzleErrors,
  DatabaseError,
  NotFoundError,
} from '#blib/modelErrors';

export type LeagueScopedTablesUnion =
  | typeof seasonsTable
  | typeof tablesTable
  | typeof ballsTable
  | typeof playersTable
  | typeof matchesTable;

export type ValidationStrategy<T extends z.ZodObject> = (
  db: DB | TX,
  leagueUuid: string,
  data: z.infer<T>,
) => Promise<void> | void;

export type ValidationStrategies<T extends z.ZodObject> = Record<
  string,
  ValidationStrategy<T>
>;

export interface ModelOpsMetadata<
  Table extends LeagueScopedTablesUnion,
  TableName extends keyof DB['query'],
  SelectSchema extends BaseModelType,
  CreateSchema extends z.ZodObject,
  UpdateSchema extends z.ZodObject,
  StrategySchema extends z.ZodObject,
> {
  table: Table;
  tableName: TableName;
  selectSchema: z.ZodType<SelectSchema>;
  createSchema: CreateSchema;
  updateSchema: UpdateSchema;
  strategySchema?: StrategySchema;
}

export function ModelOps<
  Table extends LeagueScopedTablesUnion,
  TableName extends keyof DB['query'],
  SelectSchema extends BaseModelType,
  CreateSchema extends z.ZodObject,
  UpdateSchema extends z.ZodObject,
  ValidationSchema extends z.ZodObject,
>(
  metadata: ModelOpsMetadata<
    Table,
    TableName,
    SelectSchema,
    CreateSchema,
    UpdateSchema,
    ValidationSchema
  >,
) {
  // biome-ignore lint/complexity/noStaticOnlyClass: yeah
  class ModelOps {
    protected static readonly table = metadata.table;
    protected static readonly tableUnion: LeagueScopedTablesUnion =
      metadata.table;
    protected static readonly tableName = metadata.tableName;
    protected static readonly selectSchema = metadata.selectSchema;
    protected static readonly createSchema = metadata.createSchema;
    protected static readonly updateSchema = metadata.updateSchema;
    protected static readonly strategySchema = metadata.strategySchema;

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
      limit?: number,
      offset?: number,
    ) {
      const instances = await db.query[ModelOps.tableName]
        // @ts-expect-error
        .findMany({
          where: {
            leagueUuid,
            $deletedAt: {
              isNull: true,
            },
          },
          limit,
          offset,
        });

      return instances;
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

      return instance ?? null;
    }

    @ConvertDrizzleErrors()
    public static async create(
      db: DB,
      leagueUuid: string,
      data: z.infer<CreateSchema>,
    ) {
      for (const strategy of Object.values(ModelOps.validationStrategies)) {
        // biome-ignore lint/suspicious/noExplicitAny: yeah
        await strategy(db, leagueUuid, data as any);
      }

      const [created] = await db
        .insert(ModelOps.tableUnion)
        .values({
          ...data,
          leagueUuid,
        })
        .returning();

      if (!created) {
        throw new DatabaseError('Failed to create instance', {});
      }

      return created;
    }

    @ConvertDrizzleErrors()
    public static async update(
      db: DB,
      leagueUuid: string,
      data: z.infer<UpdateSchema>,
    ) {
      const { uuid, ...updateData } = data;

      const instance = await db.transaction(async (tx) => {
        const existingInstance = await ModelOps.getById(
          tx,
          leagueUuid,
          uuid as string,
        );
        if (!existingInstance) {
          throw new NotFoundError('Instance not found for update', {
            uuid: { value: uuid, errorType: 'Instance not found' },
          });
        }

        const mergedData = {
          ...existingInstance,
          ...updateData,
        } as z.infer<ValidationSchema>;

        for (const strategy of Object.values(ModelOps.validationStrategies)) {
          // biome-ignore lint/suspicious/noExplicitAny: yeah
          await strategy(tx, leagueUuid, mergedData as any);
        }

        const [updated] = await tx
          .update(ModelOps.tableUnion)
          .set(updateData)
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
            uuid: { value: uuid, errorType: 'Instance not found' },
          });
        }

        return updated;
      });

      return instance;
    }

    @ConvertDrizzleErrors()
    public static async delete(db: DB, leagueUuid: string, uuid: string) {
      const [deleted] = await db
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
          uuid: { value: uuid, errorType: 'Instance not found' },
        });
      }

      return deleted;
    }

    public static validationStrategies: ValidationStrategies<ValidationSchema> =
      {};
  }

  return ModelOps;
}
