import z from 'zod';
import { getLabelValue } from '#shared/labels';
import { formatDate, formatDatetime, formatTime } from '#shared/timeUtils';
import type { Match } from '#shared/types/api/match';

type DatedMatch = Pick<Match, 'startDate' | 'labels'>;

export const StartDatePrecisionEnum = {
  NONE: 'NONE',
  DAY: 'DAY',
  EXACT: 'EXACT',
} as const;

export const StartDatePrecision = z.enum(StartDatePrecisionEnum);
export type StartDatePrecision = z.infer<typeof StartDatePrecision>;

export const START_DATE_PRECISION_LABEL = 'startDatePrecision';

export function getStartDatePrecision(match: DatedMatch): StartDatePrecision {
  if (match.startDate === null) return StartDatePrecisionEnum.NONE;

  try {
    return getLabelValue(
      match,
      START_DATE_PRECISION_LABEL,
      StartDatePrecision,
      StartDatePrecisionEnum.EXACT,
    );
  } catch {
    return StartDatePrecisionEnum.EXACT;
  }
}

export function hasKnownStartDate(match: DatedMatch): boolean {
  return getStartDatePrecision(match) !== StartDatePrecisionEnum.NONE;
}

export function hasExactStartDate(match: DatedMatch): boolean {
  return getStartDatePrecision(match) === StartDatePrecisionEnum.EXACT;
}

export function getKnownStartDate(match: DatedMatch): Date | null {
  return hasKnownStartDate(match) ? match.startDate : null;
}

export function getExactStartDate(match: DatedMatch): Date | null {
  return hasExactStartDate(match) ? match.startDate : null;
}

export function formatKnownStartDate(
  match: DatedMatch,
  timeZone?: string,
): string {
  return formatDate(getKnownStartDate(match), timeZone);
}

export function formatExactStartTime(
  match: DatedMatch,
  timeZone?: string,
): string {
  return formatTime(getExactStartDate(match), timeZone);
}

export function formatKnownStartDatetime(
  match: DatedMatch,
  timeZone?: string,
): string {
  return formatDatetime(getKnownStartDate(match), timeZone);
}
