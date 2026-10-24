// Speech timing shared by the picture (mouth, word-by-word bubbles) and the babble voice
// (audio/voice.mjs). Pure: the same line always gives the same syllables.

const PAUSE = { '…': 0.32, '،': 0.16, '؛': 0.2, '.': 0.22, '!': 0.18, '؟': 0.18, ':': 0.2, ')': 0.12 };
const VOWELS = ['a', 'e', 'o', 'i', 'u', 'a', 'e', 'a'];

function hash(i, s) {
  let a = (i * 374761393 + s * 668265263) | 0;
  a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const letters = (w) => [...w].filter((ch) => /[؀-ۿ۰-۹A-Za-z0-9]/.test(ch) && ch !== '‌').length;

// -> { words: [{ text, t }], syl: [{ t0, t1, v, amp, rise, word }], end }
export function speech(line, lineIndex = 0) {
  const raw = line.text.split(/\s+/).filter(Boolean);
  const rate = line.voice?.rate ?? 1;
  const nSylOf = (w) => Math.max(1, Math.round(letters(w) / 2.3));
  const pauses = raw.map((w) => [...w].reduce((p, ch) => p + (PAUSE[ch] || 0), 0));
  const nSyl = raw.reduce((s, w) => s + nSylOf(w), 0);
  const avail = line.d - 0.25 - pauses.reduce((a, b) => a + b, 0);
  const dur = Math.min(0.17, Math.max(0.085, avail / nSyl)) / rate;
  let t = line.t + 0.08;
  const words = [], syl = [];
  raw.forEach((w, wi) => {
    words.push({ text: w, t });
    const n = nSylOf(w);
    for (let k = 0; k < n; k++) {
      const h = hash(lineIndex * 101 + syl.length, 7);
      const d = dur * (0.8 + 0.4 * h);
      syl.push({ t0: t, t1: t + d, v: VOWELS[Math.floor(hash(lineIndex * 101 + syl.length, 3) * VOWELS.length)],
        amp: 0.75 + 0.25 * hash(syl.length, 11) + (k === 0 ? 0.1 : 0), word: wi,
        rise: /؟/.test(w) && k === n - 1 ? 1 : 0, last: wi === raw.length - 1 && k === n - 1 });
      t += d;
    }
    t += pauses[wi] + 0.025;
  });
  // squeeze a long take into its slot
  const limit = line.t + line.d - 0.12;
  if (t > limit) {
    const k = (limit - line.t) / (t - line.t), f = (x) => line.t + (x - line.t) * k;
    words.forEach((w) => { w.t = f(w.t); });
    syl.forEach((s) => { s.t0 = f(s.t0); s.t1 = f(s.t1); });
    t = limit;
  }
  return { words, syl, end: t };
}

// mouth opening 0..1 at time t for a set of lines (one speaker)
export function mouthAt(lines, t, cache) {
  for (const L of lines) {
    if (t < L.t || t > L.t + L.d) continue;
    const sp = cache.get(L) || cache.set(L, speech(L, L.index)).get(L);
    for (const s of sp.syl) {
      if (t >= s.t0 && t < s.t1) {
        const p = (t - s.t0) / (s.t1 - s.t0);
        return { open: Math.sin(Math.PI * Math.min(1, p * 1.15)) * s.amp, vis: s.v === 'i' || s.v === 'e' ? 1.3 : s.v === 'o' || s.v === 'u' ? 0.6 : 1 };
      }
    }
  }
  return { open: 0, vis: 1 };
}
