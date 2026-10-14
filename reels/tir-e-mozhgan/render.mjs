// node render.mjs <out.mp4> [fromFrame] [toFrame]
// Renders FILM frame by frame in headless Chromium and pipes PNGs into ffmpeg with the song.
const { chromium } = await import('playwright').catch(() => import('/opt/node22/lib/node_modules/playwright/index.mjs'));
import { spawn } from 'node:child_process';
const [,, out, from = '0', to] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://localhost:8765/index.html?t=0.01');
const { frames, FPS, DUR } = await p.evaluate(async () => { await FILM.ready; return { frames: FILM.frames, FPS: FILM.FPS, DUR: FILM.DUR }; });
const f0 = +from, f1 = to ? +to : frames;
const ss = (f0 / FPS).toFixed(4);
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-f', 'image2pipe', '-c:v', 'png', '-i', '-',
  '-ss', ss, '-i', 'audio/song.wav',
  '-map', '0:v', '-map', '1:a', '-shortest',
  '-vf', 'noise=alls=2:allf=t,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-profile:v', 'high', '-level', '4.2', '-g', '60',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
  '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const t0 = Date.now();
for (let f = f0; f < f1; f++) {
  const url = await p.evaluate(t => { FILM.render(t); return document.getElementById('c').toDataURL('image/png'); }, f / FPS);
  const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (f % 60 === 0) console.log(`frame ${f}/${f1}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await b.close();
console.log('done', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
