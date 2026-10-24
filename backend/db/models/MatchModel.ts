import { sql } from 'drizzle-orm';
import type { DB, TX } from '#backend/db/database';
import { BallModel } from '#backend/db/models/BallModel';
import { GoalTypeModel } from '#backend/db/models/GoalTypeModel';
import { MatchTimelineModel } from '#backend/db/models/MatchTimelineModel';
import { ModelOps } from '#backend/db/models/ModelOps';
import { PlayerModel } from '#backend/db/models/PlayerModel';
import { SeasonModel } from '#backend/db/models/SeasonModel';
import { TableModel } from '#backend/db/models/TableModel';
import { matchesTable, teamConfigurationsTable } from '#backend/db/schema';
import { MatchSelectSchema } from '#backend/types/db/match';
import { getMissingReferenceIssues } from '#blib/matchTimelineIssues';
import {
  ConvertDrizzleErrors,
  DatabaseError,
  StrategyValidationError,
} from '#blib/modelErrors';
import { defaultSeasonConfig } from '#shared/defaults/season';
import { isGoalTypeEnabled } from '#shared/goalTypes';
import {
  getExactStartDate,
  START_DATE_PRECISION_LABEL,
  StartDatePrecisionEnum,
} from '#shared/matchLabels';
import { getMatchPlayerUuids } from '#shared/matchPlayers';
import { deriveMatchStatus } from '#shared/matchStatus';
import {
  getMatchTimelineContext,
  getMatchTimelinePauseDuration,
  getMatchTimelineReferences,
  getMatchTimelineScore,
  validateMatchTimeline,
} from '#shared/matchTimeline';
import { getStatsMatchSpan } from '#shared/stats/buckets';
import {
  Match,
  MatchCreate,
  MatchQueryMeta,
  type MatchStatus,
  MatchStatusEnum,
  MatchUpdate,
} from '#shared/types/api/match';
import type { MatchEvent, MatchSide } from '#shared/types/api/matchEvent';
import type { MatchFullCreate } from '#shared/types/api/matchFull';
import {
  MatchTimelineErrorTypeEnum,
  type MatchTimelineSave,
} from '#shared/types/api/matchTimeline';
import { SeasonConfig } from '#shared/types/api/season';

const MatchOps = ModelOps({
  table: matchesTable,
  tableName: 'matchesTable',
  publicSchema: Match,
  selectSchema: MatchSelectSchema,
  createSchema: MatchCreate,
  updateSchema: MatchUpdate,
  queryMetaSchema: MatchQueryMeta,
});

export class MatchModel extends MatchOps {
  @ConvertDrizzleErrors()
  protected static async getOrCreateTeamConfiguration(
    db: DB | TX,
    leagueUuid: string,
    side: MatchSide,
    players: string[],
  ) {
    const playerUuids = [...players].sort();

    const instance =
      (
        await db
          .insert(teamConfigurationsTable)
          .values({ leagueUuid, playerUuids })
          .onConflictDoNothing()
          .returning()
      ).at(0) ??
      (await db.query.teamConfigurationsTable.findFirst({
        where: {
          leagueUuid,
          playerUuids: {
            arrayContains: playerUuids,
            arrayContained: playerUuids,
          },
          $deletedAt: {
            isNull: true,
          },
        },
      }));

    if (!instance) {
      throw new DatabaseError(`Failed to process ${side} team configuration`, {
        [side === 'SIDE_1' ? 'playersSide1' : 'playersSide2']: {
          value: playerUuids,
          errorType: 'TEAM_CONFIGURATION_ERROR',
        },
      });
    }

    return instance;
  }

  protected static async getTeamConfigurationColumns(
    db: DB | TX,
    leagueUuid: string,
    playersSide1: string[],
    playersSide2: string[],
  ) {
    const side1Team = await this.getOrCreateTeamConfiguration(
      db,
      leagueUuid,
      'SIDE_1',
      playersSide1,
    );
    const side2Team = await this.getOrCreateTeamConfiguration(
      db,
      leagueUuid,
      'SIDE_2',
      playersSide2,
    );

    return {
      side1TeamConfigurationUuid: side1Team.uuid,
      side2TeamConfigurationUuid: side2Team.uuid,
    };
  }

  protected static override async prepareCreate(
    db: DB | TX,
    leagueUuid: string,
    data: MatchCreate,
  ) {
    return {
      next: data,
      row: {
        ...data,
        ...(await this.getTeamConfigurationColumns(
          db,
          leagueUuid,
          data.playersSide1,
          data.playersSide2,
        )),
      },
    };
  }

  protected static override async prepareUpdate(
    db: DB | TX,
    leagueUuid: string,
    previous: MatchSelectSchema,
    data: Record<string, unknown>,
  ) {
    const merged = {
      ...previous,
      ...data,
    } as MatchCreate;

    const next =
      data.status === undefined
        ? {
            ...merged,
            status: deriveMatchStatus(merged.status, {
              duration: merged.duration,
              events: await MatchTimelineModel.getEventsByMatchId(
                db,
                leagueUuid,
                previous.uuid,
              ),
            }),
          }
        : merged;

    return {
      next,
      row: {
        ...data,
        status: next.status,
        ...(await this.getTeamConfigurationColumns(
          db,
          leagueUuid,
          next.playersSide1,
          next.playersSide2,
        )),
      },
    };
  }

  @ConvertDrizzleErrors()
  public static async getBySyncId(
    db: DB | TX,
    leagueUuid: string,
    syncId: string,
  ) {
    const instance = await db.query.matchesTable.findFirst({
      where: {
        leagueUuid,
        syncId,
        $deletedAt: {
          isNull: true,
        },
      },
    });

    return instance ?? null;
  }

  @ConvertDrizzleErrors()
  public static async getBySyncIds(
    db: DB | TX,
    leagueUuid: string,
    syncIds: string[],
  ): Promise<Match[]> {
    if (syncIds.length === 0) return [];

    const instances = await db.query.matchesTable.findMany({
      where: {
        leagueUuid,
        syncId: {
          in: syncIds,
        },
        $deletedAt: {
          isNull: true,
        },
      },
    });

    return Match.array().parse(instances);
  }

  @ConvertDrizzleErrors()
  public static async createFull(
    db: DB | TX,
    leagueUuid: string,
    data: MatchFullCreate,
  ) {
    const instance = await db.transaction(async (tx) => {
      const { events, ...matchData } = data;

      if (events.length === 0) return this.create(tx, leagueUuid, matchData);

      const match = await this.create(tx, leagueUuid, {
        ...matchData,
        status: deriveMatchStatus(matchData.status, {
          duration: matchData.duration,
          events: [],
        }),
      });

      return this.syncTimeline(
        tx,
        leagueUuid,
        match,
        await MatchTimelineModel.saveForMatch(tx, leagueUuid, match, events),
        matchData.status,
      );
    });

    return instance;
  }

  @ConvertDrizzleErrors()
  public static async getTimeline(
    db: DB | TX,
    leagueUuid: string,
    matchUuid: string,
  ) {
    const match = await this.getByIdOrThrow(db, leagueUuid, matchUuid, {
      matchUuid: { errorType: MatchTimelineErrorTypeEnum.MATCH_NOT_FOUND },
    });

    const events = await MatchTimelineModel.getEventsByMatchId(
      db,
      leagueUuid,
      matchUuid,
    );

    const references = getMatchTimelineReferences(events);

    const [table] = await TableModel.getByIds(
      db,
      leagueUuid,
      match.tableUuid ? [match.tableUuid] : [],
    );
    const players = await PlayerModel.getByIds(db, leagueUuid, [
      ...getMatchPlayerUuids(match),
      ...references.playerUuids,
    ]);
    const balls = await BallModel.getByIds(db, leagueUuid, [
      ...(match.ballUuid ? [match.ballUuid] : []),
      ...references.ballUuids,
    ]);
    const season =
      match.startDate === null
        ? null
        : await SeasonModel.getByDate(db, leagueUuid, match.startDate);
    const seasonConfig = season && SeasonConfig.parse(season.config);
    const goalTypes = (await GoalTypeModel.getAll(db, leagueUuid)).filter(
      (goalType) =>
        references.goalTypeUuids.has(goalType.uuid) ||
        isGoalTypeEnabled(seasonConfig, goalType.uuid),
    );

    return {
      match,
      table: table ?? null,
      events,
      players,
      balls,
      goalTypes,
      rules: (seasonConfig ?? defaultSeasonConfig).rules,
      issues: [
        ...validateMatchTimeline(events, getMatchTimelineContext(match)),
        ...getMissingReferenceIssues(events, {
          players: new Set(players.map((player) => player.uuid)),
          balls: new Set(balls.map((ball) => ball.uuid)),
          goalTypes: new Set(goalTypes.map((goalType) => goalType.uuid)),
        }),
      ],
    };
  }

  @ConvertDrizzleErrors()
  public static async saveTimeline(
    db: DB,
    leagueUuid: string,
    data: MatchTimelineSave,
  ) {
    return db.transaction(async (tx) => {
      const match = await this.getByIdOrThrow(tx, leagueUuid, data.matchUuid, {
        matchUuid: { errorType: MatchTimelineErrorTypeEnum.MATCH_NOT_FOUND },
      });

      const events = await MatchTimelineModel.saveForMatch(
        tx,
        leagueUuid,
        match,
        data.events,
      );

      await this.syncTimeline(tx, leagueUuid, match, events);

      return this.getTimeline(tx, leagueUuid, match.uuid);
    });
  }

  @ConvertDrizzleErrors()
  public static async syncTimeline(
    db: DB | TX,
    leagueUuid: string,
    match: MatchSelectSchema,
    events: MatchEvent[],
    status?: MatchStatus,
  ) {
    const [side1Score, side2Score] = getMatchTimelineScore(events);

    return this.update(db, leagueUuid, {
      uuid: match.uuid,
      status,
      pauseDuration: getMatchTimelinePauseDuration(events),
      side1Score,
      side2Score,
    });
  }

  public static strategies = MatchOps.defineStrategies({
    preWrite: {
      statusMatchesTimeline: async ({ db, leagueUuid, op, next, previous }) => {
        const events =
          op === 'create'
            ? []
            : await MatchTimelineModel.getEventsByMatchId(
                db,
                leagueUuid,
                previous.uuid,
              );
        const derived = deriveMatchStatus(next.status, {
          duration: next.duration,
          events,
        });

        if (derived === next.status) return;

        if (next.status === MatchStatusEnum.SURRENDERED) {
          throw new StrategyValidationError(
            'Surrendered match requires a surrender event',
            {
              status: {
                value: next.status,
                errorType: 'SURRENDER_EVENT_MISSING',
              },
            },
          );
        }

        throw new StrategyValidationError(
          'Match status does not match its timeline',
          {
            status: {
              value: next.status,
              errorType: 'STATUS_DOES_NOT_MATCH_TIMELINE',
            },
          },
        );
      },

      spectatorsNotPlaying: ({ next }) => {
        const players = new Set(getMatchPlayerUuids(next));
        const playingSpectators = next.spectators.filter((uuid) =>
          players.has(uuid),
        );

        if (playingSpectators.length === 0) return;

        throw new StrategyValidationError('Some spectators are playing', {
          spectators: {
            value: playingSpectators,
            errorType: 'SPECTATORS_PLAYING',
          },
        });
      },

      spectatorsExist: async ({ db, leagueUuid, next }) => {
        if (next.spectators.length === 0) return;

        const users = await db.query.playersTable.findMany({
          where: {
            leagueUuid,
            uuid: {
              in: next.spectators,
            },
            $deletedAt: {
              isNull: true,
            },
          },
        });

        if (users.length !== next.spectators.length) {
          const existingUuids = new Set(users.map((u) => u.uuid));
          const nonExistingUuids = next.spectators.filter(
            (uuid) => !existingUuids.has(uuid),
          );

          throw new StrategyValidationError('Some spectators do not exist', {
            spectators: {
              value: nonExistingUuids,
              errorType: 'SPECTATORS_NOT_FOUND',
            },
          });
        }
      },

      playersExist: async ({ db, leagueUuid, next }) => {
        const allPlayers = getMatchPlayerUuids(next);

        if (allPlayers.length === 0) return;

        const players = await db.query.playersTable.findMany({
          where: {
            leagueUuid,
            uuid: {
              in: allPlayers,
            },
            $deletedAt: {
              isNull: true,
            },
          },
        });

        if (players.length !== allPlayers.length) {
          const existingUuids = new Set(players.map((p) => p.uuid));
          const nonExistingUuids = allPlayers.filter(
            (uuid) => !existingUuids.has(uuid),
          );

          throw new StrategyValidationError('Some players do not exist', {
            players: {
              value: nonExistingUuids,
              errorType: 'PLAYERS_NOT_FOUND',
            },
          });
        }
      },

      noTableOverlap: async ({ db, leagueUuid, next, previous }) => {
        const startDate = getExactStartDate(next);

        if (!next.tableUuid || startDate === null) return;

        const endDate = new Date(startDate.getTime() + getStatsMatchSpan(next));
        const overlappingMatch = await db.query.matchesTable.findFirst({
          where: {
            AND: [
              {
                leagueUuid,
                tableUuid: next.tableUuid,
                startDate: {
                  lt: endDate,
                },
                $deletedAt: {
                  isNull: true,
                },
              },
              ...(previous ? [{ NOT: { uuid: previous.uuid } }] : []),
              {
                RAW: (table) =>
                  sql`coalesce(${table.labels} ->> ${START_DATE_PRECISION_LABEL}, ${StartDatePrecisionEnum.EXACT}) = ${StartDatePrecisionEnum.EXACT} and ${table.startDate} + (coalesce(${table.duration}, 0) + ${table.pauseDuration}) * interval '1 millisecond' > ${startDate}`,
              },
            ],
          },
          columns: {
            uuid: true,
          },
        });

        if (overlappingMatch) {
          throw new StrategyValidationError(
            'Match overlaps with another match on the same table',
            {
              startDate: {
                value: next.startDate,
                errorType: 'TABLE_OVERLAP',
              },
              tableUuid: {
                value: next.tableUuid,
                errorType: 'TABLE_OVERLAP',
              },
            },
          );
        }
      },
    },

    preUpdate: {
      syncIdImmutable: ({ next, previous }) => {
        if (next.syncId === previous.syncId) return;

        throw new StrategyValidationError('Sync identifier cannot be changed', {
          syncId: { value: next.syncId, errorType: 'SYNC_ID_IMMUTABLE' },
        });
      },
    },

    postUpdate: {
      timelineConsistent: async ({ db, leagueUuid, updated }) => {
        const events = await MatchTimelineModel.getEventsByMatchId(
          db,
          leagueUuid,
          updated.uuid,
        );

        MatchTimelineModel.assertValidTimeline(updated, events);
      },
    },
  });
}
