import z from 'zod';

export const RatingSystemEnum = {
  ELO: 'ELO',
  GLICKO2: 'GLICKO2',
} as const;

export const RatingSystem = z.enum(RatingSystemEnum);
export type RatingSystem = z.infer<typeof RatingSystem>;

export const RatingSystems = Object.values(RatingSystemEnum);

export const EloParams = z.object({
  enabled: z.boolean(),

  defaultRating: z.number(),

  kFactorRanges: z.record(z.string(), z.number()),
  scoreMultipliers: z.record(z.string(), z.number()),
});
export type EloParams = z.infer<typeof EloParams>;

export const Glicko2Params = z.object({
  enabled: z.boolean(),

  defaultRating: z.number(),
  defaultRd: z.number().positive(),
  defaultVolatility: z.number().positive(),

  tau: z.number().positive(),
});
export type Glicko2Params = z.infer<typeof Glicko2Params>;

export const RatingSystemsConfig = z.object({
  ELO: EloParams,
  GLICKO2: Glicko2Params,
});
export type RatingSystemsConfig = z.infer<typeof RatingSystemsConfig>;

export const EloRating = z.object({
  rating: z.number(),
});
export type EloRating = z.infer<typeof EloRating>;

export const Glicko2Rating = z.object({
  rating: z.number(),
  rd: z.number().positive(),
  volatility: z.number().positive(),
});
export type Glicko2Rating = z.infer<typeof Glicko2Rating>;

export interface RatingMatchup<Rating> {
  own: Rating;
  side: Rating;
  opponent: Rating;

  score: number;
  opponentScore: number;
}

export interface RatingSystemDefinition<Params, Rating extends EloRating> {
  initial: (params: Params) => Rating;
  combine: (ratings: Rating[]) => Rating;
  update: (params: Params, matchup: RatingMatchup<Rating>) => Rating;
}
