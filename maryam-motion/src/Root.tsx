import React from 'react';
import {Composition} from 'remotion';
import {DURATION_FRAMES, FPS, HEIGHT, WIDTH} from './constants';
import {FilmProps, MaryamFilm} from './MaryamFilm';
import {loadFonts} from './lib/fonts';

loadFonts();

export const RemotionRoot: React.FC = () => (
	<Composition
		id="MaryamFilm"
		component={MaryamFilm}
		width={WIDTH}
		height={HEIGHT}
		fps={FPS}
		durationInFrames={DURATION_FRAMES}
		defaultProps={{audioSrc: ''} satisfies FilmProps}
	/>
);
