import {rand} from '../lib/noise';

export type Pt = [number, number];

/** Smooth curve through points (Catmull-Rom → cubic Bézier). */
export const curve = (pts: Pt[], closed = false, k = 1) => {
	if (pts.length < 2) return '';
	const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
	let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
	for (let i = 1; i < P.length - 2; i++) {
		const [p0, p1, p2, p3] = [P[i - 1], P[i], P[i + 1], P[i + 2]];
		const c1: Pt = [p1[0] + ((p2[0] - p0[0]) / 6) * k, p1[1] + ((p2[1] - p0[1]) / 6) * k];
		const c2: Pt = [p2[0] - ((p3[0] - p1[0]) / 6) * k, p2[1] - ((p3[1] - p1[1]) / 6) * k];
		d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
	}
	return closed ? d + 'Z' : d;
};

export const poly = (pts: Pt[], closed = false) =>
	pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + (closed ? 'Z' : '');

export const lerpPts = (a: Pt[], b: Pt[], p: number): Pt[] => a.map((q, i) => [q[0] + (b[i][0] - q[0]) * p, q[1] + (b[i][1] - q[1]) * p]);

export const circlePts = (cx: number, cy: number, r: number, n: number, a0 = -Math.PI / 2): Pt[] =>
	Array.from({length: n}, (_, i) => {
		const a = a0 + (i / n) * Math.PI * 2;
		return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
	});

/** Lemniscate (∞) sampled on the same parameter grid as circlePts, so the two morph cleanly. */
export const lemniscatePts = (cx: number, cy: number, a: number, n: number, a0 = -Math.PI / 2): Pt[] =>
	Array.from({length: n}, (_, i) => {
		const th = a0 + (i / n) * Math.PI * 2 + Math.PI / 2;
		const d = 1 + Math.sin(th) ** 2;
		return [cx + (a * Math.cos(th)) / d, cy + (a * Math.sin(th) * Math.cos(th)) / d];
	});

/** Point and heading at fraction s (0..1) along a closed polyline. */
export const along = (pts: Pt[], s: number): {x: number; y: number; a: number} => {
	const seg: number[] = [];
	let total = 0;
	for (let i = 0; i < pts.length; i++) {
		const a = pts[i];
		const b = pts[(i + 1) % pts.length];
		const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
		seg.push(l);
		total += l;
	}
	let d = (((s % 1) + 1) % 1) * total;
	for (let i = 0; i < pts.length; i++) {
		if (d <= seg[i]) {
			const a = pts[i];
			const b = pts[(i + 1) % pts.length];
			const f = d / seg[i];
			return {x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, a: Math.atan2(b[1] - a[1], b[0] - a[0])};
		}
		d -= seg[i];
	}
	return {x: pts[0][0], y: pts[0][1], a: 0};
};

/** A restless scribble confined to an ellipse: a random walk with momentum. */
export const scribblePts = (seed: string, cx: number, cy: number, rx: number, ry: number, n: number, turn = 0.9): Pt[] => {
	const pts: Pt[] = [];
	let x = cx + (rand(seed + 'x') - 0.5) * rx;
	let y = cy + (rand(seed + 'y') - 0.5) * ry;
	let a = rand(seed + 'a') * Math.PI * 2;
	const step = (rx + ry) * 0.16;
	for (let i = 0; i < n; i++) {
		a += (rand(`${seed}:${i}`) - 0.5) * 2 * turn;
		// steer back inside the ellipse
		const ex = (x - cx) / rx;
		const ey = (y - cy) / ry;
		if (ex * ex + ey * ey > 0.75) {
			const back = Math.atan2(cy - y, cx - x);
			let diff = back - a;
			diff = Math.atan2(Math.sin(diff), Math.cos(diff));
			a += diff * 0.6;
		}
		x += Math.cos(a) * step;
		y += Math.sin(a) * step;
		pts.push([x, y]);
	}
	return pts;
};

/** Gear outline centred on 0,0. */
export const gearD = (r: number, teeth: number, depth: number) => {
	const pts: Pt[] = [];
	for (let i = 0; i < teeth; i++) {
		const a = (i / teeth) * Math.PI * 2;
		const w = (Math.PI * 2) / teeth;
		const ang = [a - w * 0.25, a - w * 0.14, a + w * 0.14, a + w * 0.25];
		const rad = [r - depth, r, r, r - depth];
		ang.forEach((t, j) => pts.push([Math.cos(t) * rad[j], Math.sin(t) * rad[j]]));
	}
	return poly(pts, true);
};
