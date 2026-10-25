import { Suspense } from 'solid-js';
import { AggregateStats } from '#components/AggregateStats';
import { BallStats } from '#components/BallStats';
import { DesktopOnly } from '#components/DesktopOnly';
import { GeneralStats } from '#components/GeneralStats';
import { RatingLeaderboard } from '#components/Leaderboard';
import { LiveMatches } from '#components/LiveMatches';
import { LuckStats } from '#components/LuckStats';
import { MatchStats } from '#components/MatchStats';
import { MundialCalculatorLink } from '#components/MundialCalculatorLink';
import { PermissionGuard } from '#components/PermissionGuard';
import { SeasonProgress } from '#components/SeasonProgress';
import { SeasonSummaryActivator } from '#components/SeasonSummaryActivator';
import { TableStats } from '#components/TableStats';
import { UpcomingMatches } from '#components/UpcomingMatches';
import { PermissionEnum } from '#shared/permissions';
import style from './Homepage.module.scss';

export const Homepage: Component = () => (
  <div class={style.container}>
    <section class={style.column}>
      <div class={style.summary}>
        <SeasonSummaryActivator />
      </div>
      <div class={style.season}>
        <SeasonProgress />
      </div>
      <div class={style.general}>
        <GeneralStats />
      </div>
      <div class={style.tables}>
        <TableStats />
      </div>
      <div class={style.balls}>
        <BallStats />
      </div>
    </section>

    <section class={style.column}>
      <div class={style.period}>
        <AggregateStats />
      </div>
      <PermissionGuard permission={PermissionEnum.MATCHES_READ}>
        <div class={style.live}>
          <Suspense>
            <LiveMatches />
          </Suspense>
        </div>
        <div class={style.upcoming}>
          <Suspense>
            <UpcomingMatches />
          </Suspense>
        </div>
      </PermissionGuard>
      <div class={style.match}>
        <MatchStats />
      </div>
    </section>

    <section class={style.column}>
      <div class={style.leaderboards}>
        <RatingLeaderboard />
      </div>
      <div class={style.luck}>
        <LuckStats />
      </div>
    </section>

    <DesktopOnly>
      <MundialCalculatorLink />
    </DesktopOnly>
  </div>
);

export default Homepage;
