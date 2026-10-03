/** Read-only real-page color/geometry audit. Pair with capture-nav-layout + candidate-behavior. */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadCandidates, serveCandidates } from './candidate-support.mjs';
const args=process.argv.slice(2),opt=(k,d)=>args.includes(k)?args[args.indexOf(k)+1]:d;
const {config,apps}=await loadCandidates(opt('--config','qa/nav-alignment/candidates.json'));
const hostAudit=JSON.parse(await readFile(new URL('./host-theme-audit.json',import.meta.url),'utf8'));
const out=resolve(opt('--out','qa-results/nav-theme-colors'));await mkdir(out,{recursive:true});
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE?pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href:'@playwright/test');
const report={version:config.release.version,method:'Computed styles and keyboard-induced :focus-visible on real, immutable consumer pages; sRGB alpha compositing; unresolved images/opacity fail closed',samples:[],failures:[]};
const server=await serveCandidates(apps,config.release.version);let browser;
const check=(key,name,passed,detail)=>{if(!passed)report.failures.push({key,check:name,detail});};
const normalFont=value=>value.toLowerCase().replace(/["']/g,'').split(',').map(v=>v.trim().replace(/\s+/g,' ')).join(',');
const rgba=value=>{value=value.trim().toLowerCase();if(/^#[0-9a-f]{3}$/.test(value))return [...value.slice(1)].map(c=>parseInt(c+c,16)).concat(1);if(/^#[0-9a-f]{6}$/.test(value))return [1,3,5].map(i=>parseInt(value.slice(i,i+2),16)).concat(1);const m=value.match(/^rgba?\(([^)]+)\)$/);if(!m)return null;const a=m[1].split(/[, /]+/).filter(Boolean).map(Number);return [a[0],a[1],a[2],a[3]??1];};
const equalToken=(name,actual,expected)=>{if(name==='font-family')return normalFont(actual)===normalFont(expected);const a=rgba(actual),b=rgba(expected);return !!a&&!!b&&a.every((v,i)=>Math.abs(v-b[i])<.001);};

// Serializable page-side function: never changes DOM, CSS, storage, or app preferences.
function colors({fallback=false}) {
 const host=document.querySelector('ro-suite-nav'),root=fallback?host:host.shadowRoot;
 const parse=s=>{const m=s.match(/^rgba?\(([^)]+)\)$/);if(!m)throw new Error(`Unsupported computed color ${s}`);const a=m[1].split(/[, /]+/).filter(Boolean).map(Number);return [a[0],a[1],a[2],a[3]??1];};
 const over=(f,b)=>{const a=f[3]+b[3]*(1-f[3]);return [...f.slice(0,3).map((c,i)=>(c*f[3]+b[i]*b[3]*(1-f[3]))/a),a];};
 const parent=el=>el.parentElement||el.getRootNode()?.host||null;
 const bg=el=>{if(!el)return [255,255,255,1];const s=getComputedStyle(el);if(s.backgroundImage!=='none'||Number(s.opacity)!==1||s.mixBlendMode!=='normal')throw new Error('Non-solid or opacity/blend background requires manual rendered-pixel review');const c=parse(s.backgroundColor);return c[3]===1?c:over(c,bg(parent(el)));};
 const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
 const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 const one=(name,el)=>{if(!el)return {name,error:'Missing element'};try{const s=getComputedStyle(el),b=bg(el),f=over(parse(s.color),b);return {name,foreground:s.color,background:s.backgroundColor,resolvedForeground:f,resolvedBackground:b,contrast:ratio(f,b),font:s.font,fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight};}catch(e){return {name,error:e.message};}};
 const pairs=fallback?[['fallback',root.querySelector('nav a')]]:[['normal',root.querySelector('.portal')],['menu-normal',root.querySelector('li a:not([aria-current])')],['muted',root.querySelector('li > span')],['current',root.querySelector('[aria-current=page]')],['current-label',root.querySelector('.current-text')],['button',root.querySelector('button')]];
 const active=fallback?document.activeElement:root.activeElement;let focus;
 if(active&&root.contains(active)){try{const s=getComputedStyle(active),inside=bg(active),outside=bg(parent(active)),f=parse(s.outlineColor);focus={text:active.textContent.trim(),focusVisible:active.matches(':focus-visible'),style:s.outlineStyle,width:parseFloat(s.outlineWidth),offset:parseFloat(s.outlineOffset),color:s.outlineColor,adjacentInside:inside,adjacentOutside:outside,againstInside:ratio(over(f,inside),inside),againstOutside:ratio(over(f,outside),outside)};}catch(e){focus={error:e.message};}}
 return {text:pairs.map(([n,e])=>one(n,e)),focus,hostHeight:host.getBoundingClientRect().height,pageOverflow:document.documentElement.scrollWidth-innerWidth,navOverflow:root.querySelector('nav').scrollWidth-root.querySelector('nav').clientWidth};
}
try {
 browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{});report.browserVersion=browser.version();
 for(const app of apps)for(const theme of app.themes)for(const systemScheme of app.themeMode.startsWith('fixed')?['light','dark']:[theme])for(const width of [390,1440])for(const fallback of [false,true]){
  const key=`${app.id}/${theme}/system-${systemScheme}/${width}/${fallback?'fallback':'normal'}`;
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:systemScheme,reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();
  const sample={key,commit:app.commit,fonts:[],navInitiatedFonts:[],checks:[]};const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');
  cdp.on('Network.requestWillBeSent',e=>{if(e.type==='Font'||/fonts\.googleapis|fonts\.gstatic|\.(woff2?|ttf|otf)([?#]|$)/i.test(e.request.url)){sample.fonts.push({url:e.request.url,initiator:e.initiator});if(/ro-suite\/[^/]+\/nav\.js/.test(JSON.stringify(e.initiator)))sample.navInitiatedFonts.push(e.request.url);}});
  if(fallback)await page.route(`**/assets/ro-suite/${config.release.version}/nav.js`,r=>r.abort());
  try{
   await page.goto(`${server.origin}/${app.publicPath}/`,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
   if(!fallback)await page.waitForFunction(()=>!!document.querySelector('ro-suite-nav')?.shadowRoot?.querySelector('button'));
   // Keyboard modality precedes focus() so focus-visible is measured, never inferred.
   await page.keyboard.press('Tab');
   const nav=page.locator('ro-suite-nav');const controls=fallback?[nav.locator('nav a')]:[nav.locator('.portal'),nav.getByRole('button')];
   sample.closed=await page.evaluate(colors,{fallback});check(key,`Closed height remains ${fallback?52:53}px (${fallback?'unchanged light-DOM fallback':'enhanced nav'})`,Math.abs(sample.closed.hostHeight-(fallback?52:53))<=.5,sample.closed.hostHeight);
   if(!fallback){await nav.getByRole('button').click();await page.keyboard.press('Tab');controls.push(...await nav.locator('li a').all());}
   sample.measured=await page.evaluate(colors,{fallback});
   if(config.release.version!=='1.4.1'){
    const expected=hostAudit[app.repository.split('/')[1]];
    if(!expected?.modes?.[theme])throw new Error('Missing audited host-theme expectation');
    sample.hostTokenAudit=await page.evaluate(({bindings,fallback})=>{
     const host=document.querySelector('ro-suite-nav'),h=getComputedStyle(host),body=getComputedStyle(document.body),root=fallback?host:host.shadowRoot;
     const tokenValues={},bodySourceValues={},sourceBindings={};
     for(const [name,binding] of Object.entries(bindings)){
      tokenValues[name]=h.getPropertyValue(`--ro-suite-${name}`).trim();
      const m=binding.match(/^var\((--[^,)]+)\)$/);if(m){sourceBindings[name]=m[1];bodySourceValues[name]=body.getPropertyValue(m[1]).trim();}
     }
     const c=selector=>getComputedStyle(root.querySelector(selector));
     const consumed=fallback?{'surface':c('nav').backgroundColor,'accent':c('nav a').color,...(parseFloat(c('nav').borderBottomWidth)>0?{'border':c('nav').borderBottomColor}:{}),'font-family':c('nav a').fontFamily}:{'surface':c('nav').backgroundColor,'surface-hover':c('[aria-current=page]').backgroundColor,'text':c('.portal').color,'muted':c('li > span').color,'border':c('nav').borderBottomColor,'accent':c('.current .chip').color,'font-family':c('button').fontFamily};
     return {tokenValues,bodySourceValues,sourceBindings,consumed};
    },{bindings:expected.bindings,fallback});
    sample.hostTokenAudit.expected=expected.modes[theme].tokens;
    for(const [name,value] of Object.entries(sample.hostTokenAudit.expected)){
     check(key,`Public token ${name} matches audited host`,equalToken(name,sample.hostTokenAudit.tokenValues[name]||'',value),{expected:value,actual:sample.hostTokenAudit.tokenValues[name]});
     if(name in sample.hostTokenAudit.bodySourceValues)check(key,`Host body source ${name} remains unshadowed`,equalToken(name,sample.hostTokenAudit.bodySourceValues[name],value),{source:sample.hostTokenAudit.sourceBindings[name],expected:value,actual:sample.hostTokenAudit.bodySourceValues[name]});
     if(name in sample.hostTokenAudit.consumed)check(key,`Consumed ${name} equals host expectation`,equalToken(name,sample.hostTokenAudit.consumed[name],value),{expected:value,actual:sample.hostTokenAudit.consumed[name]});
    }
   }

   for(const t of sample.measured.text)check(key,`${t.name} text contrast >=4.5`,!t.error&&t.contrast>=4.5,t);
   sample.focus=[];sample.hover=[];
   for(let i=0;i<controls.length;i++){
    // Opening may be closed when focus moves back through portal: reopen before menu checks.
    if(!fallback&&i>=2&&await nav.getByRole('button').getAttribute('aria-expanded')==='false'){await nav.getByRole('button').click();await page.keyboard.press('Tab');}
    await controls[i].focus();const f=(await page.evaluate(colors,{fallback})).focus;sample.focus.push(f);
    if(sample.hostTokenAudit)check(key,`Consumed focus ${i} matches audited host`,!!f&&equalToken('focus',f.color||'',sample.hostTokenAudit.expected.focus),{actual:f?.color,expected:sample.hostTokenAudit.expected.focus});
    check(key,`Focus ${i} visible and >=3:1 against both adjacent backgrounds`,f&&!f.error&&f.focusVisible&&f.style!=='none'&&f.width>=2&&f.againstInside>=3&&f.againstOutside>=3,f);
    await page.screenshot({path:resolve(out,`${app.id}-${theme}-system-${systemScheme}-${width}-${fallback?'fallback':'normal'}-focus-${i}.png`)});
    await controls[i].hover();const hovered=await page.evaluate(colors,{fallback});sample.hover.push({control:i,...hovered});
    for(const t of hovered.text)check(key,`Hovered ${i}: ${t.name} text contrast >=4.5`,!t.error&&t.contrast>=4.5,t);
    const hf=hovered.focus;check(key,`Hovered focus ${i} >=3:1 both backgrounds`,hf&&!hf.error&&hf.focusVisible&&hf.againstInside>=3&&hf.againstOutside>=3,hf);
    await page.mouse.move(width-1,999);

   }
   check(key,'No nav-initiated font requests',sample.navInitiatedFonts.length===0,sample.navInitiatedFonts);
  }catch(e){sample.error=e.stack;check(key,'Completed computed audit',false,e.message);}finally{report.samples.push(sample);await context.close();}
 }
}catch(e){check('runner','Browser audit runs',false,e.stack);}finally{await browser?.close();await server.close();report.passed=report.failures.length===0;await writeFile(resolve(out,'computed-theme-report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({passed:report.passed,samples:report.samples.length,failures:report.failures},null,2));if(!report.passed)process.exitCode=1;
