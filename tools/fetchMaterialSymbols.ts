import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MaterialSymbolCodepoints,
  SegmentedMaterialSymbols,
} from '#flib/supportedMaterialSymbols';
import { logger } from '#shared/logger';
import { enumerate } from '#shared/utils';

logger.info('Fetching Material Symbols font...', {
  label: 'fetchMaterialSymbols',
});

interface MaterialSymbolGroupFragment {
  name: string;
  index: number;
  codes: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0';

const baseUrl =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=';

const fontsOutDir = join(__dirname, '../frontend/assets/fonts');

logger.debug('Using User-Agent: %s', userAgent, {
  label: 'fetchMaterialSymbols',
});

function getCSSUrl(symbols: readonly string[]): string {
  const url = baseUrl + symbols.toSorted().join(',');

  logger.debug('Fetching CSS from: %s', url, {
    label: 'fetchMaterialSymbols',
  });

  return url;
}

function getFontName(groupName: string, index: number): string {
  return `MaterialSymbolsRounded-${groupName}-${index}`;
}

function getFontPath(groupName: string, index: number): string {
  const fontPath = join(fontsOutDir, `${getFontName(groupName, index)}.woff2`);

  logger.debug('Font path: %s', fontPath, {
    label: 'fetchMaterialSymbols',
  });

  return fontPath;
}

mkdirSync(fontsOutDir, { recursive: true });

const fragments: MaterialSymbolGroupFragment[] = [];

for (const [name, group] of Object.entries(SegmentedMaterialSymbols)) {
  for (const [index, fragment] of enumerate([...group])) {
    const symbols = [...fragment];
    const url = getCSSUrl(symbols);
    const fontPath = getFontPath(name, index);

    const css = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
      },
    }).then((response) => response.text());

    const fontUrl = css.match(/url\(([^)]+)\)/)?.[1];

    if (!fontUrl) {
      logger.error('Could not find font URL in CSS', {
        label: 'fetchMaterialSymbols',
      });

      throw new Error('Could not find font URL in CSS');
    }

    const font = await fetch(fontUrl, {
      headers: {
        'User-Agent': userAgent,
      },
    }).then((response) => response.blob());

    await writeFile(fontPath, Buffer.from(await font.arrayBuffer()));

    logger.info('Material Symbols font saved to %s', fontPath, {
      label: 'fetchMaterialSymbols',
    });

    fragments.push({
      name,
      index,
      codes: symbols.map((symbol) => MaterialSymbolCodepoints[symbol]),
    });
  }
}

const subsetFontFaceContent = fragments
  .map(
    ({ name, index, codes }) => `@font-face {
  font-family: 'Material Symbols Rounded';
  font-style: normal;
  font-weight: 100 700;
  src: url(/frontend/assets/fonts/${getFontName(name, index)}.woff2) format('woff2');
  unicode-range: ${codes.map((code) => `U+${code.toUpperCase()}`).join(', ')};
}`,
  )
  .join('\n\n');

const cssContent = subsetFontFaceContent;

const cssOutPath = join(__dirname, '../frontend/styles/materialSymbols.scss');
await writeFile(cssOutPath, cssContent);

logger.info('Material Symbols CSS saved to %s', cssOutPath, {
  label: 'fetchMaterialSymbols',
});
