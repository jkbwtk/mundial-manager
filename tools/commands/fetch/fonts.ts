import { mkdirSync, readdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import fontverter from 'fontverter';
import hbPromise from 'harfbuzzjs';
import subsetFont from 'subset-font';
import { logger } from '#shared/logger';
import { projectRoot } from '#tools/cli-utils';

type CodePointRange = [from: number, to: number];

interface FontFaceConfig {
  file: string;
  family: string;
  weight: number;
  style: 'normal' | 'italic';
}

interface FontSubset {
  name: string;
  ranges: CodePointRange[];
}

const CoreRanges: CodePointRange[] = [
  [0x0020, 0x007e], // Basic Latin
  [0x00a0, 0x017f], // Latin-1, Latin Extended-A (Polish names)
  [0x0218, 0x021b], // Latin Extended-B: ș ț
  [0x0394, 0x0394], // Δ
  [0x2000, 0x206f], // General Punctuation
  [0x2070, 0x208f], // Superscripts and Subscripts
  [0x20ac, 0x20ac], // €
  [0x2122, 0x2122], // ™
  [0x2190, 0x2199], // Simple arrows
  [0x2212, 0x2212], // −
  [0x2500, 0x257f], // Box Drawing
  [0x25c8, 0x25c8], // ◈
  [0x27e6, 0x27ef], // Mathematical brackets ⟪ ⟫
  [0xfffd, 0xfffd], // Replacement character
];

const FontFaces: FontFaceConfig[] = [
  {
    file: 'JetBrainsMono-Regular.woff2',
    family: 'JetBrains Mono',
    weight: 400,
    style: 'normal',
  },
  {
    file: 'JetBrainsMono-Bold.woff2',
    family: 'JetBrains Mono',
    weight: 700,
    style: 'normal',
  },
  {
    file: 'JetBrainsMono-Italic.woff2',
    family: 'JetBrains Mono',
    weight: 400,
    style: 'italic',
  },
  {
    file: 'JetBrainsMono-BoldItalic.woff2',
    family: 'JetBrains Mono',
    weight: 700,
    style: 'italic',
  },
];

function isInRanges(codePoint: number, ranges: CodePointRange[]): boolean {
  return ranges.some(([from, to]) => codePoint >= from && codePoint <= to);
}

function convertToRanges(codePoints: number[]): CodePointRange[] {
  const ranges: CodePointRange[] = [];

  for (const codePoint of codePoints.toSorted((a, b) => a - b)) {
    const last = ranges.at(-1);

    if (last && last[1] + 1 === codePoint) {
      last[1] = codePoint;
    } else {
      ranges.push([codePoint, codePoint]);
    }
  }

  return ranges;
}

function formatHex(value: number): string {
  return value.toString(16).toUpperCase();
}

function formatUnicodeRange(ranges: CodePointRange[]): string {
  return ranges
    .map(([from, to]) =>
      from === to
        ? `U+${formatHex(from)}`
        : `U+${formatHex(from)}-${formatHex(to)}`,
    )
    .join(', ');
}

function getRangesText(ranges: CodePointRange[]): string {
  return ranges
    .flatMap(([from, to]) =>
      Array.from({ length: to - from + 1 }, (_, index) =>
        String.fromCodePoint(from + index),
      ),
    )
    .join('');
}

async function getFontCodePoints(font: Buffer): Promise<number[]> {
  const hb = await hbPromise;
  const sfnt = await fontverter.convert(font, 'sfnt');

  const blob = hb.createBlob(sfnt);
  const face = hb.createFace(blob, 0);

  try {
    return [...face.collectUnicodes()].filter((codePoint) => codePoint >= 0x20);
  } finally {
    face.destroy();
    blob.destroy();
  }
}

function getSubsetFileName(file: string, subset: string): string {
  return `${basename(file, '.woff2')}-${subset}.woff2`;
}

function getFontFaceRule(
  face: FontFaceConfig,
  file: string,
  ranges: CodePointRange[],
): string {
  return `@font-face {
  font-family: '${face.family}';
  font-weight: ${face.weight};
  font-style: ${face.style};
  font-display: swap;
  src: url(/frontend/assets/fonts/${file}) format('woff2');
  unicode-range: ${formatUnicodeRange(ranges)};
}
`;
}

export async function fetchFonts(): Promise<void> {
  const fontsInDir = join(projectRoot, 'resources', 'fonts');
  const fontsOutDir = join(projectRoot, 'frontend', 'assets', 'fonts');
  const cssOutPath = join(projectRoot, 'frontend', 'styles', 'fontFaces.scss');

  mkdirSync(fontsOutDir, { recursive: true });

  const available = new Set(readdirSync(fontsInDir));
  const rules: string[] = [];

  for (const face of FontFaces) {
    if (!available.has(face.file)) {
      throw new Error(`Font source not found: ${face.file}`);
    }

    const source = await readFile(join(fontsInDir, face.file));
    const codePoints = await getFontCodePoints(source);

    const subsets: FontSubset[] = [
      {
        name: 'core',
        ranges: convertToRanges(
          codePoints.filter((codePoint) => isInRanges(codePoint, CoreRanges)),
        ),
      },
      {
        name: 'rest',
        ranges: convertToRanges(
          codePoints.filter((codePoint) => !isInRanges(codePoint, CoreRanges)),
        ),
      },
    ];

    for (const subset of subsets) {
      if (subset.ranges.length === 0) continue;

      const output = await subsetFont(source, getRangesText(subset.ranges), {
        targetFormat: 'woff2',
      });
      const file = getSubsetFileName(face.file, subset.name);

      await writeFile(join(fontsOutDir, file), output);

      logger.info(
        'Font subset %s saved (%d bytes, %d ranges, %d%%)',
        file,
        output.length,
        subset.ranges.length,
        Math.round((output.length / source.length || 1) * 100),
        { label: ['cli', 'fetch', 'fonts'] },
      );

      rules.push(getFontFaceRule(face, file, subset.ranges));
    }
  }

  await writeFile(cssOutPath, rules.join('\n'));

  logger.info('Font faces saved to %s', cssOutPath, {
    label: ['cli', 'fetch', 'fonts'],
  });
}
