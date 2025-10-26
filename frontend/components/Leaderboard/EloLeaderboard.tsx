import { createMemo, For, Match, Switch } from 'solid-js';
import {
  MatchPaginatorWidget,
  usePaginatedStat,
} from '#components/MatchPaginatorWidget';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Divider } from '#components/Widget';
import { getTeamColor } from '#flib/sheetUtils';
import style from './Leaderboard.module.scss';

export const EloLeaderboardBase = () => {
  const stats = usePaginatedStat();

  const sortedElos = createMemo(() => ({
    playerElos: Object.fromEntries(
      Object.entries(stats().eloRatings.playerElos).sort(
        (a, b) => b[1].rating - a[1].rating,
      ),
    ),
    teamElos: Object.fromEntries(
      Object.entries(stats().eloRatings.teamElos).sort(
        (a, b) => b[1].rating - a[1].rating,
      ),
    ),
    teamIndividualElos: Object.fromEntries(
      Object.entries(stats().eloRatings.teamIndividualElos).sort(
        (a, b) => b[1].rating - a[1].rating,
      ),
    ),
    hybridElos: Object.fromEntries(
      Object.entries(stats().eloRatings.hybridElos).sort(
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
          <For each={Object.entries(sortedElos().playerElos)}>
            {([player, elo], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>
                <td>
                  <span style={{ color: getTeamColor(player) }}>
                    <MaterialSymbol symbol="atr" />
                  </span>
                  {player}
                </td>
                <td class={style.minWidth}>{elo.rating.toFixed(2)}</td>

                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.positive]: elo.ratingChange > 0,
                    [style.negative]: elo.ratingChange < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match when={elo.ratingChange === 0}>=</Match>
                      <Match when={elo.ratingChange > 0}>↑</Match>
                      <Match when={elo.ratingChange < 0}>↓</Match>
                    </Switch>
                  </span>

                  {Math.abs(elo.ratingChange).toFixed(2)}
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
          <For each={Object.entries(sortedElos().hybridElos)}>
            {([player, elo], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>
                <td>
                  <span style={{ color: getTeamColor(player) }}>
                    <MaterialSymbol symbol="atr" />
                  </span>
                  {player}
                </td>
                <td class={style.minWidth}>{elo.rating.toFixed(2)}</td>

                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.positive]: elo.ratingChange > 0,
                    [style.negative]: elo.ratingChange < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match when={elo.ratingChange === 0}>=</Match>
                      <Match when={elo.ratingChange > 0}>↑</Match>
                      <Match when={elo.ratingChange < 0}>↓</Match>
                    </Switch>
                  </span>

                  {Math.abs(elo.ratingChange).toFixed(2)}
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
          <For each={Object.entries(sortedElos().teamIndividualElos)}>
            {([player, elo], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>
                <td>
                  <span style={{ color: getTeamColor(player) }}>
                    <MaterialSymbol symbol="atr" />
                  </span>
                  {player}
                </td>
                <td class={style.minWidth}>{elo.rating.toFixed(2)}</td>

                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.positive]: elo.ratingChange > 0,
                    [style.negative]: elo.ratingChange < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match when={elo.ratingChange === 0}>=</Match>
                      <Match when={elo.ratingChange > 0}>↑</Match>
                      <Match when={elo.ratingChange < 0}>↓</Match>
                    </Switch>
                  </span>

                  {Math.abs(elo.ratingChange).toFixed(2)}
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
          <For each={Object.entries(sortedElos().teamElos)}>
            {([team, elo], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>

                <td>
                  <span style={{ color: getTeamColor(team) }}>
                    <MaterialSymbol symbol="atr" />
                  </span>
                  {team}
                </td>
                <td class={style.minWidth}>{elo.rating.toFixed(2)}</td>

                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.positive]: elo.ratingChange > 0,
                    [style.negative]: elo.ratingChange < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match when={elo.ratingChange === 0}>=</Match>
                      <Match when={elo.ratingChange > 0}>↑</Match>
                      <Match when={elo.ratingChange < 0}>↓</Match>
                    </Switch>
                  </span>

                  {Math.abs(elo.ratingChange).toFixed(2)}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </>
  );
};

export const EloLeaderboard = () => {
  return (
    <MatchPaginatorWidget topLeftLabels="Elo Stats" class={style.container}>
      <EloLeaderboardBase />
    </MatchPaginatorWidget>
  );
};
