import { createMemo, For, Match, Switch } from 'solid-js';
import {
  MatchPaginatorWidget,
  usePaginatedStat,
} from '#components/MatchPaginatorWidget';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Divider } from '#components/Widget';
import { getGlicko2Confidence, getTeamColor } from '#flib/sheetUtils';
import style from './Leaderboard.module.scss';

export const Glicko2LeaderboardBase = () => {
  const stats = usePaginatedStat();

  const sortedGlicko2 = createMemo(() => ({
    playerGlicko2: Object.fromEntries(
      Object.entries(stats().glicko2Ratings.playerGlicko2).sort(
        (a, b) => b[1].rating - a[1].rating,
      ),
    ),
    teamGlicko2: Object.fromEntries(
      Object.entries(stats().glicko2Ratings.teamGlicko2).sort(
        (a, b) => b[1].rating - a[1].rating,
      ),
    ),
    teamIndividualGlicko2: Object.fromEntries(
      Object.entries(stats().glicko2Ratings.teamIndividualGlicko2).sort(
        (a, b) => b[1].rating - a[1].rating,
      ),
    ),
    hybridGlicko2: Object.fromEntries(
      Object.entries(stats().glicko2Ratings.hybridGlicko2).sort(
        (a, b) => b[1].rating - a[1].rating,
      ),
    ),
  }));

  return (
    <>
      <div class={style.header}>
        <strong>Player</strong>
      </div>

      <table class={style.list}>
        <tbody>
          <For each={Object.entries(sortedGlicko2().playerGlicko2)}>
            {([player, rating], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>
                <td>
                  <span style={{ color: getTeamColor(player) }}>
                    <MaterialSymbol symbol="atr" />
                  </span>
                  {player}
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
          <For each={Object.entries(sortedGlicko2().hybridGlicko2)}>
            {([player, rating], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>
                <td>
                  <span style={{ color: getTeamColor(player) }}>
                    <MaterialSymbol symbol="atr" />
                  </span>
                  {player}
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
          <For each={Object.entries(sortedGlicko2().teamIndividualGlicko2)}>
            {([player, rating], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>
                <td>
                  <span style={{ color: getTeamColor(player) }}>
                    <MaterialSymbol symbol="atr" />
                  </span>
                  {player}
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
          <For each={Object.entries(sortedGlicko2().teamGlicko2)}>
            {([team, rating], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>
                <td>
                  <span style={{ color: getTeamColor(team) }}>
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

export const Glicko2Leaderboard = () => (
  <MatchPaginatorWidget topLeftLabels="Glicko-2 Stats" class={style.container}>
    <Glicko2LeaderboardBase />
  </MatchPaginatorWidget>
);
