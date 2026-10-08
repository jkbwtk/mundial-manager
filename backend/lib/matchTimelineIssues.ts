import type { ModelErrorField, ModelErrorFieldMap } from '#blib/modelErrors';
import type { MatchTimelineEntry } from '#shared/matchTimeline';
import {
  type MatchTimelineErrorType,
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

export interface MatchTimelineReferenceSets {
  players: Set<string>;
  balls: Set<string>;
  goalTypes: Set<string>;
}

function getMissingReference(
  event: MatchTimelineEntry,
  available: MatchTimelineReferenceSets,
): { errorType: MatchTimelineErrorType; field: string } | null {
  switch (event.type) {
    case 'GOAL':
      if (!available.players.has(event.player)) {
        return {
          errorType: MatchTimelineErrorTypeEnum.PLAYERS_NOT_FOUND,
          field: 'player',
        };
      }

      if (event.goalType.some((uuid) => !available.goalTypes.has(uuid))) {
        return {
          errorType: MatchTimelineErrorTypeEnum.GOAL_TYPE_NOT_FOUND,
          field: 'goalType',
        };
      }

      return null;

    case 'BALL_CHANGE':
      if (available.balls.has(event.ball)) return null;

      return {
        errorType: MatchTimelineErrorTypeEnum.BALL_NOT_FOUND,
        field: 'ball',
      };

    default:
      return null;
  }
}

export function getMissingReferenceIssues(
  events: MatchTimelineEntry[],
  available: MatchTimelineReferenceSets,
): MatchTimelineIssue[] {
  return events.flatMap((event, index) => {
    const missing = getMissingReference(event, available);

    if (missing === null) return [];

    return [
      {
        severity: MatchTimelineIssueSeverityEnum.WARNING,
        errorType: missing.errorType,
        eventUuid: event.uuid ?? null,
        eventIndex: index,
        field: missing.field,
      },
    ];
  });
}
