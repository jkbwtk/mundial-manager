/// <reference types="vitest" />
/// <reference types="vite/client" />

import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import dts from 'vite-plugin-dts';
import { VitePWA } from 'vite-plugin-pwa';
import solid from 'vite-plugin-solid';
import { environment, isDev } from './tools/constants';
import { autoIndexPlugin } from './tools/plugins/auto-index';
import { scssTypesPlugin } from './tools/plugins/scss-types';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    solid({ ssr: true }),
    scssTypesPlugin({
      rootDir: 'frontend',
      watch: true,
    }),
    autoIndexPlugin({
      rootDir: 'frontend',
      skipRootIndex: true,
      watch: true,
    }),
    dts({
      include: ['frontend/**/*'],
      exclude: ['frontend/**/*.test.*', 'frontend/**/*.spec.*'],
      rollupTypes: true,
      insertTypesEntry: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,gif,woff2}'],
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: 'Mundial Manager',
        short_name: 'Mundial Manager',
        description: 'Mundial Manager',
        theme_color: '#a62130',
        background_color: '#0d0d0d',
        icons: [
          {
            src: '/resources/favicon.png',
            sizes: '256x256',
            type: 'image/png',
          },
        ],
      },
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
      { find: '#frontend', replacement: resolve('frontend') },
      { find: '#components', replacement: resolve('frontend/components') },
      { find: '#pages', replacement: resolve('frontend/pages') },
      { find: '#styles', replacement: resolve('frontend/styles') },
      { find: '#assets', replacement: resolve('frontend/assets') },
      { find: '#flib', replacement: resolve('frontend/lib') },
      { find: '#providers', replacement: resolve('frontend/providers') },
      { find: '#routes', replacement: resolve('frontend/routes') },
      { find: '#shared', replacement: resolve('shared') },
      { find: '#backend', replacement: resolve('backend') },
    ],
  },

  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      scss: {
        loadPaths: [resolve(__dirname, 'frontend/styles')],
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
