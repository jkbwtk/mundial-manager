import { and, count, eq, isNull } from 'drizzle-orm';
import type z from 'zod';
import type { DB, TX } from '#backend/db/database';
import type { BaseModelType, Instance } from '#backend/db/models/Instance';
import type {
  ballsTable,
  matchesTable,
  playersTable,
  seasonsTable,
  tablesTable,
} from '#backend/db/schema';
import { ConvertDrizzleErrors } from '#blib/modelErrors';

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
  TableName extends keyof DB['query'],
  SelectSchema extends BaseModelType,
  PublicSchema extends z.ZodObject,
  StrategySchema extends z.ZodObject,
  InstanceType extends ReturnType<typeof Instance>,
> {
  table: LeagueScopedTablesUnion;
  tableName: TableName;
  selectSchema: z.ZodType<SelectSchema>;
  publicSchema: PublicSchema;
  strategySchema?: StrategySchema;
  InstanceConstructor: InstanceType;
}

export function ModelOps<
  TableName extends keyof DB['query'],
  SelectSchema extends BaseModelType,
  PublicSchema extends z.ZodObject,
  ValidationSchema extends z.ZodObject,
  InstanceType extends ReturnType<typeof Instance<SelectSchema, PublicSchema>>,
>(
  metadata: ModelOpsMetadata<
    TableName,
    SelectSchema,
    PublicSchema,
    ValidationSchema,
    InstanceType
  >,
) {
  // biome-ignore lint/complexity/noStaticOnlyClass: yeah
  class ModelOps {
    protected static readonly table = metadata.table;
    protected static readonly tableName = metadata.tableName;
    protected static readonly selectSchema = metadata.selectSchema;
    protected static readonly publicSchema = metadata.publicSchema;
    protected static readonly strategySchema = metadata.strategySchema;
    protected static readonly InstanceConstructor =
      metadata.InstanceConstructor;

    @ConvertDrizzleErrors()
    public static async count(db: DB | TX, leagueUuid: string) {
      const request = await db
        .select({
          count: count(),
        })
        .from(ModelOps.table)
        .where(
          and(
            eq(ModelOps.table.leagueUuid, leagueUuid),
            isNull(ModelOps.table.$deletedAt),
          ),
        );

      return Number(request[0]?.count ?? 0);
    }

    @ConvertDrizzleErrors()
    public static async _getById(
      db: DB | TX,
      leagueUuid: string,
      uuid: string,
    ) {
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
    public static async getById(db: DB, leagueUuid: string, uuid: string) {
      const instance = await ModelOps._getById(db, leagueUuid, uuid);

      // @ts-expect-error
      return instance ? new ModelOps.InstanceConstructor(db, instance) : null;
    }

    public static validationStrategies: ValidationStrategies<ValidationSchema> =
      {};
  }

  return ModelOps;
}
