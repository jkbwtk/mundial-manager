import { drizzle } from 'drizzle-orm/node-postgres';
import { relations } from '#backend/db/relations';
import { environment } from '#backend/environment';
import { lazyObject } from '#blib/lazyObject';
import { logger } from '#shared/logger';

export const db = lazyObject(() =>
  drizzle({
    connection: {
      host: environment.POSTGRES_HOST,
      port: environment.POSTGRES_PORT,
      user: environment.POSTGRES_USER,
      password: environment.POSTGRES_PASSWORD,
      database: environment.POSTGRES_DB,

      allowExitOnIdle: false,
      keepAlive: true,
    },
    relations,
    logger: environment.DATABASE_LOGGING ? logger : false,
  }),
);

export type DB = typeof db;

export type TX = Parameters<Parameters<DB['transaction']>[0]>[0];
