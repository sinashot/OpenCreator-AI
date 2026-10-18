// Render stills at given seconds (or line keys) to out/stills/, then a contact sheet.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const tl = JSON.parse(fs.readFileSync('src/timeline.json', 'utf8'));
const args = process.argv.slice(2);
const times = args.map((a) => {
	const m = a.match(/^([a-z0-9]+)([+-][\d.]+)?$/);
	if (m && tl.lines[m[1]]) return {name: a, t: tl.lines[m[1]].start + Number(m[2] ?? 0.9 * (tl.lines[m[1]].end - tl.lines[m[1]].start))};
	return {name: a, t: Number(a)};
});
const browserExecutable = process.env.REMOTION_BROWSER ?? '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'Painkillers', browserExecutable});
fs.mkdirSync('out/stills', {recursive: true});
for (const {name, t} of times) {
	const frame = Math.min(composition.durationInFrames - 1, Math.round(t * composition.fps));
	await renderStill({serveUrl, composition, frame, output: `out/stills/${name}.jpg`, imageFormat: 'jpeg', jpegQuality: 85, browserExecutable});
	console.log(name, t.toFixed(2));
}
