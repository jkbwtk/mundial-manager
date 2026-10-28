import {
  getMatchSurrenderSide,
  getMatchTimelinePauseDuration,
  getMatchTimelineScore,
  hasOpenMatchPause,
  type MatchTimelineEntry,
} from '#shared/matchTimeline';
import {
  LiveMatchStatuses,
  type Match,
  type MatchStateErrorType,
  MatchStateErrorTypeEnum,
  type MatchStatus,
  MatchStatusEnum,
} from '#shared/types/api/match';

type MatchState = Pick<
  Match,
  | 'status'
  | 'startDate'
  | 'duration'
  | 'pauseDuration'
  | 'side1Score'
  | 'side2Score'
>;

export interface MatchStateIssue {
  field: keyof MatchState;
  errorType: MatchStateErrorType;
}

export interface MatchStatusContext {
  duration: number | null;
  events: MatchTimelineEntry[];
}

export function deriveMatchStatus(
  current: MatchStatus,
  context: MatchStatusContext,
): MatchStatus {
  if (context.events.some((event) => event.type === 'CANCEL')) {
    return MatchStatusEnum.CANCELED;
  }

  if (getMatchSurrenderSide(context.events) !== null) {
    return MatchStatusEnum.SURRENDERED;
  }

  if (context.duration !== null) return MatchStatusEnum.FINISHED;

  if (context.events.length === 0) {
    return current === MatchStatusEnum.SURRENDERED
      ? MatchStatusEnum.FINISHED
      : current;
  }

  return hasOpenMatchPause(context.events)
    ? MatchStatusEnum.PAUSED
    : MatchStatusEnum.ONGOING;
}

function getMatchStatusIssue(
  match: MatchState,
  events: MatchTimelineEntry[],
): MatchStateErrorType | null {
  const derived = deriveMatchStatus(match.status, {
    duration: match.duration,
    events,
  });

  if (derived !== match.status) {
    return match.status === MatchStatusEnum.SURRENDERED
      ? MatchStateErrorTypeEnum.SURRENDER_EVENT_MISSING
      : MatchStateErrorTypeEnum.STATUS_DOES_NOT_MATCH_TIMELINE;
  }

  if (
    match.status === MatchStatusEnum.CANCELED &&
    !events.some((event) => event.type === 'CANCEL')
  ) {
    return MatchStateErrorTypeEnum.CANCEL_EVENT_MISSING;
  }

  if (match.status === MatchStatusEnum.PAUSED && !hasOpenMatchPause(events)) {
    return MatchStateErrorTypeEnum.PAUSE_EVENT_MISSING;
  }

  return null;
}

export function getMatchStateIssues(
  match: MatchState,
  events: MatchTimelineEntry[],
): MatchStateIssue[] {
  const issues: MatchStateIssue[] = [];
  const { SCHEDULED_WITH_SCORE, SCORE_DOES_NOT_MATCH_TIMELINE } =
    MatchStateErrorTypeEnum;

  if (match.status === MatchStatusEnum.SCHEDULED) {
    if (match.duration !== null) {
      issues.push({
        field: 'duration',
        errorType: MatchStateErrorTypeEnum.SCHEDULED_WITH_DURATION,
      });
    }

    if (match.side1Score !== 0) {
      issues.push({ field: 'side1Score', errorType: SCHEDULED_WITH_SCORE });
    }

    if (match.side2Score !== 0) {
      issues.push({ field: 'side2Score', errorType: SCHEDULED_WITH_SCORE });
    }

    if (match.pauseDuration !== 0) {
      issues.push({
        field: 'pauseDuration',
        errorType: MatchStateErrorTypeEnum.SCHEDULED_WITH_PAUSE,
      });
    }
  }

  if (LiveMatchStatuses.includes(match.status) && match.startDate === null) {
    issues.push({
      field: 'startDate',
      errorType: MatchStateErrorTypeEnum.LIVE_WITHOUT_START_DATE,
    });
  }

  if (events.length > 0) {
    const [side1Score, side2Score] = getMatchTimelineScore(events);

    if (match.side1Score !== side1Score) {
      issues.push({
        field: 'side1Score',
        errorType: SCORE_DOES_NOT_MATCH_TIMELINE,
      });
    }

    if (match.side2Score !== side2Score) {
      issues.push({
        field: 'side2Score',
        errorType: SCORE_DOES_NOT_MATCH_TIMELINE,
      });
    }

    if (match.pauseDuration !== getMatchTimelinePauseDuration(events)) {
      issues.push({
        field: 'pauseDuration',
        errorType: MatchStateErrorTypeEnum.PAUSE_DOES_NOT_MATCH_TIMELINE,
      });
    }
  }

  if (issues.length > 0) return issues;

  const statusIssue = getMatchStatusIssue(match, events);

  return statusIssue === null
    ? []
    : [{ field: 'status', errorType: statusIssue }];
}
