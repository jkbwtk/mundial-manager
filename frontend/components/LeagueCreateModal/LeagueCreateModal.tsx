import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { createMemo, createSignal, createUniqueId } from 'solid-js';
import { Button } from '#components/Button';
import { HighlightedCode } from '#components/HighlightedCode';
import { Input } from '#components/Input';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { useFormValidation } from '#flib/formValidation';
import { toJson } from '#flib/utils';
import { useModalActions } from '#providers/ModalProvider';
import { LeagueCreate } from '#shared/types/api/league';
import 'highlight.js/styles/gml.min.css';
import style from './LeagueCreateModal.module.scss';

hljs.registerLanguage('json', json);

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

  const { validate, errors, canSubmit } = useFormValidation(LeagueCreate, {});

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
            type="text"
            onInput={(e) => setName(e.currentTarget.value)}
            placeholder="League name"
            minLength={3}
            maxLength={64}
            required
            name="name"
            useDirectives={[validate]}
            invalid={!!errors.name}
          />
        </div>

        <div class={style.fieldRow}>
          <span class={style.fieldLabel}>Alias</span>
          <Input
            class={style.fieldInput}
            value={alias()}
            type="text"
            onInput={(e) => setAlias(e.currentTarget.value)}
            placeholder="Short id"
            minLength={2}
            maxLength={16}
            required
            name="alias"
            useDirectives={[validate]}
            invalid={!!errors.alias}
          />
        </div>

        <div class={style.fieldRow}>
          <span class={style.fieldLabel}>Description</span>
          <Input
            class={style.fieldInput}
            value={description()}
            type="text"
            onInput={(e) => setDescription(e.currentTarget.value)}
            placeholder="Optional"
            maxLength={255}
            name="description"
            useDirectives={[validate]}
            invalid={!!errors.description}
          />
        </div>

        <Divider class={style.divider} />

        <div class={style.hintRow}>
          <HighlightedCode language="json" code={toJson(errors)} />
        </div>
      </form>
    </Modal>
  );
};
