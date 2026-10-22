import React from 'react';
import {FA} from './fonts';

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const C = {
	bg0: '#0B1120',
	bg1: '#16213A',
	ink: '#F3EADB',
	dim: '#8A93A8',
	amber: '#F2A541',
	teal: '#3FC1B0',
	red: '#E5484D',
	line: '#C9D2E3',
};

export const HANDLE = '@charkhe.khab';

export const cl = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const rm = (t: number, a: number, b: number) => cl((t - a) / (b - a));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const eo = (x: number) => 1 - Math.pow(1 - cl(x), 4.5);
export const ei = (x: number) => Math.pow(cl(x), 3.2);
export const eio = (x: number) => {
	x = cl(x);
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/* entrance 0..1 (~20 frames, fast-out curve) */
export const inn = (t: number, a: number, d = 0.65) => eo(rm(t, a, a + d));
/* exit 0..1 (~8 frames, accelerating) */
export const out = (t: number, a: number, d = 0.27) => ei(rm(t, a, a + d));
export const vis = (t: number, a: number, b: number, din = 0.65, dout = 0.27) => inn(t, a, din) * (1 - out(t, b, dout));

/* a hit that lands scaled up and settles */
export const punch = (t: number, at: number, amount = 0.08, dur = 0.3) => (t < at ? 1 : 1 + amount * (1 - eo(rm(t, at, at + dur))));

export const faNum = (s: string | number) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);

export const rand = (seed: number) => {
	const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

/* Persian text: always a whole RTL block, never split into letter boxes. */
export const Fa: React.FC<{
	children: React.ReactNode;
	size: number;
	weight?: number;
	color?: string;
	x?: number;
	y: number;
	style?: React.CSSProperties;
}> = ({children, size, weight = 800, color = C.ink, x = W / 2, y, style}) => (
	<div
		dir="rtl"
		lang="fa"
		style={{
			position: 'absolute',
			left: x,
			top: y,
			transform: 'translate(-50%,-50%)',
			fontFamily: FA,
			fontSize: size,
			fontWeight: weight,
			color,
			lineHeight: 1.7,
			whiteSpace: 'nowrap',
			textAlign: 'center',
			...style,
		}}
	>
		{children}
	</div>
);

/* standard appear/disappear: rise in, leave upward 70% as far */
export const enterStyle = (t: number, a: number, b: number, dist = 46): React.CSSProperties => {
	const i = inn(t, a);
	const o = out(t, b);
	return {opacity: i * (1 - o), translate: `0 ${(1 - i) * dist - o * dist * 0.7}px`};
};
