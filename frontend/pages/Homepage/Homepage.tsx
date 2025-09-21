import { A } from '@solidjs/router';
import Chart from 'chart.js/auto';
import figlet from 'figlet';
import smallSlant from 'figlet/fonts/Small Slant';
import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { isServer } from 'solid-js/web';
import { Break } from '#components/Break';
import { EloLeaderboard, Glicko2Leaderboard } from '#components/Leaderboard';
import { Widget } from '#components/Widget';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import { useSheets } from '#providers/SheetsProvider';
import style from './Homepage.module.scss';

figlet.parseFont('Small Slant', smallSlant);

Chart.defaults.font.family = 'JetBrains Mono';
Chart.defaults.font.size = 14;

const Homepage: Component = () => {
  const [{ unit: consoleUnit }] = useConsoleUnitPrototype();
  const [, { matchStats }] = useSheets();

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

  // biome-ignore lint/style/useConst: yeah
  let playerGlicko2ChartRef: HTMLCanvasElement = null!;
  let playerGlicko2Chart: Chart = null!;

  // biome-ignore lint/style/useConst: yeah
  let hybridGlicko2ChartRef: HTMLCanvasElement = null!;
  let hybridGlicko2Chart: Chart = null!;

  // biome-ignore lint/style/useConst: yeah
  let teamIndividualGlicko2ChartRef: HTMLCanvasElement = null!;
  let teamIndividualGlicko2Chart: Chart = null!;

  // biome-ignore lint/style/useConst: yeah
  let teamGlicko2ChartRef: HTMLCanvasElement = null!;
  let teamGlicko2Chart: Chart = null!;

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

      playerGlicko2Chart = new Chart(playerGlicko2ChartRef, {
        type: 'line',
        data: {
          labels: [],
          datasets: [],
        },
      });

      hybridGlicko2Chart = new Chart(hybridGlicko2ChartRef, {
        type: 'line',
        data: {
          labels: [],
          datasets: [],
        },
      });

      teamIndividualGlicko2Chart = new Chart(teamIndividualGlicko2ChartRef, {
        type: 'line',
        data: {
          labels: [],
          datasets: [],
        },
      });

      teamGlicko2Chart = new Chart(teamGlicko2ChartRef, {
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
      hybridChart.destroy();
      teamIndividualChart.destroy();
      teamChart.destroy();
      playerGlicko2Chart.destroy();
      hybridGlicko2Chart.destroy();
      teamIndividualGlicko2Chart.destroy();
      teamGlicko2Chart.destroy();
    }
  });

  const logo = () =>
    figlet.textSync('Mundial Manager', {
      font: 'Small Slant',
      width: pageWidth(),
      whitespaceBreak: true,
    });

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

    // Glicko-2 chart updates
    const glicko2Players = Array.from(
      Object.keys(Object.values(stats).at(-1)?.playerGlicko2 ?? {}),
    );

    const hybridGlicko2Players = Array.from(
      Object.keys(Object.values(stats).at(-1)?.hybridGlicko2 ?? {}),
    );

    playerGlicko2Chart.data.labels = Object.values(stats).map(
      (s) => `#${s.id}`,
    );
    playerGlicko2Chart.data.datasets = glicko2Players.map((player) => ({
      label: player,
      data: Object.values(stats).map(
        (s) => s.playerGlicko2[player]?.rating ?? null,
      ),
    }));
    playerGlicko2Chart.update();

    hybridGlicko2Chart.data.labels = Object.values(stats).map(
      (s) => `#${s.id}`,
    );
    hybridGlicko2Chart.data.datasets = hybridGlicko2Players.map((player) => ({
      label: player,
      data: Object.values(stats).map(
        (s) => s.hybridGlicko2[player]?.rating ?? null,
      ),
    }));
    hybridGlicko2Chart.update();

    // Team Individual and Team Glicko-2 charts
    const teamIndividualGlicko2Players = Array.from(
      Object.keys(Object.values(stats).at(-1)?.teamIndividualGlicko2 ?? {}),
    );

    const teamGlicko2Teams = Array.from(
      Object.keys(Object.values(stats).at(-1)?.teamGlicko2 ?? {}),
    );

    teamIndividualGlicko2Chart.data.labels = Object.values(stats).map(
      (s) => `#${s.id}`,
    );
    teamIndividualGlicko2Chart.data.datasets = teamIndividualGlicko2Players.map(
      (player) => ({
        label: player,
        data: Object.values(stats).map(
          (s) => s.teamIndividualGlicko2[player]?.rating ?? null,
        ),
      }),
    );
    teamIndividualGlicko2Chart.update();

    teamGlicko2Chart.data.labels = Object.values(stats).map((s) => `#${s.id}`);
    teamGlicko2Chart.data.datasets = teamGlicko2Teams.map((team) => ({
      label: team,
      data: Object.values(stats).map(
        (s) => s.teamGlicko2[team]?.rating ?? null,
      ),
    }));
    teamGlicko2Chart.update();
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

      <Widget title="Stats" class={style.statsContainer}>
        <EloLeaderboard />

        <Glicko2Leaderboard />
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

      <Widget title="Player Glicko-2 Chart" class={style.eloChart}>
        <canvas ref={playerGlicko2ChartRef} />
      </Widget>

      <Widget title="Hybrid Glicko-2 Chart" class={style.eloChart}>
        <canvas ref={hybridGlicko2ChartRef} />
      </Widget>

      <Widget title="Team Individual Glicko-2 Chart" class={style.eloChart}>
        <canvas ref={teamIndividualGlicko2ChartRef} />
      </Widget>

      <Widget title="Team Glicko-2 Chart" class={style.eloChart}>
        <canvas ref={teamGlicko2ChartRef} />
      </Widget>
    </div>
  );
};

export default Homepage;
