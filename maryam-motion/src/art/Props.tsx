import React from 'react';
import {C} from '../constants';
import {Draw} from './Draw';
import {Pt, curve, gearD, poly} from './geom';

/* ---------- Brain (side view, front to the left), drawn in a 400×300 box ---------- */
const BRAIN_OUTLINE: Pt[] = [
	[62, 192], [32, 146], [38, 94], [76, 50], [136, 22], [208, 12], [280, 24], [336, 54], [372, 100], [380, 150],
	[364, 192], [334, 214], [346, 238], [322, 268], [274, 272], [244, 252], [214, 244], [176, 240], [118, 236], [80, 222],
];
export const BRAIN_D = curve(BRAIN_OUTLINE, true);
export const BRAIN_STEM_D = curve([[236, 250], [242, 286], [236, 312]]);
export const BRAIN_FOLDS = [
	[[220, 24], [204, 80], [226, 128], [206, 178]],
	[[104, 192], [168, 170], [240, 178], [296, 160]],
	[[88, 72], [122, 100], [100, 142]],
	[[150, 38], [162, 90], [138, 130], [162, 160]],
	[[268, 44], [258, 96], [292, 120], [334, 108]],
	[[344, 146], [312, 168], [334, 192]],
	[[128, 214], [190, 204], [252, 218]],
	[[282, 246], [322, 250]],
	[[276, 260], [316, 262]],
].map((pts) => curve(pts as Pt[]));

export const Brain: React.FC<{p?: number; stroke?: string; fill?: string; w?: number; fold?: number}> = ({
	p = 1,
	stroke = C.ink,
	fill = 'rgba(11,21,54,0.85)',
	w = 5,
	fold = 1,
}) => (
	<g>
		<path d={BRAIN_D} fill={fill} opacity={Math.min(1, p * 1.5)} />
		<Draw d={BRAIN_STEM_D} p={p} stroke={stroke} strokeWidth={w * 2.6} strokeOpacity={0.6} />
		<Draw d={BRAIN_D} p={p} stroke={stroke} strokeWidth={w} />
		{BRAIN_FOLDS.map((d, i) => (
			<Draw key={i} d={d} p={Math.min(1, Math.max(0, fold * 1.4 - i * 0.05))} stroke={stroke} strokeWidth={w * 0.7} strokeOpacity={0.75} />
		))}
	</g>
);

/* ---------- Brain, front view, symmetric, centred on 0,0 (≈ 360 × 270) ---------- */
const HEMI: Pt[] = [[-8, -128], [-62, -140], [-128, -112], [-170, -56], [-178, 12], [-152, 76], [-104, 112], [-44, 120], [-12, 98]];
export const BRAIN_FRONT_L = curve(HEMI);
export const BRAIN_FRONT_R = curve(HEMI.map(([x, y]) => [-x, y] as Pt));
const FOLD_L: Pt[][] = [
	[[-40, -110], [-70, -80], [-46, -46], [-80, -14]],
	[[-120, -84], [-100, -40], [-132, 0], [-110, 40]],
	[[-60, 10], [-36, 48], [-70, 84]],
	[[-150, 30], [-120, 70], [-80, 96]],
];
export const BRAIN_FRONT_FOLDS = [...FOLD_L.map((f) => curve(f)), ...FOLD_L.map((f) => curve(f.map(([x, y]) => [-x, y] as Pt)))];

/* ---------- Analog clock ---------- */
export const Clock: React.FC<{r: number; h: number; m: number; s?: number; stroke?: string; hand?: string; p?: number}> = ({
	r,
	h,
	m,
	s,
	stroke = C.ink,
	hand = C.ink,
	p = 1,
}) => {
	const at = (deg: number, len: number): Pt => [Math.sin((deg * Math.PI) / 180) * len, -Math.cos((deg * Math.PI) / 180) * len];
	return (
		<g>
			<circle r={r} fill="rgba(5,9,24,0.85)" opacity={p} />
			<Draw d={`M0,${-r} A${r},${r} 0 1 1 -0.01,${-r}`} p={p} stroke={stroke} strokeWidth={r * 0.06} />
			{Array.from({length: 12}, (_, i) => {
				const a = at(i * 30, r * 0.86);
				const b = at(i * 30, r * (i % 3 === 0 ? 0.7 : 0.78));
				return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={stroke} strokeWidth={r * 0.035} strokeLinecap="round" opacity={p} />;
			})}
			<g opacity={p} stroke={hand} strokeLinecap="round">
				<line x1={0} y1={0} x2={at(h, r * 0.48)[0]} y2={at(h, r * 0.48)[1]} strokeWidth={r * 0.07} />
				<line x1={0} y1={0} x2={at(m, r * 0.7)[0]} y2={at(m, r * 0.7)[1]} strokeWidth={r * 0.05} />
				{s !== undefined ? <line x1={0} y1={r * 0.12} x2={at(s, r * 0.78)[0]} y2={at(s, r * 0.78)[1]} strokeWidth={r * 0.022} stroke={C.alarm} /> : null}
				<circle r={r * 0.05} fill={hand} stroke="none" />
			</g>
		</g>
	);
};

/* ---------- Seven-segment digits (drawn, not typed, so no font is needed) ---------- */
const SEGS: Record<string, string> = {
	'0': 'abcdef',
	'1': 'bc',
	'2': 'abged',
	'3': 'abgcd',
	'4': 'fgbc',
	'5': 'afgcd',
	'6': 'afgedc',
	'7': 'abc',
	'8': 'abcdefg',
	'9': 'abcfgd',
};
const segPoly = (k: string, w: number, h: number, t: number): string => {
	const hh = h / 2;
	const g = t * 0.25;
	const horiz = (y: number) => poly([[g + t / 2, y], [g + t, y - t / 2], [w - g - t, y - t / 2], [w - g - t / 2, y], [w - g - t, y + t / 2], [g + t, y + t / 2]], true);
	const vert = (x: number, y0: number, y1: number) => poly([[x, y0 + g + t / 2], [x + t / 2, y0 + g + t], [x + t / 2, y1 - g - t], [x, y1 - g - t / 2], [x - t / 2, y1 - g - t], [x - t / 2, y0 + g + t]], true);
	switch (k) {
		case 'a': return horiz(t / 2);
		case 'g': return horiz(hh);
		case 'd': return horiz(h - t / 2);
		case 'f': return vert(t / 2, 0, hh);
		case 'e': return vert(t / 2, hh, h);
		case 'b': return vert(w - t / 2, 0, hh);
		default: return vert(w - t / 2, hh, h); // c
	}
};
export const SevenSeg: React.FC<{text: string; w: number; h: number; color: string; colon?: number; dim?: string}> = ({text, w, h, color, colon = 1, dim = 'rgba(158,255,0,0.08)'}) => {
	const t = w * 0.2;
	let x = 0;
	const out: React.ReactNode[] = [];
	[...text].forEach((ch, i) => {
		if (ch === ':') {
			out.push(
				<g key={i} fill={color} opacity={colon}>
					<circle cx={x + t * 0.8} cy={h * 0.32} r={t * 0.55} />
					<circle cx={x + t * 0.8} cy={h * 0.68} r={t * 0.55} />
				</g>,
			);
			x += t * 1.8;
			return;
		}
		const on = SEGS[ch] ?? '';
		out.push(
			<g key={i} transform={`translate(${x} 0) skewX(-6)`}>
				{'abcdefg'.split('').map((k) => (
					<path key={k} d={segPoly(k, w, h, t)} fill={on.includes(k) ? color : dim} />
				))}
			</g>,
		);
		x += w + t * 0.7;
	});
	return <g>{out}</g>;
};
export const sevenSegWidth = (text: string, w: number) =>
	[...text].reduce((s, ch) => s + (ch === ':' ? w * 0.2 * 1.8 : w + w * 0.2 * 0.7), 0);

/* ---------- Gear ---------- */
export const Gear: React.FC<{r: number; teeth: number; rot: number; stroke?: string; fill?: string; w?: number}> = ({
	r,
	teeth,
	rot,
	stroke = C.neon,
	fill = 'rgba(158,255,0,0.08)',
	w = 4,
}) => (
	<g transform={`rotate(${rot})`}>
		<path d={gearD(r, teeth, r * 0.18)} fill={fill} stroke={stroke} strokeWidth={w} strokeLinejoin="round" />
		<circle r={r * 0.32} fill="none" stroke={stroke} strokeWidth={w} />
		<circle r={r * 0.1} fill={stroke} />
	</g>
);

/* ---------- Icons, stroked line art in a ±50 box ---------- */
export const ICONS: Record<string, string> = {
	chat: 'M-38,-30 H38 Q48,-30 48,-20 V16 Q48,26 38,26 H-6 L-26,44 V26 H-38 Q-48,26 -48,16 V-20 Q-48,-30 -38,-30 Z M-24,-6 H24 M-24,8 H10',
	heart: 'M0,36 C-52,2 -46,-40 -20,-40 C-8,-40 0,-30 0,-22 C0,-30 8,-40 20,-40 C46,-40 52,2 0,36 Z',
	bell: 'M-32,22 V-6 A32,32 0 0 1 32,-6 V22 L42,32 H-42 Z M-10,34 A10,10 0 0 0 10,34 M0,-38 V-46',
	mail: 'M-44,-30 H44 V30 H-44 Z M-44,-30 L0,6 L44,-30',
	calendar: 'M-40,-30 H40 V36 H-40 Z M-40,-12 H40 M-22,-40 V-22 M22,-40 V-22 M-22,6 H-10 M2,6 H14 M-22,22 H-10',
	image: 'M-44,-32 H44 V32 H-44 Z M-44,22 L-14,-6 L8,14 L22,2 L44,22 M20,-14 A8,8 0 1 0 20.1,-14',
	briefcase: 'M-46,-18 H46 V36 H-46 Z M-16,-18 V-32 H16 V-18 M-46,4 H46',
	cart: 'M-48,-30 H-34 L-22,20 H32 L42,-14 H-30 M-16,36 A6,6 0 1 0 -15.9,36 M26,36 A6,6 0 1 0 26.1,36',
	play: 'M-40,-32 H40 Q48,-32 48,-24 V24 Q48,32 40,32 H-40 Q-48,32 -48,24 V-24 Q-48,-32 -40,-32 Z M-10,-14 L16,0 L-10,14 Z',
	clock: 'M0,-40 A40,40 0 1 1 -0.1,-40 M0,-22 V0 L16,10',
	question: 'M-14,-16 A16,16 0 1 1 6,0 Q0,4 0,14 M0,30 V31',
	exclaim: 'M0,-30 V12 M0,28 V29',
	zz: 'M-28,-20 H-4 L-28,8 H-4 M6,4 H26 L6,28 H26',
	money: 'M-46,-26 H46 V26 H-46 Z M0,-12 A12,12 0 1 0 0.1,-12 M-34,-14 V14 M34,-14 V14',
};

export const Icon: React.FC<{name: string; size?: number; stroke?: string; w?: number; card?: string | null}> = ({
	name,
	size = 1,
	stroke = C.ink,
	w = 6,
	card = null,
}) => (
	<g transform={`scale(${size})`}>
		{card ? <rect x={-62} y={-62} width={124} height={124} rx={30} fill={card} stroke={stroke} strokeOpacity={0.35} strokeWidth={3} /> : null}
		<path d={ICONS[name]} fill="none" stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
	</g>
);

/* ---------- Running figure (a light silhouette), feet at 0,0, ~120 tall ---------- */
export const Runner: React.FC<{phase: number; color?: string; w?: number}> = ({phase, color = C.neon, w = 9}) => {
	const s = Math.sin(phase);
	const c = Math.cos(phase);
	const hip: Pt = [0, -58 + Math.abs(c) * 4];
	const sh: Pt = [8, -102 + Math.abs(c) * 4];
	const leg = (k: number): string => {
		const th = k * s * 0.9;
		const knee: Pt = [hip[0] + Math.sin(th) * 30, hip[1] + Math.cos(th) * 30];
		const bend = 0.5 + 0.6 * Math.max(0, -k * c);
		const foot: Pt = [knee[0] + Math.sin(th - bend * 1.4) * 30, knee[1] + Math.cos(th - bend * 1.4) * 30];
		return poly([hip, knee, foot]);
	};
	const arm = (k: number): string => {
		const th = -k * s * 1.0;
		const el: Pt = [sh[0] + Math.sin(th) * 22, sh[1] + Math.cos(th) * 22];
		const ha: Pt = [el[0] + Math.sin(th + 1.4) * 20, el[1] + Math.cos(th + 1.4) * 20];
		return poly([sh, el, ha]);
	};
	return (
		<g stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none">
			<path d={leg(1)} opacity={0.6} />
			<path d={arm(1)} opacity={0.6} />
			<path d={poly([hip, sh])} strokeWidth={w * 1.4} />
			<path d={leg(-1)} />
			<path d={arm(-1)} />
			<circle cx={sh[0] + 6} cy={sh[1] - 18} r={12} fill={color} stroke="none" />
		</g>
	);
};

/* ---------- Phone (screen faces "up" in local space), centred, 72×136 ---------- */
export const Phone: React.FC<{screen?: number; back?: boolean}> = ({screen = 1, back = false}) => (
	<g>
		<rect x={-36} y={-68} width={72} height={136} rx={14} fill="#05070F" stroke={C.ink} strokeWidth={4} />
		{back ? (
			<g>
				<rect x={-24} y={-56} width={26} height={30} rx={8} fill="none" stroke={C.inkDim} strokeWidth={3} />
				<circle cx={-11} cy={-41} r={6} fill="none" stroke={C.inkDim} strokeWidth={3} />
			</g>
		) : (
			<rect x={-30} y={-60} width={60} height={120} rx={9} fill={C.screen} opacity={0.15 + 0.85 * screen} />
		)}
	</g>
);
