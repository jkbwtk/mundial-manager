import { defineConfig } from 'rollup';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';

export default defineConfig({
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
    }),
    commonjs(),
    resolve(),
    json(),
    terser(),
  ],

  input: 'src/backend/index.ts',
  output: {
    dir: 'dist/backend',
    format: 'esm',
  },
});
