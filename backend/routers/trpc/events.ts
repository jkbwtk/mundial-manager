import { TRPCError } from '@trpc/server';
import {
  LeagueEventTopicPermissions,
  streamLeagueEvents,
} from '#blib/leagueEvents';
import { leagueScopedProcedure, router } from '#blib/trpc';
import { hasPermissions, RolePermissions } from '#shared/permissions';
import { LeagueEventSubscription } from '#shared/types/api/leagueEvent';

export const eventsRouter = router({
  onLeagueEvent: leagueScopedProcedure
    .input(LeagueEventSubscription)
    .subscription(async function* ({ ctx, input, signal }) {
      const permissions = RolePermissions[ctx.jwt.role];
      const isAllowed = input.topics.every((topic) =>
        hasPermissions(permissions, LeagueEventTopicPermissions[topic]),
      );

      if (!isAllowed) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        });
      }

      yield* streamLeagueEvents(ctx.db, ctx.league.uuid, input.topics, signal);
    }),
});
