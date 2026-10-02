import { registerPortalWorker } from './pwa';
import { tools, categories, matches } from './catalog';
import { preferenceStore, PORTAL_KEY, type Theme } from './preferences';

const get = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const cards = [...document.querySelectorAll<HTMLElement>('[data-tool]')];
const pins = [...document.querySelectorAll<HTMLButtonElement>('[data-pin]')];
const categoryButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-category]')];
const search = get<HTMLInputElement>('search');
const status = get('storage-status');
const store = preferenceStore(() => localStorage, new Set(tools.filter(t => t.listingStatus === 'listed').map(t => t.id)), () => {
  status.textContent = 'บันทึกหมุดและประวัติในเบราว์เซอร์นี้ไม่ได้ การเปลี่ยนแปลงอาจไม่ถูกเก็บไว้ แต่ยังเปิดเครื่องมือได้ตามปกติ';
});
let state = store.load();
let category = 'all';
const params = new URLSearchParams(location.search);
search.value = (params.get('q') || '').slice(0, 160);
if (categories.some(item => item.id === params.get('category'))) category = params.get('category')!;

function filter(updateUrl = true) {
  let count = 0;
  for (const card of cards) {
    const tool = tools.find(t => t.id === card.dataset.tool)!;
    card.hidden = !matches(tool, search.value, category);
    if (!card.hidden) count++;
  }
  for (const group of document.querySelectorAll<HTMLElement>('[data-tool-group]')) group.hidden = !group.querySelector('[data-tool]:not([hidden])');
  for (const button of categoryButtons) button.setAttribute('aria-pressed', String(category === button.dataset.category));
  get('result-count').textContent = `แสดง ${count} จาก ${tools.length} รายการ`;
  get('no-results').hidden = count > 0;
  if (updateUrl) {
    const url = new URL(location.href);
    if (search.value) url.searchParams.set('q', search.value); else url.searchParams.delete('q');
    if (category !== 'all') url.searchParams.set('category', category); else url.searchParams.delete('category');
    try { history.replaceState(null, '', url); } catch { /* Links work without URL enhancement. */ }
  }
}
function renderShortcuts(id: string, ids: string[], placeholder: string) {
  const list = get(id);
  list.replaceChildren();
  if (!ids.length) {
    const li = document.createElement('li'); li.className = 'shortcut-empty'; li.textContent = placeholder; list.append(li);
  }
  for (const toolId of ids) {
    const tool = tools.find(t => t.id === toolId && t.listingStatus === 'listed');
    if (!tool?.canonicalUrl) continue;
    const li = document.createElement('li'); const a = document.createElement('a');
    a.href = tool.canonicalUrl; a.dataset.launch = tool.id; a.textContent = tool.title;
    li.append(a); list.append(li);
  }
}
function renderState() {
  get('quick-access').hidden = !state.favorites.length && !state.recent.length;
  get('shortcut-hint').hidden = !get('quick-access').hidden;
  get('favorites-panel').hidden = !state.favorites.length;
  get('recent-panel').hidden = !state.recent.length;
  renderShortcuts('favorites', state.favorites, 'กด ☆ บนการ์ดเพื่อปักหมุดเครื่องมือที่ใช้บ่อยไว้ตรงนี้');
  renderShortcuts('recent', state.recent, 'เครื่องมือที่เปิดจากหน้านี้จะแสดงที่นี่');
  for (const button of pins) {
    const pinned = state.favorites.includes(button.dataset.pin!);
    const tool = tools.find(t => t.id === button.dataset.pin)!;
    button.setAttribute('aria-pressed', String(pinned));
    button.setAttribute('aria-label', `${pinned ? 'เลิกปักหมุด' : 'ปักหมุด'} ${tool.title}`);
    button.firstElementChild!.textContent = pinned ? '★' : '☆';
  }
}
for (const button of pins) button.addEventListener('click', () => {
  const id = button.dataset.pin!;
  state.favorites = state.favorites.includes(id) ? state.favorites.filter(value => value !== id) : [...state.favorites, id];
  store.save(state); renderState();
});
function recordLaunch(event: MouseEvent) {
  if (event.defaultPrevented || (event.type === 'auxclick' && event.button !== 1)) return;
  const target = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-launch]') : null;
  if (!target) return;
  const tool = tools.find(item => item.id === target.dataset.launch && item.canonicalUrl === target.href && item.listingStatus === 'listed');
  if (!tool) return;
  state.recent = [tool.id, ...state.recent.filter(id => id !== tool.id)].slice(0, 5);
  store.save(state);
  // Do not replace the clicked shortcut while the browser is processing its default navigation.
  setTimeout(renderState, 0);
}
document.addEventListener('click', recordLaunch);
document.addEventListener('auxclick', recordLaunch);
search.addEventListener('input', () => filter());
categoryButtons.forEach(button => button.addEventListener('click', () => { category = button.dataset.category!; filter(); }));
get('clear-filters').addEventListener('click', () => { search.value = ''; category = 'all'; filter(); search.focus(); });
get('reset-portal').addEventListener('click', () => {
  status.textContent = ''; store.reset(); state = { favorites: [], recent: [] }; renderState();
  if (!status.textContent) status.textContent = 'ล้างหมุดและประวัติของพอร์ทัลแล้ว';
});
window.addEventListener('storage', event => { if (event.key === PORTAL_KEY) { state = store.load(); renderState(); } });
let theme: Theme = store.theme() || 'dark';
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f5f7f1' : '#121a16');
  get('theme-toggle').textContent = theme === 'light' ? 'โหมดมืด' : 'โหมดสว่าง';
}
get('theme-toggle').addEventListener('click', () => { theme = theme === 'light' ? 'dark' : 'light'; applyTheme(); store.saveTheme(theme); });
applyTheme(); renderState(); filter(false);
for (const id of ['search-controls', 'reset-portal', 'theme-toggle']) get(id).hidden = false;
pins.forEach(button => { button.hidden = false; });

registerPortalWorker();
