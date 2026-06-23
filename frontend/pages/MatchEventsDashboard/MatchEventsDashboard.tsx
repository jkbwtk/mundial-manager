import { createAsync, useParams } from '@solidjs/router';
import { queryMatchEventsByMatchId } from '#flib/trpcCalls';
import { toJson } from '#flib/utils';
import style from './MatchEventsDashboard.module.scss';

export interface MatchEventsDashboardParams {
  matchUuid: string;
  [key: string]: string | undefined;
}

export const MatchEventsDashboard: Component = () => {
  const params = useParams<MatchEventsDashboardParams>();

  const matchEvents = createAsync(() =>
    queryMatchEventsByMatchId({
      matchUuid: params.matchUuid,
      sorting: {
        field: 'time',
        direction: 'asc',
      },
    }),
  );

  return (
    <div class={style.container}>Current params: {toJson(matchEvents())}</div>
  );
};

export default MatchEventsDashboard;
