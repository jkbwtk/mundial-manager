import dayjs from 'dayjs';
import * as z from 'zod';

export const ChangeTypes = [
  'feature',
  'improvement',
  'bugfix',
  'removal',
] as const;

export const ChangeType = z.enum(ChangeTypes);

export type ChangeType = z.infer<typeof ChangeType>;

export const Change = z.object({
  type: ChangeType,
  change: z.string(),
  description: z.string().optional(),
});

export type Change = z.infer<typeof Change>;

export const Commit = z.object({
  hash: z.string(),
  message: z.string(),
});

export type Commit = z.infer<typeof Commit>;

export const ReleaseTypes = ['major', 'minor', 'patch'] as const;

export const ReleaseType = z.enum(ReleaseTypes);

export type ReleaseType = z.infer<typeof ReleaseType>;

export const Version = z.object({
  version: z.string(),
  releaseType: ReleaseType,
  date: z.codec(z.string(), z.date(), {
    decode: (str, ctx) => {
      const date = new Date(str);

      if (Number.isNaN(date.getTime())) {
        ctx.issues.push({
          code: 'invalid_format',
          format: 'date',
          input: str,
          message: 'Invalid date format',
        });
        return z.NEVER;
      }
      return date;
    },
    encode: (date) => dayjs(date).format('YYYY-MM-DD'),
  }),
  name: z.string(),
  changes: z.array(Change),
  commits: z.array(Commit),
});

export type Version = z.infer<typeof Version>;

export const Changelog = z.object({
  versions: z.array(Version),
});

export type Changelog = z.infer<typeof Changelog>;
