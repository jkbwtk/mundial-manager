import { createContext, onCleanup, onMount, useContext } from 'solid-js';
import {
  MATCH_EVENT_COARSE_TIME_STEP_MS,
  MATCH_EVENT_TIME_STEP_MS,
  MatchEventTypeLabels,
} from '#flib/matchEvents';
import type { MatchTimelineDraft } from '#flib/matchTimelineDraft';
import {
  createMatchTimelineLookup,
  type MatchTimelineLookup,
} from '#flib/matchTimelineLookup';
import { isEditableTarget } from '#flib/utils';
import { useModal } from '#providers/ModalProvider';
import { useToast } from '#providers/ToastProvider';
import type { MatchTimeline } from '#shared/types/api/matchTimeline';

export type MatchTimelineEditorContextValue = [
  draft: MatchTimelineDraft,
  lookup: MatchTimelineLookup,
];

export interface MatchTimelineEditorProps {
  draft: MatchTimelineDraft;
  timeline: MatchTimeline;

  onSave?: () => void;
}

const MatchTimelineEditorContext =
  createContext<MatchTimelineEditorContextValue>();

function getNudgeStep(ev: KeyboardEvent): number {
  if (ev.shiftKey) return MATCH_EVENT_COARSE_TIME_STEP_MS;

  return MATCH_EVENT_TIME_STEP_MS;
}

export const MatchTimelineEditor: ParentComponent<MatchTimelineEditorProps> = (
  props,
) => {
  const [, { isActive: isModalActive }] = useModal();

  const lookup = createMatchTimelineLookup(() => props.timeline);
  const removeEvent = useRemoveMatchEvent(props.draft);

  const handleShortcut = (ev: KeyboardEvent): boolean => {
    if (!ev.ctrlKey && !ev.metaKey) return false;

    const key = ev.key.toLowerCase();

    switch (key) {
      case 's': {
        ev.preventDefault();
        props.onSave?.();

        return true;
      }

      case 'y':
      case 'z': {
        if (isEditableTarget(ev.target)) return false;

        ev.preventDefault();

        if (key === 'y' || ev.shiftKey) {
          props.draft.redo();
        } else {
          props.draft.undo();
        }

        return true;
      }

      default:
        return false;
    }
  };

  const handleKeyDown = (ev: KeyboardEvent) => {
    if (ev.defaultPrevented || isModalActive() || handleShortcut(ev)) return;
    if (isEditableTarget(ev.target)) return;

    const selectedUuid = props.draft.selectedUuid();

    switch (ev.key) {
      case 'Escape': {
        ev.preventDefault();
        props.draft.setSelectedUuid(null);
        props.draft.setPlayhead(null);
        break;
      }

      case 'Delete': {
        if (selectedUuid === null) return;

        ev.preventDefault();
        removeEvent(selectedUuid);
        break;
      }

      case 'ArrowUp':
      case 'ArrowDown': {
        if (selectedUuid === null) return;

        ev.preventDefault();
        props.draft.selectAdjacent(ev.key === 'ArrowUp' ? -1 : 1);
        break;
      }

      case 'ArrowLeft':
      case 'ArrowRight': {
        if (selectedUuid === null) return;

        ev.preventDefault();
        props.draft.nudgeEvent(
          selectedUuid,
          (ev.key === 'ArrowLeft' ? -1 : 1) * getNudgeStep(ev),
        );
        break;
      }
    }
  };

  onMount(() => {
    document.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
    });
  });

  return (
    <MatchTimelineEditorContext.Provider value={[props.draft, lookup]}>
      {props.children}
    </MatchTimelineEditorContext.Provider>
  );
};

export function useRemoveMatchEvent(
  draft: MatchTimelineDraft,
): (uuid: string) => void {
  const [, actions] = useToast();

  return (uuid) => {
    const event = draft.getEvent(uuid);

    if (event === null) return;

    draft.removeEvent(uuid);

    const toast = actions.show({
      message: `Removed ${MatchEventTypeLabels[event.type]} event`,
      severity: 'info',
      actions: [
        {
          label: 'Undo',
          severity: 'secondary',
          onClick: () => {
            if (draft.getEvent(uuid) === null) draft.addEvent(event);

            toast.dismiss();
          },
        },
      ],
    });
  };
}

export const useMatchTimelineEditor = (): MatchTimelineEditorContextValue => {
  const context = useContext(MatchTimelineEditorContext);

  if (context === undefined) {
    throw new Error(
      'MatchTimelineEditorContext: useMatchTimelineEditor() called before provider',
    );
  }

  return context;
};
