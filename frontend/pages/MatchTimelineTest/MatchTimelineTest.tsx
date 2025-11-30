import { For, Show } from 'solid-js';
import { Button } from '#components/Button';
import { MatchTimelineModal } from '#components/MatchTimelineModal';
import { Widget } from '#components/Widget';
import { useModal } from '#providers/ModalProvider';
import { useSheets } from '#providers/SheetsProvider';
import style from './MatchTimelineTest.module.scss';

const MatchTimelineTest: Component = () => {
  const [, { open }] = useModal();
  const [sheets] = useSheets();

  const openMatchTimelineModal = (matchId: number) => {
    const match = sheets.matches.find((m) => m.id === matchId);
    if (!match) return;

    open({
      props: {
        component: MatchTimelineModal,
        match,
      },
    });
  };

  return (
    <Widget topLeftLabels="Match Timeline Test Page" class={style.container}>
      <br />
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
    </Widget>
  );
};

export default MatchTimelineTest;
