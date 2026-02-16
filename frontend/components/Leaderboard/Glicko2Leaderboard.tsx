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
import { generateTeamColor, getGlicko2Confidence } from '#flib/sheetUtils';
import style from './Leaderboard.module.scss';

export const Glicko2LeaderboardBase: Component = () => {
  const aggregateFrame = useStatPaginatedDeltaFrame();

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
  const [aggregateType, setAggregateType] = createSignal<StatType>('match');

  return (
    <StatPaginatorWidget
      statType={aggregateType()}
      topLeftLabels="Glicko-2 Stats"
      class={style.container}
      topRightLabels={[
        <Dropdown
          options={StatTypeOptions}
          value={aggregateType()}
          onChange={setAggregateType}
        />,
      ]}
    >
      <Glicko2LeaderboardBase />
    </StatPaginatorWidget>
  );
};
