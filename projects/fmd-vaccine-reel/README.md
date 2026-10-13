# ریلز واکسن تب برفکی — ویراواکسن شایا

موشن‌گرافیک عمودی (۹:۱۶، ۱۰۸۰×۱۹۲۰، ۳۰ فریم، ۹۶ ثانیه، با نریشن فارسی) برای ریلز اینستاگرام؛ خلاصه‌ی ویدیوی «راهنمای واکسن‌های تب برفکی».

Output: `out/fmd-vaccine-reel.mp4`

## Structure (120 BPM, 1 bar = 2 s, every section change is a whip pan on a downbeat)

| Time | Section |
|---|---|
| 0–10 s | Hook: FMD capsid, antibodies bind it |
| 10–16 s | The six criteria |
| 16–76 s | Criteria ۱–۶, 10 s each |
| 76–86 s | Verdict / closing question |
| 86–96 s | «تهیه‌شده توسط شرکت ویراواکسن شایا» (final hit at 92 s) |

## Audio

- Narration: ElevenLabs, voice "Roya – Warm Tehrani Narrator" (`music/narration-roya-take1.mp3`; the credit line was re-recorded as `music/narration-credit-take1.mp3` so «ویراواکسن» is said as one word).
- Music: original modern electronic underscore written in code, `music/compose_lab_pulse.py`.
- `music/mix.py` places each narration sentence on its scene and ducks the music under the voice;
  then `ffmpeg -af loudnorm=I=-14:TP=-1.5` → `public/audio/mix.wav`.

```bash
python3 music/compose_lab_pulse.py /tmp/lab.wav
python3 music/mix.py /tmp/lab.wav music/narration-roya-take1.mp3 music/narration-credit-take1.mp3 /tmp/premix.wav
ffmpeg -i /tmp/premix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 public/audio/mix.wav
```

## Render

```bash
npm install
npx remotion render src/index.ts Reel out/fmd-vaccine-reel.mp4
```

`remotion.config.ts` points at the pre-installed headless Chromium in this cloud container; remove the `setBrowserExecutable` line on a normal machine.

Font: Vazirmatn (OFL).
