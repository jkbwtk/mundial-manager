import { asc, type SQL, sql } from 'drizzle-orm';
import type { matchesTable } from '#backend/db/schema';

type MatchesTable = typeof matchesTable;

function createdAtMs(table: MatchesTable): SQL {
  return sql`date_trunc('milliseconds', ${table.$createdAt})`;
}

export function matchOrderBy(
  column: keyof MatchesTable['_']['columns'] = 'startDate',
) {
  return (table: MatchesTable) => [
    sql`${table[column]} asc nulls last`,
    sql`${createdAtMs(table)} asc`,
    asc(table.uuid),
  ];
}
