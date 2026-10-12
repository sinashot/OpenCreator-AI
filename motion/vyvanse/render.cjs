// Usage: node render.cjs <outDir> [stills]   (needs a static server on :8765 serving this folder)
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
const out = process.argv[2]; const stills = process.argv[3];
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
page.on('pageerror', e => console.error('PAGEERROR', e.message));
await page.goto('http://127.0.0.1:8765/index.html');
await page.evaluate(() => window.ready);
const total = await page.evaluate(() => window.TOTAL), fps = 30;
const times = stills ? stills.split(',').map(Number) : [...Array(Math.round(total * fps)).keys()].map(i => i / fps);
let i = 0;
for (const T of times) {
  const data = await page.evaluate(T => { window.render(T); return document.getElementById('c').toDataURL('image/jpeg', .94); }, T);
  const name = stills ? `s_${T.toFixed(1)}.jpg` : `f_${String(i).padStart(5, '0')}.jpg`;
  fs.writeFileSync(`${out}/${name}`, Buffer.from(data.split(',')[1], 'base64')); i++;
}
await browser.close();
})();
