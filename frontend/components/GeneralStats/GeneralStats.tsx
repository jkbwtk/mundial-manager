import { createMemo, createSignal, Show } from 'solid-js';
import { AnimatedText } from '#components/AnimatedText';
import { InlineAction } from '#components/InlineAction';
import { Widget } from '#components/Widget';
import { useSheets } from '#providers/SheetsProvider';
import style from './GeneralStats.module.scss';

export const GeneralStats: Component = () => {
  const [, { latest }] = useSheets();
  const [extrapolated, setExtrapolated] = createSignal(false);

  const stats = createMemo(() => latest().matchStats.generalStats);

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
          <AnimatedText>{stats().totalMatches}</AnimatedText>
        </strong>

        <span>Total Goals:</span>
        <strong>
          <AnimatedText>{stats().totalGoals}</AnimatedText>
        </strong>

        <span>Total Playtime:</span>
        <strong>
          <AnimatedText>
            <Show
              when={extrapolated()}
              fallback={stats().totalPlaytimeFormatted}
            >
              {stats().totalPlaytimeExtrapolatedFormatted}
            </Show>
          </AnimatedText>
        </strong>

        <span>Total Individual Playtime:</span>
        <strong>
          <AnimatedText>
            <Show
              when={extrapolated()}
              fallback={stats().totalIndividualPlaytimeFormatted}
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
      </div>
    </Widget>
  );
};
