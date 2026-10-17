import React from 'react';
import {C} from '../constants';
import {S, W} from '../data/timeline';
import {Brain, Icon} from '../art/Props';
import {Pt, poly} from '../art/geom';
import {EASE_CAM, EASE_IN, EASE_IO, EASE_OUT, cam, clamp, ramp, springAt} from '../lib/anim';
import {noise1} from '../lib/noise';
import {FA} from '../lib/fonts';

/* 3a → 4a, one head, one camera:
   thought bubbles crowd and collide around her head; a magnifier pushes them aside;
   inside, a switch is locked ON; pulses run up into the brain and light a neon «بیدار بمون». */

const H: Pt = [540, 585]; // head centre
const BRAIN_AT: Pt = [440, 482]; // brain box origin (400×300 box at half scale)
const BS = 0.5;
const toWorld = ([x, y]: Pt): Pt => [BRAIN_AT[0] + x * BS, BRAIN_AT[1] + y * BS];
const HUB: Pt = [200, 150];

/* ---------- bubble simulation (deterministic, precomputed once) ---------- */
const BUBBLES = [
	{r: 88, icon: 'clock'},
	{r: 62, icon: 'question'},
	{r: 76, icon: 'chat'},
	{r: 54, icon: 'exclaim'},
	{r: 80, icon: 'calendar'},
	{r: 60, icon: 'mail'},
	{r: 70, icon: 'money'},
	{r: 52, icon: 'heart'},
	{r: 66, icon: 'briefcase'},
	{r: 58, icon: 'bell'},
	{r: 74, icon: 'zz'},
	{r: 54, icon: 'question'},
	{r: 64, icon: 'image'},
	{r: 50, icon: 'exclaim'},
];
const SIM_FPS = 60;
let sim: {t0: number; frames: Float32Array; n: number} | null = null;

const simulate = () => {
	if (sim) return sim;
	const t0 = S('3a') - 0.02;
	const t1 = S('3c') + 1.6;
	const steps = Math.ceil((t1 - t0) * SIM_FPS);
	const n = BUBBLES.length;
	const frames = new Float32Array(steps * n * 4);
	const x = BUBBLES.map((_, i) => H[0] + Math.cos(i * 2.4) * 30);
	const y = BUBBLES.map((_, i) => 640 + Math.sin(i * 2.4) * 30);
	const vx = BUBBLES.map((_, i) => Math.cos(i * 2.4) * (1100 + (i % 3) * 200));
	const vy = BUBBLES.map((_, i) => Math.sin(i * 2.4) * (1100 + (i % 3) * 200));
	const dt = 1 / SIM_FPS;
	for (let k = 0; k < steps; k++) {
		const t = t0 + k * dt;
		const lens = ramp(t, W('3b', 1), W('3b', 4), EASE_OUT);
		const fly = ramp(t, S('3c') - 0.05, S('3c') + 0.6, EASE_IN);
		const R = 360 + 120 * lens + 900 * fly;
		for (let i = 0; i < n; i++) {
			const dx = x[i] - H[0];
			const dy = (y[i] - (H[1] + 20)) * 1.05;
			const d = Math.hypot(dx, dy) || 1;
			let ax = (-(d - R) * 34 * dx) / d;
			let ay = (-(d - R) * 34 * dy) / d;
			const dir = i % 4 === 0 ? -1 : 1;
			ax += (-dy / d) * 260 * dir * (1 - lens * 0.7);
			ay += (dx / d) * 260 * dir * (1 - lens * 0.7);
			ax += noise1(t * 1.3 + i * 10, 'bx') * 900;
			ay += noise1(t * 1.3 + i * 10, 'by') * 900;
			if (fly === 0) {
				if (y[i] > 1060) ay -= (y[i] - 1060) * 80;
				if (y[i] < 200) ay += (200 - y[i]) * 80;
				if (x[i] < 80) ax += (80 - x[i]) * 80;
				if (x[i] > 1000) ax -= (x[i] - 1000) * 80;
			}
			vx[i] += ax * dt;
			vy[i] += ay * dt;
		}
		for (let i = 0; i < n; i++)
			for (let j = i + 1; j < n; j++) {
				const dx = x[j] - x[i];
				const dy = y[j] - y[i];
				const d = Math.hypot(dx, dy) || 1;
				const min = BUBBLES[i].r + BUBBLES[j].r + 8;
				if (d < min) {
					const push = (min - d) * 0.5;
					const ux = dx / d;
					const uy = dy / d;
					x[i] -= ux * push;
					y[i] -= uy * push;
					x[j] += ux * push;
					y[j] += uy * push;
					const rel = (vx[j] - vx[i]) * ux + (vy[j] - vy[i]) * uy;
					if (rel < 0) {
						vx[i] += ux * rel * 0.9;
						vy[i] += uy * rel * 0.9;
						vx[j] -= ux * rel * 0.9;
						vy[j] -= uy * rel * 0.9;
					}
				}
			}
		for (let i = 0; i < n; i++) {
			vx[i] *= 0.95;
			vy[i] *= 0.95;
			x[i] += vx[i] * dt;
			y[i] += vy[i] * dt;
			const o = (k * n + i) * 4;
			frames[o] = x[i];
			frames[o + 1] = y[i];
			frames[o + 2] = vx[i];
			frames[o + 3] = vy[i];
		}
	}
	sim = {t0, frames, n};
	return sim;
};

/* ---------- neural network inside the brain box ---------- */
const NODES: Pt[] = [
	[200, 150], [92, 142], [120, 90], [172, 58], [232, 46], [292, 70], [334, 112], [352, 160], [302, 192], [252, 150],
	[196, 104], [150, 176], [108, 204], [204, 212], [262, 222], [318, 246], [244, 98], [286, 138], [142, 128], [224, 180], [64, 168],
];
const EDGES: [number, number][] = (() => {
	const set = new Set<string>();
	NODES.forEach((a, i) => {
		NODES.map((b, j) => ({j, d: Math.hypot(a[0] - b[0], a[1] - b[1])}))
			.filter((e) => e.j !== i)
			.sort((p, q) => p.d - q.d)
			.slice(0, 3)
			.forEach(({j}) => set.add(i < j ? `${i}-${j}` : `${j}-${i}`));
	});
	return [...set].map((k) => k.split('-').map(Number) as [number, number]);
})();
// breadth-first depth from the hub decides when each node lights
const DEPTH: number[] = (() => {
	const depth = NODES.map(() => Infinity);
	depth[0] = 0;
	const queue = [0];
	while (queue.length) {
		const i = queue.shift()!;
		EDGES.forEach(([a, b]) => {
			const j = a === i ? b : b === i ? a : -1;
			if (j >= 0 && depth[j] === Infinity) {
				depth[j] = depth[i] + 1;
				queue.push(j);
			}
		});
	}
	return depth;
})();

const flickerOn = (t: number, t0: number) => {
	const k = (t - t0) / 0.42;
	if (k < 0) return 0;
	if (k > 1) return 1;
	return [0, 1, 0.15, 0.9, 0, 0.7, 1, 0.4, 1][Math.floor(k * 9)];
};

export const Mind: React.FC<{t: number}> = ({t}) => {
	if (t < S('3a') - 0.1 || t > S('4b') + 0.5) return null;

	// camera
	const reveal = ramp(t, S('3a'), S('3a') + 0.85, EASE_OUT);
	const pull = ramp(t, S('3b'), S('3b') + 0.9, EASE_CAM);
	const push = ramp(t, S('3c') + 0.02, S('3c') + 0.95, EASE_IO);
	const late = ramp(t, S('4a'), S('4b'), (x) => x);
	const out = ramp(t, S('4b') - 0.22, S('4b') + 0.3, EASE_IN);
	let zoom = 2.4 * Math.pow(1.06 / 2.4, reveal);
	zoom *= 1 + 0.04 * ramp(t, S('3a') + 0.85, S('3b'), (x) => x);
	zoom *= Math.pow(0.86 / 1.1, pull);
	zoom *= Math.pow(2.75 / 0.86, push);
	zoom *= 1 + 0.08 * late;
	zoom *= Math.pow(0.35, out);
	const fx = 540;
	const fy = 640 + (650 - 640) * pull + (560 - 650) * push;
	const fade = ramp(t, S('3a') - 0.06, S('3a') + 0.12, (x) => x) * (1 - ramp(t, S('4b') - 0.05, S('4b') + 0.3, (x) => x));

	// bubbles
	const s = simulate();
	const k = clamp(Math.round((t - s.t0) * SIM_FPS), 0, s.frames.length / (s.n * 4) - 1);
	const bubblesOn = t < S('3c') + 1.6;

	// magnifier
	const lensIn = springAt(t, W('3b', 1), {stiffness: 70, damping: 15});
	const lensX = 1000 + (H[0] - 1000) * lensIn;
	const lensY = 120 + (H[1] - 120) * lensIn;
	const lensFade = 1 - ramp(t, S('3c') + 0.45, S('3c') + 1.0, (x) => x);
	const xray = ramp(t, W('3b', 9) - 0.1, W('3b', 9) + 0.6);

	// brain, switch
	const brainP = ramp(t, S('3c') + 0.1, W('3c', 3) + 0.2, EASE_IO);
	const swIn = springAt(t, W('3c', 4) - 0.05, {stiffness: 140, damping: 14});
	const jiggle = (t0: number) => Math.sin(Math.max(0, t - t0) * 40) * 14 * (1 - ramp(t, t0, t0 + 0.45, (x) => x)) * (t > t0 ? 1 : 0);
	const leverRot = jiggle(W('3c', 6)) + jiggle(W('3c', 10));
	const lockGlint = Math.max(ramp(t, W('3c', 6), W('3c', 6) + 0.1) * (1 - ramp(t, W('3c', 6) + 0.1, W('3c', 6) + 0.6)), 0);

	// 4a: pulses climb the stem, then spread through the network
	const netT0 = S('4a') + 0.25;
	const STEP = 0.3;
	const netOn = t > S('4a') - 0.2;
	const signT = W('4a', 8) - 0.05;
	const sign = flickerOn(t, signT);
	const headGlow = ramp(t, netT0, W('4a', 7));

	return (
		<g opacity={fade}>
			<g transform={cam(fx, fy, zoom)}>
				{/* spotlight from above while the magnifier searches */}
				<path
					d={poly([[480, -900], [600, -900], [H[0] + 240, H[1] + 40], [H[0] - 240, H[1] + 40]], true)}
					fill="#DDE8FF"
					opacity={0.08 * lensIn * lensFade}
				/>
				{/* bust */}
				<path d="M380,600 C360,430 450,360 540,360 C640,360 725,430 700,600 C712,720 690,820 660,880 L420,880 C390,820 368,720 380,600 Z" fill="#070C24" stroke={C.bodyEdge} strokeWidth={4} />
				<path d="M230,1180 C240,990 320,900 452,862 L628,862 C760,900 840,990 850,1180 Z" fill={C.body} stroke={C.bodyEdge} strokeWidth={5} />
				<path d="M494,700 L494,880 L586,880 L586,700 Z" fill="#0F1A45" />
				<ellipse cx={H[0]} cy={H[1]} rx={120} ry={150} fill="url(#faceLight)" stroke={C.bodyEdge} strokeWidth={4} />
				<circle cx={H[0]} cy={H[1] - 20} r={150} fill="url(#glowNeonDisc)" opacity={0.5 * headGlow} />
				<g opacity={1 - brainP}>
					<path d="M470,578 Q494,566 518,574 M562,574 Q586,566 610,578" stroke="#070B22" strokeWidth={7} strokeLinecap="round" fill="none" />
					<path d="M474,606 Q494,592 516,606 Q494,616 474,606 Z M564,606 Q586,592 606,606 Q586,616 564,606 Z" fill="#D9E3F4" />
					<circle cx={502 + Math.sin(t * 3) * 3} cy={601} r={6} fill="#0A1230" />
					<circle cx={592 + Math.sin(t * 3) * 3} cy={601} r={6} fill="#0A1230" />
					<path d="M520,684 Q540,678 560,686" stroke="#090E28" strokeWidth={5} fill="none" strokeLinecap="round" />
				</g>
				<path d="M420,600 C410,470 470,425 545,428 C625,430 672,485 662,600 C645,525 600,492 545,500 C480,505 440,545 420,600 Z" fill="#070C24" />

				{/* x-ray hint inside the lens, then the full brain */}
				<clipPath id="lensClip">
					<circle cx={lensX} cy={lensY} r={196} />
				</clipPath>
				<g clipPath={brainP > 0 ? undefined : 'url(#lensClip)'} opacity={Math.max(xray * 0.8, brainP)}>
					<g transform={`translate(${BRAIN_AT[0]} ${BRAIN_AT[1]}) scale(${BS})`}>
						<Brain p={brainP > 0 ? Math.max(brainP, 0.001) : 1} fold={brainP > 0 ? brainP : 1} stroke={brainP > 0 ? C.ink : C.neon} w={6} fill="rgba(5,9,26,0.92)" />
						{/* neural network */}
						{netOn
							? EDGES.map(([a, b], i) => {
									const ta = netT0 + Math.min(DEPTH[a], DEPTH[b]) * STEP;
									const p = ramp(t, ta, ta + STEP, (x) => x);
									if (p <= 0) return null;
									const [A, B] = DEPTH[a] <= DEPTH[b] ? [NODES[a], NODES[b]] : [NODES[b], NODES[a]];
									const px = A[0] + (B[0] - A[0]) * p;
									const py = A[1] + (B[1] - A[1]) * p;
									return (
										<g key={i}>
											<line x1={A[0]} y1={A[1]} x2={px} y2={py} stroke={C.neon} strokeWidth={4} strokeOpacity={0.75} strokeLinecap="round" />
											{p < 1 ? <circle cx={px} cy={py} r={9} fill="#F4FFE0" filter="url(#glowGreen)" /> : null}
										</g>
									);
								})
							: null}
						{netOn
							? NODES.map(([x, y], i) => {
									const lit = ramp(t, netT0 + DEPTH[i] * STEP, netT0 + DEPTH[i] * STEP + 0.2);
									return lit > 0 ? <circle key={i} cx={x} cy={y} r={7 + 4 * lit} fill={C.neon} opacity={lit} filter="url(#glowGreen)" /> : null;
								})
							: null}
						{/* pulses climbing the brain stem toward the hub */}
						{netOn
							? [0, 0.12, 0.24].map((d, i) => {
									const p = ramp(t, S('4a') - 0.15 + d, netT0 + d, (x) => x);
									if (p <= 0 || p >= 1) return null;
									const pts: Pt[] = [[236, 640], [238, 312], [236, 250], HUB];
									const seg = p * 3;
									const j = Math.min(2, Math.floor(seg));
									const f = seg - j;
									const x = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f;
									const y = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f;
									return <circle key={i} cx={x} cy={y} r={11} fill="#F4FFE0" filter="url(#glowGreen)" />;
								})
							: null}
					</g>
				</g>

				{/* the switch, locked ON */}
				{swIn > 0.001 ? (
					<g transform={`translate(${toWorld(HUB)[0]} ${toWorld(HUB)[1]}) scale(${swIn * (1 - 0.35 * ramp(t, S('4a'), S('4a') + 0.6))})`}>
						<circle r={70} fill="url(#glowNeonDisc)" opacity={0.7} />
						<rect x={-27} y={-40} width={54} height={80} rx={11} fill="#04070F" stroke={C.ink} strokeWidth={3} />
						<rect x={-9} y={-30} width={18} height={60} rx={9} fill="#0D1531" />
						<g transform={`rotate(${leverRot} 0 4)`}>
							<rect x={-11} y={-32} width={22} height={30} rx={10} fill={C.neon} filter="url(#glowGreen)" />
						</g>
						<text x={0} y={-48} textAnchor="middle" fontFamily={FA} fontWeight={900} fontSize={15} fill={C.neon} filter="url(#glowGreen)">
							ON
						</text>
						<g transform="translate(40 18)">
							<path d="M-8,-4 V-12 A8,8 0 0 1 8,-12 V-4" fill="none" stroke={C.ink} strokeWidth={3.5} />
							<rect x={-12} y={-5} width={24} height={20} rx={4} fill={C.ink} />
							<circle cx={0} cy={4} r={3} fill="#04070F" />
							<circle r={22} fill="#FFFFFF" opacity={0.35 * lockGlint} />
						</g>
					</g>
				) : null}

				{/* thought bubbles */}
				{bubblesOn
					? BUBBLES.map((b, i) => {
							const o = (k * s.n + i) * 4;
							const x = s.frames[o];
							const y = s.frames[o + 1];
							const v = Math.hypot(s.frames[o + 2], s.frames[o + 3]);
							const pop = springAt(t, s.t0 + i * 0.035, {stiffness: 160, damping: 14});
							const stretch = 1 + Math.min(0.16, v / 5000);
							const ang = (Math.atan2(s.frames[o + 3], s.frames[o + 2]) * 180) / Math.PI;
							const dx = H[0] - x;
							const dy = H[1] - y;
							const d = Math.hypot(dx, dy) || 1;
							const neon = i % 5 === 1;
							return (
								<g key={i} opacity={clamp(pop * 1.3)}>
									{[b.r + 22, b.r + 50].map((dd, j) => (
										<circle key={j} cx={x + (dx / d) * dd * pop} cy={y + (dy / d) * dd * pop} r={(j ? 6 : 11) * pop} fill="rgba(9,15,42,0.9)" stroke={C.ink} strokeWidth={3} />
									))}
									<g transform={`translate(${x} ${y}) rotate(${ang}) scale(${pop * stretch} ${pop / stretch}) rotate(${-ang})`}>
										<circle r={b.r} fill="rgba(9,15,42,0.94)" stroke={neon ? C.neon : C.ink} strokeWidth={4} />
										<Icon name={b.icon} size={b.r / 78} stroke={neon ? C.neon : C.ink} w={7} />
									</g>
								</g>
							);
						})
					: null}

				{/* magnifier */}
				{lensIn > 0.001 && lensFade > 0 ? (
					<g opacity={lensFade} transform={`translate(${lensX} ${lensY})`}>
						<circle r={200} fill="rgba(158,255,0,0.05)" />
						<path d="M-150,-90 A175,175 0 0 1 -60,-165" stroke="#FFFFFF" strokeOpacity={0.5} strokeWidth={8} fill="none" strokeLinecap="round" />
						<path d="M150,150 L300,300" stroke={C.ink} strokeWidth={44} strokeLinecap="round" />
						<path d="M150,150 L300,300" stroke="#0A1230" strokeWidth={30} strokeLinecap="round" />
						<circle r={200} fill="none" stroke={C.ink} strokeWidth={18} filter="url(#glowWhite)" />
					</g>
				) : null}

				{/* neon sign above the brain */}
				{sign > 0 ? (
					<g transform="translate(540 438)" opacity={sign}>
						<rect x={-92} y={-30} width={184} height={60} rx={16} fill="rgba(4,8,16,0.85)" stroke={C.neon} strokeWidth={3} filter="url(#glowGreen)" />
						<rect x={-84} y={-22} width={168} height={44} rx={11} fill="none" stroke={C.neon} strokeOpacity={0.4} strokeWidth={1.5} />
						<text x={0} y={10} textAnchor="middle" direction="rtl" fontFamily={FA} fontWeight={800} fontSize={27} fill="#EFFFD6" filter="url(#glowGreen)">
							بیدار بمون
						</text>
					</g>
				) : null}
			</g>
		</g>
	);
};

