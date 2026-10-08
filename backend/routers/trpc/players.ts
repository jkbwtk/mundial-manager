import { PlayerModel } from '#backend/db/models/PlayerModel';
import { router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcOps';
import { PermissionEnum } from '#shared/permissions';
import {
  Player,
  PlayerCreate,
  PlayerQueryMeta,
  PlayerUpdate,
} from '#shared/types/api/player';

export const playersRouter = router({
  ...createCrudOps({
    publicSchema: Player,
    createSchema: PlayerCreate,
    updateSchema: PlayerUpdate,
    model: PlayerModel,
    queryMetaSchema: PlayerQueryMeta,
    permissions: {
      read: PermissionEnum.PLAYERS_READ,
      create: PermissionEnum.PLAYERS_CREATE,
      update: PermissionEnum.PLAYERS_UPDATE,
      delete: PermissionEnum.PLAYERS_DELETE,
    },
  }),
});
