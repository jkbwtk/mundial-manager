import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SupportedMaterialSymbol } from '../src/lib/supportedMaterialSymbols';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0';

const url = `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=${SupportedMaterialSymbol.toSorted().join(',')}`;

const fontsOutDir = join(__dirname, '../src/assets/fonts');

const fontPath = join(fontsOutDir, 'MaterialSymbolsRounded.woff2');

const css = await fetch(url, {
  headers: {
    'User-Agent': userAgent,
  },
}).then((response) => response.text());

const fontUrl = css.match(/url\(([^)]+)\)/)?.[1];

if (!fontUrl) {
  throw new Error('Could not find font URL in CSS');
}

const font = await fetch(fontUrl, {
  headers: {
    'User-Agent': userAgent,
  },
}).then((response) => response.blob());

mkdirSync(fontsOutDir, { recursive: true });
await writeFile(fontPath, Buffer.from(await font.arrayBuffer()));
