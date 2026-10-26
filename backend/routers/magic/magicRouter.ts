import Cookies from 'cookies';
import { Router } from 'express';
import { db } from '#backend/db/database';
import { PushSubscriptionModel } from '#backend/db/models/PushSubscriptionModel';
import { environment } from '#backend/environment';
import { getClientUuid } from '#blib/clientCookie';
import {
  getCookieSecurity,
  getJWTContext,
  getJWTCookieOptions,
  sign,
} from '#blib/jwt';
import { MAGIC_LINK_TOKEN_KEY } from '#blib/magicLink';
import { logger } from '#shared/logger';

export async function createMagicRouter() {
  const magicRouter = Router();

  magicRouter.get('/', async (req, res) => {
    const cookies = new Cookies(req, res);
    const rawData = req.query[MAGIC_LINK_TOKEN_KEY];

    const jwt = await getJWTContext(String(rawData));

    if (jwt === null) {
      logger.warn('Invalid magic link token', {
        label: ['magic-router'],
        rawData,
      });

      res.redirect(environment.BASE_SITE_URL);
    } else {
      const newJwt = await sign({
        ...jwt,
        origin: 'magic-router',
        redirectTo: null,
      });

      cookies.set(
        environment.JWT_COOKIE_NAME,
        newJwt,
        getJWTCookieOptions(getCookieSecurity(req), new Date(jwt.exp * 1000)),
      );

      const clientUuid = getClientUuid(cookies);

      if (jwt.leagueUuid !== null && clientUuid !== null) {
        await PushSubscriptionModel.refreshClient(db, jwt.leagueUuid, {
          clientUuid,
          role: jwt.role,
          expiresAt: new Date(jwt.exp * 1000),
        }).catch((err) => {
          logger.warn(
            'Failed to refresh push subscription of client %s',
            clientUuid,
            {
              label: ['magic-router'],
              error: err,
            },
          );
        });
      }

      res.redirect(jwt.redirectTo ?? environment.BASE_SITE_URL);
    }
  });

  return magicRouter;
}
