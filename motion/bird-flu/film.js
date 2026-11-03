// «آنفلوانزای پرندگان در شیر»: a clear line-icon explainer (navy, hexagons, teal lines, yellow highlights)
// timed on the voice-over's words, laid out clear of Instagram's Reels overlays.
// A pure function of time: window.seek(t) paints frame t.
import { WORDS } from './words.js';

const W = 1080, H = 1920;
export const CUT = 65.75, DURATION = CUT + 3.2;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');

// Instagram Reels overlays, measured on a phone (video pixels): the action column on the right from
// y 925 down, the repost bubble at x 70-310 / y 1390-1610, the caption from y 1660, the header to y 115.
const SAFE = { top: 165, bottom: 1380, right: 935, left: 50, colTop: 920 };
const CX = 540, LCX = (SAFE.left + SAFE.right) / 2;           // centre above / below the action column

const C = { bg0: '#06121D', bg1: '#0B2536', hex: 'rgba(80,190,220,.07)', teal: '#35D6C2', cyan: '#5FD9F2', red: '#FF5466', yel: '#FFC83A', white: '#F4FAFF', dim: '#7F99AA', panel: 'rgba(10,32,46,.88)', fill: '#0D2B3C', pink: '#FF9DB0' };
const FONT = (w, s) => `${w} ${s}px Vazir`;
const FA = (s) => String(s).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const ws = (i, o = 0) => WORDS[i][1] + o;
const we = (i, o = 0) => WORDS[i][2] + o;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const E = { out: (k) => 1 - (1 - k) ** 3, inOut: (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2), back: (k, s = 1.7) => 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2 };
const pop = (t, t0, d = 0.32) => (t < t0 ? 0 : E.back(prog(t, t0, t0 + d)));
const bump = (t, t0, d = 0.25) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * (t - t0) / d));
const TAU = Math.PI * 2;
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const SC = {
  hook: [0, ws(5, -0.1)], target: [ws(5, -0.1), ws(16, -0.2)], resp: [ws(16, -0.2), ws(32, -0.2)], nose: [ws(32, -0.2), ws(47, -0.2)],
  teat: [ws(47, -0.2), ws(58, -0.2)], why: [ws(58, -0.2), ws(64, -0.25)], attach: [ws(64, -0.25), ws(85, -0.2)], boom: [ws(85, -0.2), ws(101, -0.2)],
  milk: [ws(101, -0.2), ws(116, -0.2)], raw: [ws(116, -0.2), CUT], cta: [CUT, DURATION],
};
const CHAPTERS = [SC.hook[0], SC.resp[0], SC.nose[0], SC.teat[0], SC.why[0], SC.milk[0], CUT];
const HITS = [ws(2), ws(14), ws(30), ws(55), ws(87), ws(119)];

// ---------------------------------------------------------------- drawing
function text(s, x, y, size, color, o = {}) {
  const k = o.k ?? 1; if (k <= 0.001) return;
  ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.scale(k, k); ctx.globalAlpha *= o.a ?? 1;
  ctx.font = FONT(o.w ?? 900, size); ctx.direction = o.ltr ? 'ltr' : 'rtl'; ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'middle';
  if (o.outline) { ctx.lineJoin = 'round'; ctx.lineWidth = o.outline; ctx.strokeStyle = color; ctx.strokeText(s, 0, 0); }
  else { if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 30; } ctx.fillStyle = color; ctx.fillText(s, 0, 0); }
  ctx.restore();
}
function measure(s, size, w = 900) { ctx.font = FONT(w, size); ctx.direction = 'rtl'; return ctx.measureText(s).width; }
function rrect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function chip(s, x, y, size, fg, bg, o = {}) {                       // a highlight box like the reference's
  const k = o.k ?? 1; if (k <= 0.001) return;
  const pw = measure(s, size) + size * 0.8, ph = size * 1.45;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  if (o.line) { ctx.fillStyle = C.panel; rrect(-pw / 2, -ph / 2, pw, ph, 14); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = bg; ctx.stroke(); }
  else { ctx.fillStyle = bg; rrect(-pw / 2, -ph / 2, pw, ph, 8); ctx.fill(); }
  ctx.restore();
  text(s, x, y + size * 0.05, size, o.line ? bg : fg, { k });
}
function stroke(color, w) { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; }
// a chapter heading: a big outlined number and a title, like the reference
function heading(t, t0, n, title, sub, t1 = 1e9) {
  const k = pop(t, t0, 0.35) * (1 - prog(t, t1 - 0.25, t1)); if (k <= 0.001) return;
  ctx.save(); ctx.globalAlpha = Math.min(1, k);
  if (n) text(FA(n), 905, 330, 250, C.cyan, { outline: 6, k });
  text(title, n ? 760 : CX, 296, Math.min(86, 86 * (n ? 680 : 940) / measure(title, 86)), C.white, { align: n ? 'right' : 'center', k });
  if (sub) text(sub, n ? 760 : CX, 395, 52, C.teal, { align: n ? 'right' : 'center', w: 700, k });
  ctx.globalAlpha *= 0.6; stroke(C.cyan, 3); ctx.beginPath(); ctx.moveTo(lerp(CX, 70, k), 470); ctx.lineTo(lerp(CX, 1010, k), 470); ctx.stroke();
  ctx.restore();
}
// the influenza virus icon of the reference: a ring, a faceted core, knobbed spikes
function virus(x, y, r, color, ang = 0, k = 1) {
  if (k <= 0.001) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(k, k);
  stroke(color, Math.max(2, r * 0.07));
  ctx.fillStyle = 'rgba(13,30,44,.92)'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = i * TAU / 12; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); ctx.lineTo(Math.cos(a) * r * 1.38, Math.sin(a) * r * 1.38); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.45, Math.sin(a) * r * 1.45, r * 0.13, 0, TAU); ctx.fill();
  }
  ctx.lineWidth = Math.max(1.5, r * 0.05); ctx.beginPath();
  const P = [0, 1, 2, 3, 4].map((i) => [Math.cos(i * TAU / 5 - 0.3) * r * 0.66, Math.sin(i * TAU / 5 - 0.3) * r * 0.66]);
  P.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath();
  for (const [px, py] of P) { ctx.moveTo(px, py); ctx.lineTo(r * 0.08, -r * 0.05); }
  ctx.stroke(); ctx.restore();
}
// a dairy cow in profile, facing left, drawn as a line icon; sick turns the outline red, glow lights the udder
function cow(x, y, s, o = {}) {
  const col = o.color ?? C.teal, sick = o.sick ?? 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  stroke(col, 0.022); ctx.fillStyle = C.fill;
  // legs
  for (const lx of [-0.44, -0.28, 0.42, 0.58]) { rrect(lx - 0.055, 0.1, 0.11, 0.52, 0.04); ctx.fill(); ctx.stroke(); ctx.fillStyle = col; ctx.fillRect(lx - 0.055, 0.56, 0.11, 0.06); ctx.fillStyle = C.fill; }
  // tail
  ctx.beginPath(); ctx.moveTo(0.76, -0.3); ctx.bezierCurveTo(0.9, -0.2, 0.86, 0.05, 0.84, 0.26); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0.84, 0.3, 0.035, 0.07, 0, 0, TAU); ctx.fill(); ctx.fillStyle = C.fill;
  // body
  rrect(-0.6, -0.4, 1.38, 0.62, 0.24); ctx.fill(); ctx.stroke();
  // Holstein patches
  ctx.save(); rrect(-0.6, -0.4, 1.38, 0.62, 0.24); ctx.clip();
  ctx.fillStyle = sick ? `rgba(255,84,102,${0.25 + 0.35 * sick})` : 'rgba(53,214,194,.22)';
  for (const [px, py, rx, ry, a] of [[-0.15, -0.22, 0.2, 0.12, 0.3], [0.38, -0.15, 0.18, 0.15, -0.4], [0.08, 0.08, 0.14, 0.09, 0.2], [0.65, -0.3, 0.12, 0.1, 0]]) { ctx.beginPath(); ctx.ellipse(px, py, rx, ry, a, 0, TAU); ctx.fill(); }
  ctx.restore();
  // udder and teats
  const g = o.glow ?? 0;
  if (g > 0) { ctx.save(); ctx.shadowColor = C.red; ctx.shadowBlur = 0.25 * g * 200 / s; }
  ctx.fillStyle = g > 0 ? `rgba(255,84,102,${0.35 + 0.5 * g})` : 'rgba(255,157,176,.35)';
  stroke(g > 0 ? C.red : C.pink, 0.02);
  ctx.beginPath(); ctx.ellipse(0.3, 0.23, 0.17 * (1 + 0.35 * (o.swell ?? 0)), 0.1 * (1 + 0.35 * (o.swell ?? 0)), 0, 0, Math.PI); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const tx of [0.2, 0.27, 0.34, 0.41]) { ctx.beginPath(); ctx.moveTo(tx, 0.31 + 0.03 * (o.swell ?? 0)); ctx.lineTo(tx, 0.38 + 0.03 * (o.swell ?? 0)); ctx.stroke(); }
  if (g > 0) ctx.restore();
  stroke(col, 0.022); ctx.fillStyle = C.fill;
  // neck and head
  ctx.beginPath(); ctx.moveTo(-0.5, -0.36); ctx.lineTo(-0.78, -0.46); ctx.lineTo(-0.98, -0.2); ctx.lineTo(-0.98, -0.02); ctx.lineTo(-0.82, 0.02); ctx.lineTo(-0.55, 0.0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,157,176,.4)'; ctx.beginPath(); ctx.ellipse(-0.95, -0.07, 0.085, 0.08, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(-0.97, -0.08, 0.014, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(-0.82, -0.3, 0.022, 0, TAU); ctx.fill();
  ctx.fillStyle = C.fill; ctx.beginPath(); ctx.ellipse(-0.7, -0.48, 0.09, 0.04, -0.5, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-0.8, -0.45); ctx.quadraticCurveTo(-0.84, -0.56, -0.78, -0.6); ctx.stroke();
  // breath from the nose
  if (o.breath) { ctx.save(); stroke(C.cyan, 0.016); ctx.globalAlpha *= o.breath;
    for (let i = 0; i < 3; i++) { const ph = (o.bt * 0.8 + i / 3) % 1; ctx.globalAlpha = o.breath * (1 - ph); ctx.beginPath(); ctx.arc(-1.0 - ph * 0.3, -0.06, 0.05 + ph * 0.1, Math.PI * 0.6, Math.PI * 1.4); ctx.stroke(); } ctx.restore(); }
  ctx.restore();
}
function cowHead(x, y, r, color, k = 1) {   // the reference's cow-head icon
  if (k <= 0.001) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k * r, k * r); stroke(color, 0.07); ctx.fillStyle = C.fill;
  ctx.beginPath(); ctx.moveTo(-0.45, -0.45); ctx.quadraticCurveTo(-0.55, 0.4, -0.3, 0.6); ctx.lineTo(0.3, 0.6); ctx.quadraticCurveTo(0.55, 0.4, 0.45, -0.45); ctx.quadraticCurveTo(0, -0.65, -0.45, -0.45); ctx.fill(); ctx.stroke();
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 0.72, -0.32, 0.26, 0.1, sd * 0.3, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(sd * 0.38, -0.5); ctx.quadraticCurveTo(sd * 0.62, -0.7, sd * 0.55, -0.95); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(0, 0.42, 0.34, 0.2, 0, 0, TAU); ctx.stroke();
  ctx.fillStyle = color; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 0.22, -0.02, 0.07, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(sd * 0.13, 0.43, 0.05, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function bird(x, y, s, flap, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); stroke(color, 0.09);
  const f = Math.sin(flap) * 0.35;
  ctx.beginPath(); ctx.moveTo(-1, -0.2 - f); ctx.quadraticCurveTo(-0.5, -0.5 - f, 0, 0); ctx.quadraticCurveTo(0.5, -0.5 - f, 1, -0.2 - f); ctx.stroke();
  ctx.restore();
}
function barn(x, y, s, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); stroke(color, 0.035); ctx.fillStyle = C.fill;
  ctx.beginPath(); ctx.moveTo(-1, 0.7); ctx.lineTo(-1, -0.1); ctx.lineTo(-0.6, -0.55); ctx.lineTo(0, -0.85); ctx.lineTo(0.6, -0.55); ctx.lineTo(1, -0.1); ctx.lineTo(1, 0.7); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeRect(-0.4, 0.05, 0.8, 0.65); ctx.beginPath(); ctx.moveTo(-0.4, 0.05); ctx.lineTo(0.4, 0.7); ctx.moveTo(0.4, 0.05); ctx.lineTo(-0.4, 0.7); ctx.stroke();
  ctx.strokeRect(-0.18, -0.45, 0.36, 0.26);
  ctx.restore();
}
function lungs(x, y, s, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); stroke(color, 0.07); ctx.fillStyle = C.fill;
  for (const sd of [-1, 1]) { ctx.save(); ctx.scale(sd, 1); ctx.beginPath(); ctx.moveTo(0.18, -0.55); ctx.bezierCurveTo(0.6, -1.15, 1.05, -0.4, 1.05, 0.45); ctx.bezierCurveTo(1.05, 1.0, 0.6, 1.1, 0.3, 0.95); ctx.bezierCurveTo(0.15, 0.85, 0.15, 0.2, 0.18, -0.55); ctx.fill(); ctx.stroke(); ctx.restore(); }
  ctx.beginPath(); ctx.moveTo(0, -1.2); ctx.lineTo(0, -0.45); ctx.lineTo(-0.3, -0.2); ctx.moveTo(0, -0.45); ctx.lineTo(0.3, -0.2); ctx.stroke();
  ctx.restore();
}
function check(x, y, r, color, k = 1) {   // a shield with a tick
  if (k <= 0.001) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k * r, k * r); stroke(color, 0.12); ctx.fillStyle = C.fill;
  ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0.85, -0.65); ctx.lineTo(0.75, 0.3); ctx.quadraticCurveTo(0.5, 0.8, 0, 1.05); ctx.quadraticCurveTo(-0.5, 0.8, -0.75, 0.3); ctx.lineTo(-0.85, -0.65); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-0.38, 0.02); ctx.lineTo(-0.08, 0.32); ctx.lineTo(0.42, -0.25); ctx.stroke(); ctx.restore();
}
function cross(x, y, r, color, k = 1) { if (k <= 0.001) return; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); stroke(color, r * 0.22); ctx.beginPath(); ctx.moveTo(-r, -r); ctx.lineTo(r, r); ctx.moveTo(r, -r); ctx.lineTo(-r, r); ctx.stroke(); ctx.restore(); }
function arrow(x0, y0, x1, y1, color, k, dash) {   // a dashed path that draws itself
  if (k <= 0) return;
  ctx.save(); stroke(color, 7); if (dash) ctx.setLineDash([18, 14]);
  const x = lerp(x0, x1, k), y = lerp(y0, y1, k);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke(); ctx.setLineDash([]);
  const a = Math.atan2(y1 - y0, x1 - x0); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 22, y + Math.sin(a) * 22); ctx.lineTo(x + Math.cos(a + 2.4) * 22, y + Math.sin(a + 2.4) * 22); ctx.lineTo(x + Math.cos(a - 2.4) * 22, y + Math.sin(a - 2.4) * 22); ctx.fill();
  ctx.restore();
}
function bottle(x, y, s, color, fill = 0.75) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); stroke(color, 0.05);
  ctx.beginPath(); ctx.moveTo(-0.2, -1); ctx.lineTo(0.2, -1); ctx.lineTo(0.2, -0.7); ctx.lineTo(0.45, -0.45); ctx.lineTo(0.45, 0.95); ctx.lineTo(-0.45, 0.95); ctx.lineTo(-0.45, -0.45); ctx.lineTo(-0.2, -0.7); ctx.closePath();
  ctx.fillStyle = C.fill; ctx.fill(); ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(244,250,255,.9)'; ctx.fillRect(-0.5, 0.95 - 1.4 * fill, 1, 2); ctx.restore(); ctx.stroke();
  ctx.fillStyle = color; ctx.fillRect(-0.24, -1.12, 0.48, 0.14);
  ctx.restore();
}
function person(x, y, r, color, k = 1) {
  if (k <= 0.001) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k * r, k * r); stroke(color, 0.08); ctx.fillStyle = C.fill;
  ctx.beginPath(); ctx.arc(0, -0.45, 0.32, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-0.65, 0.75); ctx.quadraticCurveTo(-0.6, 0.05, 0, 0.02); ctx.quadraticCurveTo(0.6, 0.05, 0.65, 0.75); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
function ring(x, y, r, color, k = 1) { if (k <= 0.001) return; ctx.save(); ctx.globalAlpha *= k; stroke(color, 4); ctx.beginPath(); ctx.arc(x, y, r * (0.7 + 0.3 * k), 0, TAU); ctx.stroke(); ctx.setLineDash([10, 12]); ctx.beginPath(); ctx.arc(x, y, r * 1.18, 0, TAU); ctx.stroke(); ctx.restore(); }

// ---------------------------------------------------------------- scenes
const inSc = (t, id) => t >= SC[id][0] && t < SC[id][1] + 0.3;
const COW = { x: LCX + 20, y: 760, s: 330 };          // the cow, centred in the safe frame
const UD = { x: COW.x + 0.3 * COW.s, y: COW.y + 0.25 * COW.s };    // its udder
const NOSE = { x: COW.x - 0.98 * COW.s, y: COW.y - 0.07 * COW.s };
function sceneHook(t) {
  // birds fly to a farm, the herd turns red one by one
  const k = pop(t, 0, 0.35);
  barn(CX, 700, 230 * k, C.teal);
  for (let i = 0; i < 5; i++) {
    const p = E.out(prog(t, 0.05 + i * 0.12, 1.6 + i * 0.12));
    bird(lerp(-120 - i * 60, 300 + i * 120, p), lerp(250 + i * 45, 520 + (i % 2) * 50, p), 52, t * 14 + i, C.white);
  }
  virus(CX, 560 - 60 * E.out(prog(t, 1.0, 1.4)), 46, C.red, t * 0.8, pop(t, 0.9, 0.3));
  for (let i = 0; i < 5; i++) {
    const x = 160 + i * 190, red = t > ws(3) + i * 0.12;
    cowHead(x, 1060, 66, red ? C.red : C.teal, pop(t, 0.2 + i * 0.06));
  }
  text('آنفلوانزای پرندگان', CX, 290, 104, C.white, { k: pop(t, ws(0, -0.05)) });
  chip('رسید به گاوداری‌ها', LCX, 1185, 66, '#06121D', C.yel, { k: pop(t, ws(2)) });
}
function sceneTarget(t) {
  const [a] = SC.target, k = pop(t, a, 0.4);
  cow(COW.x, COW.y + 40, COW.s * k, {});
  text('چرا؟', CX, 300, 150, C.yel, { k: pop(t, ws(6)) });
  // lungs: crossed out; the udder: locked on
  const lx = COW.x - 0.35 * COW.s, ly = COW.y - 0.1 * COW.s + 40;
  if (t > ws(8, -0.2)) { lungs(lx, ly - 300, 60, C.cyan); chip('ریه', lx, ly - 175, 50, C.cyan, C.cyan, { k: pop(t, ws(8, -0.2)), line: true }); stroke(C.cyan, 4); ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(lx, ly - 145); ctx.lineTo(lx, ly - 30); ctx.stroke(); ctx.setLineDash([]); }
  if (t > ws(9, 0.1)) cross(lx, ly - 300, 70, C.red, pop(t, ws(9, 0.1)));
  if (t > ws(10, -0.1)) {
    const kk = pop(t, ws(10, -0.1)); ring(UD.x, UD.y + 40, 95, C.red, kk);
    chip('غده‌ی پستان', UD.x, UD.y + 210, 54, C.red, C.red, { k: kk, line: true });
  }
  if (t > ws(14)) chip('هدف ویروس', CX, 470, 54, '#06121D', C.red, { k: pop(t, ws(14)) });
}
function sceneResp(t) {
  const [a] = SC.resp;
  heading(t, a, 0, 'آنفلوانزا معمولاً', 'یک بیماری تنفسیه');
  const sick = t > ws(30, -0.05);
  cow(COW.x, COW.y + 40, COW.s, { breath: t < ws(25) ? 1 : 0, bt: t, sick: sick ? prog(t, ws(30), ws(31)) : 0, color: sick ? C.red : C.teal });
  // milking cups on the udder
  if (t > ws(28, -0.2)) {
    const k = pop(t, ws(28, -0.2));
    ctx.save(); ctx.globalAlpha = Math.min(1, k); stroke(C.white, 5);
    for (const tx of [0.2, 0.27, 0.34, 0.41]) { const x = COW.x + tx * COW.s, y = COW.y + 0.38 * COW.s + 40; ctx.fillStyle = C.fill; rrect(x - 10, y, 20, 42, 6); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y + 42); ctx.quadraticCurveTo(x, y + 90, UD.x + 120, y + 110); ctx.stroke(); }
    ctx.restore();
    chip('حین دوشیدن', UD.x + 40, UD.y + 250, 50, '#06121D', C.yel, { k });
  }
  chip(sick ? 'آلوده' : 'گاو شیری سالم', COW.x - 0.45 * COW.s, 560, 54, sick ? C.red : C.teal, sick ? C.red : C.teal, { k: sick ? pop(t, ws(30, -0.05)) : pop(t, ws(25, -0.1)), line: true });
  if (!sick && t > ws(25, -0.1)) check(COW.x + 0.1 * COW.s, 560, 40, C.teal, pop(t, ws(25)));
  if (sick) virus(COW.x + 0.1 * COW.s, 560, 34, C.red, t, pop(t, ws(30)));
}
function sceneNose(t) {
  const [a] = SC.nose;
  heading(t, a, 1, 'ورود از بینی', 'تکثیر محدود');
  cow(COW.x, COW.y - 40, COW.s * 0.82, {});
  const nx = COW.x - 0.98 * COW.s * 0.82, ny = COW.y - 40 - 0.07 * COW.s * 0.82;
  arrow(nx - 140, ny - 160, nx - 10, ny - 10, C.cyan, E.out(prog(t, ws(33), ws(36, 0.3))), true);
  virus(lerp(nx - 150, nx - 20, E.out(prog(t, ws(33), ws(36, 0.3)))), lerp(ny - 170, ny - 20, E.out(prog(t, ws(33), ws(36, 0.3)))), 26, C.red, t, pop(t, ws(33, -0.1)) * (1 - prog(t, ws(37), ws(37, 0.3))));
  // a small, flat growth chart
  const k = pop(t, ws(38, -0.1), 0.35);
  if (k > 0) {
    ctx.save(); ctx.globalAlpha = Math.min(1, k);
    ctx.fillStyle = C.panel; rrect(120, 950, 560, 210, 16); ctx.fill(); stroke('rgba(95,217,242,.4)', 3); ctx.stroke();
    stroke('rgba(244,250,255,.35)', 3); ctx.beginPath(); ctx.moveTo(160, 1130); ctx.lineTo(650, 1130); ctx.stroke();
    stroke(C.cyan, 7); ctx.beginPath();
    const d = prog(t, ws(38), ws(40, 0.4));
    for (let i = 0; i <= 100 * d; i++) { const x = 160 + i * 4.9, y = 1130 - 70 * (1 - Math.exp(-i / 22)); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore();
    text('تعداد ویروس', 640, 980, 34, C.dim, { align: 'right', w: 700, a: Math.min(1, k) });
  }
  if (t > ws(43, -0.1)) { check(810, 1010, 56, C.teal, pop(t, ws(43, -0.1))); chip('بدون علائم آشکار', 810, 1110, 40, C.teal, C.teal, { k: pop(t, ws(44)), line: true }); }
}
function sceneTeat(t) {
  const [a] = SC.teat;
  heading(t, a, 2, 'ورود از مجرای سرپستانک', 'شروع فاجعه');
  const z = E.inOut(prog(t, ws(51), ws(53, 0.4)));
  const s = lerp(COW.s * 0.92, COW.s * 1.25, z), cx = lerp(COW.x, COW.x + 0.1 * COW.s, z), cy = lerp(COW.y + 60, COW.y - 10, z);
  ctx.save(); ctx.beginPath(); ctx.rect(SAFE.left - 20, 490, 1020, 860); ctx.clip();
  const ux = cx + 0.3 * s, uy = cy + 0.25 * s;
  cow(cx, cy, s, { glow: prog(t, ws(55, -0.2), ws(55, 0.3)), sick: prog(t, ws(55), ws(56)), color: t > ws(55) ? C.red : C.teal });
  const kk = E.out(prog(t, ws(49), ws(52)));
  arrow(ux + 60, uy + 260, ux + 0.06 * s, uy + 0.14 * s, C.red, kk, true);
  virus(lerp(ux + 70, ux + 0.06 * s, kk), lerp(uy + 270, uy + 0.15 * s, kk), 26, C.red, t, pop(t, ws(48, -0.1)) * (1 - prog(t, ws(54), ws(54, 0.2))));
  ctx.restore();
  if (t > ws(55, -0.05)) { text('فاجعه!', LCX, 1170, 130, C.red, { k: pop(t, ws(55, -0.05)), glow: 'rgba(255,84,102,.8)' }); }
}
function sceneWhy(t) {
  const [a] = SC.why;
  heading(t, a, 0, 'چرا این بافت', 'این‌قدر آسیب‌پذیره؟');
  // the udder, opened: milk ducts branching to the teat
  const k = pop(t, a + 0.1, 0.4);
  ductTree(t, k, 0, 0);
}
// the udder in cross-section: a teat at the bottom, ducts branching up into milk glands (alveoli)
const GL = (() => { const out = []; const r = rng(31); for (const [x, y] of [[-260, -250], [-150, -330], [0, -360], [150, -330], [260, -250], [-320, -110], [320, -110], [-200, -150], [200, -150], [0, -220]]) out.push([x + (r() - 0.5) * 20, y]); return out; })();
function ductTree(t, k, infect, made) {
  if (k <= 0.001) return;
  const ox = LCX, oy = 880;
  ctx.save(); ctx.translate(ox, oy); ctx.scale(k * 0.88, k * 0.88);
  // the outline of the quarter
  stroke(infect > 0.5 ? C.red : C.pink, 6); ctx.fillStyle = 'rgba(255,157,176,.06)';
  ctx.beginPath(); ctx.moveTo(-400, -380); ctx.quadraticCurveTo(-430, 40, -120, 140); ctx.lineTo(-50, 300); ctx.lineTo(50, 300); ctx.lineTo(120, 140); ctx.quadraticCurveTo(430, 40, 400, -380); ctx.fill(); ctx.stroke();
  // ducts
  stroke(C.cyan, 8);
  for (const [x, y] of GL) { ctx.beginPath(); ctx.moveTo(0, 290); ctx.lineTo(0, 120); ctx.quadraticCurveTo(x * 0.3, 0, x, y); ctx.stroke(); }
  // glands: round sacs of cells
  for (const [i, [x, y]] of GL.entries()) {
    const hot = clamp(infect * 1.6 - i * 0.05);
    ctx.fillStyle = hot > 0 ? `rgba(255,84,102,${0.2 + 0.5 * hot})` : 'rgba(95,217,242,.16)';
    stroke(hot > 0.3 ? C.red : C.cyan, 5); ctx.beginPath(); ctx.arc(x, y, 44 * (1 + 0.25 * hot), 0, TAU); ctx.fill(); ctx.stroke();
    for (let j = 0; j < 6; j++) { const aa = j * TAU / 6; ctx.fillStyle = hot > 0.3 ? C.red : C.teal; ctx.beginPath(); ctx.arc(x + Math.cos(aa) * 30, y + Math.sin(aa) * 30, 7, 0, TAU); ctx.fill(); }
  }
  ctx.restore();
}
function sceneAttach(t) {
  const [a] = SC.attach;
  heading(t, a, 0, 'ویروس H5N1', 'به سلول‌های مجاری شیر می‌چسبه');
  const inf = prog(t, ws(73), ws(84));
  ductTree(t, 1, inf, 0);
  // particles travel up the duct and dock on the glands
  const ox = LCX, oy = 880, sc = 0.88;
  GL.forEach(([x, y], i) => {
    const t0 = ws(66) + i * 0.18, p = E.inOut(prog(t, t0, t0 + 1.6));
    if (t < t0) return;
    const px = ox + lerp(0, x, p) * sc, py = oy + lerp(290, y - 52, p) * sc;
    virus(px, py, 18, C.red, t * 2 + i, 1);
  });
  // the factory: copies pour out of every gland
  if (t > ws(80, -0.1)) {
    const r = rng(5), n = Math.floor(lerp(0, 90, prog(t, ws(80), ws(84, 0.5))));
    for (let i = 0; i < n; i++) {
      const [x, y] = GL[i % GL.length], b = ws(80) + (i / 90) * (ws(84, 0.5) - ws(80)), q = Math.min(1, (t - b) * 0.8), an = r() * TAU;
      virus(ox + (x + Math.cos(an) * (50 + 60 * q)) * sc, oy + (y + Math.sin(an) * (50 + 60 * q)) * sc, 11, C.red, t + i, Math.min(1, (t - b) * 4));
    }
    chip('کارخانه‌ی تولید ویروس', LCX, 1180, 48, '#06121D', C.yel, { k: pop(t, ws(80, -0.1)) });
    const cnt = Math.floor(10 ** lerp(0, 5, prog(t, ws(80), ws(84, 0.6)) ** 2));
    text('×' + FA(cnt.toLocaleString('en-US')), 930, 562, 60, C.yel, { ltr: true, align: 'right', k: pop(t, ws(80)) });
  }
}
function sceneBoom(t) {
  const [a] = SC.boom;
  heading(t, a, 0, 'تکثیر انفجاری', null);
  // the cow again, udder swelling red, milk yield falling
  const sw = E.out(prog(t, ws(91), ws(93, 0.4)));
  cow(COW.x, 700, COW.s * 0.82, { glow: prog(t, ws(87), ws(89)), swell: sw, sick: 1, color: C.red });
  const rows = [['التهاب بافت', ws(89), C.red, 1], ['ورم شدید پستان', ws(91), C.red, 1], ['تولید شیر', ws(95), C.cyan, -1]];
  rows.forEach(([name, t0, col, dir], i) => {
    const k = pop(t, t0 - 0.1, 0.3); if (k <= 0) return;
    const y = 1010 + i * 120, v = dir > 0 ? E.out(prog(t, t0, t0 + 0.9)) * 0.92 : 1 - E.out(prog(t, ws(96), ws(97, 0.6))) * 0.85;
    ctx.save(); ctx.globalAlpha = Math.min(1, k);
    ctx.fillStyle = C.panel; rrect(80, y - 50, 840, 100, 14); ctx.fill(); stroke('rgba(95,217,242,.25)', 2); ctx.stroke();
    ctx.fillStyle = 'rgba(244,250,255,.1)'; rrect(120, y - 12, 460, 26, 13); ctx.fill();
    ctx.fillStyle = col; rrect(120 + 460 * (1 - v), y - 12, 460 * v, 26, 13); ctx.fill();
    ctx.restore();
    text(name, 890, y, 46, C.white, { align: 'right', a: Math.min(1, k) });
    text(dir > 0 ? '▲' : '▼', 625, y + 2, 44, col, { a: Math.min(1, k) });
  });
}
function sceneMilk(t) {
  const [a] = SC.milk;
  heading(t, a, 0, 'ویروس‌های تازه', 'مستقیم می‌ریزن توی شیر');
  // udder above, a bucket below, particles dripping in
  const k = pop(t, a + 0.1, 0.4);
  cow(COW.x, 690, COW.s * 0.82 * k, { glow: 0.6, sick: 1, color: C.red });
  const bx = UD.x - 20, by = 1120, kb = pop(t, a + 0.3, 0.4);
  ctx.save(); ctx.translate(bx, by); ctx.scale(kb, kb); stroke(C.white, 6); ctx.fillStyle = C.fill;
  ctx.beginPath(); ctx.moveTo(-120, -80); ctx.lineTo(120, -80); ctx.lineTo(95, 110); ctx.lineTo(-95, 110); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(244,250,255,.92)'; ctx.beginPath(); ctx.ellipse(0, -62, 112, 18, 0, 0, TAU); ctx.fill();
  ctx.restore();
  const ux = COW.x + 0.3 * COW.s * 0.82, uy = 690 + 0.36 * COW.s * 0.82;
  for (let i = 0; i < 14; i++) {
    const t0 = ws(101) + i * 0.45; if (t < t0) continue;
    const p = ((t - t0) / 1.1) % 1, x = ux + (i % 4 - 1.5) * 22;
    virus(lerp(x, bx + (i % 5 - 2) * 30, p), lerp(uy, by - 70, p), 13, C.red, t + i, 1 - p * 0.3);
  }
  // particles floating in the milk
  const n = Math.floor(lerp(0, 9, prog(t, ws(105), ws(115))));
  for (let i = 0; i < n; i++) virus(bx + (i % 5 - 2) * 40, by - 62 + Math.sin(t * 2 + i) * 4, 9, C.red, t + i, 1);
  if (t > ws(111, -0.1)) chip('به مقدار انبوه', bx + 230, by - 30, 44, '#06121D', C.yel, { k: pop(t, ws(111, -0.1)) });
}
function sceneRaw(t) {
  const [a] = SC.raw;
  heading(t, a, 0, 'شیر خام', 'از گاوهای آلوده');
  // the chain: cow -> raw milk -> person, like the reference's transmission chain
  const y = 820, k1 = pop(t, ws(119)), k2 = pop(t, ws(121)), k3 = pop(t, ws(129, -0.1));
  ctx.save(); ctx.globalAlpha = Math.min(1, k1); ctx.beginPath(); ctx.arc(820, y, 120, 0, TAU); ctx.fillStyle = C.panel; ctx.fill(); stroke(C.red, 5); ctx.stroke(); ctx.restore();
  cowHead(820, y + 10, 72, C.red, k1);
  arrow(690, y, 620, y, C.red, prog(t, ws(120), ws(121)), true);
  ctx.save(); ctx.globalAlpha = Math.min(1, k2); ctx.beginPath(); ctx.arc(490, y, 120, 0, TAU); ctx.fillStyle = C.panel; ctx.fill(); stroke(C.red, 5); ctx.stroke(); ctx.restore();
  if (k2 > 0) { bottle(490, y + 5, 70 * k2, C.white); virus(530, y + 30, 16, C.red, t, k2); virus(455, y + 50, 12, C.red, -t, k2); }
  arrow(360, y, 290, y, C.red, prog(t, ws(128), ws(130)), true);
  ctx.save(); ctx.globalAlpha = Math.min(1, k3); ctx.beginPath(); ctx.arc(160, y, 120, 0, TAU); ctx.fillStyle = C.panel; ctx.fill(); stroke(C.yel, 5); ctx.stroke(); ctx.restore();
  person(160, y + 10, 90, C.yel, k3);
  text('گاو آلوده', 820, y + 175, 42, C.white, { k: k1 }); text('شیر خام', 490, y + 175, 42, C.white, { k: k2 }); text('انسان', 160, y + 175, 42, C.white, { k: k3 });
  if (t > ws(129, -0.1)) chip('یکی از پرخطرترین منابع انتقال', LCX, 1180, 50, '#06121D', C.yel, { k: pop(t, ws(129, -0.1)) });
}
function sceneCta(t) {
  const [a] = SC.cta;
  check(CX, 480, 120, C.teal, pop(t, a + 0.05, 0.4));
  chip('شیر خام نخور', CX, 730, 92, '#06121D', C.yel, { k: pop(t, a + 0.2) });
  text('فقط شیر پاستوریزه یا جوشیده', CX, 880, 64, C.white, { k: pop(t, a + 0.45) });
  text('اینو بفرست برای کسی که شیر محلی می‌خره', LCX, 1060, 54, C.teal, { k: pop(t, a + 0.75) });
  text('این ویدیو جای مشورت با پزشک یا دامپزشک نیست', LCX, 1180, 32, C.dim, { w: 600, a: prog(t, a + 0.9, a + 1.2) });
}
const SCENES = [['hook', sceneHook], ['target', sceneTarget], ['resp', sceneResp], ['nose', sceneNose], ['teat', sceneTeat], ['why', sceneWhy],
  ['attach', sceneAttach], ['boom', sceneBoom], ['milk', sceneMilk], ['raw', sceneRaw], ['cta', sceneCta]];

// ---------------------------------------------------------------- captions: two-line sentences, key terms in yellow boxes
const KEY = ['آنفلوانزای', 'پرندگان', 'غده', 'پستان', 'تنفسی', 'آلوده', 'بینی', 'محدود', 'سرپستانک', 'فاجعه', 'آسیب‌پذیر', 'H5N1', 'مجاری', 'کارخانه', 'انفجاری', 'التهاب', 'ورم', 'افت', 'درون', 'خام', 'پرخطرترین'];
const isKey = (s) => KEY.some((k) => s.includes(k));
const CHUNKS = (() => {
  const out = []; let cur = [];
  WORDS.forEach((w, i) => {
    if (cur.length && (cur.length >= 7 || cur.reduce((n, j) => n + WORDS[j][0].length + 1, 0) + w[0].length > 38)) { out.push(cur); cur = []; }
    cur.push(i); if (/[.،:؟!]$/.test(w[0])) { out.push(cur); cur = []; }
  });
  if (cur.length) out.push(cur); return out;
})();
function captions(t) {
  if (t >= CUT) return;
  let ci = -1; for (let i = 0; i < CHUNKS.length; i++) if (t >= ws(CHUNKS[i][0], -0.1)) ci = i;
  if (ci < 0) return;
  const c = CHUNKS[ci], next = ci + 1 < CHUNKS.length ? ws(CHUNKS[ci + 1][0], -0.1) : CUT;
  if (t > Math.min(next, we(c[c.length - 1], 1.2))) return;
  const size = 50, gap = 14, maxW = SAFE.right - SAFE.left - 70, isLat = (s) => /^[A-Za-z0-9]+$/.test(s);
  const words = c.map((i) => WORDS[i][0]);
  const wd = words.map((s) => (isLat(s) ? (ctx.font = FONT(900, size), ctx.measureText(s).width) : measure(FA(s), size)) + (isKey(s) ? 20 : 0));
  const lines = [[]]; let lw = 0;
  words.forEach((s, j) => { if (lw + wd[j] > maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; } lines[lines.length - 1].push(j); lw += wd[j] + gap; });
  const lh = 78, top = SAFE.bottom - lines.length * lh - 6, k = pop(t, ws(c[0], -0.1), 0.25);
  // panel with the reference's yellow bracket on the right
  const pw = Math.max(...lines.map((l) => l.reduce((n, j) => n + wd[j] + gap, -gap))) + 60, px = LCX;
  ctx.save(); ctx.globalAlpha = Math.min(1, k);
  ctx.fillStyle = 'rgba(5,16,26,.82)'; rrect(px - pw / 2, top - 8, pw, lines.length * lh + 16, 14); ctx.fill();
  stroke(C.yel, 5); ctx.beginPath(); ctx.moveTo(px + pw / 2 - 20, top - 8); ctx.lineTo(px + pw / 2, top - 8); ctx.lineTo(px + pw / 2, top + lines.length * lh + 8); ctx.lineTo(px + pw / 2 - 20, top + lines.length * lh + 8); ctx.stroke();
  lines.forEach((l, li) => {
    const tw = l.reduce((n, j) => n + wd[j] + gap, -gap); let x = px + tw / 2; const y = top + li * lh + lh / 2;
    for (const j of l) {
      const s = words[j], on = t >= ws(c[j], -0.04), key = isKey(s), cx = x - wd[j] / 2;
      if (key && on) { ctx.fillStyle = C.yel; rrect(x - wd[j], y - size * 0.72, wd[j], size * 1.42, 6); ctx.fill(); }
      text(isLat(s) ? s : FA(s), cx, y + 3, size, key && on ? '#06121D' : on ? C.white : 'rgba(244,250,255,.35)', { ltr: isLat(s) });
      x -= wd[j] + gap;
    }
  });
  ctx.restore();
}

// ---------------------------------------------------------------- background and frame
const HEX = (() => {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createRadialGradient(540, 820, 100, 540, 900, 1300); g.addColorStop(0, C.bg1); g.addColorStop(1, C.bg0);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = C.hex; x.lineWidth = 2; const r = 46, h = r * Math.sqrt(3);
  for (let row = -1; row < H / h + 1; row++) for (let col = -1; col < W / (r * 1.5) + 1; col++) {
    const cx = col * r * 1.5, cy = row * h + (col % 2 ? h / 2 : 0);
    x.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; x.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); } x.closePath(); x.stroke();
  }
  return c;
})();
const DOTS = (() => { const r = rng(3); return Array.from({ length: 70 }, () => [r() * W, r() * H, 1.5 + r() * 3, r()]); })();
function background(t) {
  ctx.drawImage(HEX, 0, 0);
  for (const [x, y, s, p] of DOTS) { ctx.fillStyle = `rgba(95,217,242,${0.25 + 0.35 * Math.sin(t * 1.5 + p * 9) ** 2})`; ctx.beginPath(); ctx.arc(x, (y - t * 12 * (0.5 + p) + H) % H, s, 0, TAU); ctx.fill(); }
}
function chapters(t) {   // segmented progress like the reference, just under Instagram's header
  const n = CHAPTERS.length - 1, gap = 12, x0 = 40, wSeg = (W - 80 - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const p = prog(t, CHAPTERS[i], CHAPTERS[i + 1]), x = W - x0 - (i + 1) * wSeg - i * gap;
    ctx.fillStyle = 'rgba(244,250,255,.18)'; rrect(x, 146, wSeg, 8, 4); ctx.fill();
    if (p > 0) { ctx.fillStyle = C.yel; rrect(x + wSeg * (1 - p), 146, wSeg * p, 8, 4); ctx.fill(); }
  }
}
function seek(t) {
  background(t);
  for (const [id, fn] of SCENES) {
    const [a, b] = SC[id]; if (t < a || t >= b + 0.3) continue;
    const out = prog(t, b, b + 0.3), inn = prog(t, a, a + 0.25);
    ctx.save(); ctx.globalAlpha = Math.min(1 - out, id === 'hook' ? 1 : inn); ctx.translate(0, out * -40 + (1 - inn) * 30);
    fn(t); ctx.restore();
  }
  let f = 0; for (const h of HITS) f = Math.max(f, bump(t, h, 0.3));
  if (f > 0) { ctx.fillStyle = `rgba(255,84,102,${0.12 * f})`; ctx.fillRect(0, 0, W, H); }
  chapters(t);
  captions(t);
  if (new URLSearchParams(location.search).has('safe')) {   // the measured Instagram overlays, for checking
    ctx.fillStyle = 'rgba(255,0,255,.25)'; ctx.fillRect(0, 0, W, 115); ctx.fillRect(960, 925, 120, 995); ctx.fillRect(70, 1390, 240, 220); ctx.fillRect(0, 1660, W, 260);
  }
}
window.seek = seek; window.DURATION = DURATION;
window.ready = document.fonts.load(FONT(900, 60)).then(() => document.fonts.load(FONT(700, 40))).then(() => { seek(0); return true; });
