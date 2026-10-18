import { Show } from 'solid-js';
import {
  MatchSideName,
  MatchTimelineTable,
} from '#components/MatchTimelineTable';
import { Modal } from '#components/Modal';
import { Spinner } from '#components/Spinner';
import { Divider } from '#components/Widget';
import { useLeagueTimeZone } from '#flib/leagueTimeZone';
import { createMatchTimelineLookup } from '#flib/matchTimelineLookup';
import { createResilientAsync } from '#flib/resilientAsync';
import { queryMatchTimeline } from '#flib/trpcCalls';
import { formatKnownStartDatetime } from '#shared/matchLabels';
import { getMatchWinningSide } from '#shared/matchTimeline';
import { formatDuration } from '#shared/timeUtils';
import type { MatchTimeline } from '#shared/types/api/matchTimeline';
import style from './MatchTimelineModal.module.scss';

export interface MatchTimelineModalProps {
  matchUuid: string;
}

interface MatchTimelineHeaderProps {
  timeline: MatchTimeline;
}

const MatchTimelineHeader: Component<MatchTimelineHeaderProps> = (props) => {
  const timeZone = useLeagueTimeZone();
  const lookup = createMatchTimelineLookup(() => props.timeline);

  const match = () => props.timeline.match;
  const winner = () => getMatchWinningSide(match());

  return (
    <>
      <div class={style.scoreContainer}>
        <div>
          <MatchSideName side="SIDE_1" lookup={lookup} /> vs{' '}
          <MatchSideName side="SIDE_2" lookup={lookup} />
        </div>
        <div>
          <span classList={{ [style.highlightedScore]: winner() === 'SIDE_1' }}>
            {match().side1Score}
          </span>{' '}
          :{' '}
          <span classList={{ [style.highlightedScore]: winner() === 'SIDE_2' }}>
            {match().side2Score}
          </span>
        </div>
      </div>

      <Divider class={style.dashedDivider} />

      <div class={style.statsContainer}>
        <span>Duration:</span>
        <strong>{formatDuration(match().duration ?? null)}</strong>

        <span>Date:</span>
        <strong>{formatKnownStartDatetime(match(), timeZone())}</strong>
      </div>

      <Divider />
    </>
  );
};

export const MatchTimelineModal: Component<MatchTimelineModalProps> = (
  props,
) => {
  const timeline = createResilientAsync(
    () => props.matchUuid,
    queryMatchTimeline,
  );

  return (
    <Modal class={style.modal} topLeftLabels="Match Timeline">
      <Show
        when={timeline.latest}
        fallback={
          <div class={style.loading}>
            <Spinner />
          </div>
        }
      >
        {(source) => (
          <>
            <MatchTimelineHeader timeline={source()} />
            <MatchTimelineTable timeline={source()} />
          </>
        )}
      </Show>
    </Modal>
  );
};
