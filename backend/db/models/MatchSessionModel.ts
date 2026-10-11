import dayjs from 'dayjs';
import { PublishResult } from '#backend/amqp/publishers';
import type { DB, TX } from '#backend/db/database';
import { matchOrderBy } from '#backend/db/matchOrder';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import {
  getMatchInvalidation,
  MatchModel,
} from '#backend/db/models/MatchModel';
import { PlayerModel } from '#backend/db/models/PlayerModel';
import { TableModel } from '#backend/db/models/TableModel';
import type { MatchSelectSchema } from '#backend/types/db/match';
import { ConvertDrizzleErrors, NotFoundError } from '#blib/modelErrors';
import { getExactStartDate } from '#shared/matchLabels';
import { getMatchPlayerUuids } from '#shared/matchPlayers';
import { ModelErrorTypeEnum } from '#shared/modelErrors';
import { getStatsSessionKeys } from '#shared/stats/buckets';
import type {
  MatchSession,
  MatchSessionSpectatorsSave,
} from '#shared/types/api/matchSession';
import { SeasonConfig } from '#shared/types/api/season';

// biome-ignore lint/complexity/noStaticOnlyClass: yeah
export class MatchSessionModel {
  @ConvertDrizzleErrors()
  protected static async getSessionMatches(
    db: DB | TX,
    leagueUuid: string,
    match: MatchSelectSchema,
  ) {
    const startDate = getExactStartDate(match);

    if (startDate === null) return { key: null, matches: [match] };

    const from = dayjs(startDate).subtract(1, 'day').toDate();
    const to = dayjs(startDate).add(1, 'day').toDate();

    const [sessionMatches, league, seasons] = await Promise.all([
      db.query.matchesTable.findMany({
        where: {
          leagueUuid,
          startDate: {
            gte: from,
            lte: to,
          },
          $deletedAt: {
            isNull: true,
          },
        },
        orderBy: matchOrderBy(),
      }),
      LeagueModel.getById(db, leagueUuid),
      db.query.seasonsTable.findMany({
        where: {
          leagueUuid,
          startDate: {
            lte: to,
          },
          endDate: {
            gte: from,
          },
          $deletedAt: {
            isNull: true,
          },
        },
        columns: {
          uuid: true,
          startDate: true,
          endDate: true,
          config: true,
        },
      }),
    ]);

    const keys = getStatsSessionKeys(
      sessionMatches,
      league?.instance.timezone ?? 'UTC',
      seasons.map((season) => ({
        ...season,
        config: SeasonConfig.parse(season.config),
      })),
    );
    const key = keys.get(match.uuid) ?? null;

    return {
      key,
      matches:
        key === null
          ? [match]
          : sessionMatches.filter(
              (instance) => keys.get(instance.uuid) === key,
            ),
    };
  }

  @ConvertDrizzleErrors()
  public static async getByMatchId(
    db: DB | TX,
    leagueUuid: string,
    matchUuid: string,
  ): Promise<MatchSession> {
    const match = await MatchModel.getByIdOrThrow(db, leagueUuid, matchUuid);

    const [tables, { key, matches }] = await Promise.all([
      TableModel.getByIds(
        db,
        leagueUuid,
        match.tableUuid ? [match.tableUuid] : [],
      ),
      this.getSessionMatches(db, leagueUuid, match),
    ]);

    const players = await PlayerModel.getByIds(
      db,
      leagueUuid,
      matches.flatMap((instance) => [
        ...getMatchPlayerUuids(instance),
        ...instance.spectators,
      ]),
    );

    return { key, table: tables.at(0) ?? null, matches, players };
  }

  @PublishResult(
    'STATS_INVALIDATION',
    ({ args }) => args[1],
    ({ resp }) => getMatchInvalidation({ resp: resp.matches[0]! }),
  )
  @ConvertDrizzleErrors()
  public static async saveSpectators(
    db: DB | TX,
    leagueUuid: string,
    data: MatchSessionSpectatorsSave,
  ) {
    return db.transaction(async (tx) => {
      const matches = await MatchModel.getByIds(
        tx,
        leagueUuid,
        data.matches.map(({ uuid }) => uuid),
      );

      const existingUuids = new Set(matches.map((match) => match.uuid));
      const nonExistingUuids = data.matches
        .map(({ uuid }) => uuid)
        .filter((uuid) => !existingUuids.has(uuid));

      if (nonExistingUuids.length > 0) {
        throw new NotFoundError('Some matches do not exist', {
          matches: {
            value: nonExistingUuids,
            errorType: ModelErrorTypeEnum.NOT_FOUND,
          },
        });
      }

      for (const { uuid, spectators } of data.matches) {
        await MatchModel.update(tx, leagueUuid, { uuid, spectators });
      }

      return this.getByMatchId(tx, leagueUuid, data.matches[0]!.uuid);
    });
  }
}
