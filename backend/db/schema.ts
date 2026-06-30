import { isNull, type SQL, sql } from 'drizzle-orm';
import { integer, pgEnum, timestamp, uuid } from 'drizzle-orm/pg-core/columns';
import { index, uniqueIndex } from 'drizzle-orm/pg-core/indexes';
import { pgTable } from 'drizzle-orm/pg-core/table';
import { tsvector } from '#backend/db/utils';
import { MatchStatusEnum } from '#shared/types/api/match';
import { MatchEventTypeEnum } from '#shared/types/api/matchEvent';
import type { SeasonConfig } from '#shared/types/api/season';

const commonFields = {
  uuid: uuid().primaryKey().defaultRandom(),
  $createdAt: timestamp({ mode: 'date', withTimezone: true, precision: 6 })
    .defaultNow()
    .notNull(),
  $updatedAt: timestamp({ mode: 'date', withTimezone: true, precision: 6 })
    .$onUpdate(() => sql`CURRENT_TIMESTAMP`)
    .notNull(),
  $deletedAt: timestamp({
    mode: 'date',
    withTimezone: true,
    precision: 6,
  }),
  $updateCounter: integer()
    .default(sql`1`)
    .$onUpdateFn(() => sql`"$updateCounter" + 1`)
    .notNull(),
};

export const leaguesTable = pgTable(
  'leagues',
  (t) => ({
    name: t.text().notNull(),
    alias: t.text().notNull(),
    description: t.text(),

    rules: t.text(),

    ...commonFields,
  }),
  (r) => [
    uniqueIndex().on(r.name),
    uniqueIndex().on(r.alias),
    index().on(r.$createdAt),
    index().on(r.$deletedAt).where(isNull(r.$deletedAt)),
  ],
);

export const seasonsTable = pgTable(
  'seasons',
  (t) => ({
    leagueUuid: t
      .uuid()
      .references(() => leaguesTable.uuid, { onDelete: 'cascade' })
      .notNull(),

    name: t.text().notNull(),

    startDate: t
      .timestamp({ mode: 'date', withTimezone: true, precision: 6 })
      .notNull(),
    endDate: t
      .timestamp({ mode: 'date', withTimezone: true, precision: 6 })
      .notNull(),

    config: t.jsonb().notNull().$type<SeasonConfig>(),
    labels: t.text().array().notNull().default(sql`ARRAY[]::varchar[]`),

    ...commonFields,
  }),
  (r) => [
    index().on(r.leagueUuid),
    uniqueIndex().on(r.leagueUuid, r.name),
    index().on(r.$createdAt),
    index().on(r.$deletedAt).where(isNull(r.$deletedAt)),
  ],
);

export const tablesTable = pgTable(
  'tables',
  (t) => ({
    leagueUuid: t
      .uuid()
      .references(() => leaguesTable.uuid, { onDelete: 'cascade' })
      .notNull(),

    name: t.text().notNull(),
    alias: t.text().notNull(),
    description: t.text(),

    searchVectors: tsvector()
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`setweight(to_tsvector('english', ${tablesTable.name}), 'A') || \
          setweight(to_tsvector('english', ${tablesTable.alias}), 'B') || \
          setweight(to_tsvector('english', coalesce(${tablesTable.description}, '')), 'C')`,
      ),

    side1Color: t.text().notNull(), // #RRGGBBAA
    side2Color: t.text().notNull(), // #RRGGBBAA
    location: t.text(),

    labels: t.text().array().notNull().default(sql`ARRAY[]::varchar[]`),

    ...commonFields,
  }),
  (r) => [
    index().on(r.leagueUuid),
    uniqueIndex().on(r.leagueUuid, r.name),
    index().using('gin', r.searchVectors),
    index().on(r.$createdAt),
    index().on(r.$deletedAt).where(isNull(r.$deletedAt)),
  ],
);

export const ballsTable = pgTable(
  'balls',
  (t) => ({
    leagueUuid: t
      .uuid()
      .references(() => leaguesTable.uuid, { onDelete: 'cascade' })
      .notNull(),

    name: t.text().notNull(),
    alias: t.text().notNull(),
    description: t.text(),

    searchVectors: tsvector()
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`setweight(to_tsvector('english', ${ballsTable.name}), 'A') || \
          setweight(to_tsvector('english', ${ballsTable.alias}), 'B') || \
          setweight(to_tsvector('english', coalesce(${ballsTable.description}, '')), 'C')`,
      ),

    color: t.text(), // #RRGGBBAA
    diameter: t.real(), // millimeters
    weight: t.real(), // grams

    labels: t.text().array().notNull().default(sql`ARRAY[]::varchar[]`),

    ...commonFields,
  }),
  (r) => [
    index().on(r.leagueUuid),
    uniqueIndex().on(r.leagueUuid, r.name),
    index().using('gin', r.searchVectors),
    index().on(r.$createdAt),
    index().on(r.$deletedAt).where(isNull(r.$deletedAt)),
  ],
);

export const playersTable = pgTable(
  'players',
  (t) => ({
    leagueUuid: t
      .uuid()
      .references(() => leaguesTable.uuid, { onDelete: 'cascade' })
      .notNull(),

    name: t.text().notNull(),
    alias: t.text().notNull(),
    color: t.text().notNull(), // #RRGGBBAA

    labels: t.text().array().notNull().default(sql`ARRAY[]::varchar[]`),

    searchVectors: tsvector()
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`setweight(to_tsvector('english', ${playersTable.name}), 'A') || \
          setweight(to_tsvector('english', ${playersTable.alias}), 'B')`,
      ),

    ...commonFields,
  }),
  (r) => [
    index().on(r.leagueUuid),
    uniqueIndex().on(r.leagueUuid, r.name),
    uniqueIndex().on(r.leagueUuid, r.alias),
    index().using('gin', r.searchVectors),
    index().on(r.$createdAt),
    index().on(r.$deletedAt).where(isNull(r.$deletedAt)),
  ],
);

export const teamConfigurationsTable = pgTable(
  'teamConfigurations',
  (t) => ({
    leagueUuid: t
      .uuid()
      .references(() => leaguesTable.uuid, { onDelete: 'cascade' })
      .notNull(),

    playerUuids: t.uuid().array().notNull().default(sql`ARRAY[]::uuid[]`),

    ...commonFields,
  }),
  (r) => [
    index().on(r.leagueUuid),
    uniqueIndex().on(r.leagueUuid, r.playerUuids),
    index().using('gin', r.playerUuids),
    index().on(r.$createdAt),
    index().on(r.$deletedAt).where(isNull(r.$deletedAt)),
  ],
);

export const matchStatusEnum = pgEnum('matchStatus', MatchStatusEnum);

export const matchesTable = pgTable(
  'matches',
  (t) => ({
    leagueUuid: t
      .uuid()
      .references(() => leaguesTable.uuid, { onDelete: 'cascade' })
      .notNull(),
    tableUuid: t
      .uuid()
      .references(() => tablesTable.uuid, { onDelete: 'restrict' }),
    ballUuid: t
      .uuid()
      .references(() => ballsTable.uuid, { onDelete: 'set null' }),

    startDate: t
      .timestamp({ mode: 'date', withTimezone: true, precision: 6 })
      .notNull(),

    duration: t.doublePrecision().notNull(),
    pauseDuration: t.doublePrecision().default(0),

    side1Score: t.integer().notNull(),
    side2Score: t.integer().notNull(),

    side1TeamConfigurationUuid: t
      .uuid()
      .references(() => teamConfigurationsTable.uuid, { onDelete: 'restrict' })
      .notNull(),
    side2TeamConfigurationUuid: t
      .uuid()
      .references(() => teamConfigurationsTable.uuid, { onDelete: 'restrict' })
      .notNull(),

    // keep duplicate player lists for faster access and to simplify queries
    playersSide1: t.uuid().array().notNull(),
    playersSide2: t.uuid().array().notNull(),

    side1PlayerPositions: t
      .jsonb()
      .$type<Record<string, number>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    side2PlayerPositions: t
      .jsonb()
      .$type<Record<string, number>>()
      .notNull()
      .default(sql`'{}'::jsonb`),

    spectators: t.uuid().array().notNull().default(sql`ARRAY[]::uuid[]`),

    status: matchStatusEnum().notNull(),

    hash: t.text().notNull(),

    labels: t.text().array().notNull().default(sql`ARRAY[]::varchar[]`),

    ...commonFields,
  }),
  (r) => [
    index().on(r.leagueUuid),
    index().on(r.tableUuid),
    index().on(r.ballUuid),
    index().on(r.startDate),
    index().on(r.status),
    uniqueIndex().on(r.leagueUuid, r.hash),
    index().on(r.$createdAt),
    index().on(r.$deletedAt).where(isNull(r.$deletedAt)),
  ],
);

export const matchEventTypeEnum = pgEnum('matchEventType', MatchEventTypeEnum);

export const matchEventsTable = pgTable(
  'matchEvents',
  (t) => ({
    leagueUuid: t
      .uuid()
      .references(() => leaguesTable.uuid, { onDelete: 'cascade' })
      .notNull(),
    matchUuid: t
      .uuid()
      .references(() => matchesTable.uuid, { onDelete: 'cascade' })
      .notNull(),

    type: matchEventTypeEnum().notNull(),
    time: t
      .timestamp({ mode: 'date', withTimezone: true, precision: 6 })
      .notNull(),
    payload: t.jsonb(),

    labels: t.text().array().notNull().default(sql`ARRAY[]::varchar[]`),

    ...commonFields,
  }),
  (r) => [
    index().on(r.leagueUuid),
    index().on(r.matchUuid),
    index().on(r.type),
    index().on(r.time),
    index().on(r.$createdAt),
    index().on(r.$deletedAt).where(isNull(r.$deletedAt)),
  ],
);
