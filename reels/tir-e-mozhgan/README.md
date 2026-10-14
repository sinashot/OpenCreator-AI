# «تیر مژگان» — romantic lyric reel

A 9:16 motion graphic (1080×1920, 30 fps, 31.5 s) built around the song in the
screen recording (trimmed to start on the first note), for Instagram Reels.

**Story, one continuous camera:** a gold line opens into an eye on «با تیر مژگان می‌زنی» →
on each «تیر…» a lash leaves as an arrow and the camera whips left (RTL) to a heart;
three hits fill it like a glass → «غم عشق تو» while a Persian arch draws itself on the
accents → the words return stacked and huge → the heart splits into two that waltz on
the beat and meet on the last accent → the heart turns back into the eye, which closes
in the quiet bar → its lid becomes the underline of «برای تو».

Lyric timings come from a word-level transcription of the vocal; every cut and hit sits
on a detected beat (`audio-data.js`). Persian is set in Noto Nastaliq Urdu Bold and drawn
a whole word at a time (no per-letter boxes), with ZWNJ in «می‌زنی».

## Make it

```bash
npm i                       # playwright + http-server
tools/prep_audio.sh path/to/Screenrecorder.mp4   # -> audio/song.wav (+ audio-data.js, needs librosa)
npm run serve &             # http://localhost:8765/index.html?play  plays it live
node stills.mjs out 4.9 19.9 29.8                # style frames
npm run render              # -> tir-e-mozhgan.mp4 (H.264 CRF 16 + AAC 320k, ~7 min)
```

`film.js` is a pure function of time; change copy in `LINES`, timing in `HIT`/`KON`/`CAM`.
The song and renders are git-ignored.

Font: Noto Nastaliq Urdu — Copyright 2022 The Noto Project Authors, SIL Open Font License 1.1.
