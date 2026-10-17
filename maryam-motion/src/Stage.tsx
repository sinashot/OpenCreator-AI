import React from 'react';
import {HEIGHT, WIDTH} from './constants';
import {Defs} from './art/Defs';
import {BedTop} from './scenes/BedTop';
import {Desk} from './scenes/Desk';
import {Mind} from './scenes/Mind';
import {Room} from './scenes/Room';
import {Calm} from './scenes/Calm';

/** The illustration layer: one SVG, each scene owns its world and its camera. */
export const Stage: React.FC<{t: number}> = ({t}) => (
	<svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{position: 'absolute', inset: 0}}>
		<Defs />
		{/* art lives in the upper 60 % of the frame and dissolves above the type block */}
		<linearGradient id="artFade" x1="0" y1="0" x2="0" y2={HEIGHT} gradientUnits="userSpaceOnUse">
			<stop offset="0" stopColor="#fff" stopOpacity="0.55" />
			<stop offset="0.07" stopColor="#fff" stopOpacity="1" />
			<stop offset="0.53" stopColor="#fff" stopOpacity="1" />
			<stop offset="0.63" stopColor="#fff" stopOpacity="0" />
		</linearGradient>
		<mask id="artMask" maskUnits="userSpaceOnUse" x="0" y="0" width={WIDTH} height={HEIGHT}>
			<rect width={WIDTH} height={HEIGHT} fill="url(#artFade)" />
		</mask>
		<g mask="url(#artMask)">
			<BedTop t={t} />
			<Desk t={t} />
			<Mind t={t} />
			<Room t={t} />
			<Calm t={t} />
		</g>
	</svg>
);
