import { asc, desc, type SQL, sql } from 'drizzle-orm';
import type { matchesTable } from '#backend/db/schema';

type MatchesTable = typeof matchesTable;

export type MatchLike = {
  startDate: Date;
  $createdAt: Date;
  uuid: string;
};

function createdAtMs(table: MatchesTable): SQL {
  return sql`date_trunc('milliseconds', ${table.$createdAt})`;
}

export function matchOrderBy(
  column: keyof MatchesTable['_']['columns'] = 'startDate',
) {
  return (table: MatchesTable) => [
    asc(table[column]),
    sql`${createdAtMs(table)} asc`,
    asc(table.uuid),
  ];
}

export function matchOrderByDesc(
  column: keyof MatchesTable['_']['columns'] = 'startDate',
) {
  return (table: MatchesTable) => [
    desc(table[column]),
    sql`${createdAtMs(table)} desc`,
    desc(table.uuid),
  ];
}

export function getMatchCursor(match: MatchLike): MatchLike {
  return {
    startDate: match.startDate,
    $createdAt: match.$createdAt,
    uuid: match.uuid,
  };
}

function compareToCursor(cursor: MatchLike, operator: SQL) {
  return (table: MatchesTable): SQL =>
    sql`(${table.startDate}, ${createdAtMs(table)}, ${table.uuid}) ${operator} (${cursor.startDate}::timestamptz, ${cursor.$createdAt}::timestamptz, ${cursor.uuid}::uuid)`;
}

export function isMatchAfter(cursor: MatchLike) {
  return compareToCursor(cursor, sql`>`);
}

export function isMatchBefore(cursor: MatchLike) {
  return compareToCursor(cursor, sql`<`);
}

export function isMatchAtOrBefore(cursor: MatchLike) {
  return compareToCursor(cursor, sql`<=`);
}
