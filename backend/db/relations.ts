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
    teamConfigurations: r.many.teamConfigurationsTable({
      from: r.leaguesTable.uuid,
      to: r.teamConfigurationsTable.leagueUuid,
      alias: 'teamConfigurations',
    }),
    matches: r.many.matchesTable({
      from: r.leaguesTable.uuid,
      to: r.matchesTable.leagueUuid,
      alias: 'matches',
    }),
    matchSpectators: r.many.matchSpectatorsTable({
      from: r.leaguesTable.uuid,
      to: r.matchSpectatorsTable.leagueUuid,
      alias: 'matchSpectators',
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
    teamConfigurationMemberships: r.many.teamConfigurationMembersTable({
      from: r.playersTable.uuid,
      to: r.teamConfigurationMembersTable.playerUuid,
      alias: 'teamConfigurationMemberships',
    }),
    matchSpectators: r.many.matchSpectatorsTable({
      from: r.playersTable.uuid,
      to: r.matchSpectatorsTable.playerUuid,
      alias: 'matchSpectators',
    }),
  },
  teamConfigurationsTable: {
    league: r.one.leaguesTable({
      from: r.teamConfigurationsTable.leagueUuid,
      to: r.leaguesTable.uuid,
      alias: 'league',
      optional: false,
    }),
    members: r.many.teamConfigurationMembersTable({
      from: r.teamConfigurationsTable.uuid,
      to: r.teamConfigurationMembersTable.teamConfigurationUuid,
      alias: 'members',
    }),
    matchSides: r.many.matchSidesTable({
      from: r.teamConfigurationsTable.uuid,
      to: r.matchSidesTable.teamConfigurationUuid,
      alias: 'matchSides',
    }),
  },
  teamConfigurationMembersTable: {
    league: r.one.leaguesTable({
      from: r.teamConfigurationMembersTable.leagueUuid,
      to: r.leaguesTable.uuid,
      alias: 'league',
      optional: false,
    }),
    teamConfiguration: r.one.teamConfigurationsTable({
      from: r.teamConfigurationMembersTable.teamConfigurationUuid,
      to: r.teamConfigurationsTable.uuid,
      alias: 'teamConfiguration',
      optional: false,
    }),
    player: r.one.playersTable({
      from: r.teamConfigurationMembersTable.playerUuid,
      to: r.playersTable.uuid,
      alias: 'player',
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
    sides: r.many.matchSidesTable({
      from: r.matchesTable.uuid,
      to: r.matchSidesTable.matchUuid,
      alias: 'sides',
    }),
    events: r.many.matchEventsTable({
      from: r.matchesTable.uuid,
      to: r.matchEventsTable.matchUuid,
      alias: 'events',
    }),
    spectators: r.many.matchSpectatorsTable({
      from: r.matchesTable.uuid,
      to: r.matchSpectatorsTable.matchUuid,
      alias: 'spectators',
    }),
  },
  matchSidesTable: {
    league: r.one.leaguesTable({
      from: r.matchSidesTable.leagueUuid,
      to: r.leaguesTable.uuid,
      alias: 'league',
      optional: false,
    }),
    match: r.one.matchesTable({
      from: r.matchSidesTable.matchUuid,
      to: r.matchesTable.uuid,
      alias: 'match',
      optional: false,
    }),
    teamConfiguration: r.one.teamConfigurationsTable({
      from: r.matchSidesTable.teamConfigurationUuid,
      to: r.teamConfigurationsTable.uuid,
      alias: 'teamConfiguration',
      optional: false,
    }),
  },
  matchSpectatorsTable: {
    league: r.one.leaguesTable({
      from: r.matchSpectatorsTable.leagueUuid,
      to: r.leaguesTable.uuid,
      alias: 'league',
      optional: false,
    }),
    match: r.one.matchesTable({
      from: r.matchSpectatorsTable.matchUuid,
      to: r.matchesTable.uuid,
      alias: 'match',
      optional: false,
    }),
    player: r.one.playersTable({
      from: r.matchSpectatorsTable.playerUuid,
      to: r.playersTable.uuid,
      alias: 'player',
      optional: false,
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
}));
