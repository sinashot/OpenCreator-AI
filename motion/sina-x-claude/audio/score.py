# /// script
# requires-python = ">=3.10"
# dependencies = ["librosa>=0.10", "numpy", "scipy", "soundfile"]
# ///
"""The score for Sina x Claude: 120 BPM, 88 s, written to follow the acting in script.js.

    MOTION_REEL_SKILL=<skill> uv run sina-x-claude/audio/score.py

Sections (seconds):  intro 0-7.6 | groove 7.6-27.4 | complaints (D minor, busy) 27.4-42.7 |
Hiro (a reverent swell) 42.7-47.8 | the deadpan (silence + crickets) 47.8-49.0 |
whisper (tiptoe pizzicato) 49.0-53.6 | praise (F major, warm) 53.6-75.6 | coda 75.6-82.6 |
the faint (sad trombone) 82.6-84.4 | end button 84.6.
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

# With real voices, audio/vo_build.mjs writes speech.json: a time warp from the script's times to
# the film's. Cues move with it (W); each section keeps 120 BPM and loops to fill its new length.
SPEECH = FILM / "speech.json"
WARP = json.loads(SPEECH.read_text())["warp"] if SPEECH.exists() else [[0, 0], [88, 88]]
DUR = json.loads(SPEECH.read_text())["duration"] if SPEECH.exists() else 88.0


def W(sec):
    for (a0, b0), (a1, b1) in zip(WARP, WARP[1:]):
        if sec <= a1:
            return b1 if a1 == a0 else b0 + (sec - a0) / (a1 - a0) * (b1 - b0)
    return sec - WARP[-1][0] + WARP[-1][1]

mus = Bus(DUR, BPM)     # music
fx = Bus(DUR, BPM)      # custom effects (mixed into the music stem, they sit on the picture)


def at(sec):
    """a cue in the script's seconds -> a beat on the film's grid"""
    return W(sec) / B


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

# ---------------------------------------------------------------- intro 0 .. 7.6 (beats 0..15)
motif = ["C5", "F5", "A5", "G5", "F5", "C5", "D5", "C5"]
for i, nt in enumerate(motif * 2):
    mus.add(pizz(nt, 0.4), 1 + i * 0.75, 0.5, pan=0.2 * ((i % 2) * 2 - 1))
INTRO_END = at(7.5)
for b in range(4, int(INTRO_END), 2):
    mus.add(kick(soft=True), b, 0.45)
for b in range(0, int(INTRO_END)):
    mus.add(hat(), b + 0.5, 0.12, pan=0.3)
for bar in range(int(np.ceil(INTRO_END / 4))):
    mus.add(pad_chord(CH[["F", "C", "Dm", "Bb"][bar % 4]], 4 * B, 1600), bar * 4, 0.12)

# ---------------------------------------------------------------- groove 7.6 .. 27.4 (beats 15..55)
prog_g = ["F", "C", "Dm", "Bb"]
mel = ["A5", "G5", "F5", "C5", "D5", "F5", "G5", "A5", "C6", "A5", "G5", "F5", "D5", "C5", "D5", "F5"]
G0, G1 = at(7.5), at(27.5)
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
    for k in range(8):
        if b0 + k * 0.5 < G1:
            mus.add(bass_note(up(ROOT[c]) if k % 4 == 3 else ROOT[c], B * 0.45), b0 + k * 0.5, 0.42)
    mus.add(pad_chord(CH[c], 4 * B, 1400), b0, 0.09)
    if bar % 2 == 0:
        for k in range(8):
            mus.add(pizz(mel[(bar * 4 + k) % len(mel)], 0.3), b0 + k * 0.5, 0.33, pan=0.25)

# ---------------------------------------------------------------- complaints 27.4 .. 42.7 (D minor, busy)
b_c0, b_c1 = at(27.5), at(42.5)
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
# a cheeky chromatic run into the cards and the rules
for i, nt in enumerate(["D5", "E5", "F5", "F#5", "G5", "G#5", "A5"]):
    mus.add(pizz(nt, 0.2), at(28.4) + i * 0.25, 0.3)
for i, nt in enumerate(["A5", "G5", "F5", "E5", "D5", "C#5", "D5"]):
    mus.add(pizz(nt, 0.2), at(36.2) + i * 0.25, 0.3)

# ---------------------------------------------------------------- Hiro 42.7 .. 47.8: reverent swell
mus.add(pad_chord(["D3", "F3", "A3", "D4"], 5.0, (500, 3000), attack=0.8, release=0.6), at(42.75), 0.35)
for k, b in enumerate([0, 2, 4, 6, 8]):
    mus.add(kick(soft=True), at(42.8) + b, 0.6)
    mus.add(sub_drop(0.6, 60, 40), at(42.8) + b, 0.25)
for i, nt in enumerate(["D6", "A5", "F6", "E6", "D6"]):
    mus.add(bell(nt, 1.6), at(43.6) + i * 1.5, 0.22, pan=0.2)

# ---------------------------------------------------------------- deadpan 47.8 .. 49.0: record scratch, then crickets
scr_n = int(0.32 * SR)
st = tvec(scr_n)
scr = sweep_filter(rng.standard_normal(scr_n), 300 + 2500 * np.abs(np.sin(2 * np.pi * 4.5 * st)), "bandpass", 3.0)
fx.add(scr * np.exp(-st / 0.2) * 1.4, 0, 0.55, at=W(47.78))
def cricket():
    n = int(0.16 * SR)
    t = tvec(n)
    return np.sin(2 * np.pi * 4300 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 45 * t))) * np.exp(-t / 0.08)
for c0 in (48.05, 48.25, 48.6, 48.8):
    fx.add(cricket(), 0, 0.16, pan=0.5, at=W(c0))

# ---------------------------------------------------------------- whisper 49.0 .. 53.6: tiptoe
tip = ["D4", "F4", "A4", "F4", "E4", "G4", "Bb4", "G4", "D4", "F4", "A4", "D5"]
for i, nt in enumerate(tip):
    mus.add(pizz(nt, 0.25), at(49.0) + i * 0.75, 0.32, pan=-0.3 if i % 2 else 0.3)
mus.add(pad_chord(["D3", "A3", "F4"], 4.6, 900, attack=0.5), at(49.0), 0.12)
mus.add(bell("A6", 1.5), at(52.3), 0.2)

# ---------------------------------------------------------------- praise 53.6 .. 75.6 (F major, warm)
b_p0 = at(53.6)
prog_p = ["F", "C", "Dm", "Bb", "F", "C", "Bb", "C"]
mel_p = ["C6", "A5", "C6", "D6", "C6", "A5", "G5", "F5", "A5", "G5", "F5", "G5", "A5", "C6", "D6", "C6"]
P1 = at(75.6)
for bar in range(int((P1 - b_p0) / 4) + 1):
    b0 = b_p0 + bar * 4
    if b0 >= P1:
        break
    c = prog_p[bar % len(prog_p)]
    mus.add(keys(CH[c] + [up(CH[c][0])], 4 * B), b0, 0.3)
    mus.add(pad_chord(CH[c], 4 * B, 2200), b0, 0.08)
    for k in range(4):
        mus.add(kick(soft=True), b0 + k, 0.45 if k % 2 == 0 else 0.3)
        if k % 2 == 1:
            mus.add(clap(tight=True), b0 + k, 0.2)
        mus.add(hat(), b0 + k + 0.5, 0.1, pan=0.3)
    for k in range(4):
        mus.add(bass_note(ROOT[c], B * 0.9), b0 + k, 0.36)
    if bar >= 1:
        for k in range(4):
            nt = mel_p[(bar * 4 + k) % len(mel_p)]
            mus.add(bell(nt, 0.9), b0 + k, 0.16, pan=0.2)

# ---------------------------------------------------------------- coda 75.6 .. 82.6
b_e0 = at(75.6)
span = (at(82.6) - b_e0) / 4            # four chords across the coda, however long it became
for bar, c in enumerate(["Bb", "F", "C", "F"]):
    b0 = b_e0 + bar * span
    mus.add(keys(CH[c], span * B * 1.2), b0, 0.3)
    mus.add(pad_chord(CH[c], span * B, 1800), b0, 0.1)
    mus.add(bass_note(ROOT[c], (span - 0.5) * B), b0, 0.3)
mus.add(bell("A6", 2.0), at(79.62), 0.25)

# ---------------------------------------------------------------- the faint: wah wah wah waaah
for i, (a, b2, ln) in enumerate([("G3", "F#3", 0.42), ("F#3", "F3", 0.42), ("F3", "E3", 0.42), ("E3", "C3", 1.3)]):
    fx.add(wah(a, b2, ln, wobble=6 if i == 3 else 3), 0, 0.42, at=W(82.65) + i * 0.45)

# ---------------------------------------------------------------- end button 84.6
mus.add(keys(["F3", "A3", "C4", "F4"], 3.0), at(84.6), 0.4)
mus.add(pad_chord(["F3", "A3", "C4"], 3.2, (900, 2600), attack=0.2), at(84.6), 0.16)
for i, nt in enumerate(["C6", "F6", "A6"]):
    mus.add(bell(nt, 1.6), at(84.6) + i * 0.33, 0.22, pan=-0.2 + 0.2 * i)

# ---------------------------------------------------------------- custom effects on picture
# the glitch buzzer (39.12)
bn = int(0.4 * SR); bt = tvec(bn)
buzz = np.sign(np.sin(2 * np.pi * 110 * bt)) * 0.6 + np.sign(np.sin(2 * np.pi * 116 * bt)) * 0.4
fx.add(filt(buzz, "lowpass", 2400) * adsr(bn, 0.005, 0.05, 0.9, 0.05), 0, 0.35, at=W(39.12))
# steam hiss (40.5 .. 42.4)
sn = int(1.9 * SR); stt = tvec(sn)
hiss = sweep_filter(rng.standard_normal(sn), 2500 + 1500 * np.sin(2 * np.pi * 1.6 * stt), "bandpass", 1.5)
fx.add(hiss * np.minimum(1, stt / 0.1) * np.minimum(1, (1.9 - stt) / 0.3) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 1.6 * stt))), 0, 0.22, at=W(40.5))
# Claude claps (70.8, 71.2)
for c0 in (70.8, 71.2):
    fx.add(clap(tight=True), 0, 0.4, pan=-0.2, at=W(c0))

# ---------------------------------------------------------------- mute the deadpan hole, write
x = mus.x[:, : mus.n].copy()
t = np.arange(x.shape[1]) / SR
h0, h1 = W(47.8), W(49.0)
hole = np.ones_like(t)
hole[(t >= h0) & (t < h1)] = 0.0
fade = np.clip((t - (h0 - 0.08)) / 0.08, 0, 1)
hole = np.where(t < h0, 1 - fade, hole)
hole = np.where((t >= h1) & (t < h1 + 0.15), (t - h1) / 0.15, hole)
x *= hole
x = reverb(x, wet=0.18, length=1.4, decay=0.35)
x += fx.x[:, : fx.n]
x = x / (np.abs(x).max() + 1e-9) * 0.8
sf.write(HERE / "music.wav", x.T, SR, subtype="PCM_24")
grid = {"bpm": BPM, "period": B, "offset": 0.0, "beats": [round(i * B, 5) for i in range(int(DUR / B) + 1)]}
(FILM / "beats.json").write_text(json.dumps(grid))
print(f"music.wav {DUR}s @ {BPM} bpm; beats.json written")
