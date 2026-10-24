import { type JSX, Show } from 'solid-js';
import { AnimatedText } from '#components/AnimatedText';
import { KeyedFor } from '#components/KeyedFor';
import { Skeleton } from '#components/Skeleton';
import { StatRow } from '#components/StatRow';
import { Divider } from '#components/Widget';
import { divide, getAverageMatchDuration } from '#flib/derivedStats';
import { type EntityLookup, useGoalTypeLookup } from '#flib/entityLookup';
import { formatDuration } from '#shared/timeUtils';
import type { GoalType } from '#shared/types/api/goalType';
import type { AggregateStats } from '#shared/types/stats/generalStats';
import style from './AggregateStatsGrid.module.scss';

export interface AggregateStatsGridProps {
  stats: AggregateStats | null | undefined;

  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

type AggregateStatsGridValue = string | number | null;

interface AggregateStatsGridRow {
  label: string;
  value: AggregateStatsGridValue;
}

const TOP_GOAL_TYPES = 5;
const SKELETON_ROWS = 10;

function ratio(value: number | null): string | null {
  return value === null ? null : value.toFixed(2);
}

function duration(value: number | null): string | null {
  return value === null ? null : formatDuration(value);
}

function getSections(
  stats: AggregateStats,
  goalTypes: EntityLookup<GoalType>,
): AggregateStatsGridRow[][] {
  const perMatch = (value: number) =>
    ratio(divide(value, stats._matchesWithTimeline));

  return [
    [
      { label: 'Playtime', value: formatDuration(stats.playtime) },
      {
        label: 'Individual Playtime',
        value: formatDuration(stats.individualPlaytime),
      },
      { label: 'Presence', value: formatDuration(stats.participationTime) },
      { label: 'Pauses', value: duration(stats.pauseDuration || null) },
      {
        label: 'Avg. Match Duration',
        value: duration(getAverageMatchDuration(stats)),
      },
    ],
    [
      { label: 'Avg. Goals', value: ratio(divide(stats.goals, stats.matches)) },
      {
        label: 'Goals Per Minute',
        value: ratio(divide(stats._goalsWithDuration, stats.playtime / 60_000)),
      },
      {
        label: 'Avg. Time Between Goals',
        value: duration(
          divide(stats._totalTimeBetweenGoals, stats._timeBetweenGoalsCount),
        ),
      },
      {
        label: 'Longest Time Between Goals',
        value: duration(stats.longestTimeBetweenGoals),
      },
      {
        label: 'Shortest Time Between Goals',
        value: duration(stats.shortestTimeBetweenGoals),
      },
    ],
    [
      {
        label: 'Ball Outs/Match',
        value: perMatch(stats.eventTypesCount.BALL_OUT ?? 0),
      },
      {
        label: 'Pos. Changes/Match',
        value: perMatch(stats.eventTypesCount.POSITION_CHANGE ?? 0),
      },
      { label: 'Own Goals/Match', value: perMatch(stats.ownGoalCount) },
      { label: 'Lead Changes/Match', value: perMatch(stats.leadChanges) },
      { label: 'Biggest Lead', value: stats.biggestLead || null },
    ],
    Object.entries(stats.goalTypesCount)
      .toSorted((a, b) => b[1] - a[1])
      .slice(0, TOP_GOAL_TYPES)
      .map(([uuid, count]) => ({
        label: goalTypes.getLabel(uuid),
        value: count,
      })),
  ];
}

export const AggregateStatsGrid: Component<AggregateStatsGridProps> = (
  props,
) => {
  const goalTypes = useGoalTypeLookup();

  const sections = () =>
    props.stats
      ? getSections(props.stats, goalTypes).map((rows) =>
          rows.filter((row) => row.value !== null),
        )
      : [];

  return (
    <Show
      when={props.stats !== undefined}
      fallback={<Skeleton lines={SKELETON_ROWS} />}
    >
      <Show
        when={props.stats}
        fallback={<span class={style.noData}>No matches</span>}
      >
        {(stats) => (
          <>
            <StatRow
              items={[
                {
                  value: <AnimatedText>{stats().matches}</AnimatedText>,
                  label: 'matches',
                },
                {
                  value: <AnimatedText>{stats().goals}</AnimatedText>,
                  label: 'goals',
                },
                {
                  value: <AnimatedText>{stats().players.length}</AnimatedText>,
                  label: 'players',
                },
                ...(stats().surrenderedMatches > 0
                  ? [
                      {
                        value: stats().surrenderedMatches,
                        label: 'surrendered',
                      },
                    ]
                  : []),
                ...(stats().cancelledMatches > 0
                  ? [
                      {
                        value: stats().cancelledMatches,
                        label: 'cancelled',
                      },
                    ]
                  : []),
              ]}
            />

            <KeyedFor
              each={sections().filter((rows) => rows.length > 0)}
              by={(rows) => rows[0]?.label ?? ''}
            >
              {(rows) => (
                <>
                  <Divider />

                  <div
                    classList={{
                      [style.container]: true,
                      [props.class ?? '']: !!props.class,
                      ...(props.classList ?? {}),
                    }}
                  >
                    <KeyedFor each={rows()} by={(row) => row.label}>
                      {(row) => (
                        <>
                          <span>{row().label}:</span>
                          <strong>
                            <AnimatedText>{row().value}</AnimatedText>
                          </strong>
                        </>
                      )}
                    </KeyedFor>
                  </div>
                </>
              )}
            </KeyedFor>
          </>
        )}
      </Show>
    </Show>
  );
};
