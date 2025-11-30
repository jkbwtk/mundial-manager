import { Show } from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { formatDuration, getTeamColors } from '#flib/sheetUtils';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import { getTeamColorClass } from '#flib/teamColors';
import type { Match, MatchEventPositionChange } from '#shared/types/Sheets';
import style from './MatchTimelineModal.module.scss';

export interface PositionChangeEventProps {
  match: Match;
  event: MatchEventPositionChange;
}

export const PositionChangeEvent: Component<PositionChangeEventProps> = (
  props,
) => {
  const teamColors = getTeamColors(props.match);
  const side = props.event.side === teamColors[0] ? 'left' : 'right';
  const symbol: SupportedMaterialSymbol = 'swap_horiz';

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
              [style.positionChange]: true,
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
              [style.positionChange]: true,
            }}
          />
        </Show>
      </td>

      <td class={style.description}>
        <span
          classList={{
            [style.teamName]: true,
            [getTeamColorClass(props.event.side)]: true,
          }}
        >
          {teamColors[0] === props.event.side
            ? props.match.team1
            : props.match.team2}
        </span>{' '}
        position change
      </td>
    </>
  );
};
