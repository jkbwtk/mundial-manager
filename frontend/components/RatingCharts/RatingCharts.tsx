import type { ChartConfiguration } from 'chart.js';
import { createMemo, lazy } from 'solid-js';
import { Widget } from '#components/Widget';
import { getTeamColor } from '#flib/sheetUtils';
import { useSheets } from '#providers/SheetsProvider';
import style from './RatingChats.module.scss';

const ChartWrapper = lazy(() =>
  import('#components/ChartWrapper').then((c) => ({ default: c.ChartWrapper })),
);

export const RatingCharts: Component = () => {
  const [, { matchStats, latest }] = useSheets();

  const matchLabels = createMemo(() =>
    Object.values(matchStats()).map((s) => s.label),
  );

  const playerChartConfig = createMemo((): ChartConfiguration => {
    const stats = Object.values(matchStats());
    const elo = latest().matchStats.eloRatings;

    return {
      type: 'line',
      data: {
        labels: matchLabels(),
        datasets: Object.keys(elo.playerElos).map((player) => ({
          label: player,
          data: Object.values(stats).map(
            (s) => s.eloRatings.playerElos[player]?.rating ?? null,
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
    const stats = Object.values(matchStats());
    const elo = latest().matchStats.eloRatings;

    return {
      type: 'line',
      data: {
        labels: matchLabels(),
        datasets: Object.keys(elo.hybridElos).map((player) => ({
          label: player,
          data: Object.values(stats).map(
            (s) => s.eloRatings.hybridElos[player]?.rating ?? null,
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
    const stats = Object.values(matchStats());
    const elo = latest().matchStats.eloRatings;

    return {
      type: 'line',
      data: {
        labels: matchLabels(),
        datasets: Object.keys(elo.teamIndividualElos).map((player) => ({
          label: player,
          data: Object.values(stats).map(
            (s) => s.eloRatings.teamIndividualElos[player]?.rating ?? null,
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
    const stats = Object.values(matchStats());
    const elo = latest().matchStats.eloRatings;

    return {
      type: 'line',
      data: {
        labels: matchLabels(),
        datasets: Object.keys(elo.teamElos).map((team) => ({
          label: team,
          data: Object.values(stats).map(
            (s) => s.eloRatings.teamElos[team]?.rating ?? null,
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
    const stats = Object.values(matchStats());
    const elo = latest().matchStats.eloRatings;

    return {
      type: 'line',
      data: {
        labels: matchLabels(),
        datasets: Object.keys(elo.playerElos).map((player) => ({
          label: player,
          data: Object.values(stats).map(
            (s) => s.glicko2Ratings.playerGlicko2[player]?.rating ?? null,
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
    const stats = Object.values(matchStats());
    const elo = latest().matchStats.eloRatings;

    return {
      type: 'line',
      data: {
        labels: matchLabels(),
        datasets: Object.keys(elo.hybridElos).map((player) => ({
          label: player,
          data: Object.values(stats).map(
            (s) => s.glicko2Ratings.hybridGlicko2[player]?.rating ?? null,
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
      const stats = Object.values(matchStats());
      const elo = latest().matchStats.eloRatings;

      return {
        type: 'line',
        data: {
          labels: matchLabels(),
          datasets: Object.keys(elo.teamIndividualElos).map((player) => ({
            label: player,
            data: Object.values(stats).map(
              (s) =>
                s.glicko2Ratings.teamIndividualGlicko2[player]?.rating ?? null,
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
    const stats = Object.values(matchStats());
    const elo = latest().matchStats.eloRatings;

    return {
      type: 'line',
      data: {
        labels: matchLabels(),
        datasets: Object.keys(elo.teamElos).map((team) => ({
          label: team,
          data: Object.values(stats).map(
            (s) => s.glicko2Ratings.teamGlicko2[team]?.rating ?? null,
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
