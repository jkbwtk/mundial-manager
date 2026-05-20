import { action, json, query } from '@solidjs/router';
import { trpcClient } from '#flib/trpcClient';
import {
  Table,
  type TableCreate,
  type TableUpdate,
} from '#shared/types/api/table';
import { PaginatedResponse } from '#shared/zod';

export const queryTables = query(async () => {
  const tables = await trpcClient.tables.tables.query();

  return PaginatedResponse(Table).parse(tables);
}, 'queryTables');

export const actionCreateTable = action(async (table: TableCreate) => {
  const newTable = await trpcClient.tables.createTable.mutate(table);

  return json(Table.parse(newTable), {
    revalidate: ['queryTables'],
  });
}, 'actionCreateTable');

export const actionUpdateTable = action(async (table: TableUpdate) => {
  const updatedTable = await trpcClient.tables.updateTable.mutate(table);

  return json(Table.parse(updatedTable), {
    revalidate: ['queryTables', 'queryTableById'],
  });
}, 'actionUpdateTable');

export const actionDeleteTable = action(async (uuid: string) => {
  const deletedTable = await trpcClient.tables.deleteTable.mutate({ uuid });

  return json(Table.parse(deletedTable), {
    revalidate: ['queryTables', 'queryTableById'],
  });
}, 'actionDeleteTable');

export const queryTableById = query(async (uuid: string) => {
  const table = await trpcClient.tables.tableById.query({ uuid });

  return Table.parse(table);
}, 'queryTableById');
