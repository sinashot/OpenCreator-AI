import React, {useEffect, useState} from 'react';
import {C, TEXT_CENTER_Y, TEXT_MAX_W, WIDTH} from '../constants';
import {SEGMENTS, Segment} from '../data/timeline';
import {EASE_IN, EASE_OUT, clamp, ramp} from '../lib/anim';
import {FA, loadFonts} from '../lib/fonts';

/* Kinetic typography engine.
   - Finds `highlightedPhrase` inside `fullText` by itself (punctuation and half-spaces ignored)
     and gives it its own line in neon green with a soft scale-in.
   - Words pop in one by one on the narration's word onsets.
   - Every line is sized to fit the column ("smart size"); a line that would get too small
     is split in two.
   Persian rules: words are whole boxes (never letters), one dir="rtl" block per line,
   no letter-spacing, fades act on whole words. */

const WEIGHT = 800;
const LEAD = 0.05; // the pop peaks a hair after the word starts, so start it slightly early
const ROLE = {
	lead: {max: 84, color: C.white},
	hl: {max: 98, color: C.neon},
	tail: {max: 66, color: C.white},
} as const;
const MIN_SIZE = 54;
const LINE_GAP = 1.42; // line box = font size × this (Persian needs room for dots and ascenders)

type Role = keyof typeof ROLE;
type LaidWord = {text: string; start: number; hl: boolean};
type Line = {role: Role; size: number; words: LaidWord[]};
type Layout = {lines: Line[]; height: number};

const norm = (w: string) => w.replace(/[‌،؛:.!?؟«»"\s]/g, '');

/** Index range [a, b) of the highlighted phrase among the segment's words, or null. */
export const findHighlight = (seg: Pick<Segment, 'words' | 'highlightedPhrase'>): [number, number] | null => {
	const hay = seg.words.map((w) => norm(w.text));
	const needle = seg.highlightedPhrase.split(/\s+/).map(norm).filter(Boolean);
	for (let i = 0; i + needle.length <= hay.length; i++) {
		if (needle.every((n, j) => hay[i + j] === n)) return [i, i + needle.length];
	}
	return null;
};

let ctx: CanvasRenderingContext2D | null = null;
const width100 = (text: string) => {
	ctx ??= document.createElement('canvas').getContext('2d');
	ctx!.font = `${WEIGHT} 100px Vazirmatn`;
	ctx!.direction = 'rtl';
	return ctx!.measureText(text).width;
};

const fit = (words: LaidWord[], role: Role): Line[] => {
	const w = width100(words.map((x) => x.text).join(' '));
	const size = Math.min(ROLE[role].max, (TEXT_MAX_W / w) * 100);
	if (size >= MIN_SIZE || words.length < 2) return [{role, size, words}];
	// too long for one line: split where the two halves are closest in width
	let best = 1;
	let bestDiff = Infinity;
	for (let k = 1; k < words.length; k++) {
		const a = width100(words.slice(0, k).map((x) => x.text).join(' '));
		const b = width100(words.slice(k).map((x) => x.text).join(' '));
		if (Math.abs(a - b) < bestDiff) {
			bestDiff = Math.abs(a - b);
			best = k;
		}
	}
	return [...fit(words.slice(0, best), role), ...fit(words.slice(best), role)];
};

const layoutSegment = (seg: Segment): Layout => {
	const range = findHighlight(seg);
	const words: LaidWord[] = seg.words.map((w, i) => ({
		text: w.text,
		start: w.start,
		hl: range !== null && i >= range[0] && i < range[1],
	}));
	const groups: [LaidWord[], Role][] = range
		? [
				[words.slice(0, range[0]), 'lead'],
				[words.slice(range[0], range[1]), 'hl'],
				[words.slice(range[1]), 'tail'],
			]
		: [[words, 'lead']];
	const lines = groups.filter(([g]) => g.length > 0).flatMap(([g, role]) => fit(g, role));
	// a highlight-less segment or a lead-only remainder never needs the tail size
	const height = lines.reduce((h, l) => h + l.size * LINE_GAP, 0);
	return {lines, height};
};

let cache: Map<string, Layout> | null = null;

const useLayouts = () => {
	const [layouts, setLayouts] = useState<Map<string, Layout> | null>(cache);
	useEffect(() => {
		if (cache) return;
		loadFonts().then(() => {
			cache = new Map(SEGMENTS.map((s) => [s.id, layoutSegment(s)]));
			setLayouts(cache);
		});
	}, []);
	return layouts;
};

const WordSpan: React.FC<{w: LaidWord; t: number; size: number; final: boolean}> = ({w, t, size, final}) => {
	const t0 = w.start - LEAD;
	if (t < t0) {
		return <span style={{display: 'inline-block', opacity: 0}}>{w.text}</span>;
	}
	const fade = clamp((t - t0) / 0.12);
	if (w.hl) {
		const p = ramp(t, t0, t0 + 0.42, EASE_OUT);
		const glow = 1 - ramp(t, t0 + 0.1, t0 + 0.9, EASE_OUT) * 0.65;
		const finalGlow = final ? 0.5 + 0.25 * Math.sin(t * 2.6) : 0;
		return (
			<span
				style={{
					display: 'inline-block',
					color: C.neon,
					opacity: fade,
					transform: `translateY(${(1 - p) * size * 0.18}px) scale(${0.45 + 0.55 * p})`,
					textShadow: `0 0 ${size * 0.32}px rgba(158,255,0,${0.55 * glow + finalGlow * 0.4}), 0 0 ${size * 0.08}px rgba(158,255,0,${0.35 * glow})`,
				}}
			>
				{w.text}
			</span>
		);
	}
	const p = ramp(t, t0, t0 + 0.3, EASE_OUT);
	return (
		<span
			style={{
				display: 'inline-block',
				color: C.white,
				opacity: fade,
				transform: `translateY(${(1 - p) * size * 0.32}px) scale(${0.8 + 0.2 * p})`,
				filter: p < 0.98 ? `blur(${(1 - p) * 7}px)` : undefined,
				textShadow: final ? `0 0 ${size * 0.35}px rgba(255,255,255,${0.18 + 0.1 * Math.sin(t * 2.6)})` : undefined,
			}}
		>
			{w.text}
		</span>
	);
};

export const KineticText: React.FC<{t: number}> = ({t}) => {
	const layouts = useLayouts();
	if (!layouts) return null;
	const idx = SEGMENTS.findIndex((s) => t >= s.startTime - LEAD - 0.01 && t < s.endTime - 0.01);
	const seg = SEGMENTS[idx === -1 ? SEGMENTS.length - 1 : idx];
	const last = seg === SEGMENTS[SEGMENTS.length - 1];
	const layout = layouts.get(seg.id)!;

	// exit: the whole block accelerates up and away just before the next segment's first word
	const q = last ? 0 : ramp(t, seg.endTime - 0.22, seg.endTime - 0.02, EASE_IN);
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				width: WIDTH,
				top: TEXT_CENTER_Y - layout.height / 2,
				opacity: 1 - q,
				transform: `translateY(${-26 * q}px)`,
				filter: q > 0.01 ? `blur(${6 * q}px)` : undefined,
			}}
		>
			{layout.lines.map((line, i) => (
				<div
					key={i}
					dir="rtl"
					lang="fa"
					style={{
						fontFamily: FA,
						fontWeight: WEIGHT,
						fontSize: line.size,
						lineHeight: `${line.size * LINE_GAP}px`,
						textAlign: 'center',
						whiteSpace: 'nowrap',
					}}
				>
					{line.words.map((w, j) => (
						<React.Fragment key={j}>
							{j > 0 ? ' ' : null}
							<WordSpan w={w} t={t} size={line.size} final={last} />
						</React.Fragment>
					))}
				</div>
			))}
		</div>
	);
};
