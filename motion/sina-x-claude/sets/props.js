// Props, all in brick style. Built once; film.js animates them.
import * as G from '../lib/gl.js';
import { plastic, brick, roundBox, studGeo, P, PLATE, STUD_H } from './lego.js';
import { sparkPath } from './faces.js';

const THREE = G.THREE;
const FA = 'Vazir';
const mesh = (g, m, cast = true) => { const x = new THREE.Mesh(g, m); x.castShadow = cast; x.receiveShadow = true; return x; };
const texMat = (tex, o = {}) => { const { clearcoat, ...rest } = o; return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.32, envMap: G.ENV, envMapIntensity: 0.45, ...rest }); };

function faText(c, str, x, y, size, weight, color, align = 'center') {
  c.save();
  c.direction = 'rtl'; c.font = `${weight} ${size}px ${FA}`; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'middle';
  c.fillText(str, x, y);
  c.restore();
}

// ---------------------------------------------------------------- F-14, brick-built
let jetTag = null;
function JET_TAG() {
  if (jetTag) return jetTag;
  jetTag = G.canvasTexture(256, 112);
  jetTag.draw((c, w, h) => { c.font = `900 84px Inter, ${FA}`; c.fillStyle = '#F4F1EA'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('F-14', w / 2, h / 2 + 4); });
  return jetTag;
}
export function jet() {
  const g = new THREE.Group();
  const grey = plastic('#8D98A3'), dark = plastic('#4A535C'), glass = plastic('#1D2A36', { roughness: 0.1, clearcoat: 1, env: 1 });
  const body = mesh(roundBox(5.2, 0.62, 0.9, 0.12), grey); g.add(body);
  const nose = mesh(new THREE.ConeGeometry(0.42, 1.5, 16), grey); nose.rotation.z = -Math.PI / 2; nose.position.x = 3.3; nose.scale.z = 0.8; g.add(nose);
  const canopy = mesh(new THREE.SphereGeometry(0.42, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), glass); canopy.scale.set(1.8, 0.75, 0.9); canopy.position.set(1.7, 0.28, 0); g.add(canopy);
  for (const sd of [-1, 1]) {
    const wing = mesh(new THREE.BoxGeometry(2.0, 0.08, 2.6), grey); wing.position.set(-0.2, 0, sd * 1.65); wing.rotation.y = sd * 0.55; g.add(wing);
    const tail = mesh(new THREE.BoxGeometry(1.1, 1.2, 0.08), dark); tail.position.set(-2.2, 0.75, sd * 0.4); tail.rotation.z = -0.35; g.add(tail);
    const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.42), new THREE.MeshBasicMaterial({ map: JET_TAG(), transparent: true, side: THREE.DoubleSide, toneMapped: false }));
    tag.position.set(-2.18, 0.78, sd * 0.45); tag.rotation.set(0, sd > 0 ? 0 : Math.PI, -0.35); g.add(tag);
    const stab = mesh(new THREE.BoxGeometry(1.0, 0.06, 1.1), grey); stab.position.set(-2.3, -0.05, sd * 0.85); stab.rotation.y = sd * 0.4; g.add(stab);
    const eng = mesh(new THREE.CylinderGeometry(0.3, 0.34, 1.2, 14), dark); eng.rotation.z = Math.PI / 2; eng.position.set(-2.4, -0.25, sd * 0.32); g.add(eng);
  }
  const roundel = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 16), plastic('#F4F1EA')); roundel.position.set(0.2, 0.06, 1.2); g.add(roundel);
  return g;
}

// ---------------------------------------------------------------- capsule (sertraline, generic)
export function capsule() {
  const g = new THREE.Group();
  const a = plastic('#F7F4EE', { clearcoat: 0.9 }), b = plastic('#3F7FD8', { clearcoat: 0.9 });
  const half = (m, sd) => {
    const h = new THREE.Group();
    const cyl = mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.75, 28), m); cyl.position.y = sd * 0.375; h.add(cyl);
    const cap = mesh(new THREE.SphereGeometry(0.5, 28, 14, 0, Math.PI * 2, sd > 0 ? 0 : Math.PI / 2, Math.PI / 2), m); cap.position.y = sd * 0.75; h.add(cap);
    return h;
  };
  g.add(half(a, 1), half(b, -1));
  g.rotation.z = Math.PI / 2;
  const outer = new THREE.Group(); outer.add(g);
  return outer;
}

// ---------------------------------------------------------------- reference video tiles
export function refCard(i) {
  const tex = G.canvasTexture(256, 160);
  const hues = ['#E85D4A', '#3D7DD8', '#F2B33D', '#7A5AE0', '#2FB08A', '#E0478E', '#5BC0EB', '#F27C38', '#8BC34A'];
  tex.draw((c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, hues[i % hues.length]); gr.addColorStop(1, hues[(i + 3) % hues.length]);
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, h - 26, w, 26);
    c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(w / 2, h / 2 - 6, 30, 0, Math.PI * 2); c.fill();
    c.fillStyle = hues[i % hues.length]; c.beginPath(); c.moveTo(w / 2 - 9, h / 2 - 22); c.lineTo(w / 2 + 16, h / 2 - 6); c.lineTo(w / 2 - 9, h / 2 + 10); c.closePath(); c.fill();
    c.fillStyle = '#fff'; c.fillRect(8, h - 15, (w - 16) * (0.25 + 0.6 * ((i * 37) % 10) / 10), 5);
  });
  const g = new THREE.Group();
  const side = plastic('#F2F2F2');
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 1.0), [side, side, texMat(tex), side, side, side]);
  box.castShadow = box.receiveShadow = true;
  g.add(box);
  return g;
}

// ---------------------------------------------------------------- the rules scroll
export const RULES = [
  'گلیچ روی متن ممنوع',
  'اعداد فارسی، نه لاتین',
  'تو پرامپت تایم‌کد نذار',
  'گربه رو توصیف نکن؛ به عکسش ارجاع بده',
  'ترجمه‌ی فارسیِ همه‌چی رو هم بذار',
  'رفرنس‌ها رو یاد بگیر',
];
const DIG = '۰۱۲۳۴۵۶۷۸۹';
export const faNum = (n) => String(n).replace(/\d/g, (d) => DIG[d]);

export const SCROLL_W = 2.2, SCROLL_LEN = 9, SCROLL_HANG = 3.5;
export function scroll(variant = 'rules') {
  const W = 660, H = 2700;          // same aspect as the paper (2.2 x 9 units)
  const tex = G.canvasTexture(W, H);
  const paint = (glitch = 0, seed = 0, hl = -1) => tex.draw((c) => {
    c.fillStyle = '#F6EEDB'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(160,120,70,.25)'; c.lineWidth = 2;
    for (let y = 140; y < H; y += 64) { c.beginPath(); c.moveTo(30, y); c.lineTo(W - 30, y); c.stroke(); }
    faText(c, variant === 'new' ? 'قانون جدید!' : 'قوانین سینا', W / 2, 90, 76, 900, '#B3261E');
    if (variant !== 'new') {
      faText(c, 'نسخه‌ی بی‌نهایت', W / 2, 180, 40, 700, '#8B6A44');
      c.strokeStyle = '#B3261E'; c.lineWidth = 6; c.beginPath(); c.arc(W / 2, 560, 120, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.arc(W / 2, 560, 100, 0, Math.PI * 2); c.stroke();
      faText(c, 'مُهرِ سینا', W / 2, 562, 44, 900, '#B3261E');
    }
    if (variant === 'new') {
      // rule seventy-something, then scribbles forever
      for (let i = 0; i < 8; i++) {
        const y = 260 + i * 300;
        c.fillStyle = '#B3261E'; c.beginPath(); c.arc(W - 62, y, 34, 0, Math.PI * 2); c.fill();
        faText(c, faNum(74 + i), W - 62, y + 2, 34, 800, '#fff');
        c.strokeStyle = '#2A1F1A'; c.lineWidth = 9; c.lineCap = 'round';
        for (let k = 0; k < 2; k++) {
          c.beginPath();
          const yy = y - 14 + k * 62, x0 = W - 120, len = 260 + ((i * 3 + k * 5) % 7) * 18;
          for (let x = 0; x <= len; x += 6) c.lineTo(x0 - x, yy + Math.sin(x * 0.11 + i * 2 + k) * 9);
          c.stroke();
        }
      }
      return;
    }
    RULES.forEach((r, i) => {
      const y = 1110 + i * 270;
      if (i === hl) {   // the rule being read: a highlighter stripe behind it
        c.fillStyle = 'rgba(255,214,64,.75)'; c.beginPath(); c.roundRect(24, y - 62, W - 48, 150, 26); c.fill();
      }
      // the number in a red circle, the rule wrapped right-aligned
      c.fillStyle = '#B3261E'; c.beginPath(); c.arc(W - 62, y, 34, 0, Math.PI * 2); c.fill();
      faText(c, faNum(i + 1), W - 62, y + 2, 40, 800, '#fff');
      const words = r.split(' '), lines = [];
      let cur = '';
      c.font = `800 46px ${FA}`;
      for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > W - 150 && cur) { lines.push(cur); cur = w; } else cur = t; }
      lines.push(cur);
      lines.forEach((ln, k) => {
        const ly = y + k * 66 + (lines.length > 1 ? -18 : 0);
        if (i === 0 && glitch > 0) {
          // the one place a glitch ever touches text in this film: rule 1, for a quarter of a second
          for (let s = 0; s < 6; s++) {
            const off = Math.sin(seed * 13.1 + s * 7.3) * 22 * glitch;
            c.save(); c.beginPath(); c.rect(0, ly - 30 + s * 10, W, 10); c.clip();
            faText(c, ln, W - 112 + off, ly, 46, 800, s % 2 ? '#00B7FF' : '#FF2D55', 'right');
            c.restore();
          }
        } else faText(c, ln, W - 112, ly, 46, 800, '#2A1F1A', 'right');
      });
    });
  });
  paint();
  const mat = texMat(tex, { side: THREE.DoubleSide, clearcoat: 0.1, roughness: 0.7 });
  const g = new THREE.Group();
  const hang = new THREE.Mesh(new THREE.PlaneGeometry(SCROLL_W, 1), mat); hang.castShadow = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SCROLL_W, 1), mat); floor.receiveShadow = true; floor.rotation.x = -Math.PI / 2;
  const rollM = plastic('#EADFC4', { roughness: 0.7, clearcoat: 0.1 });
  const roll = mesh(new THREE.CylinderGeometry(0.2, 0.2, SCROLL_W + 0.1, 20), rollM); roll.rotation.z = Math.PI / 2;
  const top = mesh(new THREE.CylinderGeometry(0.12, 0.12, SCROLL_W + 0.25, 16), plastic('#8B5A2B')); top.rotation.z = Math.PI / 2;
  g.add(hang, floor, roll, top);
  // layout(hangTop, hangBottomZ, length): hangs from y=hangTop at z0 to the floor, then runs toward +z
  const TOTAL = SCROLL_LEN;   // world length of the whole paper (texture covers it)
  function setUV(m, v0, v1) {
    const uv = m.geometry.attributes.uv;
    uv.setXY(0, 0, 1 - v0); uv.setXY(1, 1, 1 - v0); uv.setXY(2, 0, 1 - v1); uv.setXY(3, 1, 1 - v1);
    uv.needsUpdate = true;
  }
  return {
    group: g, paint,
    // hangs from y = hangTop at z0 (at most hangMax long), the rest runs along the floor toward +z
    layout(x, hangTop, z0, len, hangMax = 99) {
      const hl = Math.max(0.01, Math.min(hangTop - 0.03, hangMax));
      const used = Math.min(TOTAL, hl + len);
      g.position.set(x, 0, 0);
      top.position.set(0, hangTop, z0);
      const hh = Math.min(hl, used);
      hang.scale.y = hh; hang.position.set(0, hangTop - hh / 2, z0);
      setUV(hang, 0, hh / TOTAL);
      const onFloor = hangTop - hl < 0.12, fl = Math.max(0.001, used - hl);
      floor.visible = onFloor && fl > 0.01;
      floor.scale.y = fl; floor.position.set(0, STUD_H + 0.03, z0 + fl / 2);
      setUV(floor, hl / TOTAL, used / TOTAL);
      roll.position.set(0, floor.visible ? 0.2 + STUD_H : hangTop - hl, z0 + (floor.visible ? fl : 0));
      const left = 1 - used / TOTAL;
      roll.scale.set(0.5 + left, 1, 0.5 + left);
    },

  };
}

// ---------------------------------------------------------------- small things
export function gradCap() {
  const g = new THREE.Group();
  const blk = plastic('#1B1B1E');
  const base = mesh(new THREE.CylinderGeometry(0.44, 0.48, 0.22, 24), blk); base.position.y = 0.11; g.add(base);
  const board = mesh(roundBox(1.25, 0.06, 1.25, 0.02), blk); board.position.y = 0.25; board.rotation.y = Math.PI / 4; g.add(board);
  const btn = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 10), plastic('#E9B23B')); btn.position.y = 0.3; g.add(btn);
  const tassel = mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.5, 8), plastic('#E9B23B')); tassel.position.set(0.55, 0.05, 0); g.add(tassel);
  return g;
}

export function pedestal(img) {
  const g = new THREE.Group();
  const gold = plastic('#D9A53A', { clearcoat: 1, roughness: 0.2, env: 1.0 });
  const col = brick(2, 2, '#2E2A35', { h: 2.4 }); g.add(col);
  const top = brick(3, 3, '#3B3544', { h: PLATE }); top.position.y = 2.4; g.add(top);
  // the frame: Hiro's photo is referenced, never described (Sina's rule), so it holds a plain
  // silhouette and a name plate
  const tex = G.canvasTexture(400, 500);
  tex.draw((c, w, h) => {
    const gr = c.createRadialGradient(w / 2, h * 0.45, 20, w / 2, h * 0.45, 300); gr.addColorStop(0, '#F3E6C8'); gr.addColorStop(1, '#C9B48A');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2B2420';
    // a sitting cat in silhouette
    c.beginPath();
    c.ellipse(w / 2, h * 0.66, 92, 118, 0, 0, Math.PI * 2);
    c.moveTo(w / 2 + 70, h * 0.36); c.ellipse(w / 2, h * 0.36, 70, 62, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath(); c.moveTo(w / 2 - 62, h * 0.31); c.lineTo(w / 2 - 50, h * 0.18); c.lineTo(w / 2 - 22, h * 0.27); c.fill();
    c.beginPath(); c.moveTo(w / 2 + 62, h * 0.31); c.lineTo(w / 2 + 50, h * 0.18); c.lineTo(w / 2 + 22, h * 0.27); c.fill();
    c.lineWidth = 22; c.strokeStyle = '#2B2420'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(w / 2 + 80, h * 0.82); c.quadraticCurveTo(w / 2 + 170, h * 0.8, w / 2 + 150, h * 0.6); c.stroke();
    faText(c, 'عکسِ هیرو', w / 2, h * 0.93, 40, 800, '#5A3E1E');
  });
  const frame = new THREE.Group(); frame.position.set(0, 2.4 + PLATE + 1.25, 0);
  const fr = mesh(roundBox(2.0, 2.45, 0.2, 0.05), gold); frame.add(fr);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })); pic.position.z = 0.11; frame.add(pic);
  g.add(frame);
  const crown = new THREE.Group();
  const band = mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 20, 1, true), gold); band.material.side = THREE.DoubleSide; crown.add(band);
  for (let i = 0; i < 5; i++) { const sp = mesh(new THREE.ConeGeometry(0.1, 0.32, 8), gold); const a = (i / 5) * Math.PI * 2; sp.position.set(Math.cos(a) * 0.38, 0.28, Math.sin(a) * 0.38); crown.add(sp); }
  crown.position.set(0, 2.4 + PLATE + 2.75, 0); crown.rotation.z = 0.15;
  g.add(crown);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.42), new THREE.MeshStandardMaterial({ map: (() => { const t = G.canvasTexture(320, 104); t.draw((c, w, h) => { c.fillStyle = '#D9A53A'; c.fillRect(0, 0, w, h); faText(c, 'هیرو', w / 2, h / 2 + 4, 62, 900, '#3A2608'); }); return t; })(), roughness: 0.3, metalness: 0.4 }));
  plate.position.set(0, 1.7, 0.82); g.add(plate);
  return { group: g, crown, frame };
}

export function tileStack(n, seed = 0) {
  const g = new THREE.Group();
  const cols = ['#E85D4A', '#3D7DD8', '#F2B33D', '#7A5AE0', '#2FB08A', '#E0478E', '#5BC0EB', '#F27C38'];
  const tiles = [];
  for (let i = 0; i < n; i++) {
    const t = brick(2, 3, cols[(i + seed) % cols.length], { h: PLATE });
    t.position.y = i * (PLATE + 0.005);
    t.rotation.y = Math.sin(i * 2.1 + seed) * 0.12;
    g.add(t); tiles.push(t);
  }
  return { group: g, tiles };
}

export function labelBrick() {
  // a 2x2 brick printed "اشتباه" (red) that flips to a gold "قانون"
  const mk = (bg, fg, word, mark) => {
    const t = G.canvasTexture(256, 256);
    t.draw((c, w, h) => {
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      faText(c, word, w / 2, h * 0.68, 64, 900, fg);
      c.strokeStyle = fg; c.lineWidth = 16; c.lineCap = 'round';
      c.beginPath();
      if (mark === 'x') { c.moveTo(w / 2 - 34, 30); c.lineTo(w / 2 + 34, 98); c.moveTo(w / 2 + 34, 30); c.lineTo(w / 2 - 34, 98); }
      else { c.moveTo(w / 2 - 38, 66); c.lineTo(w / 2 - 8, 96); c.lineTo(w / 2 + 42, 30); }
      c.stroke();
    });
    return t;
  };
  const build = (color, tex) => {
    const g = brick(2, 2, color, { h: 1.6 });
    const front = new THREE.Mesh(new THREE.PlaneGeometry(1.54, 1.54), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.28, envMap: G.ENV, envMapIntensity: 0.5 }));
    front.position.set(0, 0.8, 0.805); g.add(front);
    return g;
  };
  const red = build('#C8352B', mk('#C8352B', '#FFF4E8', 'اشتباه', 'x'));
  const gold = build('#E2AE3A', mk('#E2AE3A', '#4A2E00', 'قانون', 'v'));
  gold.rotation.y = Math.PI;
  const g = new THREE.Group(); g.add(red, gold);
  return { group: g, red, gold };
}

export function tomato() {
  const g = new THREE.Group();
  const body = mesh(new THREE.SphereGeometry(0.75, 32, 20), plastic('#E0362C', { clearcoat: 0.8 })); body.scale.set(1, 0.78, 1); body.position.y = 0.6; g.add(body);
  const leaf = new THREE.Group(); leaf.position.y = 1.17; g.add(leaf);
  for (let i = 0; i < 5; i++) { const l = mesh(roundBox(0.5, 0.06, 0.16, 0.03), plastic('#2E9E4A')); const a = (i / 5) * Math.PI * 2; l.position.set(Math.cos(a) * 0.2, 0, Math.sin(a) * 0.2); l.rotation.y = -a; leaf.add(l); }
  const stem = mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.25, 8), plastic('#2E9E4A')); stem.position.y = 0.12; leaf.add(stem);
  // the dial
  const dialTex = G.canvasTexture(256, 256);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.42, 32), new THREE.MeshStandardMaterial({ map: dialTex, transparent: true, roughness: 0.4 }));
  dial.position.set(0, 0.62, 0.74); g.add(dial);
  return { group: g, dialTex, leaf };
}

export function timeline() {
  // a brick NLE timeline: a dark plate, clips as tiles on two tracks, a red playhead
  const g = new THREE.Group();
  const base = brick(12, 3, '#2B2D33', { h: PLATE, studs: true }); g.add(base);
  const clips = [];
  const lay = [[0, 0, 3, '#3D7DD8'], [3, 0, 2, '#7A5AE0'], [5, 0, 4, '#2FB08A'], [9, 0, 3, '#E85D4A'], [0, 1, 5, '#F2B33D'], [5, 1, 3, '#F27C38'], [8, 1, 4, '#E0478E'], [1, 2, 6, '#5BC0EB'], [7, 2, 4, '#8BC34A']];
  for (const [x, z, n, col] of lay) {
    const t = brick(n, 1, col, { h: PLATE, tile: true });
    t.position.set((x + n / 2 - 6) * P, PLATE, (z - 1) * P);
    g.add(t); clips.push(t);
  }
  const head = new THREE.Group();
  const bar = mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), plastic('#FF2D2D')); bar.position.y = PLATE + 0.6; head.add(bar);
  const knob = mesh(new THREE.ConeGeometry(0.2, 0.3, 4), plastic('#FF2D2D')); knob.position.y = PLATE + 1.3; knob.rotation.x = Math.PI; head.add(knob);
  head.position.z = 1.3; g.add(head);
  return { group: g, clips, head };
}

export function frameWithPhoto(img) {
  const g = new THREE.Group();
  const fr = mesh(roundBox(1.1, 1.38, 0.12, 0.03), plastic('#141414'));
  g.add(fr);
  const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 1.18), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  pic.position.z = 0.065; g.add(pic);
  return g;
}

export function cup() {
  const g = new THREE.Group();
  const w = plastic('#F4F1EA');
  const body = mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.5, 20, 1, true), w); body.material.side = THREE.DoubleSide; g.add(body);
  const bottom = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 20), w); bottom.position.y = -0.23; g.add(bottom);
  const coffee = mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.02, 20), plastic('#5B3A22', { roughness: 0.2 })); coffee.position.y = 0.17; g.add(coffee);
  const handle = mesh(new THREE.TorusGeometry(0.13, 0.04, 8, 14, Math.PI * 1.2), w); handle.position.set(0.27, 0, 0); handle.rotation.z = -Math.PI * 0.6; g.add(handle);
  return g;
}

// clone props
export function clapper() {
  const g = new THREE.Group();
  const tex = G.canvasTexture(128, 32);
  tex.draw((c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#111' : '#f4f4f4'; c.beginPath(); c.moveTo(i * 18 - 6, 0); c.lineTo(i * 18 + 12, 0); c.lineTo(i * 18 + 6, h); c.lineTo(i * 18 - 12, h); c.fill(); } });
  const board = mesh(roundBox(0.9, 0.7, 0.08, 0.02), plastic('#1A1A1A')); g.add(board);
  const arm = new THREE.Group(); arm.position.set(-0.45, 0.38, 0); g.add(arm);
  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.14, 0.08), new THREE.MeshStandardMaterial({ map: tex })); stick.position.x = 0.46; arm.add(stick);
  return { group: g, arm };
}
export function pencil() {
  const g = new THREE.Group();
  const b = mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.1, 6), plastic('#F2B33D')); g.add(b);
  const tip = mesh(new THREE.ConeGeometry(0.07, 0.22, 6), plastic('#F3D9B1')); tip.position.y = -0.66; tip.rotation.x = Math.PI; g.add(tip);
  const lead = mesh(new THREE.ConeGeometry(0.025, 0.07, 6), plastic('#222')); lead.position.y = -0.76; lead.rotation.x = Math.PI; g.add(lead);
  const er = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 6), plastic('#E87A9A')); er.position.y = 0.62; g.add(er);
  return g;
}
export function keyframe() {
  const g = new THREE.Group();
  const d = mesh(new THREE.OctahedronGeometry(0.32, 0), plastic('#FFC93C', { clearcoat: 1, emissive: 0x553300, emissiveIntensity: 0.3 })); d.scale.set(1, 1, 0.45); g.add(d);
  return g;
}
export function laptop() {
  const g = new THREE.Group();
  const base = mesh(roundBox(1.0, 0.06, 0.65, 0.02), plastic('#B8BEC6')); g.add(base);
  const lid = new THREE.Group(); lid.position.set(0, 0.03, -0.32); g.add(lid);
  const scr = mesh(roundBox(1.0, 0.66, 0.05, 0.02), plastic('#B8BEC6')); scr.position.y = 0.33; lid.add(scr);
  const tex = G.canvasTexture(256, 160);
  tex.draw((c, w, h) => { c.fillStyle = '#1F1B2E'; c.fillRect(0, 0, w, h); c.fillStyle = '#D97757'; for (let i = 0; i < 6; i++) c.fillRect(20, 22 + i * 21, 60 + ((i * 53) % 150), 9); });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.56), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); s.position.set(0, 0.33, 0.03); lid.add(s);
  lid.rotation.x = -0.25;
  return g;
}

// Instanced confetti (small plates), precomputed trajectories
export function confetti(n = 90, seed = 5) {
  const cols = ['#E85D4A', '#3D7DD8', '#F2B33D', '#7A5AE0', '#2FB08A', '#E0478E', '#FFFFFF', '#D97757'];
  const geo = new THREE.BoxGeometry(0.22, 0.05, 0.14);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.4 });
  const inst = new THREE.InstancedMesh(geo, mat, n);
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const P_ = [];
  for (let i = 0; i < n; i++) {
    inst.setColorAt(i, new THREE.Color(cols[i % cols.length]));
    const a = rnd() * Math.PI * 2, sp = 2 + rnd() * 4;
    P_.push({ vx: Math.cos(a) * sp * 0.6, vy: 5 + rnd() * 5, vz: Math.sin(a) * sp * 0.4, rx: rnd() * 12, ry: rnd() * 12, ph: rnd() * 6 });
  }
  inst.instanceColor.needsUpdate = true;
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  return {
    mesh: inst,
    at(t, origin) {     // t seconds since the burst
      for (let i = 0; i < n; i++) {
        const p = P_[i];
        if (t < 0 || t > 3.5) { M4.makeScale(0, 0, 0); inst.setMatrixAt(i, M4); continue; }
        const drag = 1 - Math.exp(-t * 1.6);
        const x = origin[0] + (p.vx / 1.6) * drag + Math.sin(t * 3 + p.ph) * 0.2;
        const y = Math.max(0.05, origin[1] + (p.vy / 1.6) * drag - 2.2 * t * t * 0.5 - 1.2 * t);
        const z = origin[2] + (p.vz / 1.6) * drag;
        e.set(p.rx * t, p.ry * t, 0); q.setFromEuler(e); v.set(x, y, z); sc.setScalar(Math.min(1, t * 6) * (t > 3 ? (3.5 - t) * 2 : 1));
        M4.compose(v, q, sc); inst.setMatrixAt(i, M4);
      }
      inst.instanceMatrix.needsUpdate = true;
    },
  };
}

// Steam puffs (spheres), for the frazzled moment
export function puffs(n = 10) {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1, transparent: true, opacity: 0.9 });
  const list = [];
  for (let i = 0; i < n; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), m.clone()); g.add(s); list.push(s); }
  return { group: g, list };
}

// ---------------------------------------------------------------- Sina's own marks on the set
// a brick display stand with a printed name tile (Lego minifig stands), in the character's colour
export function nameStand(name, bg, ink) {
  const g = new THREE.Group();
  const base = brick(4, 2, '#2B2B2E', { h: PLATE }); g.add(base);
  const tile = new THREE.Group(); tile.position.set(0, PLATE + 0.02, 0.15); tile.rotation.x = -0.32; g.add(tile);
  const tex = G.canvasTexture(512, 192);
  tex.draw((c, w, h) => { c.fillStyle = bg; c.fillRect(0, 0, w, h); faText(c, name, w / 2, h / 2 + 6, 120, 900, ink); });
  const body = mesh(roundBox(3.1, 0.9, 0.14, 0.04), plastic(bg)); body.position.y = 0.45; tile.add(body);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.85), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35 }));
  face.position.set(0, 0.45, 0.075); tile.add(face);
  return g;
}
// a big brick picture frame on legs holding Sina's own portrait: his mark in the set
export function posterBoard(img) {
  const g = new THREE.Group();
  const red = plastic('#C8102E', { clearcoat: 0.6 });
  const W_ = 2.4, H_ = W_ * (img.height / img.width);
  const frame = mesh(roundBox(W_ + 0.28, H_ + 0.28, 0.22, 0.05), red); frame.position.y = 1.0 + H_ / 2; g.add(frame);
  const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true;
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(W_, H_), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  pic.position.set(0, 1.0 + H_ / 2, 0.12); g.add(pic);
  for (const sd of [-1, 1]) { const leg = brick(1, 1, '#2B2B2E', { h: 1.05 }); leg.position.set(sd * (W_ / 2 - 0.3), 0, -0.05); g.add(leg); }
  return g;
}
export function megaphone() {
  const g = new THREE.Group();
  const cone = mesh(new THREE.CylinderGeometry(0.32, 0.1, 0.7, 20, 1, true), plastic('#F2B33D')); cone.material.side = THREE.DoubleSide; cone.rotation.x = Math.PI / 2; g.add(cone);
  const grip = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 10), plastic('#2B2B2E')); grip.position.set(0, -0.2, -0.15); g.add(grip);
  return g;
}
