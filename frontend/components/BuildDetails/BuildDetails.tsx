import { useLeagueTimeZone } from '#flib/leagueTimeZone';
import type { BuildChannel, BuildInfo } from '#frontend/types';
import { formatDatetime } from '#shared/timeUtils';
import style from './BuildDetails.module.scss';

export interface BuildDetailsProps {
  buildInfo: BuildInfo;
}

const BuildChannelLabels: Record<BuildChannel, string> = {
  DEV: 'Dev build',
  STAGING: 'Staging build',
  RELEASE: 'Release build',
};

export const BuildDetails: Component<BuildDetailsProps> = (props) => {
  const timeZone = useLeagueTimeZone();

  return (
    <div class={style.container}>
      <div class={style.channel}>
        {BuildChannelLabels[props.buildInfo.channel]}
      </div>
      <div>{props.buildInfo.commitSha.slice(0, 7)}</div>
      <div>{formatDatetime(props.buildInfo.date, timeZone())}</div>
      <div>{props.buildInfo.tags.join(', ')}</div>
      <div>
        {props.buildInfo.runner} #{props.buildInfo.runNumber}
      </div>
    </div>
  );
};
