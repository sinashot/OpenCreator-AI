# Sound design for the bird-flu film: a dread drone, heartbeats, alarms, impacts and drips under the voice-over.
#   python3 sound.py <voice source video> <out.wav>
import json, subprocess, sys
import numpy as np
SR = 48000
cue = json.load(open('cues.json'))
CUT, DUR = cue['cut'], cue['dur']
N = int(DUR * SR); T = np.arange(N) / SR
rng = np.random.default_rng(8)

def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)
def add(buf, x, at, g=1.0):
    i = int(at * SR); j = min(len(buf), i + len(x))
    if 0 <= i < len(buf): buf[i:j] += x[: j - i] * g
def lp(x, a):
    y = np.empty_like(x); s = 0.0; a = np.broadcast_to(a, x.shape)
    for i, v in enumerate(x): s += a[i] * (v - s); y[i] = s
    return y

mus = np.zeros(N); fx = np.zeros(N)
# dread: a detuned low cluster (A, B-flat, E-flat) swelling and breathing, plus a high glassy whine
for f, g in [(55, 1), (58.27, 0.8), (77.78, 0.6), (110, 0.5), (116.5, 0.4)]:
    mus += g * np.sin(2 * np.pi * f * T + np.sin(2 * np.pi * 0.07 * f / 55 * T) * 2)
mus *= (0.55 + 0.45 * np.sin(2 * np.pi * 0.05 * T)) * 0.18
mus += 0.03 * np.sin(2 * np.pi * 1760 * T + 3 * np.sin(2 * np.pi * 0.3 * T)) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * T))
noise = lp(rng.standard_normal(N), 0.01) * 0.6
mus += noise
# a slow pulse from the explanation on, faster in the burst
B = 60 / 84
k = 8.0
while k < CUT:
    m = int(0.5 * SR); x = np.arange(m) / SR
    add(mus, np.sin(2 * np.pi * (42 + 60 * np.exp(-x / 0.04)) * x) * env(m, 0.002, 0.22), k, 0.5)
    k += B / 2 if cue['scenes'][6] <= k < cue['scenes'][7] else B
mus[int(CUT * SR):] *= np.linspace(1, 0, N - int(CUT * SR)) ** 2
# heartbeats
for a, b in cue['heart']:
    k = a
    while k < b:
        for o, g in [(0, 1), (0.16, 0.65)]:
            m = int(0.25 * SR); x = np.arange(m) / SR
            add(fx, np.sin(2 * np.pi * (48 + 20 * np.exp(-x / 0.03)) * x) * env(m, 0.004, 0.07), k + o, 1.1 * g)
        k += 0.78
# impacts
for s in cue['slams']:
    m = int(1.6 * SR); x = np.arange(m) / SR
    boom = np.sin(2 * np.pi * (32 + 80 * np.exp(-x / 0.05)) * x) * env(m, 0.001, 0.6)
    crack = lp(rng.standard_normal(m), 0.35) * env(m, 0.0005, 0.05)
    tail = lp(rng.standard_normal(m), 0.02) * env(m, 0.05, 0.5) * 2
    add(fx, boom + crack * 0.5 + tail * 0.4, s, 0.8)
# whooshes into scenes
for s in cue['scenes']:
    m = int(0.6 * SR); x = np.arange(m) / SR
    add(fx, lp(rng.standard_normal(m), 0.06) * np.sin(np.pi * x / 0.6) ** 2 * 1.4, s - 0.45, 0.6)
# ticks on the tags
for s in cue['pops']:
    m = int(0.09 * SR); x = np.arange(m) / SR
    add(fx, np.sin(2 * np.pi * 1900 * x) * env(m, 0.0005, 0.02), s, 0.18)
# alarm on "infected", "disaster", "explosive"
for s in cue['alarm']:
    m = int(1.2 * SR); x = np.arange(m) / SR
    add(fx, np.sign(np.sin(2 * np.pi * (700 + 250 * np.sign(np.sin(2 * np.pi * 4 * x))) * x)) * np.minimum(1, (1.2 - x) / 0.3) * 0.25, s, 0.25)
# the dive: a rushing wind that rises
a, b = cue['dive']; m = int((b - a) * SR); x = np.arange(m) / SR
w = lp(rng.standard_normal(m), 0.03 + 0.1 * x / x[-1]) * np.minimum(1, x / 0.5) * np.minimum(1, (x[-1] - x) / 0.4) * 1.6
add(fx, w, a, 0.6)
# the counter: accelerating ticks
a, b = cue['count']; k = a
while k < b:
    m = int(0.04 * SR); add(fx, np.sin(2 * np.pi * 2600 * np.arange(m) / SR) * env(m, 0.0005, 0.008), k, 0.2)
    k += max(0.03, 0.2 * (1 - (k - a) / (b - a)))
# drips into the milk
a, b = cue['drips']
for i in range(40):
    s = a + (b - a) * i / 40 + rng.random() * 0.2
    m = int(0.2 * SR); x = np.arange(m) / SR
    add(fx, np.sin(2 * np.pi * (900 + 1400 * x / 0.2) * x) * env(m, 0.001, 0.04), s, 0.12)

r = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-t', str(CUT), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True)
vo = np.frombuffer(r.stdout, np.float32).astype(np.float64)
voice = np.zeros(N); voice[: len(vo)] = vo[:N]
i0 = int((CUT - 0.3) * SR); voice[i0:int(CUT * SR)] *= np.linspace(1, 0, int(CUT * SR) - i0)
e = lp(np.abs(voice), 0.0015); e /= e.max() + 1e-9
duck = 1 - 0.5 * np.clip(e * 4, 0, 1)
mix = voice / (np.abs(voice).max() + 1e-9) * 0.8 + mus * 0.45 * duck + fx * 0.32
mix = np.tanh(mix * 1.1) / 1.1; mix /= np.abs(mix).max() + 1e-9; mix *= 0.89
pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), '-ac', '2', sys.argv[2]], input=pcm.tobytes(), check=True)
print('->', sys.argv[2])
