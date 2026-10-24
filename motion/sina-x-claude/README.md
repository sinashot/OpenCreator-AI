# Sina x Claude — a brick-film conversation

An 88-second vertical (9:16) motion graphic: Sina asks Claude "what kind of person am I?" and Claude
answers him to his face, with complaints first and praise after. Both characters are brick-style
minifigs built in three.js. Persian speech bubbles appear word by word, and the soundtrack (music,
SFX and a babble voice for each character) is synthesized in code.

Everything is a pure function of time: `window.seek(t)` paints frame `t`.

## Files

| file | what it holds |
|---|---|
| `script.js` | the single source of truth: dialogue, poses, faces, head turns, camera, moods |
| `film.js` | builds the set and props, plays the script, draws the 2-D layers |
| `sets/lego.js` | plastic materials, bricks, baseplate, the minifig rig (Sina's hair, Claude's spark) |
| `sets/faces.js` | printed faces (expressions, lip shapes, beard), torso prints |
| `sets/props.js` | F-14, capsule, reference tiles, rules scroll, Hiro's frame, tomato timer, cups… |
| `overlay.js` | mood backgrounds, RTL speech bubbles, tags, stamps, cartoon marks |
| `syllables.js` | speech timing shared by the mouths, the bubbles and the voice |
| `audio/voice.mjs` | babble voices → `audio/vo.wav` (the fallback) |
| `audio/tts.mjs` | real voices from ElevenLabs (`eleven_v3`, one cached take per line, with timestamps) |
| `audio/voices.json` | which ElevenLabs voice plays whom, and the model |
| `audio/vo_build.mjs` | places the takes, re-times the film around them → `vo.wav`, `speech.json` |
| `audio/score.py` | the score + custom effects → `audio/music.wav`, `beats.json` |
| `dev/sheet.js` | a model sheet of both characters (`sheet.html`) |

## Build (from `motion/`)

```bash
npm i                                   # three, opentype.js (playwright is preinstalled)
SK=<motion-reel skill dir>
node sina-x-claude/audio/voice.mjs
MOTION_REEL_SKILL=$SK uv run sina-x-claude/audio/score.py
node $SK/scripts/render.mjs --film sina-x-claude --format 9x16 --hits
node $SK/scripts/sfx.mjs sina-x-claude
node $SK/scripts/mix.mjs sina-x-claude --no-mux --music-db -3 --vo-db 0
./render_chunks.sh 0:11 11:22 22:33 33:44 44:55 55:66 66:77 77:88   # 24 fps, video only
# then concat the chunks and mux mix.wav -> out/sina-x-claude/final.mp4
```

With real voices, run `./voice_pipeline.sh` instead: it needs `ELEVENLABS_API_KEY` in the
environment and `api.elevenlabs.io` allowed by its network policy. Each line's take is placed at its
cue; where a take is longer than the time before the next line, that stretch of the film slows to
make room (`speech.json` holds the warp; the film, the hits and the score all follow it).

Sina's photos (`assets/ref_*`) and the rendered videos are kept out of git on purpose; put the
portrait back at `assets/ref_portrait.png` before rendering.

Stills for checking: `node shoot.mjs sina-x-claude/index.html 9x16 12.5,40 out/dev/x`.

## Rules kept

Persian digits everywhere, no glitch on text (except the one gag about that very rule, a quarter of a
second, cut off by a buzzer), Hiro referenced by a photo frame and never described, no company names.
