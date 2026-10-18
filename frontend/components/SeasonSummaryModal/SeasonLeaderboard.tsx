import { DeltaDisplay } from '#components/DeltaDisplay';
import { Identicon } from '#components/Identicon';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { type Column, Table } from '#components/Table';
import { getGoalDifference, getWinRate } from '#flib/derivedStats';
import style from './SeasonSummaryModal.module.scss';
import type { SeasonSummaryData } from './seasonSummaryData';

const columns: Column[] = [
  {
    key: 'rank',
    header: '#',
    align: 'right',
    width: 3,
  },
  {
    key: 'player',
    header: 'Player',
    align: 'left',
    transform: (val, row) => (
      <>
        <Identicon value={row.playerUuid} size={1} /> {val}
      </>
    ),
  },
  {
    key: 'elo',
    header: 'Elo',
    align: 'right',
    transform: (val) => val?.toFixed(1),
  },
  {
    key: 'deltaElo',
    header: 'ΔElo',
    align: 'right',
    transform: (val) => <DeltaDisplay base={val as number} compared={0} />,
  },
  {
    key: 'deltaGoals',
    header: 'ΔGoals',
    align: 'right',
    transform: (val) => <DeltaDisplay base={val as number} compared={0} />,
  },
  {
    key: 'wonLost',
    header: 'W-L',
    align: 'right',
  },
  {
    key: 'winRate',
    header: 'Win%',
    align: 'right',
    transform: (val) => (val === null ? null : `${(val * 100).toFixed(0)}%`),
  },
];

export interface SeasonLeaderboardProps {
  data: SeasonSummaryData;
}

export const SeasonLeaderboard: Component<SeasonLeaderboardProps> = (props) => {
  const { players, standings } = props.data;

  const data = () =>
    standings().map((standing, index) => ({
      rank: index + 1,
      playerUuid: standing.playerUuid,
      player: players.getLabel(standing.playerUuid),
      elo: standing.rating,
      deltaElo: standing.ratingChange,
      deltaGoals: standing.stats ? getGoalDifference(standing.stats) : 0,
      wonLost: `${standing.stats?.wins ?? 0}-${standing.stats?.losses ?? 0}`,
      winRate: standing.stats ? getWinRate(standing.stats) : null,
    }));

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
