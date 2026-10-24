import z from 'zod';
import { ActiveMatches } from '#shared/types/api/activeMatch';
import { StatsVersion } from '#shared/types/api/stats';

export const LeagueEventTopicEnum = {
  STATS: 'STATS',
  ACTIVE_MATCHES: 'ACTIVE_MATCHES',
} as const;

export const LeagueEventTopic = z.enum(LeagueEventTopicEnum);
export type LeagueEventTopic = z.infer<typeof LeagueEventTopic>;

export const LeagueEventTopics = Object.values(LeagueEventTopicEnum);

export const StatsUpdatedEvent = z.object({
  topic: z.literal(LeagueEventTopicEnum.STATS),
  version: StatsVersion,
});
export type StatsUpdatedEvent = z.infer<typeof StatsUpdatedEvent>;

export const ActiveMatchesUpdatedEvent = z.object({
  topic: z.literal(LeagueEventTopicEnum.ACTIVE_MATCHES),
  matches: ActiveMatches,
});
export type ActiveMatchesUpdatedEvent = z.infer<
  typeof ActiveMatchesUpdatedEvent
>;

export const LeagueEvent = z.discriminatedUnion('topic', [
  StatsUpdatedEvent,
  ActiveMatchesUpdatedEvent,
]);
export type LeagueEvent = z.infer<typeof LeagueEvent>;

export const LeagueEventSubscription = z.object({
  topics: LeagueEventTopic.array().min(1).max(LeagueEventTopics.length),
});
export type LeagueEventSubscription = z.infer<typeof LeagueEventSubscription>;
