/*
 * FMD vaccine reel (9:16, 82 s), summarising "راهنمای واکسن‌های تب برفکی".
 * Music first: music/compose_lab_pulse.py, 120 BPM, 1 bar = 2 s. Every section change is a whip pan
 * peaking on a downbeat; the camera travels left (RTL), so layers leave to the right.
 *
 * Timed to the Persian voice-over (public/audio/mix.wav), still on the 120 BPM grid:
 * 0-10 hook | 10-16 six criteria | 16-76 criteria #1-#6, 10 s each | 76-86 verdict
 * 86-96 end card (final hit at 92 s)
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FA} from './fonts';
import {Antibody, Coins, Cow, Helix, Lock, Magnifier, Shield, Syringe, Vial, Virus} from './icons';
import {BlurDefs, Box, C, clamp, enter, Fa, faNum, H, IN, leave, mix, pop, pulse, remap, sp, W, whip, Words} from './kit';

export const REEL_SECONDS = 96;

const WHIPS = [10, 16, 26, 36, 46, 56, 66, 76, 86];

function layer(t: number, tin: number | null, tout: number | null) {
	const a = tin === null ? {p: 1, blur: 0, scale: 1} : whip(t, tin);
	const b = tout === null ? {p: 0, blur: 0, scale: 1} : whip(t, tout);
	return {x: -W * (1 - a.p) + W * b.p, blur: Math.max(a.blur, b.blur), scale: Math.min(a.scale, b.scale)};
}

const Layer: React.FC<{id: string; t: number; tin: number | null; tout: number | null; children: React.ReactNode}> = ({id, t, tin, tout, children}) => {
	if ((tin !== null && t < tin - 0.4) || (tout !== null && t > tout + 0.4)) return null;
	const l = layer(t, tin, tout);
	return (
		<AbsoluteFill style={{transform: `translateX(${l.x.toFixed(2)}px) scale(${l.scale.toFixed(4)})`, filter: l.blur > 0.3 ? `url(#${id})` : undefined}}>
			<BlurDefs id={id} x={l.blur} />
			{children}
		</AbsoluteFill>
	);
};

/* ---------------------------------------------------------------- background */
const rand = (i: number) => {
	const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
	return x - Math.floor(x);
};

const Background: React.FC<{t: number}> = ({t}) => {
	const cam = WHIPS.reduce((s, at) => s + whip(t, at).p, 0); // screens travelled
	const hexX = (cam * W * 0.22) % 104;
	const hex = 'M30 0 L60 17.3 L60 51.9 L30 69.3 L0 51.9 L0 17.3 Z';
	const glow = 0.55 + 0.12 * pulse(t, 0.18) * (t > 8 && t < 78 ? 1 : 0);
	return (
		<AbsoluteFill style={{background: `radial-gradient(120% 80% at 50% 38%, ${C.bg1} 0%, ${C.bg0} 70%)`}}>
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				<defs>
					<pattern id="hex" width={104} height={120} patternUnits="userSpaceOnUse" patternTransform={`translate(${hexX.toFixed(2)} ${(-t * 6) % 120})`}>
						<path d={hex} transform="translate(0 0)" fill="none" stroke={C.line} strokeWidth={1.4} />
						<path d={hex} transform="translate(52 60)" fill="none" stroke={C.line} strokeWidth={1.4} />
					</pattern>
					<radialGradient id="vig" cx="50%" cy="45%" r="65%">
						<stop offset="0%" stopColor="#fff" stopOpacity={1} />
						<stop offset="100%" stopColor="#fff" stopOpacity={0} />
					</radialGradient>
					<mask id="vigm">
						<rect width={W} height={H} fill="url(#vig)" />
					</mask>
				</defs>
				<rect width={W} height={H} fill="url(#hex)" mask="url(#vigm)" opacity={glow} />
				{Array.from({length: 46}, (_, i) => {
					const depth = 0.3 + rand(i) * 0.7;
					const x = (((rand(i + 50) * W + cam * W * 0.5 * depth) % W) + W) % W;
					const y = (((rand(i + 99) * H - t * 22 * depth) % H) + H) % H;
					const r = 1.5 + depth * 3.5;
					return <circle key={i} cx={x} cy={y} r={r} fill={i % 5 === 0 ? C.teal : C.cyan} opacity={0.12 + depth * 0.32} />;
				})}
			</svg>
		</AbsoluteFill>
	);
};

/* ---------------------------------------------------------------- 0-8 s: hook */
const Hook: React.FC<{t: number}> = ({t}) => {
	const shrink = IN(remap(t, 4, 4.9));
	const vy = mix(820, 560, shrink);
	const vs = mix(430, 300, shrink) * (1 + 0.035 * pulse(t, 0.1) * (t > 4 ? 1 : 0.4));
	const titleOut = leave(t, 3.75);
	// antibodies fly in and bind the capsid on the beats of bar 3
	const abs = [0, 1, 2, 3, 4, 5].map((i) => {
		const a = (Math.PI * 2 * i) / 6 - Math.PI / 2;
		const arr = enter(t, 5.0 + i * 0.25, 0.7);
		const far = 760;
		const near = vs * 0.62;
		const d = mix(far, near, arr);
		return {x: 540 + d * Math.cos(a), y: vy + d * Math.sin(a), rot: (a * 180) / Math.PI - 90 + 180, o: clamp(arr * 3), bound: arr > 0.98};
	});
	const neutral = clamp(remap(t, 6.4, 7.2));
	return (
		<AbsoluteFill>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<circle cx={540} cy={vy} r={vs * 0.62} fill="none" stroke={C.red} strokeWidth={2} opacity={0.25 * (1 - neutral)} strokeDasharray="6 10" />
				<Virus x={540} y={vy} s={vs} rot={t * 14} color={neutral > 0.5 ? C.teal : C.red} fill={neutral > 0.5 ? 'rgba(25,195,180,0.12)' : 'rgba(255,93,108,0.14)'} sw={2.4} />
				{abs.map((a, i) => (
					<Antibody key={i} x={a.x} y={a.y} s={120} rot={a.rot} opacity={a.o} />
				))}
			</svg>
			<Box x={60} y={1180} w={960} style={{opacity: 1 - titleOut, transform: `translateY(${-60 * titleOut}px)`}}>
				<Fa size={64} weight={600} color={C.cyan}>
					راهنمای انتخاب واکسن
				</Fa>
				<Fa size={170} weight={900} style={{lineHeight: 1.45, marginTop: -10}}>
					تب برفکی
				</Fa>
				<div dir="ltr" style={{fontFamily: FA, fontSize: 34, color: C.dim, textAlign: 'center', letterSpacing: '0.18em', fontWeight: 500}}>
					FOOT-AND-MOUTH DISEASE
				</div>
			</Box>
			{t >= 3.9 && (
				<Box x={60} y={960} w={960}>
					<Words text="چه چیزی یک واکسن را [واقعاً] مؤثر می‌کند؟" t={t} at={4.05} size={92} weight={900} stagger={0.09} />
				</Box>
			)}
			{t >= 5.9 && (
				<Box x={60} y={1290} w={960}>
					<Words text="شش معیار علمی که باید بدانید" t={t} at={6.0} size={52} weight={600} color={C.mint} />
				</Box>
			)}
		</AbsoluteFill>
	);
};

/* ---------------------------------------------------------------- 8-16 s: six criteria */
const CRITERIA = ['توقف شیوع', 'تطابق با سویه‌ها', 'توان ایمنی‌زایی', 'عاری از NSP', 'سرم و ایمنی زیستی', 'کیفیت در برابر هزینه'];

const Grid: React.FC<{t: number}> = ({t}) => {
	const cw = 450;
	const ch = 300;
	return (
		<AbsoluteFill>
			<Box x={60} y={250} w={960}>
				<Words text="[۶ معیار] انتخاب واکسن مؤثر" t={t} at={8.3} size={78} weight={900} />
			</Box>
			{CRITERIA.map((label, i) => {
				const col = i % 2; // 0 = right column (RTL)
				const row = Math.floor(i / 2);
				const x = col === 0 ? 1080 - 60 - cw : 60;
				const y = 520 + row * (ch + 40);
				const p = sp(t, 9.0 + i * 0.5);
				const lit = i === 0 ? clamp(remap(t, 13.4, 13.8)) : 0;
				return (
					<Box
						key={i}
						x={x}
						y={y}
						w={cw}
						h={ch}
						style={{
							opacity: clamp(p * 1.5),
							transform: `translateY(${(1 - p) * 80}px) scale(${0.9 + 0.1 * p + 0.04 * lit})`,
							background: C.card,
							border: `3px solid ${lit > 0 ? C.amber : 'rgba(95,225,255,0.35)'}`,
							borderRadius: 34,
							boxShadow: lit > 0 ? `0 0 ${50 * lit}px rgba(255,194,75,0.45)` : '0 20px 50px rgba(0,0,0,0.35)',
						}}
					>
						<Box x={cw - 130} y={28} w={100} h={100} style={{borderRadius: 50, background: i === 0 && lit ? C.amber : C.teal}}>
							<Fa size={64} weight={900} color={C.bg0} style={{lineHeight: '100px'}}>
								{faNum(i + 1)}
							</Fa>
						</Box>
						<Box x={24} y={150} w={cw - 48}>
							<Fa size={44} weight={800} align="right">
								{label.includes('NSP') ? (
									<>
										عاری از <bdi>NSP</bdi>
									</>
								) : (
									label
								)}
							</Fa>
						</Box>
					</Box>
				);
			})}
		</AbsoluteFill>
	);
};

/* ---------------------------------------------------------------- criterion template */
const Criterion: React.FC<{
	t: number;
	start: number;
	n: number;
	title: string;
	sub: string;
	fact: string;
	factAt?: number;
	children: (u: number) => React.ReactNode;
}> = ({t, start, n, title, sub, fact, factAt = 4.0, children}) => {
	const u = t - start;
	const np = sp(u, 0.1);
	const line = IN(remap(u, 0.5, 1.3));
	return (
		<AbsoluteFill>
			{/* big outlined numeral */}
			<Box x={790} y={170} w={250} style={{transform: `scale(${0.75 + 0.25 * np})`, opacity: clamp(np * 1.6), transformOrigin: 'center'}}>
				<div style={{fontFamily: FA, fontWeight: 900, fontSize: 330, lineHeight: 1.2, color: 'transparent', WebkitTextStroke: `5px ${C.cyan}`, textAlign: 'center'}}>
					{faNum(n)}
				</div>
			</Box>
			<Box x={50} y={250} w={760}>
				<Words text={title} t={u} at={0.25} size={78} weight={900} align="right" stagger={0.08} />
				<Words text={sub} t={u} at={0.6} size={44} weight={500} align="right" color={C.mint} />
			</Box>
			<Box x={50} y={600} w={980} h={4} style={{background: `linear-gradient(to left, ${C.cyan}, rgba(95,225,255,0))`, transform: `scaleX(${line})`, transformOrigin: 'right center'}} />
			<Box x={0} y={640} w={W} h={720}>
				{children(u)}
			</Box>
			<Box
				x={60}
				y={1390}
				w={960}
				style={{
					opacity: clamp(enter(u, factAt - 0.1, 0.4) * 1.2),
					background: 'rgba(3,16,28,0.55)',
					borderRight: `6px solid ${C.amber}`,
					borderRadius: 24,
					padding: '18px 34px',
					boxSizing: 'border-box',
				}}
			>
				<Words text={fact} t={u} at={factAt} size={50} weight={700} align="right" stagger={0.05} />
			</Box>
		</AbsoluteFill>
	);
};

/* Persian label placed absolutely inside the illustration area. */
const Label: React.FC<{x: number; y: number; w: number; size?: number; color?: string; weight?: number; o?: number; children: React.ReactNode}> = ({
	x,
	y,
	w,
	size = 38,
	color = C.white,
	weight = 700,
	o = 1,
	children,
}) => (
	<Box x={x} y={y} w={w} style={{opacity: o}}>
		<Fa size={size} weight={weight} color={color}>
			{children}
		</Fa>
	</Box>
);

/* #1 Stop the outbreak: infection travels along the herd until a shield breaks the chain. */
const Ill1: React.FC<{u: number}> = ({u}) => {
	const xs = [960, 750, 540, 330, 120];
	const infectAt = [1.6, 2.2, 2.8, 99, 99];
	const shield = pop(u, 3.0);
	const prot = clamp(remap(u, 3.3, 3.8));
	const sparkX = mix(xs[2], 435, clamp(remap(u, 2.8, 3.1)));
	return (
		<>
			<svg width={W} height={720} style={{position: 'absolute'}}>
				{xs.slice(0, 4).map((x, i) => {
					const broken = i === 2 && u > 3.05;
					const off = broken ? IN(remap(u, 3.05, 3.5)) * 24 : 0;
					const p = enter(u, 1.2 + i * 0.12);
					return (
						<g key={i} opacity={p}>
							<line x1={x - 80} y1={300} x2={(x + xs[i + 1]) / 2 + 8 + off} y2={300 - off} stroke={u > infectAt[i + 1] ? C.red : 'rgba(234,246,255,0.35)'} strokeWidth={5} strokeDasharray="14 10" />
							<line x1={(x + xs[i + 1]) / 2 - 8 - off} y1={300 + off} x2={xs[i + 1] + 80} y2={300} stroke={u > infectAt[i + 1] ? C.red : 'rgba(234,246,255,0.35)'} strokeWidth={5} strokeDasharray="14 10" />
						</g>
					);
				})}
				{xs.map((x, i) => {
					const p = sp(u, 1.0 + i * 0.12);
					const sick = u > infectAt[i];
					const safe = i >= 3 ? prot : 0;
					const sickPulse = sick ? 0.06 * pulse(u - infectAt[i], 0.15) : 0;
					return (
						<g key={i} opacity={clamp(p * 1.5)}>
							{safe > 0 && <circle cx={x} cy={300} r={80 * safe} fill="rgba(25,195,180,0.12)" stroke={C.teal} strokeWidth={3} />}
							{sick && <circle cx={x} cy={300} r={80} fill="rgba(255,93,108,0.12)" stroke={C.red} strokeWidth={3} />}
							<Cow x={x} y={300 - (1 - p) * 60} s={128 * (1 + sickPulse)} color={sick ? C.red : safe > 0.5 ? C.mint : C.white} />
						</g>
					);
				})}
				<Virus x={xs[0] + 40} y={170} s={90} rot={u * 40} opacity={clamp(remap(u, 1.4, 1.7))} />
				{u > 2.8 && u < 3.2 && <circle cx={sparkX} cy={300} r={16} fill={C.red} opacity={0.9} />}
				<Shield x={435} y={300 - (1 - shield) * 260} s={150} opacity={clamp(shield * 2)} check={clamp(remap(u, 3.3, 3.8))} />
				{u > 3.05 && <circle cx={435} cy={300} r={60 + 140 * IN(remap(u, 3.05, 3.7))} fill="none" stroke={C.amber} strokeWidth={4} opacity={1 - remap(u, 3.05, 3.7)} />}
			</svg>
			<Label x={30} y={430} w={420} size={40} color={C.mint} o={prot}>
				گله‌ی محافظت‌شده
			</Label>
			<Label x={560} y={430} w={500} size={40} color={C.red} o={clamp(remap(u, 2.0, 2.4))}>
				زنجیره‌ی انتقال
			</Label>
		</>
	);
};

/* #2 Strain match: antibodies from the vial find the circulating serotypes. */
const STRAINS = [
	{x: 820, label: 'O', v: 0},
	{x: 540, label: 'A', v: 1},
	{x: 260, label: 'Asia1', v: 2},
];
const Ill2: React.FC<{u: number}> = ({u}) => {
	const vial = sp(u, 1.0);
	return (
		<>
			<svg width={W} height={720} style={{position: 'absolute'}}>
				{STRAINS.map((s, i) => {
					const p = sp(u, 1.2 + i * 0.15);
					const fly = IN(remap(u, 2.4 + i * 0.5, 2.9 + i * 0.5));
					const hit = fly > 0.98;
					const sx = 540;
					const sy = 520;
					const cx = mix(sx, s.x, fly);
					const cy = mix(sy, 250, fly) - Math.sin(Math.PI * fly) * 120;
					return (
						<g key={i}>
							<Virus x={s.x} y={150} s={170 * clamp(p)} rot={u * 25 + i * 30} variant={s.v} color={hit ? C.teal : C.red} fill={hit ? 'rgba(25,195,180,0.14)' : 'rgba(255,93,108,0.14)'} />
							{fly > 0 && <Antibody x={cx} y={cy} s={90} rot={0} />}
							{hit && <circle cx={s.x} cy={150} r={100 + 40 * IN(remap(u, 2.9 + i * 0.5, 3.4 + i * 0.5))} fill="none" stroke={C.teal} strokeWidth={4} opacity={1 - remap(u, 2.9 + i * 0.5, 3.4 + i * 0.5)} />}
						</g>
					);
				})}
				<Vial x={540} y={560 + (1 - vial) * 120} s={200} opacity={clamp(vial * 1.5)} shimmer={u * 4} />
			</svg>
			{STRAINS.map((s, i) => (
				<Box key={i} x={s.x - 120} y={250} w={240} style={{opacity: clamp(remap(u, 1.4 + i * 0.15, 1.8 + i * 0.15))}}>
					<div dir="ltr" style={{fontFamily: FA, fontSize: 40, fontWeight: 800, color: C.white, textAlign: 'center'}}>
						{s.label}
					</div>
				</Box>
			))}
			<Label x={650} y={480} w={420} size={38} color={C.mint} o={clamp(remap(u, 1.6, 2.0))}>
				۱. شناسایی سویه‌ها
			</Label>
			<Label x={10} y={480} w={420} size={38} color={C.mint} o={clamp(remap(u, 3.6, 4.0))}>
				۲. انتخاب واکسن منطبق
			</Label>
		</>
	);
};

/* #3 Immunogenicity: antibody titre over time against the protection threshold. */
const curve = (fn: (x: number) => number, x0: number, x1: number, y0: number, y1: number) =>
	Array.from({length: 61}, (_, i) => {
		const x = i / 60;
		return `${i ? 'L' : 'M'}${(x1 - (x1 - x0) * x).toFixed(1)} ${(y0 - (y0 - y1) * fn(x)).toFixed(1)}`;
	}).join(' ');
const Ill3: React.FC<{u: number}> = ({u}) => {
	const ax = enter(u, 1.0);
	const good = remap(u, 1.7, 3.6);
	const weak = remap(u, 2.0, 3.9);
	const L = 110;
	const R = 980;
	const T = 60;
	const B = 600;
	const thrY = 380;
	// RTL chart: time runs right to left
	const goodD = curve((x) => (1 - Math.exp(-x * 9)) * (0.92 - 0.12 * x), L, R, B, T);
	const weakD = curve((x) => (1 - Math.exp(-x * 7)) * (0.62 - 0.55 * x * x), L, R, B, T);
	const thrP = enter(u, 1.4);
	return (
		<>
			<svg width={W} height={720} style={{position: 'absolute'}}>
				<rect x={L} y={thrY} width={(R - L) * thrP} height={B - thrY} fill="rgba(255,93,108,0.09)" transform={`translate(${(R - L) * (1 - thrP)} 0)`} />
				<path d={`M${R} ${T - 20} V${B} H${L - 20}`} stroke={C.dim} strokeWidth={4} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ax} />
				<line x1={R} y1={thrY} x2={R - (R - L) * thrP} y2={thrY} stroke={C.amber} strokeWidth={4} strokeDasharray="16 12" />
				<path d={weakD} stroke={C.red} strokeWidth={7} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - weak} opacity={0.9} />
				<path d={goodD} stroke={C.teal} strokeWidth={9} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - good} />
			</svg>
			<Label x={110} y={thrY - 70} w={420} size={34} color={C.amber} o={thrP}>
				حد محافظت
			</Label>
			<Label x={110} y={-30} w={420} size={36} color={C.teal} o={clamp(remap(u, 3.3, 3.7))}>
				واکسن باکیفیت
			</Label>
			<Label x={110} y={25} w={420} size={36} color={C.red} o={clamp(remap(u, 3.6, 4.0))}>
				واکسن ضعیف
			</Label>
			<Label x={400} y={B + 10} w={580} size={32} color={C.dim} o={ax}>
				زمان پس از واکسیناسیون ←
			</Label>
			<Box x={R + 8} y={T + 200} w={60} style={{opacity: ax}}>
				<div dir="rtl" lang="fa" style={{fontFamily: FA, fontSize: 32, color: C.dim, writingMode: 'vertical-rl', lineHeight: 1.6}}>
					تیتر آنتی‌بادی
				</div>
			</Box>
		</>
	);
};

/* #4 NSP-free: structural vs non-structural proteins, and a DIVA test that tells them apart. */
const Ill4: React.FC<{u: number}> = ({u}) => {
	const scan = IN(remap(u, 2.6, 4.2));
	const mx = mix(860, 230, scan);
	const res1 = clamp(remap(u, 3.1, 3.4));
	const res2 = clamp(remap(u, 4.0, 4.3));
	const chip = (i: number) => sp(u, 1.0 + i * 0.3);
	return (
		<>
			{[
				{x: 550, title: 'پروتئین ساختاری', body: 'پاسخ ایمنی اختصاصی', c: C.teal},
				{x: 40, title: 'پروتئین غیرساختاری', body: 'فقط با تکثیر فعال ویروس', c: C.red},
			].map((k, i) => (
				<Box
					key={i}
					x={k.x}
					y={10}
					w={490}
					style={{
						opacity: clamp(chip(i) * 1.5),
						transform: `translateY(${(1 - chip(i)) * 60}px)`,
						background: C.card,
						border: `3px solid ${k.c}`,
						borderRadius: 26,
						padding: '14px 24px',
						boxSizing: 'border-box',
					}}
				>
					<Fa size={42} weight={900} color={k.c} align="right">
						{k.title}
					</Fa>
					<Fa size={34} weight={500} align="right" color={C.white}>
						{k.body}
					</Fa>
				</Box>
			))}
			<svg width={W} height={720} style={{position: 'absolute'}}>
				<Cow x={790} y={430} s={190} opacity={enter(u, 1.6)} color={C.mint} />
				<Cow x={300} y={430} s={190} opacity={enter(u, 1.8)} color={C.white} />
				{u > 2.4 && <Magnifier x={mx} y={420 + Math.sin(scan * Math.PI * 2) * 20} s={170} />}
				{res1 > 0 && <Shield x={900} y={340} s={90 * pop(u, 3.1)} check={res1} />}
				{res2 > 0 && <Virus x={410} y={340} s={90 * pop(u, 4.0)} rot={u * 30} />}
			</svg>
			<Label x={590} y={550} w={400} size={38} color={C.mint} o={enter(u, 1.6)}>
				دام واکسینه
			</Label>
			<Label x={100} y={550} w={400} size={38} color={C.white} o={enter(u, 1.8)}>
				دام آلوده
			</Label>
			<Label x={590} y={610} w={400} size={34} color={C.teal} weight={800} o={res1}>
				<bdi>NSP</bdi> منفی ✓
			</Label>
			<Label x={100} y={610} w={400} size={34} color={C.red} weight={800} o={res2}>
				<bdi>NSP</bdi> مثبت ✕
			</Label>
		</>
	);
};

/* #5 Serum & biosafety: a locked vial and a checklist ticked on the beats. */
const ITEMS5 = ['منشأ مستند مواد اولیه', 'گواهی‌نامه‌های کنترل کیفیت', 'ارزیابی ایمنی زیستی'];
const Ill5: React.FC<{u: number}> = ({u}) => {
	const v = sp(u, 1.0);
	const lock = pop(u, 3.6);
	return (
		<>
			<svg width={W} height={720} style={{position: 'absolute'}}>
				<circle cx={220} cy={330} r={190} fill="rgba(25,195,180,0.08)" stroke={C.line} strokeWidth={2} opacity={v} />
				<Helix x={220} y={110} len={440} amp={150} phase={u * 1.6} opacity={0.25 * v} />
				<Vial x={220} y={330 + (1 - v) * 100} s={300} opacity={clamp(v * 1.5)} shimmer={u * 3} level={0.7} />
				{lock > 0.01 && <Lock x={320} y={460} s={120 * lock} />}
			</svg>
			{ITEMS5.map((s, i) => {
				const p = sp(u, 1.6 + i * 0.5);
				const tick = IN(remap(u, 2.1 + i * 0.5, 2.5 + i * 0.5));
				return (
					<Box
						key={i}
						x={450}
						y={110 + i * 150}
						w={590}
						h={120}
						style={{
							opacity: clamp(p * 1.5),
							transform: `translateX(${(1 - p) * 80}px)`,
							background: C.card,
							borderRadius: 24,
							border: `2px solid ${tick > 0.5 ? C.teal : 'rgba(95,225,255,0.3)'}`,
						}}
					>
						<Box x={480} y={20} w={80} h={80}>
							<svg width={80} height={80}>
								<circle cx={40} cy={40} r={34} fill={tick > 0.5 ? C.teal : 'none'} stroke={C.teal} strokeWidth={4} />
								<path d="M24 41 L36 53 L57 29" stroke={C.bg0} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - tick} />
							</svg>
						</Box>
						<Box x={10} y={22} w={460}>
							<Fa size={38} weight={700} align="right">
								{s}
							</Fa>
						</Box>
					</Box>
				);
			})}
		</>
	);
};

/* #6 Quality vs cost: the scale tips toward documented quality. */
const Ill6: React.FC<{u: number}> = ({u}) => {
	const appear = sp(u, 1.0);
	const tip = mix(-12, 14, sp(u, 2.6)); // + = right (quality) side down
	const a = (tip * Math.PI) / 180;
	const px = 540;
	const py = 120;
	const arm = 300;
	const rx = px + arm * Math.cos(a);
	const ry = py + arm * Math.sin(a);
	const lx = px - arm * Math.cos(a);
	const ly = py - arm * Math.sin(a);
	const card = (i: number) => sp(u, 3.2 + i * 0.4);
	return (
		<>
			<svg width={W} height={720} style={{position: 'absolute'}} opacity={clamp(appear * 1.5)}>
				<path d={`M${px} ${py} V360 M${px - 90} 360 H${px + 90}`} stroke={C.dim} strokeWidth={8} strokeLinecap="round" />
				<line x1={lx} y1={ly} x2={rx} y2={ry} stroke={C.white} strokeWidth={8} strokeLinecap="round" />
				<circle cx={px} cy={py} r={14} fill={C.amber} />
				{[
					[lx, ly],
					[rx, ry],
				].map(([x, y], i) => (
					<g key={i}>
						<path d={`M${x} ${y} L${x - 80} ${y + 120} M${x} ${y} L${x + 80} ${y + 120}`} stroke={C.dim} strokeWidth={3} />
						<path d={`M${x - 100} ${y + 120} Q${x} ${y + 175} ${x + 100} ${y + 120} Z`} fill="rgba(234,246,255,0.08)" stroke={C.white} strokeWidth={4} />
					</g>
				))}
				<Coins x={lx} y={ly + 80} s={110} />
				<Shield x={rx} y={ry + 78} s={110} check={clamp(remap(u, 2.9, 3.3))} />
			</svg>
			<Label x={lx - 160} y={ly + 175} w={320} size={36} color={C.amber} o={appear}>
				قیمت
			</Label>
			<Label x={rx - 160} y={ry + 175} w={320} size={36} color={C.teal} o={appear}>
				کیفیت
			</Label>
			{[
				{x: 550, title: 'هگزاوالان پلاس', body: 'پوشش گسترده با یک تزریق', c: C.teal},
				{x: 40, title: 'جایگزین‌ها', body: 'تزریق متعدد و سرم کشتارگاهی', c: C.red},
			].map((k, i) => (
				<Box
					key={i}
					x={k.x}
					y={470}
					w={490}
					style={{
						opacity: clamp(card(i) * 1.5),
						transform: `translateY(${(1 - card(i)) * 60}px)`,
						background: C.card,
						border: `3px solid ${k.c}`,
						borderRadius: 26,
						padding: '12px 24px',
						boxSizing: 'border-box',
					}}
				>
					<Fa size={42} weight={900} color={k.c} align="right">
						{k.title}
					</Fa>
					<Fa size={33} weight={500} align="right">
						{k.body}
					</Fa>
				</Box>
			))}
		</>
	);
};

/* ---------------------------------------------------------------- progress (16-64 s) */
const Progress: React.FC<{t: number}> = ({t}) => {
	const vis = enter(t, 16.1) * (1 - leave(t, 75.75));
	if (vis <= 0) return null;
	return (
		<Box x={60} y={130} w={960} h={14} style={{opacity: vis}}>
			{[0, 1, 2, 3, 4, 5].map((i) => {
				const s = 16 + i * 10;
				const f = clamp(remap(t, s, s + 10));
				const segW = 150;
				const x = 960 - (i + 1) * segW - i * 12; // fills from the right
				return (
					<Box key={i} x={x} y={0} w={segW} h={10} style={{background: 'rgba(234,246,255,0.18)', borderRadius: 5, overflow: 'hidden'}}>
						<Box x={segW * (1 - f)} y={0} w={segW * f} h={10} style={{background: C.amber, borderRadius: 5}} />
					</Box>
				);
			})}
		</Box>
	);
};

/* ---------------------------------------------------------------- 64-72 s: verdict */
const Verdict: React.FC<{t: number}> = ({t}) => {
	const out1 = leave(t, 67.75);
	const sh = sp(t, 68.0);
	return (
		<AbsoluteFill>
			<Box x={60} y={560} w={960} style={{opacity: 1 - out1, transform: `translateY(${-80 * out1}px)`}}>
				<div style={{fontFamily: 'Georgia, serif', fontSize: 220, color: C.amber, textAlign: 'right', lineHeight: 0.8, opacity: enter(t, 64.1)}}>»</div>
				<Words text="معیار انتخاب باید [کیفیت مستند] باشد؛ نه صرفاً قیمت خرید واکسن." t={t} at={64.3} size={76} weight={900} align="right" stagger={0.08} />
			</Box>
			{t > 67.9 && (
				<>
					<svg width={W} height={H} style={{position: 'absolute'}}>
						<Shield x={540} y={560} s={260 * sh} check={clamp(remap(t, 68.4, 69.0))} />
						<circle cx={540} cy={560} r={170 + 30 * pulse(t, 0.15)} fill="none" stroke={C.teal} strokeWidth={2} opacity={0.4 * sh} />
					</svg>
					<Box x={60} y={800} w={960}>
						<Words text="هنگام شیوع، [تخفیف واکسن] نجاتتان می‌دهد یا [خلوص] آن؟" t={t} at={68.4} size={86} weight={900} stagger={0.1} />
					</Box>
				</>
			)}
		</AbsoluteFill>
	);
};

/* ---------------------------------------------------------------- 72-82 s: end card */
const EndCard: React.FC<{t: number}> = ({t}) => {
	const ring = IN(remap(t, 72.2, 73.6));
	const icon = pop(t, 72.9);
	const hit = t >= 78 ? Math.exp(-(t - 78) / 0.35) : 0;
	const glow = clamp(remap(t, 78, 78.4));
	const cy = 640;
	return (
		<AbsoluteFill>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<circle cx={540} cy={cy} r={250} fill="none" stroke={C.cyan} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform={`rotate(-90 540 ${cy})`} />
				<circle cx={540} cy={cy} r={276} fill="none" stroke={C.teal} strokeWidth={2} pathLength={1} strokeDasharray="0.01 0.02" opacity={ring} transform={`rotate(${t * 8} 540 ${cy})`} />
				<circle cx={540} cy={cy} r={250 + 260 * IN(remap(t, 78, 79.2))} fill="none" stroke={C.amber} strokeWidth={8} opacity={t >= 78 ? 1 - remap(t, 78, 79.2) : 0} />
				<circle cx={540} cy={cy} r={240} fill={`rgba(25,195,180,${(0.06 + 0.14 * glow).toFixed(3)})`} opacity={ring} />
				<g transform={`translate(540 ${cy}) scale(${(1 + 0.08 * hit).toFixed(4)}) translate(-540 ${-cy})`}>
					<Shield x={540} y={cy + 10} s={330 * icon} fill="rgba(25,195,180,0.10)" sw={3} />
					<Vial x={480} y={cy + 20} s={150 * icon} shimmer={t * 3} />
					<Syringe x={610} y={cy + 30} s={170 * icon} rot={-50} push={clamp(remap(t, 74, 75.5))} />
					<Helix x={330} y={cy - 160} len={320} amp={34} phase={t * 2} opacity={0.6 * icon} />
					<Helix x={750} y={cy - 160} len={320} amp={34} phase={t * 2 + 1.5} opacity={0.6 * icon} />
				</g>
			</svg>
			<Box x={60} y={960} w={960}>
				<Words text="تهیه‌شده توسط" t={t} at={73.3} size={52} weight={500} color={C.mint} />
			</Box>
			<Box x={40} y={1060} w={1000} style={{transform: `scale(${(1 + 0.06 * hit).toFixed(4)})`, textShadow: `0 0 ${(40 * glow).toFixed(1)}px rgba(95,225,255,0.65)`}}>
				<Words text="شرکت ویراواکسن شایا" t={t} at={74.0} size={104} weight={900} stagger={0.12} />
			</Box>
			<Box x={240} y={1290} w={600} h={4} style={{background: `linear-gradient(to left, rgba(255,194,75,0), ${C.amber}, rgba(255,194,75,0))`, transform: `scaleX(${IN(remap(t, 75.2, 76.2))})`}} />
		</AbsoluteFill>
	);
};

/* ---------------------------------------------------------------- film */
const SECTIONS: {from: number; to: number | null; render: (t: number) => React.ReactNode}[] = [
	{from: 0, to: 10, render: (t) => <Hook t={t} />},
	{from: 10, to: 16, render: (t) => <Grid t={t - 2} />},
	{
		from: 16,
		to: 26,
		render: (t) => (
			<Criterion t={t} start={16} factAt={2.6} n={1} title="متوقف کردن شیوع" sub="پیشگیری در برابر تب برفکی" fact="واکسن مؤثر [زنجیره‌ی انتقال] را می‌شکند و از گله و سرمایه‌ی دامدار محافظت می‌کند.">
				{(u) => <Ill1 u={u} />}
			</Criterion>
		),
	},
	{
		from: 26,
		to: 36,
		render: (t) => (
			<Criterion t={t} start={26} factAt={3.0} n={2} title="تطابق با سویه‌ها" sub="شناخت الگوی اپیدمیولوژیک منطقه" fact="واکسن باید با [سویه‌های در گردش] منطقه، ترکیب آنتی‌ژنی منطبق داشته باشد.">
				{(u) => <Ill2 u={u} />}
			</Criterion>
		),
	},
	{
		from: 36,
		to: 46,
		render: (t) => (
			<Criterion t={t} start={36} factAt={3.0} n={3} title="توان ایمنی‌زایی" sub="ماندگاری ایمنی در میدان" fact="کیفیت واقعی با [آزمون‌های میدانی] و ارزیابی [تیتر آنتی‌بادی] ثابت می‌شود.">
				{(u) => <Ill3 u={u} />}
			</Criterion>
		),
	},
	{
		from: 46,
		to: 56,
		render: (t) => (
			<Criterion t={t} start={46} factAt={3.3} n={4} title="عاری بودن از NSP" sub="خلوص از پروتئین‌های غیرساختاری" fact="واکسن خالص، تشخیص [دام واکسینه] از [دام آلوده] را ممکن می‌کند.">
				{(u) => <Ill4 u={u} />}
			</Criterion>
		),
	},
	{
		from: 56,
		to: 66,
		render: (t) => (
			<Criterion t={t} start={56} factAt={3.6} n={5} title="سرم‌ها و ایمنی زیستی" sub="کیفیت مواد اولیه‌ی زیستی" fact="ایمنی و منشأ [مواد اولیه]، تعیین‌کننده‌ی [ایمنی زیستی] واکسن است.">
				{(u) => <Ill5 u={u} />}
			</Criterion>
		),
	},
	{
		from: 66,
		to: 76,
		render: (t) => (
			<Criterion t={t} start={66} factAt={3.5} n={6} title="کیفیت در برابر هزینه" sub="انتخاب هوشمندانه‌ی واکسن" fact="پوشش آنتی‌ژنی، تعداد دوز و کیفیت ساخت را بسنجید؛ [نه فقط قیمت] را.">
				{(u) => <Ill6 u={u} />}
			</Criterion>
		),
	},
	{from: 76, to: 86, render: (t) => <Verdict t={t - 12} />},
	{from: 86, to: null, render: (t) => <EndCard t={t - 14} />},
];

export const Reel: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = frame / fps;
	return (
		<AbsoluteFill style={{background: C.bg0, overflow: 'hidden'}}>
			<Audio src={staticFile('audio/mix.wav')} />
			<Background t={t} />
			{SECTIONS.map((s, i) => (
				<Layer key={i} id={`l${i}`} t={t} tin={s.from === 0 ? null : s.from} tout={s.to}>
					{s.render(t)}
				</Layer>
			))}
			<Progress t={t} />
		</AbsoluteFill>
	);
};
