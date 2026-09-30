import { approvedUrl } from '../../../src/urls';
import { isAccent, isToolIcon, contrastOnWhite, type ToolIcon } from '../../../src/tool-icons';
import bundledSnapshot from './snapshot.json' with { type: 'json' };
export type NavIdentity = { accent: string; icon: ToolIcon };
export type NavTool = { id: string; title: string; canonicalUrl: string | null; listingStatus: 'listed' | 'planned'; identity?: NavIdentity };
export type NavCatalog = { schemaVersion: 1; catalogVersion: string; tools: NavTool[] };
export const snapshot = bundledSnapshot as NavCatalog;
export const CATALOG_URL = 'https://econds.github.io/ro_tools_portal/catalog/v1/tools.json';
export const MAX_BYTES = 32_768;
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
export function validateNavCatalog(value: unknown): NavCatalog {
  if (!object(value) || value.schemaVersion !== 1 || typeof value.catalogVersion !== 'string' || !value.catalogVersion.length || value.catalogVersion.length > 80 || !Array.isArray(value.tools) || value.tools.length < 1 || value.tools.length > 50) throw new Error('Unsupported catalog');
  const ids = new Set<string>();
  const tools = value.tools.map((tool): NavTool => {
    if (!object(tool) || typeof tool.id !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(tool.id) || ids.has(tool.id) || typeof tool.title !== 'string' || !tool.title.trim() || tool.title.length > 160 || /[<>\u0000-\u001f]/.test(tool.title)) throw new Error('Invalid tool');
    ids.add(tool.id);
    if (tool.listingStatus !== 'listed' && tool.listingStatus !== 'planned') throw new Error('Unknown listing status');
    if (tool.listingStatus === 'listed' ? !approvedUrl(tool.canonicalUrl) : tool.canonicalUrl !== null) throw new Error('Unsafe launch URL');
    // identity is optional (schema major 1 stays compatible); when present it must be a known icon and a hex accent readable under white glyphs.
    let identity: NavIdentity | undefined;
    if (tool.identity !== undefined) {
      const value = tool.identity;
      if (!object(value) || !isAccent(value.accent) || contrastOnWhite(value.accent) < 4.5 || !isToolIcon(value.icon)) throw new Error('Invalid tool identity');
      identity = { accent: value.accent, icon: value.icon };
    }
    return { id: tool.id, title: tool.title, canonicalUrl: tool.canonicalUrl as string | null, listingStatus: tool.listingStatus, ...(identity && { identity }) };
  });
  return { schemaVersion: 1, catalogVersion: value.catalogVersion, tools };
}
export async function fetchCatalog(url: string): Promise<NavCatalog> {
  if (url !== CATALOG_URL) throw new Error('Unapproved catalog endpoint');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(url, { signal: controller.signal, credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' });
    if (!response.ok || response.url !== CATALOG_URL || !response.headers.get('content-type')?.includes('application/json') || !response.body) throw new Error('Invalid catalog response');
    const reader = response.body.getReader();
    const decoder = new TextDecoder(); let text = ''; let bytes = 0;
    try {
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > MAX_BYTES) throw new Error('Oversized catalog');
        text += decoder.decode(chunk.value, { stream: true });
      }
      text += decoder.decode();
      return validateNavCatalog(JSON.parse(text));
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  } finally { clearTimeout(timer); }
}
