import {
  Theme,
  ThemeCookies,
  type ThemeDefinition,
  ThemeEnum,
  type ThemeMonthDay,
  type ThemePreference,
  type ThemeWindow,
} from '#frontend/types';
import { DAY_MS, type ZonedCalendar } from '#shared/timeUtils';

export const THEME_DEFAULT_PHASE = 'default';
const THEME_COOKIE_MAX_AGE_MS = 365 * DAY_MS;

export const ThemeDefinitions: Record<Theme, ThemeDefinition> = {
  DEFAULT: {
    label: 'Default',
    browserColor: '#a62130',
  },
};

export const ThemePreferenceLabels: Record<ThemePreference, string> = {
  AUTO: 'Auto',
  DEFAULT: ThemeDefinitions.DEFAULT.label,
};

function getDate(year: number, [month, day]: ThemeMonthDay): number {
  return Date.UTC(year, month - 1, day);
}

export function getSeasonFraction(
  window: ThemeWindow,
  now: ZonedCalendar,
): number | null {
  const today = getDate(now.year, [now.month, now.day]);
  const year =
    getDate(now.year, window.start) <= today ? now.year : now.year - 1;
  const start = getDate(year, window.start);

  const msSinceStart = (monthDay: ThemeMonthDay) => {
    const date = getDate(year, monthDay);

    return (date < start ? getDate(year + 1, monthDay) : date) - start;
  };

  const elapsed = today - start;
  if (elapsed > msSinceStart(window.end)) return null;

  return Math.min(
    1,
    elapsed / Math.max(DAY_MS, msSinceStart(window.peak ?? window.end)),
  );
}

export function resolveTheme(
  preference: ThemePreference,
  now: ZonedCalendar,
): Theme {
  if (preference !== 'AUTO') return preference;

  const seasonal = Theme.options.find((theme) => {
    const window = ThemeDefinitions[theme].window;

    return window !== undefined && getSeasonFraction(window, now) !== null;
  });

  return seasonal ?? ThemeEnum.DEFAULT;
}

export function getThemePhase(theme: Theme, now: ZonedCalendar): string | null {
  const phase = ThemeDefinitions[theme].phases?.find(
    ({ hours: [start, end] }) =>
      start <= end
        ? now.hour >= start && now.hour < end
        : now.hour >= start || now.hour < end,
  );

  return phase?.name ?? null;
}

export function readThemeCookies(header: string | undefined): ThemeCookies {
  const entries = (header ?? '').split(';').map((cookie) => {
    const separator = cookie.indexOf('=');

    return [cookie.slice(0, separator).trim(), cookie.slice(separator + 1)];
  });

  return ThemeCookies.parse(Object.fromEntries(entries));
}

export function setThemeCookie(name: keyof ThemeCookies, value: string): void {
  cookieStore
    .set({
      name,
      value,
      path: '/',
      sameSite: 'lax',
      expires: Date.now() + THEME_COOKIE_MAX_AGE_MS,
    })
    .catch((err) => {
      console.error('Failed to save theme cookie', err);
    });
}
