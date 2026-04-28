import { createPrivateKey, createPublicKey } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import jwt, { type SignOptions, type VerifyOptions } from 'jsonwebtoken';
import { environment } from '#backend/environment';
import { logger } from '#shared/logger';

function loadRSAKeys() {
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
}

const { pubKey, privKey } = loadRSAKeys();

export function sign(payload: string | object, options?: SignOptions) {
  return jwt.sign(payload, privKey, { algorithm: 'RS256', ...options });
}

export function verify(token: string, options?: VerifyOptions) {
  return jwt.verify(token, pubKey, { algorithms: ['RS256'], ...options });
}
