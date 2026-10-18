import { createAsync } from '@solidjs/router';
import { For, getOwner, Show } from 'solid-js';
import { Button } from '#components/Button';
import { MatchTimelineModal } from '#components/MatchTimelineModal';
import { queryMatches } from '#flib/trpcCalls';
import { useModal } from '#providers/ModalProvider';
import { formatKnownStartDate } from '#shared/matchLabels';
import { shortUUID } from '#shared/utils';
import style from './MatchTimelineTest.module.scss';

const MatchTimelineTest: Component = () => {
  const [, { open }] = useModal();
  const owner = getOwner();

  const matches = createAsync(() =>
    queryMatches({
      pagination: { limit: 50, offset: 0 },
      sorting: { field: 'startDate', direction: 'desc' },
    }),
  );

  const openMatchTimelineModal = (matchUuid: string) => {
    open({
      props: {
        component: MatchTimelineModal,
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
                    onClick={() => openMatchTimelineModal(match.uuid)}
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
