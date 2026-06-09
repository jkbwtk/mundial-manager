import { PlayerModel } from '#backend/db/models/PlayerModel';
import { router } from '#blib/trpc';
import { createCrudOps } from '#blib/trpcOps';
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
  }),
});
