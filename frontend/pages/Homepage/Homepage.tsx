import { A } from '@solidjs/router';
import type { ChartConfiguration } from 'chart.js';
import figlet from 'figlet';
import smallSlant from 'figlet/fonts/Small Slant';
import { createMemo, createSignal, Match, Switch } from 'solid-js';
import { Break } from '#components/Break';
import { ChartWrapper } from '#components/ChartWrapper';
import { GeneralStats } from '#components/GeneralStats';
import { InlineAction } from '#components/InlineAction';
import {
  EloLeaderboardBase,
  Glicko2LeaderboardBase,
} from '#components/Leaderboard';
import { Widget } from '#components/Widget';
import { getTeamColor } from '#flib/sheetUtils';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import { useSheets } from '#providers/SheetsProvider';
import style from './Homepage.module.scss';

figlet.parseFont('Small Slant', smallSlant);

const Homepage: Component = () => {
  const [{ windowSize }] = useConsoleUnitPrototype();
  const [, { matchStats, latestMatchStats }] = useSheets();

  const [statsPage, setStatsPage] = createSignal<'elo' | 'glicko2'>('elo');

  const matchLabels = createMemo(() =>
    Object.values(matchStats()).map((s) => s.label),
  );

  const playerChartConfig = createMemo((): ChartConfiguration => {
    const stats = Object.values(matchStats());
    const elo = latestMatchStats().eloRatings;

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
    const elo = latestMatchStats().eloRatings;

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
    const elo = latestMatchStats().eloRatings;

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
    const elo = latestMatchStats().eloRatings;

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
    const elo = latestMatchStats().eloRatings;

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
    const elo = latestMatchStats().eloRatings;

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
      const elo = latestMatchStats().eloRatings;

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
    const elo = latestMatchStats().eloRatings;

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

      <div class={style.dashboardContainer}>
        <div>
          <GeneralStats />
          <Widget
            class={style.statsWidget}
            topLeftLabels="Stats"
            topRightLabels={[
              <span
                classList={{
                  [style.label]: true,
                  [style.activeStats]: statsPage() === 'elo',
                }}
              >
                <InlineAction
                  symbol="e"
                  content="E"
                  onAction={() => setStatsPage('elo')}
                />
                lo
              </span>,
              <span
                classList={{
                  [style.label]: true,
                  [style.activeStats]: statsPage() === 'glicko2',
                }}
              >
                <InlineAction
                  symbol="g"
                  content="G"
                  onAction={() => setStatsPage('glicko2')}
                />
                licko-2
              </span>,
            ]}
          >
            <Switch>
              <Match when={statsPage() === 'elo'}>
                <EloLeaderboardBase />
              </Match>
              <Match when={statsPage() === 'glicko2'}>
                <Glicko2LeaderboardBase />
              </Match>
            </Switch>
          </Widget>
        </div>

        <div class={style.chartsContainer}>
          <Widget topLeftLabels="Player Elo Chart" class={style.eloChart}>
            <ChartWrapper config={playerChartConfig()} />
          </Widget>

          <Widget topLeftLabels="Hybrid Elo Chart" class={style.eloChart}>
            <ChartWrapper config={hybridChartConfig()} />
          </Widget>

          <Widget
            topLeftLabels="Team Individual Elo Chart"
            class={style.eloChart}
          >
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
      </div>
    </div>
  );
};

export default Homepage;
