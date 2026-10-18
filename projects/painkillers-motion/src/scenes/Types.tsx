/* The five kinds of painkillers, one scene each. */
import React from 'react';
import {At, C, Chip, Fa, Header, Pulses, SceneProps, W, appear, clamp, inn, lineAt, lineEnd, mix, outp, punch, remap, spr} from '../kit';
import {Bone, Capsule, Chili, Dumbbell, Enzyme, Flame, Head, Heart, Jar, NoFlame, Rash, Scalpel, Snow, Spine, Tooth, Tube} from '../icons';

/* A row of drug-name chips under the header, right to left. */
const Names: React.FC<{names: string[]; color: string; t: number; at: number; out: number}> = ({names, color, t, at, out}) => {
	const o = outp(t, out);
	return (
		<div dir="rtl" style={{position: 'absolute', top: 640, left: 40, width: W - 80, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 22, opacity: 1 - o, transform: `translateY(${-o * 40}px)`}}>
			{names.map((n, i) => (
				<Chip key={n} color={color} p={inn(t, at + 0.35 + i * 0.55)} size={54}>
					{n}
				</Chip>
			))}
		</div>
	);
};

/* "Used for" cards that close each section. */
const Uses: React.FC<{items: {label: string; icon: React.ReactNode}[]; color: string; t: number; at: number}> = ({items, color, t, at}) => (
	<div dir="rtl" style={{position: 'absolute', top: 720, left: 0, width: W, display: 'flex', justifyContent: 'center', gap: 40}}>
		{items.map((it, i) => {
			const p = inn(t, at + 0.5 + i * 0.5, 0.7);
			return (
				<div key={it.label} style={{...appear(p, 70, 0.9), width: 420, height: 520, borderRadius: 48, background: 'rgba(255,255,255,0.05)', border: `4px solid ${color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24}}>
					{it.icon}
					<Fa size={58} weight={900}>
						{it.label}
					</Fa>
				</div>
			);
		})}
		<div style={{position: 'absolute', top: -110, left: 0, width: W, opacity: inn(t, at + 0.2)}}>
			<Fa size={56} weight={700} color={color}>
				مناسب برای
			</Fa>
		</div>
	</div>
);

/* A group that is present between `a` and `b` (scene-local seconds). */
const Stage: React.FC<{t: number; a: number; b: number; children: React.ReactNode; style?: React.CSSProperties}> = ({t, a, b, children, style}) => {
	if (t < a - 0.1 || t > b + 0.5) return null;
	const pin = inn(t, a, 0.7);
	const po = outp(t, b, 0.3);
	return <div style={{position: 'absolute', inset: 0, opacity: pin * (1 - po), transform: `translateY(${(1 - pin) * 50 - po * 60}px)`, ...style}}>{children}</div>;
};

/* ---------- 1. NSAIDs ---------- */
export const Nsaid: React.FC<SceneProps> = ({t, sec}) => {
	const at = lineAt(sec);
	const end = lineEnd(sec);
	const c = at('n1c');
	const plug = c + (end('n1c') - c) * 0.55;
	const fly = inn(t, plug - 0.6, 0.6);
	const off = remap(t, plug, plug + 0.2);
	const d = at('n1d');
	const shrink = inn(t, d + 0.6, 2.2);
	const bars = Math.round(mix(5, 1, shrink));
	const mag = inn(t, at('n1b'), 1.4);
	return (
		<>
			<Header n={1} title="مسکن‌های ضدِ التهابی" color={C.nsaid} t={t} at={at('n1t')} />
			<Names names={['ایبوپروفن', 'ناپروکسن', 'دیکلوفناک']} color={C.nsaid} t={t} at={at('n1a')} out={at('n1b') - 0.3} />
			<Stage t={t} a={at('n1b')} b={at('n1e') - 0.2}>
				<At x={400} y={950}>
					<div style={{transform: `scale(${mix(1, 0.35, shrink)})`, transformOrigin: '50% 90%'}}>
						<Flame size={250 + Math.sin(t * 12) * 6} />
					</div>
				</At>
				{/* magnifier sweeps in and settles over the flame */}
				<At x={mix(900, 430, mag)} y={mix(700, 900, mag)} style={{opacity: 1 - inn(t, c, 0.4)}}>
					<svg width={300} height={300} viewBox="0 0 300 300">
						<circle cx="120" cy="120" r="90" stroke={C.ink} strokeWidth="20" fill="rgba(255,255,255,0.08)" />
						<line x1="186" y1="186" x2="270" y2="270" stroke={C.ink} strokeWidth="30" strokeLinecap="round" />
					</svg>
				</At>
				<At x={540} y={1260} style={{opacity: 1 - inn(t, c, 0.4)}}>
					<Chip color={C.nsaid} p={inn(t, at('n1b') + 0.8)}>
						ریشه‌یابی
					</Chip>
				</At>
				<At x={760} y={930}>
					<div style={{...appear(inn(t, c), 40, 0.8), filter: off > 0 ? `grayscale(${off})` : undefined}}>
						<Enzyme size={260} open={t < plug ? 0.6 + 0.4 * Math.abs(Math.sin(t * 5)) : 0.6} />
					</div>
				</At>
				{/* sparks from the enzyme into the flame, until it is switched off */}
				<svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
					<Pulses pts={[[700, 930], [470, 930]]} t={t} a={c + 0.3} b={plug} every={0.3} travel={0.7} r={11} />
				</svg>
				<At x={mix(1250, 660, fly)} y={mix(700, 930, fly)}>
					<div style={{transform: `rotate(${(1 - fly) * 360}deg)`}}>
						<Capsule size={150} a={C.nsaid} face="none" />
					</div>
				</At>
				<At x={760} y={1140}>
					<Chip color={t > plug ? C.dim : C.pain} p={inn(t, c + 0.4)} size={46}>
						{t > plug ? 'آنزیم: خاموش' : 'آنزیمِ التهاب'}
					</Chip>
				</At>
				{/* pain signal meter */}
				<div style={{position: 'absolute', top: 1250, left: 0, width: W, ...appear(inn(t, d))}}>
					<Fa size={46} weight={700} color={C.dim}>
						سیگنالِ درد
					</Fa>
					<div dir="rtl" style={{display: 'flex', justifyContent: 'center', gap: 16, marginTop: 6}}>
						{[0, 1, 2, 3, 4].map((i) => (
							<div key={i} style={{width: 90, height: 34, borderRadius: 10, background: i < bars ? C.pain : 'rgba(255,255,255,0.1)'}} />
						))}
					</div>
				</div>
			</Stage>
			<Stage t={t} a={at('n1e')} b={sec.next - sec.start + 1}>
				<Uses
					color={C.nsaid}
					t={t}
					at={at('n1e')}
					items={[
						{label: 'بعضی سردردها', icon: <Head size={230} />},
						{label: 'دندان‌درد', icon: <Tooth size={220} />},
					]}
				/>
			</Stage>
		</>
	);
};

/* ---------- 2. Opioids ---------- */
const CORD: [number, number][] = [
	[540, 1340],
	[540, 760],
];
const LOCKS = [1180, 1020, 860];

export const Opioid: React.FC<SceneProps> = ({t, sec}) => {
	const at = lineAt(sec);
	const b = at('n2b');
	const slam = spr(t, b + 0.15, 260, 18);
	const shake = t > b + 0.3 && t < b + 0.8 ? Math.sin((t - b) * 70) * 14 * (1 - remap(t, b + 0.3, b + 0.8)) : 0;
	const c = at('n2c');
	const cEnd = lineEnd(sec)('n2c');
	const d = at('n2d');
	const e = at('n2e');
	const lockT = (i: number) => c + (cEnd - c) * (0.45 + i * 0.14);
	return (
		<div style={{position: 'absolute', inset: 0, transform: `translateX(${shake}px)`}}>
			<Header n={2} title="مسکن‌های اُپیوئیدی" color={C.opioid} t={t} at={at('n2t')} />
			<Names names={['مورفین', 'ترامادول', 'کدئین']} color={C.opioid} t={t} at={at('n2a')} out={b - 0.2} />
			<Stage t={t} a={b - 0.1} b={c - 0.15}>
				<At x={540} y={mix(-200, 960, slam)}>
					<div style={{transform: `scale(${punch(t, b + 0.35, 0.12)})`}}>
						<Dumbbell size={520} />
					</div>
				</At>
				<At x={540} y={1210}>
					<Chip color={C.opioid} p={inn(t, b + 0.5)} solid size={58}>
						سنگین‌وزن‌های دنیای مسکن‌ها
					</Chip>
				</At>
			</Stage>
			<Stage t={t} a={c} b={at('n2f') - 0.2}>
				<svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<rect x={505} y={760} width={70} height={600} rx={35} fill="#FFD9C2" opacity={0.9} />
					{LOCKS.map((y) => (
						<rect key={y} x={470} y={y - 26} width={140} height={52} rx={18} fill={C.bg2} stroke={C.opioid} strokeWidth={5} />
					))}
					<g transform="translate(540 700)">
						<path d="M-120 20 C-140 -50 -80 -110 -20 -95 C0 -130 70 -130 88 -85 C140 -75 148 0 112 30 C118 85 55 105 20 85 C-6 112 -78 105 -85 62 C-125 62 -135 35 -120 20Z" fill="#FF9EC0" />
					</g>
					<Pulses
						pts={CORD}
						t={t}
						a={c + 0.2}
						b={sec.next - sec.start}
						every={0.4}
						travel={1.5}
						r={17}
						fade={(p, born) => {
							// each lock already in place takes a share of the signal
							let o = 1;
							LOCKS.forEach((y, i) => {
								const yAt = (1340 - y) / 580;
								if (p > yAt && born + 1.5 * yAt > lockT(i)) o *= t > d ? 0.35 : 0.6;
							});
							return o;
						}}
					/>
				</svg>
				{LOCKS.map((y, i) => {
					const p = inn(t, lockT(i) - 0.45, 0.45);
					const side = i % 2 ? -1 : 1;
					return (
						<At key={y} x={mix(540 + side * 520, 540, p)} y={y} style={{opacity: clamp(p * 4)}}>
							<div style={{transform: `rotate(${(1 - p) * 180}deg) scale(${punch(t, lockT(i), 0.25)})`}}>
								<svg width={120} height={104} viewBox="0 0 120 104">
									<polygon points="30,0 90,0 120,52 90,104 30,104 0,52" fill={C.opioid} />
									<circle cx="60" cy="52" r="16" fill={C.bg} />
								</svg>
							</div>
						</At>
					);
				})}
				<At x={250} y={640}>
					<Chip color={C.opioid} p={inn(t, c + 0.6)} size={46}>
						مغز
					</Chip>
				</At>
				<At x={250} y={1100}>
					<Chip color={C.opioid} p={inn(t, c + 0.9)} size={46}>
						نخاع
					</Chip>
				</At>
				<At x={810} y={1300}>
					<Chip color={C.pain} p={inn(t, d + 0.4)} size={44}>
						درک و پاسخ به درد ↓
					</Chip>
				</At>
				<At x={820} y={640}>
					<div style={{...appear(spr(t, e + 0.3, 150, 12), 40, 0.6), transform: `scale(${spr(t, e + 0.3, 150, 12) * (1 + 0.06 * Math.sin(t * 7))})`}}>
						<Heart size={150} color={C.opioid} />
					</div>
				</At>
				<At x={820} y={810}>
					<Chip color={C.opioid} p={inn(t, e + 0.7)} size={42}>
						احساسات و رضایت
					</Chip>
				</At>
			</Stage>
			<Stage t={t} a={at('n2f')} b={sec.next - sec.start + 1}>
				<Uses
					color={C.opioid}
					t={t}
					at={at('n2f')}
					items={[
						{label: 'جراحی‌های عمیق', icon: <Scalpel size={230} />},
						{label: 'شکستگی‌ها', icon: <Bone size={260} />},
					]}
				/>
			</Stage>
		</div>
	);
};

/* ---------- 3. Topicals ---------- */
const KIND = [
	{key: 'n3c', title: 'ضدِ التهاب', drug: 'ژلِ دیکلوفناک', icon: <NoFlame size={130} />},
	{key: 'n3d', title: 'بی‌حس‌کننده‌ی عصبی', drug: 'لیدوکائین', icon: <Snow size={130} />},
	{key: 'n3e', title: 'خاموش‌کننده‌ی درد', drug: 'کپسایسین', icon: <Chili size={130} />},
];

export const Topical: React.FC<SceneProps> = ({t, sec}) => {
	const at = lineAt(sec);
	const a = at('n3a');
	const bT = at('n3b');
	const f = at('n3f');
	const g = at('n3g');
	const squeeze = inn(t, a + 0.6, 0.8);
	const rub = inn(t, a + 1.5, 0.5);
	const rings = t > bT ? (t - bT) : -1;
	const merge = inn(t, f + 0.3, 1.0);
	const prod = spr(t, g + 0.1, 150, 15);
	return (
		<>
			<Header n={3} title="مسکن‌های موضعی" color={C.topical} t={t} at={at('n3t')} />
			<Stage t={t} a={a - 0.2} b={at('n3c') - 0.2}>
				<svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					{/* a knee */}
					<path d="M80 1000 C300 980 420 900 540 900 C660 900 760 980 1000 1000 L1000 1180 C760 1170 660 1120 540 1120 C420 1120 300 1170 80 1180Z" fill="#E9B48F" />
					<circle cx={540} cy={1000} r={70 * (1 - inn(t, bT + 0.4, 1.4))} fill={C.pain} opacity={0.8} />
					{rings >= 0 &&
						[0, 1, 2].map((i) => {
							const k = (rings * 0.9 + i / 3) % 1;
							return <circle key={i} cx={540} cy={1000} r={60 + k * 240} stroke={C.topical} strokeWidth={10 * (1 - k)} fill="none" opacity={1 - k} />;
						})}
					<ellipse cx={540} cy={990} rx={90 * squeeze} ry={34 * squeeze} fill="#E8FBFF" opacity={0.85 * (1 - inn(t, bT + 0.6, 1))} />
				</svg>
				<At x={mix(900, 720, squeeze)} y={820} style={{opacity: 1 - rub}}>
					<div style={{transform: 'rotate(160deg)'}}>
						<Tube size={300} />
					</div>
				</At>
				{/* a hand rubbing in circles */}
				<At x={540 + Math.cos(t * 6) * 60 * rub} y={960 + Math.sin(t * 6) * 22 * rub} style={{opacity: rub * (1 - inn(t, bT + 0.5, 0.5))}}>
					<div style={{width: 170, height: 120, borderRadius: 70, background: '#D99A70', border: `4px solid ${C.bg}`}} />
				</At>
				<At x={540} y={1300}>
					<Chip color={C.topical} p={inn(t, bT + 0.3)} solid>
						اثرِ مستقیم روی محلِ درد
					</Chip>
				</At>
			</Stage>
			<Stage t={t} a={at('n3c') - 0.1} b={sec.next - sec.start + 1}>
				{KIND.map((k, i) => {
					const p = inn(t, at(k.key), 0.7);
					const y = mix(700 + i * 230, 880, merge);
					const s = mix(1, 0.55, merge);
					const fade = 1 - inn(t, g - 0.2, 0.4);
					return (
						<At key={k.key} x={540} y={y} style={{opacity: p * fade, transform: `translate(-50%,-50%) translateX(${(1 - p) * 200}px) scale(${s})`}}>
							<div dir="rtl" style={{width: 900, height: 200, borderRadius: 40, background: C.bg2, border: `4px solid ${C.topical}`, display: 'flex', alignItems: 'center', gap: 30, padding: '0 40px', boxSizing: 'border-box'}}>
								{k.icon}
								<div>
									<Fa size={58} weight={900} style={{textAlign: 'right'}}>
										{k.title}
									</Fa>
									<Fa size={44} weight={600} color={C.topical} style={{textAlign: 'right', marginTop: -10}}>
										{`مثلِ ${k.drug}`}
									</Fa>
								</div>
							</div>
						</At>
					);
				})}
				<At x={540} y={1280}>
					<div style={{opacity: inn(t, f + 0.5) * (1 - inn(t, g - 0.2, 0.4))}}>
						<Fa size={56} weight={800} color={C.ink}>
							همه‌ی این ویژگی‌ها با هم؟
						</Fa>
					</div>
				</At>
				<At x={540} y={960}>
					<div dir="ltr" style={{transform: `scale(${mix(0.7, 1, prod)})`, opacity: clamp(prod * 2), display: 'flex', alignItems: 'center', gap: 50}}>
						<Jar size={260} />
						<div>
							<div style={{fontFamily: '"Vazirmatn", sans-serif', fontSize: 110, fontWeight: 300, color: C.ink, lineHeight: 1.1}}>Canvert</div>
							<div style={{fontFamily: '"Vazirmatn", sans-serif', fontSize: 78, fontWeight: 900, color: C.relief, lineHeight: 1.2}}>CBD</div>
						</div>
					</div>
				</At>
				<At x={540} y={1250}>
					<Chip color={C.relief} p={inn(t, g + 0.8)} size={46}>
						ماده‌ی مؤثره: سی‌بی‌دی
					</Chip>
				</At>
			</Stage>
		</>
	);
};

/* ---------- 4. Nerve pain modulators ---------- */
export const Neuro: React.FC<SceneProps> = ({t, sec}) => {
	const at = lineAt(sec);
	const b = at('n4b');
	const bEnd = lineEnd(sec)('n4b');
	const cT = at('n4c');
	const calm = inn(t, b + (bEnd - b) * 0.5, 2.0); // firing slows down
	const smooth = inn(t, cT + 0.3, 1.8);
	// spikes: fast and irregular, then sparse
	const spikes: number[] = [];
	for (let s = b; s < at('n4d'); ) {
		spikes.push(s);
		s += mix(0.22, 1.1, inn(s, b + (bEnd - b) * 0.5, 2.0)) * (0.8 + 0.4 * ((Math.sin(s * 91.7) + 1) / 2));
	}
	const AX: [number, number][] = [
		[700, 880],
		[560, 900],
		[420, 870],
		[260, 900],
		[140, 880],
	];
	const wave = Array.from({length: 120}, (_, i) => {
		const x = 120 + i * 7;
		const noise = Math.sin(i * 1.7 + t * 18) * 28 + Math.sin(i * 3.9 - t * 25) * 22 + Math.sin(i * 7.3 + t * 9) * 14;
		const base = Math.sin(i / 9 - t * 3) * 30;
		return `${x},${1210 + base + noise * (1 - smooth)}`;
	});
	return (
		<>
			<Header n={4} title="تنظیم‌کننده‌های دردِ عصبی" color={C.neuro} t={t} at={at('n4t')} />
			<Names names={['گاباپنتین', 'پره‌گابالین']} color={C.neuro} t={t} at={at('n4a')} out={b - 0.2} />
			<Stage t={t} a={b - 0.1} b={at('n4d') - 0.2}>
				<svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					{/* neuron: dendrites, soma, axon */}
					<g stroke={C.neuro} strokeWidth="12" strokeLinecap="round" fill="none">
						<path d="M800 880 L900 780 M800 880 L920 900 M800 880 L890 1000 M900 780 L960 740 M890 1000 L960 1040" />
						<path d="M720 880 C560 920 420 840 140 880" />
					</g>
					<circle cx={790} cy={880} r={80 + (1 - calm) * 6 * Math.sin(t * 30)} fill={C.neuro} />
					<circle cx={790} cy={880} r={30} fill={C.bg} />
					<g fill={C.neuro}>
						{[0, 1, 2].map((i) => (
							<rect key={i} x={130 - i * 10} y={850 + i * 24} width={30} height={14} rx={7} />
						))}
					</g>
					{spikes.map((s) => {
						const p = (t - s) / 0.55;
						if (p < 0 || p > 1) return null;
						const [x, y] = (() => {
							const i = Math.min(AX.length - 2, Math.floor(p * (AX.length - 1)));
							const q = p * (AX.length - 1) - i;
							return [mix(AX[i][0], AX[i + 1][0], q), mix(AX[i][1], AX[i + 1][1], q)];
						})();
						return <path key={s.toFixed(3)} d={`M${x + 18} ${y - 36} L${x - 6} ${y + 2} L${x + 10} ${y + 2} L${x - 14} ${y + 40}`} stroke={C.pain} strokeWidth="10" fill="none" strokeLinejoin="round" strokeLinecap="round" opacity={Math.min(1, (1 - p) * 4)} />;
					})}
				</svg>
				<At x={540} y={1040}>
					<Chip color={C.pain} p={inn(t, b + 0.6)} size={44}>
						شلیکِ پیامِ درد توسطِ نورون‌ها
					</Chip>
				</At>
				<div style={{...appear(inn(t, cT)), position: 'absolute', inset: 0}}>
					<svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
						<rect x={100} y={1110} width={880} height={200} rx={30} fill={C.bg2} stroke={C.line} strokeWidth={4} />
						<polyline points={wave.join(' ')} stroke={mix(0, 1, smooth) > 0.5 ? C.relief : C.neuro} strokeWidth={8} fill="none" strokeLinejoin="round" />
					</svg>
					<At x={540} y={1370}>
						<Fa size={46} weight={800} color={C.dim}>
							{smooth > 0.6 ? 'نویزِ عصبی کم شد' : 'نویزِ عصبی'}
						</Fa>
					</At>
				</div>
			</Stage>
			<Stage t={t} a={at('n4d')} b={sec.next - sec.start + 1}>
				<Uses
					color={C.neuro}
					t={t}
					at={at('n4d')}
					items={[
						{label: 'دیسکِ کمر', icon: <Spine size={240} />},
						{label: 'زونا', icon: <Rash size={220} />},
					]}
				/>
			</Stage>
		</>
	);
};

/* ---------- 5. Acetaminophen ---------- */
const NET: [number, number][] = [
	[180, 820],
	[330, 720],
	[500, 800],
	[680, 700],
	[880, 790],
	[260, 990],
	[450, 1060],
	[640, 980],
	[840, 1080],
	[560, 1200],
	[300, 1190],
	[800, 1250],
];
const EDGES = [
	[0, 1],
	[1, 2],
	[2, 3],
	[3, 4],
	[0, 5],
	[5, 6],
	[2, 6],
	[6, 7],
	[7, 3],
	[7, 8],
	[4, 8],
	[6, 9],
	[5, 10],
	[10, 9],
	[9, 11],
	[8, 11],
];

export const Acet: React.FC<SceneProps> = ({t, sec}) => {
	const at = lineAt(sec);
	const a = at('n5a');
	const bT = at('n5b');
	const cT = at('n5c');
	const dT = at('n5d');
	const rasti = spr(t, a, 220, 16);
	const cols = [C.nsaid, C.opioid, C.topical, C.neuro];
	const pill = spr(t, bT - 0.1, 150, 14);
	return (
		<>
			<Header n={5} title="استامینوفن" color={C.acet} t={t} at={at('n5t')} />
			<Stage t={t} a={a - 0.1} b={bT - 0.2}>
				<At x={540} y={720}>
					<div style={{transform: `scale(${rasti}) rotate(${(1 - rasti) * -20}deg)`}}>
						<Fa size={120} weight={900} color={C.acet}>
							راستی!
						</Fa>
					</div>
				</At>
				<div dir="rtl" style={{position: 'absolute', top: 900, left: 0, width: W, display: 'flex', justifyContent: 'center', gap: 24}}>
					{cols.map((c, i) => {
						const p = inn(t, a + 0.8 + i * 0.15);
						return (
							<div key={i} style={{...appear(p), width: 120, height: 120, borderRadius: 999, background: c, opacity: p * 0.5}} />
						);
					})}
					<div style={{...appear(spr(t, a + 1.6, 160, 14), 0, 0.5), width: 120, height: 120, borderRadius: 999, background: C.acet, marginRight: 50, boxShadow: `0 0 50px ${C.acet}`}} />
				</div>
				<At x={540} y={1170}>
					<Fa size={52} weight={700} color={C.dim} style={{opacity: inn(t, a + 1.2)}}>
						جزوِ دسته‌های قبلی نیست
					</Fa>
				</At>
			</Stage>
			<Stage t={t} a={bT - 0.15} b={sec.next - sec.start + 1}>
				{t > dT - 0.2 && (
					<svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
						{EDGES.map(([i, j], k) => {
							const p = inn(t, dT + k * 0.12, 0.6);
							const [x1, y1] = NET[i];
							const [x2, y2] = NET[j];
							return <line key={k} x1={x1} y1={y1} x2={mix(x1, x2, p)} y2={mix(y1, y2, p)} stroke={C.acet} strokeWidth={6} opacity={0.4 + 0.5 * Math.max(0, Math.sin(t * 4 - k))} strokeLinecap="round" />;
						})}
						{NET.map(([x, y], k) => (
							<circle key={k} cx={x} cy={y} r={14 * inn(t, dT + k * 0.1, 0.5)} fill={C.acet} />
						))}
					</svg>
				)}
				<At x={540} y={mix(960, 760, inn(t, dT - 0.2, 0.8))}>
					<div style={{transform: `scale(${mix(0.5, 1, pill) * mix(1, 0.7, inn(t, dT - 0.2, 0.8))}) rotate(${-12 + Math.sin(t * 1.5) * 4}deg)`, opacity: clamp(pill * 2)}}>
						<Capsule size={380} a={C.acet} face="calm" />
					</div>
				</At>
				{t > cT &&
					[0, 1, 2, 3].map((i) => {
						const p = inn(t, cT + 0.2 + i * 0.25, 0.7) * (1 - inn(t, dT - 0.3, 0.4));
						const ang = (i / 4) * Math.PI * 2 + t * 0.6;
						return (
							<At key={i} x={540 + Math.cos(ang) * 330} y={900 + Math.sin(ang) * 230}>
								<div style={{opacity: p, transform: `scale(${p})`}}>
									<Fa size={110} weight={900} color={C.neuro}>
										؟
									</Fa>
								</div>
							</At>
						);
					})}
				<At x={540} y={1330}>
					<Chip color={C.acet} p={inn(t, dT + 0.6)} size={46}>
						اثر روی بعضی مسیرهای عصبی
					</Chip>
				</At>
				<At x={540} y={1190}>
					<div style={{opacity: inn(t, cT + 0.3) * (1 - inn(t, dT - 0.3, 0.4))}}>
						<Fa size={58} weight={800} color={C.ink}>
							دقیقاً مشخص نیست چطوری!
						</Fa>
					</div>
				</At>
			</Stage>
		</>
	);
};
