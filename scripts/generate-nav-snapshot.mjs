import { readFile, writeFile } from 'node:fs/promises';
const registry = JSON.parse(await readFile(new URL('../data/tools.registry.v1.json', import.meta.url), 'utf8'));
const snapshot = { schemaVersion: 1, catalogVersion: registry.catalogVersion, tools: registry.tools.filter(t => t.listingStatus !== 'hidden').map(({id, title, canonicalUrl, listingStatus, identity}) => ({id, title, canonicalUrl, listingStatus, identity})) };
await writeFile(new URL('../integrations/nav/src/snapshot.json', import.meta.url), JSON.stringify(snapshot, null, 2) + '\n');
