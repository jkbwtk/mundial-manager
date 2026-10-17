import { mergeAggregateStats } from '#shared/stats/generalStats';
import { mergeCounts } from '#shared/stats/utils';
import type { StatsRow } from '#shared/types/stats/statsRow';
import type { TableStats } from '#shared/types/stats/tableStats';

export function calculateTableStats(
  previous: TableStats | null,
  row: StatsRow,
): TableStats {
  const winningSidesCount: TableStats['winningSidesCount'] =
    row.winningSide === null ? {} : { [row.winningSide]: 1 };

  if (previous === null) return { ...row.general, winningSidesCount };

  return {
    ...mergeAggregateStats(previous, row.general),
    winningSidesCount: mergeCounts(
      previous.winningSidesCount,
      winningSidesCount,
    ),
  };
}
