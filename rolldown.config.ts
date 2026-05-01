import { defineConfig } from 'rolldown';

export default defineConfig({
  platform: 'node',

  transform: {
    decorator: {
      emitDecoratorMetadata: true,
      legacy: true,
    },
  },

  input: 'backend/server.ts',
  output: {
    file: 'dist/backend/server.js',
    codeSplitting: false,

    format: 'esm',

    minify: false,
  },
});
