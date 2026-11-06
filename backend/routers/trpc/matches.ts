import { MatchModel } from '#backend/db/models/MatchModel';
import { router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcOps';
import { PermissionEnum } from '#shared/permissions';
import {
  Match,
  MatchCreate,
  MatchQueryMeta,
  MatchUpdate,
} from '#shared/types/api/match';

export const matchesRouter = router({
  ...createCrudOps({
    publicSchema: Match,
    createSchema: MatchCreate,
    updateSchema: MatchUpdate,
    model: MatchModel,
    queryMetaSchema: MatchQueryMeta,
    permissions: {
      read: PermissionEnum.MATCHES_READ,
      create: PermissionEnum.MATCHES_CREATE,
      update: PermissionEnum.MATCHES_UPDATE,
      delete: PermissionEnum.MATCHES_DELETE,
    },
  }),
});
