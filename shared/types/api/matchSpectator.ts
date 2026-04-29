import z from 'zod';

export const MatchSpectator = z.object({
  uuid: z.uuid(),
  matchUuid: z.uuid(),
  playerUuid: z.uuid(),
});
export type MatchSpectator = z.infer<typeof MatchSpectator>;

export const MatchSpectatorCreate = MatchSpectator.omit({ uuid: true });
export type MatchSpectatorCreate = z.infer<typeof MatchSpectatorCreate>;

export const MatchSpectatorUpdate = MatchSpectatorCreate.partial();
export type MatchSpectatorUpdate = z.infer<typeof MatchSpectatorUpdate>;
