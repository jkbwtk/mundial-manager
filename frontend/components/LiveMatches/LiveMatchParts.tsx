import { Show } from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { isActiveMatchStale } from '#flib/activeMatches';
import { createNow } from '#flib/clock';
import { useTableLookup } from '#flib/entityLookup';
import { getTableSideColor } from '#flib/teamColors';
import { getExactStartDate } from '#shared/matchLabels';
import { getMatchLiveElapsed } from '#shared/matchTimeline';
import { formatDuration } from '#shared/timeUtils';
import type { ActiveMatch } from '#shared/types/api/activeMatch';
import type { MatchSide } from '#shared/types/api/matchEvent';
import style from './LiveMatches.module.scss';

export interface LiveMatchClockProps {
  active: ActiveMatch;
}

export interface LiveWinBarProps {
  active: ActiveMatch;
  probability: number; // side 1

  class?: string;
}

function useLiveMatchSideColor(): (
  active: ActiveMatch,
  side: MatchSide,
) => string {
  const tables = useTableLookup();

  return (active, side) =>
    getTableSideColor(
      active.match.tableUuid ? tables.get(active.match.tableUuid) : null,
      side,
    );
}

export const LiveMatchClock: Component<LiveMatchClockProps> = (props) => {
  const now = createNow(() => 'second');

  const isStale = () => isActiveMatchStale(props.active, now().valueOf());

  const elapsed = () => {
    const startDate = getExactStartDate(props.active.match);

    if (startDate === null) return null;

    const at = isStale() ? props.active.updatedAt.getTime() : now().valueOf();

    return getMatchLiveElapsed(startDate, props.active.events, at);
  };

  return (
    <span
      classList={{
        [style.clock]: true,
        [style.stale]: isStale(),
        [style.paused]: props.active.match.status === 'PAUSED',
      }}
      title={isStale() ? 'No updates for over 10 minutes' : undefined}
    >
      {formatDuration(elapsed())}
      <Show when={isStale()}>
        {' '}
        <MaterialSymbol symbol="update_disabled" />
      </Show>
    </span>
  );
};

export const LiveWinBar: Component<LiveWinBarProps> = (props) => {
  const getSideColor = useLiveMatchSideColor();

  return (
    <span
      classList={{
        [style.winBar]: true,
        [props.class ?? '']: !!props.class,
      }}
      style={{
        '--share': props.probability,
        '--side-1-color': getSideColor(props.active, 'SIDE_1'),
        '--side-2-color': getSideColor(props.active, 'SIDE_2'),
      }}
      role="img"
      aria-label={`Side 1 win probability ${Math.round(props.probability * 100)}%`}
    />
  );
};
