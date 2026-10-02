import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { NAV_VERSION } from './nav-version.mjs';
const digest = value => createHash('sha256').update(value).digest('hex');
const root = new URL('../', import.meta.url);
const dir = new URL(`integrations/nav/releases/${NAV_VERSION}/`, root);
const sourceFiles = ['src/urls.ts', 'src/tool-icons.ts', 'scripts/nav-version.mjs', 'scripts/generate-nav-snapshot.mjs', 'integrations/nav/src/snapshot.json', 'integrations/nav/src/catalog.ts', 'integrations/nav/src/nav.ts', 'vite.nav.config.ts', 'scripts/package-nav.mjs', 'data/tools.registry.v1.json', 'package.json', 'package-lock.json'];
const sourceHashes = {};
for (const path of sourceFiles) sourceHashes[path] = digest(await readFile(new URL(path, root)));
const files = {
  'nav.js': await readFile(new URL('.nav-build/nav.js', root)),
  'catalog.snapshot.json': await readFile(new URL('integrations/nav/src/snapshot.json', root)),
};
let existing;
try { existing = JSON.parse(await readFile(new URL('nav.lock.json', dir), 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
// A release rebuild verifies bytes and its original source commit. It never rewrites the release.
const sourceCommit = existing?.sourceCommit ?? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
if (!/^[0-9a-f]{40}$/.test(sourceCommit)) throw new Error('Commit nav sources before packaging a release.');
for (const [path, hash] of Object.entries(sourceHashes)) {
  const committed = execFileSync('git', ['show', `${sourceCommit}:${path}`], { cwd: root });
  if (digest(committed) !== hash) throw new Error(`Commit all nav source changes first (or bump NAV_VERSION): ${path}`);
  if (existing && existing.sourceHashes[path] !== hash) throw new Error(`Immutable release source differs: ${path}`);
}
if (existing) {
  if (existing.bundleVersion !== NAV_VERSION) throw new Error('Release version mismatch');
  for (const [path, bytes] of Object.entries(files)) {
    if (digest(bytes) !== existing.files[path].sha256 || !(await readFile(new URL(path, dir))).equals(bytes)) throw new Error(`Immutable release differs; bump NAV_VERSION: ${path}`);
  }
  console.log(`Verified immutable nav ${NAV_VERSION}; source commit: ${sourceCommit}`);
} else {
  // mkdir without recursive prevents replacing an untracked/partial release directory.
  await mkdir(dir);
  const snapshot = JSON.parse(files['catalog.snapshot.json'].toString());
  const lock = { bundleVersion: NAV_VERSION, sourceCommit, sourceNote: 'All sourceHashes match files at sourceCommit. Rebuilds verify this immutable release without changing it.', sourceHashes, catalogVersion: snapshot.catalogVersion, files: {} };
  for (const [path, bytes] of Object.entries(files)) {
    await writeFile(new URL(path, dir), bytes, { flag: 'wx' });
    lock.files[path] = { sha256: digest(bytes) };
  }
  await writeFile(new URL('nav.lock.json', dir), JSON.stringify(lock, null, 2) + '\n', { flag: 'wx' });
  console.log(`Packaged nav ${NAV_VERSION}; committed source: ${sourceCommit}`);
}
