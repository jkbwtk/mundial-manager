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

export function toZonedDayjs(
  date: Date | number | Dayjs, // epoch milliseconds when a number
  timeZone?: string,
): Dayjs {
  const value = dayjs(date);

  return timeZone ? value.tz(timeZone) : value;
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

  return toZonedDayjs(timestamp, timeZone).format('YYYY-MM-DD');
}

export function formatTime(
  timestamp: Date | number | null, // epoch milliseconds when a number
  timeZone?: string,
): string {
  if (timestamp === null) {
    return '--:--';
  }

  return toZonedDayjs(timestamp, timeZone).format('HH:mm');
}

export function formatDatetime(
  timestamp: Date | number | null, // epoch milliseconds when a number
  timeZone?: string,
): string {
  if (timestamp === null) {
    return '----/--/-- --:--:--';
  }

  return toZonedDayjs(timestamp, timeZone).format('YYYY-MM-DD HH:mm:ss');
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

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone });

    return true;
  } catch {
    return false;
  }
}
