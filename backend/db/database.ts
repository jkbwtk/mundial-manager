import { drizzle } from 'drizzle-orm/node-postgres';
import { PgAsyncTransaction } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';
import { relations } from '#backend/db/relations';
import { environment } from '#backend/environment';
import { lazyObject } from '#blib/lazyObject';
import { logger } from '#shared/logger';

export const db = lazyObject(() => {
  const client = new Pool({
    host: environment.POSTGRES_HOST,
    port: environment.POSTGRES_PORT,
    user: environment.POSTGRES_USER,
    password: environment.POSTGRES_PASS,
    database: environment.POSTGRES_DB,

    allowExitOnIdle: false,
    keepAlive: true,
    connectionTimeoutMillis: 500,
  });

  return drizzle({
    client,
    relations,
    logger: environment.DATABASE_LOGGING ? logger : false,
  });
});

export type DB = typeof db;

export type TX = Parameters<Parameters<DB['transaction']>[0]>[0];

export function isTransaction(db: DB | TX): db is TX {
  return db instanceof PgAsyncTransaction;
}
