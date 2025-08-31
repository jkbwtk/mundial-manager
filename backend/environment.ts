import { logger } from '#shared/logger';
import 'dotenv/config';

import { z } from 'zod';

export const Environment = z.object({
  SERVER_PORT: z.coerce.number().int().positive().max(65535).default(5020),
  GOOGLE_DOCS_API_EMAIL: z.email(),
  GOOGLE_DOCS_API_KEY: z
    .string()
    .min(1)
    .transform((val) => val.replace(/\\n/g, '\n')),
  GOOGLE_DOCS_SPREADSHEET_ID: z.string().min(1),
});

export type Environment = z.infer<typeof Environment>;

const parsedEnvironment = Environment.safeParse(process.env);

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

export const environment = parsedEnvironment.data;
