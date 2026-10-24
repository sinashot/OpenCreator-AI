// Fit the ElevenLabs takes into the film as already rendered (no re-render, no time warp).
//
//   node sina-x-claude/audio/vo_fit.mjs        -> sina-x-claude/audio/vo.wav (the film's own length)
//
// Each take is trimmed, its long pauses shortened to 0.22 s, and placed at its line's cue. A take
// longer than the time to the next line is sped up just enough (rubberband, formants preserved,
// at most 1.3x); what is still left over pushes the next line's voice a little later, never more
// than a few tenths of a second behind its bubble.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { LINES, DURATION } from '../script.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VO = path.join(HERE, 'vo');
const SR = 48000, HOP = SR / 100;
const LEAD = 0.06, GAP = 0.1, MAX_F = 1.3, PAUSE = 0.22;

function newest(id) {
  const f = fs.readdirSync(VO).filter((x) => x.startsWith(id + '.') && x.endsWith('.mp3'))
    .map((x) => path.join(VO, x)).sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
  if (!f.length) throw new Error(`no take for ${id}`);
  return f[f.length - 1];
}
function pcm(file, filter) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file, ...(filter ? ['-af', filter] : []), '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(String(r.stderr));
  return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length));
}
function env(x) {
  const n = Math.floor(x.length / HOP), e = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let j = i * HOP; j < (i + 2) * HOP && j < x.length; j++) s += x[j] * x[j]; e[i] = Math.sqrt(s / (2 * HOP)); }
  return e;
}
// trim the ends, shorten every pause longer than PAUSE to PAUSE
function tighten(x) {
  const e = env(x), peak = Math.max(...e), thr = peak * 10 ** (-38 / 20);
  let a = 0, b = e.length - 1;
  while (a < b && e[a] < thr) a++;
  while (b > a && e[b] < thr) b--;
  a = Math.max(0, a - 2); b = Math.min(e.length - 1, b + 6);
  const keep = [];
  let run = 0;
  for (let i = a; i <= b; i++) {
    if (e[i] < thr) { run++; if (run > PAUSE * 100) continue; } else run = 0;
    keep.push(i);
  }
  const out = new Float32Array(keep.length * HOP);
  // copy frame by frame with a short crossfade at each splice
  let o = 0, prev = -2;
  for (const i of keep) {
    const src = x.subarray(i * HOP, (i + 1) * HOP);
    if (i !== prev + 1 && o > 0) for (let k = 0; k < 96 && k < src.length; k++) { const w = k / 96; out[o - 96 + k] = out[o - 96 + k] * (1 - w) + src[k] * w; }
    out.set(src, o); o += HOP; prev = i;
  }
  return out;
}
function writeF32(file, x) { fs.writeFileSync(file, Buffer.from(x.buffer, x.byteOffset, x.byteLength)); }
function stretch(x, f) {
  if (f <= 1.001) return x;
  const tmp = path.join(HERE, '.fit.f32');
  writeF32(tmp, x);
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', tmp,
    '-af', `rubberband=tempo=${f.toFixed(4)}:formant=preserved:pitchq=quality:transients=smooth`, '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  fs.rmSync(tmp);
  if (r.status !== 0) throw new Error(String(r.stderr));
  return new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.length));
}

const lines = [...LINES].sort((a, b) => a.t - b.t);
const N = Math.round(DURATION * SR), mix = new Float32Array(N);
let prevEnd = 0;
const report = [];
lines.forEach((l, i) => {
  const x = tighten(pcm(newest(l.id), 'highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=6:release=90:makeup=2'));
  const len = x.length / SR;
  const start = Math.max(l.t + LEAD, prevEnd + GAP);
  const next = i + 1 < lines.length ? lines[i + 1].t : DURATION - 0.5;
  const room = next + 0.25 - start - GAP;              // may lean a quarter second into the next cue
  const f = Math.min(MAX_F, Math.max(1, len / room));
  const y = stretch(x, f);
  const o = Math.round(start * SR);
  for (let k = 0; k < y.length && o + k < N; k++) mix[o + k] += y[k];
  prevEnd = start + y.length / SR;
  report.push(`${l.id.padEnd(6)} at ${start.toFixed(2)} (cue ${l.t.toFixed(2)}${start - l.t > 0.3 ? ', late' : ''})  ${len.toFixed(2)}s x${f.toFixed(2)} -> ends ${prevEnd.toFixed(2)}${i + 1 < lines.length && prevEnd > next ? `  over next cue by ${(prevEnd - next).toFixed(2)}` : ''}`);
});

let peak = 0; for (const v of mix) peak = Math.max(peak, Math.abs(v));
const g = 0.708 / (peak || 1);
const buf = Buffer.alloc(44 + N * 6);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 6, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 6, 28); buf.writeUInt16LE(6, 32); buf.writeUInt16LE(24, 34); buf.write('data', 36); buf.writeUInt32LE(N * 6, 40);
for (let i = 0; i < N; i++) { const v = Math.max(-1, Math.min(1, mix[i] * g)) * 8388607 | 0; for (const c of [0, 1]) buf.writeUIntLE(v & 0xFFFFFF, 44 + i * 6 + c * 3, 3); }
fs.writeFileSync(path.join(HERE, 'vo.wav'), buf);
console.log(report.join('\n'));
console.log(`vo.wav: ${lines.length} takes fitted into ${DURATION}s`);
