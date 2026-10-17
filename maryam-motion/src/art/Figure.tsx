import React from 'react';
import {C} from '../constants';
import {Pt} from './geom';

/* Maryam as a posable silhouette. A pose is a set of joints; any two poses morph
   joint by joint, so she can slump, lie down, sit up and stretch without a cut.
   Drawn as an outline pass then a fill pass, which leaves one clean outer edge. */

export type Pose = {
	head: Pt;
	neck: Pt;
	shF: Pt;
	shB: Pt;
	elF: Pt;
	elB: Pt;
	haF: Pt;
	haB: Pt;
	hip: Pt;
	hipF: Pt;
	hipB: Pt;
	knF: Pt;
	knB: Pt;
	ftF: Pt;
	ftB: Pt;
	headR: number;
	torsoW: number;
	/** -1 facing left, 1 facing right, 0 facing camera */
	face: number;
};

const P = (x: number, y: number): Pt => [x, y];

/** Slumped over a desk, facing left; origin at the hip. */
export const DESK_SLUMP: Pose = {
	head: P(-172, -112),
	neck: P(-122, -108),
	shF: P(-96, -104),
	shB: P(-92, -100),
	elF: P(-112, -70),
	elB: P(-98, -72),
	haF: P(-236, -70),
	haB: P(-214, -76),
	hip: P(0, 0),
	hipF: P(0, 0),
	hipB: P(4, -2),
	knF: P(-112, 4),
	knB: P(-104, 0),
	ftF: P(-100, 168),
	ftB: P(-78, 162),
	headR: 40,
	torsoW: 62,
	face: -1,
};

/** Lying on her back in bed, head on the right, phone held up above the face. */
export const LIE_PHONE: Pose = {
	head: P(292, -52),
	neck: P(240, -26),
	shF: P(200, -14),
	shB: P(204, -10),
	elF: P(176, -118),
	elB: P(120, 8),
	haF: P(214, -196),
	haB: P(26, 10),
	hip: P(0, 0),
	hipF: P(0, 0),
	hipB: P(2, 2),
	knF: P(-180, -12),
	knB: P(-176, -4),
	ftF: P(-372, -6),
	ftB: P(-368, 4),
	headR: 42,
	torsoW: 66,
	face: -1,
};

/** Lying still, arms down. */
export const LIE_REST: Pose = {
	...LIE_PHONE,
	head: P(294, -42),
	elF: P(130, 6),
	haF: P(36, 4),
};

/** Sitting cross-legged, facing the camera; origin at the hip centre. */
export const SIT_CALM: Pose = {
	head: P(0, -276),
	neck: P(0, -214),
	shF: P(66, -192),
	shB: P(-66, -192),
	elF: P(104, -104),
	elB: P(-104, -104),
	haF: P(86, -18),
	haB: P(-86, -18),
	hip: P(0, 0),
	hipF: P(40, 0),
	hipB: P(-40, 0),
	knF: P(132, 18),
	knB: P(-132, 18),
	ftF: P(-34, 34),
	ftB: P(34, 34),
	headR: 46,
	torsoW: 104,
	face: 0,
};

/** Morning stretch, arms up. */
export const STRETCH: Pose = {
	...SIT_CALM,
	head: P(6, -280),
	elF: P(122, -276),
	elB: P(-112, -282),
	haF: P(74, -376),
	haB: P(-60, -382),
};

/** The mind sitting up out of the sleeping body, reaching for the gears; relative to the lying hip. */
export const ASTRAL_SIT: Pose = {
	...LIE_REST,
	head: P(46, -306),
	neck: P(30, -250),
	shF: P(30, -228),
	shB: P(24, -224),
	elF: P(96, -250),
	elB: P(84, -196),
	haF: P(132, -330),
	haB: P(150, -262),
};

/** Upper body rotated about the hip (degrees) — sitting up out of a lying pose. */
export const rotateUpper = (pose: Pose, deg: number): Pose => {
	const a = (deg * Math.PI) / 180;
	const [hx, hy] = pose.hip;
	const r = ([x, y]: Pt): Pt => {
		const dx = x - hx;
		const dy = y - hy;
		return [hx + dx * Math.cos(a) - dy * Math.sin(a), hy + dx * Math.sin(a) + dy * Math.cos(a)];
	};
	return {
		...pose,
		head: r(pose.head),
		neck: r(pose.neck),
		shF: r(pose.shF),
		shB: r(pose.shB),
		elF: r(pose.elF),
		elB: r(pose.elB),
		haF: r(pose.haF),
		haB: r(pose.haB),
	};
};

const L = (a: Pt, b: Pt, p: number): Pt => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];
const N = (a: number, b: number, p: number) => a + (b - a) * p;

export const mixPose = (a: Pose, b: Pose, p: number): Pose => {
	const out = {} as Pose;
	(Object.keys(a) as (keyof Pose)[]).forEach((k) => {
		const va = a[k];
		const vb = b[k];
		// @ts-expect-error joint or scalar, same shape on both sides
		out[k] = Array.isArray(va) ? L(va as Pt, vb as Pt, p) : N(va as number, vb as number, p);
	});
	return out;
};

const line = (...pts: Pt[]) => pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' ');

type FigureProps = {
	pose: Pose;
	fill?: string;
	edge?: string;
	edgeW?: number;
	hair?: string;
	opacity?: number;
	filter?: string;
	/** draw only head, neck, torso and arms (for the astral double) */
	upperOnly?: boolean;
	breathe?: number;
};

export const Figure: React.FC<FigureProps> = ({
	pose,
	fill = C.body,
	edge = C.bodyEdge,
	edgeW = 7,
	hair = '#070C24',
	opacity = 1,
	filter,
	upperOnly = false,
	breathe = 0,
}) => {
	const q = pose;
	const r = q.headR;
	const head: Pt = [q.head[0], q.head[1] - breathe * 3];
	const neck: Pt = [q.neck[0], q.neck[1] - breathe * 2];
	// hair: a ponytail behind the head in profile, a long frame around the face from the front
	const side = q.face;
	const front = 1 - Math.abs(side);
	const tail = line([head[0] - side * r * 0.5, head[1] - r * 0.2], [head[0] - side * r * 1.15, head[1] + r * 0.45], [head[0] - side * r * 1.25, head[1] + r * 1.25]);
	const hairL = line([head[0] - r * 0.78, head[1] - r * 0.1], [head[0] - r * 0.95, head[1] + r * 1.3]);
	const hairR = line([head[0] + r * 0.78, head[1] - r * 0.1], [head[0] + r * 0.95, head[1] + r * 1.3]);

	const limbs: {d: string; w: number}[] = [
		{d: line(q.shB, q.elB, q.haB), w: 22},
		...(upperOnly ? [] : [{d: line(q.hipB, q.knB, q.ftB), w: 30}]),
		{d: line(q.hip, neck), w: q.torsoW},
		{d: line(q.shB, q.shF), w: 40},
		...(upperOnly ? [] : [{d: line(q.hipB, q.hipF), w: 56}]),
		{d: line(neck, head), w: 20},
		...(upperOnly ? [] : [{d: line(q.hipF, q.knF, q.ftF), w: 32}]),
		{d: line(q.shF, q.elF, q.haF), w: 23},
	];

	const pass = (color: string, extra: number) => (
		<g stroke={color} fill="none" strokeLinecap="round" strokeLinejoin="round">
			{Math.abs(side) > 0.05 ? <path d={tail} strokeWidth={r * 0.9 * Math.abs(side) + extra} stroke={color === fill ? hair : color} /> : null}
			{front > 0.05 ? (
				<g stroke={color === fill ? hair : color} strokeWidth={r * 0.62 * front + extra}>
					<path d={hairL} />
					<path d={hairR} />
				</g>
			) : null}
			{limbs.map((l, i) => (
				<path key={i} d={l.d} strokeWidth={l.w + extra} />
			))}
			<circle cx={head[0]} cy={head[1]} r={r + extra / 2} fill={color} stroke="none" />
			<circle cx={head[0] - side * r * 0.12} cy={head[1] - r * 0.28} r={r * 0.92 + extra / 2} fill={color === fill ? hair : color} stroke="none" />
		</g>
	);

	return (
		<g opacity={opacity} filter={filter}>
			{pass(edge, edgeW)}
			{pass(fill, 0)}
			{/* a faint inner line keeps the near arm readable against the torso */}
			<path d={line(q.shF, q.elF, q.haF)} stroke={edge} strokeOpacity={0.28} strokeWidth={2} fill="none" strokeLinecap="round" />
		</g>
	);
};
