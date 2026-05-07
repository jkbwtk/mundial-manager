import z from 'zod';

export const JWTContext = z.object({
  uuid: z.uuid(),

  origin: z.string().min(1).default('unknown'),

  admin: z.boolean().default(false),
  leagueUuid: z.uuid().nullable().default(null),

  redirectTo: z.string().nullable().default(null),

  iat: z.coerce.number().int().positive(),
  exp: z.coerce.number().int().positive(),
});
export type JWTContext = z.infer<typeof JWTContext>;

export const JWTContextCreate = JWTContext.partial({ iat: true, exp: true });
export type JWTContextCreate = z.infer<typeof JWTContextCreate>;
