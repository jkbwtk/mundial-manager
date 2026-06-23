import { useParams } from '@solidjs/router';
import { toJson } from '#flib/utils';
import style from './MatchEventsDashboard.module.scss';

interface MatchEventsDashboardParams {
  matchUuid: string;
  [key: string]: string | undefined;
}

export const MatchEventsDashboard: Component = () => {
  const params = useParams<MatchEventsDashboardParams>();

  return <div class={style.container}>Current params: {toJson(params)}</div>;
};

export default MatchEventsDashboard;
