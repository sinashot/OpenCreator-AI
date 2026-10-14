// «تیر مژگان» — romantic lyric reel, 1080x1920 @30fps.
// The whole film is a pure function of time: FILM.draw(t) paints frame t.
// One camera travels a single world: eye (right) -> heart (left, RTL travel) -> eye -> underline.
(() => {
  const W = 1080, H = 1920, FPS = 30;
  const AD = window.AUDIO_DATA;
  const DUR = AD.dur;

  const cvs = document.getElementById('c');
  const ctx = cvs.getContext('2d');
  const sub = document.createElement('canvas'); sub.width = W; sub.height = H;
  const sctx = sub.getContext('2d');

  // ---------------------------------------------------------------- math
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const TAU = Math.PI * 2;
  function cubicBezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = s => ((ax * s + bx) * s + cx) * s;
    const sy = s => ((ay * s + by) * s + cy) * s;
    const dx = s => (3 * ax * s + 2 * bx) * s + cx;
    return t => {
      if (t <= 0) return 0; if (t >= 1) return 1;
      let s = t;
      for (let i = 0; i < 10; i++) { const e = sx(s) - t; const d = dx(s); if (Math.abs(e) < 1e-7 || Math.abs(d) < 1e-7) break; s -= e / d; }
      return sy(clamp(s));
    };
  }
  const eOut = cubicBezier(.16, 1, .3, 1);    // entrances
  const eIn = cubicBezier(.7, 0, .84, 0);     // exits
  const eIO = cubicBezier(.65, 0, .35, 1);    // camera moves
  const eSoft = cubicBezier(.45, 0, .55, 1);  // drifts
  const eWhip = cubicBezier(.8, 0, .2, 1);    // whip pan
  function rng(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const env = t => AD.env[clamp(Math.round(t * FPS), 0, AD.env.length - 1)] || 0;
  const lastBefore = (list, t) => { let r = -1e9; for (const b of list) { if (b <= t) r = b; else break; } return r; };

  // ---------------------------------------------------------------- palette
  const GOLD = '#f6cf7e', GOLD_D = '#d99a3a', CREAM = '#fff4e2', ROSE = '#ff4f7b', ROSE_D = '#b3123f', WINE = '#2b0714';

  // ---------------------------------------------------------------- timeline (seconds, audio trimmed to start 1.60s into the recording)
  const E = { x: 0, y: -180 };          // intro eye
  const HC = { x: -1400, y: -300 };     // heart centre
  const HK = 17;                        // heart scale (width ~544)
  const HIT = [6.374, 7.779, 9.242];    // arrow impacts, on the beat under «...مژه»
  const KON = [13.769, 15.232, 16.66, 21.258, 22.825, 24.29]; // accented hits in the held phrases
  const MERGE = 24.29;
  const stackDim = t => eSoft(prog(t, 17.4, 18.0)) * (1 - eSoft(prog(t, 20.2, 20.5)));

  // camera keys: world point at screen centre + zoom
  const CAM = [
    { t: 0.00, x: 0, y: -20, z: 1.00 },
    { t: 5.55, x: 0, y: -30, z: 1.10, e: eSoft },
    { t: 5.86, x: 46, y: -40, z: 1.12, e: eSoft },
    { t: 6.40, x: -1400, y: -270, z: 1.04, e: eWhip },
    { t: 9.45, x: -1400, y: -270, z: 1.12, e: eSoft },
    { t: 10.40, x: -1400, y: 30, z: 0.92, e: eIO },
    { t: 17.05, x: -1400, y: 10, z: 0.88, e: eSoft },
    { t: 17.95, x: -1400, y: -300, z: 1.25, e: eIO },
    { t: 20.45, x: -1400, y: -300, z: 1.30, e: eSoft },
    { t: 24.25, x: -1400, y: -290, z: 1.00, e: eIO },
    { t: 27.30, x: -1400, y: -290, z: 1.06, e: eSoft },
    { t: 28.30, x: -1400, y: -250, z: 1.03, e: eIO },
    { t: 31.60, x: -1400, y: -250, z: 1.09, e: eSoft },
  ];
  function camBase(t) {
    if (t <= CAM[0].t) return { ...CAM[0] };
    for (let i = 0; i < CAM.length - 1; i++) {
      const a = CAM[i], b = CAM[i + 1];
      if (t < b.t) { const k = b.e(prog(t, a.t, b.t)); return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), z: lerp(a.z, b.z, k) }; }
    }
    return { ...CAM[CAM.length - 1] };
  }
  function camAt(t) {
    const c = camBase(t);
    // impact shake + small zoom punches on accents
    let sx = 0, sy = 0;
    for (const h of [...HIT, MERGE]) {
      const d = t - h; if (d < 0 || d > 0.6) continue;
      const a = (h === MERGE ? 10 : 16) * Math.exp(-d * 9);
      sx += a * Math.sin(d * 71); sy += a * Math.cos(d * 59);
    }
    for (const k of KON) { const d = t - k; if (d >= 0 && d < 1) c.z *= 1 + 0.012 * Math.exp(-d * 6); }
    c.sx = sx; c.sy = sy;
    return c;
  }
  function setWorld(c, cam, par = 1) {
    const z = 1 + (cam.z - 1) * par;
    c.setTransform(z, 0, 0, z, W / 2 - cam.x * par * z + cam.sx, H / 2 - cam.y * par * z + cam.sy);
  }

  // ---------------------------------------------------------------- sprites
  function radialSprite(r, stops) {
    const s = document.createElement('canvas'); s.width = s.height = r * 2;
    const g = s.getContext('2d'); const gr = g.createRadialGradient(r, r, 0, r, r, r);
    for (const [o, col] of stops) gr.addColorStop(o, col);
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return s;
  }
  const SPR = {
    bokehGold: radialSprite(64, [[0, 'rgba(255,214,140,0.95)'], [0.55, 'rgba(255,190,110,0.55)'], [0.8, 'rgba(255,170,90,0.18)'], [1, 'rgba(255,160,80,0)']]),
    bokehRose: radialSprite(64, [[0, 'rgba(255,120,150,0.95)'], [0.55, 'rgba(255,80,120,0.5)'], [0.8, 'rgba(255,60,100,0.15)'], [1, 'rgba(255,60,100,0)']]),
    glow: radialSprite(256, [[0, 'rgba(255,200,150,0.9)'], [0.25, 'rgba(255,120,140,0.45)'], [0.6, 'rgba(200,30,80,0.12)'], [1, 'rgba(160,0,60,0)']]),
    spark: radialSprite(16, [[0, 'rgba(255,250,230,1)'], [0.35, 'rgba(255,215,140,0.8)'], [1, 'rgba(255,190,90,0)']]),
  };
  const VIGNETTE = (() => {
    const s = document.createElement('canvas'); s.width = W; s.height = H; const g = s.getContext('2d');
    const gr = g.createRadialGradient(W / 2, H * 0.47, H * 0.22, W / 2, H * 0.5, H * 0.78);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.7, 'rgba(8,0,4,0.35)'); gr.addColorStop(1, 'rgba(5,0,3,0.85)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H); return s;
  })();

  // ---------------------------------------------------------------- background
  const BOKEH = (() => { const r = rng(7); return Array.from({ length: 34 }, () => ({ x: r() * (W + 300), y: r() * (H + 300), d: 0.15 + r() * 0.5, s: 14 + r() * 46, a: 0.05 + r() * 0.13, rose: r() < 0.45, ph: r() * TAU, sp: 6 + r() * 16 })); })();
  const DUST = (() => { const r = rng(11); return Array.from({ length: 80 }, () => ({ x: r() * W, y: r() * H, d: 0.3 + r() * 0.6, s: 3 + r() * 6, ph: r() * TAU, f: 0.6 + r() * 1.8, sp: 10 + r() * 30 })); })();

  function drawBackground(c, t, cam) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.fillStyle = '#0d0207'; c.fillRect(0, 0, W, H);
    const warm = prog(t, 5.8, 10) * (1 - 0.35 * prog(t, 24.5, 27.3)) + 0.25 * prog(t, 27.3, 29);
    const e = env(t);
    const g = c.createRadialGradient(W / 2, H * 0.43, 40, W / 2, H * 0.5, H * 0.72);
    g.addColorStop(0, `rgba(${Math.round(lerp(92, 128, warm))},${Math.round(lerp(14, 22, warm))},${Math.round(lerp(40, 52, warm))},1)`);
    g.addColorStop(0.45, WINE);
    g.addColorStop(1, '#0b0106');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // drifting light blobs (very low parallax)
    c.globalCompositeOperation = 'lighter';
    const blobs = [[0.25, 0.3, 700, 0.10 + 0.05 * e, 'r', 0.13], [0.8, 0.62, 800, 0.07 + 0.04 * e, 'g', 0.09], [0.45, 0.85, 650, 0.06, 'r', 0.11]];
    for (const [bx, by, br, ba, col, sp] of blobs) {
      const x = bx * W + Math.sin(t * sp + bx * 9) * 120 - cam.x * 0.06;
      const y = by * H + Math.cos(t * sp * 0.8 + by * 7) * 140 - cam.y * 0.06;
      c.globalAlpha = ba * (0.6 + 0.6 * warm);
      c.drawImage(col === 'r' ? SPR.bokehRose : SPR.bokehGold, x - br, y - br, br * 2, br * 2);
    }
    // bokeh discs with parallax wrap
    for (const b of BOKEH) {
      const ww = W + 300, hh = H + 300;
      let x = (b.x - cam.x * b.d * 0.7) % ww; if (x < 0) x += ww; x -= 150;
      let y = (b.y - cam.y * b.d * 0.7 - t * b.sp) % hh; if (y < 0) y += hh; y -= 150;
      const s = b.s * (0.8 + 0.4 * b.d) * (1 + (cam.z - 1) * b.d);
      c.globalAlpha = b.a * (0.7 + 0.5 * Math.sin(t * 0.7 + b.ph) * 0.5 + 0.6 * e) * (0.55 + 0.6 * warm);
      c.drawImage(b.rose ? SPR.bokehRose : SPR.bokehGold, x - s, y - s, s * 2, s * 2);
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }

  function drawDust(c, t, cam) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'lighter';
    for (const d of DUST) {
      let x = (d.x - cam.x * d.d) % W; if (x < 0) x += W;
      let y = (d.y - cam.y * d.d - t * d.sp) % H; if (y < 0) y += H;
      const tw = 0.5 + 0.5 * Math.sin(t * d.f * TAU * 0.5 + d.ph);
      c.globalAlpha = 0.15 + 0.55 * tw * tw;
      const s = d.s * (0.6 + 0.6 * tw);
      c.drawImage(SPR.spark, x - s, y - s, s * 2, s * 2);
    }
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }

  // ---------------------------------------------------------------- geometry helpers
  const qpt = (a, k, b, u) => { const m = 1 - u; return { x: m * m * a.x + 2 * m * u * k.x + u * u * b.x, y: m * m * a.y + 2 * m * u * k.y + u * u * b.y }; };
  const qtan = (a, k, b, u) => ({ x: 2 * (1 - u) * (k.x - a.x) + 2 * u * (b.x - k.x), y: 2 * (1 - u) * (k.y - a.y) + 2 * u * (b.y - k.y) });

  function eyeGeom(cx, cy, w, open, sag = 34, up = 150, lo = 96) {
    return {
      R: { x: cx + w / 2, y: cy }, L: { x: cx - w / 2, y: cy },
      cu: { x: cx + w * 0.06, y: cy + lerp(sag, -2 * up, open) },
      cl: { x: cx - w * 0.04, y: cy + lerp(sag, 2 * lo, open) },
    };
  }
  function eyePoints(g, n) {
    const pts = [];
    for (let i = 0; i < n / 2; i++) pts.push(qpt(g.R, g.cu, g.L, i / (n / 2)));
    for (let i = 0; i < n / 2; i++) pts.push(qpt(g.L, g.cl, g.R, i / (n / 2)));
    return pts;
  }
  function heartPoints(cx, cy, k, n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const tt = Math.PI / 2 - (i / n) * TAU;
      const s = Math.sin(tt);
      pts.push({ x: cx + k * 16 * s * s * s, y: cy - k * (13 * Math.cos(tt) - 5 * Math.cos(2 * tt) - 2 * Math.cos(3 * tt) - Math.cos(4 * tt)) + k * 2.5 });
    }
    return pts;
  }
  function polyPath(c, pts, close = true) {
    c.beginPath(); c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i].x, pts[i].y);
    if (close) c.closePath();
  }
  function glowStroke(c, width, color, glow, blur) {
    c.lineWidth = width; c.strokeStyle = color; c.lineJoin = 'round'; c.lineCap = 'round';
    c.shadowColor = glow; c.shadowBlur = blur; c.stroke(); c.shadowBlur = 0;
  }

  // ---------------------------------------------------------------- the eye
  const LASH_U = [0.12, 0.22, 0.32, 0.42, 0.52, 0.62, 0.72, 0.82, 0.9];
  // lashes that leave as arrows (index into LASH_U) and when
  const LASH_OFF = { 4: 5.54, 2: 6.98, 6: 8.42 };

  function drawEye(c, t, o) {
    // o: {cx,cy,w,open,lash(0..1),iris(0..1),look,alpha,skip:Set, lashLift}
    const g = eyeGeom(o.cx, o.cy, o.w, o.open, o.sag);
    c.save();
    c.globalAlpha = o.alpha ?? 1;
    // iris clipped to the eye
    if (o.open > 0.02 && o.iris > 0) {
      c.save();
      c.beginPath(); c.moveTo(g.R.x, g.R.y); c.quadraticCurveTo(g.cu.x, g.cu.y, g.L.x, g.L.y); c.quadraticCurveTo(g.cl.x, g.cl.y, g.R.x, g.R.y); c.closePath();
      c.fillStyle = 'rgba(40,4,16,0.65)'; c.fill();
      c.clip();
      const ix = o.cx + (o.look || 0), iy = o.cy - 6, ir = o.w * 0.15;
      const ig = c.createRadialGradient(ix - ir * 0.2, iy - ir * 0.25, ir * 0.1, ix, iy, ir);
      ig.addColorStop(0, '#2a0410'); ig.addColorStop(0.32, '#3d0716'); ig.addColorStop(0.38, ROSE_D); ig.addColorStop(0.75, ROSE); ig.addColorStop(0.93, GOLD); ig.addColorStop(1, 'rgba(246,207,126,0)');
      c.globalAlpha = (o.alpha ?? 1) * o.iris;
      c.fillStyle = ig; c.beginPath(); c.arc(ix, iy, ir, 0, TAU); c.fill();
      // radial fibres
      c.strokeStyle = 'rgba(255,215,160,0.35)'; c.lineWidth = 1.6;
      for (let i = 0; i < 28; i++) { const a = i / 28 * TAU + t * 0.05; c.beginPath(); c.moveTo(ix + Math.cos(a) * ir * 0.42, iy + Math.sin(a) * ir * 0.42); c.lineTo(ix + Math.cos(a) * ir * 0.86, iy + Math.sin(a) * ir * 0.86); c.stroke(); }
      c.fillStyle = 'rgba(255,248,235,0.95)'; c.beginPath(); c.arc(ix + ir * 0.32, iy - ir * 0.34, ir * 0.13, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,248,235,0.55)'; c.beginPath(); c.arc(ix - ir * 0.28, iy + ir * 0.3, ir * 0.06, 0, TAU); c.fill();
      c.restore();
    }
    // lids
    c.beginPath(); c.moveTo(g.R.x, g.R.y); c.quadraticCurveTo(g.cu.x, g.cu.y, g.L.x, g.L.y);
    glowStroke(c, 7, GOLD, 'rgba(255,180,90,0.9)', 26);
    if (o.open > 0.01) {
      c.beginPath(); c.moveTo(g.L.x, g.L.y); c.quadraticCurveTo(g.cl.x, g.cl.y, g.R.x, g.R.y);
      c.globalAlpha = (o.alpha ?? 1) * clamp(o.open * 3);
      glowStroke(c, 4.5, GOLD, 'rgba(255,180,90,0.8)', 18);
      c.globalAlpha = o.alpha ?? 1;
    }
    // lashes
    if (o.lash > 0) {
      for (let i = 0; i < LASH_U.length; i++) {
        if (o.skip && o.skip.has(i)) continue;
        const u = LASH_U[i];
        const grow = clamp((o.lash * 1.6) - (1 - u) * 0.6); // RTL stagger: right side first
        if (grow <= 0) continue;
        const p = qpt(g.R, g.cu, g.L, u), tg = qtan(g.R, g.cu, g.L, u);
        const len = Math.hypot(tg.x, tg.y) || 1;
        // normal pointing away from the eye (up when open, down when closed)
        let nx = -tg.y / len, ny = tg.x / len; // normal of the R->L lid that points up (screen y is down)
        const flip = lerp(-1, 1, clamp(o.open * 1.4));
        nx *= flip; ny *= flip;
        const L0 = (48 + 40 * Math.sin(u * Math.PI)) * eOut(grow);
        const tremble = 0.05 * Math.sin(t * 9 + i * 1.7) * env(t);
        const side = (0.5 - u) * 1.1 + tremble; // fan outward
        const dx = nx * Math.cos(side) - ny * Math.sin(side), dy = nx * Math.sin(side) + ny * Math.cos(side);
        const tip = { x: p.x + dx * L0, y: p.y + dy * L0 };
        const ctrl = { x: p.x + dx * L0 * 0.55 + (u < 0.5 ? 1 : -1) * 16 * flip, y: p.y + dy * L0 * 0.55 };
        c.beginPath(); c.moveTo(p.x, p.y); c.quadraticCurveTo(ctrl.x, ctrl.y, tip.x, tip.y);
        glowStroke(c, 5, GOLD, 'rgba(255,180,90,0.8)', 14);
      }
    }
    c.restore();
  }
  function lashBase(i, t) { // world-space base & outward direction of an intro-eye lash
    const g = eyeGeom(E.x, E.y, 700, 1);
    const u = LASH_U[i];
    const p = qpt(g.R, g.cu, g.L, u), tg = qtan(g.R, g.cu, g.L, u); const l = Math.hypot(tg.x, tg.y);
    const nx = -tg.y / l, ny = tg.x / l; const side = (0.5 - u) * 1.1;
    return { p, dx: nx * Math.cos(side) - ny * Math.sin(side), dy: nx * Math.sin(side) + ny * Math.cos(side) };
  }

  function introEye(t) {
    // 0–0.42 the lid line draws RTL; 0.42 eye opens on «با»
    let open = eOut(prog(t, 0.40, 1.05));
    // a blink between the two lines, and a softer one before the arrows
    const blink = (a, d) => { const p = prog(t, a, a + d); return p > 0 && p < 1 ? Math.sin(p * Math.PI) : 0; };
    open *= 1 - 0.92 * blink(2.86, 0.26);
    const lash = prog(t, 0.55, 1.6);
    const iris = eOut(prog(t, 0.6, 1.3));
    // glance left (where the heart waits) on «می‌زنی» and before the shot
    const look = -34 * (eSoft(prog(t, 1.75, 2.1)) * (1 - eSoft(prog(t, 2.6, 2.9))) + eSoft(prog(t, 4.6, 5.0)));
    const skip = new Set(); for (const k in LASH_OFF) if (t >= LASH_OFF[k]) skip.add(+k);
    return { cx: E.x, cy: E.y, w: 700, open, lash, iris, look, skip, sag: 30 };
  }
  function drawIntroLine(c, t) { // the lid drawn as a single stroke, right to left
    const p = eOut(prog(t, 0.0, 0.46));
    if (p <= 0 || t > 0.5) return;
    const g = eyeGeom(E.x, E.y, 700, 0, 30);
    const pts = []; for (let i = 0; i <= 60 * p; i++) pts.push(qpt(g.R, g.cu, g.L, i / 60));
    if (pts.length < 2) return;
    polyPath(c, pts, false); glowStroke(c, 7, GOLD, 'rgba(255,180,90,0.9)', 26);
    const h = pts[pts.length - 1];
    c.globalCompositeOperation = 'lighter'; c.drawImage(SPR.spark, h.x - 40, h.y - 40, 80, 80); c.globalCompositeOperation = 'source-over';
  }

  // ---------------------------------------------------------------- arrows
  // tip end positions are relative to the heart centre; shafts pass through the heart
  const ARROWS = [
    { lash: 4, draw: 5.54, fly: 5.86, hit: HIT[0], tip: { x: -330, y: 6 }, len: 600 },
    { lash: 2, draw: 6.98, fly: 7.30, hit: HIT[1], tip: { x: -318, y: 128 }, len: 600, ang: Math.PI + 0.24 },
    { lash: 6, draw: 8.42, fly: 8.78, hit: HIT[2], tip: { x: -296, y: -118 }, len: 600, ang: Math.PI - 0.30 },
  ];
  for (const a of ARROWS) {
    a.T = { x: HC.x + a.tip.x, y: HC.y + a.tip.y };
    const lb = lashBase(a.lash);
    a.L = { x: lb.p.x + lb.dx * 60, y: lb.p.y + lb.dy * 60 - 30 }; // where the lash lifts to
    if (a.ang === undefined) a.ang = Math.atan2(a.T.y - a.L.y, a.T.x - a.L.x);
    a.lashAng = Math.atan2(lb.dy, lb.dx); a.lb = lb;
  }
  function arrowState(a, t) {
    if (t < a.draw) return null;
    const out = { morph: 0, x: 0, y: 0, ang: 0, len: 0, trail: 0, alpha: 1 };
    if (t < a.fly) { // the lash lifts off, straightens and turns into an arrow
      const p = eOut(prog(t, a.draw, a.fly));
      const base = a.lb.p;
      out.morph = p;
      const lift = { x: lerp(base.x + a.lb.dx * 70, a.L.x, p), y: lerp(base.y + a.lb.dy * 70, a.L.y, p) };
      // pull back (anticipation) just before release
      const pull = Math.sin(prog(t, a.fly - 0.18, a.fly) * Math.PI) * 26;
      let da = a.ang - a.lashAng; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      out.ang = a.lashAng + da * p;
      out.x = lift.x - Math.cos(out.ang) * pull; out.y = lift.y - Math.sin(out.ang) * pull;
      out.len = lerp(80, a.len * 0.62, p);
      return out;
    }
    out.morph = 1;
    if (t < a.hit) { // flight along the final heading, accelerating into the target
      const p = prog(t, a.fly, a.hit);
      const k = p * p * (0.45 + 0.55 * p) * 0.35 + p * 0.65;
      const D = a.lash === 4 ? Math.hypot(a.T.x - a.L.x, a.T.y - a.L.y) : 1900;
      const S = a.lash === 4 ? a.L : { x: a.T.x - Math.cos(a.ang) * D, y: a.T.y - Math.sin(a.ang) * D };
      out.x = lerp(S.x, a.T.x, k); out.y = lerp(S.y, a.T.y, k);
      out.ang = a.ang; out.len = lerp(a.len * 0.62, a.len, eOut(clamp(p * 3)));
      out.trail = 1;
      out.v = D / (a.hit - a.fly);
      return out;
    }
    // embedded: wobble, then dissolve when the heart splits
    const d = t - a.hit;
    out.x = a.T.x; out.y = a.T.y; out.len = a.len;
    out.ang = a.ang + 0.05 * Math.sin(d * 52) * Math.exp(-d * 6);
    out.alpha = 1 - prog(t, 20.45, 20.95);
    if (out.alpha <= 0) return null;
    return out;
  }
  function drawArrow(c, s, t) {
    const { x, y, ang, len, morph } = s;
    c.save(); c.translate(x, y); c.rotate(ang); c.globalAlpha *= s.alpha;
    // the tip is at (0,0), the shaft runs back along -x
    if (s.trail) { // speed streak
      const sl = Math.min(900, s.v * 0.12);
      const gr = c.createLinearGradient(-len - sl, 0, -len * 0.3, 0);
      gr.addColorStop(0, 'rgba(255,190,110,0)'); gr.addColorStop(1, 'rgba(255,214,150,0.55)');
      c.strokeStyle = gr; c.lineWidth = 10; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-len - sl, 0); c.lineTo(-len * 0.3, 0); c.stroke();
    }
    // shaft (a lash bends straight as morph -> 1)
    const bend = (1 - morph) * len * 0.22;
    c.beginPath(); c.moveTo(-len, 0); c.quadraticCurveTo(-len * 0.5, -bend, 0, 0);
    glowStroke(c, lerp(5, 6, morph), GOLD, 'rgba(255,180,90,0.9)', 18);
    if (morph > 0.05) {
      const hs = 46 * eOut(morph);
      c.beginPath(); c.moveTo(hs * 0.25, 0); c.lineTo(-hs, -hs * 0.42); c.lineTo(-hs * 0.72, 0); c.lineTo(-hs, hs * 0.42); c.closePath();
      const hg = c.createLinearGradient(-hs, 0, hs * 0.25, 0); hg.addColorStop(0, ROSE_D); hg.addColorStop(1, '#ffd9a0');
      c.fillStyle = hg; c.shadowColor = 'rgba(255,120,140,0.8)'; c.shadowBlur = 20; c.fill(); c.shadowBlur = 0;
      c.lineWidth = 2.5; c.strokeStyle = GOLD; c.stroke();
      // fletching: three feather pairs
      const fs = eOut(morph);
      for (let k = 0; k < 3; k++) {
        const fx = -len + 18 + k * 26;
        for (const sgn of [-1, 1]) {
          c.beginPath(); c.moveTo(fx + 30, 0);
          c.quadraticCurveTo(fx + 8, sgn * 30 * fs, fx - 14, sgn * 34 * fs);
          c.quadraticCurveTo(fx + 2, sgn * 12 * fs, fx, 0); c.closePath();
          c.fillStyle = k === 1 ? 'rgba(255,214,150,0.9)' : 'rgba(255,90,130,0.92)'; c.fill();
        }
      }
    }
    c.restore();
  }

  // ---------------------------------------------------------------- heart
  const HEART_N = 240;
  function heartFillLevel(t) {
    let f = 0; const steps = [[HIT[0], 0.36], [HIT[1], 0.68], [HIT[2], 1.02]];
    for (const [h, v] of steps) { if (t >= h) { const p = eOut(prog(t, h, h + 0.9)); f = lerp(f, v, p); } }
    return f;
  }
  function heartPulse(t) {
    let s = 1;
    for (const h of HIT) { const d = t - h; if (d >= 0 && d < 1.2) s += 0.09 * Math.exp(-d * 7) * Math.cos(d * 22); }
    if (t > HIT[2] + 0.4) { // lub-dub on the beat
      const b = lastBefore(AD.beats, t), d = t - b;
      s += 0.035 * Math.exp(-d * 10) + (d > 0.17 ? 0.022 * Math.exp(-(d - 0.17) * 10) : 0);
    }
    for (const k of KON) { const d = t - k; if (d >= 0 && d < 1) s += 0.05 * Math.exp(-d * 8); }
    return s;
  }
  function drawHeart(c, t, o) {
    // o: {cx,cy,k,fill(0..1),outline,alpha,colA,colB,wave,dim}
    const pts = heartPoints(o.cx, o.cy, o.k, HEART_N);
    let top = 1e9, bot = -1e9; for (const p of pts) { top = Math.min(top, p.y); bot = Math.max(bot, p.y); }
    c.save(); c.globalAlpha = (o.alpha ?? 1);
    // soft halo
    if (o.halo) {
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = (o.alpha ?? 1) * o.halo;
      const r = o.k * 30; c.drawImage(SPR.glow, o.cx - r, o.cy - r, r * 2, r * 2);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = (o.alpha ?? 1);
    }
    polyPath(c, pts);
    c.save(); c.clip();
    c.fillStyle = `rgba(60,4,20,${0.45 * (o.dim ?? 1)})`; c.fillRect(o.cx - o.k * 20, top - 10, o.k * 40, bot - top + 20);
    if (o.fill > 0) {
      const lvl = bot - o.fill * (bot - top + 24);
      const A = o.wave ?? 6;
      c.beginPath(); c.moveTo(o.cx - o.k * 20, bot + 20);
      for (let x = -o.k * 20; x <= o.k * 20; x += 12) c.lineTo(o.cx + x, lvl + A * Math.sin(x * 0.018 + t * 3.4) + A * 0.5 * Math.sin(x * 0.041 - t * 2.1));
      c.lineTo(o.cx + o.k * 20, bot + 20); c.closePath();
      const fg = c.createLinearGradient(0, top, 0, bot);
      fg.addColorStop(0, o.colA || '#ff7a9a'); fg.addColorStop(1, o.colB || ROSE_D);
      c.globalAlpha = (o.alpha ?? 1) * (o.dim ?? 1) * 0.96; c.fillStyle = fg; c.fill();
      // sheen
      c.globalAlpha = (o.alpha ?? 1) * (o.dim ?? 1) * 0.22;
      c.fillStyle = '#fff2e0'; c.beginPath(); c.ellipse(o.cx + o.k * 6.5, top + o.k * 7, o.k * 3.2, o.k * 5.5, -0.5, 0, TAU); c.fill();
    }
    c.restore();
    c.globalAlpha = (o.alpha ?? 1) * (o.outline ?? 1);
    polyPath(c, pts); glowStroke(c, o.lw || 6, GOLD, 'rgba(255,180,90,0.9)', 24);
    c.restore();
  }

  // ---------------------------------------------------------------- arch (a Persian pointed arch that frames the heart scenes)
  const ARCH = (() => {
    const cx = HC.x, base = 690, spring = -260, apex = -840, hw = 410;
    const side = sgn => {
      const pts = [];
      for (let i = 0; i <= 40; i++) pts.push({ x: cx + sgn * hw, y: lerp(base, spring, i / 40) });
      const a = { x: cx + sgn * hw, y: spring }, b1 = { x: cx + sgn * hw, y: -600 }, b2 = { x: cx + sgn * 40, y: -640 }, d = { x: cx, y: apex };
      for (let i = 1; i <= 60; i++) { const u = i / 60, m = 1 - u; pts.push({ x: m * m * m * a.x + 3 * m * m * u * b1.x + 3 * m * u * u * b2.x + u * u * u * d.x, y: m * m * m * a.y + 3 * m * m * u * b1.y + 3 * m * u * u * b2.y + u * u * u * d.y }); }
      return pts;
    };
    const inner = (pts, s) => pts.map(p => ({ x: cx + (p.x - cx) * s, y: p.y + (1 - s) * 260 }));
    const R = side(1), L = side(-1);
    return { R, L, Ri: inner(R, 0.9), Li: inner(L, 0.9), apex: { x: cx, y: apex } };
  })();
  function partial(pts, p) { const n = Math.max(2, Math.round(pts.length * p)); return pts.slice(0, n); }
  function drawArch(c, t) {
    const p = eSoft(prog(t, 12.45, 16.66));
    if (p <= 0) return;
    c.save();
    for (const [pts, w, a] of [[ARCH.R, 5, 1], [ARCH.L, 5, 1], [ARCH.Ri, 2.5, 0.6], [ARCH.Li, 2.5, 0.6]]) {
      c.globalAlpha = a; polyPath(c, partial(pts, p), false); glowStroke(c, w, GOLD, 'rgba(255,180,90,0.7)', 16);
    }
    // drawing heads
    if (p < 1) {
      c.globalCompositeOperation = 'lighter';
      for (const pts of [ARCH.R, ARCH.L]) { const h = partial(pts, p).slice(-1)[0]; c.drawImage(SPR.spark, h.x - 34, h.y - 34, 68, 68); }
      c.globalCompositeOperation = 'source-over';
    }
    // finial pops when the two sides meet
    const f = prog(t, 16.6, 17.0);
    if (f > 0) {
      const s = eOut(f) * (1 + 0.25 * Math.exp(-(t - 16.66) * 6) * (t > 16.66));
      c.globalAlpha = 1; c.translate(ARCH.apex.x, ARCH.apex.y - 34 * s);
      c.beginPath(); c.moveTo(0, -30 * s); c.quadraticCurveTo(16 * s, 0, 0, 26 * s); c.quadraticCurveTo(-16 * s, 0, 0, -30 * s); c.closePath();
      c.fillStyle = GOLD; c.shadowColor = 'rgba(255,190,100,1)'; c.shadowBlur = 30; c.fill(); c.shadowBlur = 0;
    }
    c.restore();
  }

  // ---------------------------------------------------------------- particles
  function makeBurst(seed, t0, P, n, opt) {
    const r = rng(seed);
    return Array.from({ length: n }, () => {
      const a = (opt.dir ?? -Math.PI / 2) + (r() - 0.5) * (opt.spread ?? TAU);
      const v = (opt.v0 ?? 500) * (0.4 + r() * 0.9);
      return { t0, P, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: (opt.life ?? 1.6) * (0.6 + r() * 0.6), s: (opt.size ?? 20) * (0.6 + r() * 0.7), rot: r() * TAU, vr: (r() - 0.5) * 10, kind: opt.kind, col: r(), g: opt.g ?? 380 };
    });
  }
  const BURSTS = [];
  ARROWS.forEach((a, i) => {
    const sIn = (a.T.x - (HC.x + 200)) / Math.cos(a.ang); // where the shaft crosses the heart's right edge
    const entry = { x: HC.x + 200, y: a.T.y - Math.sin(a.ang) * sIn };
    BURSTS.push(...makeBurst(100 + i, a.hit, entry, 16, { kind: 'petal', dir: -0.4, spread: 2.4, v0: 620, size: 22 }));
    BURSTS.push(...makeBurst(200 + i, a.hit, entry, 26, { kind: 'spark', spread: TAU, v0: 700, life: 0.9, size: 14, g: 60 }));
  });
  KON.forEach((k, i) => {
    if (k === MERGE) return;
    BURSTS.push(...makeBurst(300 + i, k, { x: HC.x, y: HC.y - 60 }, 10, { kind: 'petal', dir: -Math.PI / 2, spread: 2.6, v0: 520, size: 20, life: 2.2 }));
  });
  BURSTS.push(...makeBurst(400, MERGE, { x: HC.x, y: HC.y }, 40, { kind: 'petal', spread: TAU, v0: 900, size: 26, life: 2.6, g: 260 }));
  BURSTS.push(...makeBurst(401, MERGE, { x: HC.x, y: HC.y }, 50, { kind: 'spark', spread: TAU, v0: 1100, life: 1.2, size: 16, g: 40 }));
  // arrows crumble into sparks when the heart splits
  ARROWS.forEach((a, i) => {
    for (let k = 0; k < 6; k++) {
      const u = k / 5; const P = { x: a.T.x - Math.cos(a.ang) * a.len * u, y: a.T.y - Math.sin(a.ang) * a.len * u };
      BURSTS.push(...makeBurst(500 + i * 10 + k, 20.5 + u * 0.15, P, 5, { kind: 'spark', spread: TAU, v0: 220, life: 1.1, size: 12, g: -60 }));
    }
  });
  BURSTS.push(...makeBurst(600, 29.44, { x: HC.x, y: HC.y + 160 }, 22, { kind: 'petal', dir: -Math.PI / 2, spread: 1.6, v0: 1000, size: 24, life: 2.4, g: 520 }));
  const PETAL_COLS = ['#ff4f7b', '#ff7d9b', '#d81b52', '#ffb3c4', '#c2134a'];
  function drawPetal(c, x, y, s, rot, flip, col, a) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(1, flip); c.globalAlpha *= a;
    c.beginPath(); c.moveTo(0, -s); c.bezierCurveTo(s * 0.95, -s * 0.55, s * 0.6, s * 0.7, 0, s); c.bezierCurveTo(-s * 0.6, s * 0.7, -s * 0.95, -s * 0.55, 0, -s); c.closePath();
    c.fillStyle = col; c.fill();
    c.globalAlpha *= 0.35; c.fillStyle = '#ffe3ea'; c.beginPath(); c.ellipse(-s * 0.18, -s * 0.2, s * 0.18, s * 0.5, 0.3, 0, TAU); c.fill();
    c.restore();
  }
  function drawBursts(c, t) {
    for (const b of BURSTS) {
      const d = t - b.t0; if (d < 0 || d > b.life) continue;
      const k = 2.4, f = (1 - Math.exp(-k * d)) / k;
      const x = b.P.x + b.vx * f, y = b.P.y + b.vy * f + 0.5 * b.g * d * d;
      const a = 1 - d / b.life;
      if (b.kind === 'petal') drawPetal(c, x, y, b.s, b.rot + b.vr * d, Math.cos(d * 6 + b.rot), PETAL_COLS[Math.floor(b.col * PETAL_COLS.length)], a * a);
      else { c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; const s = b.s * (0.5 + a); c.drawImage(SPR.spark, x - s, y - s, s * 2, s * 2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    }
  }
  const RAIN = (() => { const r = rng(21); return Array.from({ length: 46 }, (_, i) => ({ x: r() * W, born: 9.0 + (i % 23) * 0.95 + r() * 0.8 + (i >= 23 ? 0.45 : 0), sp: 150 + r() * 160, sway: 30 + r() * 60, sf: 0.6 + r() * 0.9, s: 13 + r() * 16, rot: r() * TAU, vr: (r() - 0.5) * 2.4, col: r(), d: 0.2 + r() * 0.5 })); })();
  function drawRain(c, t, cam) {
    c.setTransform(1, 0, 0, 1, 0, 0);
    const span = H + 160;
    for (const p of RAIN) {
      if (t < p.born) continue;
      const d = t - p.born;
      const y = -80 + (d * p.sp) % span;
      let x = (p.x + Math.sin(d * p.sf * 2) * p.sway - cam.x * p.d * 0.15) % (W + 80); if (x < 0) x += W + 80; x -= 40;
      const s = p.s * (1 + (cam.z - 1) * p.d);
      drawPetal(c, x, y, s, p.rot + d * p.vr, Math.cos(d * 2.2 + p.rot), PETAL_COLS[Math.floor(p.col * PETAL_COLS.length)], 0.85 * clamp(d * 2));
    }
  }
  function drawRings(c, t) {
    const list = [...HIT, ...KON, 28.78];
    for (const r0 of list) {
      const d = t - r0; if (d < 0 || d > 1.4) continue;
      const P = r0 === 28.78 ? { x: HC.x, y: HC.y + 160 } : { x: HC.x, y: HC.y };
      const r = (r0 === 28.78 ? 30 : 200) + eOut(d / 1.4) * (r0 === 28.78 ? 260 : 520);
      c.globalAlpha = Math.pow(1 - d / 1.4, 2) * 0.7;
      c.beginPath(); c.arc(P.x, P.y, r, 0, TAU); glowStroke(c, 3, GOLD, 'rgba(255,180,90,0.8)', 14);
      c.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------------- lyrics (word timings from the vocal)
  const FONT = 'NQB';
  const ZW = '‌';
  const LINES = [
    { id: 'L1', cx: E.x, cy: 268, size: 108, words: [['با', 0.38], ['تیر', 0.56], ['مژگان', 0.98], ['می' + ZW + 'زنی', 1.80]], exit: 2.80, style: 'cream' },
    { id: 'L2', cx: E.x, cy: 280, size: 118, words: [['با', 3.26], ['تیر', 3.46], ['مژگان', 3.84], ['می' + ZW + 'زنی', 4.66]], exit: 6.5, style: 'rose', hold: [3.84, 4.54] },
    { id: 'L3', cx: HC.x, cy: 420, size: 158, words: [['غم', 10.50], ['عشق', 10.74], ['تو', 11.92]], exit: 17.02, style: 'cream', hold: [10.74, 11.90] },
    { id: 'L4a', cx: HC.x, cy: -655, size: 172, words: [['غم', 18.02]], exit: 20.45, style: 'cream' },
    { id: 'L4b', cx: HC.x, cy: -330, size: 214, words: [['عشق', 18.26]], exit: 20.52, style: 'gold', hold: [18.26, 19.02] },
    { id: 'L4c', cx: HC.x, cy: 15, size: 180, words: [['تو', 19.50]], exit: 20.59, style: 'cream' },
    { id: 'L5', cx: HC.x, cy: -385, size: 190, words: [['برای', 27.35], ['تو', 27.97]], exit: 99, style: 'cream' },
  ];
  function layoutLines() {
    for (const L of LINES) {
      ctx.font = `${L.size}px ${FONT}`; ctx.direction = 'rtl';
      const space = ctx.measureText(' ').width * 1.15;
      const ws = L.words.map(([s, t0]) => { const m = ctx.measureText(s); return { s, t0, w: m.width, asc: m.actualBoundingBoxAscent, desc: m.actualBoundingBoxDescent }; });
      const total = ws.reduce((a, w) => a + w.w, 0) + space * (ws.length - 1);
      const asc = Math.max(...ws.map(w => w.asc)), desc = Math.max(...ws.map(w => w.desc));
      const base = L.cy + (asc - desc) / 2;
      let xr = L.cx + total / 2;
      ws.forEach((w, i) => { w.xr = xr; w.cx = xr - w.w / 2; w.base = base; w.i = i; xr -= w.w + space; });
      L.ws = ws; L.asc = asc; L.desc = desc;
    }
  }
  function drawLyrics(c, t, cam) {
    for (const L of LINES) {
      for (const w of L.ws) {
        const pin = prog(t, w.t0 - 0.07, w.t0 + 0.5);
        if (pin <= 0) continue;
        const exT = L.exit + w.i * 0.04;
        const pout = prog(t, exT, exT + 0.34);
        if (pout >= 1) continue;
        const a = eOut(pin), e = eIn(pout);
        const alpha = a * (1 - e);
        const dy = (1 - a) * L.size * 0.32 - e * L.size * 0.3;
        const blur = (1 - a) * 12 + e * 10;
        const sc = lerp(1.07, 1, a) * (1 + 0.04 * e);
        // held notes swell the glow
        let glow = 0.5;
        if (L.hold && w.t0 >= L.hold[0] - 0.01 && w.t0 <= L.hold[0] + 0.01) glow += 0.6 * Math.sin(Math.PI * prog(t, L.hold[0], L.hold[1] + 0.5));
        c.save();
        c.translate(w.cx, w.base - L.asc * 0.35 + dy); c.scale(sc, sc); c.translate(-w.cx, -(w.base - L.asc * 0.35));
        c.globalAlpha = alpha;
        if (blur > 0.3) c.filter = `blur(${(blur * cam.z).toFixed(2)}px)`;
        c.font = `${L.size}px ${FONT}`; c.direction = 'rtl'; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
        // dark lift for legibility, then the glowing face
        // (shadow-only pass: draw far off-canvas and throw the shadow back)
        const m = c.getTransform(), OFF = 6000;
        c.shadowColor = 'rgba(18,0,7,0.9)'; c.shadowBlur = 30; c.shadowOffsetX = -OFF; c.shadowOffsetY = 8;
        c.fillStyle = '#000'; c.fillText(w.s, w.xr + OFF / m.a, w.base);
        c.shadowOffsetX = 0; c.shadowOffsetY = 0;
        const g = c.createLinearGradient(0, w.base - L.asc, 0, w.base + L.desc);
        if (L.style === 'rose') { g.addColorStop(0, '#ffe0e6'); g.addColorStop(0.55, '#ff9db4'); g.addColorStop(1, '#f6cf7e'); }
        else if (L.style === 'gold') { g.addColorStop(0, '#fff3d6'); g.addColorStop(0.5, '#f8d690'); g.addColorStop(1, '#e0a54a'); }
        else { g.addColorStop(0, '#fffaf0'); g.addColorStop(0.6, '#ffe9c8'); g.addColorStop(1, '#f2c47a'); }
        c.fillStyle = g;
        c.shadowColor = `rgba(255,165,90,${clamp(glow)})`; c.shadowBlur = 22 + 40 * (glow - 0.5);
        c.fillText(w.s, w.xr, w.base);
        c.restore();
      }
    }
  }

  // ---------------------------------------------------------------- scene assembly
  function drawWorld(c, t, cam) {
    drawArch(c, t);
    drawRings(c, t);

    // intro eye (world right)
    if (t < 7.2) {
      if (t < 0.42) drawIntroLine(c, t);
      else drawEye(c, t, introEye(t));
    }
    // arrows behind the heart so the filled heart hides the middle of each shaft
    c.globalAlpha = 1 - 0.75 * stackDim(t);
    for (const a of ARROWS) { const s = arrowState(a, t); if (s) drawArrow(c, s, t); }
    c.globalAlpha = 1;

    // heart, split, merge, morph to eye, underline
    const pulse = heartPulse(t);
    const lastHit = lastBefore([...HIT, ...KON], t);
    const wave = 5 + 22 * Math.exp(-(t - lastHit) * 2.6);
    if (t < 20.49) {
      const dim = 1 - 0.62 * stackDim(t);
      const arrive = eOut(prog(t, 5.7, 6.3));
      drawHeart(c, t, { cx: HC.x, cy: HC.y, k: HK * pulse, fill: heartFillLevel(t), outline: (0.35 + 0.65 * arrive) * (1 - 0.5 * stackDim(t)), alpha: 1, wave, dim, halo: (0.25 + 0.6 * prog(t, HIT[0], HIT[2] + 0.5)) * (0.75 + 0.5 * env(t)) * dim });
    } else if (t < MERGE) {
      // one heart becomes two that waltz on the beat and meet again on the last accent
      const split = eOut(prog(t, 20.49, 21.26));
      const steps = [21.258, 22.825, MERGE];
      let th = 0; for (const s of steps) th += 0.5 * Math.PI * eIO(prog(t, s - 0.62, s));
      th += 0.12 * Math.sin(t * 1.3);
      const rr = 250 * split * (1 - 0.32 * eIO(prog(t, 22.2, 22.825))) * (1 - eIn(prog(t, 23.4, MERGE)));
      const sc = lerp(1, 0.52, split) * (1 + (pulse - 1) * 1.4);
      const bob = Math.sin(t * 3.1) * 12 * split;
      const A = { x: HC.x + Math.cos(th) * rr, y: HC.y + Math.sin(th) * rr * 0.55 + bob };
      const B = { x: HC.x - Math.cos(th) * rr, y: HC.y - Math.sin(th) * rr * 0.55 - bob };
      drawHeart(c, t, { cx: B.x, cy: B.y, k: HK * sc, fill: 1.02, outline: 1, wave: 8, halo: 0.5, colA: '#ff7d9b', colB: ROSE_D, lw: lerp(6, 4.5, split) });
      drawHeart(c, t, { cx: A.x, cy: A.y, k: HK * sc, fill: 1.02, outline: 1, wave: 8, halo: 0.5, colA: lerp3('#ff7a9a', '#ffe2a8', split), colB: lerp3(ROSE_D, GOLD_D, split), lw: lerp(6, 4.5, split) });
    } else if (t < 24.96) {
      drawHeart(c, t, { cx: HC.x, cy: HC.y, k: HK * pulse * (1 + 0.12 * Math.exp(-(t - MERGE) * 5)), fill: 1.02, outline: 1, wave: 10 * Math.exp(-(t - MERGE) * 2) + 5, halo: 0.9 + 0.6 * Math.exp(-(t - MERGE) * 3) });
    } else if (t < 25.8) {
      // the heart's outline becomes the eye
      const p = eSoft(prog(t, 24.96, 25.76));
      const hp = heartPoints(HC.x, HC.y, HK * heartPulse(t), HEART_N);
      const ep = eyePoints(eyeGeom(HC.x, HC.y, 640, 1, 30, 140, 92), HEART_N);
      const fa = 1 - prog(t, 24.96, 25.4);
      if (fa > 0) drawHeart(c, t, { cx: HC.x, cy: HC.y, k: HK * heartPulse(t), fill: 1.02, outline: 0, alpha: fa, wave: 5, halo: 0.9 * fa });
      const mp = hp.map((h, i) => ({ x: lerp(h.x, ep[i].x, p), y: lerp(h.y, ep[i].y, p) }));
      polyPath(c, mp); glowStroke(c, lerp(6, 6.5, p), GOLD, 'rgba(255,180,90,0.9)', 26);
      if (p > 0.85) drawEye(c, t, { cx: HC.x, cy: HC.y, w: 640, open: 1, lash: 0, iris: eOut(prog(t, 25.55, 26.1)), look: 0, sag: 30, alpha: prog(t, 25.6, 25.76) });
    } else if (t < 27.35) {
      const open = 1 - eSoft(prog(t, 26.46, 27.31));
      drawEye(c, t, { cx: HC.x, cy: HC.y, w: 640, open, lash: prog(t, 25.6, 26.3), iris: eOut(prog(t, 25.55, 26.1)), look: 0, sag: 30 });
      drawEyeHalo(c, t, 1);
    } else {
      // closed eye -> underline with a small heart in the middle
      const p = eOut(prog(t, 27.35, 28.0));
      const cy = lerp(HC.y, HC.y + 160, p), w = lerp(640, 470, p), sag = lerp(30, 0, p);
      const g = eyeGeom(HC.x, cy, w, 0, sag);
      const gap = 52 * eOut(prog(t, 28.6, 28.95));
      const pts = []; for (let i = 0; i <= 80; i++) pts.push(qpt(g.R, g.cu, g.L, i / 80));
      const mid = HC.x;
      const right = pts.filter(q => q.x > mid + gap), left = pts.filter(q => q.x < mid - gap);
      for (const seg of [right, left]) if (seg.length > 1) { polyPath(c, seg, false); glowStroke(c, 6, GOLD, 'rgba(255,180,90,0.9)', 24); }
      // end flourishes: tiny drops at both ends
      for (const q of [g.R, g.L]) { c.fillStyle = GOLD; c.beginPath(); c.arc(q.x, q.y, 6 * p, 0, TAU); c.fill(); }
      // the lashes of the closed eye let go
      const la = 1 - prog(t, 27.35, 27.62);
      if (la > 0) drawEye(c, t, { cx: HC.x, cy, w, open: 0, lash: 1, iris: 0, sag, alpha: la });
      const hp = prog(t, 28.72, 29.1);
      if (hp > 0) {
        const s = eOut(hp) * (1 + 0.18 * Math.exp(-(t - 28.78) * 5) * Math.cos((t - 28.78) * 18)) * heartPulse(t);
        drawHeart(c, t, { cx: HC.x, cy: cy - 4, k: 2.3 * s, fill: 1.02, outline: 1, wave: 0, halo: 0.7, lw: 3 });
      }
    }

    drawBursts(c, t);
    drawLyrics(c, t, cam);
  }
  function drawEyeHalo(c, t, a) {
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 * a; const r = 520;
    c.drawImage(SPR.glow, HC.x - r, HC.y - r, r * 2, r * 2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }
  function lerp3(a, b, t) {
    const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16));
    return '#' + pa.map((v, i) => Math.round(lerp(v, pb[i], t)).toString(16).padStart(2, '0')).join('');
  }

  function drawFrame(c, t) {
    const cam = camAt(t);
    c.save();
    drawBackground(c, t, cam);
    setWorld(c, cam);
    drawWorld(c, t, cam);
    c.setTransform(1, 0, 0, 1, 0, 0);
    drawRain(c, t, cam);
    drawDust(c, t, cam);
    // impact flashes
    const flashes = [...HIT.map(h => [h, 0.22]), [MERGE, 0.4]];
    for (const [h, amt] of flashes) {
      const d = t - h; if (d < 0 || d > 0.5) continue;
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = amt * Math.exp(-d * 8);
      const sx = W / 2 + (HC.x - cam.x) * cam.z, sy = H / 2 + (HC.y - cam.y) * cam.z, r = 900;
      c.drawImage(SPR.glow, sx - r, sy - r, r * 2, r * 2);
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    c.drawImage(VIGNETTE, 0, 0);
    // fade in / out
    const black = Math.max(1 - prog(t, 0, 0.14), prog(t, DUR - 0.6, DUR - 0.05));
    if (black > 0) { c.fillStyle = `rgba(0,0,0,${black})`; c.fillRect(0, 0, W, H); }
    c.restore();
  }

  function camSpeed(t) {
    const a = camBase(t - 0.01), b = camBase(t + 0.01);
    return Math.hypot(b.x - a.x, b.y - a.y) * b.z / 0.02 + Math.abs(b.z - a.z) / 0.02 * 900;
  }

  // public: render frame t into the main canvas (with motion blur when the camera whips)
  function render(t) {
    const v = camSpeed(t);
    const n = v > 700 ? Math.min(12, Math.ceil(v / 450)) : 1;
    if (n === 1) { drawFrame(ctx, t); return; }
    const shutter = 0.5 / FPS;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    for (let k = 0; k < n; k++) {
      const tk = t + (k / (n - 1) - 0.5) * shutter;
      sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.globalAlpha = 1; sctx.filter = 'none';
      drawFrame(sctx, tk);
      ctx.globalAlpha = 1 / (k + 1);
      ctx.drawImage(sub, 0, 0);
    }
    ctx.globalAlpha = 1;
  }

  const ready = (async () => {
    const f = new FontFace(FONT, 'url(fonts/NastaliqBold.woff)');
    await f.load(); document.fonts.add(f);
    await document.fonts.ready;
    layoutLines();
    return true;
  })();

  window.FILM = { W, H, FPS, DUR, ready, render, frames: Math.round(DUR * FPS) };
})();
