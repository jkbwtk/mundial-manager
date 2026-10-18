import { createMemo, For } from 'solid-js';
import { Identicon } from '#components/Identicon';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { getAverageMatchDuration, getWinRate } from '#flib/derivedStats';
import { createResilientAsync, ResilientSkip } from '#flib/resilientAsync';
import type { SupportedMaterialSymbol } from '#flib/supportedMaterialSymbols';
import { queryPlayersHeadToHead } from '#flib/trpcCalls';
import { formatDuration } from '#shared/timeUtils';
import type { HeadToHead } from '#shared/types/api/headToHead';
import type { PlayerStats } from '#shared/types/stats/playerStats';
import style from './SeasonSummaryModal.module.scss';
import type { SeasonStanding, SeasonSummaryData } from './seasonSummaryData';

interface AwardCandidates {
  standings: SeasonStanding[];
  playerStats: [playerUuid: string, stats: PlayerStats][];
  headToHead: [playerUuid: string, records: HeadToHead[]][];
}

interface Award {
  name: string;
  subtitle: string;
  icon: SupportedMaterialSymbol;

  formatValue: (value: number) => string;
  getCandidates: (
    candidates: AwardCandidates,
  ) => [playerUuid: string, value: number][];
}

interface Winner {
  award: Award;

  playerUuid: string;
  value: number;
}

const MIN_MATCHES_FOR_WIN_RATE = 5;
const MIN_ADVERSARY_WINS = 5;
const MIN_OWN_GOALS = 5;

function getStatCandidates(
  candidates: AwardCandidates,
  getValue: (stats: PlayerStats) => number | null,
): [playerUuid: string, value: number][] {
  return candidates.playerStats.flatMap(([playerUuid, stats]) => {
    const value = getValue(stats);

    return value === null ? [] : [[playerUuid, value]];
  });
}

const availableAwards: Award[] = [
  {
    name: 'Champion',
    subtitle: 'Highest ELO',
    icon: 'trophy',

    formatValue: (val) => `${val.toFixed(1)} ELO`,
    getCandidates: ({ standings }) =>
      standings.map((standing) => [standing.playerUuid, standing.rating]),
  },
  {
    name: 'Top Scorer',
    subtitle: 'Most goals scored',
    icon: 'sports_soccer',

    formatValue: (val) => `${val} goals`,
    getCandidates: (candidates) =>
      getStatCandidates(candidates, (stats) => stats.goals || null),
  },
  {
    name: 'Showman',
    subtitle: 'Most style points in a match',
    icon: 'auto_awesome',

    formatValue: (val) => `${Number(val.toFixed(1))} style points`,
    getCandidates: (candidates) =>
      getStatCandidates(candidates, (stats) =>
        (stats.mostStylePointsInMatch ?? 0) > 0
          ? stats.mostStylePointsInMatch
          : null,
      ),
  },
  {
    name: 'Slowpoke',
    subtitle: 'Slowest avg. match',
    icon: 'moon_stars',

    formatValue: (val) => `${formatDuration(val)} minutes`,
    getCandidates: (candidates) =>
      getStatCandidates(candidates, getAverageMatchDuration),
  },
  {
    name: 'Marathoner',
    subtitle: 'Most matches played',
    icon: 'timer',

    formatValue: (val) => `${val} matches`,
    getCandidates: (candidates) =>
      getStatCandidates(candidates, (stats) => stats.matches),
  },
  {
    name: 'Addict',
    subtitle: 'Most matches in a single day',
    icon: 'cyclone',

    formatValue: (val) => `${val} matches`,
    getCandidates: (candidates) =>
      getStatCandidates(candidates, (stats) => stats.mostMatchesInDay || null),
  },
  {
    name: 'Unbeatable',
    subtitle: 'Highest win rate',
    icon: 'stars_2',

    formatValue: (val) => `${(val * 100).toFixed(1)}%`,
    getCandidates: (candidates) =>
      getStatCandidates(candidates, (stats) =>
        stats.matches >= MIN_MATCHES_FOR_WIN_RATE ? getWinRate(stats) : null,
      ),
  },
  {
    name: 'Rising Star',
    subtitle: 'Most improved ELO',
    icon: 'trending_up',

    formatValue: (val) => `+${val.toFixed(1)} ELO`,
    getCandidates: ({ standings }) =>
      standings.flatMap((standing) =>
        standing.ratingChange > 0
          ? [[standing.playerUuid, standing.ratingChange]]
          : [],
      ),
  },
  {
    name: 'Adversary',
    subtitle: 'Most wins vs. one opponent',
    icon: 'local_fire_department',

    formatValue: (val) => `${val} wins`,
    getCandidates: ({ headToHead }) =>
      headToHead.flatMap(([playerUuid, records]) => {
        const best = Math.max(0, ...records.map((record) => record.wins));

        return best >= MIN_ADVERSARY_WINS ? [[playerUuid, best]] : [];
      }),
  },
  {
    name: 'Own Goal King',
    subtitle: 'Most own goals scored',
    icon: 'sentiment_very_dissatisfied',

    formatValue: (val) => `${val} own goals`,
    getCandidates: (candidates) =>
      getStatCandidates(candidates, (stats) =>
        stats.ownGoals > MIN_OWN_GOALS ? stats.ownGoals : null,
      ),
  },
];

function pickWinner(award: Award, candidates: AwardCandidates): Winner | null {
  const top = award
    .getCandidates(candidates)
    .reduce<[string, number] | null>(
      (best, candidate) =>
        best === null || candidate[1] > best[1] ? candidate : best,
      null,
    );

  return top === null ? null : { award, playerUuid: top[0], value: top[1] };
}

export interface SeasonAwardsProps {
  data: SeasonSummaryData;
}

export const SeasonAwards: Component<SeasonAwardsProps> = (props) => {
  const { season, players, standings, playerStats } = props.data;

  const headToHead = createResilientAsync(() => {
    const current = season();

    if (current === null) return ResilientSkip;

    return {
      playerUuids: playerStats().map(([uuid]) => uuid),
      from: current.startDate,
      to: current.endDate,
    };
  }, queryPlayersHeadToHead);

  const awards = createMemo(() => {
    const candidates: AwardCandidates = {
      standings: standings(),
      playerStats: playerStats(),
      headToHead: headToHead.latest ?? [],
    };

    return availableAwards.flatMap(
      (award) => pickWinner(award, candidates) ?? [],
    );
  });

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
                <Identicon value={winner.playerUuid} size={2} />

                <span class={style.awardInfo}>
                  <span class={style.playerName}>
                    {players.getLabel(winner.playerUuid)}
                  </span>
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
