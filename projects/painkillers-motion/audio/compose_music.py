#!/usr/bin/env python3
"""Original background track + SFX for the painkillers reel, written in code.

100 BPM, A minor (i - VI - III - VII). The edit is laid out on this grid:
beat = 0.6 s, bar = 2.4 s. Section starts (from timeline.json, always on a beat) get a riser in
the bar before and a soft sub hit on the downbeat; whooshes and pops are placed
at the times the timeline lists, so their attacks land on the visual hits.

usage: python3 compose_music.py timeline.json OUT_DIR
Writes music.wav and sfx.wav (48 kHz stereo). Needs only numpy.
"""
import json
import os
import sys
import wave

import numpy as np

SR = 48000
BPM = 100
BEAT = 60.0 / BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)

tl = json.load(open(sys.argv[1]))
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
TOTAL = tl["duration"] + 2.0
N = int(TOTAL * SR)
BARS = int(np.ceil(TOTAL / BAR))
calm_bars = set()  # bars without drums: intro and the last bar
calm_bars.update({0, 1})
end_bar = int(tl["ctaStart"] / BAR)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def env_adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    t = np.arange(n) / SR
    dur = n / SR
    e = np.where(t < a, t / a, np.where(t < a + d, 1 - (1 - s) * (t - a) / d, s))
    rel = np.clip((dur - t) / r, 0, 1)
    return e * rel


def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i in range(len(x)):  # small buffers only
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def lp_fft(x, fc, order=2):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X /= np.sqrt(1 + (f / fc) ** (2 * order))
    return np.fft.irfft(X, len(x))


def hp_fft(x, fc, order=2):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    f[0] = 1e-3
    X /= np.sqrt(1 + (fc / f) ** (2 * order))
    return np.fft.irfft(X, len(x))


def put(buf, sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(sig) <= 0:
        return
    j = min(len(buf), i + len(sig))
    s = sig[: j - i] * gain
    buf[i:j, 0] += s * np.sqrt(0.5 * (1 - pan))
    buf[i:j, 1] += s * np.sqrt(0.5 * (1 + pan))


# A minor: Am, F, C, G (one chord per bar)
CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
ROOTS = [45, 41, 48, 43]

music = np.zeros((N, 2))

# ---- pad: detuned saws, soft attack, darkened
for b in range(BARS):
    ch = CHORDS[b % 4]
    n = int(BAR * SR * 1.05)
    t = np.arange(n) / SR
    sig = np.zeros(n)
    for m in ch + [ch[0] + 12]:
        for det in (-0.08, 0.08):
            f = hz(m + det)
            sig += 2 * ((t * f) % 1) - 1
    sig = lp_fft(sig, 900 if b in calm_bars else 1400) * env_adsr(n, 0.5, 0.3, 0.8, 0.6) * 0.035
    put(music, sig, b * BAR, 1.0, -0.2)
    put(music, sig, b * BAR + 0.011, 1.0, 0.2)

# ---- drums and bass
def kick():
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 45 + 80 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def clap():
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    s = rng.standard_normal(n)
    s = hp_fft(lp_fft(s, 3000), 900)
    return s * np.exp(-t * 22) * 0.6


def hat():
    n = int(0.06 * SR)
    t = np.arange(n) / SR
    return hp_fft(rng.standard_normal(n), 7000) * np.exp(-t * 70)


def bass(m, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    s = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)
    return np.tanh(1.5 * s) * env_adsr(n, 0.005, 0.1, 0.8, 0.08)


K, C, H = kick(), clap(), hat()
for b in range(BARS):
    t0 = b * BAR
    if b in calm_bars or b >= end_bar + 4:
        continue
    for beat in range(4):
        tb = t0 + beat * BEAT
        if beat in (0, 2):
            put(music, K, tb, 0.42)
        if beat in (1, 3):
            put(music, C, tb, 0.10, 0.1)
        for half in (0, 0.5):
            put(music, H, tb + half * BEAT, 0.035 if half else 0.05, -0.3)
    r = ROOTS[b % 4]
    for pos, dur in ((0, 1.4), (1.5, 0.45), (2, 1.4), (3.5, 0.45)):
        put(music, bass(r, dur * BEAT), t0 + pos * BEAT, 0.11)

# ---- pluck arpeggio (Karplus-Strong), quiet, every bar after the intro
def pluck(m, dur=0.6):
    f = hz(m)
    n = int(dur * SR)
    p = int(SR / f)
    buf = rng.uniform(-1, 1, p)
    out = np.empty(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.996 * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return out


cache = {}
for b in range(2, BARS):
    if b >= end_bar + 5:
        break
    ch = CHORDS[b % 4]
    notes = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12]
    for s in range(8):
        if s in (3, 7) and b % 2:
            continue
        m = notes[s % 4] + (12 if s == 6 else 0)
        if m not in cache:
            cache[m] = pluck(m)
        put(music, cache[m], b * BAR + s * BEAT / 2, 0.05, 0.35 if s % 2 else -0.35)

# ---- section accents: riser into each section, soft sub hit on the downbeat
sfx = np.zeros((N, 2))
for t in tl["sectionStarts"]:
    if t < BAR:
        continue
    n = int(BAR * SR)
    tt = np.arange(n) / SR
    noise = hp_fft(rng.standard_normal(n), 1500) * (tt / BAR) ** 3 * 0.05
    put(music, noise, t - BAR, 1.0)
    m = int(0.9 * SR)
    t2 = np.arange(m) / SR
    sub = np.sin(2 * np.pi * (38 + 40 * np.exp(-t2 * 12)) * t2) * np.exp(-t2 * 4)
    put(music, sub, t, 0.35)

# ---- reverb on the music bus
ir_n = int(1.6 * SR)
ir_t = np.arange(ir_n) / SR
for c in range(2):
    ir = rng.standard_normal(ir_n) * np.exp(-ir_t * 3.2)
    ir = lp_fft(ir, 4000) * 0.02
    L = len(music) + ir_n
    nfft = 1 << (L - 1).bit_length()
    wet = np.fft.irfft(np.fft.rfft(music[:, c], nfft) * np.fft.rfft(ir, nfft), nfft)[: len(music)]
    music[:, c] += wet * 0.6

# fade out at the end
fade = int(2.0 * SR)
music[-fade:] *= np.linspace(1, 0, fade)[:, None]

# ---- SFX: whoosh peaking on each camera move, pops on element hits
def whoosh(dur=0.7):
    n = int(dur * SR)
    t = np.arange(n) / SR
    env = np.sin(np.pi * t / dur) ** 2
    s = rng.standard_normal(n)
    lo = lp_fft(s, 2500)
    return hp_fft(lo, 300) * env * 0.35


def pop():
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    f = 900 * np.exp(-t * 25) + 300
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) * 0.3


W, P = whoosh(), pop()
for t in tl.get("whooshes", []):
    put(sfx, W, t - 0.35, 1.0)
for t in tl.get("pops", []):
    put(sfx, P, t, 0.7, float(rng.uniform(-0.3, 0.3)))


def write(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


music /= max(1e-6, np.abs(music).max()) / 0.8
write(os.path.join(OUT, "music.wav"), music)
write(os.path.join(OUT, "sfx.wav"), sfx)
print("bars", BARS)
