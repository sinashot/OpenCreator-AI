import React from 'react';
import {AbsoluteFill} from 'remotion';
import {C} from '../constants';
import {S} from '../data/timeline';
import {smoothstep} from '../lib/anim';
import {mix, rgba} from '../lib/color';

/* Colour story.
   Phase 1 (0–38 s, crisis & insomnia): charcoal → deep navy, cold screen-blue glow from below.
   Phase 2 (38–63 s, new habit & calm): eases into calm navy with lavender and warm morning gold. */
type Pal = {top: string; bottom: string; glow: string; glowA: number; warm: string; warmA: number};

const NIGHT: Pal = {top: C.night0, bottom: C.night1, glow: C.screen, glowA: 0.72, warm: C.gold, warmA: 0};
const CALM: Pal = {top: '#070B22', bottom: '#1A2152', glow: C.lavender, glowA: 0.36, warm: C.gold, warmA: 0.16};
const MORNING: Pal = {top: '#0E1440', bottom: '#2E2A5E', glow: C.lavender, glowA: 0.3, warm: C.gold, warmA: 0.42};
const DEEP: Pal = {top: '#03061A', bottom: '#111C48', glow: C.lavender, glowA: 0.34, warm: C.gold, warmA: 0.14};

const blend = (a: Pal, b: Pal, p: number): Pal => ({
	top: mix(a.top, b.top, p),
	bottom: mix(a.bottom, b.bottom, p),
	glow: mix(a.glow, b.glow, p),
	glowA: a.glowA + (b.glowA - a.glowA) * p,
	warm: mix(a.warm, b.warm, p),
	warmA: a.warmA + (b.warmA - a.warmA) * p,
});

export const palette = (t: number): Pal => {
	let p = NIGHT;
	p = blend(p, CALM, smoothstep(S('5a') - 0.4, S('5c') + 1.5, t));
	p = blend(p, MORNING, smoothstep(S('6a') - 0.3, S('6a') + 2.2, t));
	p = blend(p, DEEP, smoothstep(S('6b') - 0.2, S('6b') + 1.8, t));
	return p;
};


export const Backdrop: React.FC<{t: number}> = ({t}) => {
	const p = palette(t);
	// the screen glow breathes and flickers faintly at night, settles later
	const flicker = 1 + 0.06 * Math.sin(t * 7.3) * (1 - smoothstep(S('5a'), S('5b'), t));
	const sway = Math.sin(t * 0.35) * 60;
	return (
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${p.top} 0%, ${p.top} 35%, ${p.bottom} 100%)`}}>
			<AbsoluteFill
				style={{
					background: `radial-gradient(130% 40% at ${50 + sway / 20}% 104%, ${rgba(p.glow, p.glowA * flicker)} 0%, ${rgba(p.glow, p.glowA * 0.35)} 38%, transparent 72%)`,
				}}
			/>
			<AbsoluteFill
				style={{
					background: `radial-gradient(70% 30% at 18% 0%, ${rgba(p.warm, p.warmA)} 0%, transparent 70%)`,
				}}
			/>
		</AbsoluteFill>
	);
};
