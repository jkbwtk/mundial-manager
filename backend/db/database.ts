import { drizzle } from 'drizzle-orm/node-postgres';
import { relations } from '#backend/db/relations';
import { environment } from '#backend/environment';

export const db = drizzle({
  connection: {
    host: environment.POSTGRES_HOST,
    port: environment.POSTGRES_PORT,
    user: environment.POSTGRES_USER,
    password: environment.POSTGRES_PASSWORD,
    database: environment.POSTGRES_DB,
  },
  relations,
});

export type DB = typeof db;
