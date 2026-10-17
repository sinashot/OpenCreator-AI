import timeline from './data/timeline.json';

export const WIDTH = 1080;
export const HEIGHT = 1920;
export const FPS = 60;
export const DURATION_S = timeline.duration; // 63.133 s, the length of the narration video
export const DURATION_FRAMES = Math.round(DURATION_S * FPS); // 3788

/** Where the illustration camera looks (screen space). The type block sits below it. */
export const ART_ANCHOR = {x: 540, y: 640};
/** Vertical centre of the kinetic type block. */
export const TEXT_CENTER_Y = 1335;
export const TEXT_MAX_W = 860;

export const C = {
	night0: '#02040A',
	night1: '#0B1536',
	screen: '#00A8FF',
	neon: '#9EFF00',
	white: '#FFFFFF',
	lavender: '#B8A9C9',
	gold: '#FFB84D',
	alarm: '#FF3B4E',
	ink: '#E8EEF9', // line-art white
	inkDim: '#7D8BB5',
	body: '#0D1640', // silhouette fill
	bodyEdge: '#C9D4EE',
	calmNavy: '#16224F',
} as const;
