import { lazy, Suspense } from 'solid-js';
import { AggregateStats } from '#components/AggregateStats';
import { DesktopOnly } from '#components/DesktopOnly';
import { GeneralStats } from '#components/GeneralStats';
import { MatchStats } from '#components/MatchStats';
import { MundialCalculatorLink } from '#components/MundialCalculatorLink';
import { SeasonProgress } from '#components/SeasonProgress';
import { SeasonSummaryActivator } from '#components/SeasonSummaryActivator';
import style from './Homepage.module.scss';

const GeneralStatCharts = lazy(
  () => import('#components/GeneralStatCharts/GeneralStatCharts'),
);
const RatingCharts = lazy(
  () => import('#components/RatingCharts/RatingCharts'),
);

const Homepage: Component = () => {
  return (
    <div class={style.container}>
      <div class={style.dashboard}>
        <div>
          <SeasonSummaryActivator />
          <SeasonProgress />
          <GeneralStats />
          <AggregateStats />
          <MatchStats />
        </div>

        <div>
          <Suspense>
            <GeneralStatCharts />
          </Suspense>

          <Suspense>
            <RatingCharts />
          </Suspense>
        </div>

        <DesktopOnly>
          <MundialCalculatorLink />
        </DesktopOnly>
      </div>
    </div>
  );
};

export default Homepage;
