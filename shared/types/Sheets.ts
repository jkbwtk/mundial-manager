import dayjs from 'dayjs';
import z from 'zod';

export interface SheetMetadata {
  title: string;
  timezone: string;
  locale: string;
  rows: number;
  columns: number;
}

export const Match = z.object({
  id: z.number().int().nonnegative(),
  team1: z.string(),
  team2: z.string(),
  score1: z.number().int().min(0),
  score2: z.number().int().min(0),
  floor: z.number().int().optional().nullable().default(null).catch(null),
  winningColor: z.string().optional().default('unknown').catch('unknown'),
  duration: z.codec(
    z.number().optional().nullable().default(null).catch(null),
    z.number().optional().nullable().default(null),
    {
      decode: (val) => (val ? val * 24 * 60 : null),
      encode: (val) => (val ? val / (24 * 60) : null),
    },
  ),
  date: z.codec(
    z.number().int().optional().nullable().default(null).catch(null),
    z.number().int().optional().nullable().default(null),
    {
      decode: (val) =>
        val ? dayjs('1899-12-30T12:00:00Z').add(val, 'days').unix() : null,
      encode: (val) =>
        val
          ? dayjs
              .unix(val)
              .hour(11)
              .diff(dayjs('1899-12-30T12:00:00Z'), 'days') + 1
          : null,
    },
  ),
});

export type Match = z.infer<typeof Match>;

export type MatchWithoutId = Omit<Match, 'id'>;

export const MatchCreate = Match.omit({ id: true, floor: true });

export type MatchCreate = z.infer<typeof MatchCreate>;
