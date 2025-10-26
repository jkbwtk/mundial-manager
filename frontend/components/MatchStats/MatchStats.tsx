import { Show } from 'solid-js';
import { AnimatedText } from '#components/AnimatedText';
import {
  MatchPaginatorWidget,
  usePaginatedMatch,
  usePaginatedStat,
} from '#components/MatchPaginatorWidget';
import { Divider } from '#components/Widget';
import { formatDate, formatDuration } from '#flib/sheetUtils';
import { quickSwitch } from '#shared/utils';
import style from './MatchStats.module.scss';

export const MatchStatsBase: Component = () => {
  const match = usePaginatedMatch();
  const stats = usePaginatedStat();

  return (
    <>
      <div class={style.container}>
        <span>Match:</span>
        <strong>{stats().label}</strong>

        <span>Team 1:</span>
        <strong>
          <AnimatedText
            classList={{
              [style.highlight]: match().score1 > match().score2,
            }}
          >
            {match().team1}
          </AnimatedText>
        </strong>

        <span>Team 2:</span>
        <strong>
          <AnimatedText
            classList={{
              [style.highlight]: match().score1 < match().score2,
            }}
          >
            {match().team2}
          </AnimatedText>
        </strong>

        <span>Score:</span>
        <strong>
          <span
            classList={{
              [style.highlight]: match().score1 > match().score2,
            }}
          >
            {match().score1}
          </span>
          :
          <span
            classList={{
              [style.highlight]: match().score1 < match().score2,
            }}
          >
            {match().score2}
          </span>
        </strong>

        <Show when={match().duration}>
          <span>Duration:</span>
          <strong>
            <AnimatedText>{formatDuration(match().duration!)}</AnimatedText>
          </strong>
        </Show>

        <Show when={match().date}>
          <span>Date:</span>
          <strong>
            <AnimatedText>{formatDate(match().date!)}</AnimatedText>
          </strong>
        </Show>

        <Show when={match().floor}>
          <span>Floor:</span>
          <strong>
            <AnimatedText>{match().floor}</AnimatedText>
          </strong>
        </Show>

        <span>Winning Color:</span>
        <span
          classList={{
            [quickSwitch<string>(match().winningColor.toLowerCase(), {
              czerwony2: style.teamColorRed2,
              czerwony3: style.teamColorRed3,
              zielony: style.teamColorGreen,
              niebieski: style.teamColorBlue,
              default: '',
            })]: true,
            [style.teamColor]: true,
          }}
        />
      </div>
      <Divider />
      <div class={style.container}>
        <span>Goals per minute:</span>
        <strong>
          <AnimatedText>{stats().goalsPerMinute.toFixed(2)}</AnimatedText>
        </strong>
      </div>
    </>
  );
};

export const MatchStats: Component = () => {
  return (
    <MatchPaginatorWidget class={style.widget} topLeftLabels={'Match Stats'}>
      <MatchStatsBase />
    </MatchPaginatorWidget>
  );
};
