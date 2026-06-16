import { createSelectSchema } from 'drizzle-orm/zod';
import type z from 'zod';
import { teamConfigurationsTable } from '#backend/db/schema';

export const TeamConfigurationSelectSchema = createSelectSchema(
  teamConfigurationsTable,
);
export type TeamConfigurationSelectSchema = z.infer<
  typeof TeamConfigurationSelectSchema
>;
