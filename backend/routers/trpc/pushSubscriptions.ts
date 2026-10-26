import { PushSubscriptionModel } from '#backend/db/models/PushSubscriptionModel';
import { getClientUuid, getOrCreateClientUuid } from '#blib/clientCookie';
import { leaguePermissionProcedure, router } from '#blib/trpc';
import { PermissionEnum } from '#shared/permissions';
import {
  PushSubscription,
  PushSubscriptionCurrent,
  PushSubscriptionSave,
} from '#shared/types/api/pushSubscription';

export const pushSubscriptionsRouter = router({
  getCurrent: leaguePermissionProcedure(PermissionEnum.MATCHES_READ)
    .output(PushSubscriptionCurrent)
    .query(async ({ ctx }) => {
      return PushSubscriptionModel.getCurrent(
        ctx.db,
        ctx.league.uuid,
        getClientUuid(ctx.cookies),
      );
    }),

  save$: leaguePermissionProcedure(PermissionEnum.MATCHES_READ)
    .input(PushSubscriptionSave)
    .output(PushSubscription)
    .mutation(async ({ ctx, input }) => {
      return PushSubscriptionModel.save(
        ctx.db,
        ctx.league.uuid,
        {
          clientUuid: getOrCreateClientUuid(ctx.cookies, ctx.cookieSecurity),
          role: ctx.jwt.role,
          expiresAt: new Date(ctx.jwt.exp * 1000),
        },
        input,
      );
    }),
});
