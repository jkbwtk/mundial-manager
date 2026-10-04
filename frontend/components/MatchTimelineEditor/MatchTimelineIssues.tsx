import { createMemo, Show } from 'solid-js';
import { FormErrors, type FormErrorsProps } from '#components/FormErrors';
import { formatElapsed, MatchEventTypeLabels } from '#flib/matchEvents';
import type { MatchTimelineDraftIssue } from '#flib/matchTimelineDraft';
import { isMatchTimelineError } from '#shared/matchTimeline';
import { useMatchTimelineEditor } from './MatchTimelineEditor';

export interface MatchTimelineIssuesProps {
  eventUuid?: string;
}

type MessagesByKey = FormErrorsProps['errors'];

interface GroupedMessages {
  errors: MessagesByKey;
  warnings: MessagesByKey;
}

const TIMELINE_KEY = 'timeline';
const EVENT_KEY = 'event';

const EventFieldNames: Record<string, string> = {
  uuid: 'Identifier',
  event: 'Event',
  type: 'Type',
  offset: 'Time',
  side: 'Side',
  player: 'Player',
  ownGoal: 'Own goal',
  goalType: 'Goal type',
  ball: 'Ball',
  details: 'Details',
};

function groupMessages(
  issues: readonly MatchTimelineDraftIssue[],
  getKey: (issue: MatchTimelineDraftIssue) => string,
): GroupedMessages {
  const errors: MessagesByKey = {};
  const warnings: MessagesByKey = {};

  for (const issue of issues) {
    const target = isMatchTimelineError(issue) ? errors : warnings;
    const key = getKey(issue);

    target[key] ??= [];
    target[key].push(issue.message);
  }

  return { errors, warnings };
}

export const MatchTimelineIssues: Component<MatchTimelineIssuesProps> = (
  props,
) => {
  const [draft] = useMatchTimelineEditor();

  const isEventScoped = () => props.eventUuid !== undefined;

  const issues = () =>
    props.eventUuid === undefined
      ? draft.issues()
      : draft.getEventIssues(props.eventUuid);

  const messages = createMemo(() =>
    groupMessages(issues(), (issue) =>
      isEventScoped()
        ? (issue.field ?? EVENT_KEY)
        : (issue.eventUuid ?? TIMELINE_KEY),
    ),
  );

  const fieldNames = createMemo(() => {
    if (isEventScoped()) return EventFieldNames;

    const names: Record<string, string> = { [TIMELINE_KEY]: 'Timeline' };

    for (const issue of issues()) {
      if (issue.eventUuid === null) continue;

      const step = draft.getStep(issue.eventUuid);

      if (step) {
        names[issue.eventUuid] =
          `T+${formatElapsed(step.elapsed)} ${MatchEventTypeLabels[step.event.type]}`;
      }
    }

    return names;
  });

  const selectEvent = (key: string) => {
    if (key === TIMELINE_KEY) return;

    draft.setSelectedUuid(key);
  };

  return (
    <Show when={!isEventScoped() || issues().length > 0}>
      <FormErrors
        errors={messages().errors}
        warnings={messages().warnings}
        fieldNames={fieldNames()}
        onFieldSelect={isEventScoped() ? undefined : selectEvent}
      />
    </Show>
  );
};
