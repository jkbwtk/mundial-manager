import { createMemo, createSignal, For, Match, Switch } from 'solid-js';
import { Dropdown } from '#components/Dropdown';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { PlayerLink } from '#components/PlayerLink';
import {
  StatPaginatorWidget,
  type StatType,
  StatTypeOptions,
  useStatPaginatedDeltaFrame,
} from '#components/StatPaginatorWidget';
import { Divider } from '#components/Widget';
import { generateTeamColor } from '#flib/sheetUtils';
import style from './Leaderboard.module.scss';

export const EloLeaderboardBase: Component = () => {
  const aggregateFrame = useStatPaginatedDeltaFrame();

  const sortedElos = createMemo(() => ({
    playerElos: Object.entries(aggregateFrame().eloRatings.playerElos).sort(
      (a, b) => b[1].rating - a[1].rating,
    ),
    teamElos: Object.entries(aggregateFrame().eloRatings.teamElos).sort(
      (a, b) => b[1].rating - a[1].rating,
    ),
    teamIndividualElos: Object.entries(
      aggregateFrame().eloRatings.teamIndividualElos,
    ).sort((a, b) => b[1].rating - a[1].rating),
    hybridElos: Object.entries(aggregateFrame().eloRatings.hybridElos).sort(
      (a, b) => b[1].rating - a[1].rating,
    ),
  }));

  return (
    <>
      <div class={style.header}>
        <strong>Player</strong>
      </div>

      <table class={style.list}>
        <tbody>
          <For each={sortedElos().playerElos}>
            {([player, elo], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>
                <td>
                  <span style={{ color: generateTeamColor(player) }}>
                    <MaterialSymbol symbol="atr" />
                  </span>
                  <PlayerLink name={player} />
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
          <For each={sortedElos().hybridElos}>
            {([player, elo], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>
                <td>
                  <span style={{ color: generateTeamColor(player) }}>
                    <MaterialSymbol symbol="atr" />
                  </span>
                  <PlayerLink name={player} />
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
          <For each={sortedElos().teamIndividualElos}>
            {([player, elo], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>
                <td>
                  <span style={{ color: generateTeamColor(player) }}>
                    <MaterialSymbol symbol="atr" />
                  </span>
                  <PlayerLink name={player} />
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
          <For each={sortedElos().teamElos}>
            {([team, elo], index) => (
              <tr>
                <td class={style.minWidth}>{index() + 1}.</td>

                <td>
                  <span style={{ color: generateTeamColor(team) }}>
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
  const [aggregateType, setAggregateType] = createSignal<StatType>('match');

  return (
    <StatPaginatorWidget
      statType={aggregateType()}
      topLeftLabels="Elo Stats"
      class={style.container}
      topRightLabels={[
        <Dropdown
          options={StatTypeOptions}
          value={aggregateType()}
          onChange={setAggregateType}
        />,
      ]}
    >
      <EloLeaderboardBase />
    </StatPaginatorWidget>
  );
};
