// Run after publish:root. Reads pinned deployed children without modifying their checkouts.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {execFileSync,spawn}=require('node:child_process');
const {chromium}=require('playwright');
const root=process.cwd(), workspace=path.dirname(root);
const specs=[['ro-leveling-map','5b9b4410669e925f37f1d6df31697678f6b27ade',''],['ro-reform-preparation','70d337278446c745fbfaa6fd6dcb593495c79d65',''],['dim_glacier_planner','6d42e8af4deccab6f4c94debe99284c0b2073606',''],['sessrumnir-ocean-week-guide','be2943db1b19f34b964dd968a26652c8b464a48c','docs/'],['ro-best-status','2ca6c18f55e7adb0e520466f9429e1dfb8c186f7','']];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'juno-consumers-')); const results=[];
 const catalog=fs.readFileSync('catalog/v1/tools.json','utf8');
 const juno=JSON.parse(catalog).tools.find(t=>t.id==='juno-festival-2026');assert(juno);
 const release='integrations/nav/releases/2.0.0/';
 const historical=execFileSync('git',['ls-tree','-r','--name-only','origin/main','integrations/nav/releases'],{encoding:'utf8'}).trim().split('\n');
 for(const file of historical) assert.deepEqual(fs.readFileSync(file),execFileSync('git',['show',`origin/main:${file}`]),file);
 for(const [repo,sha] of specs){const dest=path.join(dir,repo);fs.mkdirSync(dest);execFileSync('tar',['-x','-C',dest],{input:execFileSync('git',['archive',sha],{cwd:path.join(workspace,repo),maxBuffer:200e6})});}
 const server=spawn('python3',['-m','http.server','4197','--bind','127.0.0.1','--directory',dir],{stdio:'ignore'});
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true});
 try {for(const [repo,sha,prefix] of specs){
  const hashes={};for(const file of ['nav.js','catalog.snapshot.json','nav.lock.json']){const b=fs.readFileSync(path.join(dir,repo,prefix,'assets/ro-suite/2.0.0',file));assert.deepEqual(b,fs.readFileSync(release+file));hashes[file]=hash(b);}
  const context=await browser.newContext({viewport:{width:390,height:844}});let requests=0;
  await context.route('**/*',route=>{const u=route.request().url();if(u==='https://econds.github.io/ro_tools_portal/catalog/v1/tools.json'){requests++;return route.fulfill({contentType:'application/json',body:catalog});}return u.startsWith('http://127.0.0.1:4197/')?route.continue():route.abort();});
  const page=await context.newPage();await page.goto(`http://127.0.0.1:4197/${repo}/${prefix}`,{waitUntil:'domcontentloaded'});
  const nav=page.locator('ro-suite-nav');await nav.locator(`a[href="${juno.canonicalUrl}"]`).waitFor({state:'attached'});assert.equal(requests,1);assert.equal(await nav.locator('button').getAttribute('aria-expanded'),'false');
  await nav.locator('button').click();await nav.locator('input[type=search]').fill('Juno');assert.equal(await nav.locator('li a').count(),1);assert.equal(await nav.locator('li a').getAttribute('href'),juno.canonicalUrl);
  await page.keyboard.press('Escape');assert.equal(await nav.locator('button').getAttribute('aria-expanded'),'false');
  results.push({repo,sourceCommit:sha,hashes,automaticDiscoveryBeforeOpening:true,mobileSearch:true,escape:true});await context.close();
 }}finally{await browser.close();server.kill();fs.rmSync(dir,{recursive:true,force:true});}
 const result={catalogHash:hash(catalog),historicalReleaseFilesUnchanged:historical.length,children:results,liveHttpVerified:false};fs.writeFileSync('qa/juno-catalog/children-evidence.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
