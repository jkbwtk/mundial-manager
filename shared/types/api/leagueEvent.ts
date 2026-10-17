import z from 'zod';
import { StatsVersion } from '#shared/types/api/stats';

export const LeagueEventTopicEnum = {
  STATS: 'STATS',
} as const;

export const LeagueEventTopic = z.enum(LeagueEventTopicEnum);
export type LeagueEventTopic = z.infer<typeof LeagueEventTopic>;

export const LeagueEventTopics = Object.values(LeagueEventTopicEnum);

export const StatsUpdatedEvent = z.object({
  topic: z.literal(LeagueEventTopicEnum.STATS),
  version: StatsVersion,
});
export type StatsUpdatedEvent = z.infer<typeof StatsUpdatedEvent>;

export const LeagueEvent = z.discriminatedUnion('topic', [StatsUpdatedEvent]);
export type LeagueEvent = z.infer<typeof LeagueEvent>;

export const LeagueEventSubscription = z.object({
  topics: LeagueEventTopic.array().min(1).max(LeagueEventTopics.length),
});
export type LeagueEventSubscription = z.infer<typeof LeagueEventSubscription>;
