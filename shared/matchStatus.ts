import {
  getMatchSurrenderSide,
  hasOpenMatchPause,
  type MatchTimelineEntry,
} from '#shared/matchTimeline';
import { type MatchStatus, MatchStatusEnum } from '#shared/types/api/match';

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
