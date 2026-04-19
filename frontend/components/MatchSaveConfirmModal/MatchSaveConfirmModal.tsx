import { createMemo, createSignal, Show } from 'solid-js';
import { Button } from '#components/Button';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { getTeamColorClass } from '#flib/teamColors';
import { useModalActions } from '#providers/ModalProvider';
import { useSheets } from '#providers/SheetsProvider';
import { getMatchFloor, getTeamColors } from '#shared/matchUtils';
import { formatDate, formatDuration } from '#shared/timeUtils';
import type { MatchCreate } from '#shared/types/Sheets';
import style from './MatchSaveConfirmModal.module.scss';

export interface MatchSafeCOnfirmModalProps {
  match: MatchCreate;
}

export const MatchSaveConfirmModal: Component<MatchSafeCOnfirmModalProps> = (
  props,
) => {
  const [, { createMatch }] = useSheets();
  const { closeModal } = useModalActions();

  const [isSaving, setIsSaving] = createSignal(false);

  const teamColors = createMemo(() => getTeamColors(props.match));
  const floor = createMemo(() => getMatchFloor(props.match));

  const handleCancel = (ev: PointerEvent) => {
    ev.preventDefault();
    closeModal(false);
  };

  const handleConfirm = async (ev: PointerEvent) => {
    ev.preventDefault();

    try {
      setIsSaving(true);
      await createMatch(props.match);
    } catch (err) {
      console.error(err);
    }

    setIsSaving(false);

    closeModal(true);
  };

  return (
    <Modal
      topLeftLabels="Match Creator"
      bottomLeftLabels={[
        <Button severity="secondary" onPointerUp={handleCancel}>
          Cancel
        </Button>,
      ]}
      bottomRightLabels={[
        <Button
          severity="primary"
          onPointerUp={handleConfirm}
          loading={isSaving()}
        >
          Confirm
        </Button>,
      ]}
      class={style.modal}
    >
      <div class={style.title}>Do you want to save this match?</div>
      <Divider class={style.divider} />
      <div class={style.scoreContainer}>
        <div>
          <span
            classList={{
              [style.teamName]: true,
              [getTeamColorClass(teamColors()[0])]: true,
            }}
          >
            {props.match.team1}
          </span>{' '}
          vs{' '}
          <span
            classList={{
              [style.teamName]: true,
              [getTeamColorClass(teamColors()[1])]: true,
            }}
          >
            {props.match.team2}
          </span>
        </div>
        <div>
          <span
            classList={{
              [style.highlightedScore]: props.match.score1 > props.match.score2,
            }}
          >
            {props.match.score1}
          </span>{' '}
          :{' '}
          <span
            classList={{
              [style.highlightedScore]: props.match.score2 > props.match.score1,
            }}
          >
            {props.match.score2}
          </span>
        </div>
      </div>

      <Divider class={style.divider} />

      <div class={style.statsContainer}>
        <Show when={props.match.duration}>
          <span>Duration:</span>
          <strong>{formatDuration(props.match.duration!)}</strong>
        </Show>

        <Show when={props.match.date}>
          <span>Date:</span>
          <strong>{formatDate(props.match.date!)}</strong>
        </Show>

        <Show when={floor()}>
          <span>Floor:</span>
          <strong>{floor()}</strong>
        </Show>
      </div>
    </Modal>
  );
};
