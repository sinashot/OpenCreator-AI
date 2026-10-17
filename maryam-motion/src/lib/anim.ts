import {Easing, spring} from 'remotion';
import {FPS} from '../constants';

/* Motion vocabulary. Every move picks its own curve:
   entrances decelerate hard, exits accelerate and travel less, camera moves ease both ends. */
export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
export const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_CAM = Easing.bezier(0.45, 0, 0.2, 1);
export const LINEAR = (x: number) => x;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const smoothstep = (a: number, b: number, x: number) => {
	const p = clamp((x - a) / (b - a));
	return p * p * (3 - 2 * p);
};

/** 0→1 progress of `t` (seconds) between t0 and t1, shaped by `ease`. */
export const ramp = (t: number, t0: number, t1: number, ease: (x: number) => number = EASE_OUT) =>
	ease(clamp((t - t0) / (t1 - t0)));

/** Rises over [a0,a1], holds, falls over [b0,b1]. */
export const envelope = (t: number, a0: number, a1: number, b0: number, b1: number) =>
	ramp(t, a0, a1, EASE_OUT) * (1 - ramp(t, b0, b1, EASE_IN));

/** Remotion spring started at `t0` seconds. Default ≈1.5 % overshoot (stiffness 100 / damping 16). */
export const springAt = (t: number, t0: number, config: {stiffness?: number; damping?: number; mass?: number} = {}) =>
	t < t0
		? 0
		: spring({
				frame: (t - t0) * FPS,
				fps: FPS,
				config: {stiffness: 100, damping: 16, mass: 1, ...config},
			});

type Key = {t: number; v: number[]; ease?: (x: number) => number};
/** Piecewise keyframes over vectors; each segment uses the ease of its target key. */
export const keys = (t: number, ks: Key[]): number[] => {
	if (t <= ks[0].t) return ks[0].v;
	for (let i = 1; i < ks.length; i++) {
		if (t <= ks[i].t) {
			const p = (ks[i].ease ?? EASE_CAM)(clamp((t - ks[i - 1].t) / (ks[i].t - ks[i - 1].t)));
			return ks[i - 1].v.map((a, j) => lerp(a, ks[i].v[j], p));
		}
	}
	return ks[ks.length - 1].v;
};

/** Camera: world point (fx,fy) lands on the screen anchor, scaled by s and rotated by r degrees. */
export const cam = (fx: number, fy: number, s: number, r = 0, ax = 540, ay = 640) =>
	`translate(${ax} ${ay}) rotate(${r}) scale(${s}) translate(${-fx} ${-fy})`;

/** Time held on twos at 12 fps — for hand-drawn line boil and jitter. */
export const onTwos = (t: number, rate = 12) => Math.floor(t * rate) / rate;
