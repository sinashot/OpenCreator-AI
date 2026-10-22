# Synthesised music bed + SFX for the reel (no third-party audio).
import numpy as np, wave, sys
SR = 44100
DUR = 64.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)

def env(a, b, fade=1.0):
    e = np.clip((t - a) / fade, 0, 1) * np.clip((b - t) / fade, 0, 1)
    return e

def tone(f, a, d, amp=1.0, decay=6.0, kind='sine'):
    out = np.zeros(N); i0 = int(a * SR); n = int(d * SR)
    tt = np.arange(n) / SR
    w = np.sin(2 * np.pi * f * tt) if kind == 'sine' else np.sign(np.sin(2 * np.pi * f * tt)) * 0.4
    e = np.exp(-decay * tt) * np.clip(tt / 0.004, 0, 1)
    seg = w * e * amp
    out[i0:i0 + n] += seg[: max(0, min(n, N - i0))]
    return out

# pad: D minor, slow breathing
pad = np.zeros(N)
for f, g in [(73.42, 0.5), (110.0, 0.35), (174.61, 0.22), (220.0, 0.16), (293.66, 0.08)]:
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t + f)
    pad += g * lfo * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.003 * t))
pad *= env(0, 62.5, 2.0)
# tension layer (minor second) during crash/shock and warning
ten = 0.25 * (np.sin(2 * np.pi * 77.78 * t) + np.sin(2 * np.pi * 155.56 * t * 1.001))
ten *= np.clip(env(24.5, 35.0, 0.6) + env(46.2, 53.6, 0.6), 0, 1)
# soft pulse on the "steady" passages
pulse = np.zeros(N)
for k in np.arange(8.5, 60.0, 1.0):
    if 24.4 < k < 35.2 or 46.0 < k < 53.6:
        continue
    pulse += tone(55.0, k, 0.5, 0.35, 8)
music = pad * 0.22 + ten * 0.12 + pulse * 0.5

sfx = np.zeros(N)
def whoosh(a, d=0.55, amp=0.5):
    global sfx
    i0 = int(a * SR); n = int(d * SR)
    nz = rng.standard_normal(n)
    tt = np.linspace(0, 1, n)
    k = 0.02 + 0.25 * np.sin(np.pi * tt) ** 2
    y = np.empty(n); acc = 0
    for i in range(n):
        acc += k[i] * (nz[i] - acc); y[i] = acc
    y *= np.sin(np.pi * tt) ** 2 * amp * 2.2
    sfx[i0:i0 + n] += y[: N - i0]
def hit(a, amp=1.0):
    global sfx
    i0 = int(a * SR); n = int(0.9 * SR); tt = np.arange(n) / SR
    f = 120 * np.exp(-tt * 9) + 42
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-tt * 4.5) + 0.25 * rng.standard_normal(n) * np.exp(-tt * 30)
    sfx[i0:i0 + n] += amp * y[: N - i0]
def blip(a, f, amp=0.25, d=0.18):
    global sfx
    sfx += tone(f, a, d, amp, 22) + tone(f * 2, a, d, amp * 0.3, 30)
def glitch(a, d=1.2):
    global sfx
    i0 = int(a * SR); n = int(d * SR)
    y = np.zeros(n)
    for j in range(14):
        s = int(rng.uniform(0, n - 3000)); L = int(rng.uniform(600, 3000))
        y[s:s + L] += np.sign(np.sin(2 * np.pi * rng.uniform(200, 1400) * np.arange(L) / SR)) * 0.18
    sfx[i0:i0 + n] += y[: N - i0]

blip(1.2, 660, 0.22)                    # «یا نه؟»
blip(2.55, 880, 0.12); blip(3.65, 988, 0.12)  # checks
hit(5.85, 0.55)                          # stamp
whoosh(8.25, 0.9, 0.4)                   # capsule flies into the pan
for d in range(2, 15):                   # day ticks
    tk = 12.6 + (17.4 - 12.6) * (d - 1) / 13
    blip(tk, 1500, 0.05, 0.05)
blip(17.75, 784, 0.18); blip(17.9, 1175, 0.14)  # stable
hit(24.52, 1.0); whoosh(24.55, 0.7, 0.45)        # sudden stop
whoosh(27.9, 0.7, 0.5); glitch(28.3)             # zoom into the nerves
for k, a in enumerate([30.75, 31.65, 32.35]):
    blip(a, 330 - 40 * k, 0.2, 0.25)
whoosh(34.85, 0.55); whoosh(41.8, 0.55)
for k, a in enumerate([36.95, 37.6, 38.25, 38.9]):
    blip(a + 0.4, 784 / (1.12 ** k), 0.18)        # hops, falling pitch
blip(40.1, 587, 0.15); blip(40.25, 880, 0.12)
for k in range(6):
    blip(43.75 + k * 0.2, 1046 + 120 * k, 0.07, 0.12)   # natural production
whoosh(46.0, 0.6, 0.35)
blip(46.4, 466, 0.2, 0.4); blip(46.75, 440, 0.2, 0.4)  # warning
blip(51.25, 330, 0.25, 0.3)                             # drop
whoosh(53.45, 0.55)
blip(58.6, 1318, 0.14, 0.6); blip(58.6, 1975, 0.07, 0.6)  # doctor
whoosh(60.3, 0.7, 0.35)
for k, f in enumerate([587, 740, 880, 1175]):
    blip(60.6 + k * 0.12, f, 0.12, 0.9)                 # end chime

def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    st = np.stack([x, x], 1)
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
save(sys.argv[1] + '/music.wav', music)
save(sys.argv[1] + '/sfx.wav', sfx)
