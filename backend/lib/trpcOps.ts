import z from 'zod';
import type { ModelOps } from '#backend/db/models/ModelOps';
import type { QueryMetaSchema } from '#backend/types/trpc';
import { leaguePermissionProcedure } from '#blib/trpc';
import type { PermissionRequirement } from '#shared/permissions';
import { PaginatedResponse, uuidArray } from '#shared/zod';

const InstanceWithId = z.object({
  uuid: z.uuid(),
});

const InstancesWithIds = z.object({
  uuids: uuidArray.check(z.maxLength(500)),
});

type UnionWithId = z.ZodDiscriminatedUnion<(typeof InstanceWithId)[], string>;

export interface CrudPermissions {
  read: PermissionRequirement;
  create: PermissionRequirement;
  update: PermissionRequirement;
  delete: PermissionRequirement;
}

export interface CreateCrudOpsMetadata<
  PublicSchema extends typeof InstanceWithId | UnionWithId,
  CreateSchema extends
    | z.ZodObject
    | z.ZodDiscriminatedUnion<z.ZodObject[], string>,
  UpdateSchema extends typeof InstanceWithId | UnionWithId,
  Model extends ReturnType<typeof ModelOps>,
> {
  publicSchema: PublicSchema;
  createSchema: CreateSchema;
  updateSchema: UpdateSchema;
  model: Model;
  queryMetaSchema: QueryMetaSchema;
  permissions: CrudPermissions;
}

export function createCrudOps<
  PublicSchema extends typeof InstanceWithId | UnionWithId,
  CreateSchema extends
    | z.ZodObject
    | z.ZodDiscriminatedUnion<z.ZodObject[], string>,
  UpdateSchema extends typeof InstanceWithId | UnionWithId,
  Model extends ReturnType<typeof ModelOps>,
>(
  metadata: CreateCrudOpsMetadata<
    PublicSchema,
    CreateSchema,
    UpdateSchema,
    Model
  >,
) {
  const readProcedure = leaguePermissionProcedure(metadata.permissions.read);

  return {
    getAll: readProcedure
      .input(metadata.queryMetaSchema.optional())
      .output(PaginatedResponse(metadata.publicSchema))
      // @ts-expect-error
      .query(async ({ ctx, input }) => {
        const [instances, total] = await Promise.all([
          metadata.model.getAll(ctx.db, ctx.league.uuid, input),
          metadata.model.count(ctx.db, ctx.league.uuid, input),
        ]);

        return {
          data: await Promise.all(
            instances.map((instance) =>
              metadata.model.mapToPublic(ctx.db, instance),
            ),
          ),
          total,
        };
      }),

    getById: readProcedure
      .input(InstanceWithId)
      .output(metadata.publicSchema)
      // @ts-expect-error
      .query(async ({ ctx, input }) => {
        const instance = await metadata.model.getByIdOrThrow(
          ctx.db,
          ctx.league.uuid,
          input.uuid,
        );

        return metadata.model.mapToPublic(ctx.db, instance);
      }),

    getByIds: readProcedure
      .input(InstancesWithIds)
      .output(metadata.publicSchema.array())
      // @ts-expect-error
      .query(async ({ ctx, input }) => {
        const instances = await metadata.model.getByIds(
          ctx.db,
          ctx.league.uuid,
          input.uuids,
        );
        const instancesByUuid = new Map(
          instances.map((instance) => [instance.uuid, instance]),
        );

        return Promise.all(
          input.uuids
            .flatMap((uuid) => instancesByUuid.get(uuid) ?? [])
            .map((instance) => metadata.model.mapToPublic(ctx.db, instance)),
        );
      }),

    create: leaguePermissionProcedure(metadata.permissions.create)
      .input(metadata.createSchema)
      .output(metadata.publicSchema)
      // @ts-expect-error
      .mutation(async ({ ctx, input }) => {
        const instance = await metadata.model.create(
          ctx.db,
          ctx.league.uuid,
          input,
        );

        return metadata.model.mapToPublic(ctx.db, instance);
      }),

    update: leaguePermissionProcedure(metadata.permissions.update)
      .input(metadata.updateSchema)
      .output(metadata.publicSchema)
      // @ts-expect-error
      .mutation(async ({ ctx, input }) => {
        const instance = await metadata.model.update(
          ctx.db,
          ctx.league.uuid,
          input,
        );

        return metadata.model.mapToPublic(ctx.db, instance);
      }),

    delete: leaguePermissionProcedure(metadata.permissions.delete)
      .input(InstanceWithId)
      .output(metadata.publicSchema)
      // @ts-expect-error
      .mutation(async ({ ctx, input }) => {
        const instance = await metadata.model.delete(
          ctx.db,
          ctx.league.uuid,
          input.uuid,
        );

        return metadata.model.mapToPublic(ctx.db, instance);
      }),
  };
}
