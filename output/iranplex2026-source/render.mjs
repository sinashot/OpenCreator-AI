import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const [,, html, outDir, mode] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args:['--allow-file-access-from-files','--font-render-hinting=none'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('console', m => console.log('page:', m.text())); pg.on('pageerror', e => console.log('ERR', e.message));
await pg.goto(html); await pg.evaluate(() => window.__ready);
const FPS = 30, N = 21 * FPS;
const times = mode === 'stills' ? [0.5,1.2,2.6,3.5,4.5,6.4,8.5,9.4,10.4,12.8,13.5,14.5,16.5,17.0,17.4,19] : [...Array(N).keys()].map(i => i / FPS);
let i = 0;
for (const t of times) {
  await pg.evaluate(t => window.render(t), t);
  const name = mode === 'stills' ? `s_${t.toFixed(1)}.jpg` : `${String(i).padStart(4,'0')}.jpg`;
  await pg.screenshot({ path: `${outDir}/${name}`, type: 'jpeg', quality: 94 }); i++;
}
await b.close(); console.log('done', i);
