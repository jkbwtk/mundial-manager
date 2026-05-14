import { createMemo, createSignal, createUniqueId } from 'solid-js';
import { Button } from '#components/Button';
import { Input } from '#components/Input';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { useFormValidation } from '#flib/formValidation';
import { useModalActions } from '#providers/ModalProvider';
import { LeagueCreate } from '#shared/types/api/league';
import style from './LeagueCreateModal.module.scss';

export type LeagueCreatorResult =
  | { ok: true }
  | { ok: false; message?: string };

export interface LeagueCreatorModalProps {
  initialValues?: Partial<LeagueCreate>;
  onCreate: (league: LeagueCreate) => Promise<LeagueCreatorResult>;
}

export const LeagueCreatorModal: Component<LeagueCreatorModalProps> = (
  props,
) => {
  const { closeModal } = useModalActions();

  const formId = createUniqueId();

  const { validate } = useFormValidation(LeagueCreate, { errorClass: 'error' });

  const [name, setName] = createSignal(props.initialValues?.name ?? '');
  const [alias, setAlias] = createSignal(props.initialValues?.alias ?? '');
  const [description, setDescription] = createSignal(
    props.initialValues?.description ?? '',
  );

  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [wasSubmitted, setWasSubmitted] = createSignal(false);

  const trimmedName = createMemo(() => name().trim());
  const trimmedAlias = createMemo(() => alias().trim());
  const trimmedDescription = createMemo(() => description().trim());

  const nameInvalid = createMemo(() => trimmedName().length === 0);
  const aliasInvalid = createMemo(
    () => trimmedAlias().length === 0 || trimmedAlias().length > 16,
  );

  const canSubmit = createMemo(
    () => !isSubmitting() && !nameInvalid() && !aliasInvalid(),
  );

  const handleCancel = (ev: PointerEvent) => {
    ev.preventDefault();
    closeModal(false);
  };

  const handleSubmit = async (ev: SubmitEvent) => {
    ev.preventDefault();
    setWasSubmitted(true);

    if (!canSubmit()) return;

    setIsSubmitting(true);

    const payload: LeagueCreate = {
      name: trimmedName(),
      alias: trimmedAlias(),
      description: trimmedDescription() ? trimmedDescription() : null,
    };

    try {
      const result = await props.onCreate(payload);

      if (result.ok) {
        closeModal(true);
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      class={style.modal}
      topLeftLabels="League Creator"
      bottomLeftLabels={[
        <Button severity="secondary" onPointerUp={handleCancel}>
          Cancel
        </Button>,
      ]}
      bottomRightLabels={[
        <Button
          type="submit"
          form={formId}
          loading={isSubmitting()}
          disabled={!canSubmit()}
        >
          Create
        </Button>,
      ]}
    >
      <form id={formId} class={style.form} onSubmit={handleSubmit}>
        <div class={style.fieldRow}>
          <span class={style.fieldLabel}>Name</span>
          <Input
            class={style.fieldInput}
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            placeholder="League name"
            maxLength={255}
            required
            invalid={wasSubmitted() && nameInvalid()}
            useDirectives={[(el) => validate(el, 'name')]}
          />
        </div>

        <div class={style.fieldRow}>
          <span class={style.fieldLabel}>Alias</span>
          <Input
            class={style.fieldInput}
            value={alias()}
            onInput={(e) => setAlias(e.currentTarget.value)}
            placeholder="Short id"
            maxLength={16}
            required
            invalid={wasSubmitted() && aliasInvalid()}
            useDirectives={[(el) => validate(el, 'alias')]}
          />
        </div>

        <div class={style.fieldRow}>
          <span class={style.fieldLabel}>Description</span>
          <Input
            class={style.fieldInput}
            value={description()}
            onInput={(e) => setDescription(e.currentTarget.value)}
            placeholder="Optional"
            maxLength={255}
            useDirectives={[(el) => validate(el, 'description')]}
          />
        </div>

        <Divider class={style.divider} />

        <div class={style.hintRow}>
          <span class={style.hint}>Alias is limited to 16 characters.</span>
        </div>
      </form>
    </Modal>
  );
};
