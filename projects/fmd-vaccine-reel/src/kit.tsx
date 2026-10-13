/*
 * Building blocks for the FMD vaccine reel. Everything is a pure function of t (seconds).
 */
import React from 'react';
// @ts-ignore plain JS motion helpers from persian-motion-director
import {M} from './engine.js';
import {FA} from './fonts';

export const W = 1080;
export const H = 1920;

export const C = {
	bg0: '#03101C',
	bg1: '#0A2C42',
	teal: '#19C3B4',
	cyan: '#5FE1FF',
	mint: '#A6F4DC',
	amber: '#FFC24B',
	red: '#FF5D6C',
	white: '#EAF6FF',
	dim: '#8FB3C7',
	line: 'rgba(95,225,255,0.16)',
	card: 'rgba(14,52,76,0.72)',
};

export const BEAT = 0.5;
export const BAR = 2;

export const remap: (v: number, a: number, b: number) => number = M.remap;
export const clamp: (v: number, a?: number, b?: number) => number = M.clamp;
export const mix: (a: number, b: number, t: number) => number = M.mix;
export const bez: (a: number, b: number, c: number, d: number) => (x: number) => number = M.bez;
export const spring: (o: {k?: number; c?: number}) => (t: number) => number = M.spring;

/* Entrances: fast arrival, long settle. Exits: quick, and travel less far. */
export const IN = bez(0.16, 1, 0.3, 1);
export const OUT = bez(0.7, 0, 0.84, 0);
export const enter = (t: number, at: number, d = 0.66) => IN(remap(t, at, at + d));
export const leave = (t: number, at: number, d = 0.27) => OUT(remap(t, at, at + d));
/* Low-overshoot spring (~1.5%) for UI-like objects. */
export const sp = (t: number, at: number) => spring({k: 100, c: 16})(t - at);
/* Soft pop on objects with a little more character (icons, not text). */
export const pop = (t: number, at: number) => spring({k: 170, c: 15})(t - at);

/* Kick pulse: 1 on every beat, decaying. */
export const pulse = (t: number, decay = 0.12) => Math.exp(-((((t % BEAT) + BEAT) % BEAT) / decay));

const FA_NUM = '۰۱۲۳۴۵۶۷۸۹';
export const faNum = (n: number | string) => String(n).replace(/\d/g, (d) => FA_NUM[Number(d)]);

/* Persian block: RTL, Vazirmatn, generous line height so dots never clip. */
export const Fa: React.FC<{
	children: React.ReactNode;
	size: number;
	weight?: number;
	color?: string;
	align?: 'center' | 'right' | 'left';
	style?: React.CSSProperties;
}> = ({children, size, weight = 700, color = C.white, align = 'center', style}) => (
	<div dir="rtl" lang="fa" style={{fontFamily: FA, fontSize: size, fontWeight: weight, color, lineHeight: 1.75, textAlign: align, ...style}}>
		{children}
	</div>
);

/* Word-by-word reveal, starting on the right (reading order). Words are whole units,
   so letters inside a word always keep their joined forms. [bracketed phrase] = highlight. */
type Tok = {w: string; hl: boolean; tail?: string};
const tokenize = (s: string): Tok[] => {
	const out: Tok[] = [];
	const re = /\[([^\]]+)\]([^\s\[]*)|(\S+)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(s))) out.push(m[1] ? {w: m[1], hl: true, tail: m[2]} : {w: m[3], hl: false});
	return out;
};

export const Words: React.FC<{
	text: string;
	t: number;
	at: number;
	size: number;
	stagger?: number;
	weight?: number;
	color?: string;
	hl?: string;
	align?: 'center' | 'right' | 'left';
	style?: React.CSSProperties;
}> = ({text, t, at, size, stagger = 0.06, weight = 800, color = C.white, hl = C.amber, align = 'center', style}) => {
	const toks = tokenize(text);
	return (
		<Fa size={size} weight={weight} color={color} align={align} style={style}>
			{toks.map((tk, i) => {
				const p = enter(t, at + i * stagger, 0.55);
				const hp = IN(remap(t, at + i * stagger + 0.3, at + i * stagger + 0.85));
				const hlStyle: React.CSSProperties = tk.hl
					? {
							color: hp > 0.45 ? C.bg0 : hl,
							backgroundImage: `linear-gradient(${hl}, ${hl})`,
							backgroundSize: `${(hp * 100).toFixed(1)}% 82%`,
							backgroundPosition: 'right center',
							backgroundRepeat: 'no-repeat',
							padding: '0 0.16em',
							borderRadius: '0.2em',
						}
					: {};
				return (
					<React.Fragment key={i}>
						<span style={{display: 'inline-block', opacity: p, transform: `translateY(${((1 - p) * 0.45).toFixed(3)}em)`}}>
							<span style={hlStyle}>{tk.w}</span>
							{tk.tail}
						</span>
						{i < toks.length - 1 ? ' ' : ''}
					</React.Fragment>
				);
			})}
		</Fa>
	);
};

/* Whip pan: peak speed on `at` (a downbeat). */
const whipCurve = bez(0.55, 0, 0.45, 1);
export const whip = (t: number, at: number, dur = 0.6) => {
	const p = whipCurve(remap(t, at - dur / 2, at + dur / 2));
	const p2 = whipCurve(remap(t - 1 / 60, at - dur / 2, at + dur / 2));
	const speed = Math.abs(p - p2) * 60;
	return {p, blur: Math.min(46, speed * 9), scale: 1 - 0.05 * Math.sin(Math.PI * p)};
};

export const BlurDefs: React.FC<{id: string; x: number}> = ({id, x}) => (
	<svg width={0} height={0} style={{position: 'absolute'}}>
		<defs>
			<filter id={id} x="-30%" y="-5%" width="160%" height="110%">
				<feGaussianBlur stdDeviation={`${x.toFixed(2)} 0`} />
			</filter>
		</defs>
	</svg>
);

/* Absolutely positioned box (keeps text out of flex containers). */
export const Box: React.FC<{x: number; y: number; w: number; h?: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({x, y, w, h, children, style}) => (
	<div style={{position: 'absolute', left: x, top: y, width: w, height: h, ...style}}>{children}</div>
);
