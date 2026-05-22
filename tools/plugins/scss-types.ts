import { existsSync, statSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { camelCase } from 'change-case';
import postcss from 'postcss';
import PostcssModulesPlugin from 'postcss-modules';
import { compileStringAsync } from 'sass-embedded';
import type { Plugin } from 'vite';

interface ScssTypesPluginOptions {
  /**
   * Root directory to scan for SCSS files
   * @default 'src'
   */
  rootDir?: string;
  /**
   * Watch mode - regenerate types on file changes
   * @default true in dev mode
   */
  watch?: boolean;
  /**
   * Pattern to match SCSS module files
   * @default /\.module\.scss$/
   */
  pattern?: RegExp;
}

const DEFAULT_PATTERN = /\.module\.scss$/;

export function scssTypesPlugin(options: ScssTypesPluginOptions = {}): Plugin {
  const { rootDir = 'src', watch = true, pattern = DEFAULT_PATTERN } = options;

  let isDevMode = false;
  let projectRoot = '';
  const processedFiles = new Set<string>();
  const fileTimestamps = new Map<string, number>();

  const generateTypesForFile = async (filePath: string): Promise<void> => {
    try {
      const file = await readFile(filePath, 'utf-8');
      const compiled = await compileStringAsync(file, {
        loadPaths: [path.join(projectRoot, rootDir, 'styles')],
      });

      let classMap: Record<string, string> = {};

      await postcss([
        PostcssModulesPlugin({
          getJSON: (_, json) => {
            classMap = json;
          },
        }),
      ]).process(compiled.css, { from: undefined });

      const lines: string[] = [];

      for (const [key] of Object.entries(classMap).sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        const camelKey = camelCase(key);
        lines.push(`export declare const ${camelKey}: string;`);
      }

      const typeFile = `${filePath}.d.ts`;
      const content = lines.join('\n').concat('\n');
      await writeFile(typeFile, content, 'utf-8');
    } catch (err) {
      console.warn(`Failed to generate types for ${filePath},`, err);
    }
  };

  const shouldProcessFile = (filePath: string): boolean => {
    if (!pattern.test(filePath)) {
      return false;
    }

    if (!existsSync(filePath)) {
      return false;
    }

    const stats = statSync(filePath);
    const currentTimestamp = stats.mtime.getTime();
    const lastTimestamp = fileTimestamps.get(filePath) || 0;

    if (currentTimestamp > lastTimestamp) {
      fileTimestamps.set(filePath, currentTimestamp);
      return true;
    }

    return false;
  };

  return {
    name: 'scss-types',

    configResolved(config) {
      isDevMode = config.command === 'serve';
      projectRoot = config.root;
    },

    async buildStart() {
      const glob = await import('glob');
      const scssFiles = await glob.glob(`${rootDir}/**/*.module.scss`, {
        cwd: projectRoot,
        absolute: true,
      });

      for (const filePath of scssFiles) {
        const typeFile = `${filePath}.d.ts`;
        const shouldProcess =
          !existsSync(typeFile) || shouldProcessFile(filePath);

        if (shouldProcess && !processedFiles.has(filePath)) {
          try {
            await generateTypesForFile(filePath);
            processedFiles.add(filePath);
          } catch (error) {
            console.warn(
              `Warning: Could not generate types for ${filePath}:`,
              error,
            );
          }
        }
      }
    },

    async handleHotUpdate(ctx) {
      const { file } = ctx;

      if (!(isDevMode && watch)) {
        return;
      }

      if (shouldProcessFile(file)) {
        try {
          await generateTypesForFile(file);
          processedFiles.add(file);

          const typeFile = `${file}.d.ts`;
          if (existsSync(typeFile)) {
            const typeModule = ctx.server.moduleGraph.getModuleById(typeFile);
            if (typeModule) {
              ctx.server.reloadModule(typeModule);
            }
          }
        } catch (error) {
          console.warn(`Warning: Could not generate types for ${file}:`, error);
        }
      }
    },

    async load(id) {
      if (pattern.test(id)) {
        const resolvedPath = path.resolve(projectRoot, id);

        if (
          shouldProcessFile(resolvedPath) &&
          !processedFiles.has(resolvedPath)
        ) {
          try {
            await generateTypesForFile(resolvedPath);
            processedFiles.add(resolvedPath);
          } catch (error) {
            console.warn(
              `Warning: Could not generate types for ${resolvedPath}:`,
              error,
            );
          }
        }
      }
    },
  };
}
