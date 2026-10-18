/* Hook, the pain messenger, and how painkillers enter the game. */
import React from 'react';
import {At, C, Chip, Fa, Pulses, SceneProps, W, Words, appear, clamp, faNum, inn, lineAt, lineEnd, mix, outp, ptsD, polyLen, punch, spr} from '../kit';
import {Burst, Capsule} from '../icons';

export const Hook: React.FC<SceneProps> = ({t, sec}) => {
	const at = lineAt(sec);
	const end = lineEnd(sec);
	const q = at('q1');
	const a = at('a1');
	const aDur = end('a1') - a;
	const hit = a + aDur * 0.52; // «اصلاً نمی‌فهمه!»
	const pPill = spr(t, q - 0.2, 90, 13);
	const shrug = t > a ? Math.sin((t - a) * 9) * 9 * Math.exp(-(t - a) * 1.6) : 0;
	const titleOut = outp(t, a - 0.1);
	const qMark = spr(t, q + 0.5, 180, 14) * (1 - outp(t, hit - 0.15, 0.2));
	const bang = spr(t, hit - 0.1, 220, 16);
	return (
		<>
			<At x={540} y={700 + Math.sin(t * 2.2) * 12}>
				<div style={{transform: `translateX(${(1 - pPill) * 700}px) rotate(${-18 + (1 - pPill) * 220 + shrug}deg)`}}>
					<Capsule size={420} face={t > a ? 'shrug' : 'calm'} />
				</div>
			</At>
			<At x={790} y={520}>
				<div style={{transform: `scale(${qMark}) rotate(${(1 - qMark) * 30}deg)`, opacity: clamp(qMark * 2)}}>
					<Fa size={200} weight={900} color={C.neuro}>
						؟
					</Fa>
				</div>
			</At>
			<At x={300} y={500}>
				<div style={{transform: `scale(${bang}) rotate(${(1 - bang) * -40}deg)`, opacity: clamp(bang * 2)}}>
					<Fa size={220} weight={900} color={C.pain}>
						!
					</Fa>
				</div>
			</At>
			<div style={{position: 'absolute', top: 1000, left: 70, width: 940, opacity: 1 - titleOut, transform: `translateY(${-titleOut * 60}px)`}}>
				<Words text="مسکن از کجا می‌فهمه" t={t} at={q} span={0.7} size={96} />
				<Words text="کجامون درد می‌کنه؟" t={t} at={q + 0.9} span={0.7} size={96} highlight={{درد: C.pain}} />
			</div>
			<div style={{position: 'absolute', top: 1010, left: 70, width: 940}}>
				<Words text="خب واقعیتش اینه که…" t={t} at={a} span={0.6} size={64} weight={700} color={C.dim} />
				<div style={{transform: `scale(${punch(t, hit, 0.1)})`}}>
					<Words text="اصلاً نمی‌فهمه!" t={t} at={hit} span={0.25} size={140} color={C.neuro} />
				</div>
			</div>
		</>
	);
};

/* Body outline with the nerve from the hand to the brain. */
const NERVE: [number, number][] = [
	[870, 1170],
	[800, 1080],
	[730, 990],
	[650, 900],
	[590, 860],
	[560, 780],
	[545, 700],
	[540, 620],
];

const Body: React.FC<{alarm: number}> = ({alarm}) => (
	<svg width={W} height={1400} viewBox={`0 0 ${W} 1400`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
		<g fill={C.bg2} stroke={C.line} strokeWidth="4">
			<circle cx="540" cy="600" r="125" />
			<rect x="400" y="760" width="280" height="420" rx="110" />
			<path d="M640 820 L880 1150" stroke={C.bg2} strokeWidth="80" strokeLinecap="round" />
			<path d="M440 820 L330 1110" stroke={C.bg2} strokeWidth="80" strokeLinecap="round" />
		</g>
		{/* brain */}
		<g transform="translate(540 590)">
			<path d="M-80 10 C-95 -40 -55 -80 -15 -70 C0 -95 50 -95 62 -62 C100 -55 105 0 80 22 C85 60 40 75 15 60 C-5 80 -55 75 -60 45 C-90 45 -95 25 -80 10Z" fill={alarm > 0 ? `rgb(255,${Math.round(150 - 70 * alarm)},${Math.round(190 - 90 * alarm)})` : '#FF9EC0'} />
			<path d="M-40 -40 C-20 -30 -25 0 -5 5 M20 -55 C30 -30 50 -25 45 5 M-50 30 C-30 20 -10 30 10 25" stroke="#C2577E" strokeWidth="7" fill="none" strokeLinecap="round" />
		</g>
	</svg>
);

export const Messenger: React.FC<SceneProps> = ({t, sec}) => {
	const at = lineAt(sec);
	const p1 = at('p1');
	const p2 = at('p2');
	const p3 = at('p3');
	const draw = inn(t, p2, 1.6);
	const injury = spr(t, p2 + 0.3, 200, 12);
	const alarm = t > p3 ? 0.5 + 0.5 * Math.sin((t - p3) * 14) : 0;
	const bubble = spr(t, p3 - 0.05, 170, 15);
	const len = polyLen(NERVE);
	const body = inn(t, p1 - 0.2, 0.9);
	return (
		<>
			<div style={{position: 'absolute', top: 230, left: 60, width: 960}}>
				<Words text="درد یه پیام‌رسانِ بدقلقه" t={t} at={p1} span={0.8} size={84} highlight={{درد: C.pain, بدقلقه: C.neuro}} />
			</div>
			<div style={{position: 'absolute', left: 0, top: 160, width: W, height: 1400, ...appear(body, 60, 0.96)}}>
				<Body alarm={alarm} />
				<svg width={W} height={1400} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<path d={ptsD(NERVE)} stroke={C.neuro} strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} opacity={0.9} />
					<Pulses pts={NERVE} t={t} a={p2 + 1.0} b={sec.next - sec.start} every={0.42} travel={0.9} r={18} />
					{alarm > 0 &&
						[0, 1, 2].map((i) => {
							const k = ((t - p3) * 1.6 + i / 3) % 1;
							return <circle key={i} cx={540} cy={590} r={140 + k * 160} stroke={C.pain} strokeWidth={8 * (1 - k)} fill="none" opacity={1 - k} />;
						})}
				</svg>
				<At x={870} y={1170}>
					<div style={{transform: `scale(${injury}) rotate(${t * 40}deg)`}}>
						<Burst size={190} />
					</div>
				</At>
			</div>
			<At x={540} y={1450}>
				<div style={{transform: `scale(${mix(0.85, 1, bubble)})`, opacity: clamp(bubble * 2), transformOrigin: '50% 0%'}}>
					<div style={{background: C.ink, borderRadius: 48, padding: '22px 46px', position: 'relative'}}>
						<Fa size={64} weight={900} color={C.bg}>
							ببین! اینجا یه مشکلی داریم!
						</Fa>
						<div style={{position: 'absolute', top: -26, left: '50%', marginLeft: -26, width: 0, height: 0, borderLeft: '26px solid transparent', borderRight: '26px solid transparent', borderBottom: `28px solid ${C.ink}`}} />
					</div>
				</div>
			</At>
		</>
	);
};

/* The nerve as a road from the injury (right) to the brain (left). */
const ROAD: [number, number][] = Array.from({length: 40}, (_, i) => {
	const x = 980 - (i / 39) * 880;
	return [x, 940 + Math.sin(i / 4) * 40] as [number, number];
});

export const Game: React.FC<SceneProps> = ({t, sec}) => {
	const at = lineAt(sec);
	const g1 = at('g1');
	const g2 = at('g2');
	const g3 = at('g3');
	const roll = inn(t, g1 + 0.3, 1.2);
	const drop = spr(t, g2 + 0.4, 160, 14);
	const blockX = 540;
	const pillX = mix(1300, blockX, roll);
	const pillY = mix(720, 880, drop);
	const label = inn(t, g2 + 1.0);
	const gone = outp(t, g3 - 0.1, 0.35);
	const cols = [C.nsaid, C.opioid, C.topical, C.neuro, C.acet];
	return (
		<>
			<div style={{position: 'absolute', top: 250, left: 60, width: 960}}>
				<Words text="حالا مسکن‌ها چطور واردِ بازی می‌شن؟" t={t} at={g1} span={1.0} size={84} highlight={{'مسکن‌ها': C.relief}} />
			</div>
			<div style={{position: 'absolute', inset: 0, opacity: 1 - gone, transform: `translateY(${-gone * 120}px) scale(${1 - gone * 0.12})`}}>
				<svg width={W} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
					<path d={ptsD(ROAD)} stroke={C.neuro} strokeWidth="12" fill="none" strokeLinecap="round" opacity={0.85} />
					<Pulses
						pts={ROAD}
						t={t}
						a={-0.5}
						b={sec.next - sec.start}
						every={0.5}
						travel={2.2}
						r={16}
						fade={(p, born) => (drop > 0.5 && p > 0.5 && born + 2.2 * 0.5 > g2 + 0.4 ? clamp(1 - (p - 0.5) * 12) : 1)}
					/>
				</svg>
				<At x={1000} y={940}>
					<Burst size={150} />
				</At>
				<At x={90} y={940}>
					<div style={{width: 120, height: 100, background: '#FF9EC0', borderRadius: '50% 50% 45% 45%'}} />
				</At>
				<At x={pillX} y={pillY}>
					<div style={{transform: `rotate(${(1 - roll) * 540 + drop * 90}deg)`}}>
						<Capsule size={260} a={C.relief} face="none" />
					</div>
				</At>
				<At x={540} y={1120}>
					<Chip color={C.pain} p={label}>
						مسیرِ انتقالِ درد مختل می‌شه
					</Chip>
				</At>
			</div>
			<div dir="rtl" style={{position: 'absolute', top: 1000, left: 0, width: W, display: 'flex', justifyContent: 'center', gap: 26}}>
				{cols.map((c, i) => {
					const p = spr(t, g3 + 0.15 + i * 0.12, 170, 15);
					return (
						<div key={i} style={{width: 150, height: 150, borderRadius: 999, background: c, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p}) translateY(${(1 - p) * 60}px)`, opacity: clamp(p * 2)}}>
							<Fa size={86} weight={900} color={C.bg} style={{lineHeight: 1.2, marginTop: 6}}>
								{faNum(i + 1)}
							</Fa>
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', top: 1220, left: 60, width: 960, opacity: inn(t, g3 + 0.8)}}>
				<Fa size={60} weight={700} color={C.dim}>
					هرکدوم یه روشِ خاصِ خودش رو داره
				</Fa>
			</div>
		</>
	);
};

