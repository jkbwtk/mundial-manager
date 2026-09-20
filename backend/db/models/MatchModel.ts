import { PublishResult } from '#backend/amqp/publishers';
import type { DB, TX } from '#backend/db/database';
import { matchOrderBy, matchOrderByDesc } from '#backend/db/matchOrder';
import { BallModel } from '#backend/db/models/BallModel';
import { MatchTimelineModel } from '#backend/db/models/MatchTimelineModel';
import { ModelOps } from '#backend/db/models/ModelOps';
import { PlayerModel } from '#backend/db/models/PlayerModel';
import { TableModel } from '#backend/db/models/TableModel';
import { matchesTable, teamConfigurationsTable } from '#backend/db/schema';
import { MatchSelectSchema } from '#backend/types/db/match';
import { getMissingReferenceIssues } from '#blib/matchTimelineIssues';
import {
  ConvertDrizzleErrors,
  DatabaseError,
  StrategyValidationError,
} from '#blib/modelErrors';
import { deriveMatchStatus } from '#shared/matchStatus';
import {
  getMatchTimelineContext,
  getMatchTimelinePauseDuration,
  getMatchTimelineReferences,
  getMatchTimelineScore,
  validateMatchTimeline,
} from '#shared/matchTimeline';
import {
  Match,
  MatchCreate,
  MatchQueryMeta,
  MatchUpdate,
} from '#shared/types/api/match';
import { MatchEvent, type MatchSide } from '#shared/types/api/matchEvent';
import type { MatchFull, MatchFullCreate } from '#shared/types/api/matchFull';
import {
  MatchTimelineErrorTypeEnum,
  type MatchTimelineSave,
} from '#shared/types/api/matchTimeline';

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
    const next = {
      ...data,
      status: deriveMatchStatus(data.status, {
        duration: data.duration,
        events: [],
      }),
    } satisfies MatchCreate;

    return {
      next,
      row: {
        ...next,
        ...(await this.getTeamConfigurationColumns(
          db,
          leagueUuid,
          next.playersSide1,
          next.playersSide2,
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

    const next = {
      ...merged,
      status: deriveMatchStatus(merged.status, {
        duration: merged.duration,
        events: await MatchTimelineModel.getEventsByMatchId(
          db,
          leagueUuid,
          previous.uuid,
        ),
      }),
    } satisfies MatchCreate;

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

  @PublishResult('MATCH_TABLE_UPDATES', ({ args }) => args[1])
  @ConvertDrizzleErrors()
  public static async create(
    db: DB | TX,
    leagueUuid: string,
    data: MatchCreate,
  ) {
    return super.create(db, leagueUuid, data);
  }

  @PublishResult('MATCH_TABLE_UPDATES', ({ args }) => args[1])
  @ConvertDrizzleErrors()
  public static async update(
    db: DB | TX,
    leagueUuid: string,
    data: MatchUpdate,
  ) {
    return super.update(db, leagueUuid, data);
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
  public static async getAllFull(
    db: DB | TX,
    leagueUuid: string,
    meta: MatchQueryMeta = {},
  ): Promise<MatchFull[]> {
    const instances = await db.query.matchesTable.findMany({
      where: {
        leagueUuid,
        $deletedAt: {
          isNull: true,
        },
      },

      with: {
        ball: true,
        table: true,

        timeline: {
          where: {
            leagueUuid,
            $deletedAt: {
              isNull: true,
            },
          },
        },
      },

      orderBy: (meta.sorting?.direction === 'desc'
        ? matchOrderByDesc
        : matchOrderBy)(meta.sorting?.field),
      limit: meta.pagination?.limit,
      offset: meta.pagination?.offset,
    });

    return instances.map(({ timeline, ...instance }) => ({
      ...instance,
      events: MatchEvent.array().parse(timeline?.events ?? []),
    }));
  }

  @PublishResult('MATCH_TABLE_UPDATES', ({ args }) => args[1])
  @ConvertDrizzleErrors()
  public static async createFull(
    db: DB | TX,
    leagueUuid: string,
    data: MatchFullCreate,
  ) {
    const instance = await db.transaction(async (tx) => {
      const { events, ...matchData } = data;

      const match = await this.create(tx, leagueUuid, matchData);

      if (events.length === 0) return match;

      const stored = await MatchTimelineModel.saveForMatch(
        tx,
        leagueUuid,
        match,
        events,
      );

      return this.syncTimeline(tx, leagueUuid, match, stored);
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
      ...match.playersSide1,
      ...match.playersSide2,
      ...references.playerUuids,
    ]);
    const balls = await BallModel.getByIds(db, leagueUuid, [
      ...(match.ballUuid ? [match.ballUuid] : []),
      ...references.ballUuids,
    ]);

    return {
      match,
      table: table ?? null,
      events,
      players,
      balls,
      issues: [
        ...validateMatchTimeline(events, getMatchTimelineContext(match)),
        ...getMissingReferenceIssues(
          events,
          new Set(players.map((player) => player.uuid)),
          new Set(balls.map((ball) => ball.uuid)),
        ),
      ],
    };
  }

  @PublishResult(
    'MATCH_TABLE_UPDATES',
    ({ args }) => args[1],
    ({ resp }) => resp.match,
  )
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
  ) {
    const [side1Score, side2Score] = getMatchTimelineScore(events);

    return this.update(db, leagueUuid, {
      uuid: match.uuid,
      pauseDuration: getMatchTimelinePauseDuration(events),
      side1Score,
      side2Score,
    });
  }

  @PublishResult('MATCH_TABLE_UPDATES', ({ args }) => args[1])
  @ConvertDrizzleErrors()
  public static async delete(db: DB | TX, leagueUuid: string, uuid: string) {
    return super.delete(db, leagueUuid, uuid);
  }

  public static strategies = MatchOps.defineStrategies({
    preWrite: {
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
        const allPlayers = [...next.playersSide1, ...next.playersSide2];

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

        const derived = deriveMatchStatus(updated.status, {
          duration: updated.duration,
          events,
        });

        if (derived !== updated.status) {
          throw new StrategyValidationError(
            'Match status does not match its timeline',
            {
              status: {
                value: updated.status,
                errorType: 'STATUS_DOES_NOT_MATCH_TIMELINE',
              },
            },
          );
        }
      },
    },
  });
}
