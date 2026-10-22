import z from 'zod';
import { defaultSkillParams } from '#shared/defaults/ratingSystem';

export const RatingSystemEnum = {
  ELO: 'ELO',
  GLICKO2: 'GLICKO2',
  SKILL: 'SKILL',
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

export const SkillParams = z.object({
  enabled: z.boolean(),

  defaultRating: z.number(),
  defaultRd: z.number().positive(),

  driftPerDay: z.number().nonnegative(),
  goalWeight: z.number().positive(),
  extraPlayerAdvantage: z.number(),

  tolerance: z.number().positive(),
  maxSweeps: z.int().positive(),

  conservativeDeviations: z.number().nonnegative(),
});
export type SkillParams = z.infer<typeof SkillParams>;

export const RatingSystemsConfig = z.object({
  ELO: EloParams,
  GLICKO2: Glicko2Params,
  SKILL: SkillParams.default(defaultSkillParams),
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

export const SkillRating = z.object({
  rating: z.number(),
  rd: z.number().positive(),
});
export type SkillRating = z.infer<typeof SkillRating>;

export interface RatingMatchSide {
  subjects: string[];
  score: number;
}

export interface RatingMatch<Params> {
  params: Params;
  day: number; // whole days since the epoch

  stakesModifier: number;

  sides: [RatingMatchSide, RatingMatchSide];
}

export interface RatingResult<Rating> {
  subject: string;

  before: Rating | null;
  after: Rating;
}

export interface RatingSystemDefinition<
  Params,
  Rating extends EloRating,
  State,
> {
  initial: (params: Params) => Rating;
  create: () => State;
  rate: (state: State, match: RatingMatch<Params>) => RatingResult<Rating>[];
}
