import z from 'zod';
import {
  convertFromLegacyMatch,
  convertToLegacyMatch,
  getLegacyFloorFromTable,
} from '#backend/adapters/matchAdapter';
import { GoalTypeModel } from '#backend/db/models/GoalTypeModel';
import { MatchModel } from '#backend/db/models/MatchModel';
import { MatchTimelineModel } from '#backend/db/models/MatchTimelineModel';
import { PlayerModel } from '#backend/db/models/PlayerModel';
import { TableModel } from '#backend/db/models/TableModel';
import { leaguePermissionProcedure, router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcOps';
import { zodEncode } from '#blib/utils';
import { PermissionEnum } from '#shared/permissions';
import {
  Match,
  MatchCreate,
  MatchesBySyncIds,
  MatchQueryMeta,
  MatchUpdate,
  SyncId,
} from '#shared/types/api/match';
import { MatchFullCreate } from '#shared/types/api/matchFull';
import { MatchCreate as LegacyMatchCreate } from '#shared/types/Sheets';

export const matchesRouter = router({
  ...createCrudOps({
    publicSchema: Match,
    createSchema: MatchCreate,
    updateSchema: MatchUpdate,
    model: MatchModel,
    queryMetaSchema: MatchQueryMeta,
    permissions: {
      read: PermissionEnum.MATCHES_READ,
      create: PermissionEnum.MATCHES_CREATE,
      update: PermissionEnum.MATCHES_UPDATE,
      delete: PermissionEnum.MATCHES_DELETE,
    },
  }),

  getBySyncIds: leaguePermissionProcedure(PermissionEnum.MATCHES_READ)
    .input(MatchesBySyncIds)
    .output(Match.array())
    .query(async ({ ctx, input }) => {
      return MatchModel.getBySyncIds(ctx.db, ctx.league.uuid, input.syncIds);
    }),

  createFull: leaguePermissionProcedure(PermissionEnum.MATCHES_CREATE)
    .input(MatchFullCreate)
    .output(Match)
    .mutation(async ({ ctx, input }) => {
      return MatchModel.createFull(ctx.db, ctx.league.uuid, input);
    }),

  getLegacy: leaguePermissionProcedure([
    PermissionEnum.MATCHES_READ,
    PermissionEnum.PLAYERS_READ,
  ]).query(async ({ ctx }) => {
    const matches = await MatchModel.getAllFull(ctx.db, ctx.league.uuid);
    const players = await PlayerModel.getAll(ctx.db, ctx.league.uuid);
    const playersDict = Object.fromEntries(
      players.map((player) => [player.uuid, player]),
    );
    const goalTypes = await GoalTypeModel.getAll(ctx.db, ctx.league.uuid);
    const goalTypesDict = Object.fromEntries(
      goalTypes.map((goalType) => [goalType.uuid, goalType]),
    );

    return matches.map((match, index) =>
      convertToLegacyMatch(match, playersDict, goalTypesDict, index + 1),
    );
  }),

  createLegacy: leaguePermissionProcedure(PermissionEnum.MATCHES_CREATE)
    .input(
      zodEncode(
        z.object({
          match: LegacyMatchCreate,
          syncId: SyncId.nullish().default(null),
        }),
      ),
    )
    .mutation(async ({ ctx, input: { match, syncId } }) => {
      const players = await PlayerModel.getAll(ctx.db, ctx.league.uuid);
      const playersDict = Object.fromEntries(
        players.map((player) => [player.name, player]),
      );

      const tables = await TableModel.getAll(ctx.db, ctx.league.uuid);
      const tablesDict = Object.fromEntries(
        tables.map((table) => [getLegacyFloorFromTable(table), table]),
      );

      const goalTypes = await GoalTypeModel.getAll(ctx.db, ctx.league.uuid);

      const matchFullCreate = convertFromLegacyMatch(
        match,
        tablesDict,
        playersDict,
        Object.fromEntries(
          goalTypes.map((goalType) => [goalType.key, goalType]),
        ),
        syncId ?? null,
      );

      const instance = await MatchModel.createFull(
        ctx.db,
        ctx.league.uuid,
        matchFullCreate,
      );
      const events = await MatchTimelineModel.getEventsByMatchId(
        ctx.db,
        ctx.league.uuid,
        instance.uuid,
      );

      return convertToLegacyMatch(
        { ...instance, events },
        Object.fromEntries(players.map((player) => [player.uuid, player])),
        Object.fromEntries(
          goalTypes.map((goalType) => [goalType.uuid, goalType]),
        ),
      );
    }),
});
