import { A } from '@solidjs/router';
import Chart from 'chart.js/auto';
import figlet from 'figlet';
import smallSlant from 'figlet/fonts/Small Slant';
import {
  For,
  Match,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import { isServer } from 'solid-js/web';
import { Break } from '#components/Break';
import { Divider, Widget } from '#components/Widget';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import { useSheets } from '#providers/SheetsProvider';
import style from './Homepage.module.scss';

figlet.parseFont('Small Slant', smallSlant);

Chart.defaults.font.family = 'JetBrains Mono';
Chart.defaults.font.size = 14;

const Homepage: Component = () => {
  const [{ unit: consoleUnit }] = useConsoleUnitPrototype();
  const [, { eloStats, matchStats }] = useSheets();

  // biome-ignore lint/style/useConst: yeah
  let playerChartRef: HTMLCanvasElement = null!;
  let playerChart: Chart = null!;

  // biome-ignore lint/style/useConst: yeah
  let hybridChartRef: HTMLCanvasElement = null!;
  let hybridChart: Chart = null!;

  // biome-ignore lint/style/useConst: yeah
  let teamIndividualChartRef: HTMLCanvasElement = null!;
  let teamIndividualChart: Chart = null!;

  // biome-ignore lint/style/useConst: yeah
  let teamChartRef: HTMLCanvasElement = null!;
  let teamChart: Chart = null!;

  const [pageWidth, setPageWidth] = createSignal(120);

  const handleResize = () => {
    setPageWidth(Math.floor(window.innerWidth / consoleUnit.width));
  };

  onMount(() => {
    if (isServer === false) {
      window.addEventListener('resize', handleResize);
      handleResize();

      playerChart = new Chart(playerChartRef, {
        type: 'line',
        data: {
          labels: [],
          datasets: [],
        },
      });

      hybridChart = new Chart(hybridChartRef, {
        type: 'line',
        data: {
          labels: [],
          datasets: [],
        },
      });

      teamIndividualChart = new Chart(teamIndividualChartRef, {
        type: 'line',
        data: {
          labels: [],
          datasets: [],
        },
      });

      teamChart = new Chart(teamChartRef, {
        type: 'line',
        data: {
          labels: [],
          datasets: [],
        },
      });
    }
  });

  onCleanup(() => {
    if (isServer === false) {
      window.removeEventListener('resize', handleResize);

      playerChart.destroy();
    }
  });

  const logo = () =>
    figlet.textSync('Mundial Manager', {
      font: 'Small Slant',
      width: pageWidth(),
      whitespaceBreak: true,
    });

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

  createEffect(() => {
    const stats = matchStats();

    if (isServer) {
      return;
    }

    const players = Array.from(
      Object.keys(Object.values(stats).at(-1)?.playerElos ?? {}),
    );

    const hybridPlayers = Array.from(
      Object.keys(Object.values(stats).at(-1)?.hybridElos ?? {}),
    );

    const teamIndividualPlayers = Array.from(
      Object.keys(Object.values(stats).at(-1)?.teamIndividualElos ?? {}),
    );

    const teams = Array.from(
      Object.keys(Object.values(stats).at(-1)?.teamElos ?? {}),
    );

    playerChart.data.labels = Object.values(stats).map((s) => `#${s.id}`);
    playerChart.data.datasets = players.map((player) => ({
      label: player,
      data: Object.values(stats).map((s) => s.playerElos[player] ?? null),
    }));
    playerChart.update();

    hybridChart.data.labels = Object.values(stats).map((s) => `#${s.id}`);
    hybridChart.data.datasets = hybridPlayers.map((player) => ({
      label: player,
      data: Object.values(stats).map((s) => s.hybridElos[player] ?? null),
    }));
    hybridChart.update();

    teamIndividualChart.data.labels = Object.values(stats).map(
      (s) => `#${s.id}`,
    );
    teamIndividualChart.data.datasets = teamIndividualPlayers.map((player) => ({
      label: player,
      data: Object.values(stats).map(
        (s) => s.teamIndividualElos[player] ?? null,
      ),
    }));
    teamIndividualChart.update();

    teamChart.data.labels = Object.values(stats).map((s) => `#${s.id}`);
    teamChart.data.datasets = teams.map((team) => ({
      label: team,
      data: Object.values(stats).map((s) => s.teamElos[team] ?? null),
    }));
    teamChart.update();
  });

  return (
    <div class={style.container}>
      <strong>
        <pre class={style.logo}>{logo()}</pre>
      </strong>

      <div>Still in development</div>
      <div>
        Test pages are available <A href="/tests">here</A>
      </div>

      <Break />

      <Widget title="Elo Stats" class={style.eloStats}>
        <div class={style.header}>
          <strong>Player Stats</strong>
        </div>

        <div class={style.list}>
          <For each={Object.entries(sortedElos().playerElos)}>
            {([player, elo], index) => (
              <>
                <span>{index() + 1}.</span>
                <span> {player}</span>
                <span>{elo.toFixed(2)}</span>

                <span
                  classList={{
                    [style.positive]:
                      (eloStats().playerElosChange[player] ?? 0) > 0,
                    [style.negative]:
                      (eloStats().playerElosChange[player] ?? 0) < 0,
                  }}
                >
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

                  {Math.abs(eloStats().playerElosChange[player] ?? 0).toFixed(
                    2,
                  )}
                </span>
              </>
            )}
          </For>
        </div>

        <Divider />

        <div class={style.header}>
          <strong>Hybrid Stats</strong>
        </div>

        <div class={style.list}>
          <For each={Object.entries(sortedElos().hybridElos)}>
            {([player, elo], index) => (
              <>
                <span>{index() + 1}.</span>
                <span> {player}</span>
                <span>{elo.toFixed(2)}</span>

                <span
                  classList={{
                    [style.positive]:
                      (eloStats().hybridElosChange[player] ?? 0) > 0,
                    [style.negative]:
                      (eloStats().hybridElosChange[player] ?? 0) < 0,
                  }}
                >
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

                  {Math.abs(eloStats().hybridElosChange[player] ?? 0).toFixed(
                    2,
                  )}
                </span>
              </>
            )}
          </For>
        </div>

        <Divider />

        <div class={style.header}>
          <strong>Team Individual Stats</strong>
        </div>

        <div class={style.list}>
          <For each={Object.entries(sortedElos().teamIndividualElos)}>
            {([player, elo], index) => (
              <>
                <span>{index() + 1}.</span>
                <span> {player}</span>
                <span>{elo.toFixed(2)}</span>

                <span
                  classList={{
                    [style.positive]:
                      (eloStats().teamIndividualElosChange[player] ?? 0) > 0,
                    [style.negative]:
                      (eloStats().teamIndividualElosChange[player] ?? 0) < 0,
                  }}
                >
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

                  {Math.abs(
                    eloStats().teamIndividualElosChange[player] ?? 0,
                  ).toFixed(2)}
                </span>
              </>
            )}
          </For>
        </div>

        <Divider />

        <div class={style.header}>
          <strong>Team Stats</strong>
        </div>

        <div class={style.list}>
          <For each={Object.entries(sortedElos().teamElos)}>
            {([team, elo], index) => (
              <>
                <span>{index() + 1}.</span>
                <span> {team}</span>
                <span>{elo.toFixed(2)}</span>

                <span
                  classList={{
                    [style.positive]:
                      (eloStats().teamElosChange[team] ?? 0) > 0,
                    [style.negative]:
                      (eloStats().teamElosChange[team] ?? 0) < 0,
                  }}
                >
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

                  {Math.abs(eloStats().teamElosChange[team] ?? 0).toFixed(2)}
                </span>
              </>
            )}
          </For>
        </div>
      </Widget>

      <Widget title="Player Elo Chart" class={style.eloChart}>
        <canvas ref={playerChartRef} />
      </Widget>

      <Widget title="Hybrid Elo Chart" class={style.eloChart}>
        <canvas ref={hybridChartRef} />
      </Widget>

      <Widget title="Team Individual Elo Chart" class={style.eloChart}>
        <canvas ref={teamIndividualChartRef} />
      </Widget>

      <Widget title="Team Elo Chart" class={style.eloChart}>
        <canvas ref={teamChartRef} />
      </Widget>
    </div>
  );
};

export default Homepage;
