import z from 'zod';
import {
  convertFromLegacyMatch,
  convertToLegacyMatch,
} from '#backend/adapters/matchAdapter';
import { MatchEventModel } from '#backend/db/models/MatchEventModel';
import { MatchModel } from '#backend/db/models/MatchModel';
import { PlayerModel } from '#backend/db/models/PlayerModel';
import { TableModel } from '#backend/db/models/TableModel';
import { zodEncode } from '#backend/lib/utils';
import { runWithErrorConversion } from '#blib/modelErrors';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { type Match, MatchCreate } from '#shared/types/Sheets';

export const sheetsRouter = router({
  matches: leagueScopedProcedure.query(async ({ ctx }) => {
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
  createMatch: leagueScopedProcedure
    .input(zodEncode(MatchCreate))
    .mutation(async ({ ctx, input: match }) => {
      const players = await runWithErrorConversion(() =>
        PlayerModel.getAll(ctx.db, ctx.league.uuid),
      );
      const playersDict = Object.fromEntries(
        players.map((player) => [player.uuid, player]),
      );

      const tables = await runWithErrorConversion(() =>
        TableModel.getAll(ctx.db, ctx.league.uuid),
      );
      const tablesDict = Object.fromEntries(
        tables.map((table) => [table.uuid, table]),
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
  createMatches: leagueScopedProcedure
    .input(zodEncode(z.array(MatchCreate)))
    .mutation(async () => {
      throw new Error('Not implemented');
    }),
  onMatchAdded: leagueScopedProcedure
    .input(
      z.object({ lastEventId: z.coerce.number().int().nullish() }).optional(),
    )
    .subscription(async function* () {
      yield {} as { data: Match };
    }),
});
