// Copies the Vite build in dist/ to the repository root, which GitHub Pages serves from main.
// Asset URLs become relative (./assets/) so the page works under any Pages path.
import { readFile, writeFile, readdir, rm, mkdir, copyFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const html = await readFile(new URL('index.html', dist), 'utf8');
await writeFile(new URL('index.html', root), html.replaceAll('"/ro_tools_portal/assets/', '"./assets/'));
// Only hashed build outputs live in assets/; remove stale ones so old bundles are not published.
await mkdir(new URL('assets/', root), { recursive: true });
for (const name of await readdir(new URL('assets/', root))) if (/^index-[\w-]+\.(js|css)$/.test(name)) await rm(new URL(`assets/${name}`, root));
for (const name of await readdir(new URL('assets/', dist))) await copyFile(new URL(`assets/${name}`, dist), new URL(`assets/${name}`, root));
await mkdir(new URL('catalog/v1/', root), { recursive: true });
await copyFile(new URL('catalog/v1/tools.json', dist), new URL('catalog/v1/tools.json', root));
await copyFile(new URL('favicon.svg', dist), new URL('favicon.svg', root));
// These are generated PWA assets, separate from immutable shared-nav releases.
for (const name of ['manifest.webmanifest', 'sw.js']) await copyFile(new URL(name, dist), new URL(name, root));
await mkdir(new URL('icons/', root), { recursive: true });
for (const name of await readdir(new URL('icons/', dist))) await copyFile(new URL(`icons/${name}`, dist), new URL(`icons/${name}`, root));
console.log('Published dist/ to repository root');
