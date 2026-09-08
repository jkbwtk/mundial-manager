import { and, eq, isNull } from 'drizzle-orm';
import z from 'zod';
import { runWithAMQPDisabled } from '#backend/amqp/amqp';
import { PublishResult } from '#backend/amqp/publishers';
import type { DB, TX } from '#backend/db/database';
import { MatchEventModel } from '#backend/db/models/MatchEventModel';
import {
  ModelOps,
  type ValidationStrategies,
} from '#backend/db/models/ModelOps';
import { matchesTable, teamConfigurationsTable } from '#backend/db/schema';
import { MatchSelectSchema } from '#backend/types/db/match';
import {
  ConvertDrizzleErrors,
  DatabaseError,
  StrategyValidationError,
} from '#blib/modelErrors';
import {
  Match,
  MatchCreate,
  MatchQueryMeta,
  type MatchStrategy,
  MatchUpdate,
} from '#shared/types/api/match';
import type {
  MatchFull,
  MatchFullCreate,
  MatchFullStrategy,
} from '#shared/types/api/matchFull';
import { getValueHash } from '#shared/utils';

export class MatchModel extends ModelOps({
  table: matchesTable,
  tableName: 'matchesTable',
  publicSchema: Match,
  selectSchema: MatchSelectSchema,
  createSchema: MatchCreate.extend({
    hash: z.string(),
  }),
  updateSchema: MatchUpdate.extend({
    hash: z.string(),
  }),
  queryMetaSchema: MatchQueryMeta,
}) {
  @ConvertDrizzleErrors()
  protected static async getOrCreateTeamConfiguration(
    db: DB | TX,
    leagueUuid: string,
    playersSide1: string[],
    playersSide2: string[],
  ) {
    const sortedPlayersSide1 = [...playersSide1].sort();
    const sortedPlayersSide2 = [...playersSide2].sort();

    const side1Team =
      (
        await db
          .insert(teamConfigurationsTable)
          .values({
            leagueUuid,
            playerUuids: sortedPlayersSide1,
          })
          .onConflictDoNothing()
          .returning()
      ).at(0) ??
      (await db.query.teamConfigurationsTable.findFirst({
        where: {
          leagueUuid,
          playerUuids: {
            arrayContains: sortedPlayersSide1,
            arrayContained: sortedPlayersSide1,
          },
          $deletedAt: {
            isNull: true,
          },
        },
      }));

    if (!side1Team) {
      throw new DatabaseError('Failed to process SIDE_1 team configuration', {
        playersSide1: {
          value: sortedPlayersSide1,
          errorType: 'TEAM_CONFIGURATION_ERROR',
        },
      });
    }

    const side2Team =
      (
        await db
          .insert(teamConfigurationsTable)
          .values({
            leagueUuid,
            playerUuids: sortedPlayersSide2,
          })
          .onConflictDoNothing()
          .returning()
      ).at(0) ??
      (await db.query.teamConfigurationsTable.findFirst({
        where: {
          leagueUuid,
          playerUuids: {
            arrayContains: sortedPlayersSide2,
            arrayContained: sortedPlayersSide2,
          },
          $deletedAt: {
            isNull: true,
          },
        },
      }));

    if (!side2Team) {
      throw new DatabaseError('Failed to process SIDE_2 team configuration', {
        playersSide2: {
          value: sortedPlayersSide2,
          errorType: 'TEAM_CONFIGURATION_ERROR',
        },
      });
    }

    return {
      side1Team,
      side2Team,
    };
  }

  @PublishResult('MATCH_TABLE_UPDATES', ({ args }) => args[1])
  @ConvertDrizzleErrors()
  public static async create(
    db: DB | TX,
    leagueUuid: string,
    data: MatchCreate,
  ) {
    const hash = getValueHash({
      leagueUuid,
      startDate: data.startDate,
      duration: data.duration,
      pauseDuration: data.pauseDuration,
      status: data.status,
      side1Score: data.side1Score,
      side2Score: data.side2Score,
      playersSide1: data.playersSide1,
      playersSide2: data.playersSide2,
    });

    for (const strategy of Object.values(this.validationStrategies)) {
      await strategy(db, leagueUuid, data);
    }

    const instance = await db.transaction(async (tx) => {
      const { side1Team, side2Team } = await this.getOrCreateTeamConfiguration(
        tx,
        leagueUuid,
        data.playersSide1,
        data.playersSide2,
      );

      const [created] = await tx
        .insert(matchesTable)
        .values({
          ...data,
          leagueUuid,
          side1TeamConfigurationUuid: side1Team.uuid,
          side2TeamConfigurationUuid: side2Team.uuid,
          hash,
        })
        .returning();

      if (!created) {
        throw new DatabaseError('Failed to create instance', {});
      }

      return created;
    });

    return instance;
  }

  @PublishResult('MATCH_TABLE_UPDATES', ({ args }) => args[1])
  @ConvertDrizzleErrors()
  public static async update(
    db: DB | TX,
    leagueUuid: string,
    data: MatchUpdate,
  ) {
    const hash = getValueHash({
      leagueUuid,
      startDate: data.startDate,
      duration: data.duration,
      pauseDuration: data.pauseDuration,
      status: data.status,
    });
    const { uuid, ...updateData } = data;

    const instance = await db.transaction(async (tx) => {
      const existingInstance = await this.getById(tx, leagueUuid, uuid);

      if (!existingInstance) {
        throw new DatabaseError('Instance not found for update', {
          uuid: { value: uuid, errorType: 'Instance not found' },
        });
      }

      const mergedData = {
        ...existingInstance,
        ...updateData,
        hash,
      } as MatchStrategy;

      for (const strategy of Object.values(this.validationStrategies)) {
        await strategy(tx, leagueUuid, mergedData);
      }

      const { side1Team, side2Team } = await this.getOrCreateTeamConfiguration(
        tx,
        leagueUuid,
        mergedData.playersSide1,
        mergedData.playersSide2,
      );

      const [updated] = await tx
        .update(matchesTable)
        .set({
          ...mergedData,
          side1TeamConfigurationUuid: side1Team.uuid,
          side2TeamConfigurationUuid: side2Team.uuid,
        })
        .where(
          and(
            eq(matchesTable.leagueUuid, leagueUuid),
            eq(matchesTable.uuid, uuid as string),
            isNull(matchesTable.$deletedAt),
          ),
        )
        .returning();

      if (!updated) {
        throw new DatabaseError('Failed to update instance', {
          uuid: { value: uuid, errorType: 'Instance not found' },
        });
      }

      return updated;
    });

    return instance;
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

        events: {
          where: {
            leagueUuid,
            $deletedAt: {
              isNull: true,
            },
          },
          orderBy: {
            time: 'asc',
          },
        },
      },

      orderBy: meta.sorting
        ? {
            [meta.sorting?.field ?? '$createdAt']:
              meta.sorting?.direction ?? 'asc',
          }
        : {
            startDate: 'asc',
            $createdAt: 'asc',
          },
      limit: meta.pagination?.limit,
      offset: meta.pagination?.offset,
    });

    const mappedInstances = await Promise.all(
      instances.map(async (instance) => {
        return {
          ...instance,
          events: await Promise.all(
            instance.events.map((event) =>
              MatchEventModel.mapToPublic(db, event),
            ),
          ),
        };
      }),
    );

    return mappedInstances;
  }

  @PublishResult('MATCH_TABLE_UPDATES', ({ args }) => args[1])
  @ConvertDrizzleErrors()
  public static async createFull(
    db: DB,
    leagueUuid: string,
    data: MatchFullCreate,
  ) {
    const instance = await db.transaction(async (tx) => {
      for (const strategy of Object.values(
        this.fullCreateValidationStrategies,
      )) {
        await strategy(db, leagueUuid, data);
      }

      const { events, ...matchData } = data;

      const match = await runWithAMQPDisabled(() =>
        this.create(tx, leagueUuid, matchData),
      );

      await Promise.all(
        events.map((event) =>
          MatchEventModel.create(tx, leagueUuid, {
            ...event,
            matchUuid: match.uuid,
          }),
        ),
      );

      return match;
    });

    return instance;
  }

  @PublishResult('MATCH_TABLE_UPDATES', ({ args }) => args[1])
  @ConvertDrizzleErrors()
  public static async delete(db: DB, leagueUuid: string, uuid: string) {
    return super.delete(db, leagueUuid, uuid);
  }

  public static validationStrategies: ValidationStrategies<
    typeof MatchStrategy
  > = {
    spectatorsExist: async (db, leagueUuid, data) => {
      if (data.spectators.length === 0) return;

      const users = await db.query.playersTable.findMany({
        where: {
          leagueUuid,
          uuid: {
            in: data.spectators,
          },
          $deletedAt: {
            isNull: true,
          },
        },
      });

      if (users.length !== data.spectators.length) {
        const existingUuids = new Set(users.map((u) => u.uuid));
        const nonExistingUuids = data.spectators.filter(
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

    playersExist: async (db, leagueUuid, data) => {
      const allPlayers = [...data.playersSide1, ...data.playersSide2];

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
  };

  public static fullCreateValidationStrategies: ValidationStrategies<
    typeof MatchFullStrategy
  > = {
    startsWithStartEvent: (_db, _leagueUuid, data) => {
      if (data.events.length === 0) return;

      const sorted = data.events.toSorted(
        (a, b) => a.time.getTime() - b.time.getTime(),
      );

      if (sorted.at(0)?.type !== 'MATCH_START') {
        throw new StrategyValidationError(
          '"MATCH_START" event missing or at wrong chronological position',
          {
            events: {
              value: sorted.at(0)?.type,
              errorType: 'MATCH_START_EVENT_MISSING_OR_INVALID',
            },
          },
        );
      }
    },
  };
}
