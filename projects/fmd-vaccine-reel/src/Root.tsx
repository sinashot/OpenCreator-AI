import React from 'react';
import {Composition} from 'remotion';
import './fonts';
import {Reel, REEL_SECONDS} from './Reel';

const FPS = 30;

export const RemotionRoot: React.FC = () => (
	<Composition id="Reel" component={Reel} durationInFrames={REEL_SECONDS * FPS} fps={FPS} width={1080} height={1920} />
);
