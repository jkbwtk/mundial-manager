import { createPrivateKey, createPublicKey } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type Cookies from 'cookies';
import jwt, { type SignOptions, type VerifyOptions } from 'jsonwebtoken';
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

export function sign(payload: string | object, options?: SignOptions) {
  const { privKey } = loadRSAKeys();

  return jwt.sign(payload, privKey, {
    algorithm: 'RS256',
    expiresIn: '4 weeks',
    ...options,
  });
}

export function verify(token: string, options?: VerifyOptions) {
  const { pubKey } = loadRSAKeys();

  return jwt.verify(token, pubKey, { algorithms: ['RS256'], ...options });
}

export function getJWTContext(cookies: Cookies): JWTContext | null {
  try {
    const cookie = cookies.get(environment.JWT_COOKIE_NAME);

    if (!cookie) {
      return null;
    }

    const rawData = verify(cookie);

    return JWTContext.parse(rawData);
  } catch (err) {
    logger.error('Failed to verify JWT token', {
      label: ['jwt', 'getJWTContext'],
      error: err,
    });

    cookies.set(environment.JWT_COOKIE_NAME, null);
  }

  return null;
}
