import { TRPCError } from '@trpc/server';
import z from 'zod';
import type { DB } from '#backend/db/database';
import type { ModelOps } from '#backend/db/models/ModelOps';
import { PaginationInput } from '#backend/types/trpc';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure } from '#blib/trpc';
import { PaginatedResponse } from '#shared/zod';

const InstanceWithId = z.object({
  uuid: z.uuid(),
});

export interface CreateCrudOpsMetadata<
  PublicSchema extends typeof InstanceWithId,
  CreateSchema extends z.ZodObject,
  UpdateSchema extends typeof InstanceWithId,
  Model extends ReturnType<typeof ModelOps>,
> {
  publicSchema: PublicSchema;
  createSchema: CreateSchema;
  updateSchema: UpdateSchema;
  model: Model;
}

export function createCrudOps<
  PublicSchema extends typeof InstanceWithId,
  CreateSchema extends z.ZodObject,
  UpdateSchema extends typeof InstanceWithId,
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
      .input(PaginationInput.optional())
      .output(PaginatedResponse(metadata.publicSchema))
      // @ts-expect-error
      .query(async ({ ctx, input }) => {
        const instances = runWithErrorConversion(() =>
          metadata.model.getAll(
            ctx.db,
            ctx.league.uuid,
            input?.limit,
            input?.offset,
          ),
        );
        const total = runWithErrorConversion(() =>
          metadata.model.count(ctx.db, ctx.league.uuid),
        );

        return {
          data: await instances,
          total: await total,
        };
      }),

    getById: leagueScopedProcedure
      .input(metadata.publicSchema.pick({ uuid: true }))
      .output(metadata.publicSchema)
      // @ts-expect-error
      .query(async ({ ctx, input }) => {
        const season = await runWithErrorConversion(() =>
          metadata.model.getById(ctx.db, ctx.league.uuid, input.uuid),
        );

        if (!season) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Instance not found',
          });
        }

        return season;
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
        const season = await runWithErrorConversion(() =>
          metadata.model.update(ctx.db, ctx.league.uuid, input),
        );

        return season;
      }),

    delete: leagueScopedProcedure
      .input(metadata.publicSchema.pick({ uuid: true }))
      .output(metadata.publicSchema)
      // @ts-expect-error
      .mutation(async ({ ctx, input }) => {
        const season = await runWithErrorConversion(() =>
          metadata.model.delete(ctx.db, ctx.league.uuid, input.uuid),
        );

        return season;
      }),
  };
}

export function createSearchProcedure<
  PublicSchema extends typeof InstanceWithId,
  Model extends {
    search: (
      db: DB,
      leagueUuid: string,
      query: string,
    ) => Promise<z.input<PublicSchema>[]>;
  },
>(publicSchema: PublicSchema, model: Model) {
  return leagueScopedProcedure
    .input(z.string())
    .output(publicSchema.array())
    .query(async ({ ctx, input }) => {
      const instances = runWithErrorConversion(() =>
        model.search(ctx.db, ctx.league.uuid, input),
      );

      return await instances;
    });
}
