// @ts-check
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// One pre-rendered HTML page per store page. No SPA, no server adapter: the
// build goes to a webhost that runs no server code.
export default defineConfig({
  output: 'static',
  outDir: '../dist',
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
});
