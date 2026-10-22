import React from 'react';
import {FA} from './fonts';
import {C, HANDLE, cl, eo, rm} from './kit';

/* Capsule drawn around its own centre. The cream half carries the handle as an imprint. */
export const Capsule: React.FC<{x: number; y: number; len: number; wid: number; rot?: number; imprint?: boolean; opacity?: number}> = ({
	x,
	y,
	len,
	wid,
	rot = 0,
	imprint = false,
	opacity = 1,
}) => {
	const L = len / 2;
	const r = wid / 2;
	return (
		<g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
			<path d={`M0,${-r} H${L - r} A${r},${r} 0 0 1 ${L - r},${r} H0 Z`} fill={C.amber} />
			<path d={`M0,${-r} H${-(L - r)} A${r},${r} 0 0 0 ${-(L - r)},${r} H0 Z`} fill={C.ink} />
			<line x1={0} y1={-r} x2={0} y2={r} stroke="#0B1120" strokeOpacity={0.25} strokeWidth={Math.max(1.5, wid * 0.02)} />
			<rect x={-L + r * 0.6} y={-r * 0.62} width={len - r * 1.2} height={r * 0.22} rx={r * 0.11} fill="#FFFFFF" opacity={0.35} />
			{imprint ? (
				<text x={-L / 2 + r * 0.15} y={r * 0.28} textAnchor="middle" fontFamily={FA} fontWeight={700} fontSize={wid * 0.17} fill="#0B1120" opacity={0.5} direction="ltr">
					{HANDLE}
				</text>
			) : null}
		</g>
	);
};

export const PIV = {x: 540, y: 760};
const ARM = 340;
const STR = 150;

const Pan: React.FC<{x: number; y: number; children?: React.ReactNode; p: number}> = ({x, y, children, p}) => {
	const by = y + STR * p;
	return (
		<g>
			<line x1={x} y1={y} x2={x - 112} y2={by} stroke={C.line} strokeWidth={3} opacity={p} />
			<line x1={x} y1={y} x2={x + 112} y2={by} stroke={C.line} strokeWidth={3} opacity={p} />
			<g opacity={p}>
				<path d={`M${x - 120},${by} Q${x},${by + 96} ${x + 120},${by} Z`} fill="rgba(201,210,227,0.10)" stroke={C.line} strokeWidth={4} />
				{children}
			</g>
			<circle cx={x} cy={y} r={7} fill={C.line} />
		</g>
	);
};

/* 10 molecules stacked 4-3-2-1 inside a pan; n of them visible */
export const Molecules: React.FC<{x: number; y: number; n: number; glow?: number; t: number}> = ({x, y, n, glow = 0, t}) => {
	const out = [];
	let k = 0;
	const rows = [4, 3, 2, 1];
	for (let row = 0; row < rows.length; row++) {
		for (let i = 0; i < rows[row]; i++) {
			const p = cl(n - k);
			const cx = x + (i - (rows[row] - 1) / 2) * 34;
			const cy = y + 18 - row * 30 - (1 - eo(p)) * 40;
			out.push(
				<g key={k} opacity={p}>
					{glow > 0 ? <circle cx={cx} cy={cy} r={24 + 4 * Math.sin(t * 4 + k)} fill={C.amber} opacity={0.18 * glow} /> : null}
					<circle cx={cx} cy={cy} r={15} fill={C.amber} stroke="#FFD597" strokeWidth={2} />
				</g>,
			);
			k++;
		}
	}
	return <g>{out}</g>;
};

/*
 * The chemical balance: right pan = mood (molecules), left pan = the drug.
 * theta > 0 tips the right pan down.
 */
export const Balance: React.FC<{
	t: number;
	theta: number;
	build: number; // 0..1 construction progress
	mood: number; // molecules visible 0..10
	moodGlow?: number;
	drug: number; // capsule scale 0..1
	drugDrop?: number; // px the capsule has fallen
	drugRot?: number;
	labels: number;
	halo?: number;
}> = ({t, theta, build, mood, moodGlow = 0, drug, drugDrop = 0, drugRot = 0, labels, halo = 0}) => {
	const a = (theta * Math.PI) / 180;
	const pf = eo(rm(build, 0, 0.35));
	const pb = eo(rm(build, 0.25, 0.65));
	const pp = eo(rm(build, 0.55, 1));
	const R = {x: PIV.x + ARM * Math.cos(a) * pb, y: PIV.y + ARM * Math.sin(a) * pb};
	const L = {x: PIV.x - ARM * Math.cos(a) * pb, y: PIV.y - ARM * Math.sin(a) * pb};
	const bowlR = R.y + STR;
	const bowlL = L.y + STR;
	return (
		<g>
			{halo > 0 ? <circle cx={PIV.x} cy={860} r={430} fill="none" stroke={C.teal} strokeWidth={3} opacity={0.35 * halo} strokeDasharray="6 14" transform={`rotate(${t * 12} ${PIV.x} 860)`} /> : null}
			{halo > 0 ? <circle cx={PIV.x} cy={860} r={460} fill={C.teal} opacity={0.05 * halo} /> : null}
			{/* fulcrum */}
			<g opacity={pf} transform={`translate(0 ${(1 - pf) * 60})`}>
				<path d={`M${PIV.x},${PIV.y} L${PIV.x - 78},1000 L${PIV.x + 78},1000 Z`} fill={C.teal} />
				<rect x={PIV.x - 190} y={1000} width={380} height={22} rx={11} fill={C.line} />
				<text x={PIV.x} y={1016} textAnchor="middle" fontFamily={FA} fontSize={15} fontWeight={700} fill="#0B1120" opacity={0.55} direction="ltr">
					{HANDLE}
				</text>
			</g>
			{/* beam */}
			<line x1={L.x} y1={L.y} x2={R.x} y2={R.y} stroke={C.ink} strokeWidth={9} strokeLinecap="round" opacity={pb > 0 ? 1 : 0} />
			<circle cx={PIV.x} cy={PIV.y} r={14} fill={C.ink} opacity={pf} />
			<Pan x={L.x} y={L.y} p={pp}>
				{drug > 0 ? (
					<g transform={`translate(${L.x} ${bowlL + 4 + drugDrop}) rotate(${drugRot}) scale(${drug})`}>
						<Capsule x={0} y={-18} len={130} wid={52} rot={-8} />
					</g>
				) : null}
			</Pan>
			<Pan x={R.x} y={R.y} p={pp}>
				<Molecules x={R.x} y={bowlR} n={mood} glow={moodGlow} t={t} />
			</Pan>
			<g opacity={labels}>
				<foreignObject x={R.x - 130} y={bowlR + 40} width={260} height={80}>
					<div dir="rtl" lang="fa" style={{fontFamily: FA, fontSize: 38, fontWeight: 800, color: C.amber, textAlign: 'center', lineHeight: 1.8}}>
						خلق‌وخو
					</div>
				</foreignObject>
				<foreignObject x={L.x - 130} y={bowlL + 40} width={260} height={80}>
					<div dir="rtl" lang="fa" style={{fontFamily: FA, fontSize: 38, fontWeight: 800, color: C.teal, textAlign: 'center', lineHeight: 1.8}}>
						دارو
					</div>
				</foreignObject>
			</g>
		</g>
	);
};

export const Check: React.FC<{x: number; y: number; s?: number; color?: string; p?: number}> = ({x, y, s = 1, color = C.teal, p = 1}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`}>
		<circle r={26} fill={color} opacity={0.18} />
		<path d="M-12,1 L-3,10 L14,-9" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} />
	</g>
);
