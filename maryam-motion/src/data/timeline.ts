import data from './timeline.json';

export type Word = {text: string; start: number};
export type Segment = {
	id: string;
	sceneId: number;
	startTime: number;
	endTime: number;
	fullText: string;
	highlightedPhrase: string;
	words: Word[];
};

export const SEGMENTS: Segment[] = data.segments;

const byId = Object.fromEntries(SEGMENTS.map((s) => [s.id, s]));

/** Start time of a segment (its first spoken word; 0 for the first). */
export const S = (id: string) => byId[id].startTime;
/** End time of a segment (= start of the next). */
export const E = (id: string) => byId[id].endTime;
/** When the n-th word of a segment is spoken (0-based; negative counts from the end). */
export const W = (id: string, n: number) => {
	const ws = byId[id].words;
	return ws[n < 0 ? ws.length + n : n].start;
};

export const segmentAt = (t: number) => SEGMENTS.find((s) => t >= s.startTime && t < s.endTime) ?? SEGMENTS[SEGMENTS.length - 1];
