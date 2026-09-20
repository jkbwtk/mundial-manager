import type { ModelErrorField, ModelErrorFieldMap } from '#blib/modelErrors';
import type { MatchTimelineEntry } from '#shared/matchTimeline';
import {
  MatchTimelineErrorTypeEnum,
  type MatchTimelineIssue,
  MatchTimelineIssueSeverityEnum,
} from '#shared/types/api/matchTimeline';

export function convertTimelineIssuesToFields(
  issues: MatchTimelineIssue[],
): ModelErrorFieldMap {
  const fields: Record<string, ModelErrorField[]> = {};

  for (const issue of issues) {
    const eventKey = issue.eventUuid ?? issue.eventIndex;
    const key =
      eventKey === null
        ? 'events'
        : ['events', eventKey, issue.field ?? 'event'].join('.');

    const field = { value: issue.eventUuid, errorType: issue.errorType };

    fields[key] = fields[key] ?? [];
    fields[key].push(field);
  }

  return fields;
}

export function getMissingReferenceIssues(
  events: MatchTimelineEntry[],
  availablePlayers: Set<string>,
  availableBalls: Set<string>,
): MatchTimelineIssue[] {
  const issues: MatchTimelineIssue[] = [];

  for (const [index, event] of events.entries()) {
    const missing =
      event.type === 'GOAL' && !availablePlayers.has(event.player)
        ? {
            errorType: MatchTimelineErrorTypeEnum.PLAYERS_NOT_FOUND,
            field: 'player',
          }
        : event.type === 'BALL_CHANGE' && !availableBalls.has(event.ball)
          ? {
              errorType: MatchTimelineErrorTypeEnum.BALL_NOT_FOUND,
              field: 'ball',
            }
          : null;

    if (missing === null) continue;

    issues.push({
      severity: MatchTimelineIssueSeverityEnum.WARNING,
      errorType: missing.errorType,
      eventUuid: event.uuid ?? null,
      eventIndex: index,
      field: missing.field,
    });
  }

  return issues;
}
