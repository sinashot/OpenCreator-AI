import React from 'react';
import {AbsoluteFill} from 'remotion';
import {HEIGHT, WIDTH} from '../constants';

/* One grain layer over the whole frame (SVG turbulence, no image files).
   The pattern is re-seeded on twelves for a lo-fi film feel. */
export const Grain: React.FC<{t: number}> = ({t}) => {
	const seed = Math.floor(t * 12) % 24;
	return (
		<AbsoluteFill style={{mixBlendMode: 'overlay', opacity: 0.32, pointerEvents: 'none'}}>
			<svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
				<filter id="grain" x="0" y="0" width="100%" height="100%">
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width={WIDTH} height={HEIGHT} filter="url(#grain)" />
			</svg>
		</AbsoluteFill>
	);
};

/** Edge darkening and a soft pool of shadow behind the type block for legibility. */
export const Vignette: React.FC = () => (
	<AbsoluteFill
		style={{
			pointerEvents: 'none',
			background:
				'radial-gradient(60% 13% at 50% 69.5%, rgba(2,4,12,0.55) 0%, rgba(2,4,12,0) 100%), radial-gradient(130% 85% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)',
		}}
	/>
);
