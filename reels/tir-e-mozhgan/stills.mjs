// node stills.mjs <outdir> t1 t2 ...  -> PNG per time (renders via FILM.render)
const { chromium } = await import('playwright').catch(() => import('/opt/node22/lib/node_modules/playwright/index.mjs'));
import fs from 'node:fs';
const [,, out, ...ts] = process.argv;
const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('console', m => console.log('page:', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://localhost:8765/index.html?t=0.01');
await p.evaluate(() => FILM.ready);
for (const t of ts) {
  const url = await p.evaluate(t => { FILM.render(t); return document.getElementById('c').toDataURL('image/png'); }, +t);
  fs.writeFileSync(`${out}/s_${(+t).toFixed(2).padStart(5, '0')}.png`, Buffer.from(url.split(',')[1], 'base64'));
}
await b.close();
