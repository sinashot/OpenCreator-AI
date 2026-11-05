// Stay Onward on a spoken voice: «the gap between an idea and doing it». The coral dot is the idea,
// the line and arrow are the doing; the gap between them shrinks through the film. Graphics sit in the
// upper band, the spoken words in the lower band, both inside Instagram's free area.
// A pure function of time: window.seek(t) paints frame t.
import { WORDS } from './words.js';

const W = 1080, H = 1920;
export const DURATION = 116.6;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const C = { ink: '#101A26', sand: '#EEE7DA', coral: '#FF6A4D', mist: '#8E99A6', deep: '#18263A' };
const CX = 540, GY = 560;                          // graphics centre; words below, from y 900
const ws = (i, o = 0) => WORDS[i][1] + o, we = (i, o = 0) => WORDS[i][2] + o;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const E = { out: (k) => 1 - (1 - k) ** 3, inOut: (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2), back: (k, s = 1.6) => 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2 };
const pop = (t, t0, d = 0.35) => (t < t0 ? 0 : E.back(prog(t, t0, t0 + d)));
const appear = (t, t0, d = 0.6) => E.out(prog(t, t0, t0 + d));
const TAU = Math.PI * 2;
const FA = (s) => String(s).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const font = (fam, w, s) => `${w} ${s}px ${fam}`;

// ---------------------------------------------------------------- scenes, on the words
const SC = [
  ['hook', 0], ['share', ws(22, -0.2)], ['common', ws(52, -0.2)], ['gap', ws(72, -0.2)], ['wait', ws(85, -0.2)], ['rough', ws(100, -0.2)],
  ['test', ws(113, -0.3)], ['loop', ws(138, -0.2)], ['act', ws(155, -0.2)], ['save', ws(174, -0.2)], ['close', ws(204, -0.2)], ['end', ws(222, -0.2)],
].map(([id, a], i, all) => ({ id, a, b: i + 1 < all.length ? all[i + 1][1] : DURATION }));
// where the dot rests in each scene
const ANCHOR = { hook: [CX, 330, 20], share: [CX, 330, 14], common: [CX, 560, 18], gap: [800, GY, 26], wait: [CX, 250, 12], rough: [800, GY, 22],
  test: [CX + 125, 300, 14], loop: [CX, GY, 16], act: [CX, 300, 16], save: [CX, 520, 16], close: [800, GY, 26], end: [0, 0, 18] };

// ---------------------------------------------------------------- drawing helpers
function txt(s, x, y, size, color, o = {}) {
  const k = o.k ?? 1; if (k <= 0.001) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.globalAlpha *= o.a ?? 1;
  ctx.font = font(o.fam ?? 'Vazir', o.w ?? 800, size); ctx.direction = o.ltr ? 'ltr' : 'rtl'; ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = color; ctx.fillText(s, 0, 0); ctx.restore();
}
function stroke(c, w) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
function arrowLeft(x0, x1, y, color, w = 12, k = 1) {            // a line from x0 leftwards to x1, head at x1
  if (k <= 0) return; const x = lerp(x0, x1, k);
  ctx.save(); stroke(color, w); ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x, y); ctx.stroke();
  const a = 34 * Math.min(1, k * 3); ctx.beginPath(); ctx.moveTo(x + a, y - a); ctx.lineTo(x, y); ctx.lineTo(x + a, y + a); ctx.stroke(); ctx.restore();
}
function bracket(x0, x1, y, color, label, k) {                    // the measured gap
  if (k <= 0) return;
  ctx.save(); ctx.globalAlpha *= k; stroke(color, 4);
  ctx.beginPath(); ctx.moveTo(x0, y + 18); ctx.lineTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1, y + 18); ctx.stroke(); ctx.restore();
  txt(label, (x0 + x1) / 2, y - 40, 40, color, { a: k, w: 700 });
}
// the idea-to-doing diagram: the dot is drawn by the frame (it is the travelling dot)
function gapDiagram(t, start, gap, o = {}) {
  const k = appear(t, start, 0.8), dotX = 800;
  const xs = dotX - 40 - gap, x1 = xs - 330;                       // the doing starts after the gap
  arrowLeft(xs, x1, GY, C.sand, 12, k);
  bracket(dotX - 6, xs + 6, GY - 90, C.coral, 'فاصله', appear(t, start + 0.5) * clamp((dotX - xs) / 80));
  txt('ایده', dotX, GY + 90, 50, C.coral, { a: k });
  txt('اجرا', (xs + x1) / 2, GY + 90, 50, C.sand, { a: k });
}

// ---------------------------------------------------------------- scenes
const SCENE = {
  hook(t) {
    const k = pop(t, ws(0, -0.1));
    txt(FA('۳'), CX, 520, 300, C.sand, { k, fam: 'Fraunces', w: 420 });
    txt('سال پیش', CX, 700, 60, C.mist, { a: appear(t, ws(1)) });
    // a quote mark that the sentence comes from
    txt('«یه جمله»', CX, 800, 64, C.coral, { a: appear(t, ws(12, -0.1)) * (1 - prog(t, ws(17), ws(17, 0.4))) });
  },
  share(t) {
    const k = appear(t, ws(35, -0.2));
    for (let i = 0; i < 5; i++) {                                    // one dot shares itself with others
      const a = -Math.PI / 2 + (i - 2) * 0.5, r = 230 * E.out(prog(t, ws(37) + i * 0.08, ws(42) + i * 0.08));
      ctx.fillStyle = C.coral; ctx.globalAlpha = k; ctx.beginPath(); ctx.arc(CX + Math.cos(a) * r, 520 + Math.sin(a) * r * -0.3 + 120, 10, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    }
    txt('یاد بدم', CX, 760, 70, C.sand, { a: appear(t, ws(41)) });
  },
  common(t) {
    // a row of people: all of them share one thing
    const n = 7, y = 470;
    for (let i = 0; i < n; i++) {
      const x = CX + (i - 3) * 110, k = pop(t, ws(63) + i * 0.07);
      if (k <= 0) continue;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k); stroke(C.sand, 6); ctx.fillStyle = C.ink;
      ctx.beginPath(); ctx.arc(0, -40, 22, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-34, 40); ctx.quadraticCurveTo(-32, -8, 0, -8); ctx.quadraticCurveTo(32, -8, 34, 40); ctx.stroke();
      ctx.restore();
      const lit = prog(t, ws(67) + i * 0.06, ws(67) + i * 0.06 + 0.3);
      if (lit > 0) { ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(x, y + 80, 9 * lit, 0, TAU); ctx.fill(); }
    }
    txt('یک ویژگیِ مشترک', CX, 680, 58, C.sand, { a: appear(t, ws(66)) });
  },
  gap(t) {
    const gap = 300 - 240 * E.inOut(prog(t, ws(82), ws(84, 0.5)));
    gapDiagram(t, ws(77, -0.1), gap);
    txt('کوتاه‌ترین حالت ممکن', CX, 330, 58, C.coral, { a: appear(t, ws(82)) });
  },
  wait(t) {
    const list = [['ساعت‌ها', 89], ['ماه‌ها', 90], ['روزها', 91], ['سال‌ها', 92]];
    list.forEach(([s, i], j) => {
      const y = 390 + j * 95, k = appear(t, ws(i, -0.1), 0.4);
      txt(s, CX, y, 62, C.sand, { a: k });
      const sx = prog(t, ws(95) + j * 0.1, ws(95) + j * 0.1 + 0.3);
      if (sx > 0) { ctx.save(); stroke(C.coral, 7); const w = 150; ctx.beginPath(); ctx.moveTo(CX + w, y); ctx.lineTo(CX + w - 2 * w * sx, y); ctx.stroke(); ctx.restore(); }
    });
    const k2 = appear(t, ws(97, -0.1));
    if (k2 > 0) {
      txt('شرایط خوب', CX, 790, 56, C.mist, { a: k2 });
      const sx = prog(t, ws(99), ws(99, 0.35)); if (sx > 0) { ctx.save(); stroke(C.coral, 7); ctx.beginPath(); ctx.moveTo(CX + 150, 790); ctx.lineTo(CX + 150 - 300 * sx, 790); ctx.stroke(); ctx.restore(); }
    }
  },
  rough(t) {
    // done badly is still done: a shaky hand-drawn line from the idea
    const k = prog(t, ws(106), ws(111, 0.3));
    if (k > 0) {
      ctx.save(); stroke(C.sand, 10); ctx.beginPath();
      const x0 = 760, x1 = 250, n = 60;
      for (let i = 0; i <= n * k; i++) { const u = i / n, x = lerp(x0, x1, u), y = GY + Math.sin(u * 23) * 14 + Math.sin(u * 61) * 7; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
      if (k > 0.98) { ctx.beginPath(); ctx.moveTo(x1 + 30, GY - 40); ctx.lineTo(x1 - 2, GY + 6); ctx.lineTo(x1 + 42, GY + 26); ctx.stroke(); }
      ctx.restore();
    }
    txt('خیلی افتضاح', CX, 380, 66, C.coral, { a: appear(t, ws(106)) });
    txt('ولی اجرا شد', CX, 720, 58, C.sand, { a: appear(t, ws(111)) });
  },
  test(t) {
    // do it, see the result, keep going or try the next idea
    const box = (s, x, y, color, k, fill) => { if (k <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
      ctx.font = font('Vazir', 800, 50); const w = ctx.measureText(s).width + 60; ctx.fillStyle = fill ?? C.deep; ctx.beginPath(); ctx.roundRect(-w / 2, -42, w, 84, 42); ctx.fill(); stroke(color, 4); ctx.stroke(); ctx.restore(); txt(s, x, y + 2, 50, color, { k }); };
    const kA = pop(t, ws(116, -0.1)), kN = pop(t, ws(121, -0.1)), kY = pop(t, ws(129, -0.1)), kX = pop(t, ws(135, -0.1));
    box('اجرا', CX, 300 + 0, C.sand, kA);
    if (kN > 0) { ctx.save(); stroke(C.mist, 4); ctx.beginPath(); ctx.moveTo(CX, 345); ctx.lineTo(CX, 345 + 80 * Math.min(1, kN)); ctx.stroke(); ctx.restore(); }
    box('نتیجه؟', CX, 470, C.sand, kN);
    if (kY > 0) { ctx.save(); stroke(C.sand, 4); ctx.beginPath(); ctx.moveTo(CX + 40, 510); ctx.lineTo(CX + 200, 630); ctx.stroke(); ctx.restore(); }
    box('✓ ادامه', CX + 220, 670, C.ink, kY, C.sand);
    if (kX > 0) {
      ctx.save(); stroke(C.mist, 4); ctx.beginPath(); ctx.moveTo(CX - 40, 510); ctx.lineTo(CX - 200, 630); ctx.stroke();
      // back to the top: the next idea
      ctx.setLineDash([10, 12]); ctx.beginPath(); ctx.moveTo(CX - 330, 640); ctx.quadraticCurveTo(CX - 420, 300, CX - 70, 300); ctx.stroke(); ctx.restore();
    }
    box('✗ ایده‌ی دیگه', CX - 220, 670, C.mist, kX);
  },
  loop(t) {
    // ideas in a ring, executed one after another; thinking freezes them
    const freeze = ws(150), n = 8, R = 240, run = Math.min(t, freeze);
    const cur = Math.floor((run - ws(138)) * 3.2) % n, cold = prog(t, freeze, freeze + 0.8);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + i * TAU / n, x = CX + Math.cos(a) * R, y = GY + Math.sin(a) * R, on = i === cur && cold < 1;
      ctx.fillStyle = cold > 0.5 ? C.mist : on ? C.coral : C.sand; ctx.globalAlpha = appear(t, ws(138) + i * 0.05) * (on ? 1 : 0.55);
      ctx.beginPath(); ctx.arc(x, y, on ? 20 : 12, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (cold > 0) { txt('فلج', CX, GY + 4, 110, C.mist, { k: pop(t, ws(153, -0.05)) }); }
  },
  act(t) {
    txt('عمل‌گرایی', CX, 470, 120, C.sand, { k: pop(t, ws(163, -0.1)) });
    // again and again: arrows stacking up
    for (let i = 0; i < 3; i++) { const k = appear(t, ws(169) + i * 0.35, 0.45); if (k > 0) arrowLeft(740, 340, 620 + i * 70, i === 2 ? C.coral : C.sand, 8, k); }
  },
  save(t) {
    // a bookmark and a paper plane, the reminder you keep
    const kB = pop(t, ws(179, -0.1)), kP = pop(t, ws(181, -0.1));
    if (kB > 0) { ctx.save(); ctx.translate(CX + 140, 520); ctx.scale(kB, kB); stroke(C.sand, 9); ctx.fillStyle = C.deep;
      ctx.beginPath(); ctx.moveTo(-70, -110); ctx.lineTo(70, -110); ctx.lineTo(70, 110); ctx.lineTo(0, 55); ctx.lineTo(-70, 110); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    if (kP > 0) { ctx.save(); ctx.translate(CX - 150, 520); ctx.scale(kP, kP); stroke(C.sand, 9); ctx.fillStyle = C.deep;
      ctx.beginPath(); ctx.moveTo(100, -90); ctx.lineTo(-100, -10); ctx.lineTo(-20, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(100, -90); ctx.lineTo(10, 100); ctx.lineTo(-20, 20); ctx.stroke(); ctx.restore(); }
    txt('سیو کن', CX + 140, 720, 46, C.sand, { a: appear(t, ws(179)) });
    txt('بفرست', CX - 150, 720, 46, C.sand, { a: appear(t, ws(181)) });
  },
  close(t) {
    const gap = 300 - 300 * E.inOut(prog(t, ws(205), ws(213, 0.4)));
    gapDiagram(t, ws(205, -0.2), gap);
    txt('سریع.', CX, 320, 110, C.coral, { k: pop(t, ws(215, -0.05)) * (1 - prog(t, ws(216, -0.1), ws(216))) });
    txt('سرعت.', CX, 320, 110, C.coral, { k: pop(t, ws(216, -0.05)) });
  },
  end(t) {
    const a = ws(222, -0.2);
    ctx.save(); ctx.globalAlpha = appear(t, a, 1.0); ctx.font = font('Fraunces', 420, 140); ctx.direction = 'ltr'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = C.sand;
    const w1 = ctx.measureText('stay').width, w2 = ctx.measureText('onward').width, gap = 50, x0 = CX - (w1 + gap + w2) / 2;
    ctx.fillText('stay', x0, 600); ctx.fillText('onward', x0 + w1 + gap, 600); ctx.restore();
    ANCHOR.end = [x0 + w1 + gap / 2, 600 - 17, 16];
    txt('فاصله‌ی ایده تا اجرا رو کوتاه کن.', CX, 760, 52, C.sand, { a: appear(t, a + 1.2), w: 700 });
    if (t > 113) {
      txt('سیوش کن و بفرستش', CX, 880, 46, C.coral, { a: appear(t, 113.2), w: 700 });
      txt('برای کسی که همیشه می‌گه «بعداً».', CX, 950, 46, C.coral, { a: appear(t, 113.4), w: 700 });
      txt('SMALL REMINDERS FOR THE ROAD AHEAD', CX, 1040, 24, C.mist, { a: appear(t, 113.8), fam: 'Manrope', w: 600, ltr: true });
    }
  },
};

// ---------------------------------------------------------------- the spoken words, in the lower band
const KEY = ['ایده', 'اجرا', 'فاصله', 'کوتاه‌ترین', 'موفق', 'افتضاح', 'فلج', 'عمل‌گرایی', 'سیو', 'سریع', 'سرعت', 'تغییر', 'نتیجه', 'جمله'];
const isKey = (s) => KEY.some((k) => s.includes(k));
const CHUNKS = (() => {
  const out = []; let cur = [];
  WORDS.forEach((w, i) => {
    if (cur.length && (cur.length >= 6 || cur.reduce((n, j) => n + WORDS[j][0].length + 1, 0) + w[0].length > 30)) { out.push(cur); cur = []; }
    cur.push(i); if (/[.،:؟!]$/.test(w[0])) { out.push(cur); cur = []; }
  });
  if (cur.length) out.push(cur); return out;
})();
function spoken(t) {
  if (t > we(WORDS.length - 1, 0.6)) return;
  let ci = -1; for (let i = 0; i < CHUNKS.length; i++) if (t >= ws(CHUNKS[i][0], -0.12)) ci = i;
  if (ci < 0) return;
  const c = CHUNKS[ci], next = ci + 1 < CHUNKS.length ? ws(CHUNKS[ci + 1][0], -0.12) : DURATION;
  if (t > Math.min(next, we(c[c.length - 1], 1.0))) return;
  const size = 70, gap = 18, maxW = 790;
  ctx.font = font('Vazir', 800, size); ctx.direction = 'rtl';
  const words = c.map((i) => WORDS[i][0]), wd = words.map((s) => ctx.measureText(s).width);
  const lines = [[]]; let lw = 0;
  words.forEach((s, j) => { if (lw + wd[j] > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(j); lw += wd[j] + gap; });
  const lh = 108, top = 1160 - (lines.length - 1) * lh / 2;
  lines.forEach((l, li) => {
    const tw = l.reduce((n, j) => n + wd[j] + gap, -gap); let x = CX + tw / 2;
    for (const j of l) {
      const t0 = ws(c[j], -0.05), k = appear(t, t0, 0.35), said = t >= t0;
      const col = isKey(words[j]) ? C.coral : C.sand;
      txt(words[j], x - wd[j] / 2, top + li * lh + (1 - k) * 14, size, col, { a: said ? 0.35 + 0.65 * k : 0.22 });
      x -= wd[j] + gap;
    }
  });
}

// ---------------------------------------------------------------- frame
const GRAIN = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256); let s = 7;
  for (let i = 0; i < d.data.length; i += 4) { s = (s * 1664525 + 1013904223) >>> 0; const v = (s / 4294967296) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 16; } x.putImageData(d, 0, 0); return c; })();
function wordmarkSmall(a) {
  ctx.save(); ctx.globalAlpha = a; ctx.font = font('Fraunces', 420, 44); ctx.direction = 'ltr'; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.fillStyle = C.sand;
  const w1 = ctx.measureText('stay').width, w2 = ctx.measureText('onward').width, x0 = CX - (w1 + 16 + w2) / 2;
  ctx.fillText('stay', x0, 215); ctx.fillText('onward', x0 + w1 + 16, 215);
  ctx.fillStyle = C.coral; ctx.beginPath(); ctx.arc(x0 + w1 + 8, 210, 5.5, 0, TAU); ctx.fill(); ctx.restore();
}
function dotAt(t) {
  let i = SC.findIndex((s) => t >= s.a && t < s.b); if (i < 0) i = SC.length - 1;
  const s = SC[i], a = ANCHOR[s.id], k = i > 0 ? E.inOut(prog(t, s.a, s.a + 0.7)) : 1, p = i > 0 ? ANCHOR[SC[i - 1].id] : a;
  return [lerp(p[0], a[0], k), lerp(p[1], a[1], k), lerp(p[2], a[2], k)];
}
// scenes and the dot are drawn on a stage scaled 1.25 and lowered, so the graphics fill the band above the words
function stage() { ctx.translate(CX, 560); ctx.scale(1.25, 1.25); ctx.translate(-CX, -480); }
function seek(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(CX, 700, 100, CX, 760, 1200); g.addColorStop(0, 'rgba(40,58,80,.5)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const endA = SC[SC.length - 1].a;
  wordmarkSmall(0.85 * prog(t, 0.3, 1.3) * (1 - prog(t, endA, endA + 0.5)));
  for (const s of SC) {
    if (t < s.a || t >= s.b + 0.35) continue;
    const out = prog(t, s.b, s.b + 0.35), inn = s.a === 0 ? 1 : prog(t, s.a, s.a + 0.35);
    ctx.save(); stage(); ctx.globalAlpha = Math.min(1 - out, inn); ctx.translate(0, -out * 30); SCENE[s.id](t); ctx.restore();
  }
  // the dot: the idea; in the gap scenes it rides into the arrow at the end
  let [dx, dy, dr] = dotAt(t);
  const closeS = SC.find((s) => s.id === 'close');
  if (t >= ws(218) && t < closeS.b) { const k = E.inOut(prog(t, ws(218), ws(220, 0.4))); dx = lerp(800, 430, k); }
  const fz = t >= ws(150) && t < SC.find((s) => s.id === 'act').a;   // frozen, grey, while thinking paralyses
  const br = fz ? 1 : 1 + 0.07 * Math.sin(t * 2.6);
  ctx.save(); stage(); ctx.fillStyle = fz ? C.mist : C.coral; ctx.beginPath(); ctx.arc(dx, dy, dr * br * Math.min(1, t / 0.4), 0, TAU); ctx.fill(); ctx.restore();
  spoken(t);
  ctx.save(); ctx.globalCompositeOperation = 'overlay'; const s = (Math.floor(t * 24) * 9301 + 49297) % 233280;
  ctx.translate(-(s % 256), -((s * 7) % 256)); ctx.fillStyle = ctx.createPattern(GRAIN, 'repeat'); ctx.fillRect(0, 0, W + 256, H + 256); ctx.restore();
  if (new URLSearchParams(location.search).has('safe')) {
    ctx.fillStyle = 'rgba(255,0,255,.25)'; ctx.fillRect(0, 0, W, 115); ctx.fillRect(960, 925, 120, 995); ctx.fillRect(70, 1390, 240, 220); ctx.fillRect(0, 1660, W, 260);
  }
}
window.seek = seek; window.DURATION = DURATION;
window.ready = Promise.all([document.fonts.load(font('Fraunces', 420, 100)), document.fonts.load(font('Vazir', 800, 50)), document.fonts.load(font('Manrope', 600, 30))]).then(() => { seek(0); return true; });
