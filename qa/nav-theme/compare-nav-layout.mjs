/** Compare actual before/after reports. No source-derived geometry is accepted. */
import { readFile,writeFile } from 'node:fs/promises';
import { EXPECTED,DESTINATIONS } from './candidate-support.mjs';
const [beforePath,afterPath,outPath='nav-layout-comparison.json']=process.argv.slice(2);
if(!beforePath||!afterPath)throw new Error('Usage: node compare-nav-layout.mjs before/report.json after/report.json comparison.json');
const before=JSON.parse(await readFile(beforePath,'utf8'));
const after=JSON.parse(await readFile(afterPath,'utf8'));
const key=s=>`${s.app}/${s.width}/${s.theme}`;
const baseline=new Map(before.samples.map(s=>[key(s),s]));
const candidate=new Map(after.samples.map(s=>[key(s),s]));
const failures=[];
const normalizeURL=s=>s.replace(/http:\/\/127\.0\.0\.1:\d+/g,'<local>');
const networkKey=e=>normalizeURL(e.url)+'|'+(e.error||e.status);
const themeKeys=after.samples.map(s=>`${s.app}/${s.theme}`);
for(const expected of EXPECTED)for(const theme of expected.themes)if(!themeKeys.includes(`${expected.id}/${theme}`))failures.push({check:'missing supported app theme',app:expected.id,theme});
if(before.failures.length||after.failures.length)failures.push({check:'complete browser capture',before:before.failures,after:after.failures});
const results=[];
for(const [id,b] of baseline){
  const a=candidate.get(id);
  if(!a){failures.push({sample:id,check:'candidate sample missing'});continue;}
  const checks=[], add=(name,passed,detail)=>{const c={check:name,passed,...detail};checks.push(c);if(!passed)failures.push({sample:id,...c});};
  if(!b.states.closed||!a.states.closed||!b.states.open||!a.states.open){add('both states measured',false,{});continue;}
  const bc=b.states.closed,ac=a.states.closed,ao=a.states.open;
  add('bar aligns within 1px',Math.abs(ac.barEdgeDelta.left)<=1&&Math.abs(ac.barEdgeDelta.right)<=1,{before:bc.barEdgeDelta,after:ac.barEdgeDelta});
  add('open bar remains aligned within 1px',Math.abs(ao.barEdgeDelta.left)<=1&&Math.abs(ao.barEdgeDelta.right)<=1,{after:ao.barEdgeDelta});
  for(const state of ['closed','open'])for(const element of ['nav','bar','shell','header','headerInner']){
    const old=b.states[state][element]?.border,now=a.states[state][element]?.border;
    const keys=state==='closed'?['left','top','right','bottom','width','height']:['left','right','width'];
    add(`${state} ${element} ${state==='closed'?'geometry':'horizontal geometry'} unchanged`,(!old&&!now)||(!!old&&!!now&&keys.every(k=>Math.abs(old[k]-now[k])<=0.5)),{before:old,after:now,openVerticalGeometryIsReportedOnly:state==='open'});
  }
  add('Closed header gap unchanged',Math.abs(ac.gapToHeader-bc.gapToHeader)<=0.5,{before:bc.gapToHeader,after:ac.gapToHeader});
  add('closed nav no taller',ac.nav.border.height<=bc.nav.border.height+0.5,{before:bc.nav.border.height,after:ac.nav.border.height});
  add('all suite links and buttons at least 44px',ac.smallTargets.length===0&&ao.smallTargets.length===0,{smallTargets:[...ac.smallTargets,...ao.smallTargets]});
  add('no new page overflow',ac.pageOverflow<=Math.max(0,bc.pageOverflow)+1&&ao.pageOverflow<=Math.max(0,b.states.open.pageOverflow)+1,{closedBefore:bc.pageOverflow,closedAfter:ac.pageOverflow,openBefore:b.states.open.pageOverflow,openAfter:ao.pageOverflow});
  add('no bar overflow',ac.navOverflow<=1&&ao.navOverflow<=1,{closed:ac.navOverflow,open:ao.navOverflow});
  add('header and title do not overlap nav',ac.gapToHeader>=-0.5&&ac.gapToTitle>=-0.5,{headerGapBefore:bc.gapToHeader,headerGapAfter:ac.gapToHeader,titleGapBefore:bc.gapToTitle,titleGapAfter:ac.gapToTitle});
  add('current identity no additional wrapping',ac.current.count<=bc.current.count,{before:bc.current.count,after:ac.current.count});
  add('keyboard behavior works',Object.values(a.keyboard||{}).length===4&&Object.values(a.keyboard||{}).every(Boolean),{keyboard:a.keyboard});
  add('no new page errors',a.pageErrors.every(e=>b.pageErrors.includes(e)),{before:b.pageErrors,after:a.pageErrors});
  const expected=EXPECTED.find(e=>e.id===a.app);
  add('Only actual supported app theme tested',!!expected&&expected.themes.includes(a.theme)&&a.themeMode===expected.themeMode,{theme:a.theme,mode:a.themeMode});
  add('Closed nav retains 53px and baseline height',Math.abs(ac.nav.border.height-53)<=0.5&&Math.abs(ac.nav.border.height-bc.nav.border.height)<=0.5,{before:bc.nav.border.height,after:ac.nav.border.height});
  const centers=(ac.barChildren||[]).map(c=>c.rect.top+c.rect.height/2);
  add('Closed bar stays one row',centers.length===3&&Math.max(...centers)-Math.min(...centers)<=1,{centers});
  add('Full current identity remains accessible',ac.navigation?.toolId===expected?.toolId&&ac.navigation?.currentFullText===expected?.title&&!ac.navigation?.currentAccessibleHidden,{navigation:ac.navigation});
  add('Six exact canonical destinations preserved',JSON.stringify(ao.navigation?.allLinks.map(l=>l.href).sort())===JSON.stringify(DESTINATIONS),{links:ao.navigation?.allLinks});
  for(const tool of EXPECTED)add(`Full open-menu title: ${tool.toolId}`,!!ao.navigation?.allLinks.some(l=>l.href===tool.url&&l.label===tool.title));
  const planned=ao.navigation?.items.filter(i=>i.links.length===0)||[];
  add('Grade & Refine remains non-launchable',planned.length===1&&planned[0].text==='Grade & Refine Workshop — อยู่ในแผน'&&planned[0].focusables===0,{planned});
  add('Toggle stays accessibly named',ac.navigation?.toggleAccessibleName==='เครื่องมืออื่น',{name:ac.navigation?.toggleAccessibleName});
  add('Closed/open disclosure state coherent',!ac.open&&ac.ariaExpanded==='false'&&ao.open&&ao.ariaExpanded==='true',{});
  add('Actual nav color scheme matches app theme',ac.host.colorScheme===a.theme,{scheme:ac.host.colorScheme,expected:a.theme});
  add('App body colors unchanged by nav rollout',ac.actualTheme.body.background===bc.actualTheme.body.background&&ac.actualTheme.body.color===bc.actualTheme.body.color,{before:{background:bc.actualTheme.body.background,color:bc.actualTheme.body.color},after:{background:ac.actualTheme.body.background,color:ac.actualTheme.body.color}});
  add('Navigation preserves full storage values and URL',!!a.initialStorage.values&&JSON.stringify(a.initialStorage)===JSON.stringify(a.finalStorage),{initial:a.initialStorage,final:a.finalStorage});
  const baselineNetwork=new Set((b.failedRequests||[]).map(networkKey)),newFailures=(a.failedRequests||[]).filter(e=>!baselineNetwork.has(networkKey(e)));
  add('No new failed requests in actual app capture',newFailures.length===0,{newFailures});
  const baselineHTTP=new Set((b.badResponses||[]).map(networkKey)),newHTTP=(a.badResponses||[]).filter(e=>!baselineHTTP.has(networkKey(e)));
  add('No new HTTP errors in actual app capture',newHTTP.length===0,{newHTTP});
  if(a.width===390)for(const state of ['closed','open']){
    const measured=a.states[state].a11y,beforeA11y=b.states[state].a11y;
    add(`Actual nav ${state} accessibility and contrast`,!!measured&&measured.violations.length===0,{beforeViolations:beforeA11y?.violations??'not measured in original saved baseline; see immutable replay',afterViolations:measured?.violations,afterIncomplete:measured?.incomplete});
  }
  results.push({sample:id,beforeCommit:b.commit,afterCommit:a.commit,closedHeight:{before:bc.nav.border.height,after:ac.nav.border.height,delta:Math.round((ac.nav.border.height-bc.nav.border.height)*1000)/1000},alignment:{before:bc.barEdgeDelta,after:ac.barEdgeDelta},headerGap:{before:bc.gapToHeader,after:ac.gapToHeader},checks});
}
for(const id of candidate.keys())if(!baseline.has(id))failures.push({sample:id,check:'no baseline for candidate sample'});
const report={createdAt:new Date().toISOString(),method:'Paired actual Chromium layout measurements with equal app/viewport/theme keys',before:beforePath,after:afterPath,beforeBrowser:before.browserVersion,afterBrowser:after.browserVersion,passed:failures.length===0,samples:results.length,failures,results};
await writeFile(outPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({passed:report.passed,samples:report.samples,failures},null,2));
if(failures.length)process.exitCode=1;
