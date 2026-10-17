import React from 'react';
import {C} from '../constants';
import {S, W} from '../data/timeline';
import {Draw} from '../art/Draw';
import {BRAIN_FRONT_FOLDS, BRAIN_FRONT_L, BRAIN_FRONT_R} from '../art/Props';
import {Pt} from '../art/geom';
import {EASE_IN, EASE_IO, cam, ramp, springAt} from '../lib/anim';
import {rand} from '../lib/noise';

/* 6b → 6d: the room dissolves into deep navy; the morning sun travels up and becomes
   the glow of a calm, balanced brain; a halo forms; a question mark lights above it
   and stays with the last line to the final frame. */

const BRAIN_C: Pt = [540, 600];
const SUN_FROM: Pt = [354, 385];
const DUST: Pt[] = Array.from({length: 40}, (_, i) => [rand(`dx${i}`) * 1080, 120 + rand(`dy${i}`) * 940]);
const QMARK = 'M-40,-44 C-40,-96 40,-100 42,-50 C44,-12 0,-8 0,30 L0,44';

export const Calm: React.FC<{t: number}> = ({t}) => {
	if (t < S('6b') - 0.2) return null;

	const z0 = ramp(t, S('6b') - 0.2, S('6c'), (x) => x);
	const z1 = ramp(t, S('6c'), S('6d') + 0.4, EASE_IO);
	const z2 = ramp(t, S('6d') + 0.4, S('6d') + 2.4, (x) => x);
	const zoom = 0.94 + 0.06 * z0 + 0.12 * z1 + 0.025 * z2;

	// the sun carries over from the window and becomes the brain's glow
	const carry = ramp(t, S('6b') - 0.15, S('6b') + 0.95, EASE_IO);
	const sunX = SUN_FROM[0] + (BRAIN_C[0] - SUN_FROM[0]) * carry;
	const sunY = SUN_FROM[1] + (BRAIN_C[1] - SUN_FROM[1]) * carry;
	const sunR = 52 * (1 - ramp(t, S('6b') + 0.7, S('6b') + 1.4, EASE_IN));
	const glow = ramp(t, S('6b') + 0.6, S('6b') + 1.6);
	const breath = 0.5 - 0.5 * Math.cos(((t - S('6b')) * Math.PI * 2) / 3.6);

	const brainP = ramp(t, S('6b') + 0.55, W('6b', 6) + 0.2, EASE_IO);
	const foldP = ramp(t, W('6b', 3), W('6b', 9), EASE_IO);
	const halo = ramp(t, S('6c') + 0.05, W('6c', 4) + 0.2, EASE_IO);
	const qDraw = ramp(t, S('6d') + 0.05, S('6d') + 0.75, EASE_IO);
	const qDot = springAt(t, S('6d') + 0.7, {stiffness: 160, damping: 15});
	const qPulse = 0.75 + 0.25 * Math.sin((t - S('6d')) * 3.2);

	return (
		<g transform={cam(BRAIN_C[0], BRAIN_C[1] + 20, zoom, 0, 540, 660)}>
			{/* slow dust for depth */}
			{DUST.map(([x, y], i) => (
				<circle
					key={i}
					cx={x}
					cy={y - (t - S('6b')) * (6 + (i % 5) * 3)}
					r={1.6 + (i % 3)}
					fill={i % 4 ? C.lavender : C.gold}
					opacity={0.35 * glow * (0.5 + 0.5 * Math.sin(t * 1.3 + i))}
				/>
			))}
			<circle cx={BRAIN_C[0]} cy={BRAIN_C[1]} r={360 + 30 * breath} fill="url(#haloLav)" opacity={glow} />
			<circle cx={BRAIN_C[0]} cy={BRAIN_C[1]} r={250 + 20 * breath} fill="url(#lampWarm)" opacity={glow * 0.55} />
			{sunR > 0.5 ? <circle cx={sunX} cy={sunY} r={sunR} fill={C.gold} filter="url(#glowGold)" opacity={0.95} /> : null}

			{/* halo rings */}
			<g transform={`translate(${BRAIN_C[0]} ${BRAIN_C[1]})`}>
				<g transform={`rotate(${-90 + (t - S('6c')) * 6})`}>
					<Draw d="M250,0 A250,250 0 1 1 -250,0 A250,250 0 1 1 250,0" p={halo} stroke={C.gold} strokeWidth={4} strokeOpacity={0.85} filter="url(#glowGold)" />
				</g>
				<g transform={`rotate(${90 - (t - S('6c')) * 4})`}>
					<Draw d="M292,0 A292,292 0 1 1 -292,0 A292,292 0 1 1 292,0" p={halo * 0.999} stroke={C.lavender} strokeWidth={2.5} strokeOpacity={0.7} strokeDasharray={halo >= 1 ? '3 13' : undefined} />
				</g>

				{/* the calm brain, symmetric */}
				<g transform={`scale(${1.12 + 0.02 * breath})`} filter="url(#glowLav)">
					<path d={`${BRAIN_FRONT_L} L-8,-128 Z`} fill="rgba(14,22,62,0.75)" opacity={brainP} />
					<path d={`${BRAIN_FRONT_R} L8,-128 Z`} fill="rgba(14,22,62,0.75)" opacity={brainP} />
					<Draw d={BRAIN_FRONT_L} p={brainP} stroke={C.lavender} strokeWidth={6} />
					<Draw d={BRAIN_FRONT_R} p={brainP} stroke={C.lavender} strokeWidth={6} />
					<Draw d="M0,-118 C-6,-60 6,0 0,96" p={brainP} stroke={C.gold} strokeWidth={4} />
					{BRAIN_FRONT_FOLDS.map((d, i) => (
						<Draw key={i} d={d} p={foldP} stroke={i % 4 === 0 ? C.gold : C.lavender} strokeWidth={4} strokeOpacity={0.8} />
					))}
				</g>
			</g>

			{/* the question */}
			{qDraw > 0 ? (
				<g transform={`translate(${BRAIN_C[0]} ${BRAIN_C[1] - 285})`} filter="url(#glowGold)" opacity={qPulse}>
					<circle r={120} fill="url(#lampWarm)" opacity={0.6 * qDraw} />
					<Draw d={QMARK} p={qDraw} stroke="#FFE7BF" strokeWidth={15} />
					<circle cx={0} cy={80} r={11 * qDot} fill="#FFE7BF" />
				</g>
			) : null}
		</g>
	);
};

