// Export the highlight covers and reel templates in templates.html to PNG.
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DIR = path.dirname(new URL(import.meta.url).pathname);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 2000 } });
await p.goto('file://' + path.join(DIR, 'templates.html')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
const out = { h_time: 'highlight_time.png', h_memory: 'highlight_memory.png', h_again: 'highlight_again.png', h_within: 'highlight_within.png', h_onward: 'highlight_onward.png',
  cover_example: 'reel_cover_example.png', cover_blank: 'reel_cover_blank.png', overlay: 'reel_logo_overlay.png', guide: 'reel_safe_area_guide.png' };
for (const [id, f] of Object.entries(out)) await (await p.$('#' + id)).screenshot({ path: path.join(DIR, 'export', f), omitBackground: true });
await b.close(); console.log('ok');
