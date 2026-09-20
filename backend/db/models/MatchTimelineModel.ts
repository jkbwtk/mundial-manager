import { randomUUID } from 'node:crypto';
import type { DB, TX } from '#backend/db/database';
import { ModelOps } from '#backend/db/models/ModelOps';
import { matchTimelinesTable } from '#backend/db/schema';
import {
  MatchTimelineInsertSchema,
  MatchTimelineSelectSchema,
  MatchTimelineUpdateSchema,
} from '#backend/types/db/matchTimeline';
import { convertTimelineIssuesToFields } from '#blib/matchTimelineIssues';
import {
  ConvertDrizzleErrors,
  StrategyValidationError,
} from '#blib/modelErrors';
import {
  getMatchTimelineContext,
  isMatchTimelineError,
  type MatchTimelineEntry,
  sortMatchTimeline,
  validateMatchTimeline,
} from '#shared/matchTimeline';
import { MatchEvent } from '#shared/types/api/matchEvent';
import {
  MatchTimelineErrorTypeEnum,
  MatchTimelineQueryMeta,
} from '#shared/types/api/matchTimeline';

type TimelineMatch = Parameters<typeof getMatchTimelineContext>[0] & {
  uuid: string;
};

const MatchTimelineOps = ModelOps({
  table: matchTimelinesTable,
  tableName: 'matchTimelinesTable',
  selectSchema: MatchTimelineSelectSchema,
  createSchema: MatchTimelineInsertSchema,
  updateSchema: MatchTimelineUpdateSchema,
  queryMetaSchema: MatchTimelineQueryMeta,
  publicSchema: MatchTimelineSelectSchema,
});

export class MatchTimelineModel extends MatchTimelineOps {
  protected static toStoredEvents(events: MatchTimelineEntry[]): MatchEvent[] {
    const identified: MatchEvent[] = events.map((event) => ({
      ...event,
      uuid: event.uuid ?? randomUUID(),
    }));

    return sortMatchTimeline(identified);
  }

  @ConvertDrizzleErrors()
  public static async getByMatchId(
    db: DB | TX,
    leagueUuid: string,
    matchUuid: string,
  ) {
    const instance = await db.query.matchTimelinesTable.findFirst({
      where: {
        leagueUuid,
        matchUuid,
        $deletedAt: {
          isNull: true,
        },
      },
    });

    return instance ?? null;
  }

  @ConvertDrizzleErrors()
  public static async getEventsByMatchId(
    db: DB | TX,
    leagueUuid: string,
    matchUuid: string,
  ): Promise<MatchEvent[]> {
    const timeline = await this.getByMatchId(db, leagueUuid, matchUuid);

    return timeline ? MatchEvent.array().parse(timeline.events) : [];
  }

  public static assertValidTimeline(
    match: Parameters<typeof getMatchTimelineContext>[0],
    events: MatchTimelineEntry[],
  ) {
    const errors = validateMatchTimeline(
      events,
      getMatchTimelineContext(match),
    ).filter(isMatchTimelineError);

    if (errors.length > 0) {
      throw new StrategyValidationError(
        'Match timeline is invalid',
        convertTimelineIssuesToFields(errors),
      );
    }
  }

  @ConvertDrizzleErrors()
  public static async saveForMatch(
    db: DB | TX,
    leagueUuid: string,
    match: TimelineMatch,
    events: MatchTimelineEntry[],
  ): Promise<MatchEvent[]> {
    const instance = await db.transaction(async (tx) => {
      const stored = this.toStoredEvents(events);
      const existing = await this.getByMatchId(tx, leagueUuid, match.uuid);

      if (existing) {
        await this.update(tx, leagueUuid, {
          uuid: existing.uuid,
          events: stored,
        });
      } else {
        await this.create(tx, leagueUuid, {
          matchUuid: match.uuid,
          events: stored,
          labels: {},
        });
      }

      return stored;
    });

    return instance;
  }

  public static strategies = MatchTimelineOps.defineStrategies({
    preWrite: {
      eventsValid: async ({ db, leagueUuid, next }) => {
        const match = await db.query.matchesTable.findFirst({
          where: {
            leagueUuid,
            uuid: next.matchUuid,
            $deletedAt: {
              isNull: true,
            },
          },
        });

        if (!match) {
          throw new StrategyValidationError('Match does not exist', {
            matchUuid: {
              value: next.matchUuid,
              errorType: MatchTimelineErrorTypeEnum.MATCH_NOT_FOUND,
            },
          });
        }

        MatchTimelineModel.assertValidTimeline(match, next.events);
      },
    },
  });
}
