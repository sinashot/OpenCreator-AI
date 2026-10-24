// Place the ElevenLabs takes on the film and re-time the film around them.
//
//   node sina-x-claude/audio/vo_build.mjs
//
// For each line it takes the newest cached take (audio/vo/<id>.*.mp3 from tts.mjs), trims the
// silence, and starts it at the line's cue. Where a take is longer than the time to the next line,
// that stretch of the film is slowed to make room (a piecewise-linear time warp: the acting, camera
// and effects keep their order and spacing, the music is re-cut to the new section lengths). If the
// film would run past 89.5 s, every take is sped up together (at most 1.12x) before warping.
// Writes audio/vo.wav, speech.json (warp, word times, a 100 Hz mouth envelope per speaker) and the
// new duration into film.json.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { LINES, DURATION } from '../script.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILM = path.resolve(HERE, '..');
const VO = process.env.VO_DIR || path.join(HERE, 'vo');
const SR = 48000, ENV_HZ = 100;
const MAX_DUR = 89.5, MAX_SPEED = 1.12, LEAD = 0.06, GAP = 0.22;

// newest take per line: tts.mjs takes (<id>.<hash>.mp3 + .json with timestamps), or plain files
// made elsewhere and dropped in as <nn>_<id>.mp3 / <id>.mp3 (no timestamps: words are spread evenly)
const takes = {};
const ids = new Set(LINES.map((l) => l.id));
for (const f of fs.readdirSync(VO).filter((f) => /\.(mp3|wav|m4a)$/i.test(f))) {
  const file = path.join(VO, f), mt = fs.statSync(file).mtimeMs;
  const meta = file.replace(/\.(mp3|wav|m4a)$/i, '.json');
  let j;
  if (fs.existsSync(meta)) j = JSON.parse(fs.readFileSync(meta, 'utf8'));
  else {
    const id = f.replace(/\.(mp3|wav|m4a)$/i, '').replace(/^\d+[_-]/, '').split('.')[0];
    if (!ids.has(id)) { console.warn(`skipping ${f}: no line with id "${id}"`); continue; }
    j = { id, alignment: null };
  }
  if (!takes[j.id] || takes[j.id].mt < mt) takes[j.id] = { ...j, mp3: file, mt };
}
const missing = LINES.filter((l) => !takes[l.id]).map((l) => l.id);
if (missing.length) { console.error(`no take for: ${missing.join(', ')} (run tts.mjs)`); process.exit(1); }

function decode(file, speed) {
  const af = [`atempo=${speed.toFixed(4)}`, 'highpass=f=70', 'acompressor=threshold=-20dB:ratio=3:attack=6:release=90:makeup=2'].join(',');
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file, '-af', af, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`ffmpeg failed on ${file}: ${r.stderr}`);
  return new Float32Array(r.stdout.buffer, r.stdout.byteOffset, r.stdout.length / 4);
}
function envelope(x) {
  const hop = SR / ENV_HZ, n = Math.ceil(x.length / hop), e = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0; const a = i * hop, b = Math.min(x.length, a + hop * 2);
    for (let j = a; j < b; j++) s += x[j] * x[j];
    e[i] = Math.sqrt(s / Math.max(1, b - a));
  }
  return e;
}
// speech bounds inside a take: first/last envelope frame above -38 dB of its peak
function bounds(e) {
  const peak = Math.max(...e), thr = peak * 10 ** (-38 / 20);
  let a = 0, b = e.length - 1;
  while (a < b && e[a] < thr) a++;
  while (b > a && e[b] < thr) b--;
  return [Math.max(0, a - 2) / ENV_HZ, Math.min(e.length, b + 4) / ENV_HZ];
}
// word start times (seconds into the take) from the character alignment
function wordTimes(tk, speed) {
  const al = tk.alignment;
  const out = [];
  if (!al) return out;
  const chars = al.characters, st = al.character_start_times_seconds;
  // skip a leading [audio tag] if the alignment kept it
  let i = 0;
  while (i < chars.length && /\s/.test(chars[i])) i++;
  if (chars[i] === '[') { while (i < chars.length && chars[i] !== ']') i++; i++; }
  let inWord = false;
  for (; i < chars.length; i++) {
    const sp = /\s/.test(chars[i]);
    if (!sp && !inWord) out.push(st[i] / speed);
    inWord = !sp;
  }
  return out;
}

function layout(speed) {
  const lines = [...LINES].sort((a, b) => a.t - b.t);
  const placed = lines.map((l) => {
    const tk = takes[l.id], x = decode(tk.mp3, speed), e = envelope(x);
    const [a, b] = bounds(e);
    return { l, x, e, a, b, len: b - a, words: wordTimes(tk, speed) };
  });
  // warp breakpoints: each line's region (to the next cue) grows to fit its take
  const warp = [[0, 0]];
  let shift = 0;
  placed.forEach((p, i) => {
    const t0 = p.l.t, t1 = i + 1 < placed.length ? placed[i + 1].l.t : Math.max(t0 + p.l.d, t0 + 0.1);
    const need = LEAD + p.len + GAP;
    const grow = Math.max(0, need - (t1 - t0));
    warp.push([t0, t0 + shift]);
    shift += grow;
    warp.push([t1, t1 + shift]);
  });
  warp.push([DURATION, DURATION + shift]);
  return { placed, warp, duration: DURATION + shift };
}

let speed = 1, L = layout(speed);
while (L.duration > MAX_DUR && speed < MAX_SPEED - 1e-6) { speed = Math.min(MAX_SPEED, speed + 0.02); L = layout(speed); }
if (L.duration > MAX_DUR) console.warn(`WARNING: ${L.duration.toFixed(2)} s even at ${speed}x: shorten a line in script.js`);

const W = (to) => {
  const w = L.warp;
  for (let i = 1; i < w.length; i++) if (to <= w[i][0]) { const [a0, b0] = w[i - 1], [a1, b1] = w[i]; return a1 === a0 ? b1 : b0 + ((to - a0) / (a1 - a0)) * (b1 - b0); }
  return to + (w[w.length - 1][1] - w[w.length - 1][0]);
};

// mix the takes onto the new timeline, one envelope per speaker
const N = Math.ceil(L.duration * SR);
const mix = new Float32Array(N);
const env = { C: new Float32Array(Math.ceil(L.duration * ENV_HZ)), S: new Float32Array(Math.ceil(L.duration * ENV_HZ)) };
const lines = {};
for (const p of L.placed) {
  const start = W(p.l.t) + LEAD;                     // speech onset, new time
  const off = Math.round((start - p.a) * SR);
  for (let i = Math.floor(p.a * SR); i < Math.min(p.x.length, Math.ceil((p.b + 0.15) * SR)); i++) {
    const j = off + i;
    if (j >= 0 && j < N) mix[j] += p.x[i];
  }
  const eo = Math.round((start - p.a) * ENV_HZ);
  for (let i = 0; i < p.e.length; i++) { const j = eo + i; if (j >= 0 && j < env[p.l.who].length) env[p.l.who][j] = Math.max(env[p.l.who][j], p.e[i]); }
  lines[p.l.id] = { t0: +start.toFixed(3), t1: +(start + p.len).toFixed(3), words: p.words.map((w) => +(start - p.a + w).toFixed(3)) };
}
// normalise the mouth envelopes per speaker (95th percentile -> 1)
for (const k of ['C', 'S']) {
  const s = [...env[k]].filter((v) => v > 0).sort((a, b) => a - b);
  const ref = s[Math.floor(s.length * 0.95)] || 1;
  env[k] = Array.from(env[k], (v) => +Math.min(1, v / ref).toFixed(2));
}
let peak = 0; for (const v of mix) peak = Math.max(peak, Math.abs(v));
const g = 0.708 / (peak || 1);
const buf = Buffer.alloc(44 + N * 6);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 6, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 6, 28); buf.writeUInt16LE(6, 32); buf.writeUInt16LE(24, 34); buf.write('data', 36); buf.writeUInt32LE(N * 6, 40);
for (let i = 0; i < N; i++) {
  const v = Math.max(-1, Math.min(1, mix[i] * g)) * 8388607 | 0;
  for (const c of [0, 1]) buf.writeUIntLE(v & 0xFFFFFF, 44 + i * 6 + c * 3, 3);
}
fs.writeFileSync(path.join(HERE, 'vo.wav'), buf);
const duration = +L.duration.toFixed(3);
fs.writeFileSync(path.join(FILM, 'speech.json'), JSON.stringify({ duration, speed, warp: L.warp.map(([a, b]) => [+a.toFixed(3), +b.toFixed(3)]), lines, env }));
const fj = path.join(FILM, 'film.json'), cfg = JSON.parse(fs.readFileSync(fj, 'utf8'));
cfg.duration = Math.ceil(duration * 24) / 24; cfg.poster = 63.8;
fs.writeFileSync(fj, JSON.stringify(cfg, null, 1) + '\n');
console.log(`vo.wav + speech.json: ${LINES.length} takes at ${speed.toFixed(2)}x, film ${DURATION}s -> ${duration}s`);
for (const p of L.placed) {
  const room = (S_next(p.l) - p.l.t);
  console.log(`  ${p.l.id.padEnd(6)} take ${p.len.toFixed(2)}s  room ${room.toFixed(2)}s${p.len + LEAD + GAP > room ? '  (stretched)' : ''}`);
}
function S_next(l) { const later = LINES.filter((x) => x.t > l.t).map((x) => x.t); return later.length ? Math.min(...later) : l.t + l.d; }
