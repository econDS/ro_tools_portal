import { defineConfig } from 'vite';
import { NAV_VERSION } from './scripts/nav-version.mjs';
export default defineConfig({
  build: { outDir: `integrations/nav/releases/${NAV_VERSION}`, emptyOutDir: false, lib: { entry: 'integrations/nav/src/nav.ts', formats: ['es'], fileName: () => 'nav.js' }, sourcemap: false },
});
