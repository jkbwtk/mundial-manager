import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import {
  Table,
  type TableCreate,
  type TableQueryMeta,
  type TableUpdate,
} from '#shared/types/api/table';
import { PaginatedResponse } from '#shared/zod';

export const queryTables = query(async (meta: TableQueryMeta = {}) => {
  const tables = await trpcClient.tables.getAll.query(meta);

  return PaginatedResponse(Table).parse(tables);
}, 'queryTables');

export const querySearchTables = query(async (search: string) => {
  const tables = await trpcClient.tables.search.query(search);

  return Table.array().parse(tables);
}, 'querySearchTables');

export const actionCreateTable = action(async (table: TableCreate) => {
  const newTable = await trpcClient.tables.create.mutate(table);

  return json(Table.parse(newTable), {
    revalidate: ['queryTables'],
  });
}, 'actionCreateTable');

export const actionUpdateTable = action(async (table: TableUpdate) => {
  const updatedTable = await trpcClient.tables.update.mutate(table);

  return json(Table.parse(updatedTable), {
    revalidate: ['queryTables', 'queryTableById'],
  });
}, 'actionUpdateTable');

export const actionDeleteTable = action(async (uuid: string) => {
  const deletedTable = await trpcClient.tables.delete.mutate({ uuid });

  return json(Table.parse(deletedTable), {
    revalidate: ['queryTables', 'queryTableById'],
  });
}, 'actionDeleteTable');

export const queryTableById = query(async (uuid: string) => {
  const table = await trpcClient.tables.getById.query({ uuid });

  return Table.parse(table);
}, 'queryTableById');
