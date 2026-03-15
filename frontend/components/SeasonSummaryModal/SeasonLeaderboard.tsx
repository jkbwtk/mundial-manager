import { createMemo } from 'solid-js';
import { DeltaDisplay } from '#components/DeltaDisplay';
import { Identicon } from '#components/Identicon';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { useStatPaginator } from '#components/StatPaginatorWidget';
import { type Column, Table } from '#components/Table';
import { createDeltaFrame } from '#flib/matchDataUtils';
import { DEFAULT_ELO } from '#flib/sheetUtils';
import style from './SeasonSummaryModal.module.scss';

const columns: Column[] = [
  { key: 'rank', header: '#', align: 'right', width: 3 },
  {
    key: 'player',
    header: 'Player',
    transform: (val) => (
      <>
        <Identicon value={val} size={1} /> {val}
      </>
    ),
  },
  {
    key: 'elo',
    header: 'Elo',
    align: 'right',
    transform: (val) => val.toFixed(1),
  },
  {
    key: 'deltaElo',
    header: 'ΔElo',
    align: 'right',
    transform: (val) => <DeltaDisplay base={val as number} compared={0} />,
  },
  {
    key: 'wonLost',
    header: 'W-L',
    align: 'right',
  },
];

export const SeasonLeaderboard: Component = () => {
  const [state] = useStatPaginator();

  const curr = createMemo(() => state.aggregateFrame.frame);
  const prev = createMemo(() => state.aggregateFrame.previousFrame);

  const delta = createMemo(() => createDeltaFrame(curr(), prev(), false));

  const data = () =>
    Object.entries(curr().eloRatings.hybridElos)
      .map(([name]) => ({
        player: name,
        elo: curr().eloRatings.hybridElos[name]?.rating ?? DEFAULT_ELO,
        deltaElo: delta().eloRatings.hybridElos[name]?.ratingChange ?? 0,
        wonLost: `${delta().playerStats[name]?.wins ?? 0}-${delta().playerStats[name]?.losses ?? 0}`,
      }))
      .sort((a, b) => b.elo - a.elo)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return (
    <div class={style.leaderboardContainer}>
      <div class={style.sectionHeader}>
        <MaterialSymbol symbol="leaderboard" color="gray" />
        Leaderboard
      </div>

      <Table class={style.leaderboard} columns={columns} data={data()} />
    </div>
  );
};
