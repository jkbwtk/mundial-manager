import Cookies from 'cookies';
import { Router } from 'express';
import { environment } from '#backend/environment';
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

      res.redirect(jwt.redirectTo ?? environment.BASE_SITE_URL);
    }
  });

  return magicRouter;
}
