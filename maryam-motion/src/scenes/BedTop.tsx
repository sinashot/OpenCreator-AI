import React from 'react';
import {C} from '../constants';
import {S, W} from '../data/timeline';
import {Draw} from '../art/Draw';
import {Clock, Runner, SevenSeg} from '../art/Props';
import {Pt, along, circlePts, curve, lemniscatePts, lerpPts, scribblePts} from '../art/geom';
import {EASE_CAM, EASE_IN, EASE_IO, EASE_OUT, cam, clamp, keys, onTwos, ramp, springAt} from '../lib/anim';
import {noise1} from '../lib/noise';

/* Scene 1 → 2a, seen from above: Maryam awake at 02:00, the mind starting to run,
   then the clock turning into an endless loop and a battery in the red.
   Leaves with a vertical whip into the desk scene (2b). */

const FACE: Pt = [480, 650];
const CLOCK_C: Pt = [480, 262];
const LOOP_C: Pt = [480, 330];
const N = 160;
const CIRCLE = circlePts(CLOCK_C[0], CLOCK_C[1], 100, N, 0);
const LEMNI = lemniscatePts(LOOP_C[0], LOOP_C[1], 290, N);
const TANGLE_A = scribblePts('tangle-a', 480, 262, 300, 185, 64);
const TANGLE_B = scribblePts('tangle-b', 470, 270, 250, 150, 44, 1.2);

const boil = (pts: Pt[], t: number, amp: number, seed: string): Pt[] => {
	const k = onTwos(t);
	return pts.map((p, i) => [p[0] + noise1(k * 7 + i * 0.37, seed + 'x') * amp, p[1] + noise1(k * 7 + i * 0.41, seed + 'y') * amp]);
};

/** Bump 0→1→0: in over [a,b], out over [b,c]. */
const bump = (t: number, a: number, b: number, c: number) => ramp(t, a, b, EASE_IN) * (1 - ramp(t, b, c, EASE_OUT));

const Eye: React.FC<{x: number; y: number; lid: number; look: Pt; id: string}> = ({x, y, lid, look, id}) => {
	const almond = 'M-46,0 Q0,-60 46,0 Q0,48 -46,0 Z';
	return (
		<g transform={`translate(${x} ${y})`}>
			<clipPath id={id}>
				<path d={almond} />
			</clipPath>
			<path d={almond} fill="#D9E3F4" />
			<g clipPath={`url(#${id})`}>
				<circle cx={look[0]} cy={look[1]} r={17} fill="#0A1230" stroke={C.screen} strokeWidth={3} />
				<circle cx={look[0]} cy={look[1]} r={7} fill="#02040A" />
				<circle cx={look[0] - 5} cy={look[1] - 6} r={4} fill="#FFFFFF" />
				<circle cx={look[0] + 8} cy={look[1] + 3} r={2.4} fill={C.neon} opacity={0.9} />
				{/* the heavy upper lid */}
				<path d={`M-52,-44 L52,-44 L52,0 L46,0 Q0,${2 * lid} -46,0 L-52,0 Z`} fill="#1E2C5C" />
			</g>
			<path d={`M-49,1 Q0,${2 * lid} 49,1`} fill="none" stroke="#04071A" strokeWidth={6} strokeLinecap="round" />
			<path d="M-44,3 Q0,26 44,3" fill="none" stroke="#3A4B80" strokeWidth={2} />
			<path d="M-40,24 Q0,42 40,24" fill="none" stroke="#4A5C94" strokeWidth={3} opacity={0.55} />
		</g>
	);
};

export const BedTop: React.FC<{t: number}> = ({t}) => {
	if (t > S('2b') + 0.6) return null;

	const [fx, fy, s] = keys(t, [
		{t: 0, v: [520, 660, 1.0]},
		{t: S('1b'), v: [514, 640, 1.05], ease: (x) => x},
		{t: S('1b') + 1.0, v: [480, 425, 1.12], ease: EASE_CAM},
		{t: S('2a'), v: [480, 418, 1.13], ease: (x) => x},
		{t: S('2a') + 0.8, v: [480, 430, 1.1], ease: EASE_CAM},
		{t: S('2b'), v: [480, 420, 1.12], ease: (x) => x},
	]);
	// whip out: the whole bed world tilts up and away, with vertical motion blur
	const whip = ramp(t, S('2b') - 0.18, S('2b') + 0.28, EASE_IN);
	const blurring = whip > 0.02 && whip < 0.98;

	// eyes: tired, half-lidded, one heavy slow blink on «چشماش از خستگی سنگین بود»
	const lid = -12 + 36 * bump(t, W('1b', 2) + 0.05, W('1b', 3) + 0.15, W('1b', 4) + 0.2) + 6 * ramp(t, W('1b', 3), W('1b', 4) + 0.4);
	const lookK = onTwos(t, 6);
	const look: Pt = [noise1(lookK * 3, 'sacc-x') * 4, noise1(lookK * 3, 'sacc-y') * 2.5 - 2];

	// digital clock: 02:00, colon blinks every second, digits flash like an alarm
	const colon = Math.floor(t * 2) % 2 === 0 ? 1 : 0.15;
	const flash = t < S('1b') + 0.4 ? (Math.floor(t * 3) % 3 === 2 ? 0.35 : 1) : 0.85;
	const clockIn = springAt(t, 0.15);

	// the mind starts running: scribble cloud above the head
	const tangleIn = ramp(t, W('1b', 6) - 0.25, W('1b', 8), EASE_IO);
	const tangleOut = ramp(t, S('2a') - 0.05, S('2a') + 0.7, EASE_IN);
	const tangleP = tangleIn * (1 - tangleOut);

	// the clock inside the cloud — a wheel she runs on, faster and faster
	const wheelIn = springAt(t, W('1b', 8) - 0.05, {stiffness: 120, damping: 15});
	const t0 = W('1b', 8);
	const dt = Math.max(0, t - t0);
	const wheelRot = -(dt * 150 + Math.max(0, t - W('1b', 10)) ** 2 * 120);
	const stride = 2 + 2.2 * ramp(t, W('1b', 10), W('1b', 13));
	const runPhase = dt * Math.PI * 2 * stride;

	// 2a: the wheel's rim becomes ∞ and she keeps running along it
	const morph = ramp(t, S('2a') + 0.15, S('2a') + 1.05, EASE_IO);
	const loopPts = lerpPts(CIRCLE, LEMNI, morph);
	const sLoop = 0.75 + Math.max(0, t - (S('2a') + 0.15)) ** 1.15 * 0.28;
	const onLoop = along(loopPts, sLoop);
	const runnerAt = morph > 0 ? onLoop : {x: CLOCK_C[0], y: CLOCK_C[1] - 100, a: 0};
	const runnerRot = morph > 0 ? (onLoop.a * 180) / Math.PI : 0;
	const loopGlow = ramp(t, S('2a') + 0.4, S('2a') + 1.2);

	// battery drops in on «باز هم», drains on «خستگی», shakes on «بیدار شم»
	const batIn = springAt(t, W('2a', 3) - 0.05);
	const level = 0.24 - 0.16 * ramp(t, W('2a', 7), W('2a', 7) + 0.5);
	const batBlink = t > W('2a', 7) ? (Math.floor(t * 6) % 2 === 0 ? 1 : 0.35) : 1;
	const shake = Math.sin(t * 70) * 9 * (ramp(t, W('2a', 8), W('2a', 8) + 0.05) * (1 - ramp(t, W('2a', 8) + 0.05, W('2a', 9) + 0.2)));

	const tangleA = curve(boil(TANGLE_A, t, 3, 'ta'));
	const tangleB = curve(boil(TANGLE_B, t, 3, 'tb'));

	return (
		<g transform={`translate(0 ${-1500 * whip})`} filter={blurring ? 'url(#whipV)' : undefined}>
			<g transform={cam(fx, fy, s)}>
				{/* bed sheet, pillow, nightstand */}
				<rect x={30} y={250} width={920} height={1800} rx={40} fill="#0A1230" stroke="#1B2650" strokeWidth={3} />
				<rect x={120} y={360} width={720} height={600} rx={150} fill="#0F1839" stroke="#25335F" strokeWidth={3} />
				<path d="M170,470 Q300,420 470,445 M520,452 Q650,430 790,480" stroke="#1D2A55" strokeWidth={3} fill="none" />
				<rect x={846} y={560} width={260} height={300} rx={22} fill="#0B1331" stroke="#24325F" strokeWidth={3} />
				<circle cx={952} cy={690} r={200} fill="url(#glowNeonDisc)" opacity={0.22 * clockIn} />
				<g transform={`translate(872 652) scale(${0.78 + 0.12 * clockIn})`} opacity={clockIn}>
					<rect x={0} y={0} width={176} height={86} rx={16} fill="#03050D" stroke="#2A3866" strokeWidth={3} />
					<g transform="translate(16 20)" opacity={flash} filter="url(#glowGreen)">
						<SevenSeg text="02:00" w={26} h={46} color={C.neon} colon={colon} />
					</g>
				</g>

				{/* hair spread on the pillow, then the face */}
				<ellipse cx={480} cy={612} rx={248} ry={288} fill="#070C22" />
				{[
					'M330,470 C250,520 220,640 250,760',
					'M300,560 C220,640 230,760 300,860',
					'M630,470 C710,520 740,640 710,760',
					'M660,560 C740,640 730,760 660,860',
					'M380,380 C320,350 250,380 220,450',
					'M580,380 C640,350 710,380 740,450',
				].map((d, i) => (
					<path key={i} d={d} stroke="#1A2754" strokeWidth={4} fill="none" strokeLinecap="round" />
				))}
				<ellipse cx={332} cy={662} rx={18} ry={34} fill="#18244F" />
				<ellipse cx={628} cy={662} rx={18} ry={34} fill="#18244F" />
				<rect x={432} y={790} width={96} height={130} fill="#16214B" />
				<ellipse cx={FACE[0]} cy={FACE[1]} rx={148} ry={188} fill="url(#faceLight)" stroke="#33467F" strokeWidth={3} />
				<path d="M378,596 Q414,584 454,578 M506,578 Q546,584 582,596" stroke="#070B22" strokeWidth={9} strokeLinecap="round" fill="none" />
				<Eye x={420} y={640} lid={lid} look={look} id="eyeL" />
				<Eye x={540} y={640} lid={lid} look={look} id="eyeR" />
				<path d="M480,662 Q469,706 474,718 Q482,725 492,716" stroke="#3A4B80" strokeWidth={4} fill="none" strokeLinecap="round" />
				<path d="M452,774 Q480,766 508,775" stroke="#090E28" strokeWidth={6} fill="none" strokeLinecap="round" />
				{/* blanket up to the chin */}
				<path
					d="M30,900 C200,862 360,910 480,884 C620,856 760,904 950,868 L950,2050 L30,2050 Z"
					fill="#101B44"
					stroke="#2A3A72"
					strokeWidth={4}
				/>
				<path d="M140,980 C260,960 330,1010 420,990 M560,1000 C660,975 760,1010 860,985" stroke="#22306A" strokeWidth={4} fill="none" />

				{/* the running mind */}
				<g opacity={1 - tangleOut * 0.2}>
					<Draw d={tangleA} p={tangleOut > 0 ? 1 - tangleOut : tangleIn} rev={tangleOut > 0} stroke={C.ink} strokeWidth={4} strokeOpacity={0.9} />
					<Draw d={tangleB} p={tangleP * 0.98} stroke={C.inkDim} strokeWidth={3} strokeOpacity={0.8} />
				</g>
				{wheelIn > 0.001 && morph < 1 ? (
					<g transform={`translate(${CLOCK_C[0]} ${CLOCK_C[1]}) scale(${wheelIn}) rotate(${wheelRot})`} opacity={1 - clamp(morph * 1.6)}>
						<Clock r={100} h={dt * 900} m={dt * 2600} stroke={C.ink} hand={C.ink} />
					</g>
				) : null}
				{morph > 0 ? (
					<path d={curve(loopPts, true)} fill="none" stroke={C.neon} strokeWidth={6} strokeLinejoin="round" filter={loopGlow > 0.2 ? 'url(#glowGreen)' : undefined} opacity={0.4 + 0.6 * morph} />
				) : null}
				{morph > 0.6
					? [0.25, 0.5].map((k) => {
							const q = along(loopPts, sLoop - k);
							return <circle key={k} cx={q.x} cy={q.y} r={7} fill={C.neon} opacity={0.6 - k} />;
						})
					: null}
				{wheelIn > 0.001 ? (
					<g transform={`translate(${runnerAt.x} ${runnerAt.y}) rotate(${runnerRot}) scale(${0.85 * wheelIn + 0.1 * morph})`} filter="url(#glowGreen)">
						<Runner phase={runPhase} />
						{morph < 0.5 ? (
							<g stroke={C.neon} strokeWidth={4} strokeLinecap="round" opacity={(1 - morph * 2) * ramp(t, W('1b', 10), W('1b', 12))}>
								<line x1={-40} y1={-70} x2={-90} y2={-70} />
								<line x1={-36} y1={-46} x2={-100} y2={-46} />
								<line x1={-44} y1={-22} x2={-80} y2={-22} />
							</g>
						) : null}
					</g>
				) : null}

				{/* battery in the red above her head */}
				{batIn > 0.001 ? (
					<g transform={`translate(${480 + shake} ${140 - (1 - batIn) * 140})`} opacity={clamp(batIn * 1.4)}>
						<rect x={-112} y={-50} width={224} height={100} rx={20} fill="#05081A" stroke={C.ink} strokeWidth={7} />
						<rect x={114} y={-20} width={18} height={40} rx={5} fill={C.ink} />
						<rect x={-98} y={-36} width={196 * level} height={72} rx={9} fill={C.alarm} opacity={batBlink} filter="url(#glowRed)" />
					</g>
				) : null}
			</g>
		</g>
	);
};

