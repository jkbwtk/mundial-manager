import { createMemo, For, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import {
  BallOutEvent,
  EquipmentFailureEvent,
  GoalEvent,
  PositionChangeEvent,
} from '#components/MatchTimelineModal';
import { Modal } from '#components/Modal';
import {
  StatPaginatorWidget,
  useStatPaginatedFrame,
} from '#components/StatPaginatorWidget';
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
  page?: number;
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

const MatchTimelineModalBase: Component = () => {
  const frame = useStatPaginatedFrame();

  const match = createMemo(() => frame().match);
  const teamColors = () => getTeamColors(match());

  return (
    <>
      <div class={style.scoreContainer}>
        <div>
          <span
            classList={{
              [style.teamName]: true,
              [getTeamColorClass(teamColors()[0])]: true,
            }}
          >
            {match().team1}
          </span>{' '}
          vs{' '}
          <span
            classList={{
              [style.teamName]: true,
              [getTeamColorClass(teamColors()[1])]: true,
            }}
          >
            {match().team2}
          </span>
        </div>
        <div>
          <span
            classList={{
              [style.highlightedScore]: match().score1 > match().score2,
            }}
          >
            {match().score1}
          </span>{' '}
          :{' '}
          <span
            classList={{
              [style.highlightedScore]: match().score2 > match().score1,
            }}
          >
            {match().score2}
          </span>
        </div>
      </div>
      <Divider class={style.dashedDivider} />
      <div class={style.statsContainer}>
        <Show when={match().duration}>
          {(duration) => (
            <>
              <span>Duration:</span>
              <strong>{formatDuration(duration())}</strong>
            </>
          )}
        </Show>

        <Show when={match().date}>
          <span>Date:</span>
          <strong>{formatDate(match().date!)}</strong>
        </Show>
      </div>
      <Divider />
      <Show
        when={match().replayMetadata !== null}
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
            <For each={match().replayMetadata?.events}>
              {(event) => (
                <tr>
                  <Dynamic
                    component={
                      getEventComponent(
                        event.type,
                      ) as Component<TimelineEntryProps>
                    }
                    match={match()}
                    event={event}
                  />
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </>
  );
};

export const MatchTimelineModal: Component<MatchTimelineModalProps> = (
  props,
) => {
  return (
    <StatPaginatorWidget
      statType="match"
      component={Modal}
      page={props.page}
      class={style.modal}
      topLeftLabels="Match Timeline"
    >
      <MatchTimelineModalBase />
    </StatPaginatorWidget>
  );
};
