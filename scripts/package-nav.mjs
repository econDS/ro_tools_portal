import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { NAV_VERSION } from './nav-version.mjs';
const digest = value => createHash('sha256').update(value).digest('hex');
const dir = new URL(`../integrations/nav/releases/${NAV_VERSION}/`, import.meta.url);
const registry = JSON.parse(await readFile(new URL('../data/tools.registry.v1.json', import.meta.url), 'utf8'));
const snapshot = { schemaVersion: 1, catalogVersion: registry.catalogVersion, tools: registry.tools.filter(t => t.listingStatus !== 'hidden').map(({id, title, canonicalUrl, listingStatus, identity}) => ({id, title, canonicalUrl, listingStatus, identity})) };
await writeFile(new URL('catalog.snapshot.json', dir), JSON.stringify(snapshot, null, 2) + '\n');
const sourceFiles = ['src/urls.ts', 'src/tool-icons.ts', 'scripts/nav-version.mjs', 'scripts/generate-nav-snapshot.mjs', 'integrations/nav/src/snapshot.json', 'integrations/nav/src/catalog.ts', 'integrations/nav/src/nav.ts', 'vite.nav.config.ts', 'scripts/package-nav.mjs', 'data/tools.registry.v1.json', 'package-lock.json'];
const sourceHashes = {};
for (const path of sourceFiles) sourceHashes[path] = digest(await readFile(new URL('../' + path, import.meta.url)));
let sourceCommit = null;
try { sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { /* This starting workspace is not yet a Git repository. */ }
const lock = { bundleVersion: NAV_VERSION, sourceCommit, sourceNote: sourceCommit ? 'Check source file hashes against this commit; the working tree may contain edits.' : 'Uncommitted local build: no Git repository exists in this workspace. Record an actual source commit before publishing.', sourceHashes, catalogVersion: snapshot.catalogVersion, files: {} };
for (const path of ['nav.js', 'catalog.snapshot.json']) lock.files[path] = { sha256: digest(await readFile(new URL(path, dir))) };
await writeFile(new URL('nav.lock.json', dir), JSON.stringify(lock, null, 2) + '\n');
console.log(`Packaged local nav ${NAV_VERSION} with SHA-256 and source hashes; source commit:`, sourceCommit ?? 'unavailable (not a Git repository)');
