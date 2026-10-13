#!/usr/bin/env python3
"""Lab Pulse: an original 120 BPM corporate/science underscore for the FMD vaccine reel.

Modern and clean (no traditional instruments): warm detuned pads, a plucked synth
arpeggio, glassy bell motif, sub bass and light electronic percussion. Same bar grid as
the edit (1 bar = 2 s, 48 bars = 96 s), so every whip pan still lands on a downbeat.
It sits under a voice-over, so the mid range (1-4 kHz) is kept light.

usage: python3 compose_lab_pulse.py OUT.wav      (needs numpy)
"""
import sys
import wave

import numpy as np

SR = 48000
BEAT = 0.5
BAR = 2.0
STEP = BEAT / 4
BARS = 48
N = int(BARS * BAR * SR)
rng = np.random.default_rng(7)

# bar map (1-indexed, end exclusive) — matches src/Reel.tsx
INTRO = range(1, 6)      # 0-10 s hook
GRID = range(6, 9)       # 10-16 s six criteria
MAIN = range(9, 29)      # 16-56 s criteria 1-4
BREAK = range(29, 34)    # 56-66 s criterion 5 (lighter)
MAIN2 = range(34, 44)    # 66-86 s criterion 6 + verdict
OUTRO = range(44, 49)    # 86-96 s end card
HIT = 47                 # final hit at 92 s
WHIP_BARS = (6, 9, 14, 19, 24, 29, 34, 39, 44)


def t_bar(b):
    return (b - 1) * BAR


def at(b, step=0):
    return t_bar(b) + step * STEP


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def place(buf, x, t, gain=1.0):
    i = int(round(t * SR))
    if i >= len(buf):
        return
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i] * gain


def lp(x, hi, lo=None):
    n = len(x)
    size = 1 << int(np.ceil(np.log2(max(2, n))))
    X = np.fft.rfft(x, size)
    f = np.fft.rfftfreq(size, 1 / SR)
    g = 1 / np.sqrt(1 + (f / hi) ** 4)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(X * g, size)[:n]


def env_adsr(n, a=0.005, d=0.1, s=0.6, r=0.2):
    t = np.arange(n) / SR
    dur = n / SR
    e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / d))
    rel = np.clip((dur - t) / r, 0, 1)
    return e * rel


# ---------------------------------------------------------------- instruments
def saw(f, n, det=0.0):
    t = np.arange(n) / SR
    ff = f * 2 ** (det / 1200)
    x = np.zeros(n)
    for k in range(1, int(8000 // ff) + 1):
        x += np.sin(2 * np.pi * k * ff * t + rng.uniform(0, 6.28)) / k
    return x


def pad(notes, dur, cutoff=1500):
    n = int(dur * SR)
    L = np.zeros(n)
    R = np.zeros(n)
    for m in notes:
        f = midi(m)
        L += saw(f, n, -8) + 0.5 * saw(f, n, +4)
        R += saw(f, n, +8) + 0.5 * saw(f, n, -4)
    t = np.arange(n) / SR
    e = np.minimum(1, t / 0.6) * np.minimum(1, (dur - t) / 0.6)
    return lp(L, cutoff) * e * 0.06, lp(R, cutoff) * e * 0.06


def pluck(m, vel=1.0, dur=0.45, bright=2600):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = midi(m)
    x = saw(f, n) * 0.6 + np.sin(2 * np.pi * f * t) * 0.6
    x = lp(x, bright)
    return x * np.exp(-t / 0.13) * np.minimum(1, t / 0.002) * vel * 0.35


def bell(m, vel=1.0, dur=2.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = midi(m)
    x = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.25)
         + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.08))
    return x * np.exp(-t / 0.7) * np.minimum(1, t / 0.002) * vel * 0.22


def sub(m, dur=0.45, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = midi(m)
    x = np.sin(2 * np.pi * f * t) + 0.2 * np.sin(4 * np.pi * f * t)
    return x * env_adsr(n, 0.004, 0.12, 0.7, 0.08) * vel * 0.5


def kick(vel=1.0):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 48 + 90 * np.exp(-t / 0.03)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.18)
    return np.tanh(1.4 * x) * vel * 0.8


def hat(vel=1.0, open_=False):
    n = int((0.25 if open_ else 0.05) * SR)
    t = np.arange(n) / SR
    x = lp(rng.standard_normal(n), 14000, lo=8000)
    return x * np.exp(-t / (0.08 if open_ else 0.012)) * vel * 0.18


def snap(vel=1.0):
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    x = lp(rng.standard_normal(n), 6000, lo=1500)
    return x * np.exp(-t / 0.05) * vel * 0.25


def whoosh(dur=0.9, peak=0.6):
    n = int(dur * SR)
    t = np.arange(n) / n
    e = np.where(t < peak, (t / peak) ** 2.5, ((1 - t) / (1 - peak)) ** 1.6)
    lo_part = lp(rng.standard_normal(n), 1800, lo=300)
    hi_part = lp(rng.standard_normal(n), 7000, lo=2500)
    mixw = np.clip(t / peak, 0, 1)
    return (lo_part * (1 - mixw) + hi_part * mixw) * e * 0.35


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / n
    x = lp(rng.standard_normal(n), 9000, lo=2000) * t ** 2.5 * 0.25
    tone = np.sin(2 * np.pi * np.cumsum(200 * 2 ** (t * 2.5)) / SR) * t ** 2 * 0.06
    return x + tone


def impact():
    n = int(3.0 * SR)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(40 + 50 * np.exp(-t / 0.05)) / SR) * np.exp(-t / 0.8)
    shimmer = lp(rng.standard_normal(n), 12000, lo=5000) * np.exp(-t / 0.9) * 0.15
    return boom * 0.8 + shimmer


# ---------------------------------------------------------------- score
# A minor, hopeful: Am - F - C - G (i - VI - III - VII)
PROG = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 60, 64, 67], [55, 59, 62, 67]]
ROOTS = [45, 41, 48, 43]
ARP = [0, 1, 2, 3, 2, 1, 2, 3]   # indices into the chord, 8ths
BELL_MOTIF = [(0, 76), (6, 72), (8, 74), (12, 71)]   # (16th step, midi)


def compose():
    L = np.zeros(N)
    R = np.zeros(N)
    drums = np.zeros(N)
    bass = np.zeros(N)
    kicks = []

    for b in range(1, HIT):
        ch = PROG[(b - 1) % 4]
        root = ROOTS[(b - 1) % 4]
        in_main = b in MAIN or b in MAIN2
        # pads every bar, brighter as the piece opens
        cut = 900 if b in INTRO else (2200 if b in BREAK else 1500)
        pl, pr = pad(ch, BAR + 0.6, cut)
        g = 0.9 if b in BREAK else 0.7
        place(L, pl, t_bar(b), g)
        place(R, pr, t_bar(b), g)
        # arpeggio pluck in 8ths, ping-ponged
        if b >= 3 and b not in OUTRO or b in (44, 45):
            for i, idx in enumerate(ARP):
                m = ch[idx] + 12
                v = (0.45 if b in INTRO else 0.7) * (1.0 if i % 2 == 0 else 0.75)
                x = pluck(m, v, bright=1800 if b in INTRO else 2600)
                pan = 0.3 + 0.4 * (i % 2)
                place(L, x, at(b, i * 2), 1 - pan)
                place(R, x, at(b, i * 2), pan)
        # bell motif every other bar in the main parts and the breakdown
        if (in_main or b in BREAK or b in GRID) and b % 2 == 1:
            for step, m in BELL_MOTIF:
                x = bell(m, 0.8)
                place(L, x, at(b, step), 0.8)
                place(R, x, at(b, step), 1.0)
        # sub bass on 8ths (root), from the grid onward
        if b >= 6 and b not in BREAK and b < 46:
            for i in range(8):
                v = 1.0 if i % 2 == 0 else 0.6
                place(bass, sub(root, 0.24, v), at(b, i * 2))
        # drums: soft four-on-the-floor in main sections, half-time in grid
        if in_main or b in GRID or b in (44, 45):
            for k in range(4):
                if b in GRID and k % 2 == 1:
                    continue
                place(drums, kick(0.9), at(b, k * 4))
                kicks.append(at(b, k * 4))
            for k in range(4):
                place(drums, hat(0.8), at(b, k * 4 + 2))
                if in_main:
                    place(drums, hat(0.35), at(b, k * 4 + 3))
            if in_main:
                place(drums, snap(0.8), at(b, 4))
                place(drums, snap(0.8), at(b, 12))
            if b % 4 == 0:
                place(drums, hat(0.6, open_=True), at(b, 14))
        if b in BREAK:
            for k in range(4):
                place(drums, hat(0.4), at(b, k * 4 + 2))

    # transitions
    for b in WHIP_BARS:
        place(drums, whoosh(), t_bar(b) - 0.54, 0.9)
    for b in (5, 8, 28, 33, 46):
        place(drums, riser(BAR), t_bar(b), 0.7)
    for b in (9, 34):
        place(drums, impact(), t_bar(b), 0.35)
    place(drums, impact(), t_bar(HIT), 0.8)
    for m in (57, 64, 69, 76):   # final A-minor-add bell chord on the hit
        x = bell(m, 0.9, 4.0)
        place(L, x, t_bar(HIT))
        place(R, x, t_bar(HIT))
    pl, pr = pad([57, 60, 64, 71], 4.0, 1800)
    place(L, pl, t_bar(HIT), 0.9)
    place(R, pr, t_bar(HIT), 0.9)

    # sidechain pumping on pads/bass
    duck = np.ones(N)
    dn = int(0.3 * SR)
    shape = 1 - 0.55 * np.exp(-np.arange(dn) / SR / 0.08)
    for kt in kicks:
        i = int(kt * SR)
        j = min(N, i + dn)
        duck[i:j] = np.minimum(duck[i:j], shape[: j - i])
    L *= duck
    R *= duck
    bass *= duck ** 0.5

    outL = L + bass + drums
    outR = R + bass + drums
    # gentle dip at 1-4 kHz to leave room for the voice
    def carve(x):
        mid = lp(x, 4000, lo=1000)
        return x - 0.35 * mid
    outL, outR = carve(outL), carve(outR)
    # fade tail
    tail = np.ones(N)
    a = int(94.0 * SR)
    tail[a:] = np.linspace(1, 0, N - a)
    st = np.stack([outL * tail, outR * tail], axis=1)
    st = np.tanh(st / (np.abs(st).max() + 1e-9) * 1.3) * 0.85
    return st


def main():
    out = sys.argv[1]
    st = compose()
    pcm = (np.clip(st, -1, 1) * 32767).astype(np.int16)
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", out)


if __name__ == "__main__":
    main()
