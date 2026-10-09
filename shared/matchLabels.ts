import z from 'zod';
import { getLabelValue } from '#shared/labels';
import { formatDate, formatDatetime, formatTimeMs } from '#shared/timeUtils';
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

export function formatKnownStartDate(match: DatedMatch): string {
  const startDate = getKnownStartDate(match);

  return formatDate(startDate === null ? null : startDate.getTime() / 1000);
}

export function formatExactStartTime(match: DatedMatch): string {
  return formatTimeMs(getExactStartDate(match)?.getTime() ?? null);
}

export function formatKnownStartDatetime(match: DatedMatch): string {
  const startDate = getKnownStartDate(match);

  return formatDatetime(startDate === null ? null : startDate.getTime() / 1000);
}
