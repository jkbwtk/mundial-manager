import { A } from '@solidjs/router';
import type { ChartConfiguration } from 'chart.js';
import figlet from 'figlet';
import smallSlant from 'figlet/fonts/Small Slant';
import { createMemo } from 'solid-js';
import { Break } from '#components/Break';
import { ChartWrapper } from '#components/ChartWrapper';
import { EloLeaderboard, Glicko2Leaderboard } from '#components/Leaderboard';
import { Widget } from '#components/Widget';
import { getTeamColor } from '#flib/sheetUtils';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import { useSheets } from '#providers/SheetsProvider';
import style from './Homepage.module.scss';

figlet.parseFont('Small Slant', smallSlant);

const Homepage: Component = () => {
  const [{ windowSize }] = useConsoleUnitPrototype();
  const [, { matchStats, eloStats, glicko2Stats }] = useSheets();

  const playerChartConfig = createMemo((): ChartConfiguration => {
    const currentStats = matchStats();
    const elo = eloStats();

    return {
      type: 'line',
      data: {
        labels: elo.labels,
        datasets: elo.individualPlayers.map((player) => ({
          label: player,
          data: Object.values(currentStats).map(
            (s) => s.playerElos[player] ?? null,
          ),
          borderColor: getTeamColor(player),
          backgroundColor: `${getTeamColor(player)}20`,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  });

  const hybridChartConfig = createMemo((): ChartConfiguration => {
    const currentStats = matchStats();
    const elo = eloStats();

    return {
      type: 'line',
      data: {
        labels: elo.labels,
        datasets: elo.hybridPlayers.map((player: string) => ({
          label: player,
          data: Object.values(currentStats).map(
            (s) => s.hybridElos[player] ?? null,
          ),
          borderColor: getTeamColor(player),
          backgroundColor: `${getTeamColor(player)}20`,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  });

  const teamIndividualChartConfig = createMemo((): ChartConfiguration => {
    const currentStats = matchStats();
    const elo = eloStats();

    return {
      type: 'line',
      data: {
        labels: elo.labels,
        datasets: elo.teamIndividualPlayers.map((player: string) => ({
          label: player,
          data: Object.values(currentStats).map(
            (s) => s.teamIndividualElos[player] ?? null,
          ),
          borderColor: getTeamColor(player),
          backgroundColor: `${getTeamColor(player)}20`,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  });

  const teamChartConfig = createMemo((): ChartConfiguration => {
    const currentStats = matchStats();
    const elo = eloStats();

    return {
      type: 'line',
      data: {
        labels: elo.labels,
        datasets: elo.teams.map((team: string) => ({
          label: team,
          data: Object.values(currentStats).map(
            (s) => s.teamElos[team] ?? null,
          ),
          borderColor: getTeamColor(team),
          backgroundColor: `${getTeamColor(team)}20`,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  });

  const playerGlicko2ChartConfig = createMemo((): ChartConfiguration => {
    const currentStats = matchStats();
    const glicko2 = glicko2Stats();

    return {
      type: 'line',
      data: {
        labels: glicko2.labels,
        datasets: glicko2.individualPlayers.map((player: string) => ({
          label: player,
          data: Object.values(currentStats).map(
            (s) => s.playerGlicko2[player]?.rating ?? null,
          ),
          borderColor: getTeamColor(player),
          backgroundColor: `${getTeamColor(player)}20`,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  });

  const hybridGlicko2ChartConfig = createMemo((): ChartConfiguration => {
    const currentStats = matchStats();
    const glicko2 = glicko2Stats();

    return {
      type: 'line',
      data: {
        labels: glicko2.labels,
        datasets: glicko2.hybridPlayers.map((player: string) => ({
          label: player,
          data: Object.values(currentStats).map(
            (s) => s.hybridGlicko2[player]?.rating ?? null,
          ),
          borderColor: getTeamColor(player),
          backgroundColor: `${getTeamColor(player)}20`,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  });

  const teamIndividualGlicko2ChartConfig = createMemo(
    (): ChartConfiguration => {
      const currentStats = matchStats();
      const glicko2 = glicko2Stats();

      return {
        type: 'line',
        data: {
          labels: glicko2.labels,
          datasets: glicko2.teamIndividualPlayers.map((player: string) => ({
            label: player,
            data: Object.values(currentStats).map(
              (s) => s.teamIndividualGlicko2[player]?.rating ?? null,
            ),
            borderColor: getTeamColor(player),
            backgroundColor: `${getTeamColor(player)}20`,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
      };
    },
  );

  const teamGlicko2ChartConfig = createMemo((): ChartConfiguration => {
    const currentStats = matchStats();
    const glicko2 = glicko2Stats();

    return {
      type: 'line',
      data: {
        labels: glicko2.labels,
        datasets: glicko2.teams.map((team: string) => ({
          label: team,
          data: Object.values(currentStats).map(
            (s) => s.teamGlicko2[team]?.rating ?? null,
          ),
          borderColor: getTeamColor(team),
          backgroundColor: `${getTeamColor(team)}20`,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  });

  const logo = () =>
    figlet.textSync('Mundial Manager', {
      font: 'Small Slant',
      width: windowSize.width,
      whitespaceBreak: true,
    });

  return (
    <div class={style.container}>
      <pre
        classList={{
          [style.logo]: true,
          [style.centered]: true,
        }}
      >
        {logo()}
      </pre>

      <div>Still in development</div>
      <div>
        Test pages are available <A href="/tests">here</A>
      </div>

      <Break />

      <Widget topLeftLabels="Stats" class={style.statsWidget}>
        <div class={style.statsContainer}>
          <EloLeaderboard />

          <Glicko2Leaderboard />
        </div>
      </Widget>

      <Widget topLeftLabels="Player Elo Chart" class={style.eloChart}>
        <ChartWrapper config={playerChartConfig()} />
      </Widget>

      <Widget topLeftLabels="Hybrid Elo Chart" class={style.eloChart}>
        <ChartWrapper config={hybridChartConfig()} />
      </Widget>

      <Widget topLeftLabels="Team Individual Elo Chart" class={style.eloChart}>
        <ChartWrapper config={teamIndividualChartConfig()} />
      </Widget>

      <Widget topLeftLabels="Team Elo Chart" class={style.eloChart}>
        <ChartWrapper config={teamChartConfig()} />
      </Widget>

      <Widget topLeftLabels="Player Glicko-2 Chart" class={style.eloChart}>
        <ChartWrapper config={playerGlicko2ChartConfig()} />
      </Widget>

      <Widget topLeftLabels="Hybrid Glicko-2 Chart" class={style.eloChart}>
        <ChartWrapper config={hybridGlicko2ChartConfig()} />
      </Widget>

      <Widget
        topLeftLabels="Team Individual Glicko-2 Chart"
        class={style.eloChart}
      >
        <ChartWrapper config={teamIndividualGlicko2ChartConfig()} />
      </Widget>

      <Widget topLeftLabels="Team Glicko-2 Chart" class={style.eloChart}>
        <ChartWrapper config={teamGlicko2ChartConfig()} />
      </Widget>
    </div>
  );
};

export default Homepage;
