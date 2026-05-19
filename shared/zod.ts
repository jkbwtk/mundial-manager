import { z } from 'zod';

export const jsonCodec = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString);
        // biome-ignore lint/suspicious/noExplicitAny: yeah
      } catch (err: any) {
        ctx.issues.push({
          code: 'invalid_format',
          format: 'json',
          input: jsonString,
          message: err.message,
        });
        return z.NEVER;
      }
    },
    encode: (value) => JSON.stringify(value),
  });

export const hexColor = z
  .string()
  .regex(/^(#[0-9A-Fa-f]{6})|(0x[0-9A-Fa-f]{8})$/);

export const ZodPropertyError = z.object({
  errors: z.array(z.string()),
});

export type ZodPropertyError = z.infer<typeof ZodPropertyError>;

export const ZodLikeError = jsonCodec(
  z.object({
    name: z.string(),
    properties: z.record(z.string(), ZodPropertyError),
  }),
);

export type ZodLikeError = z.infer<typeof ZodLikeError>;

export const PaginatedResponse = <T extends z.core.$ZodType>(schema: T) => {
  return z.object({
    data: z.array(schema),
    total: z.number().nonnegative(),
  });
};
