// lets declaration emit name tRPC's inferParser in createCrudOps
import type {} from '@trpc/server/unstable-core-do-not-import';
import z from 'zod';
import type { DB, TX } from '#backend/db/database';
import { leaguePermissionProcedure } from '#blib/trpc';
import type { PermissionRequirement } from '#shared/permissions';
import type { QueryMetaSchema } from '#shared/types/api/queryMeta';
import { PaginatedResponse, uuidArray } from '#shared/zod';

const InstanceWithId = z.object({
  uuid: z.uuid(),
});

const InstancesWithIds = z.object({
  uuids: uuidArray.check(z.maxLength(500)),
});

type UnionWithId = z.ZodDiscriminatedUnion<(typeof InstanceWithId)[], string>;

type CrudSchema = z.ZodObject | z.ZodDiscriminatedUnion<z.ZodObject[], string>;

export interface CrudPermissions {
  read: PermissionRequirement;
  create: PermissionRequirement;
  update: PermissionRequirement;
  delete: PermissionRequirement;
}

export interface CrudModel<Row, Data, UpdateData, Meta> {
  count: (db: DB | TX, leagueUuid: string, meta?: Meta) => Promise<number>;
  getAll: (db: DB | TX, leagueUuid: string, meta?: Meta) => Promise<Row[]>;
  getByIdOrThrow: (
    db: DB | TX,
    leagueUuid: string,
    uuid: string,
  ) => Promise<Row>;
  getByIds: (
    db: DB | TX,
    leagueUuid: string,
    uuids: Iterable<string>,
  ) => Promise<Row[]>;
  create: (db: DB | TX, leagueUuid: string, data: Data) => Promise<Row>;
  update: (db: DB | TX, leagueUuid: string, data: UpdateData) => Promise<Row>;
  delete: (db: DB | TX, leagueUuid: string, uuid: string) => Promise<Row>;
}

export interface CreateCrudOpsMetadata<
  PublicSchema extends typeof InstanceWithId | UnionWithId,
  CreateSchema extends CrudSchema,
  UpdateSchema extends typeof InstanceWithId | UnionWithId,
  QueryMetaSchemaType extends QueryMetaSchema,
  Row extends z.input<PublicSchema> & { uuid: string },
> {
  publicSchema: PublicSchema;
  createSchema: CreateSchema;
  updateSchema: UpdateSchema;
  model: CrudModel<
    Row,
    z.infer<CreateSchema>,
    z.infer<UpdateSchema>,
    z.infer<QueryMetaSchemaType>
  >;
  queryMetaSchema: QueryMetaSchemaType;
  permissions: CrudPermissions;
}

export function createCrudOps<
  PublicSchema extends typeof InstanceWithId | UnionWithId,
  CreateSchema extends CrudSchema,
  UpdateSchema extends typeof InstanceWithId | UnionWithId,
  QueryMetaSchemaType extends QueryMetaSchema,
  Row extends z.input<PublicSchema> & { uuid: string },
>(
  metadata: CreateCrudOpsMetadata<
    PublicSchema,
    CreateSchema,
    UpdateSchema,
    QueryMetaSchemaType,
    Row
  >,
) {
  const { publicSchema, createSchema, updateSchema, queryMetaSchema } =
    metadata;

  const toOutput = (value: unknown) => value as never;

  const readProcedure = leaguePermissionProcedure(metadata.permissions.read);

  return {
    getAll: readProcedure
      .input(queryMetaSchema.optional())
      .output(PaginatedResponse(publicSchema))
      .query(async ({ ctx, input }) => {
        const [instances, total] = await Promise.all([
          metadata.model.getAll(ctx.db, ctx.league.uuid, input),
          metadata.model.count(ctx.db, ctx.league.uuid, input),
        ]);

        return { data: instances, total };
      }),

    getById: readProcedure
      .input(InstanceWithId)
      .output(publicSchema)
      .query(async ({ ctx, input }) => {
        return toOutput(
          await metadata.model.getByIdOrThrow(
            ctx.db,
            ctx.league.uuid,
            input.uuid,
          ),
        );
      }),

    getByIds: readProcedure
      .input(InstancesWithIds)
      .output(publicSchema.array())
      .query(async ({ ctx, input }) => {
        const instances = await metadata.model.getByIds(
          ctx.db,
          ctx.league.uuid,
          input.uuids,
        );
        const instancesByUuid = new Map(
          instances.map((instance) => [instance.uuid, instance]),
        );

        return input.uuids.flatMap((uuid) => instancesByUuid.get(uuid) ?? []);
      }),

    create: leaguePermissionProcedure(metadata.permissions.create)
      .input(createSchema)
      .output(publicSchema)
      .mutation(async ({ ctx, input }) => {
        return toOutput(
          await metadata.model.create(
            ctx.db,
            ctx.league.uuid,
            input as z.infer<CreateSchema>,
          ),
        );
      }),

    update: leaguePermissionProcedure(metadata.permissions.update)
      .input(updateSchema)
      .output(publicSchema)
      .mutation(async ({ ctx, input }) => {
        return toOutput(
          await metadata.model.update(
            ctx.db,
            ctx.league.uuid,
            input as z.infer<UpdateSchema>,
          ),
        );
      }),

    delete: leaguePermissionProcedure(metadata.permissions.delete)
      .input(InstanceWithId)
      .output(publicSchema)
      .mutation(async ({ ctx, input }) => {
        return toOutput(
          await metadata.model.delete(ctx.db, ctx.league.uuid, input.uuid),
        );
      }),
  };
}
