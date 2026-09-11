import z from 'zod';
import { getLabelValue } from '#shared/labels';
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

export function getKnownStartDate(
  match: Match & { startDate: Date },
): Date | null {
  return hasKnownStartDate(match) ? match.startDate : null;
}

export function getExactStartDate(
  match: Match & { startDate: Date },
): Date | null {
  return hasExactStartDate(match) ? match.startDate : null;
}
