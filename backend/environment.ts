import { z } from 'zod';
import { lazyObject } from '#blib/lazyObject';
import { logger } from '#shared/logger';

export const Environment = z.object({
  PRODUCTION: z.boolean().default(true),

  SERVER_PORT: z.coerce.number().int().positive().max(65535).default(5020),
  GOOGLE_DOCS_API_EMAIL: z.email(),
  GOOGLE_DOCS_API_KEY: z
    .string()
    .min(1)
    .transform((val) => val.replace(/\\n/g, '\n')),
  GOOGLE_DOCS_SPREADSHEET_ID: z.string().min(1),
  DISCORD_WEBHOOK_ID: z.string().min(1).nullable().default(null),
  DISCORD_WEBHOOK_TOKEN: z.string().min(1).nullable().default(null),
  MANAGER_ICON_URL: z.string().url().nullable().default(null),

  POSTGRES_HOST: z.string().min(1),
  POSTGRES_PORT: z.coerce.number().int().positive().max(65535),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASS: z.string().min(1),
  POSTGRES_DB: z.string().min(1),

  JWT_COOKIE_NAME: z.string().min(1),

  KEY_PASSPHRASE: z.string().min(1).optional(),
  PUB_KEY_PATH: z.string().min(1),
  PRIV_KEY_PATH: z.string().min(1),

  DIST_DIR: z.string().min(1).default('./dist'),

  NGINX_PARAM_KEY: z.string().min(1).optional(),
  NGINX_SECRET: z.string().min(1).optional(),

  BASE_SITE_URL: z.url().transform((url) => new URL('/', url).toString()),

  DATABASE_LOGGING: z.coerce.boolean().default(false),

  VITE_CALCULATOR_URL: z.string(),

  RABBITMQ_USER: z.string().min(1),
  RABBITMQ_PASS: z.string().min(1),
  RABBITMQ_HOST: z.string().min(1),
  RABBITMQ_PORT: z.coerce.number().int().positive().max(65535),
});

export type Environment = z.infer<typeof Environment>;

export const environment = lazyObject(() => {
  const parsedEnvironment = Environment.safeParse({
    ...process.env,
    PRODUCTION: String(process.env.NODE_ENV).toLowerCase() === 'production',
  });

  if (!parsedEnvironment.success) {
    logger.error(
      'Failed to parse environment variables:\n%s',
      z.prettifyError(parsedEnvironment.error),
      {
        label: 'environment',
      },
    );

    process.exit(1);
  }

  return parsedEnvironment.data;
});
