import { defineConfig } from 'vite';

// base './' keeps the production bundle relocatable (works from any path,
// including GitHub Pages project sites) with zero runtime network needs.
export default defineConfig({
  base: './',
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
    assetsInlineLimit: 0,
  },
});
