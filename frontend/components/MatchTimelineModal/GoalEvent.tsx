import { Show } from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { getScoreAfterEvent } from '#flib/sheetUtils';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import { getTeamColors } from '#shared/matchUtils';
import { formatDuration } from '#shared/timeUtils';
import type { Match, MatchEventGoal } from '#shared/types/Sheets';
import style from './MatchTimelineModal.module.scss';

export interface GoalEventProps {
  match: Match;
  event: MatchEventGoal;
}

export const GoalEvent: Component<GoalEventProps> = (props) => {
  const colors = getTeamColors(props.match);
  const side = props.event.for === colors[0] ? 'left' : 'right';
  const symbol: SupportedMaterialSymbol = 'sports_soccer';

  const score = () => getScoreAfterEvent(props.match, props.event);

  return (
    <>
      <td class={style.time}>
        {formatDuration(
          props.event.time - (props.match.replayMetadata?.startedAt ?? 0),
        )}
      </td>

      <td>
        <Show when={side === 'left'}>
          <MaterialSymbol
            symbol={symbol}
            classList={{
              [style.goal]: true,
              [style.ownGoal]: props.event.by !== props.event.for,
            }}
          />
        </Show>
      </td>

      <td class={style.centerLine} />

      <td>
        <Show when={side === 'right'}>
          <MaterialSymbol
            symbol={symbol}
            classList={{
              [style.goal]: true,
              [style.ownGoal]: props.event.by !== props.event.for,
            }}
          />
        </Show>
      </td>

      <td class={style.description}>
        Goal by <strong>{props.event.player}</strong>
      </td>

      <td class={style.score}>
        <span>{score()[0]}</span>
        <span>:</span>
        <span>{score()[1]}</span>
      </td>
    </>
  );
};
