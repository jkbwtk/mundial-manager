import { getOwner, type JSX, mergeProps, Show } from 'solid-js';
import { Button } from '#components/Button';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { useModal, useModalActions } from '#providers/ModalProvider';
import type { RequiredDefaults } from '#shared/utils';
import style from './ConfirmModal.module.scss';

export type CustomConfirmModalProps = {
  confirmText?: string;
  severity?: 'primary' | 'danger';
};

export type ConfirmModalProps = CustomConfirmModalProps & {
  title: string;
  message: JSX.Element;
  subject?: JSX.Element;
};

export const confirmModalDefaultProps: RequiredDefaults<CustomConfirmModalProps> =
  {
    confirmText: 'Confirm',
    severity: 'primary',
  };

export const ConfirmModal: Component<ConfirmModalProps> = (userProps) => {
  const props = mergeProps(confirmModalDefaultProps, userProps);
  const { closeModal } = useModalActions();

  const handleCancel = () => closeModal(false);
  const handleConfirm = () => closeModal(true);

  return (
    <Modal
      topLeftLabels={props.title}
      bottomLeftLabels={[
        <Button severity="secondary" onPointerUp={handleCancel}>
          Cancel
        </Button>,
      ]}
      bottomRightLabels={[
        <Button severity={props.severity} onPointerUp={handleConfirm}>
          {props.confirmText}
        </Button>,
      ]}
      class={style.modal}
    >
      <div class={style.container}>
        <div>{props.message}</div>

        <Show when={props.subject}>
          <Divider class={style.divider} connect={0b00} />
          <strong class={style.subject}>{props.subject}</strong>
        </Show>
      </div>
    </Modal>
  );
};

export function useConfirmModal(): (
  props: ConfirmModalProps,
) => Promise<boolean> {
  const [, { open }] = useModal();
  const owner = getOwner();

  return (props) =>
    new Promise((resolve) => {
      open({
        props: { component: ConfirmModal, ...props },
        owner,
        afterClose: (returnValue) => resolve(returnValue === true),
      });
    });
}
