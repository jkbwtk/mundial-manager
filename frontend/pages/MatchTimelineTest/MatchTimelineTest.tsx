import { For, Show } from 'solid-js';
import { Button } from '#components/Button';
import { MatchTimelineModal } from '#components/MatchTimelineModal';
import { useModal } from '#providers/ModalProvider';
import { useSheets } from '#providers/SheetsProvider';
import style from './MatchTimelineTest.module.scss';

const MatchTimelineTest: Component = () => {
  const [, { open }] = useModal();
  const [sheets] = useSheets();

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

  return (
    <div class={style.container}>
      <strong>Recent Matches:</strong>
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
  );
};

export default MatchTimelineTest;
