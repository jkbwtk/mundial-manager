import z from 'zod';
import { SeasonModel } from '#backend/db/models/SeasonModel';
import { leaguePermissionProcedure, router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcOps';
import { PermissionEnum } from '#shared/permissions';
import {
  Season,
  SeasonCreate,
  SeasonNullable,
  SeasonQueryMeta,
  SeasonUpdate,
} from '#shared/types/api/season';

export const seasonsRouter = router({
  ...createCrudOps({
    publicSchema: Season,
    createSchema: SeasonCreate,
    updateSchema: SeasonUpdate,
    model: SeasonModel,
    queryMetaSchema: SeasonQueryMeta,
    permissions: {
      read: PermissionEnum.SEASONS_READ,
      create: PermissionEnum.SEASONS_CREATE,
      update: PermissionEnum.SEASONS_UPDATE,
      delete: PermissionEnum.SEASONS_DELETE,
    },
  }),

  seasonByDate: leaguePermissionProcedure(PermissionEnum.SEASONS_READ)
    .input(z.object({ date: z.coerce.date() }))
    .output(SeasonNullable)
    .query(async ({ ctx, input }) => {
      return SeasonModel.getByDate(ctx.db, ctx.league.uuid, input.date);
    }),
});
