import type { MatchSide } from '#shared/types/api/matchEvent';
import type { Table } from '#shared/types/api/table';
import variables from '#styles/variables.module.scss';

const SubjectHueOffsets = [
  0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
];
const SubjectSaturations = [70, 85, 100];
const SubjectLightnesses = [50, 60, 70, 80];

function hashString(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
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
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
  } else if (h >= 120 && h < 180) {
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    b = x;
  }

  const toHex = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getTableSideColor(
  table: Pick<Table, 'side1Color' | 'side2Color'> | null | undefined,
  side: MatchSide,
): string {
  if (!table) return variables.gray;

  return side === 'SIDE_1' ? table.side1Color : table.side2Color;
}

export function getSubjectColor(value: string): string {
  const hash = hashString(value);

  const hue = (SubjectHueOffsets[hash % 12]! + ((hash >> 4) % 25) + 90) % 360;
  const saturation =
    SubjectSaturations[(hash >> 8) % SubjectSaturations.length]!;
  const lightness =
    SubjectLightnesses[(hash >> 12) % SubjectLightnesses.length]!;

  return hslToHex(hue, saturation, lightness);
}
