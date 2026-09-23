import z from 'zod';
import { getLabelValue } from '#shared/labels';
import { formatDate } from '#shared/timeUtils';
import type { Match } from '#shared/types/api/match';

export const StartDatePrecisionEnum = {
  NONE: 'NONE',
  DAY: 'DAY',
  EXACT: 'EXACT',
} as const;

export const StartDatePrecision = z.enum(StartDatePrecisionEnum);
export type StartDatePrecision = z.infer<typeof StartDatePrecision>;

export const START_DATE_PRECISION_LABEL = 'startDatePrecision';

export function getStartDatePrecision(match: Match): StartDatePrecision {
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

export function hasKnownStartDate(match: Match): boolean {
  return getStartDatePrecision(match) !== StartDatePrecisionEnum.NONE;
}

export function hasExactStartDate(match: Match): boolean {
  return getStartDatePrecision(match) === StartDatePrecisionEnum.EXACT;
}

export function getKnownStartDate(match: Match): Date | null {
  return hasKnownStartDate(match) ? match.startDate : null;
}

export function getExactStartDate(match: Match): Date | null {
  return hasExactStartDate(match) ? match.startDate : null;
}

export function formatKnownStartDate(match: Match): string {
  const startDate = getKnownStartDate(match);

  return formatDate(startDate === null ? null : startDate.getTime() / 1000);
}
