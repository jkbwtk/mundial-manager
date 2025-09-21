import { createMemo, For, Match, Switch } from 'solid-js';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Divider, Widget } from '#components/Widget';
import { getTeamColor } from '#flib/sheetUtils';
import { useSheets } from '#providers/SheetsProvider';
import style from './Leaderboard.module.scss';

export const EloLeaderboard = () => {
  const [, { eloStats }] = useSheets();

  const sortedElos = createMemo(() => ({
    playerElos: Object.fromEntries(
      Object.entries(eloStats().playerElos).sort((a, b) => b[1] - a[1]),
    ),
    teamElos: Object.fromEntries(
      Object.entries(eloStats().teamElos).sort((a, b) => b[1] - a[1]),
    ),
    teamIndividualElos: Object.fromEntries(
      Object.entries(eloStats().teamIndividualElos).sort((a, b) => b[1] - a[1]),
    ),
    hybridElos: Object.fromEntries(
      Object.entries(eloStats().hybridElos).sort((a, b) => b[1] - a[1]),
    ),
  }));

  return (
    <Widget title="Elo Stats" class={style.container}>
      <div class={style.header}>
        <strong>Player Stats</strong>
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
                <td class={style.minWidth}>{elo.toFixed(2)}</td>

                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.positive]:
                      (eloStats().playerElosChange[player] ?? 0) > 0,
                    [style.negative]:
                      (eloStats().playerElosChange[player] ?? 0) < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match when={eloStats().playerElosChange[player] === 0}>
                        =
                      </Match>
                      <Match
                        when={(eloStats().playerElosChange[player] ?? 0) > 0}
                      >
                        ↑
                      </Match>
                      <Match
                        when={(eloStats().playerElosChange[player] ?? 0) < 0}
                      >
                        ↓
                      </Match>
                    </Switch>
                  </span>

                  {Math.abs(eloStats().playerElosChange[player] ?? 0).toFixed(
                    2,
                  )}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>

      <Divider />

      <div class={style.header}>
        <strong>Hybrid Stats</strong>
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
                <td class={style.minWidth}>{elo.toFixed(2)}</td>

                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.positive]:
                      (eloStats().hybridElosChange[player] ?? 0) > 0,
                    [style.negative]:
                      (eloStats().hybridElosChange[player] ?? 0) < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match when={eloStats().hybridElosChange[player] === 0}>
                        =
                      </Match>
                      <Match
                        when={(eloStats().hybridElosChange[player] ?? 0) > 0}
                      >
                        ↑
                      </Match>
                      <Match
                        when={(eloStats().hybridElosChange[player] ?? 0) < 0}
                      >
                        ↓
                      </Match>
                    </Switch>
                  </span>

                  {Math.abs(eloStats().hybridElosChange[player] ?? 0).toFixed(
                    2,
                  )}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>

      <Divider />

      <div class={style.header}>
        <strong>Team Individual Stats</strong>
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
                <td class={style.minWidth}>{elo.toFixed(2)}</td>

                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.positive]:
                      (eloStats().teamIndividualElosChange[player] ?? 0) > 0,
                    [style.negative]:
                      (eloStats().teamIndividualElosChange[player] ?? 0) < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match
                        when={eloStats().teamIndividualElosChange[player] === 0}
                      >
                        =
                      </Match>
                      <Match
                        when={
                          (eloStats().teamIndividualElosChange[player] ?? 0) > 0
                        }
                      >
                        ↑
                      </Match>
                      <Match
                        when={
                          (eloStats().teamIndividualElosChange[player] ?? 0) < 0
                        }
                      >
                        ↓
                      </Match>
                    </Switch>
                  </span>

                  {Math.abs(
                    eloStats().teamIndividualElosChange[player] ?? 0,
                  ).toFixed(2)}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>

      <Divider />

      <div class={style.header}>
        <strong>Team Stats</strong>
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
                <td class={style.minWidth}>{elo.toFixed(2)}</td>

                <td
                  classList={{
                    [style.minWidth]: true,
                    [style.positive]:
                      (eloStats().teamElosChange[team] ?? 0) > 0,
                    [style.negative]:
                      (eloStats().teamElosChange[team] ?? 0) < 0,
                  }}
                >
                  <span class={style.deltaSymbol}>
                    <Switch>
                      <Match when={eloStats().teamElosChange[team] === 0}>
                        =
                      </Match>
                      <Match when={(eloStats().teamElosChange[team] ?? 0) > 0}>
                        ↑
                      </Match>
                      <Match when={(eloStats().teamElosChange[team] ?? 0) < 0}>
                        ↓
                      </Match>
                    </Switch>
                  </span>

                  {Math.abs(eloStats().teamElosChange[team] ?? 0).toFixed(2)}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </Widget>
  );
};
