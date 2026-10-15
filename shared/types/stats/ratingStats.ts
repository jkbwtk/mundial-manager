import z from 'zod';
import { Glicko2Rating } from '#shared/types/stats/ratingSystem';

export const RatingSubjectEnum = {
  PLAYER: 'PLAYER',
  TEAM: 'TEAM',
  TEAM_INDIVIDUAL: 'TEAM_INDIVIDUAL',
  HYBRID: 'HYBRID',
} as const;

export const RatingSubject = z.enum(RatingSubjectEnum);
export type RatingSubject = z.infer<typeof RatingSubject>;

export const RatingSubjects = Object.values(RatingSubjectEnum);

export const RatingValue = Glicko2Rating.partial().extend({
  rating: z.number(),
});
export type RatingValue = z.infer<typeof RatingValue>;

export const RatingStats = RatingValue.extend({
  ratingChange: z.number(),
  matches: z.number().int().nonnegative(),
});
export type RatingStats = z.infer<typeof RatingStats>;
