import { getExtension } from '#lib/fileUtils';
import type { SupportedMaterialSymbol } from '#lib/supportedMaterialSymbols';

const extensionMap: Partial<Record<SupportedMaterialSymbol, string[]>> = {
  description: ['txt'],
  music_note: ['mp3', 'flac', 'wav', 'ogg'],
  movie: ['mp4', 'mkv', 'mov'],
};

function transformExtensions() {
  const pairs: [string, SupportedMaterialSymbol][] = [];

  for (const [symbol, extensions] of Object.entries(extensionMap)) {
    for (const extension of extensions) {
      pairs.push([extension, symbol as SupportedMaterialSymbol]);
    }
  }

  return Object.fromEntries(pairs);
}

const extensionSymbols = transformExtensions();

export function mapExtensionToSymbol(
  filename: string,
): SupportedMaterialSymbol {
  const symbol = extensionSymbols[getExtension(filename)];
  return symbol !== undefined ? symbol : 'draft';
}
