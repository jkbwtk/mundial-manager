import { useAction } from '@solidjs/router';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import { createMemo, createUniqueId, Show } from 'solid-js';
import { Button } from '#components/Button';
import { HighlightedCode } from '#components/HighlightedCode';
import { Input } from '#components/Input';
import { Modal } from '#components/Modal';
import { Divider } from '#components/Widget';
import { useFormValidation } from '#flib/formValidation';
import {
  actionCreateMatch,
  actionUpdateMatch,
  queryBallById,
  queryBalls,
  queryPlayerById,
  queryPlayers,
  queryTableById,
  queryTables,
} from '#flib/trpcCalls';
import { toJson } from '#flib/utils';
import { useModalActions } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import 'highlight.js/styles/gml.min.css';
import { ColorBlock } from '#components/ColorBlock';
import { DateInput } from '#components/DateInput';
import { Dropdown, type DropdownOption } from '#components/Dropdown';
import {
  MultiResourcePicker,
  ResourcePicker,
} from '#components/ResourcePicker';
import { autofocus } from '#flib/solidHelpers';
import {
  type Match,
  MatchCreate,
  MatchStatusEnum,
} from '#shared/types/api/match';
import style from './MatchCreatorModal.module.scss';

hljs.registerLanguage('json', json);

export interface MatchCreatorModalProps {
  match?: Match;
}

interface CreatorState {
  title: string;
  submitButtonText: string;
  successMessage: string;
  errorMessage: string;
  logLabel: string;
}

export const MatchCreatorModal: Component<MatchCreatorModalProps> = (props) => {
  const { closeModal } = useModalActions();
  const [, actions] = useToast();

  const formId = createUniqueId();

  const isCreating = props.match === undefined;

  const config: CreatorState = isCreating
    ? {
        title: 'Match Creator',
        submitButtonText: 'Create',
        successMessage: 'Match created successfully!',
        errorMessage: 'Failed to create match. Please try again.',
        logLabel: 'Match creation error:',
      }
    : {
        title: 'Match Editor',
        submitButtonText: 'Update',
        successMessage: 'Match updated successfully!',
        errorMessage: 'Failed to update match. Please try again.',
        logLabel: 'Match update error:',
      };

  const { validate, errors, canSubmit, formSubmit } = useFormValidation(
    MatchCreate,
    {
      updateMode: !isCreating,
      implicitDefaults: {
        events: [],
      },
    },
  );

  const hasValidationErrors = createMemo(() => Object.keys(errors).length > 0);

  const handleError = (err: unknown) => {
    actions.error(config.errorMessage);
    console.error(config.logLabel, err);
  };

  const handleSuccess = (match: Match) => {
    actions.success(config.successMessage);
    closeModal(match);
  };

  const handleCancel = (ev: PointerEvent) => {
    ev.preventDefault();
    closeModal(false);
  };

  const createAction = useAction(actionCreateMatch);
  const updateAction = useAction(actionUpdateMatch);

  if (!createAction || !updateAction) {
    actions.error('Failed to initialize Match Creator modal');
    closeModal(false);
    return;
  }

  const action = (data: MatchCreate) => {
    if (isCreating) {
      return createAction(data);
    }

    return updateAction({
      uuid: props.match!.uuid,
      ...data,
    });
  };

  const handleSubmit = formSubmit(action, handleSuccess, handleError);

  const statusMap: DropdownOption[] = Object.values(MatchStatusEnum).map(
    (status) => ({
      label: status,
      value: status,
    }),
  );

  return (
    <Modal
      class={style.modal}
      topLeftLabels={config.title}
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
          {config.submitButtonText}
        </Button>,
      ]}
    >
      <form id={formId} class={style.form} onSubmit={handleSubmit}>
        <div class={style.fieldsContainer}>
          <span class={style.fieldLabel}>Start Date:</span>
          <DateInput
            class={style.fieldInput}
            name="startDate"
            value={props.match ? new Date(props.match.startDate) : undefined}
            useDirectives={[validate, autofocus]}
            invalid={!!errors.startDate}
          />

          <span class={style.fieldLabel}>Duration:</span>
          <Input
            class={style.fieldInput}
            type="text"
            inputMode="numeric"
            placeholder="0"
            min={0}
            required
            name="duration"
            value={props.match?.duration.toString()}
            useDirectives={[validate]}
            invalid={!!errors.duration}
          >
            s
          </Input>

          <span class={style.fieldLabel}>Pause Duration:</span>
          <Input
            class={style.fieldInput}
            type="text"
            inputMode="numeric"
            placeholder="0"
            min={0}
            name="pauseDuration"
            value={props.match?.pauseDuration?.toString()}
            useDirectives={[validate]}
            invalid={!!errors.pauseDuration}
          >
            s
          </Input>

          <span class={style.fieldLabel}>Table:</span>
          <ResourcePicker
            class={style.fieldInput}
            placeholder="Select a table..."
            queryById={queryTableById}
            query={queryTables}
            toEntry={(e) => {
              return { label: e.name, value: e.uuid };
            }}
            name="tableUuid"
            value={props.match?.tableUuid ?? undefined}
            useDirectives={[validate]}
            invalid={!!errors.tableUuid}
          />

          <span class={style.fieldLabel}>Ball:</span>
          <ResourcePicker
            class={style.fieldInput}
            placeholder="Select a ball..."
            queryById={queryBallById}
            query={queryBalls}
            toEntry={(e) => {
              return {
                label: (
                  <>
                    {e.name}{' '}
                    <Show when={e.color}>
                      {(color) => (
                        <>
                          (<ColorBlock color={color()} width={2} />)
                        </>
                      )}
                    </Show>
                  </>
                ),
                value: e.uuid,
              };
            }}
            name="ballUuid"
            value={props.match?.ballUuid ?? undefined}
            useDirectives={[validate]}
            invalid={!!errors.ballUuid}
          />

          <span class={style.fieldLabel}>Status:</span>
          <Dropdown
            value={props.match?.status ?? ''}
            options={statusMap}
            name="status"
            useDirectives={[validate]}
            invalid={!!errors.status}
          />

          <span class={style.fieldLabel}>Spectators:</span>
          <MultiResourcePicker
            class={style.fieldInput}
            queryById={queryPlayerById}
            query={queryPlayers}
            toEntry={(e) => {
              return { label: e.name, value: e.uuid };
            }}
            name="spectators"
            value={props.match?.spectators ?? []}
            useDirectives={[validate]}
            invalid={!!errors.spectators}
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
