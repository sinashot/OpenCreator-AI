// «چهار ترکیب دارویی خطرناک»: a 2-D motion graphic timed on the voice-over's word timings.
// Everything is a pure function of time: window.seek(t) paints frame t.
import { WORDS } from './words.js';

const W = 1080, H = 1920;
export const CUT = 76.95, DURATION = CUT + 2.85;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');

// ---------------------------------------------------------------- palette: black, alarm red, warning yellow, electric cyan
const C = { bg: '#09090B', panel: '#141419', line: '#26262E', white: '#FFFFFF', red: '#FF2639', yel: '#FFD400', cyan: '#00E1FF', orange: '#FF6A00', grey: '#8A8A96' };
const FONT = (w, s) => `${w} ${s}px Vazir`;
const FA = (s) => String(s).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

// ---------------------------------------------------------------- time helpers
const ws = (i, o = 0) => WORDS[i][1] + o;               // word i starts
const we = (i, o = 0) => WORDS[i][2] + o;               // word i ends
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const E = {
  out: (k) => 1 - (1 - k) ** 3,
  inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2),
  back: (k, s = 1.9) => 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2,
};
const pop = (t, t0, d = 0.32) => (t < t0 ? 0 : E.back(prog(t, t0, t0 + d)));
const fade = (t, a, b, d = 0.25) => Math.min(prog(t, a, a + d), 1 - prog(t, b - d, b));
const bump = (t, t0, d = 0.25) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * (t - t0) / d));
const TAU = Math.PI * 2;
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------------------------------------------------------------- scenes (start, end)
const SC = {
  head: [0, ws(6, -0.15)],
  bomb: [ws(6, -0.15), ws(19, -0.25)],
  c1: [ws(19, -0.25), ws(43, -0.25)],
  c2: [ws(43, -0.25), ws(73, -0.25)],
  c3: [ws(73, -0.25), ws(103, -0.25)],
  c4: [ws(103, -0.25), ws(122, -0.3)],
  none: [ws(122, -0.3), ws(137, -0.25)],
  ask: [ws(137, -0.25), CUT],
  cta: [CUT, DURATION],
};
const SLAMS = [ws(16), ws(19, -0.25), ws(43, -0.25), ws(71), ws(73, -0.25), ws(99), ws(103, -0.25), ws(119), ws(126)];

// ---------------------------------------------------------------- drawing primitives
function text(s, x, y, size, color, o = {}) {
  ctx.save();
  ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.k !== undefined) ctx.scale(o.k, o.k);
  ctx.globalAlpha *= o.a ?? 1;
  ctx.font = FONT(o.w ?? 900, size); ctx.direction = 'rtl'; ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'middle';
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.stroke; ctx.strokeStyle = o.strokeColor ?? C.bg; ctx.strokeText(s, 0, 0); }
  ctx.fillStyle = color; ctx.fillText(s, 0, 0);
  ctx.restore();
}
function measure(s, size, w = 900) { ctx.font = FONT(w, size); ctx.direction = 'rtl'; return ctx.measureText(s).width; }
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function label(s, x, y, size, fg, bg, o = {}) {   // a solid tag
  const k = o.k ?? 1; if (k <= 0.001) return;
  const tw = measure(s, size, o.w ?? 900), pw = tw + size * 1.0, ph = size * 1.55;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); if (o.rot) ctx.rotate(o.rot);
  ctx.fillStyle = bg; rrect(-pw / 2, -ph / 2, pw, ph, o.r ?? ph * 0.22); ctx.fill();
  ctx.restore();
  text(s, x, y + size * 0.06, size, fg, { k, w: o.w, rot: o.rot });
}
// a capsule split in two colours
function capsule(x, y, len, r, ang, c1, c2, k = 1) {
  if (k <= 0.001) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(k, k);
  ctx.lineWidth = 10; ctx.strokeStyle = C.bg;
  ctx.fillStyle = c1; rrect(-len / 2, -r, len / 2, 2 * r, [r, 0, 0, r]); ctx.fill();
  ctx.fillStyle = c2; rrect(0, -r, len / 2, 2 * r, [0, r, r, 0]); ctx.fill();
  rrect(-len / 2, -r, len, 2 * r, r); ctx.stroke();
  ctx.globalAlpha = 0.55; ctx.fillStyle = '#fff'; rrect(-len / 2 + r * 0.5, -r * 0.62, len - r, r * 0.32, r * 0.16); ctx.fill();
  ctx.restore();
}
function tablet(x, y, r, color, ang = 0, k = 1) {
  if (k <= 0.001) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(k, k);
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.lineWidth = 10; ctx.strokeStyle = C.bg; ctx.stroke();
  ctx.lineWidth = r * 0.14; ctx.beginPath(); ctx.moveTo(-r * 0.62, 0); ctx.lineTo(r * 0.62, 0); ctx.stroke();
  ctx.restore();
}
function drop(x, y, s, color, k = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * k, s * k);
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(0, -1.3); ctx.bezierCurveTo(0.35, -0.7, 0.9, -0.2, 0.9, 0.35); ctx.arc(0, 0.35, 0.9, 0, Math.PI); ctx.bezierCurveTo(-0.9, -0.2, -0.35, -0.7, 0, -1.3);
  ctx.fill(); ctx.restore();
}
function heart(x, y, s, color, k = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * k, s * k);
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(0, 0.85); ctx.bezierCurveTo(-1.25, 0, -1.1, -1.05, -0.5, -1.05); ctx.bezierCurveTo(-0.15, -1.05, 0, -0.75, 0, -0.55);
  ctx.bezierCurveTo(0, -0.75, 0.15, -1.05, 0.5, -1.05); ctx.bezierCurveTo(1.1, -1.05, 1.25, 0, 0, 0.85);
  ctx.fill(); ctx.restore();
}
function stomach(x, y, s, fill, stroke) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-0.2, -1.3); ctx.lineTo(-0.2, -0.75);
  ctx.bezierCurveTo(-0.95, -0.6, -1.05, 0.55, -0.35, 0.9); ctx.bezierCurveTo(0.2, 1.15, 0.9, 0.95, 1.05, 0.35);
  ctx.lineTo(1.35, 0.55); ctx.lineTo(1.45, 0.3); ctx.lineTo(1.05, 0.05);
  ctx.bezierCurveTo(0.85, -0.3, 0.45, -0.25, 0.4, -0.6); ctx.lineTo(0.4, -1.3);
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 0.09; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.restore();
}
function lungs(x, y, s, fill, stroke, breath = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.lineWidth = 0.08; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const sd of [-1, 1]) {
    ctx.save(); ctx.scale(sd * (0.92 + 0.08 * breath), 0.92 + 0.08 * breath);
    ctx.beginPath(); ctx.moveTo(0.18, -0.55);
    ctx.bezierCurveTo(0.6, -1.15, 1.05, -0.4, 1.05, 0.45); ctx.bezierCurveTo(1.05, 1.0, 0.6, 1.1, 0.3, 0.95); ctx.bezierCurveTo(0.15, 0.85, 0.15, 0.2, 0.18, -0.55);
    ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.beginPath(); ctx.moveTo(0, -1.25); ctx.lineTo(0, -0.45); ctx.moveTo(0, -0.45); ctx.lineTo(-0.3, -0.2); ctx.moveTo(0, -0.45); ctx.lineTo(0.3, -0.2); ctx.stroke();
  ctx.restore();
}
function brain(x, y, s, color, glow = 0) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 60 * glow; }
  ctx.fillStyle = C.panel; ctx.strokeStyle = color; ctx.lineWidth = 0.08; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  const lobes = [[-0.62, -0.1, 0.48], [-0.32, -0.5, 0.48], [0.18, -0.58, 0.5], [0.62, -0.22, 0.46], [0.5, 0.25, 0.42], [-0.45, 0.28, 0.42], [0.05, 0.2, 0.45]];
  for (const [a, b, r] of lobes) { ctx.moveTo(a + r, b); ctx.arc(a, b, r, 0, TAU); }
  ctx.fill(); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.moveTo(0, -0.95); ctx.bezierCurveTo(-0.15, -0.5, 0.15, -0.2, 0, 0.55);
  ctx.moveTo(-0.6, -0.35); ctx.bezierCurveTo(-0.3, -0.25, -0.45, 0.05, -0.2, 0.15);
  ctx.moveTo(0.55, -0.45); ctx.bezierCurveTo(0.3, -0.3, 0.5, 0, 0.25, 0.15); ctx.stroke();
  ctx.restore();
}
function skull(x, y, s, color, k = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * k, s * k);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, -0.15, 0.85, Math.PI * 0.85, Math.PI * 2.15); ctx.lineTo(0.55, 0.75); ctx.lineTo(-0.55, 0.75); ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.bg;
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 0.36, -0.1, 0.24, 0.27, 0, 0, TAU); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(0, 0.18); ctx.lineTo(-0.12, 0.42); ctx.lineTo(0.12, 0.42); ctx.closePath(); ctx.fill();
  ctx.fillRect(-0.32, 0.6, 0.1, 0.18); ctx.fillRect(-0.05, 0.6, 0.1, 0.18); ctx.fillRect(0.22, 0.6, 0.1, 0.18);
  ctx.restore();
}
function gear(x, y, r, teeth, ang, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * TAU, a1 = ((i + 1) / (teeth * 2)) * TAU, rr = i % 2 ? r : r * 1.2;
    ctx.arc(0, 0, rr, a0, a1);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = C.bg; ctx.beginPath(); ctx.arc(0, 0, r * 0.38, 0, TAU); ctx.fill();
  ctx.restore();
}
function hazard(y, h, alpha, shift) {   // a yellow-black hazard band
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.beginPath(); ctx.rect(0, y, W, h); ctx.clip();
  ctx.fillStyle = C.yel; ctx.fillRect(0, y, W, h);
  ctx.fillStyle = C.bg;
  for (let x = -h * 2 + (shift % (h * 1.2)); x < W + h; x += h * 1.2) { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + h * 0.6, y + h); ctx.lineTo(x + h * 1.2, y); ctx.lineTo(x + h * 0.6, y); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
function ecg(x0, x1, y, amp, t, rate, color, flat = 0) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = 24;
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 4) {
    const u = ((x - x0) / 160 + t * rate) % 1;
    let v = 0;
    if (u > 0.4 && u < 0.45) v = -0.25; else if (u >= 0.45 && u < 0.5) v = 1; else if (u >= 0.5 && u < 0.56) v = -0.55; else if (u > 0.7 && u < 0.8) v = 0.18 * Math.sin((u - 0.7) / 0.1 * Math.PI);
    const yy = y - v * amp * (1 - flat);
    x === x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
  }
  ctx.stroke(); ctx.restore();
}

// ---------------------------------------------------------------- shared scene pieces
// the big number of a combination: slams in, then shrinks into the corner badge
function comboTitle(t, t0, n, name, t1 = 1e9) {
  const k = pop(t, t0, 0.35) * (1 - prog(t, t1 - 0.2, t1)), go = E.inOut(prog(t, t0 + 1.1, t0 + 1.6));
  if (k <= 0) return;
  const x = lerp(540, 540, go), y = lerp(760, 250, go), s = lerp(1, 0.32, go);
  ctx.save(); ctx.translate(x, y); ctx.scale(k * s, k * s);
  ctx.fillStyle = C.yel; ctx.beginPath(); ctx.arc(0, 0, 300, 0, TAU); ctx.fill();
  text(FA(n), 0, 30, 460, C.bg, { w: 900 });
  ctx.restore();
  text(name, 540, lerp(1150, 465, go), lerp(110, 62, go), C.white, { k: pop(t, t0 + 0.12, 0.3) * (1 - prog(t, t1 - 0.2, t1)) });
}
// two drug cards with a plus between them (the first drug on the right)
function pair(t, t0, a, b, drawA, drawB, sub) {
  const ka = pop(t, t0, 0.35), kb = pop(t, t0 + 0.55, 0.35), kp = pop(t, t0 + 0.4, 0.3);
  const y = 830;
  for (const [k, x, name, draw, col] of [[ka, 785, a, drawA, C.red], [kb, 295, b, drawB, C.cyan]]) {
    if (k <= 0.001) continue;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = C.panel; rrect(-215, -250, 430, 500, 40); ctx.fill();
    ctx.lineWidth = 6; ctx.strokeStyle = col; ctx.stroke();
    ctx.fillStyle = col; rrect(-215, -250, 430, 22, [40, 40, 0, 0]); ctx.fill();
    draw(0, -55, t);
    ctx.restore();
    text(name, x, y + 160 * k, Math.min(58, 58 * 380 / measure(name, 58)), C.white, { k, w: 900 });
  }
  if (kp > 0) text('+', 540, y - 40, 170, C.yel, { k: kp, w: 900 });
  if (sub) label(sub, 540, 1180, 50, C.bg, C.yel, { k: pop(t, t0 + 0.9, 0.3) });
}
// a strip of icons that hops between states on the words
function warn(s, t, t0, y = 1300, color = C.red, size = 92) {
  const k = pop(t, t0, 0.3);
  if (k <= 0) return;
  label(s, 540, y, size, C.white, color, { k, rot: -0.02 });
}

// ---------------------------------------------------------------- scenes
function sceneHead(t) {
  const [a, b] = SC.head;
  // a head in profile with a throbbing ache
  const kH = pop(t, a + 0.05, 0.4);
  ctx.save(); ctx.translate(540, 820); ctx.scale(kH, kH);
  ctx.fillStyle = C.panel; ctx.strokeStyle = C.white; ctx.lineWidth = 12;
  ctx.beginPath(); ctx.arc(0, -40, 250, Math.PI * 0.75, Math.PI * 2.25); ctx.lineTo(150, 230); ctx.lineTo(-60, 230); ctx.lineTo(-90, 150);
  ctx.lineTo(-200, 130); ctx.lineTo(-215, 60); ctx.lineTo(-255, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
  const th = 0.5 + 0.5 * Math.sin(t * 14);
  ctx.strokeStyle = C.red; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.shadowColor = C.red; ctx.shadowBlur = 30 * th;
  for (const [x, y, s] of [[60, -120, 1], [150, -60, 0.8], [-30, -180, 0.7]]) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s * (0.9 + 0.2 * th), s * (0.9 + 0.2 * th));
    ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(-25, -30); ctx.lineTo(0, 0); ctx.lineTo(25, -30); ctx.lineTo(50, 0); ctx.stroke(); ctx.restore();
  }
  ctx.restore();
  text('سردرد؟', 540, 360, 190, C.white, { k: pop(t, ws(0), 0.3) });
  // "and right away a painkiller": a tablet flies in
  const kp = pop(t, ws(3, -0.1), 0.35);
  if (kp > 0) {
    const fly = E.out(prog(t, ws(3, -0.1), ws(4, 0.1)));
    tablet(lerp(1250, 760, fly), lerp(1500, 1180, fly), 95, C.yel, fly * 6, kp);
    label('مسکن', 760, 1350, 80, C.bg, C.yel, { k: pop(t, ws(4), 0.3) });
  }
}
function sceneBomb(t) {
  const [a] = SC.bomb;
  text('اما اگه', 540, 330, 110, C.grey, { k: pop(t, ws(6), 0.3) });
  label('داروی روانپزشکی', 540, 490, 100, C.white, C.red, { k: pop(t, ws(8), 0.32) });
  label('مصرف می‌کنی…', 540, 640, 64, C.bg, C.white, { k: pop(t, ws(10), 0.3) });
  // two pills slide together and become a bomb
  const m0 = ws(12), m1 = ws(16, -0.1), merge = E.inOut(prog(t, m0, m1));
  const kIn = pop(t, ws(6, 0.2), 0.4);
  const isBomb = t >= m1;
  if (!isBomb) {
    capsule(lerp(250, 470, merge), 1150, 300, 70, 0.5 + merge * 0.6, C.red, C.white, kIn);
    tablet(lerp(830, 610, merge), 1150, 95, C.yel, -merge * 2, kIn);
  } else {
    const k = pop(t, m1, 0.35), sh = bump(t, ws(17), 0.3);
    ctx.save(); ctx.translate(540 + 14 * Math.sin(t * 60) * sh, 1180); ctx.scale(k, k);
    ctx.fillStyle = '#1D1D24'; ctx.beginPath(); ctx.arc(0, 0, 230, 0, TAU); ctx.fill();
    ctx.lineWidth = 14; ctx.strokeStyle = C.red; ctx.stroke();
    ctx.fillStyle = '#1D1D24'; ctx.fillRect(-60, -275, 120, 70); ctx.strokeRect(-60, -275, 120, 70);
    // fuse
    ctx.strokeStyle = C.white; ctx.lineWidth = 12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -275); ctx.bezierCurveTo(40, -360, 140, -360, 170, -420); ctx.stroke();
    const r = rng(Math.floor(t * 24));
    for (let i = 0; i < 14; i++) { const an = r() * TAU, d = 20 + r() * 70; ctx.fillStyle = r() < 0.5 ? C.yel : C.orange; ctx.beginPath(); ctx.arc(170 + Math.cos(an) * d, -420 + Math.sin(an) * d, 6 + r() * 8, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = 0.5; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-90, -90, 55, 30, -0.7, 0, TAU); ctx.fill();
    ctx.restore();
    text('بمبِ مرگبار!', 540, 1560, 150, C.red, { k: pop(t, ws(16, 0.1), 0.35), stroke: 18 });
  }
}
function sceneC1(t) {
  const [a] = SC.c1;
  comboTitle(t, a, 1, 'ترکیب اول', ws(29, -0.2));
  const p0 = ws(21, -0.1), s0 = ws(29, -0.2);
  if (t < s0) {
    pair(t, p0, 'ضدافسردگی', 'ایبوپروفن',
      (x, y) => capsule(x, y, 240, 58, -0.5, C.red, C.white),
      (x, y) => tablet(x, y, 85, C.white, 0.4), 'مسکن ضدالتهاب');
    return;
  }
  // one thins the blood, the other inflames the stomach
  const kd = pop(t, ws(29, -0.1), 0.35);
  const thin = prog(t, ws(32), ws(33, 0.4));
  ctx.save(); ctx.globalAlpha = lerp(1, 0.55, thin);
  drop(780, 880, 120, C.red, kd);
  ctx.restore();
  const r = rng(3);
  for (let i = 0; i < 6; i++) { const ph = (t * 0.8 + r()) % 1; if (thin > 0) drop(700 + r() * 160, 1010 + ph * 100, 22, C.red, thin * (1 - ph)); }
  if (kd > 0) text('خون رقیق', 780, 1180, 70, C.white, { k: kd });
  const ks = pop(t, ws(35, -0.1), 0.35), hot = prog(t, ws(36), ws(38, 0.3));
  if (ks > 0) {
    ctx.save(); ctx.shadowColor = C.orange; ctx.shadowBlur = 70 * hot;
    ctx.translate(300, 880); ctx.scale(ks, ks); ctx.translate(-300, -880);
    stomach(300, 880, 150, hot > 0 ? `rgb(255,${Math.round(lerp(80, 38, hot))},${Math.round(lerp(80, 57, hot))})` : C.panel, C.white);
    ctx.restore();
    text('معده ملتهب', 300, 1180, 70, C.white, { k: ks });
  }
  if (t > ws(39, -0.15)) {
    hazard(1300, 64, pop(t, ws(39, -0.15), 0.3), t * 160);
    hazard(1560, 64, pop(t, ws(39, -0.15), 0.3), -t * 160);
    warn('خونریزی شدید گوارشی', t, ws(39), 1430, C.red, 76);
  }
}
function sceneC2(t) {
  const [a] = SC.c2;
  comboTitle(t, a, 2, 'ترکیب دوم', ws(51, -0.2));
  const p0 = ws(44, -0.1), s0 = ws(51, -0.2), st = ws(58, -0.15), hb = ws(64, -0.2);
  if (t < s0) {
    pair(t, p0, 'ضدافسردگی', 'ترامادول',
      (x, y) => capsule(x, y, 240, 58, -0.5, C.red, C.white),
      (x, y) => capsule(x, y, 240, 58, 0.5, C.cyan, C.white), 'مسکن مخدر');
    return;
  }
  if (t < hb) {
    // a synapse filling up with serotonin, then a storm
    const k = pop(t, s0, 0.35), fill = prog(t, ws(51), ws(57, 0.4));
    ctx.save(); ctx.translate(540, 880); ctx.scale(k, k);
    ctx.fillStyle = C.panel; ctx.strokeStyle = C.cyan; ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(-230, -420); ctx.lineTo(-230, -170); ctx.bezierCurveTo(-230, -40, 230, -40, 230, -170); ctx.lineTo(230, -420); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-230, 420); ctx.lineTo(-230, 170); ctx.bezierCurveTo(-230, 40, 230, 40, 230, 170); ctx.lineTo(230, 420); ctx.fill(); ctx.stroke();
    const r = rng(11), n = Math.floor(10 + fill * 130), storm = prog(t, st, st + 1.2);
    for (let i = 0; i < n; i++) {
      const bx = (r() - 0.5) * 420, by = (r() - 0.5) * 150 * (1 + fill * 2.2), ph = r() * TAU;
      const sx = Math.cos(t * 5 + ph) * 260 * storm * r(), sy = Math.sin(t * 5 + ph) * 330 * storm * r();
      ctx.fillStyle = i % 5 ? C.yel : C.orange; ctx.beginPath(); ctx.arc(bx + sx + Math.sin(t * 3 + ph) * 8, by + sy, 13, 0, TAU); ctx.fill();
    }
    ctx.restore();
    label('انباشت سروتونین', 540, 1430, 70, C.bg, C.yel, { k: pop(t, ws(51), 0.3) });
    if (t > st) {
      text('طوفانِ', 540, 330, 120, C.white, { k: pop(t, st, 0.3) });
      label('سندروم سروتونین', 540, 1600, 84, C.white, C.red, { k: pop(t, ws(61), 0.3), rot: -0.03 });
    }
    return;
  }
  // racing heart, ECG, then deadly
  const kh = pop(t, hb, 0.35), beat = 1 + 0.14 * Math.max(0, Math.sin(t * 22));
  heart(540, 860, 210, C.red, kh * beat);
  ecg(60, 1020, 1230, 120, t, 4.5, C.red);
  label('تپش قلب شدید', 540, 1430, 78, C.white, C.red, { k: pop(t, ws(66), 0.3) });
  if (t > ws(70, -0.1)) {
    skull(540, 860, 150, C.white, pop(t, ws(70, -0.1), 0.3));
    text('کشنده!', 540, 1620, 170, C.yel, { k: pop(t, ws(71), 0.3), stroke: 16 });
  }
}
function sceneC3(t) {
  const [a] = SC.c3;
  comboTitle(t, a, 3, 'ترکیب سوم', ws(79, -0.2));
  const p0 = ws(74, -0.1), s0 = ws(79, -0.2);
  if (t < s0) {
    pair(t, p0, 'خواب‌آور', 'مسکن قوی',
      (x, y) => tablet(x, y, 85, C.cyan, 0.3),
      (x, y) => capsule(x, y, 240, 58, 0.5, C.orange, C.white), null);
    return;
  }
  // the brain tells the lungs to slow down, the lungs stop
  const kb = pop(t, s0, 0.35);
  ctx.save(); ctx.translate(540, 700); ctx.scale(kb, kb); ctx.translate(-540, -700);
  brain(540, 700, 200, C.cyan, bump(t, ws(84), 0.6));
  ctx.restore();
  const slow = prog(t, ws(86), ws(95, 0.5)), stop = t > ws(95, 0.3);
  const br = stop ? 0 : Math.sin(t * lerp(5, 1.2, slow));
  const kl = pop(t, ws(79, 0.4), 0.35);
  if (kl > 0) {
    ctx.save(); ctx.translate(540, 1150); ctx.scale(kl, kl); ctx.translate(-540, -1150);
    lungs(540, 1150, 220, stop ? '#2A2A33' : C.panel, stop ? C.grey : C.white, br);
    ctx.restore();
  }
  // the signal going down
  if (t > ws(83) && t < ws(95)) {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 1.4 + i / 3) % 1;
      ctx.fillStyle = C.cyan; ctx.globalAlpha = 1 - ph;
      ctx.beginPath(); ctx.moveTo(540 - 40, 880 + ph * 120); ctx.lineTo(540 + 40, 880 + ph * 120); ctx.lineTo(540, 920 + ph * 120); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  label('تنفس: کند… کندتر', 540, 1480, 70, C.bg, C.cyan, { k: pop(t, ws(86), 0.3) });
  if (t > ws(90, -0.1)) text('اثر مضاعف', 540, 330, 110, C.white, { k: pop(t, ws(90, -0.1), 0.3) });
  if (t > ws(98, -0.1)) {
    ecg(60, 1020, 1640, 80, t, 1, C.grey, prog(t, ws(98), ws(99)));
    label('اوردوز خاموش', 540, 1480, 92, C.white, C.red, { k: pop(t, ws(99), 0.3) });
  }
}
function sceneC4(t) {
  const [a] = SC.c4;
  comboTitle(t, a, 4, 'ترکیب چهارم', ws(110, -0.2));
  const p0 = ws(104, -0.1), s0 = ws(110, -0.2);
  if (t < s0) {
    pair(t, p0, 'ضداضطراب', 'شل‌کننده‌ی عضلانی',
      (x, y) => tablet(x, y, 85, C.yel, 0.3),
      (x, y) => capsule(x, y, 240, 58, -0.5, C.cyan, C.white), null);
    return;
  }
  // the nervous system's signal bars fall to nothing, then power off
  const down = E.inOut(prog(t, ws(110), ws(119)));
  const bars = 7, k = pop(t, s0, 0.35);
  for (let i = 0; i < bars; i++) {
    const h = (180 + 360 * Math.abs(Math.sin(i * 1.7 + t * 3))) * (1 - down) * k + 18;
    const x = 540 + (i - (bars - 1) / 2) * 120;
    ctx.fillStyle = down > 0.8 ? C.grey : i % 2 ? C.cyan : C.white;
    rrect(x - 40, 1150 - h, 80, h, 16); ctx.fill();
  }
  label('سیستم عصبی', 540, 1260, 70, C.bg, C.cyan, { k: pop(t, ws(112), 0.3) });
  text('آرامش', 540, 350, 110, C.cyan, { k: pop(t, ws(117), 0.3), a: 1 - prog(t, ws(119), ws(119, 0.2)) });
  if (t > ws(119, -0.1)) {
    const kp = pop(t, ws(119, -0.1), 0.35);
    ctx.save(); ctx.translate(540, 700); ctx.scale(kp, kp);
    ctx.strokeStyle = C.red; ctx.lineWidth = 34; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, 170, -Math.PI * 0.32, Math.PI * 1.32); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -210); ctx.lineTo(0, -40); ctx.stroke();
    ctx.restore();
    text('ایست کامل', 540, 1460, 140, C.red, { k: pop(t, ws(119), 0.3), stroke: 16 });
  }
}
function sceneNone(t) {
  const [a] = SC.none;
  text('هیچ مسکنی', 540, 380, 120, C.white, { k: pop(t, ws(122), 0.3) });
  const k = pop(t, ws(124, -0.05), 0.35);
  text('۱۰۰٪', 540, 700, 330, C.cyan, { k });
  text('بی‌خطر', 540, 930, 120, C.cyan, { k: pop(t, ws(126), 0.3) });
  if (t > ws(127, -0.1)) {
    const kx = pop(t, ws(127, -0.1), 0.3);
    ctx.save(); ctx.translate(540, 780); ctx.scale(kx, kx); ctx.rotate(-0.08);
    ctx.strokeStyle = C.red; ctx.lineWidth = 40; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-330, -230); ctx.lineTo(330, 230); ctx.moveTo(330, -230); ctx.lineTo(-330, 230); ctx.stroke();
    ctx.restore();
    label('نیست!', 540, 1120, 96, C.white, C.red, { k: kx });
  }
  // a new drug can jam the vital machinery
  if (t > ws(128, -0.2)) {
    const kg = pop(t, ws(128, -0.2), 0.35), jam = t > ws(135) ? 1 : 0;
    const spin = jam ? ws(135) : t, sh = jam ? 6 * Math.sin(t * 70) * Math.exp(-(t - ws(135)) * 4) : 0;
    ctx.save(); ctx.translate(540 + sh, 1420); ctx.scale(kg, kg); ctx.translate(-540, -1420);
    gear(440, 1420, 120, 10, spin * 1.6, jam ? C.red : C.yel);
    gear(650, 1360, 80, 8, -spin * 2.4 + 0.2, jam ? C.red : C.white);
    gear(640, 1540, 60, 7, spin * 3.2, jam ? C.red : C.cyan);
    ctx.restore();
    label(jam ? 'فلج!' : 'داروی جدید', 540, 1660, 70, C.bg, jam ? C.red : C.yel, { k: pop(t, jam ? ws(135) : ws(129), 0.3) });
  }
}
function sceneAsk(t) {
  const [a] = SC.ask;
  const k = pop(t, a + 0.05, 0.4);
  ctx.save(); ctx.translate(540, 800); ctx.scale(k, k);
  ctx.fillStyle = C.cyan; ctx.beginPath(); ctx.arc(0, 0, 260, 0, TAU); ctx.fill();
  ctx.fillStyle = C.bg; rrect(-55, -170, 110, 340, 18); ctx.fill(); rrect(-170, -55, 340, 110, 18); ctx.fill();
  ctx.restore();
  text('همیشه', 540, 330, 110, C.white, { k: pop(t, ws(137), 0.3) });
  label('با داروساز مشورت کن', 540, 1200, 88, C.bg, C.cyan, { k: pop(t, ws(139), 0.3) });
}
function sceneCta(t) {
  const [a] = SC.cta;
  text('اینو بفرست برای کسی که', 540, 640, 76, C.white, { k: pop(t, a + 0.05, 0.3) });
  label('با هر سردردی مسکن می‌خوره', 540, 790, 76, C.white, C.red, { k: pop(t, a + 0.3, 0.3) });
  text('ذخیره کن تا یادت بمونه', 540, 990, 64, C.yel, { k: pop(t, a + 0.6, 0.3) });
  text('این ویدیو جای مشورت با پزشک یا داروساز نیست', 540, 1700, 38, C.grey, { w: 600, a: prog(t, a + 0.8, a + 1.1) });
}
const SCENES = [['head', sceneHead], ['bomb', sceneBomb], ['c1', sceneC1], ['c2', sceneC2], ['c3', sceneC3], ['c4', sceneC4], ['none', sceneNone], ['ask', sceneAsk], ['cta', sceneCta]];

// ---------------------------------------------------------------- captions: the phrase being said, the word in yellow
const CHUNKS = (() => {
  const out = []; let cur = [];
  WORDS.forEach((w, i) => {
    if (cur.length && (cur.length === 3 || cur.reduce((n, j) => n + WORDS[j][0].length, 0) + w[0].length > 20)) { out.push(cur); cur = []; }
    cur.push(i);
    if (/[.،:؟!]$/.test(w[0])) { out.push(cur); cur = []; }
  });
  if (cur.length) out.push(cur);
  return out;
})();
function captions(t) {
  if (t >= CUT) return;
  let ci = -1;
  for (let i = 0; i < CHUNKS.length; i++) if (t >= ws(CHUNKS[i][0], -0.05)) ci = i;
  if (ci < 0) return;
  const c = CHUNKS[ci], next = ci + 1 < CHUNKS.length ? ws(CHUNKS[ci + 1][0], -0.05) : CUT;
  if (t > Math.min(next, we(c[c.length - 1], 1.0))) return;
  const k = pop(t, ws(c[0], -0.05), 0.2);
  const words = c.map((i) => WORDS[i][0].replace(/[.،:]$/, ''));
  const size = 62, gap = 18;
  const widths = words.map((s) => measure(FA(s), size));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  const y = 1790;
  ctx.save(); ctx.translate(540, y); ctx.scale(k, k);
  ctx.fillStyle = 'rgba(0,0,0,.78)'; rrect(-total / 2 - 34, -58, total + 68, 116, 22); ctx.fill();
  let x = total / 2;                              // right to left
  words.forEach((s, j) => {
    const on = t >= ws(c[j], -0.04);
    const cur = on && (j + 1 >= c.length || t < ws(c[j + 1], -0.04));
    text(FA(s), x - widths[j] / 2, 4, size, cur ? C.yel : on ? C.white : '#6E6E78', { w: 900 });
    x -= widths[j] + gap;
  });
  ctx.restore();
}

// ---------------------------------------------------------------- frame
function background(t) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  // a slow drifting dot grid
  ctx.fillStyle = '#17171D';
  const off = (t * 14) % 60;
  for (let y = -60; y < H + 60; y += 60) for (let x = -60; x < W + 60; x += 60) { ctx.beginPath(); ctx.arc(x + off, y + off, 3, 0, TAU); ctx.fill(); }
  // the scene's colour wash
  const g = ctx.createRadialGradient(540, 860, 50, 540, 860, 1100);
  const danger = SLAMS.reduce((m, s) => Math.max(m, bump(t, s, 0.6)), 0);
  g.addColorStop(0, danger > 0 ? `rgba(255,38,57,${0.28 * danger})` : 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function hud(t) {
  // progress
  ctx.fillStyle = '#1E1E25'; ctx.fillRect(0, 0, W, 14);
  ctx.fillStyle = C.red; ctx.fillRect(W - W * clamp(t / DURATION), 0, W * clamp(t / DURATION), 14);
  // the four combinations, lit as they come
  if (t < SC.c1[0] || t >= SC.none[0]) return;
  const starts = [SC.c1[0], SC.c2[0], SC.c3[0], SC.c4[0]];
  for (let i = 0; i < 4; i++) {
    const x = 540 + (1.5 - i) * 86, on = t >= starts[i], curr = on && (i === 3 || t < starts[i + 1]);
    ctx.fillStyle = curr ? C.yel : on ? C.red : '#2A2A33';
    ctx.beginPath(); ctx.arc(x, 90, curr ? 30 : 24, 0, TAU); ctx.fill();
    text(FA(i + 1), x, 93, curr ? 34 : 28, curr || on ? C.bg : C.grey);
  }
}
function flash(t) {
  for (const s of SLAMS) { const k = bump(t, s, 0.12); if (k > 0) { ctx.fillStyle = `rgba(255,255,255,${0.35 * k})`; ctx.fillRect(0, 0, W, H); } }
}
function shake(t) {
  let s = 0; for (const x of SLAMS) s = Math.max(s, t >= x ? Math.exp(-(t - x) * 9) * (t - x < 0.5 ? 1 : 0) : 0);
  return [Math.sin(t * 90) * 16 * s, Math.cos(t * 77) * 12 * s];
}

function seek(t) {
  background(t);
  const [sx, sy] = shake(t);
  ctx.save(); ctx.translate(sx, sy);
  for (const [id, fn] of SCENES) {
    const [a, b] = SC[id];
    if (t < a - 0.01 || t >= b + 0.3) continue;
    // each scene leaves with a quick fade and drop
    const out = prog(t, b, b + 0.3);
    ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(0, out * 60);
    fn(t);
    ctx.restore();
  }
  ctx.restore();
  hud(t);
  captions(t);
  flash(t);
}
window.seek = seek;
window.DURATION = DURATION;
window.ready = document.fonts.load(FONT(900, 60)).then(() => document.fonts.load(FONT(600, 40))).then(() => { seek(0); return true; });
