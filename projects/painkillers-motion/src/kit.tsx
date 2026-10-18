/*
 * Shared design system for the reel: palette, curves, timing helpers and the few
 * building blocks every scene uses. Everything is a function of t (seconds).
 */
import React from 'react';
import {Easing} from 'remotion';
import {FA} from './fonts';
import timeline from './timeline.json';

export const W = 1080;
export const H = 1920;
export const FPS = 30;

export const C = {
	bg: '#0F1733',
	bg2: '#16214A',
	ink: '#FFF4E6',
	dim: '#9AA6CF',
	pain: '#FF4D5E',
	relief: '#2EE6A8',
	nsaid: '#FF8A3D',
	opioid: '#A07CFF',
	topical: '#26C6DA',
	neuro: '#FFC93C',
	acet: '#5AA9FF',
	line: 'rgba(255,244,230,0.14)',
};

export type Line = {start: number; end: number; text: string};
export type Section = {name: string; start: number; end: number; next: number};
export const TL = timeline as unknown as {
	duration: number;
	beat: number;
	sections: Section[];
	lines: Record<string, Line>;
	whooshes: number[];
};

/* Three curves, used everywhere. */
const entry = Easing.bezier(0.16, 1, 0.3, 1);
const exit = Easing.bezier(0.7, 0, 0.84, 0);
const move = Easing.bezier(0.65, 0, 0.35, 1);

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const remap = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;

/* p for an entrance starting at `at` (0..1), ~0.65 s */
export const inn = (t: number, at: number, dur = 0.65) => entry(remap(t, at, at + dur));
/* p for an exit (0 = still there, 1 = gone), ~0.27 s */
export const outp = (t: number, at: number, dur = 0.27) => exit(remap(t, at, at + dur));
export const mv = (t: number, at: number, dur = 0.8) => move(remap(t, at, at + dur));

/* Small settle after a hit: 1 -> 1+amount -> 1 */
export const punch = (t: number, at: number, amount = 0.08, dur = 0.35) => {
	const p = remap(t, at, at + dur);
	return 1 + amount * (p > 0 && p < 1 ? Math.sin(Math.PI * p) * (1 - p) * 2 : 0);
};

/* Spring with a little overshoot (~1.5%), for objects, never for text. */
export const spr = (t: number, at: number, k = 140, c = 16) => {
	const x = t - at;
	if (x <= 0) return 0;
	const w0 = Math.sqrt(k);
	const z = c / (2 * w0);
	const wd = w0 * Math.sqrt(Math.max(1e-6, 1 - z * z));
	return 1 - Math.exp(-z * w0 * x) * (Math.cos(wd * x) + ((z * w0) / wd) * Math.sin(wd * x));
};

/* Times of a scene's lines, relative to the scene start. */
export const lineAt = (sec: Section) => (k: string) => TL.lines[k].start - sec.start;
export const lineEnd = (sec: Section) => (k: string) => TL.lines[k].end - sec.start;

/* Standard entrance style: rise 36 px, scale .93 -> 1, fade as one layer. */
export const appear = (p: number, dy = 36, s0 = 0.93): React.CSSProperties => ({
	opacity: p,
	transform: `translateY(${(1 - p) * dy}px) scale(${mix(s0, 1, p)})`,
});

/* Persian text block. Always one RTL box, never split into letter boxes. */
export const Fa: React.FC<{
	children: React.ReactNode;
	size: number;
	weight?: number;
	color?: string;
	style?: React.CSSProperties;
	wrap?: boolean;
}> = ({children, size, weight = 800, color = C.ink, style, wrap}) => (
	<div
		dir="rtl"
		lang="fa"
		style={{
			fontFamily: FA,
			fontSize: size,
			fontWeight: weight,
			color,
			lineHeight: 1.65,
			whiteSpace: wrap ? 'normal' : 'nowrap',
			textAlign: 'center',
			...style,
		}}
	>
		{children}
	</div>
);

/* Words revealed right to left, each word as one piece (words never join each
   other, so a box per word is safe). */
export const Words: React.FC<{
	text: string;
	t: number;
	at: number;
	span: number;
	size: number;
	weight?: number;
	color?: string;
	style?: React.CSSProperties;
	highlight?: Record<string, string>;
}> = ({text, t, at, span, size, weight = 900, color = C.ink, style, highlight = {}}) => {
	const words = text.split(' ');
	const n = words.length;
	return (
		<Fa size={size} weight={weight} color={color} wrap style={style}>
			{words.map((w, i) => {
				// stagger on a curve: early words arrive closer together
				const at_i = at + span * Math.pow(i / Math.max(1, n - 1), 1.25);
				const p = inn(t, at_i, 0.55);
				return (
					<React.Fragment key={i}>
						<span
							style={{
								display: 'inline-block',
								opacity: p,
								transform: `translateY(${(1 - p) * 0.35}em)`,
								color: highlight[w] ?? color,
							}}
						>
							{w}
						</span>
						{i < n - 1 ? ' ' : null}
					</React.Fragment>
				);
			})}
		</Fa>
	);
};

/* Rounded pill label. */
export const Chip: React.FC<{
	children: React.ReactNode;
	color: string;
	p: number;
	size?: number;
	solid?: boolean;
	style?: React.CSSProperties;
}> = ({children, color, p, size = 46, solid, style}) => (
	<div
		style={{
			...appear(p, 30, 0.9),
			padding: `${size * 0.18}px ${size * 0.62}px`,
			borderRadius: 999,
			background: solid ? color : 'rgba(255,255,255,0.06)',
			border: `3px solid ${color}`,
			boxShadow: solid ? `0 10px 40px ${color}55` : 'none',
			...style,
		}}
	>
		<Fa size={size} weight={800} color={solid ? C.bg : C.ink}>
			{children}
		</Fa>
	</div>
);

/* Persian digits for the section numbers. */
export const faNum = (n: number) => '۰۱۲۳۴۵۶۷۸۹'[n];

/* Section header: number badge + title, reveals right to left. */
export const Header: React.FC<{n: number; title: string; color: string; t: number; at: number}> = ({n, title, color, t, at}) => {
	const pb = spr(t, at, 160, 15);
	const pt = inn(t, at + 0.12, 0.7);
	return (
		<div dir="rtl" style={{position: 'absolute', top: 250, left: 0, width: W, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6}}>
			<div
				style={{
					width: 150,
					height: 150,
					borderRadius: 999,
					background: color,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					transform: `scale(${mix(0.6, 1, pb)}) rotate(${(1 - pb) * -40}deg)`,
					opacity: clamp(pb * 3),
					boxShadow: `0 0 0 14px ${color}22, 0 0 80px ${color}66`,
				}}
			>
				<Fa size={96} weight={900} color={C.bg} style={{lineHeight: 1.2, marginTop: 8}}>
					{faNum(n)}
				</Fa>
			</div>
			<div style={{clipPath: `inset(-40% 0 -40% ${(1 - pt) * 100}%)`, marginTop: 18}}>
				<Fa size={84} weight={900}>
					{title}
				</Fa>
			</div>
		</div>
	);
};

/* Center a child at (x, y) in scene coordinates. */
export const At: React.FC<{x: number; y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({x, y, children, style}) => (
	<div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', ...style}}>{children}</div>
);

/* Persian digits inside any string. */
export const faDigits = (s: string) => s.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);

/* Point at progress p (0..1) along a polyline, by arc length. */
export const along = (pts: [number, number][], p: number): [number, number] => {
	const segs: number[] = [];
	let total = 0;
	for (let i = 1; i < pts.length; i++) {
		const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
		segs.push(d);
		total += d;
	}
	let target = clamp(p) * total;
	for (let i = 0; i < segs.length; i++) {
		if (target <= segs[i] || i === segs.length - 1) {
			const q = segs[i] === 0 ? 0 : clamp(target / segs[i]);
			return [mix(pts[i][0], pts[i + 1][0], q), mix(pts[i][1], pts[i + 1][1], q)];
		}
		target -= segs[i];
	}
	return pts[pts.length - 1];
};

export const polyLen = (pts: [number, number][]) => {
	let total = 0;
	for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
	return total;
};

export const ptsD = (pts: [number, number][]) => 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L');

/* Signal pulses travelling along a path: one every `every` s between a and b. */
export const Pulses: React.FC<{
	pts: [number, number][];
	t: number;
	a: number;
	b: number;
	every?: number;
	travel?: number;
	color?: string;
	r?: number;
	fade?: (p: number, born: number) => number;
}> = ({pts, t, a, b, every = 0.45, travel = 1.1, color = C.pain, r = 16, fade}) => {
	const out: React.ReactNode[] = [];
	for (let born = a; born < b; born += every) {
		const p = (t - born) / travel;
		if (p < 0 || p > 1) continue;
		const [x, y] = along(pts, p);
		const o = (fade ? fade(p, born) : 1) * Math.min(1, p * 8, (1 - p) * 8);
		out.push(
			<g key={born.toFixed(2)} opacity={o}>
				<circle cx={x} cy={y} r={r * 2.2} fill={color} opacity={0.25} />
				<circle cx={x} cy={y} r={r} fill={color} />
			</g>,
		);
	}
	return <>{out}</>;
};

export type SceneProps = {t: number; sec: Section};
