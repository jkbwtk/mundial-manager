import { createPrivateKey, createPublicKey } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { IncomingMessage } from 'node:http';
import { resolve } from 'node:path';
import type Cookies from 'cookies';
import type { DecryptOptions, EncryptOptions, JWTPayload } from 'jose';
import * as jose from 'jose';
import { environment } from '#backend/environment';
import { InsecureConnectionError } from '#backend/errors/http';
import { JWTContext } from '#backend/types/auth';
import { memoized } from '#blib/memoized';
import { logger } from '#shared/logger';

export type CookieSecurity =
  | { type: 'secure' }
  | { type: 'insecure' }
  | { type: 'forbidden'; host: string };

const JWT_CONTEXT_CACHE_SIZE = 1_000;

const jwtContextCache = new Map<string, JWTContext>();

const loadRSAKeys = memoized(() => {
  try {
    const pubKeyPath = resolve(process.cwd(), environment.PUB_KEY_PATH);
    const privKeyPath = resolve(process.cwd(), environment.PRIV_KEY_PATH);

    const pubKey = readFileSync(pubKeyPath, 'utf-8');
    const privKey = readFileSync(privKeyPath, 'utf-8');

    return {
      pubKey: createPublicKey(pubKey),
      privKey: createPrivateKey({
        key: privKey,
        passphrase: environment.KEY_PASSPHRASE,
      }),
    };
  } catch (err) {
    logger.error('Failed to load RSA keys', {
      label: ['jwt', 'loadRSAKeys'],
      error: err,
    });

    process.exit(1);
  }
});

export function sign<T extends JWTPayload>(
  payload: T,
  options?: EncryptOptions,
) {
  const { pubKey } = loadRSAKeys();

  return new jose.EncryptJWT(payload)
    .setProtectedHeader({
      alg: 'RSA-OAEP-256',
      enc: 'A256GCM',
    })
    .setIssuedAt()
    .setExpirationTime('1 year')
    .encrypt(pubKey, options);
}

export function verify(token: string, options?: DecryptOptions) {
  const { privKey } = loadRSAKeys();

  return jose
    .jwtDecrypt(token, privKey, {
      ...options,
    })
    .then((result) => result.payload);
}

function cacheJWTContext(jwt: string, context: JWTContext): void {
  jwtContextCache.set(jwt, context);

  if (jwtContextCache.size <= JWT_CONTEXT_CACHE_SIZE) return;

  const oldestJWT = jwtContextCache.keys().next().value;

  if (oldestJWT !== undefined) jwtContextCache.delete(oldestJWT);
}

export async function getJWTContext(jwt: string): Promise<JWTContext | null> {
  const cachedContext = jwtContextCache.get(jwt);

  if (cachedContext !== undefined && cachedContext.exp * 1000 > Date.now()) {
    return cachedContext;
  }

  try {
    const rawData = await verify(jwt);
    const context = JWTContext.parse(rawData);

    cacheJWTContext(jwt, context);

    return context;
  } catch (err) {
    logger.error('Failed to verify JWT token', {
      label: ['jwt', 'getJWTContext'],
      error: err,
    });
  }

  return null;
}

export async function getJWTContextFromCookies(
  cookies: Cookies,
): Promise<JWTContext | null> {
  const cookie = cookies.get(environment.JWT_COOKIE_NAME);

  if (!cookie) {
    return null;
  }

  const context = await getJWTContext(cookie);

  if (!context) {
    cookies.set(environment.JWT_COOKIE_NAME, null);
  }

  return context;
}

function isSecureRequest(req: IncomingMessage): boolean {
  return (
    (req as IncomingMessage & { secure?: boolean }).secure === true ||
    (req.socket as { encrypted?: boolean }).encrypted === true
  );
}

function getRequestHost(req: IncomingMessage): string {
  const hostname = (req as IncomingMessage & { hostname?: string }).hostname;
  const host = hostname ?? req.headers.host ?? '';

  try {
    return new URL(`http://${host}`).hostname.replace(/^\[|\]$/g, '');
  } catch {
    return host;
  }
}

export function getCookieSecurity(req: IncomingMessage): CookieSecurity {
  if (isSecureRequest(req)) return { type: 'secure' };

  const host = getRequestHost(req);

  if (
    !environment.PRODUCTION ||
    environment.INSECURE_COOKIE_HOSTS.includes(host)
  ) {
    return { type: 'insecure' };
  }

  return { type: 'forbidden', host };
}

export function getJWTCookieOptions(
  security: CookieSecurity,
  expires: Date,
): Cookies.SetOption {
  if (security.type === 'forbidden') {
    throw new InsecureConnectionError(security.host);
  }

  return {
    httpOnly: true,
    secure: environment.PRODUCTION && security.type === 'secure',
    sameSite: 'lax',
    overwrite: true,
    expires,
  };
}
