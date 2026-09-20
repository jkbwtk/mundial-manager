import {
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

  if (context.duration !== null) return MatchStatusEnum.FINISHED;

  if (context.events.length === 0) return current;

  return hasOpenMatchPause(context.events)
    ? MatchStatusEnum.PAUSED
    : MatchStatusEnum.ONGOING;
}
