import { normalizeTeamName } from '#shared/matchUtils';

export function getPlayersFromTeam(team: string): string[] {
  return team.split(/\s+/g).sort();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const rHex = Math.round((r + m) * 255)
    .toString(16)
    .padStart(2, '0');
  const gHex = Math.round((g + m) * 255)
    .toString(16)
    .padStart(2, '0');
  const bHex = Math.round((b + m) * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${rHex}${gHex}${bHex}`;
}

export function generateTeamColor(team: string): string {
  const normalizedTeamName = normalizeTeamName(team);
  const hash = hashString(normalizedTeamName);

  const hueBase = hash % 12;
  const hueOffsets = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const hue = (hueOffsets[hueBase]! + ((hash >> 4) % 25) + 90) % 360;

  const saturationOptions = [70, 85, 100];
  const lightnessOptions = [50, 60, 70, 80];

  const satIndex = (hash >> 8) % saturationOptions.length;
  const lightIndex = (hash >> 12) % lightnessOptions.length;

  const saturation = saturationOptions[satIndex]!;
  const lightness = lightnessOptions[lightIndex]!;

  return hslToHex(hue, saturation, lightness);
}
