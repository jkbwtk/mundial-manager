import { Match, Show, Switch } from 'solid-js';
import { narrowMatchEvent } from '#flib/matchEvents';
import type { MatchTimelineLookup } from '#flib/matchTimelineLookup';
import type { MatchEvent } from '#shared/types/api/matchEvent';
import { MatchSideName } from './MatchSideName';
import style from './MatchTimelineTable.module.scss';

export interface MatchEventDescriptionProps {
  event: MatchEvent;
  lookup: MatchTimelineLookup;
}

interface DetailsProps {
  text?: string | null;
}

const Details: Component<DetailsProps> = (props) => (
  <Show when={props.text}>
    {' '}
    <span class={style.details}>({props.text})</span>
  </Show>
);

export const MatchEventDescription: Component<MatchEventDescriptionProps> = (
  props,
) => (
  <Switch>
    <Match when={narrowMatchEvent(props.event, 'GOAL')}>
      {(goal) => (
        <>
          Goal by <strong>{props.lookup.getPlayerName(goal().player)}</strong>
          <Details text={goal().ownGoal ? 'own goal' : null} />
          <Details
            text={goal().goalType.map(props.lookup.getGoalTypeLabel).join(', ')}
          />
        </>
      )}
    </Match>

    <Match when={narrowMatchEvent(props.event, 'POSITION_CHANGE')}>
      {(positionChange) => (
        <>
          <MatchSideName side={positionChange().side} lookup={props.lookup} />{' '}
          position change
        </>
      )}
    </Match>

    <Match when={narrowMatchEvent(props.event, 'BALL_OUT')}>
      Ball out of bounds
    </Match>

    <Match when={narrowMatchEvent(props.event, 'BALL_CHANGE')}>
      {(ballChange) => (
        <>
          Ball changed to{' '}
          <strong>{props.lookup.getBallName(ballChange().ball)}</strong>
        </>
      )}
    </Match>

    <Match when={narrowMatchEvent(props.event, 'EQUIPMENT_FAILURE')}>
      {(equipmentFailure) => (
        <>{equipmentFailure().details ?? 'Equipment failure'}</>
      )}
    </Match>

    <Match when={narrowMatchEvent(props.event, 'PAUSE')}>
      {(pause) => (
        <>
          Paused
          <Details text={pause().details} />
        </>
      )}
    </Match>

    <Match when={narrowMatchEvent(props.event, 'RESUME')}>Resumed</Match>

    <Match when={narrowMatchEvent(props.event, 'CANCEL')}>
      {(cancel) => (
        <>
          Match cancelled
          <Details text={cancel().details} />
        </>
      )}
    </Match>

    <Match when={narrowMatchEvent(props.event, 'SURRENDER')}>
      {(surrender) => (
        <>
          <MatchSideName side={surrender().side} lookup={props.lookup} />{' '}
          surrendered
          <Details text={surrender().details} />
        </>
      )}
    </Match>
  </Switch>
);
