import { randomUUID } from 'node:crypto';
import type Cookies from 'cookies';
import z from 'zod';
import { environment } from '#backend/environment';
import { type CookieSecurity, getJWTCookieOptions } from '#blib/jwt';
import { DAY_MS } from '#shared/timeUtils';

const CLIENT_COOKIE_MAX_AGE_MS = 400 * DAY_MS;

export function getClientUuid(cookies: Cookies): string | null {
  const parsed = z
    .uuid()
    .safeParse(cookies.get(environment.CLIENT_COOKIE_NAME));

  return parsed.success ? parsed.data : null;
}

export function getOrCreateClientUuid(
  cookies: Cookies,
  security: CookieSecurity,
): string {
  const clientUuid = getClientUuid(cookies) ?? randomUUID();

  cookies.set(
    environment.CLIENT_COOKIE_NAME,
    clientUuid,
    getJWTCookieOptions(
      security,
      new Date(Date.now() + CLIENT_COOKIE_MAX_AGE_MS),
    ),
  );

  return clientUuid;
}
