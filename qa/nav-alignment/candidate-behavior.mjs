import { mkdir,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { loadCandidates,verifyRelease,serveCandidates,PORTAL,CATALOG,EXPECTED,DESTINATIONS } from './candidate-support.mjs';
const args=process.argv.slice(2),option=(n,f)=>args.includes(n)?args[args.indexOf(n)+1]:f;
const out=resolve(option('--out','qa-results/nav-alignment-behavior'));
await mkdir(out,{recursive:true});
const report={schemaVersion:1,startedAt:new Date().toISOString(),scope:'Candidate app keyboard/state checks, blocked-module app fallback, and separate optional-catalogue-failure component fixtures',checks:[],failures:[],normal:[],fallback:[],catalogFailureFixtures:[],linkActivationFixtures:[]};
const check=(subject,name,pass,details={})=>{const r={subject,check:name,passed:Boolean(pass),...details};report.checks.push(r);if(!r.passed)report.failures.push(r);return Boolean(pass);};
const store=async()=>writeFile(resolve(out,'behavior-report.json'),JSON.stringify(report,null,2)+'\n');
let browser,server;
const state=page=>page.evaluate(()=>{const values=s=>Object.fromEntries(Object.keys(s).sort().map(k=>[k,s.getItem(k)]));return {url:location.href,localStorage:values(localStorage),sessionStorage:values(sessionStorage),forms:[...document.querySelectorAll('input,select,textarea')].map(el=>({tag:el.tagName,id:el.id,name:el.name,type:el.type,value:el.value,checked:el.checked??null}))};});
const active=page=>page.evaluate(()=>{const host=document.querySelector('ro-suite-nav'),el=host?.shadowRoot?.activeElement;return {inNav:document.activeElement===host&&!!el,tag:el?.tagName??document.activeElement?.tagName,label:el?.getAttribute('aria-label')||el?.textContent?.trim(),href:el?.getAttribute('href')||null};});
try{
 const {config,apps}=await loadCandidates(option('--config','qa/nav-alignment/candidates.json'));
 report.provenance=await verifyRelease(config,apps);
 server=await serveCandidates(apps,config.release.version);
 const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href:'@playwright/test');
 browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});report.browserVersion=browser.version();
 for(const app of apps)for(const theme of app.themes){
  let normalDefaults;
  // These are actual app integrations with original defaults. URL sentinels are added
  // only after an untouched state is saved, via history.replaceState in a labeled test.
  for(const width of [390,1440]){
   const subject=`normal/${app.id}/${width}/${theme}`;
   const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block',locale:'th-TH'});
   const page=await context.newPage(),errors=[],catalogRequests=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url()===CATALOG)catalogRequests.push(r.url());});
   const entry={app:app.id,commit:app.commit,width,theme,errors,catalogRequests,keyboardTrace:[]};
   try{
    await page.goto(`${server.origin}/${app.publicPath}/`,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>document.querySelector('ro-suite-nav')?.shadowRoot?.querySelector('button'),null,{timeout:15000});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(100);
    entry.untouchedDefault=await state(page);if(width===390)normalDefaults=entry.untouchedDefault;
    const locator=page.locator('ro-suite-nav'),button=locator.getByRole('button'),portal=locator.locator('.bar a'),links=locator.locator('#tools li a');
    await page.evaluate(()=>{const u=new URL(location.href);u.searchParams.set('nav_qa','preserve-query');u.hash='nav-qa-preserve-fragment';history.replaceState(history.state,'',u);});
    entry.stateFixture='Query/hash preservation sentinels set with history.replaceState only after app default load; not baseline screenshots';entry.before=await state(page);
    await portal.focus();await page.keyboard.press('Tab');entry.keyboardTrace.push(await active(page));
    check(subject,'Tab from Portal reaches toggle',await button.evaluate(el=>el.getRootNode().activeElement===el));
    await page.keyboard.press('Enter');check(subject,'Enter opens menu',await button.getAttribute('aria-expanded')==='true');
    const expectedOrder=await links.evaluateAll(els=>els.map(e=>e.href));
    for(let i=0;i<expectedOrder.length;i++){await page.keyboard.press('Tab');const focus=await active(page);entry.keyboardTrace.push(focus);check(subject,`Tab reaches tool link ${i+1}`,focus.inNav&&focus.href===expectedOrder[i],{expected:expectedOrder[i],actual:focus});}
    await page.keyboard.press('Tab');const exit=await active(page);entry.keyboardTrace.push(exit);check(subject,'Tab leaves menu without trapping focus',!exit.inNav);check(subject,'Tab exit closes menu',await button.getAttribute('aria-expanded')==='false');
    await button.focus();await page.keyboard.press('Space');check(subject,'Space opens menu',await button.getAttribute('aria-expanded')==='true');
    await page.keyboard.press('Escape');check(subject,'Escape closes menu',await button.getAttribute('aria-expanded')==='false');check(subject,'Escape returns focus to toggle',await button.evaluate(el=>el.getRootNode().activeElement===el));
    await page.keyboard.press('Shift+Tab');check(subject,'Shift+Tab returns to Portal anchor',await portal.evaluate(el=>el.getRootNode().activeElement===el));
    await button.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');check(subject,'Space closes an open menu',await button.getAttribute('aria-expanded')==='false');
    for(let i=0;i<3;i++){await button.click();check(subject,`Repeated open ${i+1}`,await button.getAttribute('aria-expanded')==='true');await button.click();check(subject,`Repeated close ${i+1}`,await button.getAttribute('aria-expanded')==='false');}
    await button.click();
    entry.menu=await page.evaluate(()=>{const h=document.querySelector('ro-suite-nav'),s=h.shadowRoot;return {toolId:h.getAttribute('tool-id'),current:s.querySelector('.current').textContent.trim(),links:[...s.querySelectorAll('a')].map(a=>({href:a.href,label:a.textContent.trim(),name:a.getAttribute('aria-label')||a.textContent.trim(),current:a.getAttribute('aria-current')})),planned:[...s.querySelectorAll('li')].filter(li=>!li.querySelector('a')).map(li=>({text:li.textContent.trim(),focusables:li.querySelectorAll('a[href],button,input,select,textarea,[tabindex]').length})),scheme:getComputedStyle(h).colorScheme,theme:h.getAttribute('theme'),openLabels:[...s.querySelectorAll('li a')].map(a=>({text:a.textContent.trim(),clientWidth:a.clientWidth,scrollWidth:a.scrollWidth,overflow:getComputedStyle(a).overflow,textOverflow:getComputedStyle(a).textOverflow})),smallTargets:[...s.querySelectorAll('a,button')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.height&&(r.width<44||r.height<44);}).map(el=>el.textContent.trim())};});
    check(subject,'Exact six approved anchor destinations',JSON.stringify(entry.menu.links.map(x=>x.href).sort())===JSON.stringify(DESTINATIONS),{actual:entry.menu.links.map(x=>x.href)});
    check(subject,'Current full accessible identity retained',entry.menu.toolId===app.toolId&&entry.menu.current===app.expectedTitle,{current:entry.menu.current});
    for(const expected of EXPECTED)check(subject,`Full menu title: ${expected.toolId}`,entry.menu.links.some(l=>l.href===expected.url&&l.label===expected.title));
    check(subject,'Planned Grade & Refine has no launch target',entry.menu.planned.length===1&&entry.menu.planned[0].text==='Grade & Refine Workshop — อยู่ในแผน'&&entry.menu.planned[0].focusables===0,{planned:entry.menu.planned});
    check(subject,'Only current app link marked current',entry.menu.links.filter(l=>l.current==='page').length===1&&entry.menu.links.find(l=>l.current==='page')?.href===EXPECTED.find(e=>e.id===app.id).url);
    check(subject,'Actual app theme reaches nav',entry.menu.scheme===theme&&(app.themeMode==='automatic-device'||entry.menu.theme===theme),{actual:entry.menu.scheme,attribute:entry.menu.theme});
    check(subject,'All open suite links/buttons at least44px',entry.menu.smallTargets.length===0,{smallTargets:entry.menu.smallTargets});
    check(subject,'Open destination names not clipped',entry.menu.openLabels.every(l=>l.scrollWidth<=l.clientWidth+1),{labels:entry.menu.openLabels});
    await page.keyboard.press('Escape');
    const themeSnapshot=()=>page.evaluate(()=>{const host=document.querySelector('ro-suite-nav'),nav=host.shadowRoot.querySelector('nav'),n=getComputedStyle(nav),b=getComputedStyle(document.body);return {mediaDark:matchMedia('(prefers-color-scheme:dark)').matches,navTheme:host.getAttribute('theme'),navScheme:getComputedStyle(host).colorScheme,navBackground:n.backgroundColor,navColor:n.color,appBackground:b.backgroundColor,appImage:b.backgroundImage,appColor:b.color};});
    const other=theme==='light'?'dark':'light';entry.themeTransition={before:await themeSnapshot(),stateBefore:await state(page)};await page.emulateMedia({colorScheme:other});await page.waitForTimeout(100);entry.themeTransition.oppositeSystem=await themeSnapshot();
    const bt=entry.themeTransition.before,ot=entry.themeTransition.oppositeSystem,auto=app.themeMode==='automatic-device';
    check(subject,'Same-page system theme matches actual app theme contract',ot.navScheme===(auto?other:theme)&&ot.mediaDark===(other==='dark'),{before:bt,opposite:ot,mode:app.themeMode});
    check(subject,auto?'Automatic nav colors respond to system theme':'Fixed nav colors survive opposite system theme',auto?(bt.navBackground!==ot.navBackground&&bt.navColor!==ot.navColor):(bt.navBackground===ot.navBackground&&bt.navColor===ot.navColor));
    check(subject,auto?'Automatic app colors respond to system theme':'Fixed app colors survive opposite system theme',auto?(bt.appBackground!==ot.appBackground||bt.appImage!==ot.appImage||bt.appColor!==ot.appColor):(bt.appBackground===ot.appBackground&&bt.appImage===ot.appImage&&bt.appColor===ot.appColor));
    await page.emulateMedia({colorScheme:theme});await page.waitForTimeout(100);entry.themeTransition.restored=await themeSnapshot();entry.themeTransition.stateAfter=await state(page);check(subject,'Theme flip preserves URL and storage values',JSON.stringify(entry.themeTransition.stateBefore)===JSON.stringify(entry.themeTransition.stateAfter));check(subject,'Theme flip restores initial nav colors',JSON.stringify(entry.themeTransition.before)===JSON.stringify(entry.themeTransition.restored));
    entry.after=await state(page);
    check(subject,'Navigation preserves storage values, forms, query and hash',JSON.stringify(entry.before)===JSON.stringify(entry.after),{before:entry.before,after:entry.after});
    check(subject,'Default app nav needs no remote catalogue request',catalogRequests.length===0);check(subject,'No page JavaScript errors',errors.length===0,{errors});
   }catch(e){entry.error=e.stack;check(subject,'Scenario completed',false,{error:e.message});}
   finally{report.normal.push(entry);await context.close();await store();}
  }
  // Real native anchors in the actual candidate page are activated unchanged.
  // Only their destination responses are harmless, explicitly labeled landing fixtures.
  if(theme===app.themes[0])for(const destination of DESTINATIONS){
   const subject=`native-link-activation/${app.id}/${destination}`,context=await browser.newContext({viewport:{width:390,height:1000},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block',locale:'th-TH'}),page=await context.newPage();let landed=0;
   const entry={app:app.id,destination,fixtureOnly:true,scope:'Native real-app anchor activation to exact canonical URL; destination response is a harmless landing fixture, not a functional app test'};
   await page.route(destination,route=>{landed++;return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:'<!doctype html><title>Navigation destination activation fixture</title><main id="nav-destination-fixture">Harmless destination fixture</main>'});});
   try{
    await page.goto(`${server.origin}/${app.publicPath}/`,{waitUntil:'networkidle'});await page.waitForFunction(()=>!!document.querySelector('ro-suite-nav')?.shadowRoot?.querySelector('button'));
    const nav=page.locator('ro-suite-nav');if(destination!==PORTAL)await nav.getByRole('button').click();
    const anchor=destination===PORTAL?nav.locator('.bar a'):nav.locator(`#tools a[href="${destination}"]`);
    entry.nativeHref=await anchor.getAttribute('href');check(subject,'Native href remains canonical before click',entry.nativeHref===destination);
    await Promise.all([page.waitForURL(destination,{waitUntil:'domcontentloaded'}),anchor.click()]);entry.landedUrl=page.url();entry.interceptedResponses=landed;
    check(subject,'Native click navigates to exact canonical destination',page.url()===destination&&landed===1&&await page.locator('#nav-destination-fixture').count()===1,{actual:page.url(),landed});
   }catch(e){entry.error=e.stack;check(subject,'Scenario completed',false,{error:e.message});}
   finally{report.linkActivationFixtures.push(entry);await context.close();await store();}
  }
  // App fallback: block its local module request. No DOM, CSS or theme mutation.
  for(const width of [320,390,430]){
   const subject=`blocked-module/${app.id}/${width}/${theme}`,context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block',locale:'th-TH'}),page=await context.newPage(),errors=[];let blocked=0;
   page.on('pageerror',e=>errors.push(e.message));
   await page.route(`**/${app.publicPath}/assets/ro-suite/${config.release.version}/nav.js`,route=>{blocked++;return route.abort('failed');});
   const entry={app:app.id,theme,width,errors};
   try{
    await page.goto(`${server.origin}/${app.publicPath}/`,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
    entry.geometry=await page.evaluate(({shell,header,title})=>{const h=document.querySelector('ro-suite-nav'),n=h.querySelector('nav'),a=n.querySelector('a'),s=document.querySelector(shell),head=document.querySelector(header);const r=e=>{const z=e.getBoundingClientRect();return {left:z.left,right:z.right,top:z.top,bottom:z.bottom,width:z.width,height:z.height};},content=e=>{const z=r(e),c=getComputedStyle(e);return {left:z.left+parseFloat(c.paddingLeft)+parseFloat(c.borderLeftWidth),right:z.right-parseFloat(c.paddingRight)-parseFloat(c.borderRightWidth)};};const nc=content(n),sc=content(s),range=document.createRange();range.selectNodeContents(a);const textRect=range.getBoundingClientRect();return {fallbackTextLeft:textRect.left,fallbackTextLeftDelta:textRect.left-sc.left,shadowAbsent:!h.shadowRoot,nav:r(n),link:r(a),appShell:r(s),appShellContent:sc,navContent:nc,barEdgeDelta:{left:nc.left-sc.left,right:nc.right-sc.right},href:a.href,visible:!!(a.getBoundingClientRect().height&&getComputedStyle(a).visibility!=='hidden'),headerGap:head.getBoundingClientRect().top-n.getBoundingClientRect().bottom,title:document.querySelector(title).textContent.trim(),pageOverflow:document.documentElement.scrollWidth-innerWidth,navOverflow:n.scrollWidth-n.clientWidth};},app.selectors);
    entry.state=await state(page);
    check(subject,'Only local nav module unavailable',blocked===1&&entry.geometry.shadowAbsent,{blocked});check(subject,'Fallback Portal link visible and correct',entry.geometry.visible&&entry.geometry.href===PORTAL);
    check(subject,'Fallback target at least44px',entry.geometry.link.width>=44&&entry.geometry.link.height>=44);
    check(subject,'Fallback content aligns within1px',Math.abs(entry.geometry.barEdgeDelta.left)<=1&&Math.abs(entry.geometry.barEdgeDelta.right)<=1,{delta:entry.geometry.barEdgeDelta});
    check(subject,'Fallback visible text aligns within1px',Math.abs(entry.geometry.fallbackTextLeftDelta)<=1,{textLeft:entry.geometry.fallbackTextLeft,appLeft:entry.geometry.appShellContent.left,delta:entry.geometry.fallbackTextLeftDelta});
    check(subject,'Fallback before header without overlap',entry.geometry.headerGap>=-0.5&&entry.geometry.nav.top>=0&&entry.geometry.nav.top<60&&entry.geometry.title.length>0,{geometry:entry.geometry});
    check(subject,'Fallback does not overflow',entry.geometry.pageOverflow===0&&entry.geometry.navOverflow<=1);
    check(subject,'App default forms stay available without nav module',normalDefaults&&JSON.stringify(entry.state.forms)===JSON.stringify(normalDefaults.forms),{normal:normalDefaults?.forms,fallback:entry.state.forms});
    const anchor=page.locator('ro-suite-nav > nav > a');await anchor.focus();check(subject,'Fallback link keyboard focusable',await anchor.evaluate(el=>document.activeElement===el));await page.keyboard.press('Tab');check(subject,'Tab exits fallback',await anchor.evaluate(el=>document.activeElement!==el));
    check(subject,'No fallback page JavaScript errors',errors.length===0,{errors});
    if(width===390){const a11y=await new AxeBuilder({page}).include('ro-suite-nav').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();entry.a11y={violations:a11y.violations,incomplete:a11y.incomplete,passes:a11y.passes.map(p=>p.id)};check(subject,'Fallback nav accessibility including actual color contrast',a11y.violations.length===0,{violations:a11y.violations});
    entry.screenshot=`after-${app.id}-390-${theme}-blocked-module.png`;await page.screenshot({path:resolve(out,entry.screenshot),fullPage:false});}
   }catch(e){entry.error=e.stack;check(subject,'Scenario completed',false,{error:e.message});}
   finally{report.fallback.push(entry);await context.close();await store();}
  }
  // Deliberately separate standalone fixture: production integrations are not edited
  // to pretend they enable an optional catalogue. The fixture explicitly enables it.
  {
   const subject=`optional-catalog-failure-fixture/${app.id}/${theme}`,context=await browser.newContext({viewport:{width:390,height:1000},colorScheme:theme,reducedMotion:'reduce',serviceWorkers:'block',locale:'th-TH'}),page=await context.newPage();let requests=0,signalRequest,releaseRequest;const requested=new Promise(r=>{signalRequest=r;}),release=new Promise(r=>{releaseRequest=r;});
   await page.route(CATALOG,async route=>{requests++;signalRequest();await release;return route.abort('failed');});const entry={app:app.id,theme,fixtureOnly:true};
   try{
    await page.goto(`${server.origin}/__nav_qa_catalog_failure__/${app.id}?theme=${theme}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>!!document.querySelector('ro-suite-nav')?.shadowRoot?.querySelector('button'));const button=page.locator('ro-suite-nav').getByRole('button');
    check(subject,'Catalogue lazy until menu opens',requests===0);await button.click();
    let pendingTimer;try{await Promise.race([requested,new Promise((_,reject)=>{pendingTimer=setTimeout(()=>reject(new Error('Optional catalogue request never started')),5000);})]);}finally{clearTimeout(pendingTimer);}
    entry.pendingLiveRegion=await page.evaluate(()=>{const s=document.querySelector('ro-suite-nav').shadowRoot,p=s.querySelector('[role="status"]'),panel=s.querySelector('#tools'),style=getComputedStyle(p);return {connected:p.isConnected,role:p.getAttribute('role'),text:p.textContent,display:style.display,visibility:style.visibility,panelHidden:panel.hidden,ariaHidden:p.getAttribute('aria-hidden')};});
    check(subject,'Empty status live region stays rendered while request is pending',entry.pendingLiveRegion.connected&&entry.pendingLiveRegion.role==='status'&&entry.pendingLiveRegion.text===''&&entry.pendingLiveRegion.display!=='none'&&entry.pendingLiveRegion.visibility==='visible'&&!entry.pendingLiveRegion.panelHidden&&entry.pendingLiveRegion.ariaHidden!=='true',{pending:entry.pendingLiveRegion,scope:'DOM/CSS availability only; no actual assistive-technology speech claim'});
    releaseRequest();await page.waitForFunction(()=>document.querySelector('ro-suite-nav').shadowRoot.querySelector('[role="status"]').textContent.length>0);
    entry.result=await page.evaluate(()=>{const s=document.querySelector('ro-suite-nav').shadowRoot;return {notice:s.querySelector('[role="status"]').textContent,hrefs:[...s.querySelectorAll('a')].map(a=>a.href).sort(),current:s.querySelector('.current').textContent.trim(),open:!s.querySelector('#tools').hidden};});
    check(subject,'Failure keeps six bundled destinations',JSON.stringify(entry.result.hrefs)===JSON.stringify(DESTINATIONS));check(subject,'Failure keeps full current identity',entry.result.current===app.expectedTitle);check(subject,'Failure notice and usable open menu',entry.result.notice.length>0&&entry.result.open);
    await button.click();await button.click();check(subject,'No retry loop on repeated open',requests===1,{requests});entry.requests=requests;entry.screenshot=`fixture-catalog-failure-${app.id}-390-${theme}.png`;await page.screenshot({path:resolve(out,entry.screenshot),fullPage:false});
   }catch(e){entry.error=e.stack;check(subject,'Scenario completed',false,{error:e.message});}
   finally{releaseRequest();report.catalogFailureFixtures.push(entry);await context.close();await store();}
  }
 }
}catch(e){check('runner','Candidate suite completed',false,{error:e.stack});}
finally{await browser?.close();await server?.close();report.finishedAt=new Date().toISOString();report.passed=report.failures.length===0;await store();}
console.log(JSON.stringify({passed:report.passed,checks:report.checks.length,failures:report.failures},null,2));if(!report.passed)process.exitCode=1;
