import z from 'zod';
import type {
  StatsContext,
  StatsMatchContext,
} from '#shared/types/stats/statsEngine';
import type { StatsFrameKey } from '#shared/types/stats/statsFrame';

export const StatsModuleEnum = {
  GENERAL: 'GENERAL',
  PLAYERS: 'PLAYERS',
  RATINGS: 'RATINGS',
} as const;

export const StatsModuleId = z.enum(StatsModuleEnum);
export type StatsModuleId = z.infer<typeof StatsModuleId>;

export const StatsModuleIds = Object.values(StatsModuleEnum);

export interface StatsModuleEntry<State> extends StatsFrameKey {
  state: State;
}

export type StatsResumeFilter = Pick<StatsFrameKey, 'bucket' | 'bucketKey'>;

export type StatsStateGetter<State> = (key: StatsFrameKey) => State | null;

export interface StatsModule<State> {
  state: z.ZodType<State>;

  getResumeFilters: (previous: StatsContext) => StatsResumeFilter[];

  apply: (
    context: StatsMatchContext,
    getState: StatsStateGetter<State>,
  ) => StatsModuleEntry<State>[];
}
