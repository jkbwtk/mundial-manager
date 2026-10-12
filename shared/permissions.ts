import z from 'zod';
import { arrayFrom } from '#shared/utils';

export const RoleEnum = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const;

export const Role = z.enum(RoleEnum);
export type Role = z.infer<typeof Role>;

export const Roles = Object.values(RoleEnum);

export const PermissionEnum = {
  LEAGUES_READ: 'LEAGUES_READ',
  LEAGUES_CREATE: 'LEAGUES_CREATE',
  LEAGUES_UPDATE: 'LEAGUES_UPDATE',
  LEAGUES_DELETE: 'LEAGUES_DELETE',
  LEAGUES_SWITCH: 'LEAGUES_SWITCH',
  LEAGUES_INVITE: 'LEAGUES_INVITE',

  LEAGUE_SETTINGS_UPDATE: 'LEAGUE_SETTINGS_UPDATE',

  SEASONS_READ: 'SEASONS_READ',
  SEASONS_CREATE: 'SEASONS_CREATE',
  SEASONS_UPDATE: 'SEASONS_UPDATE',
  SEASONS_DELETE: 'SEASONS_DELETE',

  TABLES_READ: 'TABLES_READ',
  TABLES_CREATE: 'TABLES_CREATE',
  TABLES_UPDATE: 'TABLES_UPDATE',
  TABLES_DELETE: 'TABLES_DELETE',

  BALLS_READ: 'BALLS_READ',
  BALLS_CREATE: 'BALLS_CREATE',
  BALLS_UPDATE: 'BALLS_UPDATE',
  BALLS_DELETE: 'BALLS_DELETE',

  PLAYERS_READ: 'PLAYERS_READ',
  PLAYERS_CREATE: 'PLAYERS_CREATE',
  PLAYERS_UPDATE: 'PLAYERS_UPDATE',
  PLAYERS_DELETE: 'PLAYERS_DELETE',

  MATCHES_READ: 'MATCHES_READ',
  MATCHES_CREATE: 'MATCHES_CREATE',
  MATCHES_UPDATE: 'MATCHES_UPDATE',
  MATCHES_DELETE: 'MATCHES_DELETE',

  GOAL_TYPES_READ: 'GOAL_TYPES_READ',
  GOAL_TYPES_CREATE: 'GOAL_TYPES_CREATE',
  GOAL_TYPES_UPDATE: 'GOAL_TYPES_UPDATE',
  GOAL_TYPES_DELETE: 'GOAL_TYPES_DELETE',

  STATS_READ: 'STATS_READ',

  DEV_TOOLS_VIEW: 'DEV_TOOLS_VIEW',
} as const;

export const Permission = z.enum(PermissionEnum);
export type Permission = z.infer<typeof Permission>;

export const Permissions = Object.values(PermissionEnum);

export type PermissionRequirement = Permission | Permission[];

export const MatchRecordingPermissions: Permission[] = [
  PermissionEnum.MATCHES_CREATE,
  PermissionEnum.MATCHES_UPDATE,
  PermissionEnum.MATCHES_DELETE,
  PermissionEnum.TABLES_READ,
  PermissionEnum.BALLS_READ,
  PermissionEnum.PLAYERS_READ,
  PermissionEnum.GOAL_TYPES_READ,
];

const GlobalPermissions: Permission[] = [
  PermissionEnum.LEAGUES_READ,
  PermissionEnum.LEAGUES_CREATE,
  PermissionEnum.LEAGUES_UPDATE,
  PermissionEnum.LEAGUES_DELETE,
  PermissionEnum.LEAGUES_SWITCH,
  PermissionEnum.LEAGUES_INVITE,
  PermissionEnum.DEV_TOOLS_VIEW,
];

const LeaguePermissions = Permissions.filter(
  (permission) => !GlobalPermissions.includes(permission),
);

export const RolePermissions: Record<Role, Permission[]> = {
  ADMIN: Permissions,
  MEMBER: LeaguePermissions,
  VIEWER: LeaguePermissions.filter((permission) =>
    permission.endsWith('_READ'),
  ),
};

export function getGrantedPermissions(
  role: Role,
  hasLeague: boolean,
): Permission[] {
  return hasLeague
    ? RolePermissions[role]
    : RolePermissions[role].filter((permission) =>
        GlobalPermissions.includes(permission),
      );
}

export function hasPermissions(
  granted: Permission[],
  required: PermissionRequirement,
): boolean {
  return arrayFrom(required).every((permission) =>
    granted.includes(permission),
  );
}
