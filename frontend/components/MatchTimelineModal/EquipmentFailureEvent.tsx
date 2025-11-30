import { MaterialSymbol } from '#components/MaterialSymbol';
import { formatDuration } from '#flib/sheetUtils';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import type { Match, MatchEventEquipmentFailure } from '#shared/types/Sheets';
import style from './MatchTimelineModal.module.scss';

export interface EquipmentFailureEventProps {
  match: Match;
  event: MatchEventEquipmentFailure;
}

export const EquipmentFailureEvent: Component<EquipmentFailureEventProps> = (
  props,
) => {
  const symbol: SupportedMaterialSymbol = 'nearby_error';

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
            [style.equipmentFailure]: true,
          }}
        />
      </td>

      <td />

      <td class={style.description}>
        {props.event.details ?? 'Equipment failure'}
      </td>
    </>
  );
};
