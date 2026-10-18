import './fonts';
import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {FPS, H, TL, W} from './kit';

export const RemotionRoot: React.FC = () => (
	<Composition id="Painkillers" component={Film} durationInFrames={Math.ceil(TL.duration * FPS)} fps={FPS} width={W} height={H} />
);
