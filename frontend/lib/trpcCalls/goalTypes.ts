import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import {
  GoalType,
  type GoalTypeCreate,
  type GoalTypeQueryMeta,
  type GoalTypeUpdate,
} from '#shared/types/api/goalType';
import { PaginatedResponse } from '#shared/zod';

export const queryGoalTypes = query(async (meta: GoalTypeQueryMeta = {}) => {
  const goalTypes = await trpcClient.goalTypes.getAll.query(meta);

  return PaginatedResponse(GoalType).parse(goalTypes);
}, 'queryGoalTypes');

export const queryGoalTypeById = query(async (uuid: string) => {
  const goalType = await trpcClient.goalTypes.getById.query({ uuid });

  return GoalType.parse(goalType);
}, 'queryGoalTypeById');

export const actionCreateGoalType = action(async (goalType: GoalTypeCreate) => {
  const newGoalType = await trpcClient.goalTypes.create.mutate(goalType);

  return json(GoalType.parse(newGoalType), {
    revalidate: ['queryGoalTypes', 'queryMatchTimeline'],
  });
}, 'actionCreateGoalType');

export const actionUpdateGoalType = action(async (goalType: GoalTypeUpdate) => {
  const updatedGoalType = await trpcClient.goalTypes.update.mutate(goalType);

  return json(GoalType.parse(updatedGoalType), {
    revalidate: ['queryGoalTypes', 'queryGoalTypeById', 'queryMatchTimeline'],
  });
}, 'actionUpdateGoalType');

export const actionDeleteGoalType = action(async (uuid: string) => {
  const deletedGoalType = await trpcClient.goalTypes.delete.mutate({ uuid });

  return json(GoalType.parse(deletedGoalType), {
    revalidate: ['queryGoalTypes', 'queryGoalTypeById', 'queryMatchTimeline'],
  });
}, 'actionDeleteGoalType');
