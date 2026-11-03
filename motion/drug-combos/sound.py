# Music bed and sound effects for the drug-combos film, mixed under the voice-over.
#   python3 sound.py <voice source video> <out.wav>
import json, subprocess, sys
import numpy as np
SR = 48000
CUT, DUR = 76.95, 79.8
cue = json.load(open('cues.json'))
N = int(DUR * SR)
t_all = np.arange(N) / SR
rng = np.random.default_rng(3)

def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def add(buf, x, at, g=1.0):
    i = int(at * SR); j = min(len(buf), i + len(x))
    if i < len(buf): buf[i:j] += x[: j - i] * g
def lp(x, a):  # one-pole low-pass
    y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x): s += a * (v - s); y[i] = s
    return y

mus = np.zeros(N); fx = np.zeros(N)
# a dark pulse: 96 bpm, A minor drone, sub kick on every beat, a tick on the off-beat
B = 60 / 96
n = int(B * SR); tt = np.arange(n) / SR
kick = np.sin(2 * np.pi * (45 + 90 * np.exp(-tt / 0.03)) * tt) * env(n, 0.002, 0.18)
tick = rng.standard_normal(int(0.03 * SR)) * env(int(0.03 * SR), 0.0005, 0.008)
for k in range(int(CUT / B)):
    add(mus, kick, k * B, 0.55 if k % 4 == 0 else 0.35)
    add(mus, tick, k * B + B / 2, 0.08)
drone = sum(np.sign(np.sin(2 * np.pi * f * t_all + p)) for f, p in [(55, 0), (55.4, 1), (82.4, 2), (110.2, 0.5)]) * 0.12
drone = lp(drone, 0.02) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t_all))
mus += drone * (t_all < CUT)
# a rising minor arp bell every 8 beats, quiet
for k in range(0, int(CUT / B), 8):
    for j, f in enumerate([440, 523.25, 659.25, 783.99]):
        m = int(0.5 * SR); x = np.sin(2 * np.pi * f * np.arange(m) / SR) * env(m, 0.003, 0.25)
        add(mus, x, k * B + j * B / 2, 0.05)
# impacts: a sub boom + a noise crack
for s in cue['slams']:
    m = int(1.2 * SR); x = np.arange(m) / SR
    boom = np.sin(2 * np.pi * (38 + 70 * np.exp(-x / 0.06)) * x) * env(m, 0.001, 0.45)
    crack = lp(rng.standard_normal(m), 0.3) * env(m, 0.0005, 0.06)
    add(fx, boom * 0.9 + crack * 0.5, s, 0.7)
# whooshes into each scene
for s in cue['scenes']:
    m = int(0.45 * SR); x = np.arange(m) / SR
    w = lp(rng.standard_normal(m), 0.08) * np.sin(np.pi * x / 0.45) ** 2
    add(fx, w, s - 0.35, 0.55)
# pops on the labels
for s in cue['pops']:
    m = int(0.12 * SR); x = np.arange(m) / SR
    add(fx, np.sin(2 * np.pi * (600 + 900 * x / 0.12) * x) * env(m, 0.001, 0.03), s, 0.22)
# the fuse hiss
a, b = cue['fuse']; m = int((b - a) * SR)
add(fx, rng.standard_normal(m) * 0.06 * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * np.arange(m) / SR)), a, 1)
# the racing heart: lub-dub
a, b = cue['heart']; k = a
while k < b:
    for o, g in [(0, 1), (0.13, 0.7)]:
        m = int(0.18 * SR); x = np.arange(m) / SR
        add(fx, np.sin(2 * np.pi * 60 * x) * env(m, 0.003, 0.05), k + o, 0.8 * g)
    k += 60 / 170
# flatline beep, then the jam
m = int(1.6 * SR); add(fx, np.sin(2 * np.pi * 1000 * np.arange(m) / SR) * np.minimum(1, (1.6 - np.arange(m) / SR) / 0.2), cue['flat'], 0.06)
m = int(0.35 * SR); x = np.arange(m) / SR
add(fx, np.sign(np.sin(2 * np.pi * 70 * x)) * env(m, 0.001, 0.12), cue['jam'], 0.25)
# end chime on the call to share
for j, f in enumerate([659.25, 880, 1318.5]):
    m = int(1.2 * SR); add(fx, np.sin(2 * np.pi * f * np.arange(m) / SR) * env(m, 0.002, 0.4), 77.0 + j * 0.12, 0.12)

# voice: the source's audio up to the cut
r = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-t', str(CUT), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True)
vo = np.frombuffer(r.stdout, np.float32).astype(np.float64)
voice = np.zeros(N); voice[: len(vo)] = vo[:N]
voice[int((CUT - 0.3) * SR): int(CUT * SR)] *= np.linspace(1, 0, int(CUT * SR) - int((CUT - 0.3) * SR))
# duck the music under the voice
e = lp(np.abs(voice), 0.0015); e /= e.max() + 1e-9
duck = 1 - 0.55 * np.clip(e * 4, 0, 1)
mix = voice / (np.abs(voice).max() + 1e-9) * 0.8 + mus * 0.22 * duck + fx * 0.35
mix = np.tanh(mix * 1.1) / 1.1
mix /= np.abs(mix).max() + 1e-9; mix *= 0.89
pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), '-ac', '2', sys.argv[2]], input=pcm.tobytes(), check=True)
print('->', sys.argv[2])
