import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const metrics = [];
await mkdir('test-results/task-first-baseline', { recursive:true });
for (const width of [360,390,768,1440]) for (const theme of ['light','dark']) for (const returning of [false,true]) {
 const context = await browser.newContext({ viewport:{width,height:900}, reducedMotion:'reduce' });
 await context.addInitScript(({theme,returning}) => {
  localStorage.setItem('ro-suite:prefs:v1',JSON.stringify({version:1,theme}));
  if(returning) localStorage.setItem('ro-suite:portal:v1',JSON.stringify({version:1,favorites:['best-status'],recent:['leveling-map']}));
 },{theme,returning});
 const page = await context.newPage(); await page.goto('http://127.0.0.1:4173/ro_tools_portal/');
 await page.waitForSelector('#search-controls:not([hidden])');
 metrics.push({width,theme,returning,...await page.evaluate(() => ({heroHeight:document.querySelector('.hero').getBoundingClientRect().height,quickHeight:document.querySelector('#quick-access').getBoundingClientRect().height,searchTop:document.querySelector('#search').getBoundingClientRect().top,overflow:document.documentElement.scrollWidth-innerWidth}))});
 await page.screenshot({path:`test-results/task-first-baseline/before-${returning?'returning':'initial'}-${width}-${theme}.png`,fullPage:true});
 await context.close();
}
await writeFile('test-results/task-first-baseline/metrics.json', JSON.stringify({base:'f17c9fd03c33b4519a9594999123ac8ca7ef9add',metrics},null,2));
await browser.close();
