/** Baseline-only contrast defects remain visible; no candidate or structural failures waived. */
import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root=resolve(process.argv[2]||'qa-results/nav-theme');
const result={scope:'Historical 1.4.1 baseline only; candidate gates are never waived',contrastDeficiencies:[],focusAppearanceDeficiencies:[],unresolvedMeasurements:[],blockingFailures:[]};
const colorOnlyViolations=f=>Array.isArray(f.violations)&&f.violations.length>0&&f.violations.every(v=>v.id==='color-contrast');
const numericContrast=f=>{
 const d=f.detail;
 if(!d||d.error)return false;
 if(/text contrast/.test(f.check))return Number.isFinite(d.contrast)&&d.contrast<4.5;
 if(/Focus|focus/.test(f.check))return d.focusVisible===true&&d.style!=='none'&&d.width>=2&&Number.isFinite(d.againstInside)&&Number.isFinite(d.againstOutside)&&(d.againstInside<3||d.againstOutside<3);
 return false;
};
for(const [name,file] of [['capture','before/report.json'],['behavior','before-behavior/behavior-report.json'],['colors','before-colors/computed-theme-report.json']]){
 try{
  const r=JSON.parse(await readFile(resolve(root,file),'utf8'));
  if(!Array.isArray(r.failures))throw new Error('Missing failures array');
  const samples=name==='behavior'?r.normal:r.samples;
  if(!samples?.length)result.blockingFailures.push({source:file,error:'No baseline samples'});
  for(const f of r.failures){const recorded={source:file,...f};if(name==='colors'&&/Focus|focus/.test(f.check)&&f.detail?.focusVisible===true&&f.detail?.style==='auto'&&f.detail?.width===1&&f.detail?.againstInside>=3&&f.detail?.againstOutside>=3){result.focusAppearanceDeficiencies.push(recorded);continue;}if(name==='colors'&&f.detail?.error==='Non-solid or opacity/blend background requires manual rendered-pixel review'){result.unresolvedMeasurements.push(recorded);continue;}if((name==='behavior'&&colorOnlyViolations(f))||(name==='colors'&&numericContrast(f)))result.contrastDeficiencies.push(recorded);else result.blockingFailures.push(recorded);}
 }catch(e){result.blockingFailures.push({source:file,error:e.message});}
}
result.passed=result.blockingFailures.length===0;
await writeFile(resolve(root,'baseline-deficiencies.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));if(!result.passed)process.exitCode=1;
