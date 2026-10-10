import { defaultSeasonConfig } from '#shared/defaults/season';
import { getMatchPlayerUuids } from '#shared/matchPlayers';
import { getMatchTimelineStats } from '#shared/matchTimeline';
import {
  getStatsBuckets,
  getStatsMatchEnd,
  getStatsSessionTable,
  resolveStatsSeason,
} from '#shared/stats/buckets';
import {
  getPresenceIncrement,
  getStatsPauseAbsence,
} from '#shared/stats/presence';
import { statsModules } from '#shared/stats/statsModules';
import type {
  StatsSeason,
  StatsSessionState,
} from '#shared/types/stats/bucket';
import type {
  StatsContext,
  StatsEngine,
  StatsMatch,
  StatsMatchContext,
} from '#shared/types/stats/statsEngine';
import {
  STATS_CONTEXT_MODULE,
  type StatsFrameEntry,
  type StatsFrameKey,
} from '#shared/types/stats/statsFrame';
import {
  type StatsModule,
  type StatsModuleId,
  StatsModuleIds,
  type StatsResumeFilter,
} from '#shared/types/stats/statsModule';

const STATS_VERSION = 1;
const RATING_EPOCH_ALL = 'ALL';

interface StatsSessionUpdate {
  session: StatsSessionState | null;
  sessionPresence: number; // milliseconds
  playerPresence: Record<string, number>; // milliseconds
}

function getStatsModule(id: StatsModuleId): StatsModule<unknown> {
  return statsModules[id] as StatsModule<unknown>;
}

function getNextSessions(
  sessions: Record<string, StatsSessionState>,
  match: StatsMatch,
  day: string | null,
  session: StatsSessionState | null,
): Record<string, StatsSessionState> {
  const next =
    day === null
      ? { ...sessions }
      : Object.fromEntries(
          Object.entries(sessions).filter(([, state]) =>
            state.key.startsWith(`${day}#`),
          ),
        );

  if (session !== null) next[getStatsSessionTable(match)] = session;

  return next;
}

function getSessionUpdate(
  match: StatsMatch,
  previous: StatsSessionState | null,
  key: string | null,
): StatsSessionUpdate {
  const continued = key !== null && previous?.key === key ? previous : null;
  const matchEnd = getStatsMatchEnd(match);
  const present = [...getMatchPlayerUuids(match), ...match.spectators];
  const absence = getStatsPauseAbsence(match);

  const sessionPresence =
    getPresenceIncrement(match, continued?.matchEnd ?? null) - absence;
  const playerPresence = Object.fromEntries(
    present.map((uuid) => [
      uuid,
      getPresenceIncrement(match, continued?.players[uuid] ?? null) - absence,
    ]),
  );

  if (key === null || matchEnd === null) {
    return { session: null, sessionPresence, playerPresence };
  }

  return {
    session: {
      key,
      matchEnd,
      players: {
        ...continued?.players,
        ...Object.fromEntries(present.map((uuid) => [uuid, matchEnd])),
      },
    },
    sessionPresence,
    playerPresence,
  };
}

export function getStatsFrameKeyId(key: StatsFrameKey): string {
  return `${key.bucket}|${key.bucketKey}|${key.subject}`;
}

function createStatsContext(timeZone: string): StatsContext {
  return {
    seq: -1,
    version: STATS_VERSION,
    timezone: timeZone,

    buckets: {},
    sessions: {},

    ratingSeasonUuid: null,
    ratingEpoch: RATING_EPOCH_ALL,
  };
}

export function createStatsEngine(timeZone: string): StatsEngine {
  return {
    context: createStatsContext(timeZone),
    states: Object.fromEntries(
      StatsModuleIds.map((id) => [id, new Map()]),
    ) as StatsEngine['states'],
  };
}

export function isStatsContextCurrent(
  context: StatsContext,
  timeZone: string,
): boolean {
  return context.version === STATS_VERSION && context.timezone === timeZone;
}

export function getStatsResumeFilters(
  context: StatsContext,
): Record<StatsModuleId, StatsResumeFilter[]> {
  return Object.fromEntries(
    StatsModuleIds.map((id) => [
      id,
      getStatsModule(id).getResumeFilters(context),
    ]),
  ) as Record<StatsModuleId, StatsResumeFilter[]>;
}

export function restoreStatsEngine(
  context: StatsContext,
  entries: StatsFrameEntry[],
): StatsEngine | null {
  const engine = createStatsEngine(context.timezone);

  engine.context = context;

  for (const entry of entries) {
    if (entry.module === STATS_CONTEXT_MODULE) continue;

    const state = getStatsModule(entry.module).state.safeParse(entry.payload);

    if (!state.success) return null;

    engine.states[entry.module].set(getStatsFrameKeyId(entry), state.data);
  }

  return engine;
}

export function calculateStatsFrame(
  engine: StatsEngine,
  match: StatsMatch,
  seasons: StatsSeason[],
): StatsFrameEntry[] {
  const previous = engine.context;

  const season = resolveStatsSeason(match, seasons);
  const config = season?.config ?? defaultSeasonConfig;

  const ratingSeasonUuid = season?.uuid ?? previous.ratingSeasonUuid;
  const ratingsReset =
    config.resetRatings &&
    previous.seq >= 0 &&
    ratingSeasonUuid !== null &&
    ratingSeasonUuid !== previous.ratingSeasonUuid;

  const buckets = getStatsBuckets(match, {
    timeZone: previous.timezone,
    season,
    previous: previous.buckets,
    sessions: previous.sessions,
  });

  const update = getSessionUpdate(
    match,
    previous.sessions[getStatsSessionTable(match)] ?? null,
    buckets.SESSION ?? null,
  );

  const current: StatsContext = {
    seq: previous.seq + 1,
    version: STATS_VERSION,
    timezone: previous.timezone,

    buckets,
    sessions: getNextSessions(
      previous.sessions,
      match,
      buckets.DAY ?? null,
      update.session,
    ),

    ratingSeasonUuid,
    ratingEpoch: ratingsReset ? ratingSeasonUuid : previous.ratingEpoch,
  };

  const context: StatsMatchContext = {
    match,
    timeline: getMatchTimelineStats(match.events, match.duration),

    season,
    config,

    previous,
    current,

    buckets,
    sessionPresence: update.sessionPresence,
    playerPresence: update.playerPresence,
  };

  const entries: StatsFrameEntry[] = [
    {
      module: STATS_CONTEXT_MODULE,
      bucket: '',
      bucketKey: '',
      subject: '',
      payload: current,
    },
  ];

  for (const id of StatsModuleIds) {
    const states = engine.states[id];
    const updates = getStatsModule(id).apply(
      context,
      (key) => states.get(getStatsFrameKeyId(key)) ?? null,
    );

    for (const { state, ...key } of updates) {
      states.set(getStatsFrameKeyId(key), state);
      entries.push({ module: id, ...key, payload: state });
    }
  }

  engine.context = current;

  return entries;
}
