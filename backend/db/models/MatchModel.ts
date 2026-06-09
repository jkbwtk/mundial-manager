import { and, eq } from 'drizzle-orm';
import z from 'zod';
import type { DB, TX } from '#backend/db/database';
import { ModelOps } from '#backend/db/models/ModelOps';
import { matchesTable, matchSpectatorsTable } from '#backend/db/schema';
import { MatchSelectSchema } from '#backend/types/db/match';
import { ConvertDrizzleErrors } from '#blib/modelErrors';
import {
  MatchCreate,
  MatchQueryMeta,
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
  public static async getAll(
    db: DB,
    leagueUuid: string,
    meta: MatchQueryMeta = {},
  ) {
    const instances = await db.query.matchesTable.findMany({
      where: {
        leagueUuid,
        $deletedAt: {
          isNull: true,
        },
      },
      orderBy: {
        [meta.sorting?.field ?? 'startDate']: meta.sorting?.direction ?? 'asc',
      },
      extras: {
        spectators: (matches, { sql }) =>
          sql<string[]>`coalesce(
            (
              select array_agg(
                ${matchSpectatorsTable.playerUuid}
                order by ${matchSpectatorsTable.$createdAt} asc
              )
              from ${matchSpectatorsTable}
              where ${matchSpectatorsTable.matchUuid} = ${matches.uuid}
                and ${matchSpectatorsTable.$deletedAt} is null
            ),
            ARRAY[]::uuid[]
          )`,
      },
      limit: meta.pagination?.limit,
      offset: meta.pagination?.offset,
    });

    return instances;
  }

  @ConvertDrizzleErrors()
  public static async getById(db: DB | TX, leagueUuid: string, uuid: string) {
    const instance = await db.query.matchesTable.findFirst({
      where: {
        uuid,
        leagueUuid,

        $deleted: {
          isNull: true,
        },
      },
      extras: {
        spectators: (matches, { sql }) =>
          sql<string[]>`coalesce(
            (
              select array_agg(
                ${matchSpectatorsTable.playerUuid}
                order by ${matchSpectatorsTable.$createdAt} asc
              )
              from ${matchSpectatorsTable}
              where ${matchSpectatorsTable.matchUuid} = ${matches.uuid}
                and ${matchSpectatorsTable.$deletedAt} is null
            ),
            ARRAY[]::uuid[]
          )`,
      },
    });

    return instance ?? null;
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

    const instance = await db.transaction(async (tx) => {
      const created = await super.create(tx, leagueUuid, { ...data, hash });

      await tx.insert(matchSpectatorsTable).values(
        data.spectators.map((spectator) => ({
          leagueUuid,
          matchUuid: created.uuid,
          playerUuid: spectator,
        })),
      );

      return {
        ...created,
        spectators: data.spectators,
      };
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

    const instance = await db.transaction(async (tx) => {
      const updated = await super.update(db, leagueUuid, { ...data, hash });

      if (data.spectators) {
        await tx
          .delete(matchSpectatorsTable)
          .where(
            and(
              eq(matchSpectatorsTable.matchUuid, data.uuid),
              eq(matchSpectatorsTable.leagueUuid, leagueUuid),
            ),
          );

        await tx
          .insert(matchSpectatorsTable)
          .values(
            data.spectators.map((spectator) => ({
              leagueUuid,
              matchUuid: data.uuid,
              playerUuid: spectator,
            })),
          )
          .returning();
      }

      const spectators = data.spectators
        ? data.spectators
        : (
            await tx.query.matchSpectatorsTable.findMany({
              columns: { playerUuid: true },
              where: {
                matchUuid: data.uuid,
                leagueUuid,
                $deletedAt: {
                  isNull: true,
                },
              },
            })
          ).map((r) => r.playerUuid);

      return {
        ...updated,
        spectators: spectators,
      };
    });

    return instance;
  }
}
