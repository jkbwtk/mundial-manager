import dayjs, { type Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(duration);
dayjs.extend(weekOfYear);
dayjs.extend(utc);
dayjs.extend(timezone);

export const DAY_MS = 86_400_000;

type ZonedPartType = 'year' | 'month' | 'day' | 'hour' | 'minute' | 'second';

type ZonedParts = Record<ZonedPartType, string>;

const LOCAL_TIME_ZONE_KEY = '';

const zonedFormats = new Map<string, Intl.DateTimeFormat>();

function getZonedFormat(timeZone?: string): Intl.DateTimeFormat {
  const key = timeZone ?? LOCAL_TIME_ZONE_KEY;
  const cached = zonedFormats.get(key);

  if (cached !== undefined) return cached;

  const format = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  zonedFormats.set(key, format);

  return format;
}

function getZonedParts(
  timestamp: Date | number, // epoch milliseconds when a number
  timeZone?: string,
): ZonedParts {
  const parts = {} as ZonedParts;

  for (const part of getZonedFormat(timeZone).formatToParts(timestamp)) {
    if (part.type !== 'literal') parts[part.type as ZonedPartType] = part.value;
  }

  return parts;
}

export function toZonedDayjs(
  date: Date | number | Dayjs, // epoch milliseconds when a number
  timeZone?: string,
): Dayjs {
  const value = dayjs(date);

  return timeZone ? value.tz(timeZone) : value;
}

export function addZonedDays(
  date: Date | number,
  days: number,
  timeZone?: string,
): Date {
  const wallTime = toZonedDayjs(date, timeZone)
    .add(days, 'day')
    .format('YYYY-MM-DDTHH:mm:ss.SSS');

  return dayjs.tz(wallTime, timeZone).toDate();
}

export function formatDuration(ms: number | null): string {
  if (ms === null || ms < 0) {
    return '--:--';
  }

  const seconds = Math.round(msToSeconds(ms));

  if (seconds < 3600) {
    return dayjs.duration(seconds, 'seconds').format('mm:ss');
  }

  if (seconds < 86400) {
    return dayjs.duration(seconds, 'seconds').format('HH:mm:ss');
  }

  const durationObj = dayjs.duration(seconds, 'seconds');
  const hours = durationObj.asHours();

  return `${Math.floor(hours)}:${durationObj.format('mm:ss')}`;
}

export function formatDate(
  timestamp: Date | number | null, // epoch milliseconds when a number
  timeZone?: string,
): string {
  if (timestamp === null) {
    return '----/--/--';
  }

  const { year, month, day } = getZonedParts(timestamp, timeZone);

  return `${year}-${month}-${day}`;
}

export function formatTime(
  timestamp: Date | number | null, // epoch milliseconds when a number
  timeZone?: string,
): string {
  if (timestamp === null) {
    return '--:--';
  }

  const { hour, minute } = getZonedParts(timestamp, timeZone);

  return `${hour}:${minute}`;
}

export function formatDatetime(
  timestamp: Date | number | null, // epoch milliseconds when a number
  timeZone?: string,
): string {
  if (timestamp === null) {
    return '----/--/-- --:--:--';
  }

  const { year, month, day, hour, minute, second } = getZonedParts(
    timestamp,
    timeZone,
  );

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export function secondsToMs<T extends number | null | undefined>(
  seconds: T,
): T extends number ? number : T {
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  return (seconds == null ? seconds : seconds * 1000) as any;
}

export function msToSeconds<T extends number | null | undefined>(
  ms: T,
): T extends number ? number : T {
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  return (ms == null ? ms : ms / 1000) as any;
}

export function daysToMs<T extends number | null | undefined>(
  days: T,
): T extends number ? number : T {
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  return (days == null ? days : days * DAY_MS) as any;
}

export function msToDays<T extends number | null | undefined>(
  ms: T,
): T extends number ? number : T {
  // biome-ignore lint/suspicious/noExplicitAny: yeah
  return (ms == null ? ms : ms / DAY_MS) as any;
}

const validTimeZones = new Set<string>();

export function isValidTimeZone(timeZone: string): boolean {
  if (validTimeZones.has(timeZone)) return true;

  try {
    new Intl.DateTimeFormat('en', { timeZone });
    validTimeZones.add(timeZone);

    return true;
  } catch {
    return false;
  }
}
