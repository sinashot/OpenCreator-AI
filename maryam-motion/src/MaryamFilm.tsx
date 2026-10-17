import React from 'react';
import {AbsoluteFill, Html5Audio, staticFile, useCurrentFrame} from 'remotion';
import {Backdrop} from './components/Backdrop';
import {Grain, Vignette} from './components/Grain';
import {KineticText} from './components/KineticText';
import {Stage} from './Stage';
import {C, FPS} from './constants';

export type FilmProps = {
	/** Narration to play under the film; defaults to the voice extracted from the source video. */
	audioSrc?: string;
};

/* Layer order: backdrop colour story → illustration stage (one camera per scene) →
   vignette and type shadow → kinetic type → grain over everything → narration. */
export const MaryamFilm: React.FC<FilmProps> = ({audioSrc}) => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	return (
		<AbsoluteFill style={{backgroundColor: C.night0, overflow: 'hidden'}}>
			<Backdrop t={t} />
			<Stage t={t} />
			<Vignette />
			<KineticText t={t} />
			<Grain t={t} />
			<Html5Audio src={audioSrc || staticFile('audio/narration.m4a')} />
		</AbsoluteFill>
	);
};
