import z from 'zod';
import { Match } from '#shared/types/api/match';
import { MatchEvent } from '#shared/types/api/matchEvent';

export const ActiveMatch = z.object({
  match: Match,
  events: MatchEvent.array(),

  updatedAt: z.coerce.date(), // last write to the match or its timeline
});
export type ActiveMatch = z.infer<typeof ActiveMatch>;

export const ActiveMatches = ActiveMatch.array();
export type ActiveMatches = z.infer<typeof ActiveMatches>;
