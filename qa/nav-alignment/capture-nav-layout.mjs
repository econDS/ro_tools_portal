/**
 * Read-only browser evidence from actual, pinned child-app checkouts.
 * Usage: node qa/nav-alignment/capture-nav-layout.mjs --config qa/nav-alignment/apps.json --out qa-results/before --stage before
 * Roots in config are relative to cwd. Set PLAYWRIGHT_MODULE for nonstandard installs.
 * Never substitutes CSS predictions for getBoundingClientRect measurements.
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { resolve, sep, extname, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const configPath = option('--config', 'qa/nav-alignment/apps.json');
const out = resolve(option('--out', 'qa-results/nav-alignment'));
const stage = option('--stage', 'before');
const config = JSON.parse(await readFile(configPath, 'utf8'));
const widths = config.widths || [320, 360, 390, 430, 768, 1440];
const importFrom = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(importFrom ? pathToFileURL(resolve(importFrom)).href : '@playwright/test');
const git = (root, ...args) => execFileSync('git', ['-C', root, ...args], {encoding:'utf8'}).trim();
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const apps = await Promise.all(config.apps.map(async app => {
  const checkout = resolve(app.checkout);
  const root = resolve(checkout, app.documentRoot || '.');
  const commit = git(checkout, 'rev-parse', 'HEAD');
  if (app.expectedCommit && commit !== app.expectedCommit) throw new Error(`${app.id}: expected ${app.expectedCommit}, got ${commit}`);
  const dirty = git(checkout, 'status', '--porcelain', '--untracked-files=no');
  if (dirty && stage === 'before') throw new Error(`${app.id}: baseline has tracked edits: ${dirty}`);
  const indexHash = sha256(await readFile(resolve(root,'index.html')));
  return {...app, checkout, root, commit, dirty, indexHash};
}));
await mkdir(out, {recursive:true});
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff','.webmanifest':'application/manifest+json'};
const server = createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const [,id,...parts] = decodeURIComponent(url.pathname).split('/');
    const app = apps.find(a=>(a.publicPath || a.id)===id);
    if (!app) {res.writeHead(404);res.end('Unknown app');return;}
    let file = resolve(app.root,parts.join('/')||'index.html');
    if (file !== app.root && !file.startsWith(app.root+sep)) {res.writeHead(403);res.end('Outside document root');return;}
    if ((await stat(file)).isDirectory()) file=resolve(file,'index.html');
    const bytes = await readFile(file);
    res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
  } catch {res.writeHead(404);res.end('Missing file');}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const report = {schemaVersion:1,stage,startedAt:new Date().toISOString(),method:'Actual Chromium DOM geometry; fresh browser context per width/theme; no app CSS/DOM/storage edits',viewports:widths,height:1000,apps:apps.map(({root,checkout,...app})=>({...app,checkout:relative(process.cwd(),checkout),documentRoot:relative(checkout,root)||'.'})),samples:[],failures:[],screenshots:[]};
const screenshotWanted = (width,state) => [390,1440].includes(width) || (width===768&&state==='closed');
try {
  browser = await chromium.launch(process.env.CHROMIUM_EXECUTABLE ? {executablePath:process.env.CHROMIUM_EXECUTABLE} : {});
  report.browserVersion=browser.version();
  for (const app of apps) {
    for (const theme of app.themes) {
      for (const width of widths) {
        const context = await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block',locale:'th-TH'});
        const page = await context.newPage();
        const errors=[], failedRequests=[], badResponses=[];
        page.on('pageerror', e=>errors.push(e.message));
        page.on('requestfailed', req=>failedRequests.push({url:req.url(),error:req.failure()?.errorText}));
        page.on('response', res=>{if(res.status()>=400) badResponses.push({url:res.url(),status:res.status()});});
        const sample={app:app.id,commit:app.commit,width,theme,themeMode:app.themeMode,url:`${origin}/${app.publicPath || app.id}/`,states:{}};
        try {
          const response=await page.goto(sample.url,{waitUntil:'networkidle',timeout:45000});
          if (!response?.ok()) throw new Error(`Main document HTTP ${response?.status()}`);
          await page.waitForFunction(()=>document.querySelector('ro-suite-nav')?.shadowRoot?.querySelector('button[aria-controls="tools"]'),null,{timeout:15000});
          await page.evaluate(()=>document.fonts.ready);
          await page.waitForTimeout(150);
          sample.initialStorage=await page.evaluate(()=>({localStorage:Object.keys(localStorage).sort(),sessionStorage:Object.keys(sessionStorage).sort()}));
          const button=page.locator('ro-suite-nav').getByRole('button');
          for (const state of ['closed','open']) {
            if(state==='open') await button.click();
            sample.states[state]=await page.evaluate(({shell,header,title,headerInner})=>{
              const round=n=>Math.round(n*1000)/1000;
              const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return Object.fromEntries(['x','y','left','top','right','bottom','width','height'].map(k=>[k,round(r[k])]));};
              const box=el=>{if(!el)return null;const r=rect(el),s=getComputedStyle(el),p=k=>parseFloat(s[k])||0;return {border:r,content:{left:round(r.left+p('borderLeftWidth')+p('paddingLeft')),right:round(r.right-p('borderRightWidth')-p('paddingRight')),top:round(r.top+p('borderTopWidth')+p('paddingTop')),bottom:round(r.bottom-p('borderBottomWidth')-p('paddingBottom'))},padding:{left:p('paddingLeft'),right:p('paddingRight'),top:p('paddingTop'),bottom:p('paddingBottom')},margin:{top:p('marginTop'),bottom:p('marginBottom')},display:s.display,position:s.position,background:s.backgroundColor,color:s.color};};
              const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
              const lines=el=>{if(!el)return null;const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);const tops=[];let n;while(n=walker.nextNode()){if(!n.textContent.trim())continue;const range=document.createRange();range.selectNodeContents(n);for(const r of range.getClientRects()) if(r.width&&r.height&&!tops.some(y=>Math.abs(y-r.top)<3))tops.push(round(r.top));}return {count:tops.length,tops:tops.sort((a,b)=>a-b),text:el.textContent.trim().replace(/\s+/g,' '),rect:rect(el)};};
              const host=document.querySelector('ro-suite-nav'),shadow=host.shadowRoot,nav=shadow.querySelector('nav'),bar=shadow.querySelector('.bar'),panel=shadow.querySelector('#tools'),toggle=shadow.querySelector('button'),appShell=document.querySelector(shell),appHeader=document.querySelector(header),appTitle=document.querySelector(title),inner=headerInner?document.querySelector(headerInner):appHeader;
              if(!appShell||!appHeader||!appTitle)throw new Error(`Missing required shell/header/title: ${shell}, ${header}, ${title}`);
              const n=rect(nav),b=rect(bar),s=box(appShell),controls=[...shadow.querySelectorAll('a,button')].filter(visible).map(el=>({tag:el.tagName.toLowerCase(),label:el.textContent.trim().replace(/\s+/g,' '),rect:rect(el),href:el.getAttribute('href'),tabIndex:el.tabIndex,ariaExpanded:el.getAttribute('aria-expanded'),targetAtLeast44:el.getBoundingClientRect().width>=43.999&&el.getBoundingClientRect().height>=43.999}));
              return {host:box(host),nav:box(nav),bar:box(bar),shell:s,header:box(appHeader),headerInner:box(inner),title:lines(appTitle),current:lines(shadow.querySelector('.current')),portalLabel:lines(bar.querySelector('a')),toggleLabel:lines(toggle),navBorderEdgeDelta:{left:round(n.left-s.content.left),right:round(n.right-s.content.right)},barEdgeDelta:{left:round(b.left-s.content.left),right:round(b.right-s.content.right)},gapToHeader:round(appHeader.getBoundingClientRect().top-n.bottom),gapToTitle:round(appTitle.getBoundingClientRect().top-n.bottom),pageOverflow:document.documentElement.scrollWidth-innerWidth,navOverflow:nav.scrollWidth-nav.clientWidth,barChildren:[...bar.children].map(el=>({className:el.className,tag:el.tagName,rect:rect(el)})),controls,smallTargets:controls.filter(c=>!c.targetAtLeast44),open:!panel.hidden,ariaExpanded:toggle.getAttribute('aria-expanded'),actualTheme:{navAttribute:host.getAttribute('theme'),body:box(document.body),rootColorScheme:getComputedStyle(document.documentElement).colorScheme,mediaDark:matchMedia('(prefers-color-scheme:dark)').matches},fonts:{status:document.fonts.status,families:[...document.fonts].map(f=>({family:f.family,status:f.status}))}};
            },app.selectors);
            if(screenshotWanted(width,state)) {
              const filename=`${stage}-${app.id}-${width}-${theme}-${state}.png`;
              await page.screenshot({path:resolve(out,filename),fullPage:false});
              sample.states[state].screenshot=filename;report.screenshots.push(filename);
            }
          }
          // Actual keyboard behavior, with no navigation away from the local fixture.
          await button.focus();await page.keyboard.press('Escape');
          const escapeCloses=await button.getAttribute('aria-expanded')==='false';
          const focusReturned=await button.evaluate(el=>el.getRootNode().activeElement===el);
          await page.keyboard.press('Enter');const enterOpens=await button.getAttribute('aria-expanded')==='true';
          await page.keyboard.press('Space');const spaceCloses=await button.getAttribute('aria-expanded')==='false';
          sample.keyboard={escapeCloses,focusReturned,enterOpens,spaceCloses};
          sample.finalStorage=await page.evaluate(()=>({localStorage:Object.keys(localStorage).sort(),sessionStorage:Object.keys(sessionStorage).sort()}));
          console.log(`${stage} ${app.id} ${width} ${theme}: height=${sample.states.closed.nav.border.height}, edges=${JSON.stringify(sample.states.closed.barEdgeDelta)}, gap=${sample.states.closed.gapToHeader}`);
        } catch(e) {sample.error=e.stack;report.failures.push({app:app.id,width,theme,error:e.message});console.error(`${app.id}/${width}/${theme}: ${e.stack}`);}
        finally {sample.pageErrors=errors;sample.failedRequests=failedRequests;sample.badResponses=badResponses;report.samples.push(sample);await context.close();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
      }
    }
  }
} catch(e) {report.failures.push({stage:'runner',error:e.stack});throw e;}
finally {await browser?.close();await new Promise(resolve=>server.close(resolve));report.finishedAt=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
const rows=report.samples.filter(s=>s.states.closed).map(s=>`${s.app}\t${s.width}\t${s.theme}\t${s.states.closed.nav.border.height}\t${s.states.closed.barEdgeDelta.left}\t${s.states.closed.barEdgeDelta.right}\t${s.states.closed.gapToHeader}\t${s.states.closed.current.count}\t${s.states.open?.smallTargets.length}\t${s.states.closed.pageOverflow}`);
await writeFile(resolve(out,'geometry.tsv'),['app\tviewport\ttheme\tclosed-height\tleft-edge-delta\tright-edge-delta\theader-gap\tcurrent-lines\topen-small-targets\tpage-overflow',...rows].join('\n')+'\n');
if(report.failures.length)process.exitCode=1;
