import { createUniqueId, For } from 'solid-js';
import { Break } from '#components/Break';
import { Button } from '#components/Button';
import { Input } from '#components/Input';
import { Modal } from '#components/Modal';
import { useModalActions } from '#providers/ModalProvider';
import { useSheets } from '#providers/SheetsProvider';
import style from './PlayerPickerModal.module.scss';

export interface PlayerPickerProps {
  disabledPlayers?: string[];
}

export const PlayerPickerModal: Component<PlayerPickerProps> = (props) => {
  const [, { latest }] = useSheets();
  const { closeModal } = useModalActions();

  const formId = createUniqueId();

  const handleSubmit = (ev: SubmitEvent) => {
    ev.preventDefault();

    if (ev.target instanceof HTMLFormElement) {
      const formData = new FormData(ev.target as HTMLFormElement);

      closeModal(formData.get('player'));
    }
  };

  return (
    <Modal
      class={style.modal}
      topLeftLabels="Player Picker"
      bottomRightLabels={[
        <Button severity="secondary" type="submit" form={formId}>
          Select
        </Button>,
      ]}
    >
      <form id={formId} class={style.pickerForm} onSubmit={handleSubmit}>
        <For each={latest().generalStats.players}>
          {(player) => (
            <div>
              <Input
                id={player}
                type="radio"
                name="player"
                value={player}
                disabled={props.disabledPlayers?.includes(player)}
                required
              >
                {player}
              </Input>
            </div>
          )}
        </For>
        <Break />
      </form>
    </Modal>
  );
};
