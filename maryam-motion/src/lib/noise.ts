import {random} from 'remotion';

/** Smooth 1-D value noise in [-1, 1]; deterministic for a given seed. */
export const noise1 = (x: number, seed: string | number = 0) => {
	const i = Math.floor(x);
	const f = x - i;
	const a = random(`${seed}:${i}`) * 2 - 1;
	const b = random(`${seed}:${i + 1}`) * 2 - 1;
	const u = f * f * (3 - 2 * f);
	return a + (b - a) * u;
};

export const rand = (seed: string | number) => random(seed);
