#!/usr/bin/env python3
"""Place the narration sentences on the edit and duck the music under the voice.

usage: python3 mix.py MUSIC.wav NARRATION.mp3 CREDIT.mp3 OUT.wav
Chunks are (source start, source end, destination start, source, gain); source 0 is the
full narration, 1 the re-recorded credit line ("ویراواکسن" as one word); destinations are
section starts in src/Reel.tsx plus a small lead so the voice follows the title.
"""
import subprocess
import sys
import wave

import numpy as np

SR = 48000
CHUNKS = [
    (0.00, 8.62, 0.5),     # hook
    (8.80, 13.58, 10.4),   # six criteria
    (13.85, 23.85, 16.2),  # 1
    (24.15, 33.30, 26.3),  # 2
    (33.62, 42.88, 36.3),  # 3
    (43.22, 51.76, 46.3),  # 4
    (52.08, 61.60, 56.3),  # 5
    (61.91, 71.70, 66.3),  # 6
    (72.04, 80.94, 76.4),  # verdict
    (0.00, 3.76, 87.0, 1, 1.33),  # credit (re-recorded, +2.5 dB to match)
]


def read_wav(p):
    with wave.open(p) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float64) / 32768
        return x.reshape(-1, w.getnchannels())


music_p, vo_p, credit_p, out_p = sys.argv[1:5]
music = read_wav(music_p)


def decode(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float64) / 32768


SOURCES = [decode(vo_p), decode(credit_p)]
CHUNKS = [c if len(c) == 5 else (*c, 0, 1.0) for c in CHUNKS]

N = len(music)
vo = np.zeros(N)
for a, b, d, src, g in CHUNKS:
    seg = SOURCES[src][int(a * SR):int(b * SR)].copy() * g
    f = int(0.015 * SR)
    seg[:f] *= np.linspace(0, 1, f)
    seg[-f:] *= np.linspace(1, 0, f)
    i = int(d * SR)
    vo[i:i + len(seg)] += seg[: N - i]

# ducking: music down ~9 dB while the voice talks, with smooth attack/release
active = np.zeros(N)
for a, b, d, _, _ in CHUNKS:
    active[int((d - 0.15) * SR):int((d + (b - a) + 0.25) * SR)] = 1
k = int(0.25 * SR)
smooth = np.convolve(active, np.ones(k) / k, mode="same")
gain = 1.0 - 0.65 * np.clip(smooth, 0, 1)

vo /= np.abs(vo).max() + 1e-9
mix = music * (0.55 * gain)[:, None] + vo[:, None] * 0.9
mix /= np.abs(mix).max() + 1e-9
pcm = (mix * 0.95 * 32767).astype(np.int16)
with wave.open(out_p, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("wrote", out_p)
