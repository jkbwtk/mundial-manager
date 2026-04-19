import { MaterialSymbol } from '#components/MaterialSymbol';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import { formatDuration } from '#shared/timeUtils';
import type { Match, MatchEventBallOut } from '#shared/types/Sheets';
import style from './MatchTimelineModal.module.scss';

export interface BallOutEventProps {
  match: Match;
  event: MatchEventBallOut;
}

export const BallOutEvent: Component<BallOutEventProps> = (props) => {
  const symbol: SupportedMaterialSymbol = 'display_external_input';

  return (
    <>
      <td class={style.time}>
        {formatDuration(
          props.event.time - (props.match.replayMetadata?.startedAt ?? 0),
        )}
      </td>

      <td />

      <td class={style.minWidth}>
        <MaterialSymbol
          symbol={symbol}
          classList={{
            [style.ballOut]: true,
          }}
        />
      </td>

      <td />

      <td class={style.description}>Ball out of bounds</td>
    </>
  );
};
