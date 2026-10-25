import { createMemo, For, type JSX, Show } from 'solid-js';
import { Button } from '#components/Button';
import { KeyedFor } from '#components/KeyedFor';
import { MatchSideLabel } from '#components/MatchSideLabel';
import { useMatchSummaryModal } from '#components/MatchSummaryModal';
import { MatchEventSymbol } from '#components/MatchTimelineTable';
import { Divider, Widget } from '#components/Widget';
import { useActiveMatches, useLiveMatchPrediction } from '#flib/activeMatches';
import { usePlayerLookup, useTableLookup } from '#flib/entityLookup';
import { MatchEventTypeLabels } from '#flib/matchEvents';
import { isMobile } from '#flib/utils';
import { getMatchPlayerUuids } from '#shared/matchPlayers';
import { getMatchWinningSide } from '#shared/matchTimeline';
import { formatDuration } from '#shared/timeUtils';
import type { ActiveMatch } from '#shared/types/api/activeMatch';
import type { MatchEvent } from '#shared/types/api/matchEvent';
import style from './LiveMatches.module.scss';
import { LiveMatchClock, LiveWinBar } from './LiveMatchParts';

export interface LiveMatchesProps {
  class?: string;
  classList?: JSX.CustomAttributes<HTMLElement>['classList'];
}

interface LiveMatchCardProps {
  active: ActiveMatch;
}

const LIVE_MATCH_RECENT_EVENTS = 5;

const LiveMatchCard: Component<LiveMatchCardProps> = (props) => {
  const players = usePlayerLookup();
  const tables = useTableLookup();
  const prediction = useLiveMatchPrediction(() => props.active);
  const openSummary = useMatchSummaryModal();

  const match = () => props.active.match;

  const recentEvents = createMemo(() =>
    props.active.events.slice(-LIVE_MATCH_RECENT_EVENTS),
  );

  const leader = () => getMatchWinningSide(match(), props.active.events);

  const stylePoints = createMemo(() => {
    const points = prediction()?.stylePoints ?? {};

    return getMatchPlayerUuids(match())
      .flatMap((uuid) => {
        const value = Math.round(points[uuid] ?? 0);

        return value === 0 ? [] : [{ uuid, value }];
      })
      .toSorted((a, b) => a.value - b.value);
  });

  const describeEvent = (event: MatchEvent) => {
    if (event.type !== 'GOAL') return MatchEventTypeLabels[event.type];

    const name = players.getLabel(event.player);

    return event.ownGoal ? `Own goal ${name}` : name;
  };

  return (
    <div class={style.card}>
      <div class={style.cardHeader}>
        <span>
          <span class={style.liveDot} aria-hidden="true">
            ●
          </span>{' '}
          <strong>LIVE</strong> <LiveMatchClock active={props.active} />
        </span>
        <span class={style.cardActions}>
          <span class={style.cardTable}>
            <Show when={match().tableUuid}>
              {(uuid) => <>{tables.getLabel(uuid())}</>}
            </Show>
            <Show when={match().stakesModifier > 1}>
              {' '}
              ×{match().stakesModifier}
            </Show>
          </span>
          <Button
            severity="secondary"
            onClick={() => openSummary(match().uuid)}
          >
            Summary
          </Button>
        </span>
      </div>

      <div
        classList={{
          [style.scoreline]: true,
          [style.mobile]: isMobile(),
        }}
      >
        <MatchSideLabel
          class={style.side1}
          match={match()}
          side="SIDE_1"
          align={isMobile() ? 'start' : 'end'}
          stacked
          highlight={leader() === 'SIDE_1'}
        />
        <strong class={style.score1}>{match().side1Score}</strong>
        <Show
          when={prediction()}
          fallback={<span class={style.bar} aria-hidden="true" />}
        >
          {(current) => (
            <>
              <LiveWinBar
                class={style.bar}
                active={props.active}
                probability={current().winProbability}
              />
              <span class={style.caption}>
                <span>{Math.round(current().winProbability * 100)}%</span>
                <span title="Expected final score">
                  {current().expectedScore.score[0]} :{' '}
                  {current().expectedScore.score[1]}
                </span>
                <span>{Math.round((1 - current().winProbability) * 100)}%</span>
              </span>
            </>
          )}
        </Show>
        <strong class={style.score2}>{match().side2Score}</strong>
        <MatchSideLabel
          class={style.side2}
          match={match()}
          side="SIDE_2"
          align={isMobile() ? 'end' : 'start'}
          stacked
          highlight={leader() === 'SIDE_2'}
        />
      </div>

      <Show when={recentEvents().length > 0}>
        <div class={style.feed}>
          <span class={style.feedItems}>
            <For each={recentEvents()}>
              {(event) => (
                <span>
                  <span class={style.dimmed}>
                    {formatDuration(event.offset - (event.offset % 1000))}
                  </span>{' '}
                  <MatchEventSymbol event={event} /> {describeEvent(event)}
                </span>
              )}
            </For>
          </span>
        </div>
      </Show>

      <Show when={stylePoints().length > 0}>
        <div class={style.feed}>
          <span class={style.dimmed}>style</span>
          <span class={style.feedItems}>
            <For each={stylePoints()}>
              {(entry) => (
                <span>
                  {players.getLabel(entry.uuid)} <strong>{entry.value}</strong>
                </span>
              )}
            </For>
          </span>
        </div>
      </Show>
    </div>
  );
};

export const LiveMatches: Component<LiveMatchesProps> = (props) => {
  const matches = useActiveMatches();

  const live = () =>
    matches().filter((active) => active.match.status === 'ONGOING');

  return (
    <Show when={live().length > 0}>
      <Widget
        classList={{
          [style.widget]: true,
          [props.class ?? '']: !!props.class,
          ...(props.classList ?? {}),
        }}
        topLeftLabels="Live"
      >
        <KeyedFor each={live()} by={(active) => active.match.uuid}>
          {(active, key) => (
            <>
              <Show when={live()[0]?.match.uuid !== key}>
                <Divider class={style.dashedDivider} />
              </Show>
              <LiveMatchCard active={active()} />
            </>
          )}
        </KeyedFor>
      </Widget>
    </Show>
  );
};
