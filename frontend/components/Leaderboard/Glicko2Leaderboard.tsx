import { createMemo, For, Match, Switch } from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Divider, Widget } from '#components/Widget';
import { getGlicko2Confidence, getTeamColor } from '#flib/sheetUtils';
import { useSheets } from '#providers/SheetsProvider';
import style from './Leaderboard.module.scss';

export const Glicko2Leaderboard = () => {
  const [, { glicko2Stats }] = useSheets();

  const sortedGlicko2 = createMemo(() => ({
    playerGlicko2: Object.fromEntries(
      Object.entries(glicko2Stats().playerGlicko2).sort(
        (a, b) => b[1].rating - a[1].rating,
      ),
    ),
    teamGlicko2: Object.fromEntries(
      Object.entries(glicko2Stats().teamGlicko2).sort(
        (a, b) => b[1].rating - a[1].rating,
      ),
    ),
    teamIndividualGlicko2: Object.fromEntries(
      Object.entries(glicko2Stats().teamIndividualGlicko2).sort(
        (a, b) => b[1].rating - a[1].rating,
      ),
    ),
    hybridGlicko2: Object.fromEntries(
      Object.entries(glicko2Stats().hybridGlicko2).sort(
        (a, b) => b[1].rating - a[1].rating,
      ),
    ),
  }));

  return (
    <Widget title="Glicko-2 Stats" class={style.container}>
      <div class={style.header}>
        <strong>Player Glicko-2</strong>
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
                    [style.positive]:
                      (glicko2Stats().playerGlicko2Change[player]?.rating ??
                        0) > 0,
                    [style.negative]:
                      (glicko2Stats().playerGlicko2Change[player]?.rating ??
                        0) < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match
                        when={
                          glicko2Stats().playerGlicko2Change[player]?.rating ===
                          0
                        }
                      >
                        =
                      </Match>
                      <Match
                        when={
                          (glicko2Stats().playerGlicko2Change[player]?.rating ??
                            0) > 0
                        }
                      >
                        ↑
                      </Match>
                      <Match
                        when={
                          (glicko2Stats().playerGlicko2Change[player]?.rating ??
                            0) < 0
                        }
                      >
                        ↓
                      </Match>
                    </Switch>
                  </span>

                  {Math.abs(
                    glicko2Stats().playerGlicko2Change[player]?.rating ?? 0,
                  ).toFixed(2)}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>

      <Divider />

      <div class={style.header}>
        <strong>Hybrid Glicko-2</strong>
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
                    [style.positive]:
                      (glicko2Stats().hybridGlicko2Change[player]?.rating ??
                        0) > 0,
                    [style.negative]:
                      (glicko2Stats().hybridGlicko2Change[player]?.rating ??
                        0) < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match
                        when={
                          glicko2Stats().hybridGlicko2Change[player]?.rating ===
                          0
                        }
                      >
                        =
                      </Match>
                      <Match
                        when={
                          (glicko2Stats().hybridGlicko2Change[player]?.rating ??
                            0) > 0
                        }
                      >
                        ↑
                      </Match>
                      <Match
                        when={
                          (glicko2Stats().hybridGlicko2Change[player]?.rating ??
                            0) < 0
                        }
                      >
                        ↓
                      </Match>
                    </Switch>
                  </span>

                  {Math.abs(
                    glicko2Stats().hybridGlicko2Change[player]?.rating ?? 0,
                  ).toFixed(2)}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>

      <Divider />

      <div class={style.header}>
        <strong>Team Individual Glicko-2</strong>
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
                    [style.positive]:
                      (glicko2Stats().teamIndividualGlicko2Change[player]
                        ?.rating ?? 0) > 0,
                    [style.negative]:
                      (glicko2Stats().teamIndividualGlicko2Change[player]
                        ?.rating ?? 0) < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match
                        when={
                          glicko2Stats().teamIndividualGlicko2Change[player]
                            ?.rating === 0
                        }
                      >
                        =
                      </Match>
                      <Match
                        when={
                          (glicko2Stats().teamIndividualGlicko2Change[player]
                            ?.rating ?? 0) > 0
                        }
                      >
                        ↑
                      </Match>
                      <Match
                        when={
                          (glicko2Stats().teamIndividualGlicko2Change[player]
                            ?.rating ?? 0) < 0
                        }
                      >
                        ↓
                      </Match>
                    </Switch>
                  </span>

                  {Math.abs(
                    glicko2Stats().teamIndividualGlicko2Change[player]
                      ?.rating ?? 0,
                  ).toFixed(2)}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>

      <Divider />

      <div class={style.header}>
        <strong>Team Glicko-2</strong>
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
                    [style.positive]:
                      (glicko2Stats().teamGlicko2Change[team]?.rating ?? 0) > 0,
                    [style.negative]:
                      (glicko2Stats().teamGlicko2Change[team]?.rating ?? 0) < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match
                        when={
                          glicko2Stats().teamGlicko2Change[team]?.rating === 0
                        }
                      >
                        =
                      </Match>
                      <Match
                        when={
                          (glicko2Stats().teamGlicko2Change[team]?.rating ??
                            0) > 0
                        }
                      >
                        ↑
                      </Match>
                      <Match
                        when={
                          (glicko2Stats().teamGlicko2Change[team]?.rating ??
                            0) < 0
                        }
                      >
                        ↓
                      </Match>
                    </Switch>
                  </span>

                  {Math.abs(
                    glicko2Stats().teamGlicko2Change[team]?.rating ?? 0,
                  ).toFixed(2)}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </Widget>
  );
};
