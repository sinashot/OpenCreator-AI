// Stay Onward, sample reel: one coral dot carries the whole film (the pause), and at the end a line
// leaves it (onward). Timed on a 72 bpm bar grid (3.33 s a bar); a pure function of time: seek(t).
const W = 1080, H = 1920;
export const BAR = 60 / 72 * 4, DURATION = BAR * 6;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const C = { ink: '#101A26', sand: '#EEE7DA', coral: '#FF6A4D', mist: '#8E99A6' };
// Instagram's overlays leave y 165-1380 free, and x up to 935 below y 925
const CX = 540, TY = 640;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const E = { out: (k) => 1 - (1 - k) ** 3, inOut: (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2), outQuint: (k) => 1 - (1 - k) ** 5 };
const TAU = Math.PI * 2;

// the lines: [bar, English (Fraunces), Persian (Vazir)]
const LINES = [
  [1, ['You’ve been running', 'for so long,'], 'خیلی وقته داری می‌دوی،'],
  [2, ['that you forgot', 'to ask where.'], 'که یادت رفته بپرسی به کجا.'],
  [3, ['Stop', 'for a moment.'], 'یه لحظه بایست.'],
  [4, ['Then,', 'go on.'], 'بعد، ادامه بده.'],
];

function font(fam, w, s) { return `${w} ${s}px ${fam}`; }
function words(lines, x, y, size, t, t0, color) {
  // each word rises and sharpens in turn; lines are centred
  ctx.font = font('Fraunces', 420, size); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.direction = 'ltr';
  let i = 0;
  lines.forEach((ln, li) => {
    const ws = ln.split(' '), sp = ctx.measureText(' ').width, total = ws.reduce((n, w) => n + ctx.measureText(w).width, 0) + sp * (ws.length - 1);
    let px = x - total / 2;
    for (const w of ws) {
      const k = E.out(prog(t, t0 + i * 0.14, t0 + i * 0.14 + 0.7));
      ctx.save(); ctx.globalAlpha *= k; ctx.filter = k < 1 ? `blur(${(1 - k) * 10}px)` : 'none';
      ctx.fillStyle = color; ctx.fillText(w, px, y + li * size * 1.12 + (1 - k) * 40);
      ctx.restore();
      px += ctx.measureText(w).width + sp; i++;
    }
  });
  return i;
}
function persian(s, x, y, size, t, t0) {
  const k = E.out(prog(t, t0, t0 + 0.8));
  ctx.save(); ctx.globalAlpha *= k * 0.9; ctx.font = font('Vazir', 600, size); ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = C.sand; ctx.fillText(s, x, y + (1 - k) * 20); ctx.restore();
}

// the dot: where it sits in each bar (it travels between them, never cuts)
const DOT = [[CX, 960, 26], [CX, 470, 13], [CX, 470, 13], [CX, 1160, 30], [300, 1160, 22], [780, 1160, 22]];
function dotAt(t) {
  const b = Math.floor(t / BAR), f = (t - b * BAR) / BAR;
  const a = DOT[Math.min(5, b)], n = DOT[Math.min(5, b + 1)];
  const k = E.inOut(prog(f, 0.82, 1));
  return [lerp(a[0], n[0], k), lerp(a[1], n[1], k), lerp(a[2], n[2], k)];
}

const GRAIN = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256); let s = 7;
  for (let i = 0; i < d.data.length; i += 4) { s = (s * 1664525 + 1013904223) >>> 0; const v = (s / 4294967296) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 16; } x.putImageData(d, 0, 0); return c; })();

function wordmark(x, y, size, a) {
  ctx.save(); ctx.globalAlpha *= a; ctx.font = font('Fraunces', 420, size); ctx.textBaseline = 'alphabetic'; ctx.direction = 'ltr'; ctx.textAlign = 'left';
  const w1 = ctx.measureText('stay').width, w2 = ctx.measureText('onward').width, gap = size * 0.36, total = w1 + gap + w2;
  ctx.fillStyle = C.sand; ctx.fillText('stay', x - total / 2, y); ctx.fillText('onward', x - total / 2 + w1 + gap, y);
  ctx.restore();
  return [x - total / 2 + w1 + gap / 2, y - size * 0.12];   // where its dot goes
}

function seek(t) {
  // background: midnight with a slow breathing vignette
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(CX, 900, 100, CX, 900, 1200);
  g.addColorStop(0, 'rgba(40,58,80,.45)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // the small logo under Instagram's header, from the start
  if (t < BAR * 5) wordmark(CX, 215, 44, 0.85 * prog(t, 0.2, 1.2) * (1 - prog(t, BAR * 5 - 0.6, BAR * 5)));

  let [dx, dy, dr] = dotAt(t);
  // bar 0: the dot appears and breathes; "Pause."
  if (t < BAR + 0.5) {
    const k = 1 - prog(t, BAR - 0.4, BAR);
    ctx.save(); ctx.globalAlpha = k;
    ctx.textAlign = 'center'; ctx.direction = 'ltr'; ctx.fillStyle = C.sand; ctx.font = font('Fraunces', 420, 150);
    const kk = E.out(prog(t, 0.9, 1.8)); ctx.globalAlpha = k * kk; ctx.fillText('Pause.', CX, 760 + (1 - kk) * 30);
    ctx.globalAlpha = k; persian('مکث کن.', CX, 1210, 58, t, 1.5);
    ctx.restore();
    dr *= E.outQuint(prog(t, 0.1, 0.9));
  }
  // the lines
  for (const [b, en, fa] of LINES) {
    const t0 = b * BAR, t1 = t0 + BAR;
    if (t < t0 - 0.1 || t > t1 + 0.1) continue;
    const out = prog(t, t1 - 0.45, t1);
    ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, -out * 30);
    const big = b >= 3 ? 136 : 112;
    words(en, CX, TY + 120, big, t, t0 + 0.25, C.sand);
    persian(fa, CX, TY + 120 + big * 1.12 + 110, 52, t, t0 + 1.0);
    ctx.restore();
  }
  // bar 4: a line leaves the dot and becomes an arrow
  if (t >= BAR * 4 && t < BAR * 5 + 0.6) {
    const k = E.inOut(prog(t, BAR * 4 + 0.9, BAR * 4 + 2.4)), out = prog(t, BAR * 5 - 0.3, BAR * 5 + 0.3);
    ctx.save(); ctx.globalAlpha = 1 - out; ctx.strokeStyle = C.sand; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const x0 = 300 + 50, x1 = lerp(x0, 780, k);
    ctx.beginPath(); ctx.moveTo(x0, 1160); ctx.lineTo(x1, 1160); ctx.stroke();
    if (k > 0.05) { const a = 36 * Math.min(1, k * 3); ctx.beginPath(); ctx.moveTo(x1 - a, 1160 - a); ctx.lineTo(x1, 1160); ctx.lineTo(x1 - a, 1160 + a); ctx.stroke(); }
    ctx.restore();
  }
  // bar 5: the logo, the dot lands in it; a call to save
  if (t >= BAR * 5) {
    const t0 = BAR * 5, k = E.out(prog(t, t0 + 0.2, t0 + 1.2));
    const [lx, ly] = wordmark(CX, 860, 150, k);
    const land = E.inOut(prog(t, t0, t0 + 0.9));
    dx = lerp(780, lx, land); dy = lerp(1160, ly, land); dr = lerp(22, 17, land);
    persian('سیوش کن برای روزهایی که یادت می‌ره.', CX, 1100, 46, t, t0 + 1.3);
    ctx.save(); ctx.globalAlpha = E.out(prog(t, t0 + 1.6, t0 + 2.4)) * 0.8; ctx.font = font('Manrope', 600, 34); ctx.textAlign = 'center'; ctx.fillStyle = C.mist; ctx.letterSpacing = '6px';
    ctx.fillText('SMALL REMINDERS FOR THE ROAD AHEAD', CX, 1200); ctx.restore();
  }
  // ripples from the dot on each bar's downbeat
  for (let b = 0; b < 6; b++) {
    const p = prog(t, b * BAR, b * BAR + 2.2); if (p <= 0 || p >= 1) continue;
    ctx.save(); ctx.globalAlpha = 0.35 * (1 - p); ctx.strokeStyle = C.coral; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(dx, dy, dr + p * 220, 0, TAU); ctx.stroke(); ctx.restore();
  }
  const breathe = 1 + 0.06 * Math.sin(t * TAU / BAR * 2);
  ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(dx, dy, Math.max(0.01, dr * breathe), 0, TAU); ctx.fill();

  // grain
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; let s = Math.floor(t * 24) * 9301 + 49297; s = s % 233280;
  ctx.translate(-(s % 256), -((s * 7) % 256)); ctx.fillStyle = ctx.createPattern(GRAIN, 'repeat'); ctx.fillRect(0, 0, W + 256, H + 256); ctx.restore();
  ctx.filter = 'none';
  if (new URLSearchParams(location.search).has('safe')) {
    ctx.fillStyle = 'rgba(255,0,255,.25)'; ctx.fillRect(0, 0, W, 115); ctx.fillRect(960, 925, 120, 995); ctx.fillRect(70, 1390, 240, 220); ctx.fillRect(0, 1660, W, 260);
  }
}
window.seek = seek; window.DURATION = DURATION;
window.ready = Promise.all([document.fonts.load(font('Fraunces', 420, 100)), document.fonts.load(font('Vazir', 600, 50)), document.fonts.load(font('Manrope', 600, 30))]).then(() => { seek(0); return true; });
