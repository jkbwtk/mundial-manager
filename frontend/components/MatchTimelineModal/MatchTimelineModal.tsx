import { For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import {
  BallOutEvent,
  EquipmentFailureEvent,
  GoalEvent,
  PositionChangeEvent,
} from '#components/MatchTimelineModal';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { formatDate, formatDuration, getTeamColors } from '#flib/sheetUtils';
import { getTeamColorClass } from '#flib/teamColors';
import type { Match, MatchEvent, MatchEventType } from '#shared/types/Sheets';
import style from './MatchTimelineModal.module.scss';

export interface TimelineEntryProps {
  match: Match;
  event: MatchEvent;
}

export interface MatchTimelineModalProps {
  match: Match;
}

function getEventComponent(eventType: MatchEventType) {
  switch (eventType) {
    case 'GOAL':
      return GoalEvent;
    case 'BALL_OUT':
      return BallOutEvent;
    case 'POSITION_CHANGE':
      return PositionChangeEvent;
    case 'EQUIPMENT_FAILURE':
      return EquipmentFailureEvent;
    default:
      return EquipmentFailureEvent;
  }
}

export const MatchTimelineModal: Component<MatchTimelineModalProps> = (
  props,
) => {
  const teamColors = () => getTeamColors(props.match);

  return (
    <Modal class={style.modal} topLeftLabels="Match Timeline">
      <div class={style.scoreContainer}>
        <div>
          <span
            classList={{
              [style.teamName]: true,
              [getTeamColorClass(teamColors()[0])]: true,
            }}
          >
            {props.match.team1}
          </span>{' '}
          vs{' '}
          <span
            classList={{
              [style.teamName]: true,
              [getTeamColorClass(teamColors()[1])]: true,
            }}
          >
            {props.match.team2}
          </span>
        </div>
        <div>
          <span
            classList={{
              [style.highlightedScore]: props.match.score1 > props.match.score2,
            }}
          >
            {props.match.score1}
          </span>{' '}
          :{' '}
          <span
            classList={{
              [style.highlightedScore]: props.match.score2 > props.match.score1,
            }}
          >
            {props.match.score2}
          </span>
        </div>
      </div>

      <Divider class={style.dashedDivider} />

      <div class={style.statsContainer}>
        <Show when={props.match.duration}>
          <span>Duration:</span>
          <strong>{formatDuration(props.match.duration!)}</strong>
        </Show>

        <Show when={props.match.date}>
          <span>Date:</span>
          <strong>{formatDate(props.match.date!)}</strong>
        </Show>
      </div>

      <Divider />

      <Show
        when={props.match.replayMetadata !== null}
        fallback={
          <div class={style.noData}>
            No timeline data available for this match.
          </div>
        }
      >
        <table class={style.timelineTable}>
          <thead>
            <tr class={style.timelineHeader}>
              <th
                classList={{
                  [style.minWidth]: true,
                  [style.time]: true,
                }}
              >
                T+
              </th>
              <th
                classList={{
                  [style.minWidth]: true,
                  [getTeamColorClass(teamColors()[0])]: true,
                  [style.teamColor]: true,
                }}
              />
              <th class={style.centerLineHeader} />
              <th
                classList={{
                  [style.minWidth]: true,
                  [getTeamColorClass(teamColors()[1])]: true,
                  [style.teamColor]: true,
                }}
              />
              <th class={style.description}>Description</th>
              <th class={style.minWidth}>Score</th>
            </tr>
          </thead>

          <tbody>
            <For each={props.match.replayMetadata?.events}>
              {(event) => (
                <tr>
                  <Dynamic
                    component={
                      getEventComponent(
                        event.type,
                      ) as Component<TimelineEntryProps>
                    }
                    match={props.match}
                    event={event}
                  />
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </Modal>
  );
};
