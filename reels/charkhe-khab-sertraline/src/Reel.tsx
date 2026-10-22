import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Balance, Capsule, Check, PIV} from './art';
import {FA} from './fonts';
import {C, FPS, Fa, H, HANDLE, W, cl, eio, ei, enterStyle, eo, faNum, inn, mix, out, punch, rand, rm, vis} from './kit';
import {Background, Captions, Watermark} from './overlays';

/* whip pans: the camera travels left, so content arrives from the left and leaves right */
const whipIn = (t: number, at: number) => {
	const p = eo(rm(t, at - 0.22, at + 0.32));
	return {x: -1250 * (1 - p), blur: 26 * (1 - p) * (p > 0 ? 1 : 0)};
};
const whipOut = (t: number, at: number) => {
	const p = ei(rm(t, at - 0.28, at + 0.04));
	return {x: 1250 * p, blur: 26 * p};
};
const shake = (t: number, a: number, b: number, amp: number) => {
	if (t < a || t > b) return [0, 0];
	const k = amp * (1 - rm(t, a, b));
	const f = Math.floor(t * 30);
	return [(rand(f) - 0.5) * 2 * k, (rand(f + 99) - 0.5) * 2 * k];
};

const thetaAt = (t: number) => {
	if (t < 15.45) return 14 + 1.4 * Math.sin(t * 2.2) * rm(t, 9.5, 10.5) * (1 - rm(t, 14, 15.4));
	if (t < 17.6) return mix(14, 0, eio(rm(t, 15.45, 17.5)));
	if (t < 24.52) return 0.5 * Math.sin(t * 1.8) * rm(t, 17.6, 18.6);
	if (t < 40) {
		const tau = t - 24.52;
		return 31 - 31 * Math.exp(-4.2 * tau) * Math.cos(8.5 * tau);
	}
	if (t < 50) return mix(7, 0, eio(rm(t, 42.3, 44.9)));
	return 0.4 * Math.sin(t * 1.8);
};

/* ───────────── scene A: the question (0 – 8) ───────────── */
const SceneA: React.FC<{t: number}> = ({t}) => {
	const capIn = eo(rm(t, 0, 0.8));
	// capsule travels into the drug pan of the scale
	const fly = eio(rm(t, 8.2, 9.3));
	const cx = mix(540, PIV.x - 340 * Math.cos((14 * Math.PI) / 180), fly);
	const cy = mix(700, PIV.y + 340 * Math.sin((14 * Math.PI) / 180) * -1 + 150 - 14, fly);
	const s = mix(1, 130 / 380, fly);
	const rot = mix(-28 + 5 * Math.sin(t * 1.4), -8, fly);
	const capOpacity = t > 9.3 ? 0 : 1;
	const qp = punch(t, 1.2, 0.12);
	return (
		<>
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<g opacity={capOpacity} transform={`translate(${cx} ${cy + (1 - capIn) * 80}) scale(${s * mix(0.6, 1, capIn)})`}>
					<ellipse cx={0} cy={0} rx={250} ry={130} fill={C.amber} opacity={0.07 * (1 - fly)} />
					<Capsule x={0} y={0} len={380} wid={150} rot={rot} imprint />
				</g>
			</svg>
			<div style={{position: 'absolute', inset: 0, ...enterStyle(t, 0.25, 7.3)}}>
				<Fa y={350} size={92} weight={900}>
					<span style={{color: C.ink}}>«آسنترا بخورم </span>
					<span style={{display: 'inline-block', color: C.amber, opacity: inn(t, 1.15, 0.3), scale: `${qp}`}}>یا نه؟»</span>
				</Fa>
			</div>
			{/* what it does */}
			{[
				{a: 2.45, label: 'درمان افسردگی', y: 980},
				{a: 3.55, label: 'بدون اعتیاد', y: 1075},
			].map((it, i) => (
				<div key={i} style={{position: 'absolute', inset: 0, ...enterStyle(t, it.a, 7.2 + i * 0.05, 34)}}>
					<Fa y={it.y} x={590} size={52} weight={800}>
						{it.label}
					</Fa>
					<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
						<Check x={350 - (i === 0 ? 30 : -10)} y={it.y + 2} p={eo(rm(t, it.a + 0.1, it.a + 0.5))} />
					</svg>
				</div>
			))}
			{/* the rules stamp */}
			<div
				style={{
					position: 'absolute',
					left: 540,
					top: 1180,
					opacity: cl(rm(t, 5.75, 5.85)) * (1 - out(t, 7.3)),
					transform: `translate(-50%,-50%) rotate(-5deg) scale(${t < 5.85 ? 1.6 : 1 + 0.6 * (1 - eo(rm(t, 5.85, 6.1)))})`,
					border: `5px solid ${C.red}`,
					borderRadius: 18,
					padding: '0 30px',
				}}
			>
				<div dir="rtl" lang="fa" style={{fontFamily: FA, fontSize: 54, fontWeight: 900, color: C.red, lineHeight: 1.75, whiteSpace: 'nowrap'}}>
					قواعد سخت‌گیرانه!
				</div>
			</div>
		</>
	);
};

/* ───────────── scene D: nervous system shock (28.3 – 35) ───────────── */
const NODES = Array.from({length: 30}, (_, i) => {
	const ang = i * 2.39996 + (rand(i + 3) - 0.5) * 0.5;
	const rad = 380 * Math.sqrt((i + 0.6) / 30) * (0.9 + rand(i + 40) * 0.2);
	return {x: 540 + Math.cos(ang) * rad, y: 740 + Math.sin(ang) * rad * 0.8};
});
const EDGES: [number, number][] = [];
NODES.forEach((n, i) => {
	const near = NODES.map((m, j) => ({j, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2}))
		.filter((o) => o.j !== i)
		.sort((p, q) => p.d - q.d)
		.slice(0, 3);
	near.forEach(({j}) => {
		if (!EDGES.some(([a, b]) => (a === j && b === i) || (a === i && b === j))) EDGES.push([i, j]);
	});
});

const SceneD: React.FC<{t: number}> = ({t}) => {
	const zin = eo(rm(t, 27.95, 28.6));
	const wo = whipOut(t, 34.95);
	const amp = 4 + 16 * (1 - rm(t, 28.3, 31)) + 8 * Math.max(0, Math.sin((t - 30.2) * 3)) * rm(t, 30.2, 30.6) * (1 - rm(t, 33.6, 34.4));
	const f = Math.floor(t * 15); // nervous jitter on twos
	const pos = NODES.map((n, i) => ({x: n.x + (rand(f * 31 + i) - 0.5) * amp, y: n.y + (rand(f * 17 + i + 7) - 0.5) * amp}));
	const flash = Math.floor(t * 10) % 3 === 0 && t < 30 ? 1 : 0;
	const g1 = (rand(f) - 0.5) * 14 * (1 - rm(t, 28.3, 30.5));
	const chips = [
		{a: 30.75, label: 'سرگیجه', x: 830},
		{a: 31.65, label: 'لرزش', x: 540},
		{a: 32.35, label: 'اضطراب ×۲', x: 250},
	];
	return (
		<div style={{position: 'absolute', inset: 0, opacity: zin, translate: `${wo.x}px 0`, filter: wo.blur > 0.5 ? `blur(${wo.blur}px)` : undefined}}>
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, transform: `scale(${mix(0.45, 1, zin)})`, transformOrigin: '540px 760px'}}>
				{EDGES.map(([a, b], k) => (
					<line key={k} x1={pos[a].x} y1={pos[a].y} x2={pos[b].x} y2={pos[b].y} stroke={k % 4 === 0 && flash ? C.red : C.line} strokeOpacity={0.35} strokeWidth={2.5} />
				))}
				{EDGES.map(([a, b], k) => {
					const ph = (t * (1.4 + rand(k) * 1.6) + rand(k + 5)) % 1;
					return <circle key={`p${k}`} cx={mix(pos[a].x, pos[b].x, ph)} cy={mix(pos[a].y, pos[b].y, ph)} r={5} fill={k % 3 ? C.red : C.amber} opacity={0.9} />;
				})}
				{pos.map((p, i) => (
					<circle key={`n${i}`} cx={p.x} cy={p.y} r={i % 5 === 0 ? 16 : 10} fill={i % 5 === 0 ? C.red : C.ink} opacity={0.95} />
				))}
			</svg>
			<div style={{position: 'absolute', inset: 0, ...enterStyle(t, 28.35, 99)}}>
				<Fa
					y={330 + g1 * 0.3}
					x={540 + g1}
					size={96}
					weight={900}
					color={C.red}
					style={{textShadow: `${g1 * 0.6}px 0 0 rgba(63,193,176,0.8), ${-g1 * 0.6}px 0 0 rgba(242,165,65,0.7)`}}
				>
					سیستم عصبی شوکه!
				</Fa>
			</div>
			{chips.map((c, i) => {
				const p = inn(t, c.a, 0.45);
				let tf = '';
				if (i === 0) tf = `rotate(${Math.sin((t - c.a) * 7) * 7 * p}deg)`;
				if (i === 1) tf = `translateX(${Math.sin(t * 70) * 6 * p}px)`;
				if (i === 2) tf = `scale(${1 + 0.07 * Math.max(0, Math.sin((t - c.a) * 9))})`;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: c.x,
							top: 1145,
							opacity: p,
							transform: `translate(-50%,-50%) translateY(${(1 - p) * 40}px) ${tf}`,
							background: 'rgba(229,72,77,0.16)',
							border: `3px solid ${C.red}`,
							borderRadius: 999,
							padding: '0 30px',
						}}
					>
						<div dir="rtl" lang="fa" style={{fontFamily: FA, fontSize: 46, fontWeight: 800, color: C.ink, lineHeight: 1.8, whiteSpace: 'nowrap'}}>
							{c.label}
						</div>
					</div>
				);
			})}
		</div>
	);
};

/* ───────────── scene E: taper staircase (35 – 42) ───────────── */
const STEPS = [100, 75, 50, 25];
const SceneE: React.FC<{t: number}> = ({t}) => {
	const wi = whipIn(t, 35.1);
	const wo = whipOut(t, 42.0);
	const x = wi.x + wo.x;
	const blur = wi.blur + wo.blur;
	const sw = 190;
	const x0 = 540 + sw * 2; // right edge, stairs descend to the left
	const base = 1080;
	const hgt = (i: number) => 120 + (STEPS[i] / 100) * 380;
	const hops = [36.95, 37.6, 38.25, 38.9];
	// which step the capsule stands on
	let step = 0;
	let hopP = 0;
	for (let i = 0; i < 3; i++) if (t >= hops[i]) step = i + 1;
	const k = hops.findIndex((h, i) => i < 3 && t >= h && t < h + 0.45);
	if (k >= 0) hopP = rm(t, hops[k], hops[k] + 0.45);
	const cxAt = (i: number) => x0 - sw * i - sw / 2;
	const cyAt = (i: number) => base - hgt(i) - 36;
	let px = cxAt(step);
	let py = cyAt(step);
	if (k >= 0) {
		const e = eio(hopP);
		px = mix(cxAt(k), cxAt(k + 1), e);
		py = mix(cyAt(k), cyAt(k + 1), e) - Math.sin(Math.PI * hopP) * 90;
		step = k;
	}
	const capScale = mix(1, 0.55, rm(t, 36.9, 39.4));
	const hl = punch(t, 40.07, 0.1);
	const ul = eo(rm(t, 40.15, 40.8));
	return (
		<div style={{position: 'absolute', inset: 0, translate: `${x}px 0`, filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}>
			<div style={{position: 'absolute', inset: 0, ...enterStyle(t, 35.2, 99)}}>
				<Fa y={330} size={90} weight={900} color={C.ink} style={{scale: `${hl}`}}>
					کاهش <span style={{color: C.teal}}>تدریجی</span> دوز
				</Fa>
				<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
					<line x1={mix(760, 760, 1)} y1={392} x2={mix(760, 320, ul)} y2={392} stroke={C.amber} strokeWidth={8} strokeLinecap="round" opacity={ul > 0 ? 1 : 0} />
				</svg>
			</div>
			<div style={{position: 'absolute', inset: 0, ...enterStyle(t, 36.3, 99, 30)}}>
				<div style={{position: 'absolute', left: 540, top: 480, transform: 'translate(-50%,-50%)', background: 'rgba(63,193,176,0.14)', border: `2px solid ${C.teal}`, borderRadius: 999, padding: '0 26px'}}>
					<div dir="rtl" lang="fa" style={{fontFamily: FA, fontSize: 40, fontWeight: 700, color: C.teal, lineHeight: 1.8, whiteSpace: 'nowrap'}}>
						پله‌پله، زیر نظر پزشک
					</div>
				</div>
			</div>
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				{STEPS.map((d, i) => {
					const p = eo(rm(t, 35.3 + i * 0.12, 35.95 + i * 0.12));
					const h = hgt(i) * p;
					const active = i <= step;
					return (
						<g key={i}>
							<rect x={x0 - sw * (i + 1) + 6} y={base - h} width={sw - 12} height={h} rx={14} fill={C.teal} opacity={active ? 0.85 : 0.35} />
							<text x={x0 - sw * i - sw / 2} y={base - h + 62} textAnchor="middle" fontFamily={FA} fontWeight={900} fontSize={46} fill="#0B1120" opacity={p}>
								{faNum(d)}٪
							</text>
						</g>
					);
				})}
				<rect x={x0 - sw * 4} y={base} width={sw * 4} height={10} rx={5} fill={C.line} opacity={inn(t, 35.3)} />
				<text x={540} y={base + 50} textAnchor="middle" fontFamily={FA} fontSize={20} fontWeight={700} fill={C.line} opacity={0.4 * inn(t, 35.3)} direction="ltr">
					{HANDLE}
				</text>
				<g opacity={inn(t, 35.9)}>
					<Capsule x={px} y={py} len={150 * capScale} wid={60 * capScale} rot={-8 + (k >= 0 ? hopP * 360 : 0)} />
				</g>
			</svg>
		</div>
	);
};

/* ───────────── scene G: the warning (46 – 53.6) ───────────── */
const SceneG: React.FC<{t: number}> = ({t}) => {
	const wo = whipOut(t, 53.65);
	const tri = eo(rm(t, 46.3, 46.95));
	const bang = eo(rm(t, 46.9, 47.2));
	const triUp = eio(rm(t, 47.8, 48.3));
	const triY = mix(640, 470, triUp);
	const triS = mix(1.25, 0.72, triUp);
	const drop = eo(rm(t, 51.2, 51.75));
	const arrow = inn(t, 52.15, 0.4);
	const bob = Math.sin((t - 52.15) * 6) * 8 * arrow;
	return (
		<div style={{position: 'absolute', inset: 0, translate: `${wo.x}px 0`, filter: wo.blur > 0.5 ? `blur(${wo.blur}px)` : undefined}}>
			<div style={{position: 'absolute', inset: 0, ...enterStyle(t, 46.35, 99)}}>
				<Fa y={300} size={96} weight={900} color={C.amber}>
					مراقب باشید!
				</Fa>
			</div>
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<g transform={`translate(540 ${triY}) scale(${triS})`}>
					<path d="M0,-120 L120,95 L-120,95 Z" fill="rgba(229,72,77,0.15)" stroke={C.red} strokeWidth={12} strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tri} />
					<g opacity={bang} transform={`scale(${0.6 + 0.4 * bang})`}>
						<rect x={-9} y={-55} width={18} height={85} rx={9} fill={C.red} />
						<circle cx={0} cy={62} r={11} fill={C.red} />
					</g>
				</g>
				{/* آسنترا + مسکن */}
				<g opacity={inn(t, 48.05)} transform={`translate(0 ${(1 - inn(t, 48.05)) * 40})`}>
					<Capsule x={800} y={720} len={200} wid={80} rot={-18} />
				</g>
				<g opacity={inn(t, 48.75)}>
					<text x={540} y={745} textAnchor="middle" fontFamily={FA} fontSize={90} fontWeight={900} fill={C.ink}>
						+
					</text>
				</g>
				<g opacity={inn(t, 49.1)} transform={`translate(280 ${720 + (1 - inn(t, 49.1)) * 40})`}>
					<circle r={62} fill="#FFFFFF" />
					<circle r={62} fill="none" stroke={C.line} strokeWidth={4} />
					<line x1={-40} y1={0} x2={40} y2={0} stroke={C.line} strokeWidth={6} strokeLinecap="round" />
				</g>
				{/* blood drop */}
				<g opacity={drop} transform={`translate(${430} ${1010 - (1 - drop) * 120})`}>
					<path d="M0,-80 C30,-35 55,-5 55,30 C55,62 30,85 0,85 C-30,85 -55,62 -55,30 C-55,-5 -30,-35 0,-80 Z" fill={C.red} />
					<ellipse cx={-20} cy={30} rx={9} ry={18} fill="#FFFFFF" opacity={0.35} />
				</g>
				<g opacity={arrow} transform={`translate(330 ${1015 - bob})`}>
					<path d="M0,-55 L34,-12 L12,-12 L12,50 L-12,50 L-12,-12 L-34,-12 Z" fill={C.red} />
				</g>
			</svg>
			<Fa y={840} x={800} size={42} weight={800} color={C.amber} style={{opacity: inn(t, 48.15)}}>
				آسنترا
			</Fa>
			<Fa y={840} x={280} size={40} weight={800} style={{opacity: inn(t, 49.2)}}>
				مسکن ضدالتهاب
			</Fa>
			<Fa y={895} x={280} size={28} weight={500} color={C.dim} style={{opacity: inn(t, 49.6)}}>
				(مثل ایبوپروفن)
			</Fa>
			<Fa y={1015} x={660} size={64} weight={900} color={C.red} style={{opacity: drop, translate: `${(1 - drop) * -30}px 0`}}>
				خطر خونریزی
			</Fa>
		</div>
	);
};

/* ───────────── balance across B, C, F, H ───────────── */
const BalanceLayer: React.FC<{t: number}> = ({t}) => {
	let visible = false;
	let tf = '';
	let opacity = 1;
	let blur = 0;
	let build = 1;
	let mood = 10;
	let glow = 0;
	let drug = 1;
	let drugDrop = 0;
	let drugRot = 0;
	let labels = 1;
	let halo = 0;
	const theta = thetaAt(t);
	if (t >= 8.1 && t < 28.6) {
		visible = true;
		build = rm(t, 8.15, 9.6);
		mood = cl((t - 9.5) * 12, 0, 10);
		labels = inn(t, 10.2) * (1 - rm(t, 27.6, 27.9));
		drug = t < 9.3 ? 0 : 1;
		glow = rm(t, 19.6, 20.2) * (1 - rm(t, 24.4, 24.6));
		if (t >= 24.6) {
			const tau = t - 24.6;
			drugDrop = 0.5 * 4200 * tau * tau;
			drugRot = tau * 420;
		}
		const z = eio(rm(t, 27.95, 28.5));
		const R = {x: PIV.x + 340 * Math.cos((31 * Math.PI) / 180), y: PIV.y + 340 * Math.sin((31 * Math.PI) / 180) + 170};
		tf = `translate(${R.x}px, ${R.y}px) scale(${1 + 4 * z}) translate(${-R.x}px, ${-R.y}px)`;
		opacity = 1 - rm(t, 28.15, 28.5);
		blur = 18 * z;
	} else if (t >= 41.7 && t < 46.7) {
		visible = true;
		const wi = whipIn(t, 42.1);
		const rec = eio(rm(t, 46.1, 46.55));
		tf = `translate(${wi.x}px, ${-260 * rec}px) scale(${1 - 0.45 * rec})`;
		opacity = 1 - rec;
		blur = wi.blur;
		drug = 0.55;
		mood = 4 + cl((t - 43.7) * 5, 0, 6);
		glow = rm(t, 43.8, 44.4);
	} else if (t >= 53.3) {
		visible = true;
		const wi = whipIn(t, 53.75);
		const e = eio(rm(t, 60.35, 60.95));
		// shrink into the end-card emblem
		tf = `translate(${wi.x}px, ${-200 * e}px) translate(540px, 860px) scale(${1 - 0.66 * e}) translate(-540px, -860px)`;
		blur = wi.blur;
		glow = 1;
		halo = inn(t, 54.0, 0.8) * (1 - e);
		labels = 1 - e;
	}
	if (!visible) return null;
	return (
		<svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity, filter: blur > 0.5 ? `blur(${blur}px)` : undefined}}>
			<g style={{transform: tf, transformOrigin: '0 0'}}>
				<Balance t={t} theta={theta} build={build} mood={mood} moodGlow={glow} drug={drug} drugDrop={drugDrop} drugRot={drugRot} labels={labels} halo={halo} />
			</g>
		</svg>
	);
};

/* headlines that live over the balance */
const BalanceText: React.FC<{t: number}> = ({t}) => {
	const day = Math.round(mix(1, 14, eio(rm(t, 12.6, 17.4))));
	const bar = eio(rm(t, 12.6, 17.4));
	const stable = inn(t, 17.75, 0.45);
	const zoomOut = 1 - rm(t, 27.95, 28.3);
	return (
		<>
			<div style={{position: 'absolute', inset: 0, ...enterStyle(t, 8.35, 20.85)}}>
				<Fa y={330} size={88} weight={900}>
					ترازوی <span style={{color: C.amber}}>شیمیایی</span> مغز
				</Fa>
			</div>
			{/* day counter */}
			<div style={{position: 'absolute', inset: 0, ...enterStyle(t, 12.45, 19.3, 30)}}>
				<Fa y={470} size={50} weight={800} color={C.teal}>
					روز {faNum(day)} <span style={{color: C.dim, fontWeight: 500, fontSize: 36}}>از ۱۴</span>
				</Fa>
				<div style={{position: 'absolute', left: 290, top: 530, width: 500, height: 12, borderRadius: 6, background: 'rgba(201,210,227,0.18)'}}>
					<div style={{position: 'absolute', right: 0, top: 0, height: 12, borderRadius: 6, width: `${bar * 100}%`, background: C.teal}} />
				</div>
			</div>
			<div
				style={{
					position: 'absolute',
					left: 540,
					top: 640,
					opacity: stable * (1 - out(t, 19.3)),
					transform: `translate(-50%,-50%) scale(${0.7 + 0.3 * stable})`,
					background: C.teal,
					borderRadius: 999,
					padding: '0 28px',
				}}
			>
				<div dir="rtl" lang="fa" style={{fontFamily: FA, fontSize: 42, fontWeight: 900, color: '#0B1120', lineHeight: 1.75, whiteSpace: 'nowrap'}}>
					ثابت ✓
				</div>
			</div>
			<div style={{position: 'absolute', inset: 0, ...enterStyle(t, 19.6, 20.85, 30)}}>
				<Fa y={470} size={56} weight={800} color={C.amber}>
					احساس بهبودی…
				</Fa>
			</div>
			<div style={{position: 'absolute', inset: 0, ...enterStyle(t, 21.0, 24.18)}}>
				<Fa y={330} size={74} weight={900}>
					چرا <span style={{color: C.red}}>یک‌دفعه</span> قطع نکنیم؟
				</Fa>
			</div>
			<div style={{position: 'absolute', inset: 0, opacity: zoomOut}}>
				<Fa y={330} size={104} weight={900} color={C.red} style={{opacity: cl(rm(t, 24.5, 24.6)), scale: `${punch(t, 24.52, 0.22, 0.35)}`}}>
					قطع ناگهانی!
				</Fa>
				<Fa y={470} size={58} weight={800} style={{opacity: inn(t, 25.55, 0.4) * (t > 24.5 ? 1 : 0)}}>
					سقوط آزاد خلق‌وخو ↓
				</Fa>
			</div>
			{/* scene F text */}
			<div style={{position: 'absolute', inset: 0, ...enterStyle(t, 42.35, 46.05)}}>
				<Fa y={330} size={84} weight={900}>
					مغز <span style={{color: C.teal}}>فرصت تطبیق</span> دارد
				</Fa>
			</div>
			<div style={{position: 'absolute', inset: 0, ...enterStyle(t, 43.85, 46.05, 30)}}>
				<Fa y={470} size={52} weight={800} color={C.amber}>
					✦ تولید طبیعی ✦
				</Fa>
			</div>
			{/* scene H text */}
			<div style={{position: 'absolute', inset: 0, ...enterStyle(t, 53.95, 60.3)}}>
				<Fa y={330} size={86} weight={900}>
					آسنترا <span style={{color: C.teal}}>داروی ایمن</span> است
				</Fa>
			</div>
			<div style={{position: 'absolute', inset: 0, ...enterStyle(t, 56.05, 60.3, 30)}}>
				<Fa y={470} size={50} weight={800} color={C.amber}>
					به شرطی که…
				</Fa>
			</div>
		</>
	);
};

/* "only your doctor" badge, scene H */
const DoctorBadge: React.FC<{t: number}> = ({t}) => {
	const p = inn(t, 58.55, 0.5);
	const o = out(t, 60.3);
	if (p <= 0) return null;
	return (
		<div style={{position: 'absolute', left: 540, top: 1150, opacity: p * (1 - o), transform: `translate(-50%,-50%) scale(${(0.6 + 0.4 * p) * punch(t, 58.55, 0.05)})`, display: 'flex', alignItems: 'center', gap: 18, flexDirection: 'row-reverse', background: 'rgba(63,193,176,0.15)', border: `3px solid ${C.teal}`, borderRadius: 999, padding: '4px 34px'}}>
			<svg width={56} height={56} viewBox="-28 -28 56 56">
				<rect x={-9} y={-24} width={18} height={48} rx={4} fill={C.teal} />
				<rect x={-24} y={-9} width={48} height={18} rx={4} fill={C.teal} />
			</svg>
			<div dir="rtl" lang="fa" style={{fontFamily: FA, fontSize: 50, fontWeight: 900, color: C.ink, lineHeight: 1.75, whiteSpace: 'nowrap'}}>
				فقط با نظر پزشک
			</div>
		</div>
	);
};

/* ───────────── end card (60.5 – 64) ───────────── */
const EndCard: React.FC<{t: number}> = ({t}) => {
	if (t < 60.3) return null;
	const ring = eo(rm(t, 60.45, 61.3));
	const h = inn(t, 60.85, 0.6);
	const f = inn(t, 61.25, 0.6);
	const d = inn(t, 61.6, 0.6);
	return (
		<>
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<defs>
					<linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor={C.amber} />
						<stop offset="1" stopColor={C.teal} />
					</linearGradient>
				</defs>
				<circle cx={540} cy={660} r={250} fill="none" stroke="url(#ring)" strokeWidth={10} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform="rotate(-90 540 660)" strokeLinecap="round" />
			</svg>
			<div dir="ltr" style={{position: 'absolute', left: 540, top: 1010, transform: `translate(-50%,-50%) scale(${0.85 + 0.15 * h})`, opacity: h, fontFamily: FA, fontSize: 84, fontWeight: 900, color: C.ink, whiteSpace: 'nowrap'}}>
				{HANDLE}
			</div>
			<div style={{position: 'absolute', left: 540, top: 1135, transform: `translate(-50%,-50%) translateY(${(1 - f) * 30}px)`, opacity: f, background: C.amber, borderRadius: 999, padding: '0 40px'}}>
				<div dir="rtl" lang="fa" style={{fontFamily: FA, fontSize: 46, fontWeight: 900, color: '#0B1120', lineHeight: 1.8, whiteSpace: 'nowrap'}}>
					برای نکات بیشتر دنبال کنید
				</div>
			</div>
			<Fa y={1240} size={28} weight={500} color={C.dim} style={{opacity: d}}>
				این ویدیو جایگزین مشورت با پزشک نیست.
			</Fa>
		</>
	);
};

export const Reel: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const danger = 0.55 * rm(t, 24.5, 24.7) * (1 - rm(t, 34.6, 35.2)) + 0.75 * rm(t, 46.2, 46.6) * (1 - rm(t, 53.4, 53.8));
	const [sx1, sy1] = shake(t, 24.52, 25.7, 22);
	const [sx2, sy2] = shake(t, 28.3, 30.2, 10);
	const breathe = 1 + 0.025 * Math.sin(t * 0.5);
	return (
		<div style={{position: 'absolute', inset: 0, overflow: 'hidden', background: C.bg0}}>
			<Background t={t} danger={danger} />
			<div style={{position: 'absolute', inset: 0, transform: `translate(${sx1 + sx2}px, ${sy1 + sy2 + 70}px) scale(${breathe})`}}>
				{t < 9.4 ? <SceneA t={t} /> : null}
				<BalanceLayer t={t} />
				{t >= 8.1 && t < 28.6 ? <BalanceText t={t} /> : null}
				{t >= 41.7 && t < 46.7 ? <BalanceText t={t} /> : null}
				{t >= 53.3 && t < 60.8 ? <BalanceText t={t} /> : null}
				{t >= 27.9 && t < 35.4 ? <SceneD t={t} /> : null}
				{t >= 34.7 && t < 42.4 ? <SceneE t={t} /> : null}
				{t >= 46.1 && t < 54 ? <SceneG t={t} /> : null}
				<DoctorBadge t={t} />
				<EndCard t={t} />
				{t >= 24.5 && t < 24.75 ? <div style={{position: 'absolute', inset: 0, background: C.red, opacity: 0.35 * (1 - rm(t, 24.5, 24.75))}} /> : null}
			</div>
			<Captions t={t} />
			<Watermark t={t} />
		</div>
	);
};
