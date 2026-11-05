// Export the logo variants in logo.html to PNG (transparent where the art has no background).
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DIR = path.dirname(new URL(import.meta.url).pathname);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 2700, height: 1200 } });
await p.goto('file://' + path.join(DIR, 'logo.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
const out = { p1: 'profile_mark.png', p2: 'profile_monogram.png', p3: 'profile_stacked.png', w1: 'wordmark_dark.png', w2: 'wordmark_light.png', w3: 'lockup_dark.png', sheet: 'brand_sheet.png' };
for (const [id, f] of Object.entries(out)) await (await p.$('#' + id)).screenshot({ path: path.join(DIR, 'export', f), omitBackground: true });
await b.close(); console.log('ok');
