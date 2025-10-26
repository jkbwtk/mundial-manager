import { A } from '@solidjs/router';
import figlet from 'figlet';
import smallSlant from 'figlet/fonts/Small Slant';
import { createSignal, Match, Switch } from 'solid-js';
import { Break } from '#components/Break';
import { GeneralStats } from '#components/GeneralStats';
import { InlineAction } from '#components/InlineAction';
import {
  EloLeaderboardBase,
  Glicko2LeaderboardBase,
} from '#components/Leaderboard';
import { MatchPaginatorWidget } from '#components/MatchPaginatorWidget';
import { MatchStats } from '#components/MatchStats';
import { RatingCharts } from '#components/RatingCharts';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import style from './Homepage.module.scss';

figlet.parseFont('Small Slant', smallSlant);

const Homepage: Component = () => {
  const [{ windowSize }] = useConsoleUnitPrototype();

  const [statsPage, setStatsPage] = createSignal<'elo' | 'glicko2'>('elo');

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
          <MatchStats />
          <MatchPaginatorWidget
            class={style.statsWidget}
            topLeftLabels="Leaderboards"
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
          </MatchPaginatorWidget>
        </div>

        <RatingCharts />
      </div>
    </div>
  );
};

export default Homepage;
