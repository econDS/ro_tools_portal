// Runs after Vite so the revision includes the final HTML and hashed assets.
import { createHash } from 'node:crypto';
import { cp, readFile, readdir, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const source = new URL('pwa/', root);
// Preview and Pages must serve byte-identical HTML for install-time integrity.
const html = await readFile(new URL('index.html', dist), 'utf8');
await writeFile(new URL('index.html', dist), html.replaceAll('"/ro_tools_portal/assets/', '"./assets/'));
await cp(new URL('icons/', source), new URL('icons/', dist), { recursive: true });
await cp(new URL('manifest.webmanifest', source), new URL('manifest.webmanifest', dist));
const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', source), 'utf8'));
// Fail the build if an install icon is missing, rather than publishing a partial PWA.
for (const icon of [...manifest.icons, { src: './icons/apple-touch-icon.png' }]) {
  await readFile(new URL(icon.src, dist));
}
const files = [
  'index.html', 'favicon.svg', 'manifest.webmanifest',
  ...(await readdir(new URL('assets/', dist))).map(name => `assets/${name}`),
  ...(await readdir(new URL('icons/', dist))).filter(name => name.endsWith('.png')).map(name => `icons/${name}`),
].sort();
const template = await readFile(new URL('sw.js', source), 'utf8');
const hash = createHash('sha256').update(template);
const integrity = {};
for (const name of files) {
  const content = await readFile(new URL(name, dist));
  hash.update(name).update(content);
  integrity[`/ro_tools_portal/${name}`] = createHash('sha256').update(content).digest('hex');
}
const worker = template.replace('__REVISION__', hash.digest('hex').slice(0, 20))
  .replace('__FILES__', JSON.stringify(files.map(name => `/ro_tools_portal/${name}`)))
  .replace('__INTEGRITY__', JSON.stringify(integrity));
await writeFile(new URL('sw.js', dist), worker);
console.log(`Built portal-only PWA shell (${files.length} files)`);
