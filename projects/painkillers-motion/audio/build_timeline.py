#!/usr/bin/env python3
"""Lay the voice-over lines on the 100 BPM grid and write the timeline.

Each section starts on a beat (sections are where the camera moves), lines inside
a section follow with short breaths. Outputs:
  public/audio/vo.wav     the narration, one file
  src/timeline.json       line start/end times, section starts, sfx cue times

usage: python3 build_timeline.py VO_DIR LINES_TSV
"""
import json
import os
import sys
import wave

import numpy as np
import soundfile as sf

BEAT = 0.6
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
vo_dir, lines_tsv = sys.argv[1], sys.argv[2]

SECTIONS = [
    ("hook", ["q1", "a1"]),
    ("messenger", ["p1", "p2", "p3"]),
    ("game", ["g1", "g2", "g3"]),
    ("nsaid", ["n1t", "n1a", "n1b", "n1c", "n1d", "n1e"]),
    ("opioid", ["n2t", "n2a", "n2b", "n2c", "n2d", "n2e", "n2f"]),
    ("topical", ["n3t", "n3a", "n3b", "n3c", "n3d", "n3e", "n3f", "n3g"]),
    ("neuro", ["n4t", "n4a", "n4b", "n4c", "n4d", "n4e"]),
    ("acet", ["n5t", "n5a", "n5b", "n5c", "n5d"]),
    ("cta", ["c1"]),
]

texts = {}
for line in open(lines_tsv, encoding="utf8"):
    k, t = line.rstrip("\n").split("\t")
    texts[k] = t


def trim(a, sr, thr=0.01):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a
    s = max(0, idx[0] - int(0.02 * sr))
    e = min(len(a), idx[-1] + int(0.06 * sr))
    return a[s:e]


clips = {}
sr = None
for _, keys in SECTIONS:
    for k in keys:
        a, sr = sf.read(os.path.join(vo_dir, f"{k}.wav"), dtype="float32")
        clips[k] = trim(a, sr)

t = 0.6
lines, sections = {}, []
for name, keys in SECTIONS:
    # section start: next beat, at least 0.5 s after the last line
    if sections:
        t = np.ceil((t + 0.5) / BEAT) * BEAT
    start = t
    for i, k in enumerate(keys):
        d = len(clips[k]) / sr
        lines[k] = {"start": round(t, 3), "end": round(t + d, 3), "text": texts[k]}
        t += d
        txt = texts[k].strip()
        if k.endswith("t"):
            gap = 0.45
        elif txt.endswith((".", "!", "؟", "?", "؛")):
            gap = 0.38
        elif txt.endswith((":",)):
            gap = 0.3
        else:
            gap = 0.2
        if i < len(keys) - 1:
            t += gap
    sections.append({"name": name, "start": round(start, 3), "end": round(t, 3)})

duration = round(t + 3.2, 3)  # end card hold
for i, s in enumerate(sections):
    s["next"] = sections[i + 1]["start"] if i + 1 < len(sections) else duration

out = np.zeros(int(duration * sr) + sr, dtype=np.float32)
for k, info in lines.items():
    i = int(info["start"] * sr)
    out[i : i + len(clips[k])] += clips[k]
os.makedirs(os.path.join(ROOT, "public", "audio"), exist_ok=True)
sf.write(os.path.join(ROOT, "public", "audio", "vo.wav"), out[: int(duration * sr)], sr)

tl = {
    "duration": duration,
    "beat": BEAT,
    "sections": sections,
    "lines": lines,
    "sectionStarts": [s["start"] for s in sections],
    "ctaStart": sections[-1]["start"],
    "whooshes": [s["start"] for s in sections[1:]],
    "pops": [v["start"] for k, v in lines.items() if not any(k == ks[0] for _, ks in SECTIONS)],
}
json.dump(tl, open(os.path.join(ROOT, "src", "timeline.json"), "w"), ensure_ascii=False, indent=1)
print("duration", duration)
for s in sections:
    print(s["name"], s["start"], s["end"])
