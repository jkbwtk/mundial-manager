import z from 'zod';
import { Permission, Role } from '#shared/permissions';

export const Identity = z.object({
  role: Role.nullable(),
  permissions: Permission.array(),

  leagueUuid: z.uuid().nullable(),
});
export type Identity = z.infer<typeof Identity>;
