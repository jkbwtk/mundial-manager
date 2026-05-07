import { createPrivateKey, createPublicKey } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type Cookies from 'cookies';
import type { DecryptOptions, EncryptOptions, JWTPayload } from 'jose';
import * as jose from 'jose';
import { environment } from '#backend/environment';
import { JWTContext } from '#backend/types/auth';
import { memoized } from '#blib/memoized';
import { logger } from '#shared/logger';

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
    .setExpirationTime('4 weeks')
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

export async function getJWTContext(jwt: string): Promise<JWTContext | null> {
  try {
    const rawData = await verify(jwt);

    return JWTContext.parse(rawData);
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
