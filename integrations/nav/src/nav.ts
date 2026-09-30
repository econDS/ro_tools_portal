import { approvedUrl } from '../../../src/urls';
import { toolIconPaths, ICON_ATTRS } from '../../../src/tool-icons';
import { snapshot, validateNavCatalog, fetchCatalog, CATALOG_URL, type NavCatalog, type NavIdentity } from './catalog';

// theme="light"|"dark" pins the bar to the app's own theme; anything else follows prefers-color-scheme. Only the bar is themed, never the host app.
const css = `:host{display:block;position:static;font:14px/1.6 Tahoma,"Leelawadee UI",sans-serif;--bg:#f1f5ed;--ink:#233b2c;--line:#cbd7c7;--button:#fff;--button-line:#becbb9;--focus:#315d45;--current:#dee9d7;--muted:#52604f;color-scheme:light;color:var(--ink)}@media(prefers-color-scheme:dark){:host(:not([theme=light])){--bg:#16211b;--ink:#ecf2e8;--line:#2f3f35;--button:#1b2620;--button-line:#415447;--focus:#b6d7a8;--current:#23342a;--muted:#b3c1b6;color-scheme:dark}}:host([theme=dark]){--bg:#16211b;--ink:#ecf2e8;--line:#2f3f35;--button:#1b2620;--button-line:#415447;--focus:#b6d7a8;--current:#23342a;--muted:#b3c1b6;color-scheme:dark}*{box-sizing:border-box}nav{font:14px/1.6 Tahoma,"Leelawadee UI",sans-serif;background:var(--ro-suite-background,var(--bg));color:var(--ro-suite-color,var(--ink));border:1px solid var(--line);border-bottom:3px solid var(--tool-accent,var(--line));border-radius:8px;padding:10px 14px}a,button{font:inherit;color:inherit;min-height:44px;display:inline-flex;align-items:center;padding:8px 12px;border-radius:5px}a{text-underline-offset:3px}button{background:var(--button);color:var(--ink);border:1px solid var(--button-line);cursor:pointer}a:focus-visible,button:focus-visible{outline:3px solid var(--focus);outline-offset:2px}.bar{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.current{font-weight:bold;flex:1;display:inline-flex;align-items:center;gap:8px}.chip{flex:none;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:8px;background:var(--chip);color:#fff}.chip svg{width:18px;height:18px}li a,li span{gap:8px}li .chip{width:22px;height:22px;border-radius:6px;padding:0;min-height:0;color:#fff}li .chip svg{width:14px;height:14px}ul{list-style:none;padding:12px 0 0;margin:10px 0 0;border-top:1px solid var(--line);display:flex;flex-wrap:wrap;gap:6px}li{margin:0}li span{display:inline-flex;align-items:center;padding:8px 12px;min-height:44px;color:var(--muted)}[aria-current=page]{font-weight:bold;background:var(--current)}p{font:12px/1.6 Tahoma,sans-serif;margin:8px 0 0;color:var(--muted)}[hidden]{display:none!important}@media(max-width:480px){nav{padding:8px}.bar{gap:6px}.current{flex-basis:100%;order:3;padding:0 12px}button{margin-left:auto}ul{display:block}li a{width:100%}}`;
function link(label: string, href: string) { const a = document.createElement('a'); a.textContent = label; a.href = href; return a; }
// Decorative icon chip built from bundled path data; identity values were validated in validateNavCatalog.
function chip(identity: NavIdentity | undefined) {
  if (!identity) return null;
  const span = document.createElement('span'); span.className = 'chip'; span.setAttribute('aria-hidden', 'true');
  span.style.setProperty('--chip', identity.accent);
  const ns = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(ns, 'svg');
  for (const [key, value] of Object.entries(ICON_ATTRS)) svg.setAttribute(key, value);
  for (const d of toolIconPaths[identity.icon]) { const path = document.createElementNS(ns, 'path'); path.setAttribute('d', d); svg.append(path); }
  span.append(svg); return span;
}
function labelled(element: HTMLElement, identity: NavIdentity | undefined, label: string) { const icon = chip(identity); if (icon) element.append(icon); element.append(label); return element; }

export class RoSuiteNav extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    try { this.initialize(); } catch { /* Keep visible light-DOM fallback on initialization failure. */ }
  }
  private initialize() {
    let catalog = validateNavCatalog(snapshot);
    const toolId = this.getAttribute('tool-id');
    const current = catalog.tools.find(tool => tool.id === toolId);
    const configuredPortal = this.getAttribute('portal-url');
    const portalUrl = configuredPortal === 'https://econds.github.io/ro_tools_portal/' && approvedUrl(configuredPortal) ? configuredPortal : 'https://econds.github.io/ro_tools_portal/';
    const nav = document.createElement('nav'); nav.setAttribute('aria-label', 'เครื่องมือ RO');
    const bar = document.createElement('div'); bar.className = 'bar';
    bar.append(link('กลับ RO Tools Portal', portalUrl)); nav.append(bar);
    if (current) {
      if (current.identity) nav.style.setProperty('--tool-accent', current.identity.accent);
      const name = labelled(document.createElement('span'), current.identity, current.title); name.className = 'current'; bar.append(name);
      const button = document.createElement('button'); button.type = 'button'; button.textContent = 'เครื่องมืออื่น'; button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', 'tools');
      const panel = document.createElement('div'); panel.id = 'tools'; panel.hidden = true;
      const list = document.createElement('ul'); const notice = document.createElement('p'); notice.setAttribute('role', 'status');
      panel.append(list, notice); bar.append(button); nav.append(panel);
      const render = () => {
        const nodes = catalog.tools.map(tool => {
          const li = document.createElement('li');
          if (tool.listingStatus === 'listed' && tool.canonicalUrl) {
            const a = labelled(link('', tool.canonicalUrl), tool.identity, tool.title); if (tool.id === toolId) a.setAttribute('aria-current', 'page'); li.append(a);
          } else li.append(labelled(document.createElement('span'), tool.identity, `${tool.title} — อยู่ในแผน`));
          return li;
        });
        list.replaceChildren(...nodes);
      };
      const close = (returnFocus: boolean) => { panel.hidden = true; button.setAttribute('aria-expanded', 'false'); if (returnFocus) button.focus(); };
      let requested = false;
      button.addEventListener('click', () => {
        const open = panel.hidden; panel.hidden = !open; button.setAttribute('aria-expanded', String(open));
        const url = this.getAttribute('catalog-url');
        if (open && url && !requested) {
          requested = true;
          if (url !== CATALOG_URL) { notice.textContent = 'ใช้รายการเครื่องมือที่ติดตั้งไว้'; return; }
          void fetchCatalog(url).then(updated => {
            // Keep current identity stable and do not remove the focused link during navigation.
            if (!updated.tools.some(tool => tool.id === toolId && tool.title === current.title)) throw new Error('Missing current identity');
            const focusedId = list.querySelector('a:focus')?.getAttribute('href');
            // A remote catalog without identity keeps the bundled identity instead of dropping the icons.
            catalog = { ...updated, tools: updated.tools.map(tool => tool.identity ? tool : { ...tool, identity: catalog.tools.find(known => known.id === tool.id)?.identity }) }; render();
            if (focusedId) [...list.querySelectorAll('a')].find(a => a.href === focusedId)?.focus();
            notice.textContent = '';
          }).catch(() => { notice.textContent = 'อัปเดตรายการไม่ได้ ใช้รายการที่ติดตั้งไว้'; });
        }
      });
      nav.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); close(true); } });
      nav.addEventListener('focusout', event => { if (event.relatedTarget instanceof Node && !nav.contains(event.relatedTarget)) close(false); });
      render();
    }
    const style = document.createElement('style'); style.textContent = css;
    // All validation and detached DOM construction complete before fallback is superseded.
    this.attachShadow({ mode: 'open' }).append(style, nav);
  }
}
if (!customElements.get('ro-suite-nav')) customElements.define('ro-suite-nav', RoSuiteNav);
