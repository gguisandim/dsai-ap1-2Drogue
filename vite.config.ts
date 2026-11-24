// vite.config.ts
import { defineConfig } from 'vite';
import path from 'path';

export const GITHUB_PAGES_BASE = '/dsai-ap1-2Drogue/';

export default defineConfig(({ command, isPreview }) => ({
  root: path.resolve(__dirname, 'src'),
  base: command === 'build' || isPreview ? GITHUB_PAGES_BASE : '/',
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/index.html'),
    },
  },
  server: {
    open: true,
  },
}));
