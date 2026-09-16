import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import weekOfYear from 'dayjs/plugin/weekOfYear';

dayjs.extend(duration);
dayjs.extend(weekOfYear);

export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds < 0) {
    return '--:--';
  }

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

export function formatDurationMs(ms: number | null): string {
  return formatDuration(ms === null ? null : Math.round(msToSeconds(ms)));
}

export function formatDate(timestamp: number | null): string {
  if (timestamp === null) {
    return '----/--/--';
  }

  return dayjs.unix(timestamp).format('YYYY-MM-DD');
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
