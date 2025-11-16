import z from 'zod';
import { MatchEvent } from '#shared/types/Sheets';

export const CalculatorFinishEvent = z.object({
  startedAt: z.number().int(), // unix timestamp

  events: z.array(MatchEvent),
  // history: z.array(z.string()),

  scores: z.tuple([z.number().int(), z.number().int()]),
  teams: z.tuple([z.array(z.string()), z.array(z.string())]),
});

export type CalculatorFinishEvent = z.infer<typeof CalculatorFinishEvent>;
