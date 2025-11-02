import * as z from 'zod';
import { jsonCodec } from '#shared/zod';

export const ChangelogConfig = jsonCodec(
  z.object({
    disabledPermanently: z.boolean().catch(false),
    disabledUntilNextVersion: z.boolean().catch(false),
    lastViewedVersion: z.string().nullable().catch(null),
  }),
);

export type ChangelogConfig = z.infer<typeof ChangelogConfig>;
