import { z } from 'zod';
import 'dotenv/config';

export const Environment = z.object({
  WEB_PORT: z.coerce.number().int().positive().default(4200),
  HMR_PORT: z.coerce.number().int().positive().default(5555),
  BUILD_MINIFY: z
    .union([z.literal('terser'), z.stringbool().pipe(z.literal(false))])
    .default('terser'),
  BUILD_SOURCEMAP: z.stringbool().default(false),
});

export type Environment = z.infer<typeof Environment>;

export const environment = Environment.parse(process.env);

export const isDev = process.env.NODE_ENV !== 'production';
