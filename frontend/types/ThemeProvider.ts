import z from 'zod';
import { TimeZone } from '#shared/zod';

export const ThemeEnum = {
  DEFAULT: 'DEFAULT',
  CHRISTMAS: 'CHRISTMAS',
} as const;

export const Theme = z.enum(ThemeEnum);
export type Theme = z.infer<typeof Theme>;

export const ThemePreferenceEnum = {
  AUTO: 'AUTO',
  ...ThemeEnum,
} as const;

export const ThemePreference = z.enum(ThemePreferenceEnum);
export type ThemePreference = z.infer<typeof ThemePreference>;

export type ThemeSlotName = 'widget' | 'modal' | 'logo' | 'sidebar';

export type ThemeSlots = Partial<Record<ThemeSlotName, ParentComponent>>;

export interface ThemeEffectOrigin {
  x: number; // percent of the viewport width
  y: number; // percent of the viewport height
}

export interface ThemeEffectProps {
  origin: ThemeEffectOrigin | null;
  onDone: () => void;
}

export interface ThemeDecorations {
  layers?: Component[];
  slots?: ThemeSlots;
  spinnerFrames?: string[];
}

export interface ThemePhase {
  name: string;
  hours: [start: number, end: number];
}

export type ThemeMonthDay = [month: number, day: number];

export interface ThemeWindow {
  start: ThemeMonthDay;
  end: ThemeMonthDay;
  peak?: ThemeMonthDay;
}

export interface ThemeDefinition {
  label: string;
  browserColor: string;
  window?: ThemeWindow;
  phases?: ThemePhase[];
  loadDecorations?: () => Promise<ThemeDecorations>;
}

export const ThemeCookies = z.object({
  theme: ThemePreference.catch(ThemePreferenceEnum.DEFAULT),
  themeDecorations: z.stringbool().catch(true),
  themeTimeZone: TimeZone.nullable().catch(null),
});
export type ThemeCookies = z.infer<typeof ThemeCookies>;
