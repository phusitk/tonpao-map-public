// Behaviour tests for the TonPao Map prototype (71 checks per build).
//
// Serves dist/ at the domain root and the GitHub Pages build (pages-dist/, made by
// scripts/prepare-github-pages.py) under /tonpao-map-public/, then drives both in Chromium.
//
//   npm test                 uses the real CDNs (Tailwind, Leaflet, fonts)
//   STUB_CDN=1 npm test      serves local copies instead, for offline/sandboxed runs
//                            (needs the optional @tailwindcss/browser and leaflet packages)
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES_PREFIX = '/tonpao-map-public';
const STUB_CDN = process.env.STUB_CDN === '1';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

// Minimal static server: GET <prefix>/<file> from dir, "/" → index.html.
const serve = (dir, prefix) => new Promise(resolve => {
  const server = http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (prefix) {
      if (!pathname.startsWith(`${prefix}/`)) { res.writeHead(404).end(); return; }
      pathname = pathname.slice(prefix.length);
    }
    let file = path.join(dir, pathname);
    if (!file.startsWith(dir)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  server.listen(0, '127.0.0.1', () => resolve(server));
});

const stubCdn = async context => {
  const tailwind = STUB_CDN && `window.tailwind={};${fs.readFileSync(require.resolve('@tailwindcss/browser'), 'utf8')}`;
  const leaflet = STUB_CDN && path.dirname(require.resolve('leaflet/dist/leaflet.js'));
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    // Never load real map tiles in tests (OSM tile usage policy); they don't affect behaviour.
    if (/(^|\.)tile\.openstreetmap\.org$/.test(url.hostname)) return route.fulfill({ status: 204 });
    if (STUB_CDN) {
      if (url.hostname === 'cdn.tailwindcss.com') return route.fulfill({ body: tailwind, contentType: 'text/javascript' });
      if (url.hostname === 'unpkg.com') {
        const file = path.join(leaflet, url.pathname.split('/dist/')[1] || '');
        if (fs.existsSync(file)) return route.fulfill({ path: file });
      }
      if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return route.fulfill({ status: 204 });
    }
    return route.continue();
  });
};

async function runSuite(browser, BASE, label) {
  let pass = 0, fail = 0;
  const check = (name, ok, detail = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'} [${label}] ${name}${detail ? '  — ' + detail : ''}`); };
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(BASE).origin });
  await stubCdn(ctx);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => { if (!(STUB_CDN && /tailwind/.test(e.message))) errors.push(e.message); });
  const open = async route => {
    await page.goto('about:blank');
    await page.goto(`${BASE}/#${route}`);
    await page.waitForFunction(() => document.querySelector('#status')?.hidden, null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(800);
    const f = page.frames()[1];
    await f.evaluate(() => { window.__opened = []; window.open = (url, target) => { window.__opened.push([url, target]); return null; }; });
    return f;
  };
  const hash = () => page.evaluate(() => location.hash);
  const toast = f => f.evaluate(() => document.getElementById('tp-toast')?.textContent || '');
  const opened = f => f.evaluate(() => window.__opened);
  const visibleTitles = f => f.evaluate(() => [...document.querySelectorAll('article')].filter(a => a.dataset.poiId && getComputedStyle(a).display !== 'none').map(a => a.querySelector('h3').textContent.trim()));
  const clickText = async (f, selector, text) => { await f.locator(selector, { hasText: text }).first().click(); await page.waitForTimeout(350); };

  // Category pages
  const categories = {
    '/category/handicraft': ['กระดาษสา', ['ศูนย์สาธิตการทำกระดาษสา']],
    '/category/temples-culture': ['วัด', ['วัดต้นเปา', 'วัดบ่อสร้าง']],
    '/category/food-cafe': ['คาเฟ่', ['เสน่ห์คาเฟ่ ต้นเปา', 'บ้านขนมและกาแฟต้นเปา']],
    '/category/community-learning': ['ประวัติศาสตร์ท้องถิ่น', ['พิพิธภัณฑ์หัตถกรรมชุมชน']],
    '/category/accommodation': ['รีสอร์ต', ['บ่อสร้างการ์เดนรีสอร์ต']]
  };
  for (const [route, [chip, expected]] of Object.entries(categories)) {
    let f = await open(route);
    const all = await visibleTitles(f);
    check(`${route} shows 4 cards and truthful count`, all.length === 4 && /แสดง 4 จาก 4 รายการ/.test(await f.evaluate(() => document.body.innerText)));
    await f.locator('aside button', { hasText: new RegExp(`^\\s*${chip}\\s*$`) }).first().click(); await page.waitForTimeout(300);
    const got = await visibleTitles(f);
    check(`${route} chip "${chip}" filters`, JSON.stringify(got.sort()) === JSON.stringify([...expected].sort()), got.join(', '));
    check(`${route} chip marked active`, await f.locator('aside button[aria-pressed="true"]', { hasText: chip }).count() === 1);
    await clickText(f, 'aside button', 'ทั้งหมด');
    check(`${route} "ทั้งหมด" restores`, (await visibleTitles(f)).length === 4);
    await f.locator('aside label', { hasText: 'ใกล้ฉัน' }).click(); await page.waitForTimeout(300);
    const near = await visibleTitles(f);
    check(`${route} distance "ใกล้ฉัน" (≤1 km)`, near.length === 1, near.join(', '));
    await f.locator('aside label', { hasText: '5 กม.' }).click();
    await f.locator('aside select').selectOption({ index: 2 }); await page.waitForTimeout(300);
    const ratings = await f.evaluate(() => [...document.querySelectorAll('article')].filter(a => a.dataset.poiId && getComputedStyle(a).display !== 'none').map(a => parseFloat([...a.querySelectorAll('.material-symbols-outlined')].find(i => i.textContent.trim() === 'star')?.nextElementSibling?.textContent)));
    check(`${route} sort by rating`, ratings.every((r, i) => i === 0 || ratings[i - 1] >= r), ratings.join(','));
    if (route === '/category/handicraft') {
      await f.locator('aside select').selectOption({ index: 0 });
      await f.locator('aside label', { hasText: 'ใกล้ฉัน' }).click();
      await clickText(f, 'aside button', 'งานผ้า');
      check('empty state appears when no match', await f.locator('[data-reset-filters]').isVisible());
      await f.locator('[data-reset-filters]').click(); await page.waitForTimeout(300);
      check('reset filters restores all', (await visibleTitles(f)).length === 4);
      const bm = f.locator('article', { hasText: 'ศูนย์สาธิตการทำกระดาษสา' }).locator('button').first();
      await bm.click(); await page.waitForTimeout(300);
      check('card bookmark toggles on', await bm.getAttribute('aria-pressed') === 'true' && /บันทึก/.test(await toast(f)));
      f = await open(route);
      check('bookmark persists after reload', await f.locator('article', { hasText: 'ศูนย์สาธิตการทำกระดาษสา' }).locator('button').first().getAttribute('aria-pressed') === 'true');
      await f.locator('article', { hasText: 'พิพิธภัณฑ์หัตถกรรมไม้แกะสลัก' }).getByText('ดูรายละเอียด').click(); await page.waitForTimeout(500);
      check('card detail link opens its own POI', await hash() === '#/poi/woodcraft-museum', await hash());
      f = await open('/poi/sa-paper-demo');
      check('POI page reflects saved state', await f.locator('main button', { hasText: 'บันทึก' }).getAttribute('aria-pressed') === 'true');
    }
    check(`${route} pagination nav hidden`, await f.evaluate(() => { const s = [...document.querySelectorAll('main span')].find(x => /^แสดง \d+ จาก/.test(x.textContent.trim())); return !s || getComputedStyle(s.nextElementSibling).display === 'none'; }));
  }

  // POI detail
  let f = await open('/poi/umbrella-center');
  await clickText(f, 'main button', 'โทร');
  check('POI call shows no-number notice', /ยังไม่มีเบอร์โทร/.test(await toast(f)));
  await clickText(f, 'main button', 'เว็บไซต์');
  check('POI website opens search', /google\.com\/search\?q=/.test((await opened(f)).at(-1)?.[0] || ''));
  await clickText(f, 'main button', 'Facebook');
  check('POI Facebook opens search', /facebook\.com\/search/.test((await opened(f)).at(-1)?.[0] || ''));
  await clickText(f, 'main button', 'แชร์');
  await page.waitForTimeout(300);
  const clip = await f.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  check('POI share copies link', /คัดลอกลิงก์/.test(await toast(f)) && clip.includes('#/poi/umbrella-center'), `${await toast(f)} | ${clip}`);
  await clickText(f, 'main button', 'บันทึก');
  check('POI save toggles', await f.locator('main button', { hasText: 'บันทึก' }).getAttribute('aria-pressed') === 'true');
  await f.locator('main nav a').nth(1).click(); await page.waitForTimeout(400);
  check('POI breadcrumb category', await hash() === '#/category/handicraft', await hash());
  f = await open('/poi/wat-tonpao');
  await f.locator('main nav a').nth(1).click(); await page.waitForTimeout(400);
  check('POI breadcrumb follows POI category', await hash() === '#/category/temples-culture', await hash());
  f = await open('/poi/umbrella-center');
  await f.locator('main button', { hasText: 'ดูทั้งหมด' }).first().click(); await page.waitForTimeout(400);
  check('POI "ดูทั้งหมด" events', await hash() === '#/events', await hash());
  f = await open('/poi/umbrella-center');
  await f.locator('main button', { hasText: 'ดูทั้งหมด' }).nth(1).click(); await page.waitForTimeout(400);
  check('POI "ดูทั้งหมด" nearby', await hash() === '#/map', await hash());

  // Header / footer / home
  f = await open('/map');
  await f.locator('header button', { hasText: /^\s*help\s*$/ }).first().click(); await page.waitForTimeout(400);
  check('header help → /help', await hash() === '#/help', await hash());
  f = await open('/events/umbrella-festival/schedule');
  await f.locator('header button', { hasText: 'notifications' }).first().click(); await page.waitForTimeout(300);
  check('header notifications notice', /การแจ้งเตือน/.test(await toast(f)));
  f = await open('/privacy');
  await f.locator('a', { hasText: /^ติดต่อเรา$/ }).first().click(); await page.waitForTimeout(400);
  check('footer ติดต่อเรา → /about', await hash() === '#/about', await hash());
  f = await open('/');
  await f.locator('a', { hasText: 'ดูทั้งหมด' }).first().click(); await page.waitForTimeout(400);
  check('home "ดูทั้งหมด" → /map', await hash() === '#/map', await hash());
  f = await open('/');
  await f.locator('button', { hasText: /^\s*mail\s*$/ }).first().click(); await page.waitForTimeout(400);
  check('home mail → /about', await hash() === '#/about', await hash());
  f = await open('/search');
  await f.locator('a', { hasText: 'ข้อกำหนดการใช้งาน' }).first().click(); await page.waitForTimeout(400);
  check('search terms link', await hash() === '#/terms', await hash());

  // Schedule
  f = await open('/events/umbrella-festival/schedule');
  await clickText(f, 'button', '20 มกราคม');
  check('schedule day 2 shows empty notice', await f.getByText('ยังไม่มีกำหนดการที่ประกาศสำหรับวันที่ 20 มกราคม 2567').isVisible());
  await clickText(f, 'button', '19 มกราคม');
  check('schedule day 1 shows timeline', await f.getByText('09:00 - 10:30').first().isVisible());
  await f.locator('a', { hasText: /^เทศกาลร่มบ่อสร้าง/ }).first().click(); await page.waitForTimeout(400);
  check('schedule breadcrumb → festival', await hash() === '#/events/umbrella-festival', await hash());

  // Help
  f = await open('/help');
  await clickText(f, 'aside nav a', 'Using the Map');
  const faqVisible = () => f.evaluate(() => [...document.querySelectorAll('section button[onclick]')].filter(b => getComputedStyle(b.parentElement).display !== 'none').length);
  check('help topic filters FAQ', await faqVisible() === 1 && await f.locator('section h2').textContent() === 'Using the Map');
  await clickText(f, 'aside nav a', 'Technical Support');
  check('help empty topic notice', await faqVisible() === 0 && await f.getByText('ยังไม่มีคำถามในหมวดนี้').isVisible());
  await f.locator('main input[placeholder*="คำถาม"]').fill('ลงทะเบียน');
  await f.locator('main input[placeholder*="คำถาม"]').press('Enter'); await page.waitForTimeout(300);
  check('help search finds FAQ and expands it', await faqVisible() === 1 && await f.getByText('สำหรับการดูแผนที่').isVisible());
  await clickText(f, 'button', 'ติดต่อฝ่ายสนับสนุน');
  check('help contact support → /about', await hash() === '#/about', await hash());

  // About
  f = await open('/about');
  await clickText(f, 'button', 'ส่งข้อความถึงเรา');
  check('about send message shows notice, no mailto', /ยังไม่เปิดใช้งาน/.test(await toast(f)) && (await opened(f)).length === 0, await toast(f));

  // My itineraries, parking
  f = await open('/my-itineraries');
  await clickText(f, 'button', 'ดำเนินการต่อ');
  check('my itineraries continue → /plan/result', await hash() === '#/plan/result', await hash());
  f = await open('/events/umbrella-festival/parking');
  const parkingVisible = () => f.evaluate(() => [...document.querySelectorAll('.sidebar-scroll > div')].filter(c => getComputedStyle(c).display !== 'none').length);
  await clickText(f, 'button', 'รถทัวร์');
  check('parking bus filter', await parkingVisible() === 1 && /1 จุด/.test(await toast(f)), await toast(f));
  await clickText(f, 'button', 'รถจักรยานยนต์');
  check('parking motorcycle filter', await parkingVisible() === 2);
  await clickText(f, 'button', 'รถยนต์');
  check('parking car filter', await parkingVisible() === 3);

  // Regressions: existing behaviour still works
  f = await open('/plan/result');
  await f.locator('[data-edit-itinerary]').click(); await page.waitForTimeout(400);
  check('regression: ปรับเงื่อนไข → /plan/build', await hash() === '#/plan/build');
  f = await open('/map');
  await f.locator('header a.tonpao-standard-brand').click(); await page.waitForTimeout(400);
  check('regression: brand → home', await hash() === '#/');

  check('no page errors', errors.length === 0, errors.join(' | '));
  await ctx.close();
  return { pass, fail };
}

(async () => {
  execFileSync('python3', [path.join(ROOT, 'scripts/prepare-github-pages.py')], { stdio: 'inherit' });
  const rootServer = await serve(path.join(ROOT, 'dist'), '');
  const pagesServer = await serve(path.join(ROOT, 'pages-dist'), PAGES_PREFIX);
  const browser = await chromium.launch();
  let failed = 0, passed = 0;
  try {
    for (const [label, base] of [
      ['root', `http://127.0.0.1:${rootServer.address().port}`],
      ['pages', `http://127.0.0.1:${pagesServer.address().port}${PAGES_PREFIX}`]
    ]) {
      const { pass, fail } = await runSuite(browser, base, label);
      console.log(`\n[${label}] ${pass} passed, ${fail} failed\n`);
      passed += pass; failed += fail;
    }
  } catch (error) {
    console.error(error);
    failed++;
  } finally {
    await browser.close();
    rootServer.close();
    pagesServer.close();
  }
  console.log(`Total: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
