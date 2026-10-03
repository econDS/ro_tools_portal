import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const git = (root,...args) => execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
export const PORTAL='https://econds.github.io/ro_tools_portal/';
export const CATALOG='https://econds.github.io/ro_tools_portal/catalog/v1/tools.json';
export const EXPECTED=[
 {id:'leveling',toolId:'leveling-map',title:'แผนที่เก็บเลเวล',url:'https://econds.github.io/ro-leveling-map/',themes:['light','dark'],themeMode:'automatic-device'},
 {id:'reform',toolId:'reform-workshop',title:'Reform Workshop',url:'https://econds.github.io/ro-reform-preparation/',themes:['light','dark'],themeMode:'automatic-device'},
 {id:'dim',toolId:'dim-glacier',title:'Dim Glacier Planner',url:'https://econds.github.io/dim_glacier_planner/',themes:['light'],themeMode:'fixed-light'},
 {id:'best',toolId:'best-status',title:'Best Status',url:'https://econds.github.io/ro-best-status/',themes:['dark'],themeMode:'fixed-dark'},
 {id:'ocean',toolId:'ocean-week-guide',title:'Sessrumnir Ocean Week',url:'https://econds.github.io/sessrumnir-ocean-week-guide/',themes:['light'],themeMode:'fixed-light'}
];
export const DESTINATIONS=[PORTAL,...EXPECTED.map(a=>a.url)].sort();
export async function loadCandidates(configPath){
 const config=JSON.parse(await readFile(configPath,'utf8'));
 if(config.apps.length!==EXPECTED.length||new Set(config.apps.map(a=>a.id)).size!==EXPECTED.length)throw new Error('Exactly the five unique child apps are required');
 const apps=await Promise.all(config.apps.map(async a=>{
  const expected=EXPECTED.find(e=>e.id===a.id);
  if(!expected||JSON.stringify(a.themes)!==JSON.stringify(expected.themes)||a.themeMode!==expected.themeMode||a.toolId!==expected.toolId||a.expectedTitle!==expected.title)throw new Error(`${a.id}: candidate config must preserve actual supported themes and full identity`);
  if(!/^[0-9a-f]{40}$/.test(a.expectedCommit))throw new Error(`${a.id}: replace candidate SHA placeholder before running`);
  const checkout=resolve(a.checkout),root=resolve(checkout,a.documentRoot||'.'),commit=git(checkout,'rev-parse','HEAD'),dirty=git(checkout,'status','--porcelain','--untracked-files=no');
  if(commit!==a.expectedCommit||dirty)throw new Error(`${a.id}: checkout must be clean at exact expected candidate SHA`);
  const html=await readFile(resolve(root,'index.html'),'utf8');
  return {...a,checkout,root,commit,html};
 }));
 return {config,apps};
}
export async function verifyRelease(config,apps){
 const version=config.release.version,sourceRoot=resolve(config.release.directory),files=['nav.js','catalog.snapshot.json','nav.lock.json'];
 if(version!=='1.4.1'||JSON.stringify(config.release.files)!==JSON.stringify(files))throw new Error('Expected immutable navigation 1.4.1, all three release files');
 const sourceBytes=Object.fromEntries(await Promise.all(files.map(async name=>[name,await readFile(resolve(sourceRoot,name))])));
 const lock=JSON.parse(sourceBytes['nav.lock.json']);
 if(lock.bundleVersion!==version||!/^[0-9a-f]{40}$/.test(lock.sourceCommit))throw new Error('Invalid source release provenance');
 const checks=[];
 for(const name of ['nav.js','catalog.snapshot.json']){
  const actual=hash(sourceBytes[name]);if(actual!==lock.files[name].sha256)throw new Error(`Portal ${name} does not match its lock digest`);
 }
 for(const [path,expected] of Object.entries(lock.sourceHashes)){
  const bytes=execFileSync('git',['show',`${lock.sourceCommit}:${path}`]);const actual=hash(bytes);
  if(actual!==expected)throw new Error(`Portal source hash mismatch: ${path}`);
  checks.push({path,sha256:actual});
 }
 const consumers=[];
 for(const app of apps){
  const prefix=`assets/ro-suite/${version}/`;
  const navScripts=[...app.html.matchAll(/<script\b([^>]*\bsrc\s*=\s*["']([^"']*ro-suite\/[^"']+)["'][^>]*)>/gi)];
  if(navScripts.length!==1||!/(?:^|\s)type\s*=\s*["']module["']/.test(navScripts[0][1])||navScripts[0][2]!==`./${prefix}nav.js`)throw new Error(`${app.id}: expected one locally pinned module script ./${prefix}nav.js`);
  const digests={};
  for(const name of files){const bytes=await readFile(resolve(app.root,prefix,name));const actual=hash(bytes),expected=hash(sourceBytes[name]);if(actual!==expected)throw new Error(`${app.id}: ${name} bytes differ from Portal immutable release`);digests[name]=actual;}
  consumers.push({app:app.id,commit:app.commit,moduleSrc:navScripts[0][2],digests});
 }
 return {version,sourceCommit:lock.sourceCommit,sourceFiles:checks,sourceDigests:Object.fromEntries(files.map(n=>[n,hash(sourceBytes[n])])),consumers};
}
export async function serveCandidates(apps,version){
 const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.woff':'font/woff','.webmanifest':'application/manifest+json'};
 const server=createServer(async(req,res)=>{
  try{
   const u=new URL(req.url,'http://localhost'),parts=decodeURIComponent(u.pathname).split('/').filter(Boolean);
   if(parts[0]==='__nav_qa_catalog_failure__'){
    const app=apps.find(a=>a.id===parts[1]);if(!app)throw new Error('Unknown fixture');
    const theme=u.searchParams.get('theme');if(!app.themes.includes(theme))throw new Error('Unsupported fixture theme');
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    res.end(`<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Optional catalogue failure fixture</title><body style="margin:0"><ro-suite-nav tool-id="${app.toolId}" theme="${theme}" catalog-url="${CATALOG}" portal-url="${PORTAL}"><nav aria-label="เครื่องมือ RO"><a href="${PORTAL}">กลับ RO Tools Portal</a></nav></ro-suite-nav><script type="module" src="/${app.publicPath}/assets/ro-suite/${version}/nav.js"></script><main><h1>Optional catalogue failure fixture</h1><p>This is a separate component fixture, not the app's default integration.</p><a href="#end" id="outside">Outside navigation</a></main></body></html>`);return;
   }
   const app=apps.find(a=>a.publicPath===parts[0]);if(!app)throw new Error('Unknown app');
   let file=resolve(app.root,parts.slice(1).join('/')||'index.html');if(file!==app.root&&!file.startsWith(app.root+sep)){res.writeHead(403);res.end('Outside document root');return;}
   if((await stat(file)).isDirectory())file=resolve(file,'index.html');res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(await readFile(file));
  }catch{res.writeHead(404);res.end('Missing file');}
 });
 await new Promise((done,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',done);});
 return {origin:`http://127.0.0.1:${server.address().port}`,close:()=>new Promise(done=>server.close(done))};
}
