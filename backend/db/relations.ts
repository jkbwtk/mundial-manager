import { defineRelations } from 'drizzle-orm';
import * as schema from '#backend/db/schema';

export const relations = defineRelations(schema, (r) => ({
  leaguesTable: {
    tables: r.many.tablesTable({
      from: r.leaguesTable.uuid,
      to: r.tablesTable.leagueUuid,
      alias: 'tables',
    }),
    seasons: r.many.seasonsTable({
      from: r.leaguesTable.uuid,
      to: r.seasonsTable.leagueUuid,
      alias: 'seasons',
    }),
    players: r.many.playersTable({
      from: r.leaguesTable.uuid,
      to: r.playersTable.leagueUuid,
      alias: 'players',
    }),
    matches: r.many.matchesTable({
      from: r.leaguesTable.uuid,
      to: r.matchesTable.leagueUuid,
      alias: 'matches',
    }),
    statsFrames: r.many.statsFramesTable({
      from: r.leaguesTable.uuid,
      to: r.statsFramesTable.leagueUuid,
      alias: 'statsFrames',
    }),
  },
  seasonsTable: {
    league: r.one.leaguesTable({
      from: r.seasonsTable.leagueUuid,
      to: r.leaguesTable.uuid,
      alias: 'league',
      optional: false,
    }),
  },
  tablesTable: {
    league: r.one.leaguesTable({
      from: r.tablesTable.leagueUuid,
      to: r.leaguesTable.uuid,
      alias: 'league',
      optional: false,
    }),
    matches: r.many.matchesTable({
      from: r.tablesTable.uuid,
      to: r.matchesTable.tableUuid,
      alias: 'matches',
    }),
  },
  ballsTable: {
    league: r.one.leaguesTable({
      from: r.ballsTable.leagueUuid,
      to: r.leaguesTable.uuid,
      alias: 'league',
      optional: false,
    }),
    matches: r.many.matchesTable({
      from: r.ballsTable.uuid,
      to: r.matchesTable.ballUuid,
      alias: 'matches',
    }),
  },
  playersTable: {
    league: r.one.leaguesTable({
      from: r.playersTable.leagueUuid,
      to: r.leaguesTable.uuid,
      alias: 'league',
      optional: false,
    }),
  },
  teamConfigurationsTable: {
    league: r.one.leaguesTable({
      from: r.teamConfigurationsTable.leagueUuid,
      to: r.leaguesTable.uuid,
      alias: 'league',
      optional: false,
    }),
  },
  matchesTable: {
    league: r.one.leaguesTable({
      from: r.matchesTable.leagueUuid,
      to: r.leaguesTable.uuid,
      alias: 'league',
      optional: false,
    }),
    table: r.one.tablesTable({
      from: r.matchesTable.tableUuid,
      to: r.tablesTable.uuid,
      alias: 'table',
      optional: true,
    }),
    ball: r.one.ballsTable({
      from: r.matchesTable.ballUuid,
      to: r.ballsTable.uuid,
      alias: 'ball',
      optional: true,
    }),
    side1TeamConfiguration: r.one.teamConfigurationsTable({
      from: r.matchesTable.side1TeamConfigurationUuid,
      to: r.teamConfigurationsTable.uuid,
      alias: 'side1TeamConfiguration',
      optional: false,
    }),
    side2TeamConfiguration: r.one.teamConfigurationsTable({
      from: r.matchesTable.side2TeamConfigurationUuid,
      to: r.teamConfigurationsTable.uuid,
      alias: 'side2TeamConfiguration',
      optional: false,
    }),
    events: r.many.matchEventsTable({
      from: r.matchesTable.uuid,
      to: r.matchEventsTable.matchUuid,
      alias: 'events',
    }),
    statsFrames: r.one.statsFramesTable({
      from: r.matchesTable.uuid,
      to: r.statsFramesTable.leagueUuid,
      alias: 'statsFrame',
      optional: true,
    }),
  },
  matchEventsTable: {
    league: r.one.leaguesTable({
      from: r.matchEventsTable.leagueUuid,
      to: r.leaguesTable.uuid,
      alias: 'league',
      optional: false,
    }),
    match: r.one.matchesTable({
      from: r.matchEventsTable.matchUuid,
      to: r.matchesTable.uuid,
      alias: 'match',
      optional: false,
    }),
  },
  statsFramesTable: {
    league: r.one.leaguesTable({
      from: r.statsFramesTable.leagueUuid,
      to: r.leaguesTable.uuid,
      alias: 'league',
      optional: false,
    }),
    match: r.one.matchesTable({
      from: r.statsFramesTable.matchUuid,
      to: r.matchesTable.uuid,
      alias: 'match',
      optional: false,
    }),
  },
}));
