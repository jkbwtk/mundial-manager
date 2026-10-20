import z from 'zod';

export const BuildChannelEnum = {
  DEV: 'DEV',
  STAGING: 'STAGING',
  RELEASE: 'RELEASE',
} as const;

export const BuildChannel = z.enum(BuildChannelEnum);
export type BuildChannel = z.infer<typeof BuildChannel>;

export const BuildInfo = z.object({
  channel: BuildChannel,
  commitSha: z.string().min(7),
  date: z.coerce.date(),
  tags: z.string().transform((tags) => tags.split(',')),

  runner: z.string(),
  runNumber: z.coerce.number().int(),
});

export type BuildInfo = z.infer<typeof BuildInfo>;
