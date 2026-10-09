import type { StatsModuleId } from '#shared/types/stats/statsModule';

export const STATS_CONTEXT_MODULE = 'CONTEXT';

export type StatsFrameModule = StatsModuleId | typeof STATS_CONTEXT_MODULE;

export interface StatsFrameKey {
  bucket: string;
  bucketKey: string;
  subject: string;
}

export interface StatsFrameEntry extends StatsFrameKey {
  module: StatsFrameModule;
  payload: unknown;
}
