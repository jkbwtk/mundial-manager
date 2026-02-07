import { createMemo, createSignal, Show } from 'solid-js';
import { AnimatedText } from '#components/AnimatedText';
import { InlineAction } from '#components/InlineAction';
import { Divider, Widget } from '#components/Widget';
import { useSheets } from '#providers/SheetsProvider';
import style from './GeneralStats.module.scss';

export const GeneralStats: Component = () => {
  const [, { latest }] = useSheets();
  const [extrapolated, setExtrapolated] = createSignal(false);

  const stats = createMemo(() => latest().generalStats);

  return (
    <Widget
      class={style.widget}
      topLeftLabels="General Stats"
      topRightLabels={
        <span
          classList={{
            [style.label]: true,
            [style.active]: extrapolated(),
          }}
        >
          E
          <InlineAction
            symbol="x"
            onAction={() => setExtrapolated((e) => !e)}
          />
          trapolate
        </span>
      }
    >
      <div class={style.container}>
        <span>Total Matches:</span>
        <strong>
          <AnimatedText>{stats().matches}</AnimatedText>
        </strong>

        <span>Total Goals:</span>
        <strong>
          <AnimatedText>{stats().goals}</AnimatedText>
        </strong>

        <span>Total Playtime:</span>
        <strong>
          <AnimatedText>
            <Show when={extrapolated()} fallback={stats().playtimeFormatted}>
              {stats().totalPlaytimeExtrapolatedFormatted}
            </Show>
          </AnimatedText>
        </strong>

        <span>Total Individual Playtime:</span>
        <strong>
          <AnimatedText>
            <Show
              when={extrapolated()}
              fallback={stats().individualPlaytimeFormatted}
            >
              {stats().totalIndividualPlaytimeExtrapolatedFormatted}
            </Show>
          </AnimatedText>
        </strong>

        <span>Average Match Duration:</span>
        <strong>
          <AnimatedText>{stats().averageMatchDurationFormatted}</AnimatedText>
        </strong>

        <span>Average Goals:</span>
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
      <div class={style.container}>
        <span>Total Players:</span>
        <strong>
          <AnimatedText>{stats().players.length}</AnimatedText>
        </strong>

        <span>Total Teams:</span>
        <strong>
          <AnimatedText>{stats().teams.length}</AnimatedText>
        </strong>
      </div>
    </Widget>
  );
};
