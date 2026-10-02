import Ajv from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import schema from '../schemas/tools-registry.schema.json' with { type: 'json' };
import sources from '../data/sources.json' with { type: 'json' };
import journeys from '../data/journeys.v1.json' with { type: 'json' };
import { catalog, tools, categories, approvedUrl, escapeHtml as e, type Tool } from '../src/catalog.ts';
import { toolIconSvg, contrastOnWhite, type ToolIcon } from '../src/tool-icons.ts';

export function validateCatalog() {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  if (!ajv.validate(schema, catalog)) throw new Error(ajv.errorsText());
  const ids = new Set(tools.map(tool => tool.id));
  if (ids.size !== tools.length) throw new Error('Duplicate tool IDs');
  for (const tool of tools) {
    if (tool.listingStatus === 'listed' && !approvedUrl(tool.canonicalUrl)) throw new Error(`Unapproved URL: ${tool.id}`);
    if (tool.repositoryUrl && tool.repositoryUrl !== `https://github.com/${tool.repository}`) throw new Error('Repository URL mismatch');
    if (tool.relatedToolIds.some(id => !ids.has(id) || id === tool.id)) throw new Error('Invalid related ID');
    if (tool.categories.some(id => !categories.some(category => category.id === id))) throw new Error('Unknown category');
    if (tool.sourceIds.some(id => !sources.sources.some(source => source.id === id))) throw new Error('Unknown source');
    if (contrastOnWhite(tool.identity.accent) < 4.5) throw new Error(`Accent too light for white icons: ${tool.id}`);
  }
  if (new Set(tools.map(tool => tool.identity.accent)).size !== tools.length) throw new Error('Duplicate tool accent');
  for (const journey of journeys.journeys) if (journey.toolIds.some(id => !ids.has(id))) throw new Error('Unknown journey tool');
}

// Tool identity (accent + icon) is shared with the tool's own site via ro-suite-nav; accent is schema-validated hex.
const icon = (tool: Tool) => toolIconSvg(tool.identity.icon as ToolIcon);
const accent = (tool: Tool) => `style="--tool-accent:${e(tool.identity.accent)}"`;
const kinds: Record<string, string> = { calculator: 'เครื่องคำนวณ', guide: 'คู่มือ' };
const health: Record<string, string> = { unverified: 'ยังไม่ได้ตรวจการเปิดเว็บ', ok: 'เปิดเว็บได้ ณ เวลาที่ตรวจ', warning: 'ควรตรวจสอบลิงก์', unreachable: 'เปิดไม่สำเร็จ ณ เวลาที่ตรวจ', 'not-applicable': 'ยังไม่มีเว็บปลายทาง' };
// Display form of an approved launch URL, e.g. "econds.github.io/ro-leveling-map".
const shortUrl = (url: string) => { const { host, pathname } = new URL(url); return host + pathname.replace(/\/$/, ''); };

// Decorative banner art (aria-hidden). Themed per destination so each card signals where its link goes.
const grid = Array.from({ length: 13 }, (_, i) => `M${i * 32} 0v120`).join('') + 'M0 30h400M0 60h400M0 90h400';
const art: Record<string, [string, string, string]> = {
  'leveling-map': ['#285f3f', '#9cc65b', `<path d="${grid}" stroke="#fff" stroke-opacity=".13"/><path d="M0 120 60 78l50 30 60-44 70 56Z" fill="#fff" fill-opacity=".1"/><path d="M28 98C90 36 140 112 206 64s110-30 160-10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 9" stroke-opacity=".9"/><path d="M206 30c-9 0-16 7-16 16 0 12 16 26 16 26s16-14 16-26c0-9-7-16-16-16Z" fill="#f6d45c"/><circle cx="206" cy="46" r="6" fill="#285f3f"/><path d="M366 26c-7 0-12 5-12 12 0 9 12 20 12 20s12-11 12-20c0-7-5-12-12-12Z" fill="#fff" fill-opacity=".85"/><g fill="#fff" fill-opacity=".7"><rect x="300" y="92" width="8" height="18" rx="2"/><rect x="312" y="84" width="8" height="26" rx="2"/><rect x="324" y="74" width="8" height="36" rx="2"/></g>`],
  'reform-workshop': ['#6d3f0c', '#e3a73d', `<g fill="#fff" fill-opacity=".12"><circle cx="330" cy="30" r="70"/><circle cx="330" cy="30" r="44"/></g><path d="M236 58h124c0 13-15 20-34 22v12h16v14h-88v-14h16V80c-20-2-34-9-34-22Z" fill="#2b1a06" fill-opacity=".55"/><path d="m304 20 26 22-6 7-26-22Z" fill="#fff" fill-opacity=".85"/><rect x="286" y="10" width="26" height="14" rx="3" transform="rotate(40 299 17)" fill="#fff"/><g fill="#ffe7a8"><path d="m262 40 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/><path d="m350 46 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/></g><g stroke="#fff" stroke-opacity=".7" stroke-width="1.5"><path d="M50 30 72 52 50 90 28 52Z" fill="#9fe3f0" fill-opacity=".8"/><path d="m104 50 16 16-16 28-16-28Z" fill="#f8b4d9" fill-opacity=".8"/><path d="m150 26 12 12-12 22-12-22Z" fill="#c6f29a" fill-opacity=".8"/></g>`],
  'dim-glacier': ['#163f68', '#7fd0e6', `<g fill="#fff"><path d="M40 120 70 34l24 86Z" fill-opacity=".22"/><path d="m78 120 34-100 30 100Z" fill-opacity=".32"/><path d="m130 120 22-62 22 62Z" fill-opacity=".18"/><path d="m330 120 26-80 24 80Z" fill-opacity=".2"/></g><path d="M214 104 300 18l6 6-86 86Z" fill="#eafaff"/><path d="m300 18 16-6-6 16Z" fill="#fff"/><rect x="206" y="92" width="26" height="6" rx="2" transform="rotate(-45 219 95)" fill="#0d2a47"/><circle cx="208" cy="106" r="5" fill="#0d2a47"/><g stroke="#fff" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"><path d="M370 18v28M356 32h28M360 22l20 20M380 22l-20 20"/><path d="M190 22v14M183 29h14"/></g>`],
  'ocean-week-guide': ['#0d4466', '#43b1cf', `<circle cx="320" cy="34" r="20" fill="#ffe08a"/><path d="M270 72h60l-10 14h-40Z" fill="#fff" fill-opacity=".9"/><path d="M298 38v34l-22-6Z" fill="#fff"/><g fill="none" stroke-linecap="round"><path d="M0 84q25-12 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0" stroke="#fff" stroke-opacity=".55" stroke-width="3"/></g><path d="M0 96q25-12 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V120H0Z" fill="#fff" fill-opacity=".18"/><path d="M0 108q25-10 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V120H0Z" fill="#082f4a" fill-opacity=".4"/><g fill="#fff" fill-opacity=".8"><path d="M70 40c10-8 22-8 30 0-8 8-20 8-30 0Zm30 0 8-6v12Z"/><circle cx="140" cy="30" r="3"/><circle cx="150" cy="44" r="2"/></g>`],
  'best-status': ['#412766', '#9a77ca', `<path d="${grid}" stroke="#fff" stroke-opacity=".1"/><g fill="#fff" fill-opacity=".8"><rect x="48" y="68" width="22" height="36" rx="4"/><rect x="84" y="46" width="22" height="58" rx="4"/><rect x="120" y="24" width="22" height="80" rx="4"/></g><path d="M254 26h64l22 30-54 54-54-54Z" fill="#eadcff" fill-opacity=".9"/><path d="M232 56h108M270 26l-12 30 28 54 28-54-12-30" fill="none" stroke="#7047a8" stroke-width="3"/><path d="m190 20 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill="#fff"/>`],
  'grade-refine': ['#4d5550', '#9aa39d', `<path d="${grid}" stroke="#fff" stroke-opacity=".1"/><g fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2.5" stroke-dasharray="6 6"><rect x="240" y="30" width="70" height="30" rx="6"/><path d="M275 60v44"/></g><g fill="#fff" fill-opacity=".6" font-family="Georgia,serif" font-size="30"><text x="60" y="72">+7</text><text x="130" y="96" font-size="22">+9</text><text x="340" y="84" font-size="26">+10</text></g>`],
};
function cardArt(tool: Tool) {
  const [from, to, body] = art[tool.id] || art['grade-refine'];
  const id = `art-${e(tool.id)}`;
  return `<div class="card-art" aria-hidden="true"><svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice" focusable="false"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="400" height="120" fill="url(#${id})"/>${body}</svg></div>`;
}
function launch(tool: Tool, label?: string) {
  return tool.listingStatus === 'listed' && approvedUrl(tool.canonicalUrl)
    ? `<a class="launch" data-launch="${e(tool.id)}" href="${e(tool.canonicalUrl)}"><span class="launch-text">${e(label || (tool.contentLifecycle === 'archived-period' ? 'อ่านคู่มือย้อนหลัง' : 'เปิดเครื่องมือ'))}<span class="launch-url">${e(shortUrl(tool.canonicalUrl!))}</span></span><span class="launch-arrow" aria-hidden="true">↗</span></a>`
    : '<span class="planned-label">อยู่ในแผน · ยังไม่เปิดให้ใช้งาน</span>';
}
function destinations() {
  return tools.map(tool => {
    const cat = categories.find(category => tool.categories.includes(category.id))!;
    const inner = `<span class="dest-icon" aria-hidden="true">${icon(tool)}</span><span class="dest-body"><strong>${e(tool.title)}</strong><span class="dest-url">${tool.listingStatus === 'listed' ? e(shortUrl(tool.canonicalUrl!)) : 'อยู่ในแผน · ยังไม่เปิดให้ใช้'}</span></span>`;
    return tool.listingStatus === 'listed' && approvedUrl(tool.canonicalUrl)
      ? `<li><a class="dest ${e(cat.id)}" ${accent(tool)} data-launch="${e(tool.id)}" href="${e(tool.canonicalUrl)}">${inner}<span class="dest-arrow" aria-hidden="true">↗</span></a></li>`
      : `<li><span class="dest dest-planned ${e(cat.id)}" ${accent(tool)}>${inner}</span></li>`;
  }).join('');
}
function card(tool: Tool, index: number) {
  const planned = tool.listingStatus === 'planned';
  const cat = categories.find(category => tool.categories.includes(category.id))!;
  const archive = tool.contentLifecycle === 'archived-period';
  return `<article id="tool-${e(tool.id)}" class="tool-card ${e(cat.id)}${planned ? ' planned' : ''}" data-tool="${e(tool.id)}" ${accent(tool)} aria-labelledby="title-${e(tool.id)}">
    ${cardArt(tool)}
    <div class="card-top"><span class="tool-icon" aria-hidden="true">${icon(tool)}</span><span class="category-label">${e(cat.label)}${kinds[tool.contentType] ? `<span class="kind"> · ${e(kinds[tool.contentType])}</span>` : ''}</span><span class="card-number" aria-hidden="true">0${index + 1}</span></div>
    <div class="card-heading"><h3 id="title-${e(tool.id)}">${e(tool.title)}</h3>${planned ? '' : `<button class="pin" type="button" data-pin="${e(tool.id)}" aria-label="ปักหมุด ${e(tool.title)}" aria-pressed="false" hidden><span aria-hidden="true">☆</span></button>`}</div>
    ${archive ? '<p class="archive-badge">คู่มือกิจกรรมรอบที่ผ่านมา</p>' : ''}
    <p class="description">${e(tool.description)}</p>
    ${tool.event ? `<p class="event-period">ช่วงกิจกรรม ${e(tool.event.startsOn)} – ${e(tool.event.endsOn)} (เวลาไทย)<br>สิ้นสุดก่อนปิดปรับปรุงเซิร์ฟเวอร์</p>` : ''}
    <ul class="tags" aria-label="คำสำคัญ">${tool.tags.map(tag => `<li>${e(tag)}</li>`).join('')}</ul>
    <div class="card-actions">${launch(tool)}</div>
    <details class="evidence"><summary>สถานะข้อมูลและเครื่องมือที่เกี่ยวข้อง</summary>
      <dl><dt>ทบทวนคำอธิบายล่าสุด</dt><dd>${e(tool.metadataReviewedOn)}</dd><dt>ยืนยันข้อมูลในเกม</dt><dd>${e(tool.gameDataVerifiedOn || 'ยังไม่ได้ยืนยัน')}</dd><dt>สถานะลิงก์</dt><dd>${e(health[tool.linkHealth.state])}</dd><dt>ตรวจลิงก์ล่าสุด</dt><dd>${e(tool.linkHealth.lastCheckedAt || 'ยังไม่มีผลตรวจ')}</dd></dl>
      ${tool.sourceIds.length ? `<p>แหล่งข้อมูล: ${tool.sourceIds.map(id => { const source = sources.sources.find(s => s.id === id)!; return `<a href="${e(source.url)}">${e(id)}</a>`; }).join(' · ')}</p>` : ''}
      <p>เครื่องมือที่เกี่ยวข้อง</p><ul>${tool.relatedToolIds.map(id => { const other = tools.find(t => t.id === id)!; return `<li>${other.listingStatus === 'planned' ? `${e(other.title)} — อยู่ในแผน` : `<a data-launch="${e(other.id)}" href="${e(other.canonicalUrl!)}">${e(other.title)}</a>`}</li>`; }).join('')}</ul>
    </details>
  </article>`;
}

export function renderPortal() {
  validateCatalog();
  return `<div class="app-shell">
  <header class="site-header"><a class="brand" href="#"><span class="brand-mark" aria-hidden="true">R<span>O</span></span><span>RO TOOLS<span class="brand-sub">เครื่องมือของ econDS</span></span></a><nav aria-label="เมนูหลัก"><a href="#journeys">เริ่มจากสิ่งที่อยากทำ</a><a href="#about">เกี่ยวกับ</a><button id="theme-toggle" type="button" hidden>โหมดมืด</button></nav></header>
  <main id="main" tabindex="-1"><p id="offline-status" class="pwa-status" role="status" hidden></p><p id="pwa-update" class="pwa-status" role="status" hidden>มีรุ่นใหม่พร้อมแล้ว ปิดแท็บและหน้าต่างแอป Portal ทั้งหมด แล้วเปิดใหม่เพื่ออัปเดตสำเนาออฟไลน์</p><section class="hero" aria-labelledby="page-title"><div><p class="eyebrow"><span aria-hidden="true">✦</span> RAGNAROK ONLINE · TOOL COLLECTION</p><h1 id="page-title">วางแผนให้พร้อม<br><span>ก่อนออกผจญภัย</span></h1><p class="hero-copy">รวมเครื่องคำนวณและคู่มือ Ragnarok Online ไว้ในที่เดียว<br class="desktop-break"> เลือกสิ่งที่อยากทำ แล้วเปิดเครื่องมือที่ใช่ได้ทันที</p><a class="hero-link" href="#tools">ดูเครื่องมือทั้งหมด <span aria-hidden="true">↓</span></a></div><aside class="hero-note" aria-labelledby="destinations-title"><p id="destinations-title" class="note-index">เครื่องมือในชุดนี้</p><ul class="destinations">${destinations()}</ul><span class="note-caption">กดเพื่อเปิดเว็บของเครื่องมือนั้นโดยตรง</span></aside></section>
  <section id="quick-access" class="quick-access" hidden aria-label="ทางลัดส่วนตัว"><div><h2>เครื่องมือที่ปักหมุด</h2><ul id="favorites"></ul></div><div><h2>เปิดล่าสุด</h2><ul id="recent"></ul></div></section>
  <section id="tools" aria-labelledby="tools-title"><div class="section-title"><div><p class="eyebrow">YOUR NEXT ADVENTURE</p><h2 id="tools-title">เลือกเครื่องมือของคุณ</h2></div><p>พร้อมใช้ ${tools.filter(t => t.listingStatus === 'listed').length} รายการ · อยู่ในแผน ${tools.filter(t => t.listingStatus === 'planned').length} รายการ</p></div>
  <div id="search-controls" class="search-controls" hidden><label class="search-field" for="search"><span aria-hidden="true">⌕</span><span class="sr-only">ค้นหาเครื่องมือ</span><input id="search" type="search" maxlength="160" placeholder="ค้นหา เช่น เก็บเวล, Reform, Dim Glacier…" aria-describedby="search-help"></label><div class="filters" role="group" aria-label="หมวดเครื่องมือ"><button type="button" data-category="all" aria-pressed="true">ทั้งหมด</button>${categories.map(cat => `<button type="button" data-category="${e(cat.id)}" aria-pressed="false">${e(cat.label)}</button>`).join('')}</div><p id="search-help">ค้นได้ทั้งชื่อ คำอธิบาย และคำสำคัญ ทั้งภาษาไทยและอังกฤษ</p><p id="result-count" role="status"></p></div>
  <noscript><p class="notice">เปิดเครื่องมือได้จากลิงก์ด้านล่าง เปิด JavaScript เพื่อใช้การค้นหาและปักหมุด</p></noscript>
  <div class="tool-grid">${tools.map(card).join('')}</div><div id="no-results" class="empty-state" hidden><h3>ไม่พบเครื่องมือที่ตรงกัน</h3><p>ลองใช้คำอื่น หรือดูเครื่องมือทั้งหมด</p><button id="clear-filters" type="button">ล้างการค้นหาและตัวกรอง</button></div></section>
  <section id="journeys" aria-labelledby="journeys-title"><div class="section-title"><div><p class="eyebrow">A PLACE TO START</p><h2 id="journeys-title">เริ่มจากสิ่งที่อยากทำ</h2></div></div><div class="journey-grid">${journeys.journeys.map((journey, index) => `<article class="journey"><span class="journey-index">0${index + 1}</span><div><h3>${e(journey.title)}</h3><p>${journey.availability === 'planned-handoff' ? 'เริ่มวางแผนในเครื่องมือแรกได้เลย · การส่งแผนต่อไปยังเครื่องมือถัดไปยังอยู่ในแผน' : 'เปิดดูรายละเอียดและตั้งค่าให้ตรงกับการเล่นของคุณ'}</p>${launch(tools.find(t => t.id === journey.toolIds[0])!, 'เริ่มที่ ' + tools.find(t => t.id === journey.toolIds[0])!.title)}</div></article>`).join('')}</div></section>
  <section id="about" class="about" aria-labelledby="about-title"><div><p class="eyebrow">ABOUT THE COLLECTION</p><h2 id="about-title">จุดเริ่มต้นของแผนคุณ</h2><p>หน้านี้ช่วยให้ค้นหาและเปิดเครื่องมือได้เร็วขึ้น แต่ละเครื่องมือเก็บสูตร ราคา คลัง และการตั้งค่าไว้ในเว็บของตัวเอง การเปิดลิงก์จากหน้านี้จะไม่ส่งแผนหรือแก้ข้อมูลในเครื่องมืออื่น</p></div><div><h3>เกี่ยวกับข้อมูล</h3><p>คำอธิบายทบทวนล่าสุดเมื่อ ${e(catalog.reviewedOn)} จากแหล่งข้อมูลที่อ้างอิง ยังไม่ได้ยืนยันกฎเกมหรือทดสอบการเปิดเว็บจริง ดูสถานะของแต่ละเครื่องมือได้ในการ์ด</p><p>Sessrumnir Ocean Week เป็นคู่มือของกิจกรรมรอบที่ผ่านมา วันที่ในคู่มือไม่ได้ยืนยันว่าจะมีกิจกรรมรอบใหม่</p><details class="pwa-help"><summary>ติดตั้ง Portal เป็นแอปและการใช้งานออฟไลน์</summary><p>บนคอมพิวเตอร์หรือ Android ใช้เมนูติดตั้งแอปของเบราว์เซอร์ที่รองรับ บน iPhone หรือ iPad เปิดใน Safari แล้วเลือกแชร์ → เพิ่มไปยังหน้าจอโฮม ชื่อเมนูอาจต่างกันตามเบราว์เซอร์และรุ่น</p><p>หลังเปิดออนไลน์และบันทึกสำเนาสำเร็จ สามารถกลับมาเปิดหน้ารวมเครื่องมือ ค้นหา และดูหมุดได้ขณะออฟไลน์ เครื่องคำนวณและคู่มือปลายทางเป็นเว็บแยก ยังต้องใช้อินเทอร์เน็ตและไม่ได้ถูกบันทึกโดย Portal</p><p>สำเนาออฟไลน์อาจเป็นรุ่นก่อนหน้า เมื่อออนไลน์ให้โหลดหน้าใหม่เพื่อดูข้อมูลล่าสุด หากมีรุ่นใหม่ ให้ปิดแท็บและหน้าต่างแอป Portal ทั้งหมดแล้วเปิดใหม่ พื้นที่จัดเก็บของเบราว์เซอร์อาจถูกล้างได้</p></details><button id="reset-portal" type="button" hidden>ล้างหมุดและประวัติของพอร์ทัล</button><p id="storage-status" class="storage-status" role="status"></p></div></section></main>
  <footer><span class="footer-brand">RO TOOLS PORTAL</span><span>ทำขึ้นเพื่อช่วยผู้เล่นวางแผน · econDS</span><a href="#">กลับด้านบน ↑</a></footer></div>`.replace(/[ \t]+$/gm, '');
}

export const publicCatalog = () => ({ schemaVersion: 1, catalogVersion: catalog.catalogVersion, tools: catalog.tools.filter(tool => tool.listingStatus !== 'hidden').map(({ id, title, canonicalUrl, listingStatus, identity }) => ({ id, title, canonicalUrl, listingStatus, identity })) });
