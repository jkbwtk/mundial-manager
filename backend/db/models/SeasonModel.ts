import type { DB, TX } from '#backend/db/database';
import { GoalTypeModel } from '#backend/db/models/GoalTypeModel';
import { LeagueModel } from '#backend/db/models/LeagueModel';
import { ModelOps } from '#backend/db/models/ModelOps';
import { seasonsTable } from '#backend/db/schema';
import { SeasonSelectSchema } from '#backend/types/db/season';
import {
  ConvertDrizzleErrors,
  StrategyValidationError,
} from '#blib/modelErrors';
import { getSeasonGoalTypes } from '#shared/goalTypes';
import { toZonedDayjs } from '#shared/timeUtils';
import {
  Season,
  SeasonCreate,
  SeasonQueryMeta,
  SeasonUpdate,
} from '#shared/types/api/season';

type SeasonDates = Pick<SeasonCreate, 'startDate' | 'endDate'>;

function getDayBounds<T extends SeasonDates>(
  season: T,
  timeZone: string | undefined,
): T {
  return {
    ...season,
    startDate: toZonedDayjs(season.startDate, timeZone).startOf('day').toDate(),
    endDate: toZonedDayjs(season.endDate, timeZone).endOf('day').toDate(),
  };
}

const SeasonOps = ModelOps({
  table: seasonsTable,
  tableName: 'seasonsTable',
  publicSchema: Season,
  selectSchema: SeasonSelectSchema,
  createSchema: SeasonCreate,
  updateSchema: SeasonUpdate,
  queryMetaSchema: SeasonQueryMeta,
});

export class SeasonModel extends SeasonOps {
  protected static override async prepareCreate(
    db: DB | TX,
    leagueUuid: string,
    data: SeasonCreate,
  ) {
    const league = await LeagueModel.getById(db, leagueUuid);
    const goalTypes = await GoalTypeModel.getAll(db, leagueUuid);

    const config = data.config ?? league?.instance.seasonConfig;
    const next = getDayBounds(
      {
        ...data,
        config: config && {
          ...config,
          goalTypes: getSeasonGoalTypes(goalTypes, config.goalTypes),
        },
      },
      league?.instance.timezone,
    );

    return { next, row: next };
  }

  protected static override async prepareUpdate(
    db: DB | TX,
    leagueUuid: string,
    previous: SeasonSelectSchema,
    data: Record<string, unknown>,
  ) {
    const league = await LeagueModel.getById(db, leagueUuid);
    const next = getDayBounds(
      { ...previous, ...data } as SeasonCreate,
      league?.instance.timezone,
    );

    return {
      next,
      row: { ...data, startDate: next.startDate, endDate: next.endDate },
    };
  }

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

  public static strategies = SeasonOps.defineStrategies({
    preWrite: {
      correctSeasonDates: ({ next }) => {
        if (next.startDate >= next.endDate) {
          throw new StrategyValidationError('Invalid season dates', {
            startDate: {
              value: next.startDate,
              errorType: 'INVALID_DATE_RANGE',
            },
            endDate: {
              value: next.endDate,
              errorType: 'INVALID_DATE_RANGE',
            },
          });
        }
      },

      noSeasonOverlap: async ({ db, leagueUuid, next, previous }) => {
        const overlappingSeason = await db.query.seasonsTable.findFirst({
          where: {
            AND: [
              {
                leagueUuid,
                $deletedAt: { isNull: true },
              },
              ...(previous ? [{ NOT: { uuid: previous.uuid } }] : []),
              {
                OR: [
                  {
                    startDate: {
                      lte: next.startDate,
                    },
                    endDate: {
                      gt: next.startDate,
                    },
                  },
                  {
                    startDate: {
                      lt: next.endDate,
                    },
                    endDate: {
                      gte: next.endDate,
                    },
                  },
                  {
                    startDate: {
                      gte: next.startDate,
                    },
                    endDate: {
                      lte: next.endDate,
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
                value: next.startDate,
                errorType: 'DATE_OVERLAP',
              },
              endDate: {
                value: next.endDate,
                errorType: 'DATE_OVERLAP',
              },
            },
          );
        }
      },
    },
  });
}
