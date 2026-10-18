/* Flat vector props. Each draws in its own viewBox and scales with `size`. */
import React from 'react';
import {C} from './kit';

type P = {size?: number; style?: React.CSSProperties};

export const Capsule: React.FC<P & {a?: string; b?: string; face?: 'calm' | 'shrug' | 'none'}> = ({size = 380, a = C.pain, b = C.ink, face = 'calm', style}) => (
	<svg width={size} height={size * 0.44} viewBox="0 0 400 176" style={{overflow: 'visible', ...style}}>
		<defs>
			<clipPath id="capL">
				<rect x="0" y="0" width="200" height="176" />
			</clipPath>
		</defs>
		<rect x="6" y="6" width="388" height="164" rx="82" fill={b} />
		<rect x="6" y="6" width="388" height="164" rx="82" fill={a} clipPath="url(#capL)" />
		<rect x="40" y="28" width="120" height="22" rx="11" fill="#fff" opacity={0.35} />
		{face !== 'none' && (
			<g fill={C.bg}>
				<circle cx="245" cy="78" r="11" />
				<circle cx="305" cy="78" r="11" />
				{face === 'calm' ? (
					<path d="M250 112 Q275 132 300 112" stroke={C.bg} strokeWidth="8" fill="none" strokeLinecap="round" />
				) : (
					<path d="M252 120 Q275 108 298 120" stroke={C.bg} strokeWidth="8" fill="none" strokeLinecap="round" />
				)}
			</g>
		)}
	</svg>
);

export const Burst: React.FC<P & {color?: string}> = ({size = 200, color = C.pain, style}) => {
	const pts: string[] = [];
	for (let i = 0; i < 20; i++) {
		const r = i % 2 ? 46 : 96;
		const a = (i / 20) * Math.PI * 2;
		pts.push(`${100 + r * Math.cos(a)},${100 + r * Math.sin(a)}`);
	}
	return (
		<svg width={size} height={size} viewBox="0 0 200 200" style={style}>
			<polygon points={pts.join(' ')} fill={color} />
			<circle cx="100" cy="100" r="30" fill="#fff" opacity={0.85} />
		</svg>
	);
};

export const Flame: React.FC<P & {color?: string}> = ({size = 220, color = C.nsaid, style}) => (
	<svg width={size} height={size * 1.25} viewBox="0 0 200 250" style={style}>
		<path d="M100 10 C130 70 185 95 175 165 C168 215 135 240 100 240 C62 240 28 212 26 165 C22 110 70 95 70 40 C88 60 92 75 100 10Z" fill={color} />
		<path d="M100 105 C118 140 145 155 138 190 C133 215 118 228 100 228 C80 228 64 214 62 190 C60 160 90 150 100 105Z" fill={C.neuro} />
	</svg>
);

export const Enzyme: React.FC<P & {open?: number; color?: string}> = ({size = 260, open = 1, color = C.pain, style}) => {
	const a = 28 * open; // mouth angle
	const r = 100;
	const x1 = 120 - r * Math.cos((a * Math.PI) / 180);
	const y1 = 120 - r * Math.sin((a * Math.PI) / 180);
	const y2 = 120 + r * Math.sin((a * Math.PI) / 180);
	return (
		<svg width={size} height={size} viewBox="0 0 240 240" style={{overflow: 'visible', ...style}}>
			<path d={`M120 120 L${x1} ${y1} A${r} ${r} 0 1 1 ${x1} ${y2} Z`} fill={color} />
			<circle cx="140" cy="70" r="13" fill={C.bg} />
			<circle cx="185" cy="150" r="9" fill="#fff" opacity={0.25} />
			<circle cx="160" cy="185" r="6" fill="#fff" opacity={0.25} />
		</svg>
	);
};

export const Head: React.FC<P & {color?: string}> = ({size = 220, color = C.ink, style}) => (
	<svg width={size} height={size} viewBox="0 0 200 200" style={style}>
		<circle cx="100" cy="90" r="62" fill={color} />
		<rect x="80" y="140" width="40" height="40" rx="12" fill={color} />
		<path d="M60 40 L82 72 L66 76 L92 110" stroke={C.pain} strokeWidth="12" fill="none" strokeLinejoin="round" strokeLinecap="round" />
	</svg>
);

export const Tooth: React.FC<P & {color?: string}> = ({size = 200, color = C.ink, style}) => (
	<svg width={size} height={size} viewBox="0 0 200 200" style={style}>
		<path d="M50 40 C70 25 85 40 100 40 C115 40 130 25 150 40 C175 60 162 100 152 120 C142 145 140 180 125 180 C110 180 112 140 100 140 C88 140 90 180 75 180 C60 180 58 145 48 120 C38 100 25 60 50 40Z" fill={color} />
		<circle cx="150" cy="55" r="16" fill={C.pain} />
	</svg>
);

export const Dumbbell: React.FC<P & {color?: string}> = ({size = 420, color = C.opioid, style}) => (
	<svg width={size} height={size * 0.5} viewBox="0 0 400 200" style={style}>
		<rect x="110" y="88" width="180" height="24" rx="12" fill={C.dim} />
		<rect x="40" y="30" width="60" height="140" rx="18" fill={color} />
		<rect x="300" y="30" width="60" height="140" rx="18" fill={color} />
		<rect x="10" y="60" width="36" height="80" rx="12" fill={color} opacity={0.75} />
		<rect x="354" y="60" width="36" height="80" rx="12" fill={color} opacity={0.75} />
	</svg>
);

export const Heart: React.FC<P & {color?: string}> = ({size = 160, color = C.pain, style}) => (
	<svg width={size} height={size} viewBox="0 0 200 200" style={style}>
		<path d="M100 175 C40 130 15 100 15 65 C15 35 40 15 65 15 C82 15 94 25 100 38 C106 25 118 15 135 15 C160 15 185 35 185 65 C185 100 160 130 100 175Z" fill={color} />
	</svg>
);

export const Scalpel: React.FC<P> = ({size = 200, style}) => (
	<svg width={size} height={size} viewBox="0 0 200 200" style={style}>
		<rect x="20" y="120" width="110" height="26" rx="13" transform="rotate(-35 75 133)" fill={C.dim} />
		<path d="M118 92 L185 30 C190 60 165 95 140 112Z" fill={C.ink} />
	</svg>
);

export const Bone: React.FC<P & {broken?: boolean}> = ({size = 220, style}) => (
	<svg width={size} height={size * 0.6} viewBox="0 0 220 130" style={style}>
		<g fill={C.ink}>
			<circle cx="28" cy="45" r="22" />
			<circle cx="28" cy="85" r="22" />
			<path d="M30 50 H98 L106 58 L96 66 L104 74 L98 80 H30Z" />
			<circle cx="192" cy="45" r="22" />
			<circle cx="192" cy="85" r="22" />
			<path d="M190 50 H122 L114 58 L124 66 L116 74 L122 80 H190Z" />
		</g>
		<path d="M110 40 L104 30 M116 92 L122 104" stroke={C.pain} strokeWidth="6" strokeLinecap="round" />
	</svg>
);

export const Tube: React.FC<P & {color?: string}> = ({size = 300, color = C.topical, style}) => (
	<svg width={size} height={size * 0.4} viewBox="0 0 300 120" style={style}>
		<path d="M20 20 H200 L240 45 V75 L200 100 H20 Q8 60 20 20Z" fill={C.ink} />
		<rect x="40" y="38" width="120" height="44" rx="10" fill={color} />
		<rect x="240" y="48" width="40" height="24" rx="6" fill={C.dim} />
	</svg>
);

export const Snow: React.FC<P & {color?: string}> = ({size = 120, color = C.topical, style}) => (
	<svg width={size} height={size} viewBox="0 0 120 120" style={style}>
		<g stroke={color} strokeWidth="9" strokeLinecap="round">
			{[0, 60, 120].map((a) => (
				<g key={a} transform={`rotate(${a} 60 60)`}>
					<line x1="60" y1="10" x2="60" y2="110" />
					<path d="M45 22 L60 36 L75 22 M45 98 L60 84 L75 98" fill="none" />
				</g>
			))}
		</g>
	</svg>
);

export const Chili: React.FC<P> = ({size = 120, style}) => (
	<svg width={size} height={size} viewBox="0 0 120 120" style={style}>
		<path d="M88 30 C100 60 85 100 30 108 C20 110 18 100 28 96 C60 84 66 60 66 36Z" fill={C.pain} />
		<path d="M66 36 C66 26 76 22 88 30 C90 20 98 14 106 12" stroke={C.relief} strokeWidth="8" fill="none" strokeLinecap="round" />
	</svg>
);

export const NoFlame: React.FC<P> = ({size = 120, style}) => (
	<div style={{position: 'relative', width: size, height: size, ...style}}>
		<Flame size={size * 0.75} style={{position: 'absolute', left: size * 0.125, top: size * 0.03}} />
		<svg width={size} height={size} viewBox="0 0 120 120" style={{position: 'absolute', left: 0, top: 0}}>
			<circle cx="60" cy="60" r="52" stroke={C.ink} strokeWidth="9" fill="none" />
			<line x1="24" y1="96" x2="96" y2="24" stroke={C.ink} strokeWidth="9" strokeLinecap="round" />
		</svg>
	</div>
);

export const Spine: React.FC<P> = ({size = 200, style}) => (
	<svg width={size * 0.5} height={size} viewBox="0 0 100 200" style={style}>
		{[0, 1, 2, 3, 4, 5].map((i) => (
			<rect key={i} x={22 - (i === 3 ? 14 : 0)} y={8 + i * 32} width="56" height="24" rx="9" fill={i === 3 ? C.pain : C.ink} />
		))}
	</svg>
);

export const Rash: React.FC<P> = ({size = 200, style}) => (
	<svg width={size} height={size} viewBox="0 0 200 200" style={style}>
		<rect x="20" y="40" width="160" height="120" rx="40" fill={C.ink} />
		{[
			[60, 80],
			[90, 70],
			[120, 90],
			[80, 110],
			[140, 120],
			[110, 125],
		].map(([x, y], i) => (
			<circle key={i} cx={x} cy={y} r={9 + (i % 3) * 3} fill={C.pain} />
		))}
	</svg>
);

export const Jar: React.FC<P> = ({size = 260, style}) => (
	<svg width={size} height={size * 1.2} viewBox="0 0 200 240" style={style}>
		<rect x="40" y="20" width="120" height="40" rx="12" fill={C.relief} />
		<rect x="25" y="55" width="150" height="170" rx="34" fill={C.ink} />
		<rect x="40" y="105" width="120" height="70" rx="14" fill={C.bg} />
		<path d="M100 118 C112 130 112 148 100 162 C88 148 88 130 100 118Z" fill={C.relief} />
		<path d="M100 162 C80 158 72 145 70 132 C86 136 96 148 100 162Z M100 162 C120 158 128 145 130 132 C114 136 104 148 100 162Z" fill={C.relief} />
	</svg>
);
