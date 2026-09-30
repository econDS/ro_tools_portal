// Per-tool identity icons (24×24, stroke = currentColor), shared by portal cards and ro-suite-nav
// so a tool looks the same on its portal card and in the shared bar inside the tool.
// Kept as path data so the nav can build SVG with DOM APIs instead of parsing markup.
export const toolIconPaths = {
  map: ['M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z', 'M9 4v14M15 6v14'],
  anvil: ['M3 7h13a4 4 0 0 1-4 4v3h2v3H6v-3h2v-3a5 5 0 0 1-5-4Z', 'M16 7h5M5 20h14'],
  snowflake: ['M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9', 'm9.5 5 2.5 2 2.5-2M9.5 19l2.5-2 2.5 2'],
  wave: ['M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0'],
  gem: ['M6 4h12l3 5-9 11L3 9Z', 'M3 9h18M9 4 7.5 9 12 20l4.5-11L15 4'],
} as const;

export type ToolIcon = keyof typeof toolIconPaths;
export const isToolIcon = (value: unknown): value is ToolIcon => typeof value === 'string' && Object.hasOwn(toolIconPaths, value);
export const isAccent = (value: unknown): value is string => typeof value === 'string' && /^#[0-9a-f]{6}$/.test(value);
export const ICON_ATTRS = { viewBox: '0 0 24 24', width: '24', height: '24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', focusable: 'false', 'aria-hidden': 'true' } as const;

export function toolIconSvg(icon: ToolIcon): string {
  const attrs = Object.entries(ICON_ATTRS).map(([key, value]) => `${key}="${value}"`).join(' ');
  return `<svg ${attrs}>${toolIconPaths[icon].map(d => `<path d="${d}"/>`).join('')}</svg>`;
}

// WCAG contrast of white icon/text on the accent. Accents are drawn as solid chips behind white glyphs.
export function contrastOnWhite(hex: string): number {
  const channel = (i: number) => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return 1.05 / (luminance + 0.05);
}
