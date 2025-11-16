import z from 'zod';
import { MatchEvent } from '#shared/types/Sheets';

export const CalculatorFinishEvent = z.object({
  startedAt: z.number().int(), // unix timestamp

  events: z.array(MatchEvent).optional().nullable().default(null).catch(null),
  history: z.array(z.string()).optional().nullable().default(null).catch(null),

  scores: z.tuple([z.number().int(), z.number().int()]),
  teams: z.tuple([z.array(z.string()), z.array(z.string())]),
});

export type CalculatorFinishEvent = z.infer<typeof CalculatorFinishEvent>;
