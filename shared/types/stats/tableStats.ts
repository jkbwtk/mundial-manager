import z from 'zod';
import { MatchSide } from '#shared/types/api/matchEvent';
import { AggregateStats } from '#shared/types/stats/generalStats';

export const TableStats = AggregateStats.extend({
  winningSidesCount: z.partialRecord(MatchSide, z.number().int().nonnegative()),
});
export type TableStats = z.infer<typeof TableStats>;
