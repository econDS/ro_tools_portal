// Generates prompts/child-nav/<tool-id>.md from install.md using the registry and the current nav release lock.
import { readFile, writeFile } from 'node:fs/promises';
import { NAV_VERSION } from './nav-version.mjs';
const read = async path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const registry = JSON.parse(await read('data/tools.registry.v1.json'));
const lock = JSON.parse(await read(`integrations/nav/releases/${NAV_VERSION}/nav.lock.json`));
const template = await read('prompts/child-nav/install.md');
for (const tool of registry.tools.filter(t => t.listingStatus === 'listed')) {
  const values = {
    REPO: tool.repository, BRANCH: tool.defaultBranchObserved, TOOL_ID: tool.id, ACCENT: tool.identity.accent, ICON: tool.identity.icon,
    NAV_VERSION, NAV_JS_SHA: lock.files['nav.js'].sha256, SNAPSHOT_SHA: lock.files['catalog.snapshot.json'].sha256,
  };
  const root = tool.publishingSourceObserved === 'root' ? '' : `${tool.publishingSourceObserved}/`;
  const text = template.replace('publishing root: {{PUBLISH_ROOT}})', `publishing root: ${root || 'root ของ repo'})`)
    .replaceAll('{{PUBLISH_ROOT}}', root).replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => { if (!(key in values)) throw new Error(`Unknown placeholder ${match}`); return values[key]; });
  await writeFile(new URL(`../prompts/child-nav/${tool.id}.md`, import.meta.url), text);
}
console.log(`Wrote child-nav prompts for nav ${NAV_VERSION}`);
