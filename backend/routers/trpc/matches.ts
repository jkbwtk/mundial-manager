import {
  convertFromLegacyMatch,
  convertToLegacyMatch,
  getLegacyFloorFromTable,
} from '#backend/adapters/matchAdapter';
import { MatchEventModel } from '#backend/db/models/MatchEventModel';
import { MatchModel } from '#backend/db/models/MatchModel';
import { PlayerModel } from '#backend/db/models/PlayerModel';
import { TableModel } from '#backend/db/models/TableModel';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcOps';
import { zodEncode } from '#blib/utils';
import {
  Match,
  MatchCreate,
  MatchQueryMeta,
  MatchUpdate,
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
      const instance = await runWithErrorConversion(() =>
        MatchModel.createFull(ctx.db, ctx.league.uuid, input),
      );

      return instance;
    }),

  getLegacy: leagueScopedProcedure.query(async ({ ctx }) => {
    const matches = await runWithErrorConversion(() =>
      MatchModel.getAllFull(ctx.db, ctx.league.uuid),
    );
    const players = await runWithErrorConversion(() =>
      PlayerModel.getAll(ctx.db, ctx.league.uuid),
    );
    const playersDict = Object.fromEntries(
      players.map((player) => [player.uuid, player]),
    );

    return matches.map((match, index) =>
      convertToLegacyMatch(match, playersDict, index + 1),
    );
  }),

  createLegacy: leagueScopedProcedure
    .input(zodEncode(LegacyMatchCreate))
    .mutation(async ({ ctx, input: match }) => {
      const players = await runWithErrorConversion(() =>
        PlayerModel.getAll(ctx.db, ctx.league.uuid),
      );
      const playersDict = Object.fromEntries(
        players.map((player) => [player.name, player]),
      );

      const tables = await runWithErrorConversion(() =>
        TableModel.getAll(ctx.db, ctx.league.uuid),
      );
      const tablesDict = Object.fromEntries(
        tables.map((table) => [getLegacyFloorFromTable(table), table]),
      );

      const matchFullCreate = convertFromLegacyMatch(
        match,
        tablesDict,
        playersDict,
      );

      const instance = await runWithErrorConversion(() =>
        MatchModel.createFull(ctx.db, ctx.league.uuid, matchFullCreate),
      );
      const events = await runWithErrorConversion(() =>
        MatchEventModel.getByMatchId(ctx.db, ctx.league.uuid, instance.uuid),
      );

      const fullMatch = {
        ...instance,
        events: await Promise.all(
          events.map((event) => MatchEventModel.mapToPublic(ctx.db, event)),
        ),
      };

      return convertToLegacyMatch(fullMatch, playersDict);
    }),
});
