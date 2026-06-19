import { TRPCError } from '@trpc/server';
import z from 'zod';
import type { ModelOps } from '#backend/db/models/ModelOps';
import type { QueryMetaSchema } from '#backend/types/trpc';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure } from '#blib/trpc';
import { PaginatedResponse } from '#shared/zod';

const InstanceWithId = z.object({
  uuid: z.uuid(),
});

type UnionWithId = z.ZodDiscriminatedUnion<(typeof InstanceWithId)[], string>;

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
  return {
    getAll: leagueScopedProcedure
      .input(metadata.queryMetaSchema.optional())
      .output(PaginatedResponse(metadata.publicSchema))
      .query(async ({ ctx, input }) => {
        const instances = await runWithErrorConversion(() =>
          metadata.model.getAll(ctx.db, ctx.league.uuid, input),
        );
        const total = runWithErrorConversion(() =>
          metadata.model.count(ctx.db, ctx.league.uuid),
        );

        const mappedInstances = Promise.all(
          instances.map((instance) =>
            metadata.model.mapToPublic(ctx.db, instance),
          ),
        );

        return {
          data: await mappedInstances,
          total: await total,
        };
      }),

    getById: leagueScopedProcedure
      .input(InstanceWithId)
      .output(metadata.publicSchema)
      // @ts-expect-error
      .query(async ({ ctx, input }) => {
        const instance = await runWithErrorConversion(() =>
          metadata.model.getById(ctx.db, ctx.league.uuid, input.uuid),
        );

        if (!instance) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Instance not found',
          });
        }

        return metadata.model.mapToPublic(ctx.db, instance);
      }),

    create: leagueScopedProcedure
      .input(metadata.createSchema)
      .output(metadata.publicSchema)
      // @ts-expect-error
      .mutation(async ({ ctx, input }) => {
        const instance = await runWithErrorConversion(() =>
          metadata.model.create(ctx.db, ctx.league.uuid, input),
        );

        return instance;
      }),

    update: leagueScopedProcedure
      .input(metadata.updateSchema)
      .output(metadata.publicSchema)
      // @ts-expect-error
      .mutation(async ({ ctx, input }) => {
        const instance = await runWithErrorConversion(() =>
          metadata.model.update(ctx.db, ctx.league.uuid, input),
        );

        return instance;
      }),

    delete: leagueScopedProcedure
      .input(InstanceWithId)
      .output(metadata.publicSchema)
      // @ts-expect-error
      .mutation(async ({ ctx, input }) => {
        const instance = await runWithErrorConversion(() =>
          metadata.model.delete(ctx.db, ctx.league.uuid, input.uuid),
        );

        return instance;
      }),
  };
}
