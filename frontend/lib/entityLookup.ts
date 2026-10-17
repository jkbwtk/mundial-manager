import { type Accessor, createMemo } from 'solid-js';
import {
  createResilientAsync,
  type ResilientQuery,
} from '#flib/resilientAsync';
import {
  queryBalls,
  queryGoalTypes,
  queryPlayers,
  querySeasons,
  queryTables,
} from '#flib/trpcCalls';
import type { Ball } from '#shared/types/api/ball';
import type { GoalType } from '#shared/types/api/goalType';
import type { Player } from '#shared/types/api/player';
import type { Season } from '#shared/types/api/season';
import type { Table } from '#shared/types/api/table';
import { shortUUID } from '#shared/utils';
import type { PaginatedResponse } from '#shared/zod';

export interface EntityLookup<T> {
  all: Accessor<T[]>;
  get: (uuid: string) => T | null;
  getLabel: (uuid: string) => string;
}

export function createEntityLookup<T extends { uuid: string }>(
  query: ResilientQuery<[], PaginatedResponse<T>>,
  toLabel: (entity: T) => string,
): EntityLookup<T> {
  const response = createResilientAsync(query);

  const all = createMemo(() =>
    (response.latest?.data ?? []).toSorted((a, b) =>
      toLabel(a).localeCompare(toLabel(b)),
    ),
  );
  const entities = createMemo(
    () => new Map(all().map((entity) => [entity.uuid, entity])),
  );

  const get = (uuid: string) => entities().get(uuid) ?? null;

  const getLabel = (uuid: string) => {
    const entity = get(uuid);

    return entity === null ? shortUUID(uuid) : toLabel(entity);
  };

  return { all, get, getLabel };
}

export function usePlayerLookup(): EntityLookup<Player> {
  return createEntityLookup(queryPlayers, (player) => player.name);
}

export function useSeasonLookup(): EntityLookup<Season> {
  return createEntityLookup(querySeasons, (season) => season.name);
}

export function useTableLookup(): EntityLookup<Table> {
  return createEntityLookup(queryTables, (table) => table.name);
}

export function useBallLookup(): EntityLookup<Ball> {
  return createEntityLookup(queryBalls, (ball) => ball.name);
}

export function useGoalTypeLookup(): EntityLookup<GoalType> {
  return createEntityLookup(queryGoalTypes, (goalType) => goalType.name);
}
