// Printed minifig faces, drawn into the head's wrap-around texture every frame.
// The head's side is a cylinder: the canvas spans its full circumference, the face sits in the
// middle (u = 0.5 faces the camera). A face is a state object F, blended numerically by the film;
// the discrete shapes (eyes / mouth kind) switch, Lego-style, like swapping a printed head.
//
//   F = { eyes, mouth, open, lookX, lookY, brow, browY, talk, vis, blush, tear, sweat }
//   eyes:  open | happy | closed | wide | flat | spiral | heart | star | x | side
//   mouth: smile | grin | open | o | flat | wavy | frown | smirk | tongue | tiny

export const FACE_W = 2048, FACE_H = 420;
const TAU = Math.PI * 2;

export const SKIN = { claude: '#F2ECE0', sina: '#E9BF98' };
const INK = { claude: '#2A1F1A', sina: '#1E1612' };

function ellipse(c, x, y, rx, ry, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, TAU); }

function heart(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.9);
  c.bezierCurveTo(x - s * 1.6, y - s * 0.1, x - s * 0.9, y - s * 1.3, x, y - s * 0.45);
  c.bezierCurveTo(x + s * 0.9, y - s * 1.3, x + s * 1.6, y - s * 0.1, x, y + s * 0.9);
  c.closePath();
}
function star(c, x, y, r, rot = 0) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
}

// ---------------------------------------------------------------- eyes
function eye(c, who, side, x, y, F, t) {
  const ink = INK[who];
  const open = Math.max(0, Math.min(1.2, F.open ?? 1));
  const lx = (F.lookX || 0) * 9, ly = (F.lookY || 0) * 7;
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';
  const kind = open < 0.12 && (F.eyes === 'open' || F.eyes === 'wide' || F.eyes === 'side' || F.eyes === 'flat') ? 'closed' : F.eyes;
  const big = who === 'claude';
  switch (kind) {
    case 'happy': { // ^ ^
      c.strokeStyle = ink; c.lineWidth = big ? 18 : 13;
      c.beginPath(); c.arc(x, y + 18, big ? 34 : 26, Math.PI * 1.12, Math.PI * 1.88); c.stroke();
      break;
    }
    case 'closed': { // content closed lids (u)
      c.strokeStyle = ink; c.lineWidth = big ? 15 : 10;
      c.beginPath(); c.arc(x, y - 8, big ? 32 : 22, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
      break;
    }
    case 'spiral': {
      c.strokeStyle = ink; c.lineWidth = 6;
      c.beginPath();
      const rot = t * 9 * (side < 0 ? 1 : -1);
      c.lineWidth = 8;
      for (let i = 0; i <= 80; i++) {
        const a = rot + i * 0.28, r = 2 + i * 0.5;
        c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      }
      c.stroke();
      break;
    }
    case 'heart': {
      const s = 30 * (1 + 0.12 * Math.sin(t * 14));
      heart(c, x, y, s); c.fillStyle = '#E2324B'; c.fill();
      c.lineWidth = 4; c.strokeStyle = '#7A0F1E'; c.stroke();
      ellipse(c, x - s * 0.5, y - s * 0.35, s * 0.22, s * 0.15, -0.6); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill();
      break;
    }
    case 'star': {
      star(c, x, y, 40, t * 2); c.fillStyle = '#FFC93C'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#8A5A00'; c.stroke();
      break;
    }
    case 'x': {
      c.strokeStyle = ink; c.lineWidth = 12;
      c.beginPath(); c.moveTo(x - 24, y - 24); c.lineTo(x + 24, y + 24); c.moveTo(x + 24, y - 24); c.lineTo(x - 24, y + 24); c.stroke();
      break;
    }
    case 'wide': {
      ellipse(c, x, y, big ? 42 : 34, (big ? 48 : 36) * open); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 6; c.strokeStyle = ink; c.stroke();
      ellipse(c, x + lx * 0.8, y + ly * 0.8, big ? 13 : 11, (big ? 13 : 11) * open); c.fillStyle = ink; c.fill();
      break;
    }
    case 'flat': { // deadpan: half-closed lids
      if (big) {
        ellipse(c, x + lx * 0.3, y + 8, 26, 30); c.fillStyle = ink; c.fill();
        c.fillStyle = SKIN[who]; c.fillRect(x - 40, y - 50, 80, 50);
        c.strokeStyle = ink; c.lineWidth = 9; c.beginPath(); c.moveTo(x - 36, y + 1); c.lineTo(x + 36, y + 1); c.stroke();
      } else {
        sinaEye(c, x, y, { ...F, open: 0.45 }, side, lx * 0.3, ly);
      }
      break;
    }
    case 'side': // glance sideways
    case 'open':
    default: {
      const sx = kind === 'side' ? (F.lookX >= 0 ? 12 : -12) : lx;
      if (big) {
        const rx = 27, ry = 37 * open;
        ellipse(c, x + sx * 0.7, y + ly * 0.7, rx, ry); c.fillStyle = ink; c.fill();
        if (open > 0.35) {
          ellipse(c, x + sx * 0.7 - 8, y + ly * 0.7 - ry * 0.42, 9, 9 * Math.min(1, open)); c.fillStyle = '#fff'; c.fill();
          ellipse(c, x + sx * 0.7 + 9, y + ly * 0.7 + ry * 0.38, 4, 4); c.fill();
        }
      } else {
        sinaEye(c, x, y, F, side, sx, ly);
      }
    }
  }
  c.restore();
}

// Sina: almond eye, brown iris, heavy upper lid (from the reference photos: dark brown, slightly hooded)
function sinaEye(c, x, y, F, side, lx, ly) {
  const open = Math.max(0, Math.min(1.2, F.open ?? 1));
  const w = 36, h = 21 * open;
  c.save();
  c.beginPath();
  c.moveTo(x - w, y + 2);
  c.quadraticCurveTo(x - w * 0.2 * side, y - h * 1.35, x + w, y);
  c.quadraticCurveTo(x + w * 0.1 * side, y + h * 1.05, x - w, y + 2);
  c.closePath();
  c.fillStyle = '#FBF6EE'; c.fill();
  c.clip();
  ellipse(c, x + lx * 1.1, y + 1 + ly * 0.6, 16, 16); c.fillStyle = '#5A3418'; c.fill();
  ellipse(c, x + lx * 1.1, y + 1 + ly * 0.6, 8, 8); c.fillStyle = '#120B07'; c.fill();
  ellipse(c, x + lx * 1.1 - 5, y - 4 + ly * 0.6, 4, 4); c.fillStyle = '#fff'; c.fill();
  c.restore();
  // upper lid line, thick, and a soft lower lid
  c.strokeStyle = '#1A110C'; c.lineCap = 'round'; c.lineWidth = 8;
  c.beginPath(); c.moveTo(x - w - 3, y + 3); c.quadraticCurveTo(x - w * 0.2 * side, y - h * 1.35 - 1, x + w + 2, y - 1); c.stroke();
  c.lineWidth = 2.5; c.strokeStyle = 'rgba(120,70,40,.55)';
  c.beginPath(); c.moveTo(x - w * 0.7, y + h * 0.75 + 4); c.quadraticCurveTo(x, y + h * 1.0 + 7, x + w * 0.7, y + h * 0.7 + 4); c.stroke();
}

// ---------------------------------------------------------------- brows
function brow(c, who, side, x, y, F) {
  const ang = (F.brow || 0) * side;    // + = angry (inner end down)
  const lift = (F.browY || 0) * 18;
  const sina = who === 'sina';
  const len = sina ? 44 : 34;
  c.save();
  c.translate(x, y - lift);
  c.rotate(ang * 0.45);
  c.strokeStyle = sina ? '#16100C' : INK[who];
  c.lineCap = 'round';
  c.lineWidth = sina ? 16 : 12;
  c.beginPath();
  // inner end is toward the face centre (side * -1)
  const inner = -side * len, outer = side * len;
  c.moveTo(inner, sina ? 2 : 0);
  c.quadraticCurveTo(0, sina ? -9 : -8, outer, sina ? 4 : 2);
  c.stroke();
  if (sina) { // thick brow: second pass toward the inner end
    c.lineWidth = 20;
    c.beginPath(); c.moveTo(inner * 0.95, 3); c.quadraticCurveTo(inner * 0.4, -7, 0, -7); c.stroke();
  }
  c.restore();
}

// ---------------------------------------------------------------- mouth
function mouth(c, who, x, y, F, t) {
  const ink = INK[who];
  const talk = Math.max(0, Math.min(1, F.talk || 0));
  const vis = F.vis ?? 1;
  const sina = who === 'sina';
  const S = sina ? 1.0 : 1.35;
  c.save();
  c.translate(x, y); c.scale(S, S);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const inside = '#5B1A18', tongue = '#E06A6A';
  let kind = F.mouth;
  // talking opens whatever the resting mouth is
  if (talk > 0.08 && !['wavy', 'o', 'tongue'].includes(kind)) kind = kind === 'frown' ? 'talkFrown' : 'talk';
  const lineW = sina ? 7 : 9;
  const lipCol = sina ? '#9C4E45' : ink;
  switch (kind) {
    case 'smile': {
      c.strokeStyle = lipCol; c.lineWidth = lineW;
      c.beginPath(); c.arc(0, -34, 46, Math.PI * 0.22, Math.PI * 0.78); c.stroke();
      break;
    }
    case 'smirk': {
      c.strokeStyle = lipCol; c.lineWidth = lineW;
      c.beginPath(); c.moveTo(-30, 4); c.quadraticCurveTo(8, 10, 34, -10); c.stroke();
      break;
    }
    case 'flat': {
      c.strokeStyle = lipCol; c.lineWidth = lineW;
      c.beginPath(); c.moveTo(-26, 4); c.lineTo(26, 4); c.stroke();
      break;
    }
    case 'tiny': {
      c.strokeStyle = lipCol; c.lineWidth = lineW;
      c.beginPath(); c.arc(0, -8, 14, Math.PI * 0.25, Math.PI * 0.75); c.stroke();
      break;
    }
    case 'frown': {
      c.strokeStyle = lipCol; c.lineWidth = lineW;
      c.beginPath(); c.arc(0, 40, 38, Math.PI * 1.22, Math.PI * 1.78); c.stroke();
      break;
    }
    case 'wavy': {
      c.strokeStyle = lipCol; c.lineWidth = lineW - 1;
      c.beginPath();
      for (let i = 0; i <= 40; i++) {
        const px = -40 + i * 2, py = Math.sin(i * 0.62 + t * 22) * 6 + 4;
        c.lineTo(px, py);
      }
      c.stroke();
      break;
    }
    case 'o': {
      const r = 13 + talk * 6;
      ellipse(c, 0, 6, r, r * 1.2); c.fillStyle = inside; c.fill(); c.lineWidth = lineW - 2; c.strokeStyle = lipCol; c.stroke();
      break;
    }
    case 'grin':
    case 'open':
    case 'tongue':
    case 'talk':
    case 'talkFrown': {
      const grin = kind === 'grin', frownish = kind === 'talkFrown';
      const op = kind === 'talk' || kind === 'talkFrown' ? 6 + talk * 30 : grin ? 34 : 30;
      const w = (kind === 'talk' || kind === 'talkFrown' ? 30 + 10 * vis : grin ? 50 : 38);
      c.beginPath();
      if (frownish) {
        c.moveTo(-w, 10); c.quadraticCurveTo(0, -op * 0.8, w, 10); c.quadraticCurveTo(0, op * 0.4 + 6, -w, 10);
      } else {
        c.moveTo(-w, -4); c.quadraticCurveTo(0, 2, w, -4); c.quadraticCurveTo(w * 0.7, op * 1.25, 0, op * 1.25); c.quadraticCurveTo(-w * 0.7, op * 1.25, -w, -4);
      }
      c.closePath();
      c.fillStyle = inside; c.fill();
      c.save(); c.clip();
      if (!frownish) {
        c.fillStyle = '#fff'; c.fillRect(-w, -8, w * 2, 10 + (grin ? 4 : 0));   // top teeth
        ellipse(c, 0, op * 1.25 + 4, w * 0.55, op * 0.45 + 4); c.fillStyle = tongue; c.fill();
        if (kind === 'tongue') { ellipse(c, 6, op * 1.25 + 4, 18, 24); c.fill(); }
      }
      c.restore();
      c.lineWidth = lineW - 2; c.strokeStyle = lipCol; c.stroke();
      break;
    }
  }
  c.restore();
}

// ---------------------------------------------------------------- beard (Sina)
function beard(c, cx, cy) {
  // full, dark, trimmed beard; grey through the chin (from the photos)
  const g = c.createLinearGradient(0, cy + 40, 0, FACE_H);
  g.addColorStop(0, '#33261E'); g.addColorStop(1, '#221A15');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(cx - 360, cy - 150);                 // sideburn, left
  c.lineTo(cx - 318, cy - 150);
  c.bezierCurveTo(cx - 300, cy - 60, cx - 250, cy - 10, cx - 175, cy + 2);   // cheek line
  c.bezierCurveTo(cx - 110, cy + 10, cx - 80, cy + 4, cx - 60, cy + 10);      // to the mustache corner
  c.bezierCurveTo(cx - 30, cy + 20, cx + 30, cy + 20, cx + 60, cy + 10);
  c.bezierCurveTo(cx + 80, cy + 4, cx + 110, cy + 10, cx + 175, cy + 2);
  c.bezierCurveTo(cx + 250, cy - 10, cx + 300, cy - 60, cx + 318, cy - 150);
  c.lineTo(cx + 360, cy - 150);
  c.lineTo(cx + 340, FACE_H + 4); c.lineTo(cx - 340, FACE_H + 4);
  c.closePath(); c.fill();
  // grey patch on the chin
  const gr = c.createRadialGradient(cx, FACE_H + 10, 10, cx, FACE_H + 10, 120);
  gr.addColorStop(0, 'rgba(190,186,180,.85)'); gr.addColorStop(0.55, 'rgba(150,146,140,.45)'); gr.addColorStop(1, 'rgba(120,116,110,0)');
  c.fillStyle = gr; c.fillRect(cx - 140, cy + 40, 280, FACE_H);
  // stubble flecks along the cheek edge (seeded)
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  c.fillStyle = 'rgba(42,31,25,.55)';
  for (let i = 0; i < 140; i++) {
    const side = i % 2 ? 1 : -1, k = rnd();
    const px = cx + side * (175 + k * 140) + (rnd() - 0.5) * 10;
    const py = cy + 2 - k * k * 150 - rnd() * 14;
    c.fillRect(px, py, 3, 3);
  }
  // grey hairs sprinkled in the beard
  c.fillStyle = 'rgba(200,196,190,.35)';
  for (let i = 0; i < 90; i++) { const px = cx + (rnd() - 0.5) * 380, py = cy + 60 + rnd() * 110; c.fillRect(px, py, 2, 5); }
}
function mustache(c, cx, my) {
  c.fillStyle = '#211813';
  c.beginPath();
  c.moveTo(cx - 62, my + 10);
  c.bezierCurveTo(cx - 50, my - 22, cx - 12, my - 20, cx, my - 12);
  c.bezierCurveTo(cx + 12, my - 20, cx + 50, my - 22, cx + 62, my + 10);
  c.bezierCurveTo(cx + 40, my - 2, cx + 14, my - 2, cx, my + 1);
  c.bezierCurveTo(cx - 14, my - 2, cx - 40, my - 2, cx - 62, my + 10);
  c.fill();
}

// ---------------------------------------------------------------- face
export function drawFace(c, who, F, t) {
  const W = FACE_W, H = FACE_H, cx = W / 2;
  c.fillStyle = SKIN[who]; c.fillRect(0, 0, W, H);
  if (who === 'sina') {
    // subtle warm shading, cheeks
    const g = c.createRadialGradient(cx, H * 0.45, 40, cx, H * 0.45, 420);
    g.addColorStop(0, 'rgba(255,230,205,.35)'); g.addColorStop(1, 'rgba(160,100,70,.12)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    beard(c, cx, 262);
    // nose: two soft strokes
    c.strokeStyle = 'rgba(130,72,44,.8)'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - 4, 160); c.quadraticCurveTo(cx - 14, 210, cx - 26, 228); c.quadraticCurveTo(cx - 6, 242, cx + 18, 230); c.stroke();
    mustache(c, cx, 276);
    mouth(c, who, cx, 296, F, t);
    eye(c, who, -1, cx - 110, 150, F, t);
    eye(c, who, 1, cx + 110, 150, F, t);
    brow(c, who, -1, cx - 112, 92, F);
    brow(c, who, 1, cx + 112, 92, F);
  } else {
    c.save(); c.translate(cx, 200); c.scale(1.18, 1.12); c.translate(-cx, -200);
    eye(c, who, -1, cx - 118, 172, F, t);
    eye(c, who, 1, cx + 118, 172, F, t);
    brow(c, who, -1, cx - 120, 96, F);
    brow(c, who, 1, cx + 120, 96, F);
    mouth(c, who, cx, 285, F, t);
    c.restore();
  }
  // blush
  if (F.blush > 0.01) {
    c.save(); c.globalAlpha = Math.min(1, F.blush) * 0.75;
    for (const sd of [-1, 1]) {
      const g = c.createRadialGradient(cx + sd * 150, 228, 4, cx + sd * 150, 228, 52);
      g.addColorStop(0, '#FF6F7D'); g.addColorStop(1, 'rgba(255,111,125,0)');
      c.fillStyle = g; c.fillRect(cx + sd * 150 - 60, 170, 120, 120);
      c.strokeStyle = '#E8495C'; c.lineWidth = 4; c.lineCap = 'round';
      for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(cx + sd * 150 - 22 + k * 16, 240); c.lineTo(cx + sd * 150 - 30 + k * 16, 222); c.stroke(); }
    }
    c.restore();
  }
  // tears
  if (F.tear > 0.01) {
    c.save(); c.globalAlpha = Math.min(1, F.tear);
    const ex = who === 'sina' ? 92 : 86, ey = who === 'sina' ? 160 : 190;
    for (const sd of [-1, 1]) {
      const g = c.createLinearGradient(0, ey, 0, H);
      g.addColorStop(0, 'rgba(110,190,255,.95)'); g.addColorStop(1, 'rgba(110,190,255,.2)');
      c.fillStyle = g;
      const k = (t * 1.3 + (sd > 0 ? 0.4 : 0)) % 1;
      c.fillRect(cx + sd * ex - 7, ey, 14, (H - ey) * Math.min(1, F.tear * 1.4));
      ellipse(c, cx + sd * ex, ey + k * (H - ey), 9, 13); c.fillStyle = '#7CC6FF'; c.fill();
    }
    c.restore();
  }
}

// Torso prints ---------------------------------------------------------------
export function drawTorso(c, who, w, h) {
  if (who === 'sina') {
    // black rib-knit crew-neck sweater (the portrait)
    c.fillStyle = '#17171A'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,255,255,.06)'; c.lineWidth = 3;
    for (let x = 6; x < w; x += 11) { c.beginPath(); c.moveTo(x, 40); c.lineTo(x + (x - w / 2) * 0.04, h); c.stroke(); }
    // stitch texture
    c.fillStyle = 'rgba(255,255,255,.035)';
    let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 900; i++) c.fillRect(rnd() * w, rnd() * h, 4, 2);
    // collar: ribbed band, the neck shows above it
    c.fillStyle = SKIN.sina;
    c.beginPath(); c.ellipse(w / 2, -10, w * 0.17, 52, 0, 0, Math.PI); c.fill();
    c.strokeStyle = '#2A2A30'; c.lineWidth = 16;
    c.beginPath(); c.ellipse(w / 2, -10, w * 0.17 + 6, 58, 0, 0.05, Math.PI - 0.05); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.09)'; c.lineWidth = 2;
    for (let a = 0.15; a < Math.PI - 0.1; a += 0.09) {
      c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * (w * 0.17 - 2), -10 + Math.sin(a) * 50); c.lineTo(w / 2 + Math.cos(a) * (w * 0.17 + 14), -10 + Math.sin(a) * 66); c.stroke();
    }
  } else {
    // Claude: terracotta shirt, the spark printed in ivory
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#D97757'); g.addColorStop(1, '#C8623F');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = SKIN.claude;
    c.beginPath(); c.ellipse(w / 2, -10, w * 0.15, 40, 0, 0, Math.PI); c.fill();
    sparkPath(c, w / 2, h * 0.55, h * 0.26);
    c.fillStyle = '#F7F1E6'; c.fill();
  }
}

// The Claude spark: a hand-drawn starburst of rounded rays.
export const SPARK_RAYS = [
  [0, 1.0, 0.13], [0.53, 0.86, 0.12], [1.02, 0.97, 0.13], [1.57, 0.83, 0.12], [2.08, 1.0, 0.13], [2.6, 0.88, 0.12],
  [3.14, 0.97, 0.13], [3.66, 0.85, 0.12], [4.2, 1.0, 0.13], [4.71, 0.84, 0.12], [5.24, 0.95, 0.13], [5.76, 0.87, 0.12],
];
export function sparkPath(c, x, y, R) {
  c.beginPath();
  for (const [a, len, wid] of SPARK_RAYS) {
    const ex = x + Math.cos(a) * R * len, ey = y + Math.sin(a) * R * len;
    const nx = -Math.sin(a), ny = Math.cos(a), hw = R * wid * 0.5;
    c.moveTo(x + nx * hw * 0.6, y + ny * hw * 0.6);
    c.lineTo(ex + nx * hw, ey + ny * hw);
    c.arc(ex, ey, hw, a + Math.PI / 2, a - Math.PI / 2, true);
    c.lineTo(x - nx * hw * 0.6, y - ny * hw * 0.6);
    c.closePath();
  }
  c.moveTo(x + R * 0.2, y); c.arc(x, y, R * 0.2, 0, TAU);
}
