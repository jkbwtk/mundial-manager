import { GoalTypeModel } from '#backend/db/models/GoalTypeModel';
import { router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcOps';
import { PermissionEnum } from '#shared/permissions';
import {
  GoalType,
  GoalTypeCreate,
  GoalTypeQueryMeta,
  GoalTypeUpdate,
} from '#shared/types/api/goalType';

export const goalTypesRouter = router({
  ...createCrudOps({
    publicSchema: GoalType,
    createSchema: GoalTypeCreate,
    updateSchema: GoalTypeUpdate,
    model: GoalTypeModel,
    queryMetaSchema: GoalTypeQueryMeta,
    permissions: {
      read: PermissionEnum.GOAL_TYPES_READ,
      create: PermissionEnum.GOAL_TYPES_CREATE,
      update: PermissionEnum.GOAL_TYPES_UPDATE,
      delete: PermissionEnum.GOAL_TYPES_DELETE,
    },
  }),
});
