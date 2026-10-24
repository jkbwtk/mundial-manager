import type { DB, TX } from '#backend/db/database';
import { MatchModel } from '#backend/db/models/MatchModel';
import { MatchTimelineModel } from '#backend/db/models/MatchTimelineModel';
import { publishLeagueEvent } from '#blib/leagueEvents';
import { ConvertDrizzleErrors } from '#blib/modelErrors';
import { ActiveMatch, type ActiveMatches } from '#shared/types/api/activeMatch';
import {
  LiveMatchStatuses,
  type MatchStatus,
  MatchStatusEnum,
} from '#shared/types/api/match';
import { MatchEvent } from '#shared/types/api/matchEvent';
import { getValueHash } from '#shared/utils';

const ACTIVE_MATCHES_LIMIT = 100;

const publishedHashes = new Map<string, string>();
const publishQueues = new Map<string, Promise<void>>();

// biome-ignore lint/complexity/noStaticOnlyClass: yeah
export class ActiveMatchModel {
  @ConvertDrizzleErrors()
  public static async getAll(
    db: DB | TX,
    leagueUuid: string,
  ): Promise<ActiveMatches> {
    const getByStatus = (status: MatchStatus[]) =>
      MatchModel.getAll(db, leagueUuid, {
        filters: { status },
        sorting: { field: 'startDate', direction: 'asc' },
        pagination: { limit: ACTIVE_MATCHES_LIMIT, offset: 0 },
      });

    const [live, scheduled] = await Promise.all([
      getByStatus(LiveMatchStatuses),
      getByStatus([MatchStatusEnum.SCHEDULED]),
    ]);
    const matches = [...live, ...scheduled];

    const timelines = await MatchTimelineModel.getByMatchIds(
      db,
      leagueUuid,
      matches.map((match) => match.uuid),
    );

    const timelinesByMatch = new Map(
      timelines.map((timeline) => [timeline.matchUuid, timeline]),
    );

    return matches.map((match) => {
      const timeline = timelinesByMatch.get(match.uuid);
      const updatedAt = Math.max(
        match.$updatedAt.getTime(),
        timeline?.$updatedAt.getTime() ?? 0,
      );

      return ActiveMatch.parse({
        match,
        events: timeline ? MatchEvent.array().parse(timeline.events) : [],
        updatedAt: new Date(updatedAt),
      });
    });
  }

  public static publish(db: DB, leagueUuid: string): Promise<void> {
    const previous = publishQueues.get(leagueUuid) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(() => this.publishLatest(db, leagueUuid));

    publishQueues.set(leagueUuid, next);

    return next;
  }

  protected static async publishLatest(
    db: DB,
    leagueUuid: string,
  ): Promise<void> {
    const matches = await this.getAll(db, leagueUuid);
    const hash = getValueHash(matches);

    if (publishedHashes.get(leagueUuid) === hash) return;

    publishedHashes.set(leagueUuid, hash);
    publishLeagueEvent(leagueUuid, { topic: 'ACTIVE_MATCHES', matches });
  }
}
