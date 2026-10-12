import { URLSearchParams } from 'node:url';
import { environment } from '#backend/environment';
import type { JWTContextCreate } from '#backend/types/auth';
import { sign } from '#blib/jwt';

export const MAGIC_LINK_TOKEN_KEY = 'token';

export async function createMagicLink(
  payload: Omit<JWTContextCreate, 'iat' | 'exp'>,
  expirationTime?: number | string | Date,
): Promise<string> {
  const jwt = await sign(payload, expirationTime);

  const params = new URLSearchParams();

  params.set(MAGIC_LINK_TOKEN_KEY, jwt);

  if (environment.NGINX_PARAM_KEY && environment.NGINX_SECRET) {
    params.set(environment.NGINX_PARAM_KEY, environment.NGINX_SECRET);
  }

  return new URL(`/magic?${params}`, environment.BASE_SITE_URL).toString();
}
