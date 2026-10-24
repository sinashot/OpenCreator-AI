// Dev stills: node shoot.mjs <film>/<page>.html <format> <t1,t2,...> <outprefix>
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('playwright');
const [pageRel, fmt = '9x16', ts = '0', prefix = 'out/dev/shot'] = process.argv.slice(2);
const SZ = { '16x9': [1920, 1080], '9x16': [1080, 1920], '1x1': [1080, 1080] }[fmt];
const ROOT = process.cwd();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.png': 'image/png', '.jpg': 'image/jpeg', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => { const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res); });
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: SZ[0], height: SZ[1] } });
page.on('pageerror', (e) => console.error('[page]', e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[console]', m.text()); });
await page.goto(`http://127.0.0.1:${server.address().port}/${pageRel}?render=1&blur=0&fps=24&format=${fmt}&${process.env.Q || ""}&w=${SZ[0]}&h=${SZ[1]}`);
await page.waitForFunction(() => window.filmReady === true, null, { timeout: 120000 });
fs.mkdirSync(path.dirname(prefix), { recursive: true });
for (const t of ts.split(',').map(Number)) {
  const t0 = Date.now();
  await page.evaluate((t) => window.seek(t), t);
  await page.screenshot({ path: `${prefix}_${t.toFixed(2)}.png` });
  console.log(`t=${t} ${Date.now() - t0}ms -> ${prefix}_${t.toFixed(2)}.png`);
}
await browser.close(); server.close();
