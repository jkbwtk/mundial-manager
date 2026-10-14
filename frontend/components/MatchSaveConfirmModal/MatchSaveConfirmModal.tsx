import { useAction } from '@solidjs/router';
import { createMemo, createSignal, Show } from 'solid-js';
import { Button } from '#components/Button';
import { useConfirmModal } from '#components/ConfirmModal';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { parseServerFieldErrors } from '#flib/formValidation';
import { addLegacyMatch, removeLegacyMatch } from '#flib/legacyMatches';
import type { ClickEvent } from '#flib/solidHelpers';
import { getTeamColorClass } from '#flib/teamColors';
import { actionCreateLegacyMatch } from '#flib/trpcCalls';
import { useModalActions } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
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
  const { closeModal } = useModalActions();
  const [, actions] = useToast();
  const openConfirmModal = useConfirmModal();
  const createLegacyMatch = useAction(actionCreateLegacyMatch);

  const { syncId } = addLegacyMatch(props.match);

  const [isSaving, setIsSaving] = createSignal(false);

  const teamColors = createMemo(() => getTeamColors(props.match));
  const floor = createMemo(() => getMatchFloor(props.match));

  const getSaveErrorMessage = (err: unknown) => {
    const isMissingPlayers = parseServerFieldErrors(err).some(([, errors]) =>
      errors.includes('PLAYERS_NOT_FOUND'),
    );

    return isMissingPlayers
      ? 'Failed to save match, some players do not exist'
      : 'Failed to save match';
  };

  const discardMatch = async () => {
    const confirmed = await openConfirmModal({
      title: 'Discard Match',
      message: 'Discard this match? It will not be saved.',
      confirmText: 'Discard',
      severity: 'danger',
    });

    if (!confirmed) return;

    closeModal(false);
  };

  const handleCancel = (ev: ClickEvent) => {
    ev.preventDefault();
    discardMatch();
  };

  const handleConfirm = async (ev: ClickEvent) => {
    ev.preventDefault();

    if (isSaving()) return;

    setIsSaving(true);

    try {
      await createLegacyMatch(props.match, syncId);

      removeLegacyMatch(syncId);
      actions.success('Match saved successfully!');
      closeModal(true);
    } catch (err) {
      console.error('Legacy match upload error:', err);
      actions.error(getSaveErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      topLeftLabels="Match Creator"
      bottomLeftLabels={[
        <Button
          severity="secondary"
          disabled={isSaving()}
          onClick={handleCancel}
        >
          Cancel
        </Button>,
      ]}
      bottomRightLabels={[
        <Button severity="primary" onClick={handleConfirm} loading={isSaving()}>
          Confirm
        </Button>,
      ]}
      class={style.modal}
      onClose={discardMatch}
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
