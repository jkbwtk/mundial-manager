import { randomUUID } from 'node:crypto';
import { URLSearchParams } from 'node:url';
import Cookies from 'cookies';
import { Router } from 'express';
import { environment } from '#backend/environment';
import { getJWTContext, sign } from '#backend/jwt';
import type { JWTContextCreate } from '#backend/types/auth';
import { ExpressStack } from '#blib/ExpressStack';
import { logger } from '#shared/logger';

const MAGIC_LINK_TOKEN_KEY = 'token';

async function createAdminMagicLink() {
  const adminJWT = await sign({
    uuid: randomUUID(),

    origin: 'magic-router-admin-jwt',

    admin: true,
    leagueUuid: null,

    redirectTo: '/admin',
  } satisfies JWTContextCreate);

  const params = new URLSearchParams();

  params.set(MAGIC_LINK_TOKEN_KEY, adminJWT);

  if (environment.NGINX_PARAM_KEY && environment.NGINX_SECRET) {
    params.set(environment.NGINX_PARAM_KEY, environment.NGINX_SECRET);
  }

  return new URL(`/magic?${params}`, environment.BASE_SITE_URL).toString();
}

export async function createMagicRouter() {
  const magicRouter = Router();

  const adminJWT = await createAdminMagicLink();

  logger.info('Admin magic link generated, %s', adminJWT, {
    label: ['magic-router'],
  });

  magicRouter.get(
    '/',
    new ExpressStack()
      .use(async (req, res) => {
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
          cookies.set(environment.JWT_COOKIE_NAME, String(rawData), {
            httpOnly: true,
            secure: environment.PRODUCTION,
            sameSite: 'lax',
            overwrite: true,
            expires: new Date(jwt.exp * 1000),
          });

          if (jwt.redirectTo) {
            res.redirect(jwt.redirectTo);
          } else {
            res.redirect(environment.BASE_SITE_URL);
          }
        }
      })
      .unwrap(),
  );

  return magicRouter;
}
