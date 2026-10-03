import { approvedUrl } from '../../../src/urls';
import { toolIconPaths, ICON_ATTRS } from '../../../src/tool-icons';
import { snapshot, validateNavCatalog, fetchCatalog, CATALOG_URL, type NavCatalog, type NavIdentity } from './catalog';

// theme="light"|"dark" pins the bar to the app's own theme; anything else follows prefers-color-scheme. Only the bar is themed, never the host app.
const css = `
:host{display:block;position:static;font:14px/1.6 var(--ro-suite-font-family,system-ui,sans-serif);--_ro-nav-bg:#f8fafc;--_ro-nav-ink:#1e293b;--_ro-nav-line:#cbd5e1;--_ro-nav-focus:#075985;--_ro-nav-current:#e2e8f0;--_ro-nav-muted:#475569;--_ro-nav-accent:#0369a1;color-scheme:light;color:var(--ro-suite-text,var(--ro-suite-color,var(--_ro-nav-ink)))}
@media(prefers-color-scheme:dark){:host(:not([theme=light])){--_ro-nav-bg:#0f172a;--_ro-nav-ink:#f1f5f9;--_ro-nav-line:#475569;--_ro-nav-focus:#7dd3fc;--_ro-nav-current:#1e293b;--_ro-nav-muted:#cbd5e1;--_ro-nav-accent:#7dd3fc;color-scheme:dark}}
:host([theme=dark]){--_ro-nav-bg:#0f172a;--_ro-nav-ink:#f1f5f9;--_ro-nav-line:#475569;--_ro-nav-focus:#7dd3fc;--_ro-nav-current:#1e293b;--_ro-nav-muted:#cbd5e1;--_ro-nav-accent:#7dd3fc;color-scheme:dark}
*{box-sizing:border-box}
nav{font:inherit;background:var(--ro-suite-surface,var(--ro-suite-background,var(--_ro-nav-bg)));color:var(--ro-suite-text,var(--ro-suite-color,var(--_ro-nav-ink)));border:0;border-bottom:1px solid var(--ro-suite-border,var(--_ro-nav-line));border-radius:0}
.shell{width:100%;max-width:var(--ro-suite-content-max-width,none);margin-inline:auto;padding:4px var(--ro-suite-inline-padding,16px)}
a,button{font:inherit;color:inherit;min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;padding:8px 10px;border-radius:4px}
a{text-underline-offset:3px}
button{background:transparent;color:inherit;border:1px solid var(--ro-suite-border,var(--_ro-nav-line));cursor:pointer;gap:6px;flex:none}
a:focus-visible,button:focus-visible{outline:3px solid var(--ro-suite-focus,var(--_ro-nav-focus));outline-offset:2px}
.bar{display:flex;align-items:center;gap:12px;min-height:44px;flex-wrap:nowrap}
.portal{flex:none;white-space:nowrap;text-decoration:none;padding-inline:0;font-weight:600}
.portal:hover{text-decoration:underline}
button:hover,li a:hover{background:var(--ro-suite-surface-hover,var(--_ro-nav-current))}
.current{font-weight:600;flex:1 1 0;min-width:0;display:inline-flex;align-items:center;gap:6px}
.current-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.chip{flex:none;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:3px;background:var(--chip);color:#fff}
.chip svg{width:14px;height:14px}
.menu-icon{width:18px;height:18px;flex:none}
li a,li span{gap:8px}
ul{list-style:none;padding:8px 0 0;margin:4px 0 0;border-top:1px solid var(--ro-suite-border,var(--_ro-nav-line));display:flex;flex-wrap:wrap;gap:4px}
li{margin:0}
li span{display:inline-flex;align-items:center;padding:8px 10px;min-height:44px;color:var(--ro-suite-muted,var(--_ro-nav-muted))}
li .chip{padding:0;min-height:0;color:#fff}
[aria-current=page]{font-weight:bold;background:var(--ro-suite-surface-hover,var(--_ro-nav-current));box-shadow:inset 2px 0 var(--ro-suite-accent,var(--_ro-nav-accent))}
.current .chip,[aria-current=page] .chip{background:transparent;color:var(--ro-suite-accent,var(--_ro-nav-accent))}
p{font:inherit;font-size:12px;margin:4px 0;color:var(--ro-suite-muted,var(--_ro-nav-muted))}
p:empty{margin:0}
[hidden]{display:none!important}
@media(max-width:480px){.bar{gap:8px}.menu-label{display:none}button{padding:8px;width:44px}ul{display:block}li a{width:100%;justify-content:flex-start}}
`;
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
    const shell = document.createElement('div'); shell.className = 'shell'; nav.append(shell);
    const bar = document.createElement('div'); bar.className = 'bar';
    const portal = link('RO Tools', portalUrl); portal.className = 'portal'; portal.setAttribute('aria-label', 'กลับ RO Tools Portal');
    bar.append(portal); shell.append(bar);
    if (current) {
      if (current.identity) nav.style.setProperty('--tool-accent', current.identity.accent);
      const name = document.createElement('span'); name.className = 'current';
      const icon = chip(current.identity); if (icon) name.append(icon);
      const title = document.createElement('span'); title.className = 'current-text'; title.textContent = current.title; name.append(title); bar.append(name);
      const button = document.createElement('button'); button.type = 'button'; button.setAttribute('aria-label', 'เครื่องมืออื่น');
      const menuLabel = document.createElement('span'); menuLabel.className = 'menu-label'; menuLabel.textContent = 'เครื่องมืออื่น';
      const menuIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); menuIcon.classList.add('menu-icon'); menuIcon.setAttribute('viewBox', '0 0 24 24'); menuIcon.setAttribute('aria-hidden', 'true');
      const menuPath = document.createElementNS('http://www.w3.org/2000/svg', 'path'); menuPath.setAttribute('d', 'M4 6h16M4 12h16M4 18h16'); menuPath.setAttribute('fill', 'none'); menuPath.setAttribute('stroke', 'currentColor'); menuPath.setAttribute('stroke-width', '2'); menuIcon.append(menuPath); button.append(menuLabel, menuIcon); button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-controls', 'tools');
      const panel = document.createElement('div'); panel.id = 'tools'; panel.hidden = true;
      const list = document.createElement('ul'); const notice = document.createElement('p'); notice.setAttribute('role', 'status');
      panel.append(list, notice); bar.append(button); shell.append(panel);
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
