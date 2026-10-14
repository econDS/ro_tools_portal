import { test, expect } from '@playwright/test';
import { readFile, writeFile, mkdtemp, cp, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { CATALOG_URL, snapshot, validateNavCatalog, fetchCatalog } from '../../integrations/nav/src/catalog';
import { approvedUrl } from '../../src/urls';
import { NAV_VERSION } from '../../scripts/nav-version.mjs';
const digest = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');
const bundle = await readFile(process.env.NAV_TEST_BUNDLE || `integrations/nav/releases/${NAV_VERSION}/nav.js`, 'utf8');

test('raw candidates reject normalization tricks, schema and duplicate attacks', () => {
  for (const url of ['http://econds.github.io/new/', 'https://evil.example/new/', 'https://econds.github.io:443/new/', 'https://user@econds.github.io/new/', 'https://econds.github.io/a/../new/', 'https://econds.github.io/%6eew/', 'https://econds.github.io/new/?x', 'https://econds.github.io/new/#x', 'https://econds.github.io/new/\\', ' https://econds.github.io/new/', 'https://econds.github.io/new/\n']) {
    expect(approvedUrl(url), url).toBe(false);
    expect(() => validateNavCatalog({...snapshot, tools: [{...snapshot.tools[0], canonicalUrl:url}]})).toThrow();
  }
  expect(approvedUrl('https://econds.github.io/future_tool-2/')).toBe(true);
  expect(() => validateNavCatalog({...snapshot, tools: Array(501).fill(snapshot.tools[0])})).toThrow();
  expect(() => validateNavCatalog({...snapshot, tools: [snapshot.tools[0], snapshot.tools[0]]})).toThrow();
});

test('registry-only addition is published and discovered by unchanged child bundle; historical bytes stay frozen', async ({ page }) => {
  test.setTimeout(60000);
  const historical = execFileSync('git', ['ls-files', 'integrations/nav/releases'], {encoding:'utf8'}).trim().split('\n');
  const before = await Promise.all(historical.map(async path => digest(await readFile(path))));
  const temp = await mkdtemp(join(tmpdir(), 'ro-catalog-'));
  try {
    for (const path of ['src','scripts','schemas','data','integrations/nav/src','pwa','vite.config.ts','package.json','favicon.svg']) await cp(path, join(temp,path), {recursive:true});
    await symlink(join(process.cwd(),'node_modules'), join(temp,'node_modules'), 'dir');
    const registryPath = join(temp,'data/tools.registry.v1.json');
    const registry = JSON.parse(await readFile(registryPath,'utf8'));
    registry.tools.push({...registry.tools[0], id:'future-tool', title:'Future Tool', canonicalUrl:'https://econds.github.io/future-tool/'});
    await writeFile(registryPath,JSON.stringify(registry));
    execFileSync(process.execPath,[join(process.cwd(),'node_modules/vite/bin/vite.js'),'build'],{cwd:temp,stdio:'pipe'});
    const remote = await readFile(join(temp,'dist/catalog/v1/tools.json'),'utf8');
    expect(await readFile(join(temp,'dist/index.html'),'utf8')).toContain('Future Tool');
    await page.route(CATALOG_URL, route => route.fulfill({contentType:'application/json',body:remote}));
    await page.route('**/dynamic-fixture', route => route.fulfill({contentType:'text/html',body:'<ro-suite-nav tool-id="future-tool"><a href="https://econds.github.io/ro_tools_portal/">Portal</a></ro-suite-nav><script type="module" src="/unchanged-nav.js"></script>'}));
    await page.route('**/unchanged-nav.js', route => route.fulfill({contentType:'text/javascript',body:bundle}));
    await page.goto('/dynamic-fixture');
    await expect(page.locator('ro-suite-nav .current-text')).toHaveText('Future Tool');
    await page.getByRole('button',{name:'เครื่องมืออื่น'}).click();
    await expect(page.locator('[aria-current=page]')).toHaveAttribute('href','https://econds.github.io/future-tool/');
    expect(digest(await readFile(process.env.NAV_TEST_BUNDLE || `integrations/nav/releases/${NAV_VERSION}/nav.js`))).toBe(digest(bundle));
    expect(await Promise.all(historical.map(async path => digest(await readFile(path))))).toEqual(before);
  } finally { await rm(temp,{recursive:true,force:true}); }
});

test('120 tools support rename, reorder, removal, search, mobile keyboard without bundle changes', async ({page}) => {
  const tools = Array.from({length:120},(_,i)=>({id:`future-${i}`,title:`Tool ${i}`,canonicalUrl:`https://econds.github.io/future-${i}/`,listingStatus:'listed'}));
  tools[119].title = 'Renamed current';
  await page.route(CATALOG_URL,route=>route.fulfill({contentType:'application/json',body:JSON.stringify({...snapshot,tools:tools.reverse()})}));
  await page.route('**/scale-fixture',route=>route.fulfill({contentType:'text/html',body:'<meta name="viewport" content="width=device-width"><ro-suite-nav tool-id="future-119"></ro-suite-nav><script type="module" src="/unchanged-nav.js"></script>'}));
  await page.route('**/unchanged-nav.js',route=>route.fulfill({contentType:'text/javascript',body:bundle}));
  await page.setViewportSize({width:360,height:700});
  await page.goto('/scale-fixture');
  await expect(page.locator('.current-text')).toHaveText('Renamed current');
  await page.getByRole('button',{name:'เครื่องมืออื่น'}).click();
  await expect(page.locator('li a')).toHaveCount(120);
  await expect(page.locator('li a').first()).toHaveText('Renamed current');
  await expect(page.locator('li a[href="https://econds.github.io/ro-leveling-map/"]')).toHaveCount(0);
  expect((await page.locator('ul').boundingBox())!.height).toBeLessThanOrEqual(320);
  await page.keyboard.press('Tab'); await expect(page.getByRole('searchbox')).toBeFocused();
  await page.getByRole('searchbox').fill('Tool 118'); await expect(page.locator('li a')).toHaveCount(1);
  await page.keyboard.press('Escape'); await expect(page.getByRole('button',{name:'เครื่องมืออื่น'})).toBeFocused();
});


test('timeout covers a stalled response body after successful headers', async () => {
  const original = globalThis.fetch;
  let aborted = false;
  globalThis.fetch = async (_url, options) => {
    const stream = new ReadableStream({start(controller) {
      controller.enqueue(new TextEncoder().encode('{'));
      options?.signal?.addEventListener('abort', () => { aborted = true; controller.error(new Error('aborted body')); });
    }});
    const response = new Response(stream,{headers:{'content-type':'application/json'}});
    Object.defineProperty(response,'url',{value:CATALOG_URL});
    return response;
  };
  try { await expect(fetchCatalog(CATALOG_URL)).rejects.toThrow('aborted body'); expect(aborted).toBe(true); }
  finally { globalThis.fetch = original; }
});

for (const remove of [false,true]) test(`remote ${remove ? 'removal' : 'rename'} of current fallback identity is accepted`, async ({page}) => {
  const tools = snapshot.tools.filter(tool => !remove || tool.id !== 'reform-workshop').map(tool => tool.id === 'reform-workshop' ? {...tool,title:'Renamed workshop'} : tool).reverse();
  await page.route(CATALOG_URL,route=>route.fulfill({contentType:'application/json',body:JSON.stringify({...snapshot,tools})}));
  await page.route('**/identity-fixture',route=>route.fulfill({contentType:'text/html',body:'<ro-suite-nav tool-id="reform-workshop"></ro-suite-nav><script type="module" src="/unchanged-nav.js"></script>'}));
  await page.route('**/unchanged-nav.js',route=>route.fulfill({contentType:'text/javascript',body:bundle}));
  await page.goto('/identity-fixture');
  await expect(page.locator('.current-text')).toHaveText(remove ? 'reform-workshop' : 'Renamed workshop');
  await page.getByRole('button',{name:'เครื่องมืออื่น'}).click();
  await expect(page.locator('[aria-current=page]')).toHaveCount(remove ? 0 : 1);
});

for (const operation of ['hide', 'remove', 'dangling-reference']) test(`registry-only ${operation} handles referenced tools safely`, async () => {
  const temp = await mkdtemp(join(tmpdir(), 'ro-retire-'));
  try {
    for (const path of ['src','scripts','schemas','data','integrations/nav/src','pwa','vite.config.ts','package.json','favicon.svg']) await cp(path, join(temp,path), {recursive:true});
    await symlink(join(process.cwd(),'node_modules'), join(temp,'node_modules'), 'dir');
    const registryPath = join(temp,'data/tools.registry.v1.json');
    const registry = JSON.parse(await readFile(registryPath,'utf8'));
    const target = 'reform-workshop';
    if (operation === 'hide') registry.tools.find((tool:any) => tool.id === target).listingStatus = 'hidden';
    else {
      registry.tools = registry.tools.filter((tool:any) => tool.id !== target);
      // Physical deletion must clean references inside the same canonical registry.
      // Separate editorial journeys must not require an additional file edit.
      if (operation === 'remove') for (const tool of registry.tools) tool.relatedToolIds = tool.relatedToolIds.filter((id:string) => id !== target);
    }
    await writeFile(registryPath,JSON.stringify(registry));
    const build = () => execFileSync(process.execPath,[join(process.cwd(),'node_modules/vite/bin/vite.js'),'build'],{cwd:temp,stdio:'pipe'});
    if (operation === 'dangling-reference') { expect(build).toThrow(/Invalid related ID/); return; }
    build();
    const catalog = JSON.parse(await readFile(join(temp,'dist/catalog/v1/tools.json'),'utf8'));
    expect(catalog.tools.some((tool:any) => tool.id === target)).toBe(false);
    const html = await readFile(join(temp,'dist/index.html'),'utf8');
    expect(html).not.toContain('data-task="reform-workshop"');
    expect(html).not.toContain('data-tool="reform-workshop"');
    expect(html).not.toContain('href="https://econds.github.io/ro-reform-preparation/"');
    expect(html).toContain('data-tool="leveling-map"');
    expect(await readFile('integrations/nav/releases/2.0.0/nav.js','utf8')).toBe(bundle);
  } finally { await rm(temp,{recursive:true,force:true}); }
});
