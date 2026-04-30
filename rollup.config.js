import path from 'node:path';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';

export default defineConfig({
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
    }),
    alias({
      entries: [
        { find: '#backend', replacement: path.resolve('backend') },
        { find: '#blib', replacement: path.resolve('backend/lib') },
        { find: '#shared', replacement: path.resolve('shared') },
      ],
    }),
    commonjs(),
    resolve(),
    json(),
    terser(),
  ],

  input: 'backend/server.ts',
  output: {
    dir: 'dist/backend',
    format: 'esm',
  },
});
