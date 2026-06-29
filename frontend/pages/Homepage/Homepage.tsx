import { createSignal, Match, Switch } from 'solid-js';
import { AggregateStats } from '#components/AggregateStats';
import { DesktopOnly } from '#components/DesktopOnly';
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
import { SeasonSummaryActivator } from '#components/SeasonSummaryActivator';
import {
  StatPaginatorWidget,
  type StatType,
  StatTypeOptions,
} from '#components/StatPaginatorWidget';
import style from './Homepage.module.scss';

const Homepage: Component = () => {
  const [leaderboardStatType, setLeaderboardStatType] =
    createSignal<StatType>('match');
  const [statsPage, setStatsPage] = createSignal<'elo' | 'glicko2'>('elo');

  return (
    <div class={style.container}>
      <div class={style.dashboard}>
        <div>
          <SeasonSummaryActivator />
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

        <DesktopOnly>
          <MundialCalculatorLink />
        </DesktopOnly>
      </div>
    </div>
  );
};

export default Homepage;
