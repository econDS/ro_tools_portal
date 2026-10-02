import { defineConfig } from 'vite';
export default defineConfig({
  build: { outDir: '.nav-build', emptyOutDir: true, lib: { entry: 'integrations/nav/src/nav.ts', formats: ['es'], fileName: () => 'nav.js' }, sourcemap: false },
});
