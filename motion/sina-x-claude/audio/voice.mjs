// Babble voices: each syllable of each line becomes a short formant "vowel" with a consonant tick,
// on the same timing the mouths use (syllables.js), so lips and sound agree to the frame.
// Claude: small, bright, quick. Sina: lower, warmer. Moods bend pitch, speed and breath.
//
//   node sina-x-claude/audio/voice.mjs        -> sina-x-claude/audio/vo.wav
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LINES, DURATION } from '../script.js';
import { speech } from '../syllables.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SR = 48000, TAU = Math.PI * 2;
const N = Math.round(DURATION * SR);
const out = new Float32Array(N);

let seed = 12345;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const gauss = () => { const u = Math.max(rnd(), 1e-9), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };

class BP {   // RBJ band-pass (constant peak gain)
  constructor(f, q) { const w = (TAU * f) / SR, al = Math.sin(w) / (2 * q), a0 = 1 + al; this.b0 = al / a0; this.b2 = -al / a0; this.a1 = (-2 * Math.cos(w)) / a0; this.a2 = (1 - al) / a0; this.x1 = this.x2 = this.y1 = this.y2 = 0; }
  tick(x) { const y = this.b0 * x + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2; this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y; }
}
const FORMANTS = { a: [800, 1250, 2600], e: [480, 1900, 2650], i: [320, 2300, 3050], o: [520, 880, 2450], u: [360, 780, 2350] };
const VOICE = {
  C: { f0: 285, fs: 1.2, bright: 0.9, breath: 0.04, gain: 0.55 },
  S: { f0: 128, fs: 0.97, bright: 0.65, breath: 0.08, gain: 0.7 },
};
const MOOD = {
  calm: { st: 0, spread: 1.6, jitter: 0.0, decl: -2.5 },
  excited: { st: 3, spread: 3.2, jitter: 0.0, decl: -1 },
  annoyed: { st: 1.5, spread: 2.6, jitter: 0.012, decl: -3 },
  sad: { st: -2, spread: 1.0, jitter: 0.0, decl: -4 },
  whisper: { st: 0, spread: 1.2, jitter: 0, decl: -2, whisper: true },
};

LINES.forEach((line, li) => {
  const V = VOICE[line.who], mood = MOOD[line.voice?.mood || 'calm'];
  const sp = speech(line, li);
  const n = sp.syl.length;
  sp.syl.forEach((s, k) => {
    const prog = n > 1 ? k / (n - 1) : 0;
    let st = (line.voice?.pitch || 0) + mood.st + mood.decl * prog + (rnd() - 0.5) * 2 * mood.spread;
    if (s.rise) st += 5;
    if (s.last && !s.rise) st -= 1.5;
    const f0 = V.f0 * 2 ** (st / 12);
    const t0 = s.t0, dur = s.t1 - s.t0;
    const i0 = Math.round(t0 * SR), len = Math.round(dur * SR), tail = Math.round(0.03 * SR);
    const F = FORMANTS[s.v].map((f) => f * V.fs);
    const bps = [new BP(F[0], 5), new BP(F[1], 7), new BP(F[2], 9)];
    const nb = new BP(4200 * V.fs, 1.4);
    const glide = (rnd() - 0.4) * 0.06;            // a little scoop on each syllable
    let ph = rnd(), lp = 0;
    const cons = 0.012 + rnd() * 0.02, consAmp = 0.25 + rnd() * 0.35;
    for (let i = 0; i < len + tail; i++) {
      const j = i0 + i;
      if (j < 0 || j >= N) continue;
      const tt = i / SR;
      const p = i / len;
      const f = f0 * (1 + glide * Math.min(1, tt / 0.05) + mood.jitter * gauss() + 0.012 * Math.sin(TAU * 5.5 * tt));
      ph = (ph + f / SR) % 1;
      let src;
      if (mood.whisper) src = gauss() * 0.5;
      else {
        const saw = 2 * ph - 1;
        lp += (saw - lp) * (0.25 + 0.5 * V.bright);     // soften the buzz
        src = lp + V.breath * gauss();
      }
      let y = bps[0].tick(src) * 1.0 + bps[1].tick(src) * 0.55 + bps[2].tick(src) * 0.22 * V.bright;
      // consonant at the onset: a short filtered noise burst
      if (tt < cons) y += nb.tick(gauss()) * consAmp * (1 - tt / cons);
      const env = Math.min(1, tt / 0.008) * (i < len ? 1 : Math.max(0, 1 - (i - len) / tail)) * (0.85 + 0.15 * Math.sin(Math.PI * Math.min(1, p)));
      out[j] += y * env * s.amp * V.gain * (mood.whisper ? 1.6 : 1);
    }
  });
});

// normalise and write a 24-bit stereo wav
let peak = 0; for (const x of out) peak = Math.max(peak, Math.abs(x));
const g = 0.7 / (peak || 1);
const buf = Buffer.alloc(44 + N * 6);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 6, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 6, 28); buf.writeUInt16LE(6, 32); buf.writeUInt16LE(24, 34); buf.write('data', 36); buf.writeUInt32LE(N * 6, 40);
for (let i = 0; i < N; i++) {
  const v = Math.max(-1, Math.min(1, out[i] * g)) * 8388607 | 0;
  for (const c of [0, 1]) { const o = 44 + i * 6 + c * 3; buf.writeUIntLE(v & 0xFFFFFF, o, 3); }
}
fs.writeFileSync(path.join(HERE, 'vo.wav'), buf);
console.log(`vo.wav: ${LINES.length} lines, ${DURATION}s`);
