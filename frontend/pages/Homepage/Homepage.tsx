import { A } from '@solidjs/router';
import figlet from 'figlet';
import smallSlant from 'figlet/fonts/Small Slant';
import { createSignal, Match, Switch } from 'solid-js';
import { AggregateStats } from '#components/AggregateStats';
import { Break } from '#components/Break';
import { Dropdown } from '#components/Dropdown';
import { GeneralStatCharts } from '#components/GeneralStatCharts';
import { GeneralStats } from '#components/GeneralStats';
import { InlineAction } from '#components/InlineAction';
import {
  EloLeaderboardBase,
  Glicko2LeaderboardBase,
} from '#components/Leaderboard';
import { MatchStats } from '#components/MatchStats';
import { MundialCalculatorLink } from '#components/MundialCalculatorLink';
import { RatingCharts } from '#components/RatingCharts';
import { SeasonProgress } from '#components/SeasonProgress';
import {
  StatPaginatorWidget,
  type StatType,
  StatTypeOptions,
} from '#components/StatPaginatorWidget';
import { useConsoleUnitPrototype } from '#providers/ConsoleUnitPrototypeProvider';
import style from './Homepage.module.scss';

figlet.parseFont('Small Slant', smallSlant);

const Homepage: Component = () => {
  const [{ windowSize }] = useConsoleUnitPrototype();

  const [leaderboardStatType, setLeaderboardStatType] =
    createSignal<StatType>('match');
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
          <SeasonProgress />
          <GeneralStats />
          <AggregateStats />
          <MatchStats />
          <StatPaginatorWidget
            statType={leaderboardStatType()}
            class={style.statsWidget}
            topLeftLabels="Leaderboards"
            topRightLabels={[
              <Dropdown
                options={StatTypeOptions}
                value={leaderboardStatType()}
                onChange={setLeaderboardStatType}
              />,
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
          </StatPaginatorWidget>
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
