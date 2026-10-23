import { MaterialSymbol } from '#components/MaterialSymbol';
import { MatchEventTypeSymbols } from '#flib/matchEvents';
import type { MatchEvent, MatchEventType } from '#shared/types/api/matchEvent';
import style from './MatchTimelineTable.module.scss';

export interface MatchEventSymbolProps {
  event: MatchEvent;
}

const EventTypeClasses: Record<MatchEventType, string> = {
  GOAL: style.goal,
  POSITION_CHANGE: style.positionChange,
  BALL_OUT: style.ballOut,
  BALL_CHANGE: style.ballChange,
  EQUIPMENT_FAILURE: style.equipmentFailure,
  PAUSE: style.pause,
  RESUME: style.resume,
  CANCEL: style.cancel,
  SURRENDER: style.surrender,
};

export const MatchEventSymbol: Component<MatchEventSymbolProps> = (props) => (
  <MaterialSymbol
    symbol={MatchEventTypeSymbols[props.event.type]}
    classList={{
      [EventTypeClasses[props.event.type]]: true,
      [style.ownGoal]: props.event.type === 'GOAL' && props.event.ownGoal,
    }}
  />
);
