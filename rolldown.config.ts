import babel from '@rolldown/plugin-babel';
import { defineConfig } from 'rolldown';

// https://main.vite.dev/guide/migration#javascript-transforms-by-oxc
function decoratorPreset(options: Record<string, unknown>) {
  return {
    preset: () => ({
      plugins: [['@babel/plugin-proposal-decorators', options]],
    }),
    rolldown: {
      filter: {
        code: '@',
      },
    },
  };
}

export default defineConfig({
  platform: 'node',

  plugins: [babel({ presets: [decoratorPreset({ version: '2023-11' })] })],

  input: {
    server: 'backend/server.ts',
    worker: 'backend/worker.ts',
  },
  output: {
    dir: 'dist/backend',
    format: 'esm',

    minify: true,
  },
});
