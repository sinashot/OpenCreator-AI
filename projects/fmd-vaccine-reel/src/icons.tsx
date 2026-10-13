/*
 * Line-art icons for the reel, drawn as SVG groups (no text inside).
 * Each takes a centre (x, y), a size s (≈ px across) and colours.
 */
import React from 'react';
import {C} from './kit';

type P = {x: number; y: number; s: number; color?: string; fill?: string; rot?: number; opacity?: number; sw?: number};
const G: React.FC<P & {children: React.ReactNode}> = ({x, y, s, rot = 0, opacity = 1, children}) => (
	<g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s / 100}) translate(-50 -50)`} opacity={opacity}>
		{children}
	</g>
);

/* FMD virus: an icosahedral capsid (picornavirus) with surface knobs. */
export const Virus: React.FC<P & {knobs?: number; variant?: number}> = (p) => {
	const {color = C.red, fill = 'rgba(255,93,108,0.12)', sw = 2.6, knobs = 12, variant = 0} = p;
	const ring = Array.from({length: 6}, (_, i) => {
		const a = (Math.PI / 3) * i - Math.PI / 2;
		return [50 + 30 * Math.cos(a), 50 + 30 * Math.sin(a)];
	});
	const inner = Array.from({length: 3}, (_, i) => {
		const a = ((Math.PI * 2) / 3) * i - Math.PI / 2 + Math.PI / 3;
		return [50 + 14 * Math.cos(a), 50 + 14 * Math.sin(a)];
	});
	return (
		<G {...p}>
			<circle cx={50} cy={50} r={36} fill={fill} stroke={color} strokeWidth={sw} />
			<polygon points={ring.map((q) => q.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={sw * 0.6} opacity={0.8} />
			<polygon points={inner.map((q) => q.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={sw * 0.6} opacity={0.8} />
			{ring.map((q, i) => (
				<line key={i} x1={q[0]} y1={q[1]} x2={inner[Math.floor(i / 2) % 3][0]} y2={inner[Math.floor(i / 2) % 3][1]} stroke={color} strokeWidth={sw * 0.45} opacity={0.7} />
			))}
			{Array.from({length: knobs}, (_, i) => {
				const a = ((Math.PI * 2) / knobs) * i;
				const x1 = 50 + 36 * Math.cos(a);
				const y1 = 50 + 36 * Math.sin(a);
				const x2 = 50 + 45 * Math.cos(a);
				const y2 = 50 + 45 * Math.sin(a);
				return (
					<g key={i}>
						<line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={sw} strokeLinecap="round" />
						{variant === 0 && <circle cx={x2} cy={y2} r={3.6} fill={color} />}
						{variant === 1 && <rect x={x2 - 3.2} y={y2 - 3.2} width={6.4} height={6.4} fill={color} transform={`rotate(${(a * 180) / Math.PI} ${x2} ${y2})`} />}
						{variant === 2 && <polygon points={`${x2},${y2 - 4.5} ${x2 + 4},${y2 + 3} ${x2 - 4},${y2 + 3}`} fill={color} />}
					</g>
				);
			})}
		</G>
	);
};

/* Antibody (IgG): a Y with light chains. */
export const Antibody: React.FC<P> = (p) => {
	const {color = C.cyan, sw = 6} = p;
	return (
		<G {...p}>
			<path d="M50 92 V54 M50 54 L24 22 M50 54 L76 22" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
			<path d="M38 50 L18 26 M62 50 L82 26" stroke={color} strokeWidth={sw * 0.55} strokeLinecap="round" fill="none" opacity={0.75} />
			<circle cx={50} cy={54} r={sw * 0.6} fill={color} />
		</G>
	);
};

/* Cow head, front view. */
export const Cow: React.FC<P> = (p) => {
	const {color = C.white, fill = 'rgba(234,246,255,0.06)', sw = 3} = p;
	return (
		<G {...p}>
			<path d="M33 26 Q22 14 12 18 Q20 22 26 30" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />
			<path d="M67 26 Q78 14 88 18 Q80 22 74 30" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />
			<ellipse cx={18} cy={38} rx={13} ry={6} transform="rotate(-18 18 38)" fill={fill} stroke={color} strokeWidth={sw} />
			<ellipse cx={82} cy={38} rx={13} ry={6} transform="rotate(18 82 38)" fill={fill} stroke={color} strokeWidth={sw} />
			<path d="M30 26 Q50 18 70 26 Q77 50 70 70 L30 70 Q23 50 30 26 Z" fill={fill} stroke={color} strokeWidth={sw} strokeLinejoin="round" />
			<path d="M54 26 Q64 30 62 40 Q55 44 52 36 Q48 30 54 26 Z" fill={color} opacity={0.55} />
			<circle cx={40} cy={44} r={3.2} fill={color} />
			<circle cx={60} cy={44} r={3.2} fill={color} />
			<ellipse cx={50} cy={74} rx={21} ry={13} fill={fill} stroke={color} strokeWidth={sw} />
			<ellipse cx={42} cy={74} rx={3.5} ry={4.5} fill={color} />
			<ellipse cx={58} cy={74} rx={3.5} ry={4.5} fill={color} />
		</G>
	);
};

export const Shield: React.FC<P & {check?: number}> = (p) => {
	const {color = C.teal, fill = 'rgba(25,195,180,0.16)', sw = 4, check = 0} = p;
	return (
		<G {...p}>
			<path d="M50 6 L86 19 V47 Q86 76 50 94 Q14 76 14 47 V19 Z" fill={fill} stroke={color} strokeWidth={sw} strokeLinejoin="round" />
			{check > 0 && (
				<path d="M33 50 L45 62 L68 37" stroke={color} strokeWidth={sw * 1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - check} />
			)}
		</G>
	);
};

/* Vaccine vial with liquid level 0..1. */
export const Vial: React.FC<P & {level?: number; shimmer?: number}> = (p) => {
	const {color = C.cyan, sw = 3.5, level = 0.62, shimmer = 0} = p;
	const top = 34 + (1 - level) * 54;
	return (
		<G {...p}>
			<rect x={34} y={4} width={32} height={14} rx={3} fill={color} opacity={0.85} />
			<rect x={38} y={18} width={24} height={8} fill="none" stroke={color} strokeWidth={sw} />
			<path d={`M30 26 H70 V88 Q70 96 62 96 H38 Q30 96 30 88 Z`} fill="rgba(95,225,255,0.06)" stroke={color} strokeWidth={sw} />
			<path d={`M32 ${top} Q50 ${top - 4 + 4 * Math.sin(shimmer)} 68 ${top} V88 Q68 94 62 94 H38 Q32 94 32 88 Z`} fill={C.teal} opacity={0.55} />
			<rect x={36} y={50} width={28} height={22} rx={2} fill={C.white} opacity={0.85} />
			<path d="M41 61 H59 M50 54 V68" stroke={C.teal} strokeWidth={3.4} strokeLinecap="round" />
		</G>
	);
};

export const Syringe: React.FC<P & {push?: number}> = (p) => {
	const {color = C.cyan, sw = 3.5, push = 0} = p;
	const px = 6 + push * 22;
	return (
		<G {...p}>
			<path d="M24 42 H74 V58 H24 Z" fill="rgba(95,225,255,0.08)" stroke={color} strokeWidth={sw} />
			<rect x={24 + push * 22} y={44} width={50 - push * 22} height={12} fill={C.teal} opacity={0.6} />
			<path d={`M${px} 50 H${24 + push * 22}`} stroke={color} strokeWidth={sw} />
			<path d={`M${px} 38 V62`} stroke={color} strokeWidth={sw * 1.4} strokeLinecap="round" />
			<path d="M74 46 H82 V54 H74 M82 50 H98" stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />
			<path d="M34 42 V48 M44 42 V50 M54 42 V48 M64 42 V50" stroke={color} strokeWidth={sw * 0.6} />
			<path d="M20 34 V66" stroke={color} strokeWidth={sw} strokeLinecap="round" />
		</G>
	);
};

export const Magnifier: React.FC<P> = (p) => {
	const {color = C.white, sw = 6} = p;
	return (
		<G {...p}>
			<circle cx={42} cy={42} r={28} fill="rgba(234,246,255,0.08)" stroke={color} strokeWidth={sw} />
			<path d="M62 62 L90 90" stroke={color} strokeWidth={sw * 1.8} strokeLinecap="round" />
			<path d="M28 34 Q32 24 42 22" stroke={color} strokeWidth={sw * 0.5} strokeLinecap="round" fill="none" opacity={0.6} />
		</G>
	);
};

export const Lock: React.FC<P> = (p) => {
	const {color = C.amber, sw = 5} = p;
	return (
		<G {...p}>
			<path d="M32 44 V32 Q32 14 50 14 Q68 14 68 32 V44" stroke={color} strokeWidth={sw} fill="none" />
			<rect x={22} y={44} width={56} height={44} rx={8} fill="rgba(255,194,75,0.15)" stroke={color} strokeWidth={sw} />
			<circle cx={50} cy={62} r={6} fill={color} />
			<path d="M50 64 V76" stroke={color} strokeWidth={sw} strokeLinecap="round" />
		</G>
	);
};

export const Coins: React.FC<P> = (p) => {
	const {color = C.amber, sw = 3.5} = p;
	return (
		<G {...p}>
			{[0, 1, 2, 3].map((i) => (
				<ellipse key={i} cx={50} cy={76 - i * 14} rx={30} ry={9} fill="rgba(255,194,75,0.18)" stroke={color} strokeWidth={sw} />
			))}
		</G>
	);
};

/* Double helix, phase in radians. */
export const Helix: React.FC<{x: number; y: number; len: number; amp: number; phase: number; color?: string; opacity?: number; vertical?: boolean}> = ({
	x,
	y,
	len,
	amp,
	phase,
	color = C.cyan,
	opacity = 1,
	vertical = true,
}) => {
	const n = 40;
	const pts = (off: number) =>
		Array.from({length: n + 1}, (_, i) => {
			const u = i / n;
			const a = u * Math.PI * 4 + phase + off;
			const d = amp * Math.sin(a);
			return vertical ? [x + d, y + u * len] : [x + u * len, y + d];
		});
	const A = pts(0);
	const B = pts(Math.PI);
	return (
		<g opacity={opacity}>
			{A.map((q, i) =>
				i % 3 === 0 ? <line key={i} x1={q[0]} y1={q[1]} x2={B[i][0]} y2={B[i][1]} stroke={color} strokeWidth={2} opacity={0.45} /> : null,
			)}
			<polyline points={A.map((q) => q.join(',')).join(' ')} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
			<polyline points={B.map((q) => q.join(',')).join(' ')} fill="none" stroke={C.teal} strokeWidth={4} strokeLinecap="round" />
		</g>
	);
};
