import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { renderPortal, publicCatalog } from './scripts/render.ts';

// The template lives in src/ because the repository root index.html is the published build output.
export default defineConfig({
  root: 'src',
  base: '/ro_tools_portal/',
  publicDir: false,
  build: { outDir: '../dist', emptyOutDir: true },
  plugins: [{
    name: 'static-catalog',
    transformIndexHtml: { order: 'pre', handler: html => html.replace('<!-- PORTAL -->', renderPortal()) },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'catalog/v1/tools.json', source: JSON.stringify(publicCatalog(), null, 2) + '\n' });
      this.emitFile({ type: 'asset', fileName: 'favicon.svg', source: readFileSync('favicon.svg') });
    },
  }],
});
