import { defaultSeasonConfig } from '#shared/defaults/season';
import { getExactStartDate, getKnownStartDate } from '#shared/matchLabels';
import { DAY_MS } from '#shared/timeUtils';
import type {
  StatsBucketContext,
  StatsBucketMatch,
  StatsSeason,
  StatsSessionState,
} from '#shared/types/stats/bucket';

const SESSION_INDEX_PAD = 3;

const NO_SEASON_BUCKET_KEY = 'NONE';
const NO_TABLE_SESSION_KEY = 'NONE';

const dayFormats = new Map<string, Intl.DateTimeFormat>();

function getDayFormat(timeZone: string): Intl.DateTimeFormat {
  const cached = dayFormats.get(timeZone);

  if (cached !== undefined) return cached;

  const format = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  dayFormats.set(timeZone, format);

  return format;
}

export function getStatsDayKey(date: Date, timeZone: string): string {
  const parts = Object.fromEntries(
    getDayFormat(timeZone)
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );

  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getStatsDayIndex(dayKey: string): number {
  return Date.parse(`${dayKey}T00:00:00Z`) / DAY_MS;
}

export function getStatsWeekKey(dayKey: string): string {
  const date = new Date(`${dayKey}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));

  return date.toISOString().slice(0, 10);
}

function parseSessionKey(
  key: string | null,
): [dayKey: string, index: number] | null {
  const [dayKey, index] = key?.split('#') ?? [];

  if (dayKey === undefined || index === undefined) return null;

  return [dayKey, Number.parseInt(index, 10)];
}

export function formatStatsSessionKey(key: string): string {
  const session = parseSessionKey(key);

  if (session === null) return key;

  return `${session[0]} #${session[1]}`;
}

export function formatStatsWeekKey(key: string): string {
  const thursday = new Date(`${key}T00:00:00Z`);

  thursday.setUTCDate(thursday.getUTCDate() + 3);

  const year = thursday.getUTCFullYear();
  const dayOfYear = (thursday.getTime() - Date.UTC(year, 0, 1)) / DAY_MS;
  const week = Math.floor(dayOfYear / 7) + 1;

  return `${year}-W${week.toString().padStart(2, '0')}`;
}

export function formatStatsMonthKey(key: string): string {
  return key.replace('-', '-M');
}

export function getStatsSessionTableKey(
  match: Pick<StatsBucketMatch, 'tableUuid'>,
): string {
  return match.tableUuid ?? NO_TABLE_SESSION_KEY;
}

function getSessionIndex(
  previous: [dayKey: string, index: number] | null,
  dayKey: string,
  isSameSession: boolean,
): number {
  if (previous === null || previous[0] !== dayKey) return 1;

  return isSameSession ? previous[1] : previous[1] + 1;
}

export function getStatsMatchSpan(
  match: Pick<StatsBucketMatch, 'duration' | 'pauseDuration'>,
): number {
  return (match.duration ?? 0) + match.pauseDuration;
}

export function getStatsMatchEnd(match: StatsBucketMatch): number | null {
  const startDate = getExactStartDate(match);

  if (startDate === null) return null;

  return startDate.getTime() + getStatsMatchSpan(match);
}

export function getStatsSeason(
  match: Pick<StatsBucketMatch, 'startDate' | 'labels'>,
  seasons: StatsSeason[],
): StatsSeason | null {
  const startDate = getKnownStartDate(match);

  if (startDate === null) return null;

  return (
    seasons.find(
      (season) => startDate >= season.startDate && startDate < season.endDate,
    ) ?? null
  );
}

export function getStatsSessionKey(
  match: StatsBucketMatch,
  context: StatsBucketContext,
): string | null {
  const startDate = getExactStartDate(match);

  if (startDate === null) return null;

  const table = getStatsSessionTableKey(match);
  const previousSession = context.sessions[table] ?? null;

  const dayKey = getStatsDayKey(startDate, context.timeZone);
  const previous = parseSessionKey(previousSession?.key ?? null);
  const sessionGap = (context.season?.config ?? defaultSeasonConfig).sessionGap;

  const isSameSession =
    previous !== null &&
    previous[0] === dayKey &&
    previousSession !== null &&
    startDate.getTime() - previousSession.matchEnd <= sessionGap;

  const index = getSessionIndex(previous, dayKey, isSameSession);

  return `${dayKey}#${index.toString().padStart(SESSION_INDEX_PAD, '0')}#${table}`;
}

export function getStatsSeasonKey(
  match: StatsBucketMatch,
  season: StatsSeason | null,
  previous: string | null,
): string {
  if (season !== null) return season.uuid;

  return previous?.startsWith(NO_SEASON_BUCKET_KEY)
    ? previous
    : `${NO_SEASON_BUCKET_KEY}#${match.uuid}`;
}

export function getStatsSessionKeys(
  matches: StatsBucketMatch[],
  timeZone: string,
  seasons: StatsSeason[],
): Map<string, string> {
  const keys = new Map<string, string>();
  const sessions: Record<string, StatsSessionState> = {};

  for (const match of matches) {
    const key = getStatsSessionKey(match, {
      timeZone,
      season: getStatsSeason(match, seasons),
      sessions,
    });
    const matchEnd = getStatsMatchEnd(match);

    if (key === null || matchEnd === null) continue;

    keys.set(match.uuid, key);
    sessions[getStatsSessionTableKey(match)] = {
      key,
      matchEnd,
      players: {},
    };
  }

  return keys;
}
