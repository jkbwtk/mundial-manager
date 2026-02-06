import type { ChartConfiguration } from 'chart.js';
import { createMemo, lazy } from 'solid-js';
import { Widget } from '#components/Widget';
import { generateTeamColor } from '#flib/sheetUtils';
import { useSheets } from '#providers/SheetsProvider';
import style from './RatingChats.module.scss';

const ChartWrapper = lazy(() =>
  import('#components/ChartWrapper').then((c) => ({ default: c.ChartWrapper })),
);

export const RatingCharts: Component = () => {
  const [, { matchStats, matchData, latest }] = useSheets();

  const matchLabels = createMemo(() =>
    Object.values(matchStats()).map((s) => s.label),
  );

  const playerChartConfig = createMemo((): ChartConfiguration => {
    const players = latest().generalStats.players;
    const frames = matchData().frames;

    return {
      type: 'line',
      data: {
        labels: matchLabels(),
        datasets: players.map((player) => ({
          label: player,
          data: frames.map(
            (frame) => frame.eloRatings.playerElos[player]?.rating ?? null,
          ),
          borderColor: generateTeamColor(player),
          backgroundColor: `${generateTeamColor(player)}20`,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  });

  const hybridChartConfig = createMemo((): ChartConfiguration => {
    const players = latest().generalStats.players;
    const frames = matchData().frames;

    return {
      type: 'line',
      data: {
        labels: matchLabels(),
        datasets: players.map((player) => ({
          label: player,
          data: frames.map(
            (frame) => frame.eloRatings.hybridElos[player]?.rating ?? null,
          ),
          borderColor: generateTeamColor(player),
          backgroundColor: `${generateTeamColor(player)}20`,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  });

  const teamIndividualChartConfig = createMemo((): ChartConfiguration => {
    const players = latest().generalStats.players;
    const frames = matchData().frames;

    return {
      type: 'line',
      data: {
        labels: matchLabels(),
        datasets: players.map((player) => ({
          label: player,
          data: frames.map(
            (frame) =>
              frame.eloRatings.teamIndividualElos[player]?.rating ?? null,
          ),
          borderColor: generateTeamColor(player),
          backgroundColor: `${generateTeamColor(player)}20`,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  });

  const teamChartConfig = createMemo((): ChartConfiguration => {
    const teams = latest().generalStats.teams;
    const frames = matchData().frames;

    return {
      type: 'line',
      data: {
        labels: matchLabels(),
        datasets: teams.map((team) => ({
          label: team,
          data: frames.map(
            (frame) => frame.eloRatings.teamElos[team]?.rating ?? null,
          ),
          borderColor: generateTeamColor(team),
          backgroundColor: `${generateTeamColor(team)}20`,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  });

  const playerGlicko2ChartConfig = createMemo((): ChartConfiguration => {
    const players = latest().generalStats.players;
    const frames = matchData().frames;

    return {
      type: 'line',
      data: {
        labels: matchLabels(),
        datasets: players.map((player) => ({
          label: player,
          data: frames.map(
            (frame) =>
              frame.glicko2Ratings.playerGlicko2[player]?.rating ?? null,
          ),
          borderColor: generateTeamColor(player),
          backgroundColor: `${generateTeamColor(player)}20`,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  });

  const hybridGlicko2ChartConfig = createMemo((): ChartConfiguration => {
    const players = latest().generalStats.players;
    const frames = matchData().frames;

    return {
      type: 'line',
      data: {
        labels: matchLabels(),
        datasets: players.map((player) => ({
          label: player,
          data: frames.map(
            (frame) =>
              frame.glicko2Ratings.hybridGlicko2[player]?.rating ?? null,
          ),
          borderColor: generateTeamColor(player),
          backgroundColor: `${generateTeamColor(player)}20`,
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
      const players = latest().generalStats.players;
      const frames = matchData().frames;

      return {
        type: 'line',
        data: {
          labels: matchLabels(),
          datasets: players.map((player) => ({
            label: player,
            data: frames.map(
              (frame) =>
                frame.glicko2Ratings.teamIndividualGlicko2[player]?.rating ??
                null,
            ),
            borderColor: generateTeamColor(player),
            backgroundColor: `${generateTeamColor(player)}20`,
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
    const teams = latest().generalStats.teams;
    const frames = matchData().frames;

    return {
      type: 'line',
      data: {
        labels: matchLabels(),
        datasets: teams.map((team) => ({
          label: team,
          data: frames.map(
            (frame) => frame.glicko2Ratings.teamGlicko2[team]?.rating ?? null,
          ),
          borderColor: generateTeamColor(team),
          backgroundColor: `${generateTeamColor(team)}20`,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
  });

  return (
    <div class={style.chartsContainer}>
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
