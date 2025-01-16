// import * as path from 'path';
import { defineConfig } from 'vite';
// import glsl from 'rollup-plugin-glsl';
import tsconfigPaths from 'vite-tsconfig-paths';
// import reactRefresh from '@vitejs/plugin-react-refresh';
import react from '@vitejs/plugin-react';
// import glsl from 'vite-plugin-glsl';
// import eslintPlugin from '@nabla/vite-plugin-eslint';
// import { EsLinter, linterPlugin, TypeScriptLinter } from 'vite-plugin-linter';

// import { visualizer } from 'rollup-plugin-visualizer';
// import { defineConfig, type PluginOption } from 'vite'
// import { VitePWA } from 'vite-plugin-pwa';
// import glslify from 'rollup-plugin-glslify';
// import glsl from 'vite-plugin-glsl';
// https://vitejs.dev/config/
export default defineConfig((configEnv) => ({
  // resolve: {
  //   alias: {
  //     '@': path.resolve(__dirname, './src'),
  //   },
  // },
  // plugins: [react({ fastRefresh: false })],

  plugins: [
    react(),
    // linterPlugin({
    //   include: ['./src/**/*.ts', './src/**/*.tsx'],
    //   linters: [new EsLinter({ configEnv: configEnv }), new TypeScriptLinter()],
    // }),
    tsconfigPaths(),
  ],
  // worker: {
  //   plugins: [react({ fastRefresh: false })],
  // },
  // esbuild: {
  //   jsxInject: `import React from 'react'`,
  // },
  // build: {
  //   rollupOptions: {
  //     plugins: [
  //       glslify({
  //         // Default
  //         include: [
  //           '**/*.vs',
  //           '**/*.fs',
  //           '**/*.vert',
  //           '**/*.frag',
  //           '**/*.glsl?raw',
  //         ],

  //         // Undefined by default
  //         exclude: 'node_modules/**',

  //         // Enabled by default
  //         compress: true,

  //         // The compress option also accepts a function with its first argument
  //         // being the string containing the glslified shader code.
  //         // The function is expected to return a string (or object) - the compressed shader
  //       }),
  //     ],
  //   },
  // },
}));
// react({ include: ['**/*.glsl?raw', '**/*.(t|j)sx'] }),
