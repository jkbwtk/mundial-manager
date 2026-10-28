import type { MatchStateErrorType } from '#shared/types/api/match';

export const ModelErrorTypeEnum = {
  MODEL_ERROR: 'MODEL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_VALUE: 'DUPLICATE_VALUE',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  NON_NULL_VIOLATION: 'NON_NULL_VIOLATION',
  INVALID_FORMAT: 'INVALID_FORMAT',
} as const;

export type ModelErrorType =
  (typeof ModelErrorTypeEnum)[keyof typeof ModelErrorTypeEnum];

const ModelErrorMessages: Record<ModelErrorType, string> = {
  MODEL_ERROR: 'Request could not be processed',
  NOT_FOUND: 'Resource does not exist',
  DUPLICATE_VALUE: 'Value is already in use',
  FOREIGN_KEY_VIOLATION: 'Referenced resource does not exist',
  NON_NULL_VIOLATION: 'Value is required',
  INVALID_FORMAT: 'Value has an invalid format',
};

const MatchStateErrorMessages: Record<MatchStateErrorType, string> = {
  STATUS_DOES_NOT_MATCH_TIMELINE: 'Status does not match the match timeline',
  SURRENDER_EVENT_MISSING: 'Surrendered match requires a surrender event',
  CANCEL_EVENT_MISSING: 'Cancelled match requires a cancel event',
  PAUSE_EVENT_MISSING: 'Paused match requires an open pause event',
  SCHEDULED_WITH_DURATION: 'Scheduled match cannot have a duration',
  SCHEDULED_WITH_SCORE: 'Scheduled match cannot have a score',
  SCHEDULED_WITH_PAUSE: 'Scheduled match cannot have a pause duration',
  LIVE_WITHOUT_START_DATE: 'Live match requires a start date',
  SCORE_DOES_NOT_MATCH_TIMELINE: 'Score must match the goals in the timeline',
  PAUSE_DOES_NOT_MATCH_TIMELINE:
    'Pause duration must match the timeline pauses',
};

export function getModelErrorMessage(errorType: string): string {
  return (
    ModelErrorMessages[errorType as ModelErrorType] ??
    MatchStateErrorMessages[errorType as MatchStateErrorType] ??
    errorType
  );
}
