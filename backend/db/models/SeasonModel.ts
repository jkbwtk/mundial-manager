import type { DB, TX } from '#backend/db/database';
import {
  ModelOps,
  type ValidationStrategies,
} from '#backend/db/models/ModelOps';
import { seasonsTable } from '#backend/db/schema';
import { SeasonSelectSchema } from '#backend/types/db/season';
import {
  ConvertDrizzleErrors,
  StrategyValidationError,
} from '#blib/modelErrors';
import {
  SeasonCreate,
  SeasonQueryMeta,
  SeasonStrategy,
  SeasonUpdate,
} from '#shared/types/api/season';

export class SeasonModel extends ModelOps({
  table: seasonsTable,
  tableName: 'seasonsTable',
  selectSchema: SeasonSelectSchema,
  createSchema: SeasonCreate,
  updateSchema: SeasonUpdate,
  queryMetaSchema: SeasonQueryMeta,
  strategySchema: SeasonStrategy,
}) {
  @ConvertDrizzleErrors()
  public static async getByDate(db: DB | TX, leagueUuid: string, date: Date) {
    const instance = await db.query.seasonsTable.findFirst({
      where: {
        leagueUuid,
        startDate: {
          lte: date,
        },
        endDate: {
          gt: date,
        },
        $deletedAt: {
          isNull: true,
        },
      },
    });

    return instance ?? null;
  }

  public static validationStrategies: ValidationStrategies<
    typeof SeasonStrategy
  > = {
    correctSeasonDates: (
      _db: DB | TX,
      _leagueUuid: string,
      data: SeasonStrategy,
    ) => {
      if (data.startDate >= data.endDate) {
        throw new StrategyValidationError('Invalid season dates', {
          startDate: {
            value: data.startDate,
            errorType: 'INVALID_DATE_RANGE',
          },
          endDate: {
            value: data.endDate,
            errorType: 'INVALID_DATE_RANGE',
          },
        });
      }
    },
    noSeasonOverlap: async (
      db: DB | TX,
      leagueUuid: string,
      data: SeasonStrategy,
    ) => {
      const overlappingSeason = await db.query.seasonsTable.findFirst({
        where: {
          AND: [
            {
              leagueUuid,
              $deletedAt: { isNull: true },
            },
            {
              NOT: {
                uuid: data.uuid,
              },
            },
            {
              OR: [
                {
                  startDate: {
                    lte: data.startDate,
                  },
                  endDate: {
                    gt: data.startDate,
                  },
                },
                {
                  startDate: {
                    lt: data.endDate,
                  },
                  endDate: {
                    gte: data.endDate,
                  },
                },
                {
                  startDate: {
                    gte: data.startDate,
                  },
                  endDate: {
                    lte: data.endDate,
                  },
                },
              ],
            },
          ],
        },
      });

      if (overlappingSeason) {
        throw new StrategyValidationError(
          'Season dates overlap with an existing season',
          {
            startDate: {
              value: data.startDate,
              errorType: 'DATE_OVERLAP',
            },
            endDate: {
              value: data.endDate,
              errorType: 'DATE_OVERLAP',
            },
          },
        );
      }
    },
  };
}
