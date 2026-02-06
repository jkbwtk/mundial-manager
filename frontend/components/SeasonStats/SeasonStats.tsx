import { For, Show } from 'solid-js';
import { AnimatedText } from '#components/AnimatedText';
import { PlayerLink } from '#components/PlayerLink';
import {
  SeasonPaginatorWidget,
  useSeasonPaginatedFrame,
} from '#components/SeasonPaginatorWidget';
import { Divider } from '#components/Widget';
import style from './SeasonStats.module.scss';

export const SeasonStatsBase: Component = () => {
  const frame = useSeasonPaginatedFrame();

  const stats = () => frame().seasonStats;

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

export const SeasonStats: Component = () => {
  return (
    <SeasonPaginatorWidget class={style.widget} topLeftLabels="Season Stats">
      <SeasonStatsBase />
    </SeasonPaginatorWidget>
  );
};
