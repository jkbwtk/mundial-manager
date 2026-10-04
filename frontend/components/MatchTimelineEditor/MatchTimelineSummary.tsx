import dayjs from 'dayjs';
import { createMemo, For, Show } from 'solid-js';
import { AnimatedText } from '#components/AnimatedText';
import { DeltaDisplay } from '#components/DeltaDisplay';
import { MatchSideName } from '#components/MatchTimelineTable';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Divider } from '#components/Widget';
import { MatchEventTypeLabels, MatchEventTypeSymbols } from '#flib/matchEvents';
import { getMatchTimelineStats } from '#shared/matchTimeline';
import { formatDurationMs } from '#shared/timeUtils';
import { MatchEventTypeEnum, MatchSides } from '#shared/types/api/matchEvent';
import { useMatchTimelineEditor } from './MatchTimelineEditor';
import style from './MatchTimelineEditor.module.scss';

const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

const EventTypes = Object.values(MatchEventTypeEnum);

export const MatchTimelineSummary: Component = () => {
  const [draft, lookup] = useMatchTimelineEditor();

  const match = () => lookup.timeline().match;

  const stats = createMemo(() =>
    getMatchTimelineStats(draft.events(), match().duration),
  );

  const storedPauseDuration = () => match().pauseDuration ?? 0;

  const hasTimeline = () => draft.events().length > 0;

  const scoreChanged = () =>
    hasTimeline() &&
    (draft.score()[0] !== match().side1Score ||
      draft.score()[1] !== match().side2Score);

  const pauseChanged = () =>
    hasTimeline() &&
    Math.abs(draft.pauseDuration() - storedPauseDuration()) >= 1;

  const presentTypes = () =>
    EventTypes.filter((type) => (stats().counts[type] ?? 0) > 0);

  return (
    <>
      <div class={style.stats}>
        <span>Status:</span>
        <strong>
          <AnimatedText>{match().status}</AnimatedText>
        </strong>

        <Show when={lookup.timeline().table}>
          {(table) => (
            <>
              <span>Table:</span>
              <strong>{table().name}</strong>
            </>
          )}
        </Show>

        <For each={MatchSides}>
          {(side, index) => (
            <>
              <span>Team {index() + 1}:</span>
              <strong>
                <MatchSideName links side={side} lookup={lookup} />
              </strong>
            </>
          )}
        </For>

        <span>Score:</span>
        <strong>
          {match().side1Score}
          <Show when={scoreChanged()}>
            <DeltaDisplay
              base={draft.score()[0]}
              compared={match().side1Score}
            />
          </Show>
          :{match().side2Score}
          <Show when={scoreChanged()}>
            <DeltaDisplay
              base={draft.score()[1]}
              compared={match().side2Score}
            />
          </Show>
        </strong>

        <span>Date:</span>
        <strong>
          {match().startDate === null
            ? 'Unknown'
            : dayjs(match().startDate).format(DATE_TIME_FORMAT)}
        </strong>

        <span>Duration:</span>
        <strong>
          {match().duration === null
            ? 'Not finished'
            : formatDurationMs(match().duration)}
        </strong>

        <span>Pause Duration:</span>
        <strong>
          {formatDurationMs(storedPauseDuration())}
          <Show when={pauseChanged()}>
            <DeltaDisplay
              base={draft.pauseDuration()}
              compared={storedPauseDuration()}
              formatter={(value) => formatDurationMs(value ?? 0)}
            />
          </Show>
        </strong>
      </div>

      <Show when={scoreChanged() || pauseChanged()}>
        <span
          classList={{
            [style.dimmed]: true,
            [style.centered]: true,
          }}
        >
          Match will be updated automatically
        </span>
      </Show>

      <Show when={(stats().counts.GOAL ?? 0) > 0}>
        <Divider />

        <div class={style.stats}>
          <Show when={stats().goalsPerMinute !== null}>
            <span>Goals Per Minute:</span>
            <strong>
              <AnimatedText>{stats().goalsPerMinute?.toFixed(2)}</AnimatedText>
            </strong>
          </Show>

          <span>Avg. Time Between Goals:</span>
          <strong>
            <AnimatedText>
              {formatDurationMs(stats().averageTimeBetweenGoals)}
            </AnimatedText>
          </strong>

          <span>Longest Time Between Goals:</span>
          <strong>
            <AnimatedText>
              {formatDurationMs(stats().longestTimeBetweenGoals)}
            </AnimatedText>
          </strong>

          <span>Shortest Time Between Goals:</span>
          <strong>
            <AnimatedText>
              {formatDurationMs(stats().shortestTimeBetweenGoals)}
            </AnimatedText>
          </strong>

          <span>Own Goals:</span>
          <strong>
            <AnimatedText>{stats().ownGoals}</AnimatedText>
          </strong>

          <span>Lead Changes:</span>
          <strong>
            <AnimatedText>{stats().leadChanges}</AnimatedText>
          </strong>

          <span>Biggest Lead:</span>
          <strong>
            <AnimatedText>{stats().biggestLead}</AnimatedText>
          </strong>
        </div>
      </Show>

      <Divider />

      <div class={style.eventCounts}>
        <Show
          when={presentTypes().length > 0}
          fallback={<span class={style.dimmed}>No events</span>}
        >
          <For each={presentTypes()}>
            {(type) => (
              <span title={MatchEventTypeLabels[type]}>
                <MaterialSymbol symbol={MatchEventTypeSymbols[type]} />
                {stats().counts[type]}
              </span>
            )}
          </For>
        </Show>
      </div>
    </>
  );
};
