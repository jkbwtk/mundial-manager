import { For, Show } from 'solid-js';
import { AnimatedText } from '#components/AnimatedText';
import { PlayerLink } from '#components/PlayerLink';
import {
  StatPaginatorWidget,
  useStatPaginatedFrame,
} from '#components/StatPaginatorWidget';
import { Divider } from '#components/Widget';
import style from './DayStats.module.scss';

export const DayStatsBase: Component = () => {
  const frame = useStatPaginatedFrame();

  const stats = () => frame().dayStats;

  return (
    <>
      <div class={style.container}>
        <span>Matches:</span>
        <strong>
          <AnimatedText>{stats().matches}</AnimatedText>
        </strong>

        <span>Goals:</span>
        <strong>
          <AnimatedText>{stats().goals}</AnimatedText>
        </strong>

        <span>Playtime:</span>
        <strong>
          <AnimatedText>{stats().playtimeFormatted}</AnimatedText>
        </strong>

        <span>Individual Playtime:</span>
        <strong>
          <AnimatedText>{stats().individualPlaytimeFormatted}</AnimatedText>
        </strong>

        <span>Avg. Match Duration:</span>
        <strong>
          <AnimatedText>{stats().averageMatchDurationFormatted}</AnimatedText>
        </strong>

        <span>Avg. Goals:</span>
        <strong>
          <AnimatedText>{stats().averageGoals.toFixed(2)}</AnimatedText>
        </strong>

        <Show when={stats().goalsPerMinute !== null}>
          <span>Goals Per Minute:</span>
          <strong>
            <AnimatedText>{stats().goalsPerMinute!.toFixed(2)}</AnimatedText>
          </strong>
        </Show>

        <Show when={stats().averageTimeBetweenGoals !== null}>
          <span>Avg. Time Between Goals:</span>
          <strong>
            <AnimatedText>
              {stats().averageTimeBetweenGoalsFormatted}
            </AnimatedText>
          </strong>
        </Show>

        <Show when={stats().longestTimeBetweenGoals !== null}>
          <span>Longest Time Between Goals:</span>
          <strong>
            <AnimatedText>
              {stats().longestTimeBetweenGoalsFormatted}
            </AnimatedText>
          </strong>
        </Show>

        <Show when={stats().shortestTimeBetweenGoals !== null}>
          <span>Shortest Time Between Goals:</span>
          <strong>
            <AnimatedText>
              {stats().shortestTimeBetweenGoalsFormatted}
            </AnimatedText>
          </strong>
        </Show>
      </div>

      <Show
        when={
          stats().averageBallOutsPerMatch !== null ||
          stats().averagePositionChangesPerMatch !== null ||
          stats().averageOwnGoalsPerMatch !== null
        }
      >
        <Divider />
        <div class={style.container}>
          <Show when={stats().averageBallOutsPerMatch !== null}>
            <span>Avg. Ball Outs/Match:</span>
            <strong>
              <AnimatedText>
                {stats().averageBallOutsPerMatch!.toFixed(2)}
              </AnimatedText>
            </strong>
          </Show>

          <Show when={stats().averagePositionChangesPerMatch !== null}>
            <span>Avg. Pos. Changes/Match:</span>
            <strong>
              <AnimatedText>
                {stats().averagePositionChangesPerMatch!.toFixed(2)}
              </AnimatedText>
            </strong>
          </Show>

          <Show when={stats().averageOwnGoalsPerMatch !== null}>
            <span>Avg. Own Goals/Match:</span>
            <strong>
              <AnimatedText>
                {stats().averageOwnGoalsPerMatch!.toFixed(2)}
              </AnimatedText>
            </strong>
          </Show>
        </div>
      </Show>

      <Divider />
      <strong class={style.playersLabel}>Players</strong>

      <div class={style.playerList}>
        <For each={stats().players}>
          {(player) => <PlayerLink name={player} />}
        </For>
      </div>
    </>
  );
};

export const DayStats: Component = () => {
  return (
    <StatPaginatorWidget
      statType="day"
      class={style.widget}
      topLeftLabels="Day Stats"
    >
      <DayStatsBase />
    </StatPaginatorWidget>
  );
};
