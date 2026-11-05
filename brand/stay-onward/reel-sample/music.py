# A calm score for the sample reel: felt-piano chords and a soft pad at 72 bpm, a low swell under the logo.
#   python3 music.py out.wav
import subprocess, sys
import numpy as np
SR = 48000; BPM = 72; BEAT = 60 / BPM; BAR = BEAT * 4; DUR = BAR * 6
N = int((DUR + 0.5) * SR); T = np.arange(N) / SR
mix = np.zeros(N)
def hz(n): return 440 * 2 ** ((n - 69) / 12)
def add(x, at, g):
    i = int(at * SR); j = min(N, i + len(x)); mix[i:j] += x[: j - i] * g
def piano(m, dur, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    x = sum(a * np.sin(2 * np.pi * f * h * t) * np.exp(-t * (1.2 + h * 0.9)) for h, a in [(1, 1), (2, 0.45), (3, 0.18), (4, 0.08)])
    return x * np.minimum(1, t / 0.008) * vel * np.minimum(1, (dur - t) / 0.3)
# Am - F - C - G, then F - (logo) C
CH = [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62], [53, 57, 60], [48, 52, 55, 60]]
MEL = [[76, 74, 72], [72, 69], [67, 72, 74], [71, 74], [72, 69, 72], [79]]
for b, (ch, mel) in enumerate(zip(CH, MEL)):
    t0 = b * BAR
    add(piano(ch[0] - 12, BAR + 1.5, 0.8), t0, 0.35)
    for i, m in enumerate(ch): add(piano(m, BAR + 1.0, 0.6), t0 + 0.04 * i, 0.16)
    for i, m in enumerate(mel): add(piano(m, BEAT * 2.2, 0.7), t0 + BEAT * (1 + i * (3 / len(mel))), 0.13)
    # pad
    n = int(BAR * SR) + int(0.8 * SR); t = np.arange(n) / SR
    pad = sum(np.sin(2 * np.pi * hz(m) * t + np.sin(2 * np.pi * 0.3 * t)) for m in ch) * np.minimum(1, t / 1.0) * np.minimum(1, (n / SR - t) / 0.8)
    add(pad, t0, 0.03)
# a low swell into the logo
n = int(2.5 * SR); t = np.arange(n) / SR
add(np.sin(2 * np.pi * 36 * t) * np.minimum(1, t / 1.5) * np.exp(-np.maximum(0, t - 1.5) * 2), BAR * 5 - 1.5, 0.4)
mix *= np.clip((DUR + 0.5 - T) / 1.5, 0, 1)
mix = mix[: int(DUR * SR)]
mix /= np.abs(mix).max() + 1e-9; mix *= 0.89
pcm = (mix * 32767).astype('<i2')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', 'aecho=0.8:0.6:60|130:0.25|0.18,loudnorm=I=-14:TP=-1.5', '-ar', str(SR), '-ac', '2', sys.argv[1]], input=pcm.tobytes(), check=True)
print('->', sys.argv[1])
