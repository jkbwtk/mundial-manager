import z from 'zod';
import type { MatchTimelineStats } from '#shared/matchTimeline';
import type { Match } from '#shared/types/api/match';
import type { MatchEvent } from '#shared/types/api/matchEvent';
import type { SeasonConfig } from '#shared/types/api/season';
import {
  StatsBucket,
  type StatsBucketKeys,
  type StatsSeason,
  StatsSessionState,
} from '#shared/types/stats/bucket';
import type { StatsModuleId } from '#shared/types/stats/statsModule';

export interface StatsMatch extends Match {
  side1TeamConfigurationUuid: string;
  side2TeamConfigurationUuid: string;

  events: MatchEvent[];
}

export const StatsContext = z.object({
  seq: z.number().int(),
  version: z.number().int(),
  timezone: z.string(),

  buckets: z.partialRecord(StatsBucket, z.string()),
  sessions: z.record(z.string(), StatsSessionState),

  ratingSeasonUuid: z.uuid().nullable(),
  ratingEpoch: z.string(),
});
export type StatsContext = z.infer<typeof StatsContext>;

export interface StatsMatchContext {
  match: StatsMatch;
  timeline: MatchTimelineStats;

  season: StatsSeason | null;
  config: SeasonConfig;

  previous: StatsContext;
  current: StatsContext;

  buckets: StatsBucketKeys;
  sessionPresence: number; // milliseconds
  playerPresence: Record<string, number>; // milliseconds
}

export interface StatsEngine {
  context: StatsContext;
  states: Record<StatsModuleId, Map<string, unknown>>;
}
