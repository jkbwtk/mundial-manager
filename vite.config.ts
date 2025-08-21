/// <reference types="vitest" />
/// <reference types="vite/client" />

import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import solid from 'vite-plugin-solid';
import { environment, isDev } from './tools/constants';
import { autoIndexPlugin } from './tools/plugins/auto-index';
import { scssTypesPlugin } from './tools/plugins/scss-types';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    solid({ ssr: true }),
    scssTypesPlugin({
      rootDir: 'src',
      watch: true,
    }),
    autoIndexPlugin({
      rootDir: 'src',
      skipRootIndex: true,
      watch: true,
    }),
    isDev
      ? checker({
          enableBuild: false,
          overlay: { initialIsOpen: false },

          typescript: {
            root: __dirname,
          },
        })
      : undefined,
  ],

  server: {
    port: environment.WEB_PORT,
    allowedHosts: ['localhost', 'pi.lan'],
    host: true,
    hmr: {
      port: environment.HMR_PORT,
    },
  },

  build: {
    minify: environment.BUILD_MINIFY,
    manifest: true,
    target: 'esnext',
    cssTarget: 'esnext',
    emptyOutDir: true,
    sourcemap: environment.BUILD_SOURCEMAP,
  },

  resolve: {
    alias: [
      { find: '#', replacement: resolve('src') },
      { find: '#components', replacement: resolve('src/components') },
      { find: '#pages', replacement: resolve('src/pages') },
      { find: '#styles', replacement: resolve('src/styles') },
      { find: '#assets', replacement: resolve('src/assets') },
      { find: '#lib', replacement: resolve('src/lib') },
      { find: '#providers', replacement: resolve('src/providers') },
      { find: '#routes', replacement: resolve('src/routes') },
      // { find: '#locales', replacement: resolve('src/locales') },
      // { find: '#shared', replacement: resolve(cwd(), 'shared/src') },
    ],
  },

  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      scss: {
        api: 'modern',
        loadPaths: [resolve(__dirname, 'src/styles')],
      },
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['node_modules/@testing-library/jest-dom/vitest'],
    isolate: false,
  },
});
