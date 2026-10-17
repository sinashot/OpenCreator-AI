import React from 'react';
import {C} from '../constants';
import {S, W} from '../data/timeline';
import {Draw} from '../art/Draw';
import {ASTRAL_SIT, Figure, LIE_PHONE, LIE_REST, Pose, SIT_CALM, STRETCH, mixPose} from '../art/Figure';
import {Clock, Gear, Icon, Phone} from '../art/Props';
import {Pt, curve, poly} from '../art/geom';
import {EASE_CAM, EASE_IN, EASE_IO, EASE_OUT, cam, clamp, keys, ramp, smoothstep, springAt} from '../lib/anim';
import {mix} from '../lib/color';
import {noise1, rand} from '../lib/noise';

/* 4b → 6a, one bedroom, one camera.
   Phone light floods her eyes; her body lies still while a glowing double keeps
   turning the gears; then the small changes: phone face down, warm lamp, a clock that
   ticks evenly, the day's noise drifting away, breathing waves, and morning light. */

const HIP_LIE: Pt = [560, 760];
const HIP_SIT: Pt = [590, 772];
const NIGHTSTAND_PHONE: Pt = [1082, 708];
const LAMP: Pt = [1170, 600];
const WALL_CLOCK: Pt = [1110, 400];
const WINDOW = {x: 170, y: 230, w: 300, h: 330};
const SUN: Pt = [372, 330];

const BUSY = ['chat', 'mail', 'calendar', 'bell', 'briefcase', 'money', 'image', 'cart', 'play', 'heart', 'chat', 'bell'];
const BUSY_POS: Pt[] = BUSY.map((_, i) => {
	const a = -Math.PI * 1.12 + (i / (BUSY.length - 1)) * Math.PI * 1.24 + (rand(`bp${i}`) - 0.5) * 0.16;
	const r = 270 + (i % 3) * 70 + rand(`br${i}`) * 30;
	return [590 + Math.cos(a) * r * 1.25, 560 + Math.sin(a) * r * 0.9];
});

const STREAM = ['bell', 'chat', 'image', 'heart', 'mail', 'play', 'calendar', 'image', 'chat', 'money', 'bell', 'heart'];

const tick = (t: number) => {
	// an even, eased step once per second
	const whole = Math.floor(t);
	return (whole + EASE_OUT(clamp((t - whole) / 0.18))) * 6;
};

export const Room: React.FC<{t: number}> = ({t}) => {
	if (t < S('4b') - 0.3 || t > S('6b') + 1.2) return null;

	/* ---------- camera ---------- */
	const enter = ramp(t, S('4b') - 0.25, S('4b') + 0.55, EASE_OUT);
	const [fx, fy, sBase] = keys(t, [
		{t: S('4b') + 0.55, v: [812, 650, 1.95]},
		{t: S('4c'), v: [818, 650, 2.08], ease: (x) => x},
		{t: S('4c') + 1.0, v: [630, 625, 0.96], ease: EASE_CAM},
		{t: S('5a') - 0.1, v: [640, 625, 1.0], ease: (x) => x},
		{t: S('5a') + 0.8, v: [1030, 590, 1.22], ease: EASE_CAM},
		{t: S('5b') - 0.1, v: [1040, 590, 1.26], ease: (x) => x},
		{t: S('5b') + 0.85, v: [610, 590, 0.9], ease: EASE_CAM},
		{t: S('5c'), v: [600, 600, 0.93], ease: (x) => x},
		{t: S('6a'), v: [590, 605, 0.97], ease: (x) => x},
		{t: S('6a') + 0.9, v: [560, 590, 0.93], ease: EASE_CAM},
		{t: S('6b'), v: [560, 585, 0.98], ease: (x) => x},
	]);
	const zoomIn = Math.pow(3.4 / 1.95, 1 - enter);
	const fxx = fx + (852 - fx) * (1 - enter);
	const fyy = fy + (700 - fy) * (1 - enter);
	const s = sBase * zoomIn;
	const fadeIn = ramp(t, S('4b') - 0.22, S('4b') + 0.12, (x) => x);
	const fadeOut = 1 - ramp(t, S('6b') - 0.1, S('6b') + 0.9, EASE_IN);

	/* ---------- pose ---------- */
	const armDown = ramp(t, S('4c') + 0.05, S('4c') + 0.8, EASE_IO);
	const sitUp = ramp(t, S('5b') + 0.05, S('5b') + 0.95, EASE_IO);
	const stretch = ramp(t, W('6a', 7) - 0.1, W('6a', 7) + 0.6, EASE_IO) * (1 - ramp(t, W('6a', 10), W('6a', 10) + 0.7, EASE_IO));
	let pose: Pose = mixPose(LIE_PHONE, LIE_REST, armDown);
	// a thumb scrolling: the phone hand twitches
	if (armDown < 1) {
		const twitch = noise1(t * 6, 'scroll') * 5 * (1 - armDown);
		pose = {...pose, haF: [pose.haF[0] + twitch, pose.haF[1] + twitch * 0.5]};
	}
	const hip: Pt = [HIP_LIE[0] + (HIP_SIT[0] - HIP_LIE[0]) * sitUp, HIP_LIE[1] + (HIP_SIT[1] - HIP_LIE[1]) * sitUp];
	// lying poses are relative to their hip; the sitting pose to the sitting hip
	pose = mixPose(pose, SIT_CALM, sitUp);
	pose = mixPose(pose, STRETCH, stretch);
	const breathPhase = Math.max(0, t - (S('5c') + 0.4));
	const breath = 0.5 - 0.5 * Math.cos((breathPhase * Math.PI * 2) / 3.6);
	const breathing = ramp(t, S('5c'), S('5c') + 0.6) * (1 - 0.5 * ramp(t, S('6a') + 1, S('6a') + 3));

	/* ---------- phone ---------- */
	const handWorld: Pt = [hip[0] + pose.haF[0], hip[1] + pose.haF[1]];
	const toStand = ramp(t, S('4c') + 0.25, S('4c') + 1.0, EASE_IO);
	const phoneX = handWorld[0] + 10 + (NIGHTSTAND_PHONE[0] - handWorld[0] - 10) * toStand;
	const phoneY = handWorld[1] - 18 + (NIGHTSTAND_PHONE[1] - handWorld[1] + 18) * toStand - Math.sin(toStand * Math.PI) * 120;
	const flip = ramp(t, W('5a', 4) - 0.05, W('5a', 4) + 0.45, EASE_IO);
	const screenOn = 1 - ramp(t, W('5a', 4), W('5a', 4) + 0.3, (x) => x);
	const beamOn = (1 - armDown) * ramp(t, S('4b') - 0.1, S('4b') + 0.3);
	const eye: Pt = [hip[0] + pose.head[0] - 22, hip[1] + pose.head[1] - 6];

	/* ---------- astral double and gears ---------- */
	const rise = ramp(t, W('4c', 6) - 0.1, W('4c', 7) + 0.25, EASE_IO) * (1 - ramp(t, S('5a') - 0.45, S('5a') + 0.35, EASE_IO));
	const astral = mixPose(LIE_REST, ASTRAL_SIT, rise);
	const gearsOn = ramp(t, W('4c', 9) - 0.1, W('4c', 10)) * (1 - ramp(t, S('5a') - 0.4, S('5a') + 0.2));
	const gearSpin = (t - W('4c', 9)) * 90 + Math.max(0, t - W('4c', 11)) ** 2 * 70;

	/* ---------- lamp, clock ---------- */
	const lamp = ramp(t, W('5a', 5) - 0.05, W('5a', 5) + 0.5, EASE_OUT) * (1 - 0.7 * ramp(t, S('6a'), S('6a') + 1.5));
	const steady = ramp(t, W('5a', 6), W('5a', 9) + 0.2);
	const erratic = 1 - steady;
	const secErr = (t * 260 + noise1(t * 3, 'sec') * 400) % 360;
	const secAng = secErr * erratic + tick(t - 41) * steady;
	const minAng = 12 * 6 + noise1(t * 4, 'min') * 90 * erratic + (t - 30) * 0.1;
	const hourAng = 60 + noise1(t * 2, 'hr') * 25 * erratic;
	const morning = ramp(t, S('6a') + 0.2, S('6a') + 2.4, EASE_IO);

	/* ---------- busy icons ---------- */
	const recede = ramp(t, W('5b', 3), W('5b', 8), EASE_IN);
	const calmSpace = ramp(t, W('5b', 5), S('5c') + 0.5);

	/* ---------- waves ---------- */
	const wavesIn = ramp(t, S('5c') - 0.05, S('5c') + 0.45, EASE_OUT);
	const smooth = ramp(t, W('5c', 3) - 0.3, W('5c', 5) + 0.3, EASE_IO);
	const wavesOut = ramp(t, S('6a') + 0.2, S('6a') + 1.6, EASE_IN);
	const waveBase = [470, 560, 650];
	const waveCol = [C.lavender, C.gold, '#DCCFF0'];
	const waveD = (k: number) => {
		const pts: Pt[] = [];
		const N = 46;
		for (let i = 0; i <= N; i++) {
			const x = -60 + (i / N) * 1320;
			const jag = (i % 2 ? 1 : -1) * (30 + rand(`jag${k}:${i}`) * 60);
			const amp = 44 * (0.35 + 0.65 * breath) * (1 - wavesOut);
			const sine = amp * Math.sin((x / 1320) * Math.PI * 4 + k * 1.3 + t * 0.6);
			pts.push([x, waveBase[k] + jag * (1 - smooth) * (1 - wavesOut) + sine * smooth]);
		}
		return smooth > 0.02 ? curve(pts) : poly(pts);
	};

	/* ---------- colours ---------- */
	const warmEdge = mix(C.bodyEdge, '#FFD9A0', morning);
	const bodyFill = mix(C.body, '#1C2758', morning);

	return (
		<g opacity={fadeIn * fadeOut}>
			<g transform={cam(fxx, fyy, s)}>
				{/* window */}
				<g>
					<rect x={WINDOW.x} y={WINDOW.y} width={WINDOW.w} height={WINDOW.h} rx={10} fill={mix('#081030', '#FFE2A8', morning)} />
					{morning < 0.6
						? [[220, 280], [300, 340], [420, 270], [250, 470], [390, 430], [440, 520]].map(([x, y], i) => (
								<circle key={i} cx={x} cy={y} r={2.5} fill="#CFE0FF" opacity={(0.7 + 0.3 * Math.sin(t * 4 + i)) * (1 - morning / 0.6)} />
							))
						: null}
					<circle cx={SUN[0]} cy={SUN[1] + 90 * (1 - morning)} r={52} fill={C.gold} opacity={morning * (1 - ramp(t, S('6b') - 0.2, S('6b') - 0.12, (x) => x))} filter="url(#glowGold)" />
					<rect x={WINDOW.x} y={WINDOW.y} width={WINDOW.w} height={WINDOW.h} rx={10} fill="none" stroke={C.ink} strokeWidth={8} />
					<line x1={WINDOW.x + WINDOW.w / 2} y1={WINDOW.y} x2={WINDOW.x + WINDOW.w / 2} y2={WINDOW.y + WINDOW.h} stroke={C.ink} strokeWidth={6} />
					<line x1={WINDOW.x} y1={WINDOW.y + WINDOW.h / 2} x2={WINDOW.x + WINDOW.w} y2={WINDOW.y + WINDOW.h / 2} stroke={C.ink} strokeWidth={6} />
					<rect x={WINDOW.x - 26} y={WINDOW.y + WINDOW.h} width={WINDOW.w + 52} height={16} rx={6} fill="#0E1740" stroke={C.ink} strokeWidth={4} />
				</g>

				{/* morning rays */}
				{morning > 0
					? [0, 1, 2].map((i) => {
							const x0 = WINDOW.x + 30 + i * 95;
							const sh = 0.75 + 0.25 * Math.sin(t * 1.6 + i * 1.7);
							return (
								<path
									key={i}
									d={poly([[x0, WINDOW.y + 20], [x0 + 70, WINDOW.y + 20], [x0 + 620, 980], [x0 + 400, 980]], true)}
									fill="url(#sunRay)"
									opacity={morning * 0.55 * sh}
								/>
							);
						})
					: null}

				{/* wall clock */}
				<g transform={`translate(${WALL_CLOCK[0]} ${WALL_CLOCK[1]})`}>
					<Clock r={64} h={hourAng * (1 - morning) + 210 * morning} m={minAng * (1 - morning)} s={secAng} />
				</g>

				{/* lamp light */}
				<circle cx={LAMP[0]} cy={LAMP[1]} r={620} fill="url(#lampWarm)" opacity={lamp} />

				{/* nightstand + lamp */}
				<rect x={1030} y={720} width={200} height={240} rx={10} fill="#0C1434" stroke={C.ink} strokeWidth={4} />
				<line x1={1050} y1={800} x2={1210} y2={800} stroke={C.ink} strokeWidth={3} opacity={0.6} />
				<circle cx={1130} cy={760} r={6} fill={C.ink} />
				<ellipse cx={LAMP[0]} cy={718} rx={36} ry={8} fill="#0E1740" stroke={C.ink} strokeWidth={4} />
				<line x1={LAMP[0]} y1={716} x2={LAMP[0]} y2={600} stroke={C.ink} strokeWidth={6} />
				<path
					d={`M${LAMP[0] - 58},600 L${LAMP[0] + 58},600 L${LAMP[0] + 34},516 L${LAMP[0] - 34},516 Z`}
					fill={mix('#1A2350', C.gold, lamp)}
					stroke={C.ink}
					strokeWidth={4}
					strokeLinejoin="round"
					filter={lamp > 0.3 ? 'url(#glowGold)' : undefined}
				/>

				{/* bed */}
				<rect x={975} y={590} width={34} height={310} rx={12} fill="#0E1740" stroke={C.ink} strokeWidth={4} />
				<rect x={100} y={860} width={900} height={40} rx={8} fill="#0B1333" stroke={C.ink} strokeWidth={4} />
				<line x1={128} y1={900} x2={128} y2={960} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
				<line x1={972} y1={900} x2={972} y2={960} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
				<rect x={110} y={782} width={870} height={80} rx={20} fill="#101A42" stroke={C.ink} strokeWidth={4} />
				<path d="M806,786 C792,742 820,716 880,714 C930,712 966,726 968,760 C970,790 940,790 900,790 Z" fill="#17224E" stroke={C.ink} strokeWidth={4} />

				{/* halo of calm space around her (5b →) */}
				<circle cx={HIP_SIT[0]} cy={HIP_SIT[1] - 200} r={330 + 40 * breath * breathing} fill="url(#haloLav)" opacity={calmSpace * (1 - morning * 0.4)} />
				<circle cx={HIP_SIT[0]} cy={HIP_SIT[1] - 200} r={360} fill="url(#lampWarm)" opacity={morning * 0.7} />

				{/* breathing waves (behind her) */}
				{wavesIn > 0 && wavesOut < 1
					? [0, 1, 2].map((k) => (
							<Draw
								key={k}
								d={waveD(k)}
								p={wavesIn}
								stroke={mix(C.ink, waveCol[k], smooth)}
								strokeWidth={5 + 2 * smooth}
								strokeOpacity={0.9 * (1 - wavesOut)}
								filter={smooth > 0.5 ? (k === 1 ? 'url(#glowGold)' : 'url(#glowLav)') : undefined}
							/>
						))
					: null}

				{/* Maryam */}
				<g transform={`translate(${hip[0]} ${hip[1]})`}>
					<Figure pose={pose} breathe={breath * breathing * 2} edge={warmEdge} fill={bodyFill} />
				</g>
				{/* blanket over the legs, kicked to the foot of the bed when she sits up */}
				<g transform={`translate(140 0) scale(${1 - 0.62 * sitUp} 1) translate(-140 0)`}>
					<path
						d="M700,744 C620,716 430,722 310,728 C220,732 168,738 140,764 L140,804 L716,804 Z"
						fill="#16225A"
						stroke={C.ink}
						strokeWidth={4}
						strokeLinejoin="round"
						opacity={1 - 0.3 * sitUp}
					/>
					<path d="M300,744 C360,760 420,750 480,764 M560,738 C600,752 640,748 680,760" stroke="#2B3A78" strokeWidth={4} fill="none" opacity={1 - sitUp} />
				</g>

				{/* astral double: the body stays down, the mind sits up */}
				{rise > 0.01 ? (
					<g transform={`translate(${HIP_LIE[0]} ${HIP_LIE[1]})`}>
						<Figure pose={astral} upperOnly fill="#123E78" edge="#A8E6FF" edgeW={5} hair="#0E3266" opacity={0.58 * Math.min(1, rise * 1.8)} filter="url(#glowBlue)" />
					</g>
				) : null}
				{gearsOn > 0.01 ? (
					<g opacity={gearsOn} filter="url(#glowGreen)">
						<g transform={`translate(700 372) scale(${gearsOn})`}>
							<Gear r={56} teeth={11} rot={gearSpin} />
						</g>
						<g transform={`translate(778 418) scale(${gearsOn})`}>
							<Gear r={34} teeth={7} rot={-gearSpin * (56 / 34) + 12} />
						</g>
						<g transform={`translate(672 292) scale(${gearsOn})`}>
							<Gear r={30} teeth={6} rot={-gearSpin * (56 / 30) + 20} />
						</g>
					</g>
				) : null}

				{/* phone: in her hand, then on the nightstand, then face down */}
				{beamOn > 0.01 ? (
					<g opacity={beamOn}>
						<path d={poly([[phoneX - 34, phoneY + 30], [phoneX + 40, phoneY + 50], [eye[0] + 40, eye[1] + 20], [eye[0] - 30, eye[1] - 10]], true)} fill="url(#beamBlue)" opacity={0.85} />
						<circle cx={eye[0]} cy={eye[1]} r={90} fill="url(#glowBlueDisc)" opacity={0.9} />
						{STREAM.map((name, i) => {
							const cycle = 0.62;
							const f = ((t - S('4b') + i * (cycle / STREAM.length) * 2.1) % cycle) / cycle;
							if (f < 0) return null;
							const x = phoneX + (eye[0] - phoneX) * f + noise1(i * 3 + t, 'sx') * 18;
							const y = phoneY + 30 + (eye[1] - phoneY - 30) * f;
							const o = Math.sin(f * Math.PI);
							return (
								<g key={i} transform={`translate(${x} ${y}) rotate(${(rand(`sr${i}`) - 0.5) * 50}) scale(${0.16 + 0.24 * f})`} opacity={o}>
									<Icon name={name} card="rgba(0,168,255,0.35)" stroke="#E6F6FF" w={8} />
								</g>
							);
						})}
					</g>
				) : null}
				{toStand > 0 && screenOn > 0.01 ? (
					<path d={poly([[NIGHTSTAND_PHONE[0] - 36, NIGHTSTAND_PHONE[1] - 6], [NIGHTSTAND_PHONE[0] + 36, NIGHTSTAND_PHONE[1] - 6], [NIGHTSTAND_PHONE[0] + 150, 260], [NIGHTSTAND_PHONE[0] - 150, 260]], true)} fill="url(#glowBlueDisc)" opacity={0.55 * toStand * screenOn} />
				) : null}
				<g transform={`translate(${phoneX} ${phoneY - Math.sin(flip * Math.PI) * 50})`}>
					{toStand < 0.5 ? (
						<g transform={`rotate(${-24 + 30 * toStand})`}>
							<Phone screen={1} />
						</g>
					) : (
						<g transform={`scale(1 ${Math.cos(flip * Math.PI)})`}>
							<rect x={-40} y={-7} width={80} height={14} rx={5} fill="#05070F" stroke={C.ink} strokeWidth={3} />
							<rect x={-34} y={-8} width={68} height={4} rx={2} fill={C.screen} opacity={screenOn} filter={screenOn > 0.2 ? 'url(#glowBlue)' : undefined} />
						</g>
					)}
				</g>

				{/* the day's noise, drifting away into the background */}
				{t > S('5b') - 0.1 && recede < 1
					? BUSY.map((name, i) => {
							const pop = springAt(t, S('5b') + 0.1 + i * 0.05, {stiffness: 150, damping: 15});
							const [bx, by] = BUSY_POS[i];
							const cx = HIP_SIT[0];
							const cy = HIP_SIT[1] - 220;
							const far = 1 + 0.7 * recede;
							const x = cx + (bx - cx) * far;
							const y = cy + (by - cy) * far - 120 * recede;
							const sc = pop * (0.86 - 0.66 * recede);
							return (
								<g key={i} transform={`translate(${x} ${y}) rotate(${(rand(`bi${i}`) - 0.5) * 24}) scale(${sc})`} opacity={clamp(pop) * (1 - smoothstep(0.35, 1, recede))}>
									<Icon name={name} card="rgba(12,20,52,0.92)" stroke={i % 4 === 0 ? C.neon : C.ink} w={7} />
								</g>
							);
						})
					: null}
			</g>
		</g>
	);
};
