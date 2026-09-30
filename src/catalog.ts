import registry from '../data/tools.registry.v1.json' with { type: 'json' };

export type Tool = typeof registry.tools[number];
export const tools = registry.tools.filter(tool => tool.listingStatus !== 'hidden');
export const categories = registry.categories;
export const catalog = registry;
export const normalize = (value: string) => value.normalize('NFKC').toLocaleLowerCase('th').trim();
export function matches(tool: Tool, query: string, category: string): boolean {
  const haystack = normalize([tool.title, tool.description, ...tool.searchAliases, ...tool.tags].join(' '));
  return (category === 'all' || tool.categories.includes(category)) && normalize(query).split(/\s+/u).every(word => haystack.includes(word));
}

export { approvedUrl, approvedUrls } from './urls.ts';
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}
