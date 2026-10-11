import { action, json, query } from '@solidjs/router';
import { createBatchLoader, createQueryByIds } from '#flib/batchedQuery';
import { trpcClient } from '#flib/trpcClient';
import {
  Player,
  type PlayerCreate,
  type PlayerQueryMeta,
  type PlayerUpdate,
} from '#shared/types/api/player';
import { PaginatedResponse } from '#shared/zod';

export const queryPlayers = query(async (meta: PlayerQueryMeta = {}) => {
  const players = await trpcClient.players.getAll.query(meta);

  return PaginatedResponse(Player).parse(players);
}, 'queryPlayers');

const loadPlayer = createBatchLoader(async (uuids) =>
  Player.array().parse(await trpcClient.players.getByIds.query({ uuids })),
);

export const queryPlayerById = query(loadPlayer, 'queryPlayerById');

export const queryPlayersByIds = createQueryByIds(queryPlayerById);

export const actionCreatePlayer = action(async (player: PlayerCreate) => {
  const newPlayer = await trpcClient.players.create.mutate(player);

  return json(Player.parse(newPlayer), {
    revalidate: ['queryPlayers'],
  });
}, 'actionCreatePlayer');

export const actionUpdatePlayer = action(async (player: PlayerUpdate) => {
  const updatedPlayer = await trpcClient.players.update.mutate(player);

  return json(Player.parse(updatedPlayer), {
    revalidate: ['queryPlayers', 'queryPlayerById'],
  });
}, 'actionUpdatePlayer');

export const actionDeletePlayer = action(async (uuid: string) => {
  const deletedPlayer = await trpcClient.players.delete.mutate({ uuid });

  return json(Player.parse(deletedPlayer), {
    revalidate: ['queryPlayers', 'queryPlayerById'],
  });
}, 'actionDeletePlayer');
