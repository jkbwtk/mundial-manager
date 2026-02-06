import { createMemo, createSignal, For, Match, Switch } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import {
  DayPaginatorWidget,
  useDayPaginatedDeltaFrame,
} from '#components/DayPaginatorWidget';
import { InlineAction } from '#components/InlineAction';
import {
  MatchPaginatorWidget,
  usePaginatedDeltaFrame,
} from '#components/MatchPaginatorWidget';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { PlayerLink } from '#components/PlayerLink';
import { Divider } from '#components/Widget';
import { generateTeamColor, getGlicko2Confidence } from '#flib/sheetUtils';
import type { MatchDataDeltaFrame } from '#frontend/types';
import style from './Leaderboard.module.scss';

interface Glicko2LeaderboardBaseProps {
  useContext: () => () => MatchDataDeltaFrame;
}

export const Glicko2LeaderboardBase: Component<Glicko2LeaderboardBaseProps> = (
  props,
) => {
  const aggregateFrame = props.useContext();

  const sortedGlicko2 = createMemo(() => ({
    playerGlicko2: Object.entries(
      aggregateFrame().glicko2Ratings.playerGlicko2,
    ).sort((a, b) => b[1].rating - a[1].rating),
    teamGlicko2: Object.entries(
      aggregateFrame().glicko2Ratings.teamGlicko2,
    ).sort((a, b) => b[1].rating - a[1].rating),
    teamIndividualGlicko2: Object.entries(
      aggregateFrame().glicko2Ratings.teamIndividualGlicko2,
    ).sort((a, b) => b[1].rating - a[1].rating),
    hybridGlicko2: Object.entries(
      aggregateFrame().glicko2Ratings.hybridGlicko2,
    ).sort((a, b) => b[1].rating - a[1].rating),
  }));

  return (
    <>
      <div class={style.header}>
        <strong>Player</strong>
      </div>

      <table class={style.list}>
        <tbody>
          <For each={sortedGlicko2().playerGlicko2}>
            {([player, rating], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>
                <td>
                  <span style={{ color: generateTeamColor(player) }}>
                    <MaterialSymbol symbol="atr" />
                  </span>
                  <PlayerLink name={player} />
                </td>
                <td class={style.minWidth}>{rating.rating.toFixed(2)}</td>
                <td class={style.minWidth}>
                  ({getGlicko2Confidence(rating).toFixed(0)}%)
                </td>

                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.positive]: rating.ratingChange > 0,
                    [style.negative]: rating.ratingChange < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match when={rating.ratingChange === 0}>=</Match>
                      <Match when={rating.ratingChange > 0}>↑</Match>
                      <Match when={rating.ratingChange < 0}>↓</Match>
                    </Switch>
                  </span>

                  {Math.abs(rating.ratingChange).toFixed(2)}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>

      <Divider />

      <div class={style.header}>
        <strong>Hybrid</strong>
      </div>

      <table class={style.list}>
        <tbody>
          <For each={sortedGlicko2().hybridGlicko2}>
            {([player, rating], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>
                <td>
                  <span style={{ color: generateTeamColor(player) }}>
                    <MaterialSymbol symbol="atr" />
                  </span>
                  <PlayerLink name={player} />
                </td>
                <td class={style.minWidth}>{rating.rating.toFixed(2)}</td>
                <td class={style.minWidth}>
                  ({getGlicko2Confidence(rating).toFixed(0)}%)
                </td>

                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.positive]: rating.ratingChange > 0,
                    [style.negative]: rating.ratingChange < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match when={rating.ratingChange === 0}>=</Match>
                      <Match when={rating.ratingChange > 0}>↑</Match>
                      <Match when={rating.ratingChange < 0}>↓</Match>
                    </Switch>
                  </span>

                  {Math.abs(rating.ratingChange).toFixed(2)}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>

      <Divider />

      <div class={style.header}>
        <strong>Team Individual</strong>
      </div>

      <table class={style.list}>
        <tbody>
          <For each={sortedGlicko2().teamIndividualGlicko2}>
            {([player, rating], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>
                <td>
                  <span style={{ color: generateTeamColor(player) }}>
                    <MaterialSymbol symbol="atr" />
                  </span>
                  <PlayerLink name={player} />
                </td>
                <td class={style.minWidth}>{rating.rating.toFixed(2)}</td>
                <td class={style.minWidth}>
                  ({getGlicko2Confidence(rating).toFixed(0)}%)
                </td>

                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.positive]: rating.ratingChange > 0,
                    [style.negative]: rating.ratingChange < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match when={rating.ratingChange === 0}>=</Match>
                      <Match when={rating.ratingChange > 0}>↑</Match>
                      <Match when={rating.ratingChange < 0}>↓</Match>
                    </Switch>
                  </span>

                  {Math.abs(rating.ratingChange).toFixed(2)}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>

      <Divider />

      <div class={style.header}>
        <strong>Team</strong>
      </div>

      <table class={style.list}>
        <tbody>
          <For each={sortedGlicko2().teamGlicko2}>
            {([team, rating], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>
                <td>
                  <span style={{ color: generateTeamColor(team) }}>
                    <MaterialSymbol symbol="atr" />
                  </span>
                  {team}
                </td>
                <td class={style.minWidth}>{rating.rating.toFixed(2)}</td>
                <td class={style.minWidth}>
                  ({getGlicko2Confidence(rating).toFixed(0)}%)
                </td>

                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.positive]: rating.ratingChange > 0,
                    [style.negative]: rating.ratingChange < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match when={rating.ratingChange === 0}>=</Match>
                      <Match when={rating.ratingChange > 0}>↑</Match>
                      <Match when={rating.ratingChange < 0}>↓</Match>
                    </Switch>
                  </span>

                  {Math.abs(rating.ratingChange).toFixed(2)}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </>
  );
};

export const Glicko2Leaderboard = () => {
  const [aggregateStats, setAggregateStats] = createSignal(false);

  const paginator = () => {
    return aggregateStats()
      ? { component: DayPaginatorWidget, useContext: useDayPaginatedDeltaFrame }
      : {
          component: MatchPaginatorWidget,
          useContext: usePaginatedDeltaFrame,
        };
  };

  return (
    <Dynamic
      component={paginator().component}
      topLeftLabels="Glicko-2 Stats"
      class={style.container}
      topRightLabels={[
        <span
          classList={{
            [style.label]: true,
            [style.activeStats]: aggregateStats(),
          }}
        >
          <InlineAction
            symbol="a"
            content="A"
            onAction={() => setAggregateStats((v) => !v)}
          />
          ggregate
        </span>,
      ]}
    >
      <Glicko2LeaderboardBase useContext={paginator().useContext} />
    </Dynamic>
  );
};
