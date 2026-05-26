import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  MaterialSymbolCodepoints,
  SegmentedMaterialSymbols,
} from '#flib/supportedMaterialSymbols';
import { logger } from '#shared/logger';
import { enumerate } from '#shared/utils';
import { projectRoot } from '#tools/cli-utils';

interface MaterialSymbolGroupFragment {
  name: string;
  index: number;
  codes: string[];
}

const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0';

const baseUrl =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=';

function getCSSUrl(symbols: readonly string[]): string {
  return baseUrl + symbols.toSorted().join(',');
}

function getFontName(groupName: string, index: number): string {
  return `MaterialSymbolsRounded-${groupName}-${index}`;
}

function getFontPath(
  fontsOutDir: string,
  groupName: string,
  index: number,
): string {
  return join(fontsOutDir, `${getFontName(groupName, index)}.woff2`);
}

export async function fetchIcons(): Promise<void> {
  const fontsOutDir = join(projectRoot, 'frontend', 'assets', 'fonts');
  const cssOutPath = join(
    projectRoot,
    'frontend',
    'styles',
    'materialSymbols.scss',
  );

  logger.debug('Using User-Agent: %s', userAgent, {
    label: ['cli', 'fetch', 'icons'],
  });

  mkdirSync(fontsOutDir, { recursive: true });

  const fragments: MaterialSymbolGroupFragment[] = [];

  for (const [name, group] of Object.entries(SegmentedMaterialSymbols)) {
    for (const [index, fragment] of enumerate([...group])) {
      const symbols = [...fragment];
      const url = getCSSUrl(symbols);
      const fontPath = getFontPath(fontsOutDir, name, index);

      logger.debug('Fetching CSS from: %s', url, {
        label: ['cli', 'fetch', 'icons'],
      });

      const css = await fetch(url, {
        headers: { 'User-Agent': userAgent },
      }).then((response) => response.text());

      const fontUrl = css.match(/url\(([^)]+)\)/)?.[1];

      if (!fontUrl) {
        logger.error('Could not find font URL in CSS', {
          label: ['cli', 'fetch', 'icons'],
        });
        throw new Error('Could not find font URL in CSS');
      }

      logger.debug('Fetching font from: %s', fontUrl, {
        label: ['cli', 'fetch', 'icons'],
      });

      const font = await fetch(fontUrl, {
        headers: { 'User-Agent': userAgent },
      }).then((response) => response.blob());

      logger.debug('Saving font to: %s', fontPath, {
        label: ['cli', 'fetch', 'icons'],
      });

      await writeFile(fontPath, Buffer.from(await font.arrayBuffer()));

      logger.info('Material Symbols font saved to %s', fontPath, {
        label: ['cli', 'fetch', 'icons'],
      });

      fragments.push({
        name,
        index,
        codes: symbols.map(
          (symbol) =>
            MaterialSymbolCodepoints[
              symbol as keyof typeof MaterialSymbolCodepoints
            ],
        ),
      });
    }
  }

  const subsetFontFaceContent = fragments
    .map(
      ({ name, index, codes }) => `@font-face {
  font-family: 'Material Symbols Rounded';
  font-style: normal;
  font-weight: 100 700;
  src: url(/frontend/assets/fonts/${getFontName(name, index)}.woff2) format('woff2');\
${fragments.length > 1 ? `\n  unicode-range: ${codes.map((code) => `U+${code.toUpperCase()}`).join(', ')}` : ''}
}
`,
    )
    .join('\n\n');

  logger.debug('Saving Material Symbols CSS to: %s', cssOutPath, {
    label: ['cli', 'fetch', 'icons'],
  });

  await writeFile(cssOutPath, subsetFontFaceContent);

  logger.info('Material Symbols CSS saved to %s', cssOutPath, {
    label: ['cli', 'fetch', 'icons'],
  });
}
