import { createMemo, For, Show } from 'solid-js';
import { DeltaDisplay } from '#components/DeltaDisplay';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { PlayerLink } from '#components/PlayerLink';
import { StatRow } from '#components/StatRow';
import { Divider, Widget } from '#components/Widget';
import { MatchSideLabels } from '#flib/matchEvents';
import type { MatchTimelineLookup } from '#flib/matchTimelineLookup';
import {
  getMatchGoalRuns,
  getMatchSurrenderSide,
  getMatchWinningSide,
} from '#shared/matchTimeline';
import type { GoalType } from '#shared/types/api/goalType';
import type { MatchSide } from '#shared/types/api/matchEvent';
import type {
  MatchPreview,
  MatchPreviewOutcome,
  MatchPreviewPlayer,
  PeriodStats,
  RatingStatsEntry,
} from '#shared/types/api/stats';
import type { LiveMatchPrediction } from '#shared/types/MundialCalculator';
import type { RatingSubject } from '#shared/types/stats/ratingStats';
import type { RatingSystem } from '#shared/types/stats/ratingSystem';
import style from './MatchSummaryModal.module.scss';

export const MatchSummaryModeEnum = {
  PREVIEW: 'PREVIEW',
  LIVE: 'LIVE',
  FINAL: 'FINAL',
} as const;

export type MatchSummaryMode =
  (typeof MatchSummaryModeEnum)[keyof typeof MatchSummaryModeEnum];

export interface MatchSummarySideProps {
  lookup: MatchTimelineLookup;
  side: MatchSide;
  mode: MatchSummaryMode;

  stats: PeriodStats | null;
  prediction: LiveMatchPrediction | null;
  winProbability: number | null; // side 1
  preview: MatchPreview | null;
}

interface MatchSummaryGoalTypeCount {
  goalType: GoalType;
  count: number;
}

interface MatchSummaryRating {
  label: string;
  entry: RatingStatsEntry;
}

interface MatchSummaryPlayer {
  uuid: string;

  goals: number;
  ownGoals: number;
  share: number;

  streaks: Record<number, number>;
  goalTypes: MatchSummaryGoalTypeCount[];
}

const MatchSummaryStreaks = [
  { length: 3, label: 'triple' },
  { length: 4, label: 'quadra' },
  { length: 5, label: 'penta' },
] as const;

const MatchSummaryRatings: {
  system: RatingSystem;
  subject: RatingSubject;
  label: string;
}[] = [
  { system: 'ELO', subject: 'HYBRID', label: 'elo' },
  { system: 'GLICKO2', subject: 'HYBRID', label: 'glicko2' },
  { system: 'SKILL', subject: 'HYBRID', label: 'skill' },
];

const MatchPreviewOutcomeLabels: Record<MatchPreviewOutcome, string> = {
  WIN: 'W',
  DRAW: 'D',
  LOSS: 'L',
};

function formatStreak(form: MatchPreviewPlayer): string {
  if (form.currentWinStreak > 0) return `W${form.currentWinStreak}`;
  if (form.currentLossStreak > 0) return `L${form.currentLossStreak}`;

  return '-';
}

function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export const MatchSummarySide: Component<MatchSummarySideProps> = (props) => {
  const timeline = () => props.lookup.timeline();

  const isSurrendered = () => {
    const { match, events } = timeline();

    return (
      match.status === 'SURRENDERED' &&
      getMatchSurrenderSide(events) === props.side
    );
  };

  const result = () => {
    const { match, events } = timeline();
    const winner = getMatchWinningSide(match, events);

    if (props.mode === MatchSummaryModeEnum.PREVIEW) {
      return MatchSideLabels[props.side];
    }

    if (match.status === 'CANCELED') return 'Cancelled';

    if (props.mode === MatchSummaryModeEnum.LIVE) {
      if (winner === null) return 'Level';

      return winner === props.side ? 'Leading' : 'Trailing';
    }

    if (winner === null) return 'Draw';

    return winner === props.side ? 'Won' : 'Lost';
  };

  const players = createMemo((): MatchSummaryPlayer[] => {
    const goalTypes = new Map(
      props.lookup.goalTypes().map((goalType) => [goalType.uuid, goalType]),
    );
    const goals = timeline().events.flatMap((event) =>
      event.type === 'GOAL' ? [event] : [],
    );
    const runs = getMatchGoalRuns(timeline().events);
    const uuids = props.lookup.getSortedSidePlayers(props.side);

    const scored = goals.filter(
      (goal) => !goal.ownGoal && uuids.includes(goal.player),
    ).length;

    return uuids.map((uuid) => {
      const playerGoals = goals.filter((goal) => goal.player === uuid);
      const ownGoals = playerGoals.filter((goal) => goal.ownGoal).length;
      const goalTypeCounts = new Map<string, number>();

      for (const goal of playerGoals) {
        for (const goalTypeUuid of goal.goalType) {
          goalTypeCounts.set(
            goalTypeUuid,
            (goalTypeCounts.get(goalTypeUuid) ?? 0) + 1,
          );
        }
      }

      const streaks: Record<number, number> = {};

      for (const run of runs) {
        if (run.player !== uuid) continue;

        streaks[run.length] = (streaks[run.length] ?? 0) + 1;
      }

      return {
        uuid,

        goals: playerGoals.length - ownGoals,
        ownGoals,
        share: scored === 0 ? 0 : (playerGoals.length - ownGoals) / scored,

        streaks,
        goalTypes: [...goalTypeCounts].flatMap(([goalTypeUuid, count]) => {
          const goalType = goalTypes.get(goalTypeUuid);

          return goalType ? [{ goalType, count }] : [];
        }),
      };
    });
  });

  const odds = () => {
    if (props.mode !== MatchSummaryModeEnum.FINAL) {
      const probability = props.winProbability;

      if (probability === null) return null;

      return props.side === 'SIDE_1' ? probability : 1 - probability;
    }

    const uuid = props.lookup.getSidePlayers(props.side).at(0);
    const luck = props.stats?.luck.find((entry) => entry.uuid === uuid);

    return luck && luck.stats.matches > 0 ? luck.stats.expectedWins : null;
  };

  const getForm = (uuid: string) =>
    props.preview?.players.find((entry) => entry.uuid === uuid) ?? null;

  const getStylePoints = (uuid: string) => {
    if (props.mode === MatchSummaryModeEnum.LIVE) {
      return Math.round(props.prediction?.stylePoints[uuid] ?? 0);
    }

    if (props.stats === null) return '-';

    const player = props.stats.players.find((entry) => entry.uuid === uuid);

    return Math.round(player?.stats.stylePoints ?? 0);
  };

  const getRatings = (uuid: string): MatchSummaryRating[] =>
    MatchSummaryRatings.flatMap(({ system, subject, label }) => {
      const entry = props.stats?.ratings.find(
        (rating) =>
          rating.uuid === uuid &&
          rating.system === system &&
          rating.subject === subject,
      );

      return entry ? [{ label, entry }] : [];
    });

  return (
    <Widget
      classList={{
        [style.side]: true,
        [style.surrenderedSide]: isSurrendered(),
      }}
      style={{ '--team-color': props.lookup.getSideColor(props.side) }}
      topLeftLabels={
        <Show
          when={isSurrendered()}
          fallback={<span class={style.teamName}>{result()}</span>}
        >
          <span
            classList={{ [style.teamName]: true, [style.surrenderChip]: true }}
          >
            <MaterialSymbol symbol="flag" color="inherit" /> Surrendered
          </span>
        </Show>
      }
      topRightLabels={
        <Show when={odds()}>
          {(current) => (
            <span>
              {formatPercentage(current())}{' '}
              {props.mode === MatchSummaryModeEnum.LIVE ? 'win' : 'odds'}
            </span>
          )}
        </Show>
      }
    >
      <div class={style.players}>
        <For each={players()}>
          {(player, index) => (
            <>
              <Show when={index() % 2 === 1}>
                <Divider
                  direction="vertical"
                  connect={0b00}
                  class={style.columnDivider}
                />
              </Show>

              <Show when={index() > 0}>
                <Divider
                  classList={{
                    [style.playerDivider]: true,
                    [style.rowDivider]: index() % 2 === 0,
                  }}
                />
              </Show>

              <Show when={props.mode === MatchSummaryModeEnum.PREVIEW}>
                <div class={style.player}>
                  <strong>
                    <PlayerLink
                      uuid={player.uuid}
                      name={props.lookup.getPlayerName(player.uuid)}
                    />
                  </strong>

                  <Show
                    when={getForm(player.uuid)}
                    fallback={<span class={style.date}>No form data</span>}
                  >
                    {(form) => (
                      <>
                        <StatRow
                          items={[
                            {
                              value: form().elo?.toFixed(0) ?? '-',
                              label: 'elo',
                            },
                            { value: formatStreak(form()), label: 'streak' },
                          ]}
                        />
                        <div class={style.form}>
                          <For each={form().recent}>
                            {(outcome) => (
                              <span
                                classList={{
                                  [style.formOutcome]: true,
                                  [style.formWin]: outcome === 'WIN',
                                  [style.formLoss]: outcome === 'LOSS',
                                }}
                              >
                                {MatchPreviewOutcomeLabels[outcome]}
                              </span>
                            )}
                          </For>
                        </div>
                      </>
                    )}
                  </Show>
                </div>
              </Show>

              <Show when={props.mode !== MatchSummaryModeEnum.PREVIEW}>
                <div class={style.player}>
                  <div class={style.playerHeader}>
                    <strong>
                      <PlayerLink
                        uuid={player.uuid}
                        name={props.lookup.getPlayerName(player.uuid)}
                      />
                    </strong>

                    <span>
                      <strong class={style.goals}>{player.goals}</strong>{' '}
                      {player.goals === 1 ? 'goal' : 'goals'}
                      <Show when={player.ownGoals > 0}>
                        {' '}
                        <span class={style.ownGoals}>
                          ({player.ownGoals} own)
                        </span>
                      </Show>
                    </span>
                  </div>

                  <div class={style.share}>
                    <div
                      class={style.meter}
                      style={{ '--share': player.share }}
                    />
                    <span>{formatPercentage(player.share)} of team</span>
                  </div>

                  <StatRow
                    items={[
                      ...MatchSummaryStreaks.map((streak) => ({
                        value: player.streaks[streak.length] ?? 0,
                        label: streak.label,
                      })),
                      { value: getStylePoints(player.uuid), label: 'style' },
                    ]}
                  />

                  <Show
                    when={
                      props.mode === MatchSummaryModeEnum.FINAL &&
                      getRatings(player.uuid).length > 0
                    }
                  >
                    <StatRow
                      items={getRatings(player.uuid).map((rating) => ({
                        value: (
                          <DeltaDisplay
                            base={rating.entry.rating.rating}
                            compared={rating.entry.previous.rating}
                          />
                        ),
                        label: rating.label,
                      }))}
                    />
                  </Show>

                  <Show when={player.goalTypes.length > 0}>
                    <div class={style.chips}>
                      <For each={player.goalTypes}>
                        {(entry) => (
                          <span class={style.chip} title={entry.goalType.name}>
                            {entry.goalType.icon ?? entry.goalType.name}{' '}
                            <strong>{entry.count}</strong>
                          </span>
                        )}
                      </For>
                    </div>
                  </Show>
                </div>
              </Show>
            </>
          )}
        </For>
      </div>
    </Widget>
  );
};
