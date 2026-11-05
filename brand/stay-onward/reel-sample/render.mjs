// Render the film to MP4 frames (30 fps) with headless Chromium, mux the voice-over.
//   node render.mjs out.mp4 [from:to] [--stills t1,t2,...]
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');   // serve the repo root (fonts live in brand/ and motion/)
const FPS = 30, WORKERS = 4;
const args = process.argv.slice(2);
const stills = args.includes('--stills') ? args[args.indexOf('--stills') + 1].split(',').map(Number) : null;
const out = args[0];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => {
  const f = path.join(DIR, decodeURIComponent(q.url.split('?')[0]));
  if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}/brand/stay-onward/reel-sample/index.html${process.env.Q ? "?" + process.env.Q : ""}`;
const browser = await chromium.launch();
async function page() {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', (e) => console.error('page error', e.message));
  await p.goto(url); await p.waitForFunction(() => window.ready); await p.evaluate(() => window.ready);
  return p;
}
const grab = (p, t) => p.evaluate((t) => { window.seek(t); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, t)
  .then((d) => Buffer.from(d.split(',')[1], 'base64'));
if (stills) {
  const p = await page();
  for (const t of stills) fs.writeFileSync(`${out}_${t.toFixed(2)}.jpg`, await grab(p, t));
} else {
  const pages = await Promise.all(Array.from({ length: WORKERS }, page));
  const dur = await pages[0].evaluate(() => window.DURATION);
  const [a, b] = args[1] && args[1].includes(':') ? args[1].split(':').map(Number) : [0, dur];
  const f0 = Math.round(a * FPS), f1 = Math.round(Math.min(b, dur) * FPS);
  const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f += WORKERS) {
    const batch = await Promise.all(pages.map((p, i) => (f + i < f1 ? grab(p, (f + i) / FPS) : null)));
    for (const b of batch) if (b && !ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - f0) % 300 < WORKERS) process.stdout.write(`\r${f - f0}/${f1 - f0} frames  ${((f - f0) / ((Date.now() - t0) / 1000)).toFixed(1)} fps   `);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  console.log(`\n-> ${out}`);
}
await browser.close(); server.close();
