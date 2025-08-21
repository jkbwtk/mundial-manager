import { z } from 'zod';

const booleanLiteral = z.preprocess((v) => {
  try {
    if (typeof v === 'string') {
      return JSON.parse(v.toLowerCase());
    }

    return v;
  } catch {
    return v;
  }
}, z.boolean());

export const Environment = z.object({
  WEB_PORT: z.coerce.number().int().positive().default(4200),
  HMR_PORT: z.coerce.number().int().positive().default(5555),
  BUILD_MINIFY: z
    .union([
      z.literal('terser'),
      z.literal('esbuild'),
      booleanLiteral.pipe(z.literal(false)),
    ])
    .default('terser'),
  BUILD_SOURCEMAP: booleanLiteral.default(false),
});

export type Environment = z.infer<typeof Environment>;

export const environment = Environment.parse(process.env);

export const isDev = process.env.NODE_ENV !== 'production';
