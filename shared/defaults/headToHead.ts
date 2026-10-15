import type { HeadToHeadRecord } from '#shared/types/api/headToHead';

export const defaultHeadToHeadRecord = {
  wins: 0,
  losses: 0,
  draws: 0,
} satisfies HeadToHeadRecord;
