import { A } from '@solidjs/router';
import figlet from 'figlet';
import smallSlant from 'figlet/fonts/Small Slant';
import { createSignal, Match, Switch } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { Break } from '#components/Break';
import {
  DayPaginatorWidget,
  usePaginatedDayStat,
} from '#components/DayPaginatorWidget';
import { DayStats } from '#components/DayStats';
import { GeneralStatCharts } from '#components/GeneralStatCharts';
import { GeneralStats } from '#components/GeneralStats';
import { InlineAction } from '#components/InlineAction';
import {
  EloLeaderboardBase,
  Glicko2LeaderboardBase,
} from '#components/Leaderboard';
import {
  MatchPaginatorWidget,
  usePaginatedStat,
} from '#components/MatchPaginatorWidget';
import { MatchStats } from '#components/MatchStats';
import { MundialCalculatorLink } from '#components/MundialCalculatorLink';
import { RatingCharts } from '#components/RatingCharts';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import style from './Homepage.module.scss';

figlet.parseFont('Small Slant', smallSlant);

const Homepage: Component = () => {
  const [{ windowSize }] = useConsoleUnitPrototype();

  const [aggregateStats, setAggregateStats] = createSignal(false);
  const [statsPage, setStatsPage] = createSignal<'elo' | 'glicko2'>('elo');

  const paginator = () => {
    return aggregateStats()
      ? { component: DayPaginatorWidget, useContext: usePaginatedDayStat }
      : { component: MatchPaginatorWidget, useContext: usePaginatedStat };
  };

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
          <DayStats />
          <MatchStats />
          <Dynamic
            component={paginator().component}
            class={style.statsWidget}
            topLeftLabels="Leaderboards"
            topRightLabels={[
              <span
                classList={{
                  [style.label]: true,
                  [style.activeStats]: aggregateStats(),
                }}
              >
                <InlineAction
                  symbol="a"
                  content="A"
                  onAction={() => setAggregateStats((v) => !v)}
                />
                ggregate
              </span>,
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
                <EloLeaderboardBase useContext={paginator().useContext} />
              </Match>
              <Match when={statsPage() === 'glicko2'}>
                <Glicko2LeaderboardBase useContext={paginator().useContext} />
              </Match>
            </Switch>
          </Dynamic>
        </div>

        <div>
          <GeneralStatCharts />
          <RatingCharts />
        </div>

        <MundialCalculatorLink />
      </div>
    </div>
  );
};

export default Homepage;
