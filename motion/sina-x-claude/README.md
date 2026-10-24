# Sina x Claude — a brick-film conversation

An 89-second vertical (9:16) motion graphic: Sina asks Claude "what kind of person am I?" and Claude
answers him to his face, with complaints first and praise after. Both characters are brick-style
minifigs built in three.js. The voices are real (ElevenLabs), the film is timed on them, and the
music and SFX are synthesized in code.

Everything is a pure function of time: `window.seek(t)` paints frame `t`.

## Files

| file | what it holds |
|---|---|
| `lines.js` | the dialogue: who says what, the audio tag, the tempo each take plays at, the beats before it |
| `cues.json` | the voice cue sheet: every line's start/end and word onsets, and a mouth envelope per speaker |
| `script.js` | poses, faces, head turns, camera and moods, all measured from the cue sheet |
| `film.js` | builds the set and props, plays the script, draws the 2-D layers |
| `sets/lego.js` | plastic materials, bricks, baseplate, the minifig rig (Sina's hair, Claude's spark) |
| `sets/faces.js` | printed faces (expressions, lip shapes, beard), torso prints |
| `sets/props.js` | F-14, capsule, reference tiles, rules scrolls, Hiro's frame, tomato timer, cups… |
| `overlay.js` | mood backgrounds, RTL speech bubbles, avatars, tags, stamps, cartoon marks |
| `audio/tts.mjs` | real voices from ElevenLabs (`eleven_v3`, one cached take per line, with timestamps) |
| `audio/voices.json` | which ElevenLabs voice plays whom, and the model |
| `audio/vo/` | the takes (Brian for Sina, Liam for Claude), cached per line |
| `audio/vo_cues.mjs` | lays the takes end to end → `audio/vo.wav`, `cues.json`, the film's duration |
| `audio/score.py` | the score + custom effects on the cue sheet → `audio/music.wav`, `beats.json` |
| `dev/sheet.js`, `dev/poses.js` | a model sheet of both characters and a pose check (`sheet.html`, `poses.html`) |

## Build (from `motion/`)

```bash
npm i                     # three, opentype.js (playwright is preinstalled)
./voice_pipeline.sh       # takes -> cue sheet -> score, SFX, mix -> chunked render -> final.mp4
```

`tts.mjs` needs an ElevenLabs key: `ELEVENLABS_API_KEY` in the environment, or a network secret
that adds the `xi-api-key` header for `api.elevenlabs.io` (then it sends no key itself). Takes are
cached by text and settings, so only changed lines cost credits (`--only id,id` limits a run).

Change a line in `lines.js`, run `tts.mjs --only <id>` and `vo_cues.mjs`: everything after it moves
with the voice, because every cue in `script.js`, `film.js` and `score.py` is a line start (`T`), a
line end (`TE`) or a word onset (`W`).

Sina's photos (`assets/ref_*`) and the rendered videos are kept out of git on purpose; put the
portrait back at `assets/ref_portrait.png` and the selfie at `assets/ref_selfie.jpg` before rendering.

Stills for checking: `node shoot.mjs sina-x-claude/index.html 9x16 12.5,40 out/dev/x`.

## Rules kept

Persian digits everywhere, no glitch on text (except the one gag about that very rule, a quarter of a
second, cut off by a buzzer), Hiro referenced by a photo frame and never described, no company names,
no watermark on Sina's photos.
