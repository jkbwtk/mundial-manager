import { createMemo, For } from 'solid-js';
import { Identicon } from '#components/Identicon';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { useStatPaginator } from '#components/StatPaginatorWidget';
import { createDeltaFrame } from '#flib/matchDataUtils';
import { formatDuration } from '#flib/sheetUtils';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import type { MatchDataDeltaFrame, MatchDataFrame } from '#frontend/types';
import style from './SeasonSummaryModal.module.scss';

interface Winner {
  player: string;
  value: number;

  award: Award;
}

interface Award {
  name: string;
  subtitle: string;
  icon: SupportedMaterialSymbol;

  formatValue: (value: number) => string;
  pickWinner: (
    stats: MatchDataFrame,
    delta: MatchDataDeltaFrame,
  ) => Winner | null;
}

function getTop<T>(values: T[], compare: (a: T, b: T) => boolean): T | null {
  if (values.length === 0) return null;

  let top = values[0] as T;

  for (const val of values) {
    if (compare(val, top)) {
      top = val;
    }
  }

  return top;
}

const availableAwards: Award[] = [
  {
    name: 'Champion',
    subtitle: 'Highest ELO',
    icon: 'trophy',

    formatValue: (val) => `${val.toFixed(1)} ELO`,
    pickWinner(stats) {
      const top = getTop(
        Object.entries(stats.eloRatings.hybridElos),
        (a, b) => a[1].rating > b[1].rating,
      );

      if (top === null) return null;

      return { player: top[0], value: top[1].rating, award: this };
    },
  },
  {
    name: 'Top Scorer',
    subtitle: 'Most goals scored',
    icon: 'sports_soccer',

    formatValue: (val) => `${val} goals`,
    pickWinner(_stats, delta) {
      const top = getTop(
        Object.values(delta.playerStats),
        (a, b) => a.goalsFor > b.goalsFor,
      );

      if (top === null) return null;

      return { player: top.name, value: top.goalsFor, award: this };
    },
  },
  {
    name: 'Slowpoke',
    subtitle: 'Slowest avg. match',
    icon: 'moon_stars',

    formatValue: (val) => `${formatDuration(val)} minutes`,
    pickWinner(_stats, delta) {
      const top = getTop(
        Object.entries(delta.playerStats),
        (a, b) =>
          a[1].playtime / (a[1]._matchesWithDuration ?? 1) >
          b[1].playtime / (b[1]._matchesWithDuration ?? 1),
      );

      if (top === null) return null;

      return {
        player: top[0],
        value: top[1].playtime / (top[1]._matchesWithDuration ?? 1),
        award: this,
      };
    },
  },
  {
    name: 'Marathoner',
    subtitle: 'Most matches played',
    icon: 'timer',

    formatValue: (val) => `${val} matches`,
    pickWinner(_stats, delta) {
      const top = getTop(
        Object.entries(delta.playerStats),
        (a, b) => a[1].matches > b[1].matches,
      );

      if (top === null) return null;

      return {
        player: top[0],
        value: top[1].matches,
        award: this,
      };
    },
  },
  {
    name: 'Unbeatable',
    subtitle: 'Highest win rate',
    icon: 'stars_2',

    formatValue: (val) => `${(val * 100).toFixed(1)}%`,
    pickWinner(_stats, delta) {
      const top = getTop(
        Object.entries(delta.playerStats).filter(
          ([, stats]) => stats.matches >= 5,
        ),
        (a, b) => a[1].wins / a[1].matches > b[1].wins / b[1].matches,
      );

      if (top === null) return null;

      return {
        player: top[0],
        value: top[1].wins / top[1].matches,
        award: this,
      };
    },
  },
  {
    name: 'Rising Star',
    subtitle: 'Most improved ELO',
    icon: 'trending_up',

    formatValue: (val) => `+${val.toFixed(1)} ELO`,
    pickWinner(_stats, delta) {
      const top = getTop(
        Object.entries(delta.eloRatings.hybridElos).filter(
          ([, elo]) => elo.ratingChange > 0,
        ),
        (a, b) => a[1].ratingChange > b[1].ratingChange,
      );

      if (top === null) return null;

      return {
        player: top[0],
        value: top[1].ratingChange,
        award: this,
      };
    },
  },
  {
    name: 'Adversary',
    subtitle: 'Most wins vs. one opponent',
    icon: 'local_fire_department',

    formatValue: (val) => `${val} wins`,
    pickWinner(_stats, delta) {
      const top = getTop(
        Object.entries(delta.playerStats)
          .map(([name, s]) => ({
            name,
            best: Math.max(
              0,
              ...Object.values(s.matchesWonAgainst).filter((v) => v > 0),
            ),
          }))
          .filter(({ best }) => best >= 5),
        (a, b) => a.best > b.best,
      );

      if (top === null) return null;

      return { player: top.name, value: top.best, award: this };
    },
  },
  {
    name: 'Own Goal King',
    subtitle: 'Most own goals scored',
    icon: 'sentiment_very_dissatisfied',

    formatValue: (val) => `${val} own goals`,
    pickWinner(_stats, delta) {
      const top = getTop(
        Object.entries(delta.playerStats).filter(([, s]) => s.ownGoals > 5),
        (a, b) => a[1].ownGoals > b[1].ownGoals,
      );

      if (top === null) return null;

      return { player: top[0], value: top[1].ownGoals, award: this };
    },
  },

  // TODO: Move player stats to aggregate calculation
  // {
  //   name: 'Addict',
  //   subtitle: 'Most matches in a single day',
  //   icon: 'cyclone',

  //   formatValue: (val) => `${val} matches`,
  //   pickWinner(_stats, delta) {
  //     const top = getTop(
  //       Object.entries(delta.playerStats),
  //       (a, b) => a[1].mostMatchesInDay > b[1].mostMatchesInDay,
  //     );

  //     if (top === null) return null;

  //     return {
  //       player: top[0],
  //       value: top[1].mostMatchesInDay,
  //       award: this,
  //     };
  //   },
  // },
];

export const SeasonAwards: Component = () => {
  const [state] = useStatPaginator();

  const curr = createMemo(() => state.aggregateFrame.frame);
  const prev = createMemo(() => state.aggregateFrame.previousFrame);

  const delta = createMemo(() => createDeltaFrame(curr(), prev(), false));

  const awards = createMemo(() =>
    availableAwards
      .map((award) => award.pickWinner(curr(), delta()))
      .filter((winner): winner is Winner => winner !== null),
  );

  return (
    <div class={style.awardsContainer}>
      <div class={style.sectionHeader}>
        <MaterialSymbol symbol="editor_choice" color="gray" />
        Awards
      </div>

      <div class={style.awards}>
        <For each={awards()}>
          {(winner) => (
            <div class={style.award}>
              <div class={style.awardName}>
                <MaterialSymbol
                  symbol={winner.award.icon}
                  class={style.awardIcon}
                />
                {winner.award.name}
              </div>

              <div class={style.winner}>
                <Identicon value={winner.player} size={2} />

                <span class={style.awardInfo}>
                  <span class={style.playerName}>{winner.player}</span>
                  <span class={style.awardValue}>
                    {winner.award.formatValue(winner.value)}
                  </span>
                </span>
              </div>

              <div class={style.awardSubtitle}>{winner.award.subtitle}</div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};
