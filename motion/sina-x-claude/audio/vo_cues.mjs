// Voice-first cue sheet: lay the ElevenLabs takes end to end and time the film from them.
//
//   node sina-x-claude/audio/vo_cues.mjs     -> audio/vo.wav, cues.json, film.json duration
//
// Each take is trimmed, its pauses longer than 0.22 s shortened, and played at the line's `fit`
// tempo (rubberband, formants preserved). It starts after the previous line's end plus `gap` and any
// `pre` beat the picture needs. cues.json holds every line's start/end, its word onsets (from the
// ElevenLabs character timestamps, carried through the pause trimming and the tempo) and a 100 Hz
// mouth envelope per speaker; script.js measures every cue from it.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { LINES, TAIL } from '../lines.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILM = path.resolve(HERE, '..');
const VO = path.join(HERE, 'vo');
const SR = 48000, HOP = SR / 100, PAUSE = 0.22;

function newest(id) {
  const f = fs.readdirSync(VO).filter((x) => x.startsWith(id + '.') && x.endsWith('.mp3'))
    .map((x) => path.join(VO, x)).sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
  if (!f.length) throw new Error(`no take for ${id}: run tts.mjs`);
  return f[f.length - 1];
}
function run(args, input) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { input, maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(String(r.stderr));
  return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length));
}
const decode = (f) => run(['-i', f, '-af', 'highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=6:release=90:makeup=2', '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-']);
function envOf(x) {
  const n = Math.floor(x.length / HOP), e = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let j = i * HOP; j < (i + 2) * HOP && j < x.length; j++) s += x[j] * x[j]; e[i] = Math.sqrt(s / (2 * HOP)); }
  return e;
}
// trim and shorten long pauses; returns the audio and a map from take time to tightened time
function tighten(x) {
  const e = envOf(x), peak = Math.max(...e), thr = peak * 10 ** (-38 / 20);
  let a = 0, b = e.length - 1;
  while (a < b && e[a] < thr) a++;
  while (b > a && e[b] < thr) b--;
  a = Math.max(0, a - 2); b = Math.min(e.length - 1, b + 6);
  const keep = [];
  let silent = 0;
  for (let i = a; i <= b; i++) {
    if (e[i] < thr) { silent++; if (silent > PAUSE * 100) continue; } else silent = 0;
    keep.push(i);
  }
  const out = new Float32Array(keep.length * HOP);
  let o = 0, prev = -2;
  for (const i of keep) {
    const src = x.subarray(i * HOP, (i + 1) * HOP);
    if (i !== prev + 1 && o > 0) for (let k = 0; k < 96; k++) { const w = k / 96; out[o - 96 + k] = out[o - 96 + k] * (1 - w) + src[k] * w; }
    out.set(src, o); o += HOP; prev = i;
  }
  // take time (s) -> tightened time (s): the index of the last kept frame at or before it
  const map = (t) => {
    const f = Math.round(t * 100);
    let lo = 0, hi = keep.length - 1;
    if (f <= keep[0]) return 0;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (keep[m] <= f) lo = m; else hi = m - 1; }
    return lo / 100;
  };
  return { x: out, map };
}
function stretch(x, f) {
  if (Math.abs(f - 1) < 0.001) return x;
  return run(['-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-', '-af', `rubberband=tempo=${f.toFixed(4)}:formant=preserved:pitchq=quality:transients=smooth`, '-f', 'f32le', '-'],
    Buffer.from(x.buffer, x.byteOffset, x.byteLength));
}
// word onsets (take time) from the character alignment, skipping a leading [audio tag]
function wordOnsets(jsonFile) {
  if (!fs.existsSync(jsonFile)) return [];
  const al = JSON.parse(fs.readFileSync(jsonFile, 'utf8')).alignment;
  if (!al) return [];
  const ch = al.characters, st = al.character_start_times_seconds;
  let i = 0;
  while (i < ch.length && /\s/.test(ch[i])) i++;
  if (ch[i] === '[') { while (i < ch.length && ch[i] !== ']') i++; i++; }
  const out = []; let inWord = false;
  for (; i < ch.length; i++) { const sp = /\s/.test(ch[i]); if (!sp && !inWord) out.push(st[i]); inWord = !sp; }
  return out;
}

const placed = [];
let t = 0;
for (const [i, l] of LINES.entries()) {
  const file = newest(l.id);
  const { x, map } = tighten(decode(file));
  const fit = l.fit ?? 1.12;
  const y = stretch(x, fit);
  t += (i ? l.gap ?? 0.15 : 0) + (l.pre ?? 0);
  const words = wordOnsets(file.replace(/\.mp3$/, '.json')).map((w) => +(t + map(w) / fit).toFixed(3));
  placed.push({ l, y, t0: t, t1: t + y.length / SR, words });
  t += y.length / SR;
}
const duration = Math.ceil((t + TAIL) * 24) / 24;
const N = Math.round(duration * SR), mix = new Float32Array(N);
const env = { C: new Float32Array(Math.ceil(duration * 100)), S: new Float32Array(Math.ceil(duration * 100)) };
const lines = {};
for (const p of placed) {
  const o = Math.round(p.t0 * SR);
  for (let k = 0; k < p.y.length && o + k < N; k++) mix[o + k] += p.y[k];
  const e = envOf(p.y), eo = Math.round(p.t0 * 100), E = env[p.l.who];
  for (let k = 0; k < e.length && eo + k < E.length; k++) E[eo + k] = Math.max(E[eo + k], e[k]);
  lines[p.l.id] = { t0: +p.t0.toFixed(3), t1: +p.t1.toFixed(3), words: p.words };
}
for (const k of ['C', 'S']) {
  const s = [...env[k]].filter((v) => v > 0).sort((a, b) => a - b), ref = s[Math.floor(s.length * 0.95)] || 1;
  env[k] = Array.from(env[k], (v) => +Math.min(1, v / ref).toFixed(2));
}
let peak = 0; for (const v of mix) peak = Math.max(peak, Math.abs(v));
const g = 0.708 / (peak || 1);
const buf = Buffer.alloc(44 + N * 6);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 6, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 6, 28); buf.writeUInt16LE(6, 32); buf.writeUInt16LE(24, 34); buf.write('data', 36); buf.writeUInt32LE(N * 6, 40);
for (let i = 0; i < N; i++) { const v = Math.max(-1, Math.min(1, mix[i] * g)) * 8388607 | 0; for (const c of [0, 1]) buf.writeUIntLE(v & 0xFFFFFF, 44 + i * 6 + c * 3, 3); }
fs.writeFileSync(path.join(HERE, 'vo.wav'), buf);
fs.writeFileSync(path.join(FILM, 'cues.json'), JSON.stringify({ duration, lines, env }));
const fj = path.join(FILM, 'film.json'), cfg = JSON.parse(fs.readFileSync(fj, 'utf8'));
cfg.duration = duration;
fs.writeFileSync(fj, JSON.stringify(cfg, null, 1) + '\n');
for (const p of placed) console.log(`${p.l.id.padEnd(10)} ${p.t0.toFixed(2)} -> ${p.t1.toFixed(2)}  (${(p.t1 - p.t0).toFixed(2)}s, ${p.words.length} words)`);
console.log(`cues.json + vo.wav: ${LINES.length} lines, film ${duration.toFixed(2)}s`);
