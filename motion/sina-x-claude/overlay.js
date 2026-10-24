// 2-D layers over and under the 3-D set: backgrounds by mood, speech bubbles (RTL, word by word),
// tags, stamps and the little cartoon marks (question marks, steam, hearts, sparkles).
import * as M from './lib/motion.js';
import { sparkPath } from './sets/faces.js';

const { W, H, E, clamp, lerp, prog, mix } = M;
export const FA = 'Vazir';
const SAFE = { x: 64, y: 210, w: W - 128, h: H - 210 - 360 };
export const DIG = '۰۱۲۳۴۵۶۷۸۹';
export const faNum = (n) => String(n).replace(/\d/g, (d) => DIG[d]);

// ---------------------------------------------------------------- backgrounds
export const MOODS = {
  studio: { top: '#7FB2C8', bot: '#EFE0C2', rays: 0, dots: 1, vig: 0.25 },
  angry: { top: '#B8261C', bot: '#F2874A', rays: 1, dots: 0, vig: 0.4 },
  spot: { top: '#0E101B', bot: '#232842', rays: 0, dots: 0, vig: 0.8, beam: 1 },
  deadpan: { top: '#2A2C33', bot: '#3A3D46', rays: 0, dots: 0, vig: 0.5 },
  warm: { top: '#F2A64E', bot: '#FCE5BE', rays: 0.6, dots: 0.4, vig: 0.2 },
  golden: { top: '#E98A3E', bot: '#FFE1AE', rays: 0.4, dots: 0.3, vig: 0.25 },
  end: { top: '#F4EBDD', bot: '#E8D3B2', rays: 0, dots: 1, vig: 0.15 },
};
// weights of each mood at t from the MOOD track (crossfades)
export function moodWeights(track, t) {
  let w = { [track[0][1]]: 1 };
  for (let i = 1; i < track.length; i++) {
    const [ti, m, d = 0.3] = track[i];
    if (t < ti) break;
    const p = d <= 0 ? 1 : E.inOutSine(clamp((t - ti) / d));
    for (const k in w) w[k] *= 1 - p;
    w[m] = (w[m] || 0) + p;
  }
  return w;
}
export function moodValue(w, key) { let s = 0; for (const k in w) s += (MOODS[k][key] || 0) * w[k]; return s; }
function moodColor(w, key) {
  let r = 0, g = 0, b = 0;
  for (const k in w) { const n = parseInt(MOODS[k][key].slice(1), 16); r += (n >> 16) * w[k]; g += ((n >> 8) & 255) * w[k]; b += (n & 255) * w[k]; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

export function background(ctx, w, t, beamX = W / 2) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, moodColor(w, 'top')); g.addColorStop(1, moodColor(w, 'bot'));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // big soft studs: a Lego wall, out of focus
  const dots = moodValue(w, 'dots');
  if (dots > 0.01) {
    ctx.save(); ctx.globalAlpha = 0.09 * dots;
    for (let y = -40; y < H * 0.62; y += 150) for (let x = -40 + ((y / 150) % 2) * 75; x < W + 80; x += 150) {
      ctx.beginPath(); ctx.arc(x, y, 46, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill();
    }
    ctx.restore();
  }
  // rays (angry = fast and red, warm = slow and gold)
  const rays = moodValue(w, 'rays');
  if (rays > 0.01) {
    const angry = (w.angry || 0) > 0.5;
    ctx.save(); ctx.globalAlpha = (angry ? 0.18 : 0.22) * rays;
    ctx.translate(W / 2, H * 0.42); ctx.rotate(t * (angry ? 0.5 : 0.08));
    ctx.fillStyle = angry ? '#FFD6A8' : '#FFF6D8';
    for (let i = 0; i < 16; i++) { ctx.rotate(Math.PI / 8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(2400, -150); ctx.lineTo(2400, 150); ctx.closePath(); if (i % 2) ctx.fill(); }
    ctx.restore();
  }
  // the spotlight beam (Hiro, the whisper)
  const beam = moodValue(w, 'beam');
  if (beam > 0.01) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const bg = ctx.createLinearGradient(0, 0, 0, H * 0.75);
    bg.addColorStop(0, `rgba(255,236,190,${0.32 * beam})`); bg.addColorStop(1, `rgba(255,236,190,${0.04 * beam})`);
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(beamX - 70, -10); ctx.lineTo(beamX + 70, -10); ctx.lineTo(beamX + 420, H * 0.78); ctx.lineTo(beamX - 420, H * 0.78); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
export function vignette(ctx, w) {
  const v = moodValue(w, 'vig');
  const g = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.25, W / 2, H * 0.5, H * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${v})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- speech bubbles
const STYLE = {
  C: { fill: '#FFF8EE', stroke: '#C8623F', ink: '#2A1F1A', tab: '#C8623F', tabInk: '#FFF8EE', name: 'کلاد' },
  S: { fill: '#FFFFFF', stroke: '#16161A', ink: '#16161A', tab: '#D3121E', tabInk: '#FFFFFF', name: 'سینا' },
  whisper: { fill: 'rgba(24,28,52,.92)', stroke: '#9AA6D6', ink: '#E9ECFF', tab: '#5A6390', tabInk: '#E9ECFF', name: 'کلاد (آروم)' },
};
const measureCache = new Map();
function wordW(ctx, w, f) {
  const k = f + '|' + w;
  if (!measureCache.has(k)) { ctx.font = f; ctx.direction = 'rtl'; measureCache.set(k, ctx.measureText(w).width); }
  return measureCache.get(k);
}
// layout words into lines (RTL), returns { lines: [[{text, w, i}]], width, height }
function layoutWords(ctx, words, f, fs, maxW) {
  const sp = fs * 0.28, lines = [[]];
  let cur = 0;
  words.forEach((wd, i) => {
    const w = wordW(ctx, wd.text, f);
    if (cur > 0 && cur + sp + w > maxW) { lines.push([]); cur = 0; }
    lines[lines.length - 1].push({ ...wd, w, i });
    cur += (cur > 0 ? sp : 0) + w;
  });
  const widths = lines.map((L) => L.reduce((s, x) => s + x.w, 0) + sp * (L.length - 1));
  return { lines, widths, width: Math.max(...widths), sp };
}

// anchor: [x, y] of the speaker's mouth on screen; headTop: y of the top of the head
export function bubble(ctx, line, sp, t, anchor, headTop, tEnd) {
  const st = line.style === 'whisper' ? STYLE.whisper : STYLE[line.who];
  const whisper = line.style === 'whisper';
  const fs = whisper ? 50 : 58, f = `800 ${fs}px ${FA}`, lh = fs * 1.72;
  const L = layoutWords(ctx, sp.words, f, fs, 780);
  const padX = 46, padY = 34;
  const bw = L.width + padX * 2, bh = L.lines.length * lh + padY * 2 - fs * 0.35;
  // place above the head, clamped into the safe area
  let bx = clamp(anchor[0] - bw / 2, SAFE.x, SAFE.x + SAFE.w - bw);
  let by = Math.min(headTop - 110 - bh, H * 0.62 - bh);
  by = clamp(by, SAFE.y + 40, H - 520 - bh);
  // in / out
  const kin = E.outBack(prog(t, line.t - 0.04, line.t + 0.2), 2.2);
  const kout = 1 - E.inQuad(prog(t, tEnd - 0.14, tEnd));
  const k = Math.min(kin, kout);
  if (k <= 0.001) return;
  const cx = bx + bw / 2, cy = by + bh;
  ctx.save();
  ctx.translate(cx, cy); ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); ctx.translate(-cx, -cy);
  ctx.globalAlpha = clamp(k * 1.5);
  // tail toward the mouth
  const tx = clamp(anchor[0], bx + 70, bx + bw - 70);
  const ay = Math.max(anchor[1], by + bh + 30);
  const tipX = lerp(tx, anchor[0], 0.6), tipY = Math.min(ay - 20, by + bh + 120);
  ctx.lineJoin = 'round';
  const path = () => {
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 44);
  };
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.save(); ctx.translate(8, 12); path(); ctx.fill(); ctx.restore();
  ctx.fillStyle = st.fill; ctx.strokeStyle = st.stroke; ctx.lineWidth = 7;
  if (whisper) ctx.setLineDash([16, 12]);
  // tail
  ctx.beginPath(); ctx.moveTo(tx - 34, by + bh - 6); ctx.quadraticCurveTo(tx - 8, by + bh + 40, tipX, tipY); ctx.quadraticCurveTo(tx + 10, by + bh + 20, tx + 30, by + bh - 6); ctx.closePath();
  ctx.fill(); ctx.stroke();
  path(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = st.fill; ctx.fillRect(tx - 28, by + bh - 12, 56, 9);    // hide the seam
  ctx.setLineDash([]);
  // name tab, top-right (reading starts there)
  const tf = `800 30px ${FA}`;
  const tw = wordW(ctx, st.name, tf) + 36;
  ctx.fillStyle = st.tab; ctx.beginPath(); ctx.roundRect(bx + bw - tw - 34, by - 26, tw, 50, 25); ctx.fill();
  ctx.fillStyle = st.tabInk; ctx.font = tf; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(st.name, bx + bw - tw / 2 - 34, by + 1);
  // words, right to left, each appearing as it is said
  ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.font = f; ctx.direction = 'rtl';
  L.lines.forEach((ln, li) => {
    let x = bx + bw / 2 + L.widths[li] / 2;
    const y = by + padY + fs * 0.98 + li * lh;
    for (const wd of ln) {
      const a = E.outCubic(prog(t, wd.t - 0.02, wd.t + 0.1));
      if (a > 0) {
        ctx.save();
        ctx.globalAlpha *= a;
        const s = 0.85 + 0.15 * E.outBack(prog(t, wd.t - 0.02, wd.t + 0.16), 2);
        const wx = x - wd.w / 2;
        ctx.translate(wx, y - fs * 0.3); ctx.scale(s, s); ctx.translate(-wx, -(y - fs * 0.3));
        ctx.fillStyle = st.ink; ctx.fillText(wd.text, x, y);
        ctx.restore();
      }
      x -= wd.w + L.sp;
    }
  });
  ctx.restore();
}

// ---------------------------------------------------------------- tags, stamps, marks
export function tag(ctx, text, x, y, k, { bg = '#16161A', ink = '#fff', size = 40, icon = null, iconColor = '#FFC93C' } = {}) {
  if (k <= 0.001) return;
  const f = `800 ${size}px ${FA}`;
  const tw = wordW(ctx, text, f), iw = icon ? size * 1.1 : 0;
  const w = tw + iw + size * 1.2, h = size * 1.75;
  ctx.save();
  ctx.translate(x, y); ctx.scale(k, k); ctx.rotate((1 - Math.min(1, k)) * 0.3);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 5, -h / 2 + 7, w, h, h / 2); ctx.fill();
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill();
  ctx.fillStyle = ink; ctx.font = f; ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(text, w / 2 - size * 0.6, 3);
  if (icon) drawIcon(ctx, icon, -w / 2 + size * 0.6 + iw / 2 - size * 0.1, 0, size * 0.5, iconColor);
  ctx.restore();
}

export function drawIcon(ctx, kind, x, y, r, color) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  switch (kind) {
    case 'sunrise': ctx.beginPath(); ctx.arc(0, r * 0.35, r * 0.6, Math.PI, 0); ctx.fill(); ctx.lineWidth = r * 0.16; for (let i = 0; i < 5; i++) { const a = Math.PI + (i + 0.5) * Math.PI / 5; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.8, r * 0.35 + Math.sin(a) * r * 0.8); ctx.lineTo(Math.cos(a) * r * 1.1, r * 0.35 + Math.sin(a) * r * 1.1); ctx.stroke(); } break;
    case 'sun': ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = r * 0.16; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.72, Math.sin(a) * r * 0.72); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); } break;
    case 'sunset': ctx.beginPath(); ctx.arc(0, r * 0.2, r * 0.62, Math.PI, 0); ctx.fill(); ctx.lineWidth = r * 0.14; ctx.beginPath(); ctx.moveTo(-r, r * 0.35); ctx.lineTo(r, r * 0.35); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-r * 0.6, r * 0.7); ctx.lineTo(r * 0.6, r * 0.7); ctx.stroke(); break;
    case 'moon': ctx.beginPath(); ctx.arc(0, 0, r * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(r * 0.4, -r * 0.25, r * 0.7, 0, Math.PI * 2); ctx.fill(); break;
    case 'building': ctx.fillRect(-r * 0.8, -r * 0.2, r * 1.6, r); ctx.beginPath(); ctx.moveTo(-r, -r * 0.2); ctx.lineTo(0, -r); ctx.lineTo(r, -r * 0.2); ctx.closePath(); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; for (let i = -1; i <= 1; i++) ctx.fillRect(i * r * 0.5 - r * 0.1, 0, r * 0.2, r * 0.6); break;
    case 'paw': ctx.beginPath(); ctx.ellipse(0, r * 0.3, r * 0.45, r * 0.38, 0, 0, Math.PI * 2); ctx.fill(); for (const [px, py] of [[-0.55, -0.25], [-0.2, -0.6], [0.2, -0.6], [0.55, -0.25]]) { ctx.beginPath(); ctx.ellipse(px * r, py * r, r * 0.18, r * 0.22, 0, 0, Math.PI * 2); ctx.fill(); } break;
    case 'cross': ctx.fillRect(-r * 0.25, -r * 0.8, r * 0.5, r * 1.6); ctx.fillRect(-r * 0.8, -r * 0.25, r * 1.6, r * 0.5); break;
  }
  ctx.restore();
}

export function stamp(ctx, text, x, y, k, rot, { color = '#D3121E', size = 120, fill = null } = {}) {
  if (k <= 0.001) return;
  const f = `900 ${size}px ${FA}`;
  const tw = wordW(ctx, text, f), w = tw + size * 0.8, h = size * 1.55;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
  ctx.globalAlpha = clamp(2 - k);
  if (fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 24); ctx.fill(); }
  ctx.strokeStyle = color; ctx.lineWidth = size * 0.09;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 24); ctx.stroke();
  ctx.lineWidth = size * 0.03; ctx.beginPath(); ctx.roundRect(-w / 2 + 16, -h / 2 + 16, w - 32, h - 32, 14); ctx.stroke();
  ctx.fillStyle = color; ctx.font = f; ctx.direction = 'rtl'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, size * 0.08);
  ctx.restore();
}

export function bigText(ctx, text, x, y, size, color, k = 1, weight = 900, stroke = null, dir = 'rtl') {
  if (k <= 0.001) return;
  ctx.save();
  ctx.translate(x, y); ctx.scale(k, k);
  ctx.font = `${weight} ${size}px ${FA}`; ctx.direction = dir; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineWidth = size * 0.14; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(text, 0, 0); }
  ctx.fillStyle = color; ctx.fillText(text, 0, 0);
  ctx.restore();
}

export function sparkle(ctx, x, y, r, rot, color = '#FFF6C8') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rr = i % 2 ? r * 0.22 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
export function heart(ctx, x, y, s, color = '#E2324B') {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, s * 0.9);
  ctx.bezierCurveTo(-s * 1.6, -s * 0.1, -s * 0.9, -s * 1.3, 0, -s * 0.45);
  ctx.bezierCurveTo(s * 0.9, -s * 1.3, s * 1.6, -s * 0.1, 0, s * 0.9); ctx.fill(); ctx.restore();
}
export function angerMark(ctx, x, y, s, color = '#E5262E') {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = s * 0.22; ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    ctx.save(); ctx.rotate(i * Math.PI / 2);
    ctx.beginPath(); ctx.moveTo(s * 0.25, -s * 0.85); ctx.quadraticCurveTo(s * 0.3, -s * 0.3, s * 0.85, -s * 0.25); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
export function drop(ctx, x, y, s, rot = 0, color = '#7CC6FF') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color; ctx.strokeStyle = '#2C6EA8'; ctx.lineWidth = s * 0.12;
  ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * 0.8, 0, 0, s * 0.6); ctx.quadraticCurveTo(-s * 0.8, 0, 0, -s); ctx.fill(); ctx.stroke(); ctx.restore();
}
export function claudeSpark(ctx, x, y, r, color = '#D97757', rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); sparkPath(ctx, 0, 0, r); ctx.fillStyle = color; ctx.fill(); ctx.restore();
}
// hand-drawn line art: a mandala-ish set of strokes that draw on, held on twos with a boil
export function lineArt(ctx, cx, cy, r, p, t, color = '#5B3A1E') {
  if (p <= 0) return;
  const tq = Math.floor(t * 12) / 12;           // on twos (12 fps), the boil
  const jit = (i) => Math.sin(i * 12.9898 + Math.floor(tq * 12) * 78.233) * 2.2;
  ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 6;
  const strokes = [];
  for (let k = 0; k < 3; k++) strokes.push({ type: 'circle', rr: r * (0.62 + k * 0.2), d: k * 0.12 });
  for (let k = 0; k < 12; k++) strokes.push({ type: 'petal', a: (k / 12) * Math.PI * 2, d: 0.3 + k * 0.03 });
  for (const s of strokes) {
    const q = clamp((p - s.d) / 0.4);
    if (q <= 0) continue;
    ctx.beginPath();
    if (s.type === 'circle') {
      const n = 64, m = Math.floor(n * q);
      for (let i = 0; i <= m; i++) { const a = -Math.PI / 2 - (i / n) * Math.PI * 2, rr = s.rr + jit(i + s.rr); ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.92); }
    } else {
      const n = 24, m = Math.floor(n * q);
      for (let i = 0; i <= m; i++) {
        const u = i / n, rr = r * (0.82 + 0.38 * Math.sin(u * Math.PI)), a = s.a + (u - 0.5) * 0.35 * Math.sin(u * Math.PI * 2);
        ctx.lineTo(cx + Math.cos(a) * (r * 0.82 + (rr - r * 0.82) * 2.2 * u) + jit(i), cy + Math.sin(a) * (r * 0.82 + (rr - r * 0.82) * 2.2 * u) * 0.92 + jit(i + 3));
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

export { SAFE };
