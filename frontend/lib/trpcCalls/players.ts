import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import {
  Player,
  type PlayerCreate,
  type PlayerUpdate,
} from '#shared/types/api/player';
import { PaginatedResponse } from '#shared/zod';

export const queryPlayers = query(async () => {
  const players = await trpcClient.players.getAll.query();

  return PaginatedResponse(Player).parse(players);
}, 'queryPlayers');

export const queryPlayerById = query(async (uuid: string) => {
  const player = await trpcClient.players.getById.query({ uuid });

  return Player.parse(player);
}, 'queryPlayerById');

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
