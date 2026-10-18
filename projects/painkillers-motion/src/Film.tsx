/*
 * The whole reel: every scene sits on one horizontal strip and a single camera
 * travels left between them (RTL: the next scene is on the left). Each move is a
 * whip pan that peaks on the section's beat, with horizontal motion blur.
 */
import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {Acet, Neuro, Nsaid, Opioid, Topical} from './scenes/Types';
import {Game, Hook, Messenger} from './scenes/Intro';
import {Cta} from './scenes/Outro';
import {C, FPS, Fa, H, SceneProps, TL, W, clamp, mix, remap} from './kit';
import {Easing} from 'remotion';

const SCENES: Record<string, React.FC<SceneProps>> = {
	hook: Hook,
	messenger: Messenger,
	game: Game,
	nsaid: Nsaid,
	opioid: Opioid,
	topical: Topical,
	neuro: Neuro,
	acet: Acet,
	cta: Cta,
};
const TINT: Record<string, string> = {
	hook: C.pain,
	messenger: C.pain,
	game: C.relief,
	nsaid: C.nsaid,
	opioid: C.opioid,
	topical: C.topical,
	neuro: C.neuro,
	acet: C.acet,
	cta: C.relief,
};

const WHIP = 0.7;
const whipEase = Easing.bezier(0.55, 0, 0.45, 1);

/* Camera position in scene units (0 = first scene), plus speed for blur. */
const camAt = (t: number) => {
	let x = 0;
	TL.sections.forEach((s, i) => {
		if (i === 0) return;
		x += whipEase(remap(t, s.start - WHIP / 2, s.start + WHIP / 2));
	});
	return x;
};

/* Captions: lines the picture doesn't already spell out, in short pages. */
const NO_CAPTION = new Set(['q1', 'a1', 'p1', 'p3', 'g1', 'c1', 'n1t', 'n2t', 'n3t', 'n4t', 'n5t', 'n5b']);
const DISPLAY: Record<string, string> = {
	n3g: 'مثلِ محصولاتِ برندِ کنوِرت (Canvert) که ماده‌ی مؤثره‌ی سی‌بی‌دی (CBD) دارن.',
};
const clean = (s: string) =>
	s
		.replace(/[ً-ْ]/g, '')
		.replace(/^مثل: /, 'مثلِ ')
		.replace(/\.\.\./g, '…')
		.replace(/^وَ /, 'و ')
		.trim();

type Page = {start: number; end: number; words: string[]; t0: number[]};
const PAGES: Page[] = (() => {
	const pages: Page[] = [];
	for (const [k, ln] of Object.entries(TL.lines)) {
		if (NO_CAPTION.has(k)) continue;
		const text = DISPLAY[k] ?? clean(ln.text);
		const words = text.split(' ');
		const total = text.length;
		const dur = ln.end - ln.start;
		let acc = 0;
		let cur: Page | null = null;
		let len = 0;
		words.forEach((w, wi) => {
			const rest = words.slice(wi).join(' ').length;
			const t0 = ln.start + (acc / total) * dur;
			acc += w.length + 1;
			if (!cur || (len + w.length > 30 && rest > 9)) {
				cur = {start: t0, end: ln.end, words: [], t0: []};
				if (pages.length && pages[pages.length - 1].end > t0) pages[pages.length - 1].end = t0;
				pages.push(cur);
				len = 0;
			}
			cur.words.push(w);
			cur.t0.push(t0);
			len += w.length + 1;
		});
	}
	return pages;
})();

const Captions: React.FC<{t: number}> = ({t}) => {
	const page = PAGES.find((p) => t >= p.start - 0.05 && t < p.end + 0.25);
	if (!page) return null;
	const p = clamp((t - page.start + 0.05) / 0.18);
	const o = 1 - clamp((t - page.end) / 0.25);
	return (
		<div style={{position: 'absolute', top: 1470, left: 0, width: W, display: 'flex', justifyContent: 'center', opacity: p * o}}>
			<div style={{background: 'rgba(8,12,30,0.78)', borderRadius: 28, padding: '6px 34px', maxWidth: 960, transform: `translateY(${(1 - p) * 14}px)`}}>
				<Fa size={50} weight={700} wrap color={C.dim}>
					{page.words.map((w, i) => (
						<React.Fragment key={i}>
							<span style={{color: t >= page.t0[i] ? C.ink : C.dim}}>{w}</span>
							{i < page.words.length - 1 ? ' ' : null}
						</React.Fragment>
					))}
				</Fa>
			</div>
		</div>
	);
};

export const Film: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const cam = camAt(t);
	const speed = Math.abs(camAt(t + 1 / FPS) - cam) * FPS; // scenes per second
	const blur = Math.min(60, speed * 14);
	const idx = Math.round(cam);
	const sec = TL.sections[Math.min(TL.sections.length - 1, Math.max(0, idx))];
	const breathe = 1 + 0.035 * clamp((t - sec.start) / Math.max(1, sec.next - sec.start));
	const progress = clamp(t / TL.duration);
	return (
		<AbsoluteFill style={{background: C.bg, overflow: 'hidden'}}>
			<svg width={0} height={0} style={{position: 'absolute'}}>
				<defs>
					<filter id="whip" x="-10%" y="0" width="120%" height="100%">
						<feGaussianBlur stdDeviation={`${blur.toFixed(2)} 0`} />
					</filter>
				</defs>
			</svg>
			{/* background: dot grid and a soft glow in the section colour, on a slower layer */}
			<div style={{position: 'absolute', inset: 0, transform: `translateX(${((cam * W * 0.35) % 60).toFixed(1)}px)`, backgroundImage: `radial-gradient(${C.line} 2.5px, transparent 2.5px)`, backgroundSize: '60px 60px', opacity: 0.8}} />
			{TL.sections.map((s, i) => {
				const d = i - cam;
				if (Math.abs(d) > 1.2) return null;
				return (
					<div key={s.name} style={{position: 'absolute', left: W / 2 - 700 + -d * W * 0.45, top: 300, width: 1400, height: 1400, borderRadius: 999, background: `radial-gradient(${TINT[s.name]}33, transparent 65%)`}} />
				);
			})}
			<div style={{position: 'absolute', inset: 0, filter: blur > 0.5 ? 'url(#whip)' : undefined}}>
				{TL.sections.map((s, i) => {
					const d = i - cam;
					if (Math.abs(d) >= 0.999) return null;
					const Scene = SCENES[s.name];
					return (
						<div key={s.name} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, overflow: 'hidden', transform: `translateX(${(-d * W).toFixed(2)}px) scale(${i === idx ? breathe : 1})`}}>
							<Scene t={t - s.start} sec={s} />
						</div>
					);
				})}
			</div>
			<Captions t={t} />
			{/* progress bar fills right to left */}
			<div style={{position: 'absolute', top: 120, right: 60, width: W - 120, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)'}}>
				<div style={{position: 'absolute', right: 0, top: 0, height: 8, borderRadius: 4, width: `${(progress * 100).toFixed(3)}%`, background: TINT[sec.name]}} />
			</div>
			<Audio src={staticFile('audio/vo.wav')} volume={1} />
			<Audio src={staticFile('audio/music.wav')} volume={(f) => mix(0.16, 0.1, voiceActive(f / FPS))} />
			<Audio src={staticFile('audio/sfx.wav')} volume={0.55} />
		</AbsoluteFill>
	);
};

/* 1 while someone is talking (with short release), for ducking the music. */
const voiceActive = (t: number) => {
	for (const ln of Object.values(TL.lines)) {
		if (t >= ln.start - 0.15 && t <= ln.end + 0.3) return 1;
	}
	return 0;
};
