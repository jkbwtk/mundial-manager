import { sql } from 'drizzle-orm';
import { integer, pgEnum, timestamp } from 'drizzle-orm/pg-core/columns';
import { index, uniqueIndex } from 'drizzle-orm/pg-core/indexes';
import { pgTable } from 'drizzle-orm/pg-core/table';
import { MatchStatusEnum } from '#shared/types/api/match';
import { MatchEventTypeEnum } from '#shared/types/api/matchEvent';
import type { SeasonConfig } from '#shared/types/api/season';

const commonFields = {
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
    .$onUpdateFn(() => sql`updateCounter + 1`)
    .notNull(),
};

export const leaguesTable = pgTable(
  'leagues',
  (t) => ({
    uuid: t.uuid().primaryKey().defaultRandom(),
    name: t.text().notNull(),
    alias: t.text().notNull(),
    description: t.text(),

    ...commonFields,
  }),
  (r) => [uniqueIndex().on(r.name), uniqueIndex().on(r.alias)],
);

export const seasonsTable = pgTable(
  'seasons',
  (t) => ({
    uuid: t.uuid().primaryKey().defaultRandom(),
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
  (r) => [index().on(r.leagueUuid), uniqueIndex().on(r.leagueUuid, r.name)],
);

export const tablesTable = pgTable(
  'tables',
  (t) => ({
    uuid: t.uuid().primaryKey().defaultRandom(),
    leagueUuid: t
      .uuid()
      .references(() => leaguesTable.uuid, { onDelete: 'cascade' })
      .notNull(),

    name: t.text().notNull(),
    alias: t.text().notNull(),
    description: t.text(),

    side1Color: t.text().notNull(), // #RRGGBBAA
    side2Color: t.text().notNull(), // #RRGGBBAA
    location: t.text(),

    labels: t.text().array().notNull().default(sql`ARRAY[]::varchar[]`),

    ...commonFields,
  }),
  (r) => [index().on(r.leagueUuid), uniqueIndex().on(r.leagueUuid, r.name)],
);

export const playersTable = pgTable(
  'players',
  (t) => ({
    uuid: t.uuid().primaryKey().defaultRandom(),
    leagueUuid: t
      .uuid()
      .references(() => leaguesTable.uuid, { onDelete: 'cascade' })
      .notNull(),

    name: t.text().notNull(),
    alias: t.text().notNull(),
    color: t.text().notNull(), // #RRGGBBAA

    labels: t.text().array().notNull().default(sql`ARRAY[]::varchar[]`),

    ...commonFields,
  }),
  (r) => [
    index().on(r.leagueUuid),
    uniqueIndex().on(r.leagueUuid, r.name),
    uniqueIndex().on(r.leagueUuid, r.alias),
  ],
);

export const matchStatusEnum = pgEnum('matchStatus', MatchStatusEnum);

export const matchesTable = pgTable(
  'matches',
  (t) => ({
    uuid: t.uuid().primaryKey().defaultRandom(),
    leagueUuid: t
      .uuid()
      .references(() => leaguesTable.uuid, { onDelete: 'cascade' })
      .notNull(),
    tableUuid: t
      .uuid()
      .references(() => tablesTable.uuid, { onDelete: 'restrict' }),

    startDate: t
      .timestamp({ mode: 'date', withTimezone: true, precision: 6 })
      .notNull(),

    duration: t.integer(),
    pauseDuration: t.integer().default(0),

    status: matchStatusEnum().notNull(),

    hash: t.text().notNull(),

    ...commonFields,
  }),
  (r) => [
    index().on(r.leagueUuid),
    index().on(r.tableUuid),
    index().on(r.startDate),
    index().on(r.status),
    uniqueIndex().on(r.leagueUuid, r.hash),
  ],
);

export const teamConfigurationsTable = pgTable(
  'teamConfigurations',
  (t) => ({
    uuid: t.uuid().primaryKey().defaultRandom(),
    leagueUuid: t
      .uuid()
      .references(() => leaguesTable.uuid, { onDelete: 'cascade' })
      .notNull(),

    compositionKey: t.text().notNull(),

    ...commonFields,
  }),
  (r) => [
    index().on(r.leagueUuid),
    uniqueIndex().on(r.leagueUuid, r.compositionKey),
  ],
);

export const teamConfigurationMembersTable = pgTable(
  'teamConfigurationMembers',
  (t) => ({
    uuid: t.uuid().primaryKey().defaultRandom(),
    leagueUuid: t
      .uuid()
      .references(() => leaguesTable.uuid, { onDelete: 'cascade' })
      .notNull(),
    teamConfigurationUuid: t
      .uuid()
      .references(() => teamConfigurationsTable.uuid, { onDelete: 'cascade' })
      .notNull(),
    playerUuid: t
      .uuid()
      .references(() => playersTable.uuid, { onDelete: 'restrict' })
      .notNull(),

    ...commonFields,
  }),
  (r) => [
    index().on(r.leagueUuid),
    index().on(r.teamConfigurationUuid),
    index().on(r.playerUuid),
    uniqueIndex().on(r.teamConfigurationUuid, r.playerUuid),
  ],
);

export const matchSideEnum = pgEnum('matchSide', ['SIDE_1', 'SIDE_2']);

export const matchSidesTable = pgTable(
  'matchSides',
  (t) => ({
    uuid: t.uuid().primaryKey().defaultRandom(),
    leagueUuid: t
      .uuid()
      .references(() => leaguesTable.uuid, { onDelete: 'cascade' })
      .notNull(),
    matchUuid: t
      .uuid()
      .references(() => matchesTable.uuid, { onDelete: 'cascade' })
      .notNull(),
    teamConfigurationUuid: t
      .uuid()
      .references(() => teamConfigurationsTable.uuid, { onDelete: 'restrict' })
      .notNull(),

    side: matchSideEnum().notNull(),
    score: t.integer().notNull(),

    ...commonFields,
  }),
  (r) => [
    index().on(r.leagueUuid),
    index().on(r.matchUuid),
    index().on(r.teamConfigurationUuid),
    uniqueIndex().on(r.matchUuid, r.side),
  ],
);

export const matchEventTypeEnum = pgEnum('matchEventType', MatchEventTypeEnum);

export const matchEventsTable = pgTable(
  'matchEvents',
  (t) => ({
    uuid: t.uuid().primaryKey().defaultRandom(),
    leagueUuid: t
      .uuid()
      .references(() => leaguesTable.uuid, { onDelete: 'cascade' })
      .notNull(),
    matchUuid: t
      .uuid()
      .references(() => matchesTable.uuid, { onDelete: 'cascade' })
      .notNull(),

    type: matchEventTypeEnum().notNull(),
    time: t.integer().notNull(),
    payload: t.jsonb(),

    labels: t.text().array().notNull().default(sql`ARRAY[]::varchar[]`),

    ...commonFields,
  }),
  (r) => [
    index().on(r.leagueUuid),
    index().on(r.matchUuid),
    index().on(r.type),
    index().on(r.time),
  ],
);
