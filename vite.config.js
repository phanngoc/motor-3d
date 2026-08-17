import { defineConfig } from 'vite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';

const root = dirname(fileURLToPath(import.meta.url));
const pagesDir = resolve(root, 'pages');

// Multi-page build: index.html + mot file HTML cho moi he thong trong pages/
const input = { index: resolve(root, 'index.html') };
for (const file of readdirSync(pagesDir)) {
  if (file.endsWith('.html')) input[file.slice(0, -5)] = resolve(pagesDir, file);
}

export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    rollupOptions: { input },
    chunkSizeWarningLimit: 1200,
  },
  server: { open: '/index.html' },
});
