# /// script
# requires-python = ">=3.10"
# dependencies = ["librosa>=0.10", "numpy", "scipy", "soundfile"]
# ///
"""The score for Sina x Claude: 120 BPM, written on the voice cue sheet (cues.json).

    MOTION_REEL_SKILL=<skill> uv run sina-x-claude/audio/score.py

Sections follow the dialogue: intro (the question) | groove (the ten-jobs rant, cut dead when the
clones crash) | complaints (D minor, busy) | Hiro (a reverent swell) | the deadpan (silence +
crickets) | whisper (tiptoe pizzicato) | praise (F major, warm) | coda (the photo, the toast) |
the faint (sad trombone) | end button. Section starts are snapped to the beat grid.
Also writes the custom effects the palette lacks: record scratch, crickets, buzzer, steam, claps.
Writes audio/music.wav and beats.json (the grid is exact: the score is built on it).
"""
import json
import os
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

sys.path.insert(0, str(Path(os.environ.get("MOTION_REEL_SKILL", ".")) / "scripts"))
from dsp import *  # noqa: E402,F401

HERE = Path(__file__).resolve().parent
FILM = HERE.parent
BPM = 120
B = 60 / BPM
seed(7)

CUES = json.loads((FILM / "cues.json").read_text())
DUR = CUES["duration"]
LN = CUES["lines"]


def T(i, o=0.0):
    return LN[i]["t0"] + o


def TE(i, o=0.0):
    return LN[i]["t1"] + o


def Wd(i, k, o=0.0):
    w = LN[i]["words"]
    return (w[k] if k < len(w) else LN[i]["t1"]) + o


def beat(sec):
    """seconds -> beats (free)"""
    return sec / B


def snap(sec):
    """seconds -> the nearest whole beat"""
    return float(round(sec / B))


FAINT = Wd("new", 4, 0.2)
RANT_OUT = Wd("job", 6)

mus = Bus(DUR, BPM)     # music
fx = Bus(DUR, BPM)      # custom effects (mixed into the music stem, they sit on the picture)


def bell(note, length=1.2, bright=1.0):
    n = int(length * SR)
    t = tvec(n)
    f = hz(note)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.15) * bright
    return x * np.exp(-t / (length * 0.35)) * (1 - np.exp(-t / 0.002))


def up(note):
    """the same note an octave higher: 'D2' -> 'D3'"""
    return note[:-1] + str(int(note[-1]) + 1)


def pizz(note, length=0.35):
    return ks_pluck(hz(note), length=length, bright=0.45, buzz=0.0)


def tuba(note, length):
    n = int(length * SR)
    t = tvec(n)
    f = hz(note)
    x = saw(f, n) * 0.7 + np.sin(2 * np.pi * f * t) * 0.6
    x = sweep_filter(x, 200 + 900 * np.exp(-t / 0.08), "lowpass", 1.2)
    return np.tanh(1.4 * x) * adsr(n, 0.01, 0.1, 0.6, 0.05)


def wah(note, to_note, length, wobble=5.0):
    """a muted trombone: saw through a wobbling low-pass, pitch sliding down"""
    n = int(length * SR)
    t = tvec(n)
    f = hz(note) * (hz(to_note) / hz(note)) ** (t / length)
    ph = np.cumsum(f) / SR
    x = 2 * (ph % 1) - 1
    cut = 500 + 1400 * (0.5 + 0.5 * np.sin(2 * np.pi * wobble * t - np.pi / 2))
    x = sweep_filter(x, cut, "lowpass", 2.0)
    return np.tanh(1.6 * x) * adsr(n, 0.03, 0.1, 0.85, 0.12) * (1 + 0.04 * np.sin(2 * np.pi * 5.5 * t))


CH = {  # chord tones
    "F": ["F3", "A3", "C4"], "C": ["C3", "E3", "G3"], "Dm": ["D3", "F3", "A3"], "Bb": ["Bb2", "D3", "F3"],
    "Gm": ["G2", "Bb2", "D3"], "A": ["A2", "C#3", "E3"], "Am": ["A2", "C3", "E3"],
}
ROOT = {"F": "F2", "C": "C2", "Dm": "D2", "Bb": "Bb1", "Gm": "G1", "A": "A1", "Am": "A1"}

# ---------------------------------------------------------------- intro: the question
motif = ["C5", "F5", "A5", "G5", "F5", "C5", "D5", "C5"]
G0 = snap(Wd("ten", 7, -0.3))            # the groove lands with the ten Sinas
for i, nt in enumerate(motif * 2):
    if 1 + i * 0.75 < G0:
        mus.add(pizz(nt, 0.4), 1 + i * 0.75, 0.5, pan=0.2 * ((i % 2) * 2 - 1))
for b in range(4, int(G0), 2):
    mus.add(kick(soft=True), b, 0.45)
for b in range(0, int(G0)):
    mus.add(hat(), b + 0.5, 0.12, pan=0.3)
for bar in range(int(np.ceil(G0 / 4))):
    mus.add(pad_chord(CH[["F", "C", "Dm", "Bb"][bar % 4]], min(4, G0 - bar * 4) * B, 1600), bar * 4, 0.12)

# ---------------------------------------------------------------- groove: the rant, cut dead when the clones crash
prog_g = ["F", "C", "Dm", "Bb"]
mel = ["A5", "G5", "F5", "C5", "D5", "F5", "G5", "A5", "C6", "A5", "G5", "F5", "D5", "C5", "D5", "F5"]
G1 = beat(Wd("job", 6, -0.15))
for bar in range(int(np.ceil((G1 - G0) / 4))):
    b0 = G0 + bar * 4
    c = prog_g[bar % 4]
    for k in range(4):
        if b0 + k >= G1:
            break
        mus.add(kick(), b0 + k, 0.55 if k % 2 == 0 else 0.35)
        if k % 2 == 1:
            mus.add(clap(tight=True), b0 + k, 0.28, pan=-0.1)
        mus.add(hat(), b0 + k + 0.5, 0.14, pan=0.35)
        mus.add(hat(), b0 + k + 0.25, 0.07, pan=-0.35)      # a frantic sixteenth: ten jobs at once
    for k in range(8):
        if b0 + k * 0.5 < G1:
            mus.add(bass_note(up(ROOT[c]) if k % 4 == 3 else ROOT[c], B * 0.45), b0 + k * 0.5, 0.42)
    mus.add(pad_chord(CH[c], min(4, G1 - b0) * B, 1400), b0, 0.09)
    if bar % 2 == 0:
        for k in range(8):
            if b0 + k * 0.5 < G1:
                mus.add(pizz(mel[(bar * 4 + k) % len(mel)], 0.3), b0 + k * 0.5, 0.33, pan=0.25)
# the crash: a falling tuba, then only the "?" ticks until the first complaint
mus.add(tuba("D2", 0.6), G1, 0.5)
mus.add(sub_drop(0.8, 70, 35), G1, 0.35)

# ---------------------------------------------------------------- complaints (D minor, busy)
b_c0, b_c1 = snap(T("refs", -0.4)), snap(T("hiro", -0.45))
prog_c = ["Dm", "Dm", "Bb", "A"]
for bar in range(int((b_c1 - b_c0) // 4) + 1):
    b0 = b_c0 + bar * 4
    if b0 >= b_c1:
        break
    c = prog_c[bar % 4]
    for k in range(4):
        if b0 + k >= b_c1:
            break
        mus.add(kick(), b0 + k, 0.6)
        if k % 2 == 1:
            mus.add(clap(), b0 + k, 0.32)
    for k in range(16):
        if b0 + k * 0.25 < b_c1:
            mus.add(hat(), b0 + k * 0.25, 0.09 + 0.05 * (k % 2 == 0), pan=0.3)
    for k in range(8):
        if b0 + k * 0.5 < b_c1:
            mus.add(tuba(up(ROOT[c]) if k % 2 else ROOT[c], B * 0.4), b0 + k * 0.5, 0.36)
    # stabs on the off-beats: comedy tension
    for k in (1.5, 3.5):
        if b0 + k < b_c1:
            mus.add(pluck(CH[c], 0.18, 2600), b0 + k, 0.35, pan=-0.2)
# cheeky chromatic runs that land on the cards and on the rules
for i, nt in enumerate(["D5", "E5", "F5", "F#5", "G5", "G#5", "A5"]):
    mus.add(pizz(nt, 0.2), beat(Wd("refs", 4, -0.05)) - 1.75 + i * 0.25, 0.3)
for i, nt in enumerate(["A5", "G5", "F5", "E5", "D5", "C#5", "D5"]):
    mus.add(pizz(nt, 0.2), beat(T("rules", -0.05)) - 1.75 + i * 0.25, 0.3)

# ---------------------------------------------------------------- Hiro: a reverent swell
H0, H1 = b_c1, beat(TE("hiro2", 0.1))
mus.add(pad_chord(["D3", "F3", "A3", "D4"], (H1 - H0) * B, (500, 3000), attack=0.8, release=0.6), H0, 0.35)
b = 0.1
while H0 + b < H1 - 0.5:
    mus.add(kick(soft=True), H0 + b, 0.6)
    mus.add(sub_drop(0.6, 60, 40), H0 + b, 0.25)
    b += 2
for i, nt in enumerate(["D6", "A5", "F6", "E6", "D6", "A5"]):
    if H0 + 1.6 + i * 1.6 < H1 - 0.6:
        mus.add(bell(nt, 1.6), H0 + 1.6 + i * 1.6, 0.22, pan=0.2)

# ---------------------------------------------------------------- deadpan: record scratch, then crickets
D0, D1 = TE("hiro2", 0.1), T("but", -0.1)
scr_n = int(0.32 * SR)
st = tvec(scr_n)
scr = sweep_filter(rng.standard_normal(scr_n), 300 + 2500 * np.abs(np.sin(2 * np.pi * 4.5 * st)), "bandpass", 3.0)
fx.add(scr * np.exp(-st / 0.2) * 1.4, 0, 0.55, at=D0 - 0.02)
def cricket():
    n = int(0.16 * SR)
    t = tvec(n)
    return np.sin(2 * np.pi * 4300 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 45 * t))) * np.exp(-t / 0.08)
for f in (0.28, 0.45, 0.7, 0.86):
    fx.add(cricket(), 0, 0.16, pan=0.5, at=D0 + f * (D1 - D0))

# ---------------------------------------------------------------- whisper: tiptoe
tip = ["D4", "F4", "A4", "F4", "E4", "G4", "Bb4", "G4", "D4", "F4", "A4", "D5"]
W0, W1 = beat(D1), beat(T("eye", -0.5))
for i, nt in enumerate(tip):
    if W0 + i * 0.75 < W1:
        mus.add(pizz(nt, 0.25), W0 + i * 0.75, 0.32, pan=-0.3 if i % 2 else 0.3)
mus.add(pad_chord(["D3", "A3", "F4"], (W1 - W0) * B + 0.3, 900, attack=0.5), W0, 0.12)
mus.add(bell("A6", 1.5), beat(Wd("psst", 3)), 0.2)

# ---------------------------------------------------------------- praise (F major, warm)
b_p0, P1 = snap(T("eye", -0.1)), snap(T("photo", -0.15))
prog_p = ["F", "C", "Dm", "Bb", "F", "C", "Bb", "C"]
mel_p = ["C6", "A5", "C6", "D6", "C6", "A5", "G5", "F5", "A5", "G5", "F5", "G5", "A5", "C6", "D6", "C6"]
for bar in range(int((P1 - b_p0) / 4) + 1):
    b0 = b_p0 + bar * 4
    if b0 >= P1:
        break
    c = prog_p[bar % len(prog_p)]
    ln = min(4, P1 - b0)
    mus.add(keys(CH[c] + [up(CH[c][0])], ln * B), b0, 0.3)
    mus.add(pad_chord(CH[c], ln * B, 2200), b0, 0.08)
    for k in range(int(np.ceil(ln))):
        mus.add(kick(soft=True), b0 + k, 0.45 if k % 2 == 0 else 0.3)
        if k % 2 == 1:
            mus.add(clap(tight=True), b0 + k, 0.2)
        mus.add(hat(), b0 + k + 0.5, 0.1, pan=0.3)
        mus.add(bass_note(ROOT[c], B * 0.9), b0 + k, 0.36)
        if bar >= 1:
            mus.add(bell(mel_p[(bar * 4 + k) % len(mel_p)], 0.9), b0 + k, 0.16, pan=0.2)

# ---------------------------------------------------------------- coda: the photo and the toast
b_e0 = P1
span = (beat(FAINT - 0.1) - b_e0) / 4            # four chords across the coda
for bar, c in enumerate(["Bb", "F", "C", "F"]):
    b0 = b_e0 + bar * span
    mus.add(keys(CH[c], span * B * 1.2), b0, 0.3)
    mus.add(pad_chord(CH[c], span * B, 1800), b0, 0.1)
    mus.add(bass_note(ROOT[c], (span - 0.5) * B), b0, 0.3)
mus.add(bell("A6", 2.0), beat(TE("tired", -0.2)), 0.2)

# ---------------------------------------------------------------- the faint: wah wah wah waaah
for i, (a, b2, ln) in enumerate([("G3", "F#3", 0.42), ("F#3", "F3", 0.42), ("F3", "E3", 0.42), ("E3", "C3", 1.3)]):
    fx.add(wah(a, b2, ln, wobble=6 if i == 3 else 3), 0, 0.42, at=FAINT + 0.05 + i * 0.45)

# ---------------------------------------------------------------- end button
END = beat(TE("new", 0.3))
tail = DUR - TE("new", 0.3)
mus.add(keys(["F3", "A3", "C4", "F4"], tail), END, 0.4)
mus.add(pad_chord(["F3", "A3", "C4"], tail, (900, 2600), attack=0.2, release=0.4), END, 0.16)
for i, nt in enumerate(["C6", "F6", "A6"]):
    mus.add(bell(nt, 1.4), END + i * 0.33, 0.22, pan=-0.2 + 0.2 * i)

# ---------------------------------------------------------------- custom effects on picture
# the glitch buzzer on "forbidden!"
bn = int(0.4 * SR); bt = tvec(bn)
buzz = np.sign(np.sin(2 * np.pi * 110 * bt)) * 0.6 + np.sign(np.sin(2 * np.pi * 116 * bt)) * 0.4
fx.add(filt(buzz, "lowpass", 2400) * adsr(bn, 0.005, 0.05, 0.9, 0.05), 0, 0.35, at=Wd("rulesRead", 1, -0.05))
# steam hiss on "I'm doomed"
s0, s1 = T("doom"), TE("doom", 0.4)
sn = int((s1 - s0) * SR); stt = tvec(sn)
hiss = sweep_filter(rng.standard_normal(sn), 2500 + 1500 * np.sin(2 * np.pi * 1.6 * stt), "bandpass", 1.5)
fx.add(hiss * np.minimum(1, stt / 0.1) * np.minimum(1, (s1 - s0 - stt) / 0.3) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 1.6 * stt))), 0, 0.22, at=s0)
# Claude claps for Iran
for c0 in (TE("iran", -0.4), TE("iran", -0.1)):
    fx.add(clap(tight=True), 0, 0.4, pan=-0.2, at=c0)

# ---------------------------------------------------------------- mute the deadpan hole, write
x = mus.x[:, : mus.n].copy()
t = np.arange(x.shape[1]) / SR
h0, h1 = D0, D1
hole = np.ones_like(t)
hole[(t >= h0) & (t < h1)] = 0.0
fade = np.clip((t - (h0 - 0.08)) / 0.08, 0, 1)
hole = np.where(t < h0, 1 - fade, hole)
hole = np.where((t >= h1) & (t < h1 + 0.15), (t - h1) / 0.15, hole)
x *= hole
# a short fade at the very end
x *= np.clip((DUR - t) / 0.6, 0, 1)
x = reverb(x, wet=0.18, length=1.4, decay=0.35)
x += fx.x[:, : fx.n]
x = x / (np.abs(x).max() + 1e-9) * 0.8
sf.write(HERE / "music.wav", x.T, SR, subtype="PCM_24")
grid = {"bpm": BPM, "period": B, "offset": 0.0, "beats": [round(i * B, 5) for i in range(int(DUR / B) + 1)]}
(FILM / "beats.json").write_text(json.dumps(grid))
print(f"music.wav {DUR:.2f}s @ {BPM} bpm; beats.json written")
