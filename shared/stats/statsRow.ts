import { defaultSeasonConfig } from '#shared/defaults/season';
import { getKnownStartDate } from '#shared/matchLabels';
import { getMatchPlayerUuids } from '#shared/matchPlayers';
import {
  getMatchTimelineStats,
  getMatchWinningSide,
} from '#shared/matchTimeline';
import { calculateStatsRowBalls } from '#shared/stats/ballStats';
import {
  getStatsDayIndex,
  getStatsDayKey,
  getStatsMatchEnd,
  getStatsSeason,
  getStatsSeasonKey,
  getStatsSessionKey,
  getStatsSessionTableKey,
} from '#shared/stats/buckets';
import { calculateMatchStats } from '#shared/stats/generalStats';
import { calculateStatsRowLuck } from '#shared/stats/luckStats';
import { calculateStatsRowPlayers } from '#shared/stats/playerStats';
import {
  getStatsPauseAbsence,
  getStatsPresenceIncrement,
} from '#shared/stats/presence';
import { calculateRatings } from '#shared/stats/ratingStats';
import { getSkillGoalShare } from '#shared/stats/skillRating';
import { calculateMatchStylePoints } from '#shared/stats/stylePoints';
import type { SeasonConfig } from '#shared/types/api/season';
import type { StatsSessionState } from '#shared/types/stats/bucket';
import type {
  StatsEngine,
  StatsInput,
  StatsMatch,
  StatsRatingChange,
  StatsRow,
  StatsRowLuck,
} from '#shared/types/stats/statsRow';

interface StatsSessionUpdate {
  session: StatsSessionState | null;
  sessionPresence: number; // milliseconds
  playerPresence: Record<string, number>; // milliseconds
}

const RATING_EPOCH_ALL = 'ALL';

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

  if (session !== null) next[getStatsSessionTableKey(match)] = session;

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
    getStatsPresenceIncrement(match, continued?.matchEnd ?? null) - absence;
  const playerPresence = Object.fromEntries(
    present.map((uuid) => [
      uuid,
      getStatsPresenceIncrement(match, continued?.players[uuid] ?? null) -
        absence,
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

function calculateStatsRowLuckFromRatings(
  match: StatsMatch,
  config: SeasonConfig,
  ratings: StatsRatingChange[],
): StatsRowLuck | null {
  const params = config.ratings.SKILL;

  if (!params.enabled) return null;

  const before = new Map(
    ratings.flatMap((change) =>
      change.system === 'SKILL' ? [[change.uuid, change.before.rating]] : [],
    ),
  );
  const getRatings = (uuids: string[]) =>
    uuids.map((uuid) => before.get(uuid) ?? params.defaultRating);
  const goalShare = getSkillGoalShare(
    [getRatings(match.playersSide1), getRatings(match.playersSide2)],
    params,
  );

  return calculateStatsRowLuck(match, config.rules, goalShare);
}

function updateRatingEpoch(
  engine: StatsEngine,
  seasonUuid: string | null,
  config: SeasonConfig,
): void {
  const ratingSeasonUuid = seasonUuid ?? engine.ratingSeasonUuid;
  const isReset =
    config.resetRatings &&
    engine.index > 0 &&
    ratingSeasonUuid !== null &&
    ratingSeasonUuid !== engine.ratingSeasonUuid;

  engine.ratingSeasonUuid = ratingSeasonUuid;

  if (isReset) engine.ratingEpoch = ratingSeasonUuid;
}

function calculateStatsRow(engine: StatsEngine, match: StatsMatch): StatsRow {
  const { timeZone, seasons } = engine.input;

  const season = getStatsSeason(match, seasons);
  const config: SeasonConfig = season?.config ?? defaultSeasonConfig;
  const knownStartDate = getKnownStartDate(match);
  const day =
    knownStartDate === null ? null : getStatsDayKey(knownStartDate, timeZone);

  const sessionKey = getStatsSessionKey(match, {
    timeZone,
    season,
    sessions: engine.sessions,
  });
  const update = getSessionUpdate(
    match,
    engine.sessions[getStatsSessionTableKey(match)] ?? null,
    sessionKey,
  );
  const seasonKey = getStatsSeasonKey(match, season, engine.seasonKey);

  engine.sessions = getNextSessions(
    engine.sessions,
    match,
    day,
    update.session,
  );
  engine.seasonKey = seasonKey;

  if (day !== null) engine.day = getStatsDayIndex(day);

  updateRatingEpoch(engine, season?.uuid ?? null, config);

  const stylePoints = calculateMatchStylePoints(
    match,
    config.stylePoints,
    (uuid) =>
      config.goalTypes[uuid]?.stylePoints ?? engine.stylePoints.get(uuid) ?? 0,
  );
  const ratings = calculateRatings(engine, match, config, seasonKey);
  const { events, labels: _labels, ...rowMatch } = match;

  return {
    index: engine.index,
    match: rowMatch,

    day,
    seasonKey,
    sessionKey,
    ratingEpoch: engine.ratingEpoch,

    general: calculateMatchStats(
      match,
      getMatchTimelineStats(events, match.duration),
      update.sessionPresence,
    ),
    players: calculateStatsRowPlayers(
      match,
      update.playerPresence,
      stylePoints,
    ),
    balls: calculateStatsRowBalls(match),
    winningSide: getMatchWinningSide(match, match.events),

    ratings,
    luck: calculateStatsRowLuckFromRatings(match, config, ratings),
  };
}

export function createStatsEngine(input: StatsInput): StatsEngine {
  return {
    input,
    stylePoints: new Map(
      input.goalTypes.map((goalType) => [goalType.uuid, goalType.stylePoints]),
    ),

    index: 0,
    day: 0,
    seasonKey: null,
    sessions: {},

    ratingSeasonUuid: null,
    ratingEpoch: RATING_EPOCH_ALL,
    ratings: new Map(),
  };
}

export function calculateStatsRows(
  engine: StatsEngine,
  matches: StatsMatch[],
): StatsRow[] {
  return matches.map((match) => {
    const row = calculateStatsRow(engine, match);

    engine.index += 1;

    return row;
  });
}
