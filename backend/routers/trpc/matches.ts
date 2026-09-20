import z from 'zod';
import {
  convertFromLegacyMatch,
  convertToLegacyMatch,
  getLegacyFloorFromTable,
} from '#backend/adapters/matchAdapter';
import { MatchModel } from '#backend/db/models/MatchModel';
import { MatchTimelineModel } from '#backend/db/models/MatchTimelineModel';
import { PlayerModel } from '#backend/db/models/PlayerModel';
import { TableModel } from '#backend/db/models/TableModel';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcOps';
import { zodEncode } from '#blib/utils';
import {
  Match,
  MatchCreate,
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
  }),

  createFull: leagueScopedProcedure
    .input(MatchFullCreate)
    .output(Match)
    .mutation(async ({ ctx, input }) => {
      return MatchModel.createFull(ctx.db, ctx.league.uuid, input);
    }),

  getLegacy: leagueScopedProcedure.query(async ({ ctx }) => {
    const matches = await MatchModel.getAllFull(ctx.db, ctx.league.uuid);
    const players = await PlayerModel.getAll(ctx.db, ctx.league.uuid);
    const playersDict = Object.fromEntries(
      players.map((player) => [player.uuid, player]),
    );

    return matches.map((match, index) =>
      convertToLegacyMatch(match, playersDict, index + 1),
    );
  }),

  createLegacy: leagueScopedProcedure
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

      const matchFullCreate = convertFromLegacyMatch(
        match,
        tablesDict,
        playersDict,
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

      return convertToLegacyMatch({ ...instance, events }, playersDict);
    }),
});
