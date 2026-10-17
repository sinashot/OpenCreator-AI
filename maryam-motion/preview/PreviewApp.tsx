import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Player, PlayerRef} from '@remotion/player';
import {MaryamFilm} from '../src/MaryamFilm';
import {DURATION_FRAMES, FPS, HEIGHT, WIDTH} from '../src/constants';
import {SEGMENTS} from '../src/data/timeline';

/* Preview environment: the film in @remotion/player with our own transport.
   The controls live outside the composition, so a render never contains them.
   Add ?clean to the URL to hide them for a screen capture. */

const BAR = 132;
const SCENE_COLORS = ['#00A8FF', '#9EFF00', '#7FD4FF', '#5BC8FF', '#B8A9C9', '#FFB84D'];
const fa = (n: number) => new Intl.NumberFormat('fa-IR', {minimumIntegerDigits: 2}).format(n);
const clock = (frame: number) => {
	const s = frame / FPS;
	return `${fa(Math.floor(s / 60))}:${fa(Math.floor(s % 60))}٫${fa(Math.floor((s % 1) * 100))}`;
};

export const PreviewApp: React.FC = () => {
	const player = useRef<PlayerRef>(null);
	const [frame, setFrame] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [audioSrc, setAudioSrc] = useState('');
	const [audioName, setAudioName] = useState('نریشن اصلی');
	const clean = useMemo(() => new URLSearchParams(location.search).has('clean'), []);

	useEffect(() => {
		const p = player.current;
		if (!p) return;
		const onFrame = (e: {detail: {frame: number}}) => setFrame(e.detail.frame);
		const onPlay = () => setPlaying(true);
		const onPause = () => setPlaying(false);
		p.addEventListener('frameupdate', onFrame);
		p.addEventListener('play', onPlay);
		p.addEventListener('pause', onPause);
		p.addEventListener('ended', onPause);
		return () => {
			p.removeEventListener('frameupdate', onFrame);
			p.removeEventListener('play', onPlay);
			p.removeEventListener('pause', onPause);
			p.removeEventListener('ended', onPause);
		};
	}, []);

	const seek = useCallback((f: number) => {
		const clamped = Math.max(0, Math.min(DURATION_FRAMES - 1, Math.round(f)));
		player.current?.seekTo(clamped);
		setFrame(clamped);
	}, []);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.target instanceof HTMLInputElement) return;
			if (e.code === 'Space') {
				e.preventDefault();
				player.current?.toggle();
			}
			// arrows follow the RTL timeline: left = forward
			if (e.code === 'ArrowLeft') seek(frame + FPS);
			if (e.code === 'ArrowRight') seek(frame - FPS);
			if (e.code === 'Home') seek(0);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [frame, seek]);

	const onNarration = (file: File | undefined) => {
		if (!file) return;
		setAudioSrc(URL.createObjectURL(file));
		setAudioName(file.name);
		seek(0);
	};

	const t = frame / FPS;
	const seg = SEGMENTS.find((s) => t >= s.startTime && t < s.endTime) ?? SEGMENTS[SEGMENTS.length - 1];

	return (
		<div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
			{/* the player lays itself out in LTR; the film sets dir="rtl" on its own type */}
			<div dir="ltr" style={{flex: 1, minHeight: 0, width: '100%', display: 'flex', justifyContent: 'center', padding: clean ? 0 : '16px 0 8px'}}>
				<Player
					ref={player}
					component={MaryamFilm}
					inputProps={{audioSrc}}
					durationInFrames={DURATION_FRAMES}
					fps={FPS}
					compositionWidth={WIDTH}
					compositionHeight={HEIGHT}
					controls={false}
					clickToPlay
					style={{height: '100%', aspectRatio: `${WIDTH} / ${HEIGHT}`, maxWidth: '100%', borderRadius: clean ? 0 : 14, boxShadow: '0 20px 80px rgba(0,0,0,.6)'}}
				/>
			</div>

			{clean ? null : (
				<div
					dir="rtl"
					style={{
						width: 'min(720px, calc(100% - 32px))',
						height: BAR,
						boxSizing: 'border-box',
						padding: '12px 16px',
						marginBottom: 12,
						borderRadius: 14,
						background: 'rgba(11,21,54,.85)',
						border: '1px solid rgba(184,169,201,.18)',
						display: 'flex',
						flexDirection: 'column',
						gap: 10,
					}}
				>
					<div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 14}}>
						<button
							onClick={() => player.current?.toggle()}
							aria-label={playing ? 'توقف' : 'پخش'}
							style={{width: 44, height: 44, borderRadius: 22, border: 'none', background: '#9EFF00', color: '#02040A', cursor: 'pointer', display: 'grid', placeItems: 'center'}}
						>
							{/* play/pause glyphs are never mirrored */}
							<svg width="18" height="18" viewBox="0 0 18 18" style={{direction: 'ltr'}}>
								{playing ? <path d="M4 2h3.5v14H4zM10.5 2H14v14h-3.5z" fill="currentColor" /> : <path d="M4 2l12 7-12 7z" fill="currentColor" />}
							</svg>
						</button>
						<span style={{fontVariantNumeric: 'tabular-nums', minWidth: 150}}>
							{clock(frame)} / {clock(DURATION_FRAMES)}
						</span>
						<span style={{flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', opacity: 0.8}}>
							<b style={{color: SCENE_COLORS[seg.sceneId - 1]}}>صحنه {seg.sceneId.toLocaleString('fa-IR')} · {seg.id}</b> — {seg.fullText}
						</span>
						<label style={{cursor: 'pointer', fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(232,238,249,.25)'}} title={audioName}>
							فایل نریشن
							<input type="file" accept="audio/*,video/*" style={{display: 'none'}} onChange={(e) => onNarration(e.target.files?.[0])} />
						</label>
					</div>

					<div style={{position: 'relative', height: 34}}>
						{/* scene bands and segment ticks under the scrubber (right = start) */}
						{SEGMENTS.map((s) => (
							<div
								key={s.id}
								title={`${s.id}: ${s.fullText}`}
								onClick={() => seek(s.startTime * FPS)}
								style={{
									position: 'absolute',
									top: 22,
									height: 8,
									right: `${(s.startTime / (DURATION_FRAMES / FPS)) * 100}%`,
									width: `calc(${((s.endTime - s.startTime) / (DURATION_FRAMES / FPS)) * 100}% - 2px)`,
									background: SCENE_COLORS[s.sceneId - 1],
									opacity: s === seg ? 0.95 : 0.35,
									borderRadius: 3,
									cursor: 'pointer',
								}}
							/>
						))}
						<input
							type="range"
							min={0}
							max={DURATION_FRAMES - 1}
							value={frame}
							onChange={(e) => seek(Number(e.target.value))}
							aria-label="نوار زمان"
							style={{position: 'absolute', inset: '0 0 auto 0', width: '100%', direction: 'rtl', accentColor: '#9EFF00'}}
						/>
					</div>
				</div>
			)}
		</div>
	);
};
