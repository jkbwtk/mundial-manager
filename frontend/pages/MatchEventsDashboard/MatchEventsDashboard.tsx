import { useAction, useParams } from '@solidjs/router';
import dayjs from 'dayjs';
import { createSignal, getOwner, onMount, Show } from 'solid-js';
import { AnchorButton, Button } from '#components/Button';
import { MatchCreatorModal } from '#components/MatchCreatorModal';
import {
  MatchEventInspector,
  MatchEventQuickAdd,
  MatchEventScrubber,
  MatchTimelineEditor,
  MatchTimelineIssues,
  MatchTimelineSummary,
} from '#components/MatchTimelineEditor';
import { MatchTimelineTable } from '#components/MatchTimelineTable';
import { MaterialSymbol } from '#components/MaterialSymbol';
import { Spinner } from '#components/Spinner';
import { Divider, Widget } from '#components/Widget';
import { useCan } from '#flib/identity';
import { createMatchTimelineDraft } from '#flib/matchTimelineDraft';
import { persistMatchTimelineDraft } from '#flib/matchTimelineDraftStorage';
import { createResilientAsync } from '#flib/resilientAsync';
import { observeElementWidth, useHandleButtonAction } from '#flib/solidHelpers';
import { actionSaveMatchTimeline, queryMatchTimeline } from '#flib/trpcCalls';
import { useUnsavedChanges } from '#flib/unsavedChanges';
import { isMobile } from '#flib/utils';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import { PermissionEnum } from '#shared/permissions';
import style from './MatchEventsDashboard.module.scss';

export interface MatchEventsDashboardParams {
  matchUuid: string;
  [key: string]: string | undefined;
}

const NARROW_LAYOUT_WIDTH_PX = 800;

export const MatchEventsDashboard: Component = () => {
  const params = useParams<MatchEventsDashboardParams>();
  const [, actions] = useToast();
  const [, { open }] = useModal();

  let containerRef!: HTMLDivElement;

  const [narrow, setNarrow] = createSignal(isMobile());

  const timeline = createResilientAsync(
    () => params.matchUuid,
    queryMatchTimeline,
  );
  const draft = createMatchTimelineDraft(() => timeline.latest);
  const storedDraft = persistMatchTimelineDraft(
    () => params.matchUuid,
    draft,
    () => timeline.latest !== undefined,
  );

  useUnsavedChanges(draft.isDirty, {
    message: 'Discard unsaved match timeline changes?',
    onDiscard: storedDraft.clear,
  });

  const saveTimeline = useAction(actionSaveMatchTimeline);
  const owner = getOwner();
  const can = useCan();

  const canSave = () =>
    can(PermissionEnum.MATCHES_UPDATE) && draft.isDirty() && !draft.hasErrors();

  const changesLabel = () => {
    if (!draft.isDirty()) return 'No unsaved changes';

    const { created, updated, removed } = draft.changes();
    const counts: [number, string][] = [
      [created, 'added'],
      [updated, 'changed'],
      [removed, 'removed'],
    ];

    return counts
      .flatMap(([count, label]) => (count > 0 ? [`${count} ${label}`] : []))
      .join(', ');
  };

  const handleSave = useHandleButtonAction(
    async () => {
      const input = draft.toSaveInput();

      if (input === null) return;

      try {
        const saved = await saveTimeline(input);

        draft.rebase(input.events, saved);
        actions.success('Match timeline saved successfully!');
      } catch (err) {
        if (draft.applyServerError(err)) {
          actions.error('Match timeline contains validation errors');

          return;
        }

        throw err;
      }
    },
    (err) => {
      actions.error(
        'Failed to save the match timeline, changes are kept on this device. Please try again.',
      );
      console.error('Match timeline save error:', err);
    },
  );

  const handleEditMatch = () => {
    const source = timeline.latest;

    if (source === undefined) return;

    open({
      props: {
        component: MatchCreatorModal,
        match: source.match,
      },
      owner,
      closeOnBackgroundClick: false,
    });
  };

  const handleDiscard = () => {
    draft.discard();
    storedDraft.dismissRestored();
  };

  onMount(() => {
    observeElementWidth(containerRef, (width) => {
      setNarrow(width <= NARROW_LAYOUT_WIDTH_PX);
    });
  });

  return (
    <div class={style.outerContainer}>
      <div class={style.controls}>
        <AnchorButton severity="secondary" href="/matches">
          Matches
        </AnchorButton>

        <Button
          severity="secondary"
          disabled={!timeline.latest || !can(PermissionEnum.MATCHES_UPDATE)}
          onPointerUp={handleEditMatch}
        >
          Edit Match
        </Button>

        <span class={style.spacer} />

        <span
          classList={{
            [style.changes]: true,
            [style.clean]: !draft.isDirty(),
          }}
        >
          {changesLabel()}
        </span>

        <Button
          severity="secondary"
          padding={0}
          title="Undo (Ctrl+Z)"
          disabled={!draft.canUndo()}
          onPointerUp={draft.undo}
        >
          <MaterialSymbol symbol="undo" />
        </Button>

        <Button
          severity="secondary"
          padding={0}
          title="Redo (Ctrl+Y)"
          disabled={!draft.canRedo()}
          onPointerUp={draft.redo}
        >
          <MaterialSymbol symbol="redo" />
        </Button>

        <Button
          severity="secondary"
          disabled={!draft.isDirty()}
          onPointerUp={handleDiscard}
        >
          Discard
        </Button>

        <Button
          title="Save (Ctrl+S)"
          disabled={!canSave()}
          loading={handleSave.loading()}
          onPointerUp={() => handleSave()}
        >
          Save
        </Button>
      </div>

      <Show when={storedDraft.restored()}>
        {(restored) => (
          <div class={style.notice} role="status">
            <span>
              Restored unsaved changes from{' '}
              {dayjs(restored().savedAt).format('DD.MM HH:mm')}
              {restored().baseChanged
                ? ', the match was changed elsewhere since'
                : ''}
            </span>

            <span class={style.spacer} />

            <Button severity="secondary" onPointerUp={handleDiscard}>
              Discard
            </Button>

            <Button onPointerUp={storedDraft.dismissRestored}>Keep</Button>
          </div>
        )}
      </Show>

      <Show when={storedDraft.writeFailed()}>
        <div class={style.notice} role="alert">
          Changes cannot be stored on this device, save regularly
        </div>
      </Show>

      <Divider />

      <div ref={containerRef} class={style.container}>
        <Show
          when={timeline.latest}
          fallback={
            <div class={style.loading}>
              <Spinner />
            </div>
          }
        >
          {(source) => (
            <MatchTimelineEditor
              draft={draft}
              timeline={source()}
              onSave={() => {
                if (canSave()) handleSave();
              }}
            >
              <div
                classList={{
                  [style.dashboard]: true,
                  [style.narrow]: narrow(),
                }}
              >
                <Widget class={style.timelineWidget} topLeftLabels="Timeline">
                  <MatchEventScrubber />

                  <Divider />

                  <MatchEventQuickAdd />
                </Widget>

                <Widget class={style.matchWidget} topLeftLabels="Match">
                  <MatchTimelineSummary />
                </Widget>

                <Widget class={style.eventsWidget} topLeftLabels="Events">
                  <MatchTimelineTable
                    timeline={source()}
                    draft={draft}
                    renderInspector={
                      narrow()
                        ? (uuid) => <MatchEventInspector uuid={uuid} />
                        : undefined
                    }
                  />
                </Widget>

                <Show when={!narrow()}>
                  <div class={style.eventArea}>
                    <Widget class={style.eventWidget} topLeftLabels="Event">
                      <Show
                        when={draft.selectedUuid()}
                        fallback={
                          <span class={style.noData}>
                            Select an event to edit it
                          </span>
                        }
                      >
                        {(uuid) => <MatchEventInspector uuid={uuid()} />}
                      </Show>
                    </Widget>
                  </div>
                </Show>

                <Widget
                  class={style.validationWidget}
                  topLeftLabels="Validation"
                  topRightLabels={[
                    `${draft.issueCounts().errors} errors`,
                    `${draft.issueCounts().warnings} warnings`,
                  ]}
                >
                  <MatchTimelineIssues />
                </Widget>
              </div>
            </MatchTimelineEditor>
          )}
        </Show>
      </div>
    </div>
  );
};

export default MatchEventsDashboard;
