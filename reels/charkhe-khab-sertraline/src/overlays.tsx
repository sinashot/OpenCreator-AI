import React from 'react';
import {FA} from './fonts';
import {C, H, HANDLE, W, cl, eo, rm} from './kit';

/* Voice-over lines, timed to the pauses in the original audio. */
export const CAP: [number, number, string][] = [
	[0.3, 1.72, '«آسنترا بخورم یا نه؟»'],
	[2.18, 5.39, 'این دارو افسردگی را بدون اعتیاد درمان می‌کند،'],
	[5.58, 7.24, 'اما قواعد سخت‌گیرانه‌ای دارد.'],
	[8.15, 11.78, 'خلق‌وخوی خود را یک ترازوی شیمیایی ظریف تصور کنید.'],
	[12.45, 15.04, 'سرترالین طی ده تا چهارده روز،'],
	[15.45, 18.67, 'این کفه را آرام‌آرام بالا می‌کشد تا ثابت بماند.'],
	[19.59, 20.85, 'اما با احساس بهبودی،'],
	[21.04, 23.62, 'چرا نباید مصرف دارو را یک‌دفعه قطع کنید؟'],
	[24.52, 27.63, 'حذف ناگهانی، باعث سقوط آزاد این کفه می‌شود.'],
	[28.31, 29.84, 'سیستم عصبی شوکه شده'],
	[30.23, 34.25, 'و با سرگیجه، لرزش و اضطراب مضاعف واکنش نشان می‌دهد.'],
	[35.17, 39.5, 'برای جلوگیری از این شوک، پزشک دوز دارو را پله‌پله کم می‌کند؛'],
	[40.07, 41.33, 'یعنی کاهش تدریجی.'],
	[42.21, 45.4, 'این کار به مغز فرصت تطبیق و تولید طبیعی می‌دهد.'],
	[46.31, 47.62, 'در این مسیر مراقب باشید؛'],
	[47.99, 50.76, 'ترکیب آسنترا با مسکن‌های ضدالتهاب،'],
	[51.18, 52.99, 'خطر خونریزی را بالا می‌برد.'],
	[53.86, 55.69, 'پس آسنترا دارویی ایمن است'],
	[56.02, 58.23, 'اگر تنظیم این ترازوی شیمیایی را'],
	[58.56, 60.47, 'منحصراً به پزشکتان بسپارید.'],
];

/* Karaoke caption: whole words (never letters) brighten as they are spoken. */
export const Captions: React.FC<{t: number}> = ({t}) => {
	const idx = CAP.findIndex(([a], i) => t >= a - 0.12 && t < (CAP[i + 1]?.[0] ?? 60.9) - 0.12);
	if (idx < 0) return null;
	const [a, b, text] = CAP[idx];
	const nextA = CAP[idx + 1]?.[0] ?? 60.9;
	const words = text.split(' ');
	const weights = words.map((w) => w.replace(/‌/g, '').length + 1.5);
	const total = weights.reduce((s, x) => s + x, 0);
	let acc = a;
	const starts = weights.map((wt) => {
		const s = acc;
		acc += ((b - a) * wt) / total;
		return s;
	});
	const lineIn = eo(rm(t, a - 0.12, a + 0.2));
	const lineOut = rm(t, nextA - 0.28, nextA - 0.12);
	return (
		<div
			dir="rtl"
			lang="fa"
			style={{
				position: 'absolute',
				left: 70,
				right: 70,
				top: 1410,
				textAlign: 'center',
				fontFamily: FA,
				fontSize: 50,
				fontWeight: 800,
				lineHeight: 1.75,
				opacity: lineIn * (1 - lineOut),
				translate: `0 ${(1 - lineIn) * 22}px`,
			}}
		>
			<span style={{background: 'rgba(8,12,24,0.55)', padding: '6px 22px', borderRadius: 18, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>
				{words.map((w, i) => {
					const p = eo(rm(t, starts[i] - 0.04, starts[i] + 0.16));
					const speaking = t >= starts[i] && t < (starts[i + 1] ?? b + 0.3);
					return (
						<React.Fragment key={i}>
							<span style={{color: speaking ? C.amber : C.ink, opacity: 0.3 + 0.7 * p}}>{w}</span>
							{i < words.length - 1 ? ' ' : ''}
						</React.Fragment>
					);
				})}
			</span>
		</div>
	);
};

/*
 * Anti-copy layers for the handle.
 * 1) a faint tiled field over the whole frame that drifts every frame (no clean
 *    patch to clone or inpaint from),
 * 2) a normal-size badge that wanders on a slow Lissajous path (no fixed corner to
 *    crop or delogo).
 * The handle is also drawn into the artwork itself (capsule imprint, scale base,
 * end card), so removing it means removing content.
 */
export const Watermark: React.FC<{t: number}> = ({t}) => {
	const rows = 13;
	const cols = 4;
	const dx = (t * 14) % 360;
	const dy = (t * 9) % 210;
	const tiles = [];
	for (let r = -2; r < rows; r++) {
		for (let c = -2; c < cols; c++) {
			tiles.push(
				<div
					key={`${r}-${c}`}
					style={{
						position: 'absolute',
						left: c * 360 + (r % 2) * 180 + dx,
						top: r * 210 + dy,
						fontFamily: FA,
						fontSize: 26,
						fontWeight: 700,
						color: '#FFFFFF',
						whiteSpace: 'nowrap',
					}}
				>
					{HANDLE}
				</div>,
			);
		}
	}
	const px = W / 2 + 330 * Math.sin((2 * Math.PI * t) / 23 + 0.4);
	const py = 980 + 640 * Math.sin((2 * Math.PI * t) / 31 + 2.2);
	return (
		<>
			<div style={{position: 'absolute', inset: -400, transform: 'rotate(-28deg)', opacity: 0.075, pointerEvents: 'none'}}>
				<div style={{position: 'absolute', left: 0, top: 0, width: W + 800, height: H + 800}}>{tiles}</div>
			</div>
			<div
				dir="ltr"
				style={{
					position: 'absolute',
					left: px,
					top: py,
					transform: 'translate(-50%,-50%)',
					padding: '6px 16px',
					borderRadius: 30,
					background: 'rgba(10,14,28,0.35)',
					border: '1.5px solid rgba(255,255,255,0.28)',
					fontFamily: FA,
					fontSize: 30,
					fontWeight: 700,
					color: 'rgba(255,255,255,0.66)',
					whiteSpace: 'nowrap',
				}}
			>
				{HANDLE}
			</div>
		</>
	);
};

export const Background: React.FC<{t: number; danger: number}> = ({t, danger}) => {
	const dots = [];
	for (let i = 0; i < 46; i++) {
		const r1 = Math.sin(i * 91.7) * 0.5 + 0.5;
		const r2 = Math.sin(i * 47.3 + 2) * 0.5 + 0.5;
		const r3 = Math.sin(i * 13.1 + 5) * 0.5 + 0.5;
		const y = ((r2 * H - t * (14 + r3 * 26)) % H + H) % H;
		const x = r1 * W + Math.sin(t * 0.4 + i) * 18;
		dots.push(<circle key={i} cx={x} cy={y} r={2 + r3 * 5} fill={i % 3 ? C.teal : C.amber} opacity={0.08 + r3 * 0.12} />);
	}
	return (
		<>
			<div style={{position: 'absolute', inset: 0, background: `radial-gradient(120% 80% at 50% 38%, ${C.bg1} 0%, ${C.bg0} 70%)`}} />
			<div style={{position: 'absolute', inset: 0, background: 'radial-gradient(90% 60% at 50% 40%, rgba(229,72,77,0.42) 0%, rgba(229,72,77,0) 75%)', opacity: cl(danger)}} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				{dots}
			</svg>
		</>
	);
};
