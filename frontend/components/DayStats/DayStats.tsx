import { For, Show } from 'solid-js';
import { AnimatedText } from '#components/AnimatedText';
import {
  DayPaginatorWidget,
  useDayPaginatedFrame,
} from '#components/DayPaginatorWidget';
import { PlayerLink } from '#components/PlayerLink';
import { Divider } from '#components/Widget';
import style from './DayStats.module.scss';

export const DayStatsBase: Component = () => {
  const frame = useDayPaginatedFrame();

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
      </div>
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
    <DayPaginatorWidget class={style.widget} topLeftLabels="Day Stats">
      <DayStatsBase />
    </DayPaginatorWidget>
  );
};
