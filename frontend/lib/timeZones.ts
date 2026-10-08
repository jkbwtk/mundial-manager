import type { DropdownOption } from '#components/Dropdown';

export const timeZoneOptions: DropdownOption[] = [
  ...new Set(['UTC', ...Intl.supportedValuesOf('timeZone')]),
].map((timeZone) => ({
  label: timeZone.replaceAll('_', ' '),
  value: timeZone,
}));

export function getBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
