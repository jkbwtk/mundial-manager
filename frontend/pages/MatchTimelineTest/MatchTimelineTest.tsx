import { createAsync } from '@solidjs/router';
import { For, getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { MatchTimelineModal } from '#components/MatchTimelineModal';
import { MatchTimelineTable } from '#components/MatchTimelineTable';
import { Modal } from '#components/Modal';
import { Spinner } from '#components/Spinner';
import { queryMatches, queryMatchTimeline } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { useSheets } from '#providers/SheetsProvider';
import { formatKnownStartDate } from '#shared/matchLabels';
import { shortUUID } from '#shared/utils';
import style from './MatchTimelineTest.module.scss';

interface MatchTimelineTableModalProps {
  matchUuid: string;
}

const MatchTimelineTableModal: Component<MatchTimelineTableModalProps> = (
  props,
) => {
  const timeline = createAsync(() => queryMatchTimeline(props.matchUuid));

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
        {(source) => <MatchTimelineTable timeline={source()} />}
      </Show>
    </Modal>
  );
};

const MatchTimelineTest: Component = () => {
  const [, { open }] = useModal();
  const [sheets] = useSheets();
  const owner = getOwner();

  const matches = createAsync(() =>
    queryMatches({
      pagination: { limit: 50, offset: 0 },
      sorting: { field: 'startDate', direction: 'desc' },
    }),
  );

  const openMatchTimelineModal = (matchId: number) => {
    const index = sheets.matches.findIndex((m) => m.id === matchId);
    if (index === -1) return;

    open({
      props: {
        component: MatchTimelineModal,
        page: sheets.matches.length - 1 - index,
      },
    });
  };

  const openMatchTimelineTableModal = (matchUuid: string) => {
    open({
      props: {
        component: MatchTimelineTableModal,
        matchUuid,
      },
      owner,
    });
  };

  return (
    <div class={style.container}>
      <div class={style.section}>
        <strong>Backend Matches:</strong>
        <Show
          when={(matches.latest?.data.length ?? 0) > 0}
          fallback={<div>No matches available</div>}
        >
          <div class={style.matches}>
            <For each={matches.latest?.data}>
              {(match) => (
                <>
                  <span>
                    {shortUUID(match.uuid)} {formatKnownStartDate(match)} (
                    {match.side1Score}:{match.side2Score})
                  </span>

                  <span>{match.status}</span>

                  <Button
                    severity="secondary"
                    onPointerUp={() => openMatchTimelineTableModal(match.uuid)}
                  >
                    View Timeline
                  </Button>
                </>
              )}
            </For>
          </div>
        </Show>
      </div>

      <div class={style.section}>
        <strong>Legacy Matches:</strong>
        <Show
          when={sheets.matches.length > 0}
          fallback={<div>No matches available</div>}
        >
          <div class={style.matches}>
            <For each={sheets.matches.slice(-50).toReversed()}>
              {(match) => (
                <>
                  <span>
                    #{match.id} {match.team1} vs {match.team2} ({match.score1}:
                    {match.score2})
                  </span>

                  <span>{match.replayMetadata ? 'Events' : ''}</span>

                  <Button
                    severity="secondary"
                    onPointerUp={() => openMatchTimelineModal(match.id)}
                  >
                    View Timeline
                  </Button>
                </>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default MatchTimelineTest;
