import 'dotenv/config';

import { z } from 'zod';

export const Environment = z.object({
  SERVER_PORT: z.coerce.number().int().positive().max(65535).default(5020),
  GOOGLE_DOCS_API_KEY: z.string().min(1),
});

export type Environment = z.infer<typeof Environment>;

export const environment = Environment.parse(process.env);
