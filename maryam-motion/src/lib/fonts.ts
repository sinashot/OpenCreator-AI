import {continueRender, delayRender, staticFile} from 'remotion';

/* Load Vazirmatn before the first frame. Without it Chrome silently falls back to a
   system font and the type block's measured layout would be wrong. */
export const FA = '"Vazirmatn", Tahoma, sans-serif';

let ready: Promise<void> | null = null;

export const loadFonts = (): Promise<void> => {
	if (ready) return ready;
	const handle = delayRender('Loading Vazirmatn');
	const face = new FontFace('Vazirmatn', `url(${staticFile('fonts/Vazirmatn-VF.woff2')}) format('woff2')`, {
		weight: '100 900',
	});
	ready = face
		.load()
		.then((f) => {
			(document.fonts as unknown as {add: (font: FontFace) => void}).add(f);
		})
		.catch((err) => {
			console.error('Vazirmatn failed to load', err);
		})
		.finally(() => continueRender(handle));
	return ready;
};
