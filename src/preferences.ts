export const PORTAL_KEY = 'ro-suite:portal:v1';
export const PREFS_KEY = 'ro-suite:prefs:v1';
export type PortalState = { favorites: string[]; recent: string[] };
export type Theme = 'light' | 'dark';
const empty = (): PortalState => ({ favorites: [], recent: [] });
export function parseState(raw: string | null, allowed: Set<string>): PortalState {
  if (!raw) return empty();
  if (raw.length > 16_384) throw new Error('Oversized preferences');
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1) throw new Error('Invalid preference version');
  const read = (key: string, limit: number): string[] => {
    const list = (value as Record<string, unknown>)[key];
    if (!Array.isArray(list) || list.length > 100 || list.some(item => typeof item !== 'string')) throw new Error('Invalid preference list');
    return [...new Set(list.filter(id => allowed.has(id)))].slice(0, limit);
  };
  return { favorites: read('favorites', 50), recent: read('recent', 5) };
}
export function preferenceStore(getStorage: () => Storage, allowed: Set<string>, warn: () => void) {
  return {
    load(): PortalState { try { return parseState(getStorage().getItem(PORTAL_KEY), allowed); } catch { warn(); return empty(); } },
    save(state: PortalState) { try { getStorage().setItem(PORTAL_KEY, JSON.stringify({ version: 1, ...state })); } catch { warn(); } },
    theme(): Theme | null {
      try {
        const raw = getStorage().getItem(PREFS_KEY);
        if (!raw) return null;
        if (raw.length > 256) throw new Error('Oversized theme');
        const value = JSON.parse(raw);
        if (value?.version !== 1 || !['light', 'dark'].includes(value.theme)) throw new Error('Invalid theme');
        return value.theme;
      } catch { warn(); return null; }
    },
    saveTheme(theme: Theme) { try { getStorage().setItem(PREFS_KEY, JSON.stringify({ version: 1, theme })); } catch { warn(); } },
    reset() { try { getStorage().removeItem(PORTAL_KEY); } catch { warn(); } },
  };
}
