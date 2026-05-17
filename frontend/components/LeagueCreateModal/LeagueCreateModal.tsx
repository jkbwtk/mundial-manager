import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import {
  createMemo,
  createSignal,
  createUniqueId,
  type getOwner,
  runWithOwner,
  Show,
} from 'solid-js';
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
import { useAction } from '@solidjs/router';
import { actionCreateLeague } from '#flib/trpcCalls';
import { useToast } from '#providers/ToastProvider';
import style from './LeagueCreateModal.module.scss';

hljs.registerLanguage('json', json);

export type LeagueCreatorResult =
  | { ok: true }
  | { ok: false; message?: string };

export interface LeagueCreatorModalProps {
  initialValues?: Partial<LeagueCreate>;
  owner: ReturnType<typeof getOwner>;
}

export const LeagueCreatorModal: Component<LeagueCreatorModalProps> = (
  props,
) => {
  const { closeModal } = useModalActions();
  const [, actions] = useToast();

  const formId = createUniqueId();

  const { validate, errors, canSubmit, formSubmit } = useFormValidation(
    LeagueCreate,
    {},
  );

  const [name, setName] = createSignal(props.initialValues?.name ?? '');
  const [alias, setAlias] = createSignal(props.initialValues?.alias ?? '');
  const [description, setDescription] = createSignal(
    props.initialValues?.description ?? '',
  );

  const hasValidationErrors = createMemo(() => Object.keys(errors).length > 0);

  const handleCancel = (ev: PointerEvent) => {
    ev.preventDefault();
    closeModal(false);
  };

  const createLeague = runWithOwner(props.owner, () =>
    useAction(actionCreateLeague),
  );

  if (!createLeague) {
    actions.error('Failed to initialize League Creator modal');
    closeModal(false);
    return;
  }

  const handleSubmit = formSubmit(createLeague);

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
          loading={handleSubmit.isSubmitting()}
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
          <Show
            when={hasValidationErrors()}
            fallback={<span class={style.noErrors}>No validation errors</span>}
          >
            <HighlightedCode
              language="json"
              code={`Errors: ${toJson(errors)}`}
            />
          </Show>
        </div>
      </form>
    </Modal>
  );
};
