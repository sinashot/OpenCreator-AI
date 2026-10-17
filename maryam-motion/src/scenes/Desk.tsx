import React from 'react';
import {C} from '../constants';
import {S, W} from '../data/timeline';
import {DESK_SLUMP, Figure} from '../art/Figure';
import {Pt, curve, poly, scribblePts} from '../art/geom';
import {EASE_IN, EASE_IO, EASE_OUT, cam, clamp, keys, onTwos, ramp} from '../lib/anim';
import {noise1} from '../lib/noise';
import {FA} from '../lib/fonts';

/* 2b → 2c: months pass as a sun/moon time-lapse while Maryam slumps at her desk;
   then the camera dives into her chest, where a knotted neon line won't stay still. */

const HIP: Pt = [720, 885];
const CHEST: Pt = [648, 818];
const ORBIT = {x: 540, y: 760, r: 470};
const MONTHS = ['مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند', 'فروردین', 'اردیبهشت'];
const KNOT = scribblePts('knot', 0, -10, 210, 175, 96, 1.5);
const KNOT_IN = scribblePts('knot-in', 0, -10, 120, 100, 54, 1.7);
const STARS: Pt[] = Array.from({length: 26}, (_, i) => [60 + ((i * 397) % 960), 120 + ((i * 211) % 520)]);

const Sun: React.FC<{x: number; y: number; o: number}> = ({x, y, o}) => (
	<g transform={`translate(${x} ${y})`} opacity={o}>
		<circle r={90} fill="#FFD27A" opacity={0.12} />
		<circle r={34} fill="#FFD27A" />
		{Array.from({length: 10}, (_, i) => {
			const a = (i / 10) * Math.PI * 2;
			return <line key={i} x1={Math.cos(a) * 46} y1={Math.sin(a) * 46} x2={Math.cos(a) * 62} y2={Math.sin(a) * 62} stroke="#FFD27A" strokeWidth={5} strokeLinecap="round" />;
		})}
	</g>
);

const Moon: React.FC<{x: number; y: number; o: number}> = ({x, y, o}) => (
	<g transform={`translate(${x} ${y})`} opacity={o}>
		<circle r={80} fill="#CFE0FF" opacity={0.08} />
		<path d="M10,-34 A34,34 0 1 0 10,34 A26,26 0 1 1 10,-34 Z" fill="#D8E6FF" />
	</g>
);

export const Desk: React.FC<{t: number}> = ({t}) => {
	if (t < S('2b') - 0.25 || t > S('3a') + 0.3) return null;

	// whip in from below
	const enter = ramp(t, S('2b') - 0.2, S('2b') + 0.32, EASE_OUT);
	const blurring = enter > 0.02 && enter < 0.97;

	// camera: settle, then dive into the chest (exponential zoom so the speed feels even)
	const [fx0, fy0, s0] = keys(t, [
		{t: S('2b'), v: [560, 760, 1.0]},
		{t: S('2c'), v: [590, 770, 1.06], ease: (x) => x},
	]);
	const dive = ramp(t, S('2c') + 0.02, S('2c') + 0.75, EASE_IO);
	const drift = ramp(t, S('2c') + 0.75, S('3a'), (x) => x);
	const zoom = s0 * Math.pow(7.2 / s0, dive) * (1 + 0.06 * drift);
	const fx = fx0 + (CHEST[0] - fx0) * Math.min(1, dive * 1.15);
	const fy = fy0 + (CHEST[1] - fy0) * Math.min(1, dive * 1.15);
	const props = 1 - ramp(zoom, 1.6, 3.2, (x) => x);

	// time-lapse: one day = sun across, then moon across
	const P = 0.78;
	const lapse = Math.max(0, t - (S('2b') + 0.15));
	const day = Math.floor(lapse / P);
	const frac = (lapse / P) % 1;
	const half = frac < 0.5 ? frac / 0.5 : (frac - 0.5) / 0.5;
	const th = Math.PI + half * Math.PI;
	const bx = ORBIT.x + ORBIT.r * Math.cos(th);
	const by = ORBIT.y + ORBIT.r * Math.sin(th);
	const edgeFade = Math.sin(half * Math.PI) ** 0.6;
	const isSun = frac < 0.5;
	const lapseOn = ramp(t, S('2b'), S('2b') + 0.3) * (1 - ramp(t, S('2c'), S('2c') + 0.3));
	const flip = clamp((lapse % P) / 0.14);

	// chest knot: in "screen units", shrunk into the chest so the dive finds it
	const knotOn = ramp(zoom, 3, 5.5, (x) => x);
	const jitterAmp = 4 + 7 * ramp(t, W('2c', 9), W('2c', 10) + 0.2);
	const jk = onTwos(t, 24);
	const jx = noise1(jk * 9, 'jx') * jitterAmp;
	const jy = noise1(jk * 9, 'jy') * jitterAmp;
	const knotDraw = ramp(t, S('2c') + 0.45, W('2c', 4) + 0.2, EASE_IO);
	const waveDraw = ramp(t, S('2c') + 0.35, W('2c', 3), EASE_IO);
	const wk = onTwos(t, 12);
	const wave: Pt[] = [];
	for (let x = 640; x >= -640; x -= 14) {
		const spike = noise1(x * 0.05 + wk * 4, 'spk') > 0.55 ? noise1(x * 0.3 + wk, 'sp2') * 120 : 0;
		const amp = Math.abs(x) < 220 ? 0.2 : 1;
		wave.push([x, (noise1(x * 0.022 - t * 2.2, 'wv') * 46 + spike) * amp]);
	}
	const boilK = onTwos(t);
	const knotPts = KNOT.map((p, i) => [p[0] + noise1(boilK * 5 + i * 0.3, 'kx') * 5, p[1] + noise1(boilK * 5 + i * 0.3, 'ky') * 5] as Pt);
	const burst = ramp(t, S('3a') - 0.1, S('3a') + 0.08, EASE_IN);
	const exit = ramp(t, S('3a') - 0.02, S('3a') + 0.22, (x) => x);

	return (
		<g transform={`translate(0 ${1500 * (1 - enter)})`} filter={blurring ? 'url(#whipV)' : undefined} opacity={1 - exit}>
			<g transform={cam(fx, fy, zoom)}>
				{/* sky and time-lapse */}
				<g opacity={lapseOn * props}>
					<circle cx={ORBIT.x} cy={ORBIT.y} r={ORBIT.r} fill="none" stroke={C.inkDim} strokeWidth={2} strokeDasharray="4 14" opacity={0.35} />
					{STARS.map(([x, y], i) => (
						<circle key={i} cx={x} cy={y} r={2.2} fill="#CFE0FF" opacity={(isSun ? 0.1 : 0.7) * (0.5 + 0.5 * Math.sin(t * 9 + i))} />
					))}
					{isSun ? <Sun x={bx} y={by} o={edgeFade} /> : <Moon x={bx} y={by} o={edgeFade} />}
				</g>

				{/* room */}
				<g opacity={props}>
					<line x1={-200} y1={1060} x2={1300} y2={1060} stroke={C.inkDim} strokeWidth={3} opacity={0.6} />
					<g transform="translate(300 540)">
						<rect x={-80} y={-70} width={160} height={176} rx={12} fill="#0E173D" stroke={C.ink} strokeWidth={4} />
						<rect x={-80} y={-70} width={160} height={40} rx={10} fill={C.alarm} opacity={0.75} />
						{[-40, 0, 40].map((x) => (
							<line key={x} x1={x} y1={-82} x2={x} y2={-58} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
						))}
						<g transform={`scale(1 ${flip < 1 ? 1 - flip : 1})`} style={{transformOrigin: '0px -30px'}}>
							<text
								x={0}
								y={36}
								textAnchor="middle"
								direction="rtl"
								fontFamily={FA}
								fontWeight={800}
								fontSize={34}
								fill={C.ink}
							>
								{MONTHS[day % MONTHS.length]}
							</text>
						</g>
						<g fill={C.inkDim} opacity={0.6}>
							{Array.from({length: 12}, (_, i) => (
								<circle key={i} cx={-54 + (i % 6) * 21.6} cy={70 + Math.floor(i / 6) * 18} r={3} />
							))}
						</g>
					</g>
					{/* desk, laptop, mug, chair */}
					<rect x={150} y={812} width={500} height={18} rx={4} fill="#121C44" stroke={C.ink} strokeWidth={4} />
					<line x1={178} y1={830} x2={178} y2={1060} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
					<line x1={622} y1={830} x2={622} y2={1060} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
					<rect x={430} y={830} width={180} height={70} fill="#0C1434" stroke={C.ink} strokeWidth={4} />
					<line x1={490} y1={865} x2={550} y2={865} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
					<path d="M262,808 L244,700 L404,690 L424,808 Z" fill="#0A1230" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
					<path d="M256,796 L242,712 L398,704 L414,796 Z" fill={C.screen} opacity={0.12 + 0.05 * Math.sin(t * 5)} />
					<line x1={236} y1={810} x2={440} y2={810} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
					<path d="M182,770 h44 v40 h-44 Z M226,780 q18,4 0,22" fill="#0A1230" stroke={C.ink} strokeWidth={4} />
					<path d="M650,895 H806 M806,895 V690 M650,895 L660,1060 M796,895 L790,1060" stroke={C.ink} strokeWidth={9} strokeLinecap="round" fill="none" />
					<rect x={792} y={690} width={28} height={130} rx={10} fill="#0C1434" stroke={C.ink} strokeWidth={4} />
				</g>

				{/* Maryam, slumped */}
				<g transform={`translate(${HIP[0]} ${HIP[1]})`} opacity={1 - 0.55 * (1 - props)}>
					<Figure pose={DESK_SLUMP} breathe={Math.sin(t * 1.4) * 0.6} edge={C.bodyEdge} />
				</g>
				{/* a faint green flicker in the chest before we dive in */}
				<circle cx={CHEST[0]} cy={CHEST[1]} r={16} fill="url(#glowNeonDisc)" opacity={ramp(t, S('2b') + 1.5, S('2c')) * (0.6 + 0.4 * Math.sin(t * 11)) * props} />

				{/* inside the chest */}
				{knotOn > 0.001 ? (
					<g transform={`translate(${CHEST[0]} ${CHEST[1]}) scale(${1 / 7.2})`} opacity={knotOn}>
						<circle r={330} fill="url(#glowNeonDisc)" opacity={0.25 + 0.6 * burst} />
						<path d={poly(wave)} fill="none" stroke={C.neon} strokeWidth={6} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - waveDraw} filter="url(#glowGreen)" opacity={0.9} />
						<g transform={`translate(${jx} ${jy}) scale(${1 + 0.35 * burst})`} filter="url(#glowGreen)">
							<path d={curve(knotPts)} fill="none" stroke={C.neon} strokeWidth={5.5} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - knotDraw} />
							<path d={curve(KNOT_IN)} fill="none" stroke="#E9FFC2" strokeWidth={3} opacity={0.7 * knotDraw} transform={`rotate(${t * 40})`} />
						</g>
					</g>
				) : null}
			</g>
		</g>
	);
};

