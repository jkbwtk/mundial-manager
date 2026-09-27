import { readFile } from 'node:fs/promises';
import z from 'zod';

const ViteManifest = z.record(
  z.string(),
  z.object({
    file: z.string(),
    isEntry: z.boolean().optional(),
    imports: z.array(z.string()).optional(),
  }),
);
type ViteManifest = z.infer<typeof ViteManifest>;

function collectImports(
  manifest: ViteManifest,
  key: string,
  target: Set<string>,
): void {
  const chunk = manifest[key];

  if (target.has(key) || chunk === undefined) return;

  target.add(key);

  for (const imported of chunk.imports ?? []) {
    collectImports(manifest, imported, target);
  }
}

export async function createModulePreloader(manifestPath: string) {
  const manifest = ViteManifest.parse(
    JSON.parse(await readFile(manifestPath, 'utf-8')),
  );

  const entryChunks = new Set<string>();

  for (const [key, chunk] of Object.entries(manifest)) {
    if (chunk.isEntry) collectImports(manifest, key, entryChunks);
  }

  const cache = new Map<string, string>();

  return (modules: string[]): string => {
    const cacheKey = modules.toSorted().join(',');
    const cached = cache.get(cacheKey);

    if (cached !== undefined) return cached;

    const chunks = new Set<string>();

    for (const module of modules) {
      collectImports(manifest, module, chunks);
    }

    const links = [...chunks]
      .filter((key) => !entryChunks.has(key))
      .map(
        (key) =>
          `<link rel="modulepreload" crossorigin href="/${manifest[key]?.file}">`,
      )
      .join('');

    cache.set(cacheKey, links);

    return links;
  };
}
