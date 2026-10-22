import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';
const [secs, out = 'out/stills'] = process.argv.slice(2);
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'Reel', browserExecutable});
for (const s of secs.split(',').map(Number)) {
	const frame = Math.min(composition.durationInFrames - 1, Math.round(s * 30));
	const output = path.join(out, `s-${s.toFixed(2)}.png`);
	await renderStill({composition, serveUrl, frame, output, imageFormat: 'png', scale: 0.5, browserExecutable});
}
console.log('done');
