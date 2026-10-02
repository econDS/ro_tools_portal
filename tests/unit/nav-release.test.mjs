import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { NAV_VERSION } from '../../scripts/nav-version.mjs';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

test('released 1.2.0 bytes remain frozen', async () => {
  const frozen = {
    'nav.js': 'd75be916445feb4febeaada437841a1b3be68db16a00673198c78fd6f6c8dc5f',
    'catalog.snapshot.json': '800bb9c9d2b52a7fbae58e436b05529e69820fee3627d199da545a6f5e28f7dd',
    'nav.lock.json': '3b0350135ba5f455b38799c7940492938a209e8e0a6570a5126cb40c36127358',
  };
  for (const [file, hash] of Object.entries(frozen)) assert.equal(digest(await readFile(`integrations/nav/releases/1.2.0/${file}`)), hash);
});

test('new nav artifact and all sources match the recorded committed source', async () => {
  const dir = `integrations/nav/releases/${NAV_VERSION}`;
  const lock = JSON.parse(await readFile(`${dir}/nav.lock.json`, 'utf8'));
  assert.equal(lock.bundleVersion, '1.3.0');
  assert.match(lock.sourceCommit, /^[0-9a-f]{40}$/);
  for (const [file, info] of Object.entries(lock.files)) assert.equal(digest(await readFile(`${dir}/${file}`)), info.sha256);
  for (const [file, hash] of Object.entries(lock.sourceHashes)) {
    assert.equal(digest(await readFile(file)), hash, file);
    assert.equal(digest(execFileSync('git', ['show', `${lock.sourceCommit}:${file}`])), hash, `committed ${file}`);
  }
  const snapshot = JSON.parse(await readFile(`${dir}/catalog.snapshot.json`, 'utf8'));
  assert.equal(snapshot.tools.find(tool => tool.id === 'best-status').canonicalUrl, 'https://econds.github.io/ro-best-status/');
  const planned = snapshot.tools.find(tool => tool.id === 'grade-refine');
  assert.equal(planned.listingStatus, 'planned');
  assert.equal(planned.canonicalUrl, null);
});
