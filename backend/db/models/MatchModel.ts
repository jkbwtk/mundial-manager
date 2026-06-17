import { and, eq, isNull } from 'drizzle-orm';
import z from 'zod';
import type { DB, TX } from '#backend/db/database';
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
  MatchCreate,
  MatchQueryMeta,
  type MatchStrategy,
  MatchUpdate,
} from '#shared/types/api/match';
import { getValueHash } from '#shared/utils';

export class MatchModel extends ModelOps({
  table: matchesTable,
  tableName: 'matchesTable',
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

  @ConvertDrizzleErrors()
  public static async create(db: DB, leagueUuid: string, data: MatchCreate) {
    const hash = getValueHash({
      leagueUuid,
      startDate: data.startDate,
      duration: data.duration,
      pauseDuration: data.pauseDuration,
      status: data.status,
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

  @ConvertDrizzleErrors()
  public static async update(db: DB, leagueUuid: string, data: MatchUpdate) {
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
}
