import type { DB, TX } from '#backend/db/database';
import { ModelOps } from '#backend/db/models/ModelOps';
import { goalTypesTable } from '#backend/db/schema';
import { createTextSearchSql } from '#backend/db/utils';
import { GoalTypeSelectSchema } from '#backend/types/db/goalType';
import {
  ConvertDrizzleErrors,
  StrategyValidationError,
} from '#blib/modelErrors';
import {
  GoalType,
  GoalTypeCreate,
  GoalTypeQueryMeta,
  GoalTypeUpdate,
} from '#shared/types/api/goalType';
import { defaultGoalTypes } from '#shared/types/api/goalTypeDefaults';

const GoalTypeOps = ModelOps({
  table: goalTypesTable,
  tableName: 'goalTypesTable',
  publicSchema: GoalType,
  selectSchema: GoalTypeSelectSchema,
  createSchema: GoalTypeCreate,
  updateSchema: GoalTypeUpdate,
  queryMetaSchema: GoalTypeQueryMeta,
  searchSql: createTextSearchSql({
    text: [goalTypesTable.name, goalTypesTable.key],
  }),
});

export class GoalTypeModel extends GoalTypeOps {
  @ConvertDrizzleErrors()
  public static async createDefaults(db: DB | TX, leagueUuid: string) {
    return db.transaction(async (tx) => {
      const existing = await this.getAll(tx, leagueUuid);
      const existingKeys = new Set(existing.map((goalType) => goalType.key));
      const created: GoalTypeSelectSchema[] = [];

      for (const goalType of defaultGoalTypes) {
        if (existingKeys.has(goalType.key)) continue;

        created.push(
          await this.create(tx, leagueUuid, { ...goalType, parentUuid: null }),
        );
      }

      return [...existing, ...created];
    });
  }

  public static strategies = GoalTypeOps.defineStrategies({
    preWrite: {
      parentIsTopLevel: async ({ db, leagueUuid, next, previous }) => {
        if (!next.parentUuid) return;

        const parent = await db.query.goalTypesTable.findFirst({
          where: {
            leagueUuid,
            uuid: next.parentUuid,
            $deletedAt: {
              isNull: true,
            },
          },
        });

        if (
          !parent ||
          parent.parentUuid !== null ||
          parent.uuid === previous?.uuid
        ) {
          throw new StrategyValidationError('Parent goal type is invalid', {
            parentUuid: {
              value: next.parentUuid,
              errorType: 'GOAL_TYPE_PARENT_INVALID',
            },
          });
        }

        if (previous === null) return;

        const child = await db.query.goalTypesTable.findFirst({
          where: {
            leagueUuid,
            parentUuid: previous.uuid,
            $deletedAt: {
              isNull: true,
            },
          },
        });

        if (child) {
          throw new StrategyValidationError(
            'Goal type with subtypes cannot have a parent',
            {
              parentUuid: {
                value: next.parentUuid,
                errorType: 'GOAL_TYPE_HAS_SUBTYPES',
              },
            },
          );
        }
      },
    },

    preDelete: {
      hasNoSubtypes: async ({ db, leagueUuid, previous }) => {
        const child = await db.query.goalTypesTable.findFirst({
          where: {
            leagueUuid,
            parentUuid: previous.uuid,
            $deletedAt: {
              isNull: true,
            },
          },
        });

        if (!child) return;

        throw new StrategyValidationError(
          'Goal type with subtypes cannot be deleted',
          {
            uuid: {
              value: previous.uuid,
              errorType: 'GOAL_TYPE_HAS_SUBTYPES',
            },
          },
        );
      },
    },
  });
}
