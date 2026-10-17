"""Measure when each narrated word starts, from the word-by-word captions burned
into the source video (they were placed on the speech by the captioning tool;
the silences in the audio line up with them to within one caption frame).

    python3 tools/word_onsets.py SOURCE.mp4  > tools/word_times.json

How: in the caption band (y 330–690 of the 720×1280 source), count caption-coloured
pixels that are new compared with the previous frame. Each burst of new ink is a
word popping in; a sharp drop is a caption page clearing. A few bursts hold two or
three words that popped in together; those were checked frame by frame and are
split in SPLIT below (burst start frame → offsets of the extra words, in frames).
The words themselves come from tools/caption_pages.txt (one caption page per line).
Needs numpy and ffmpeg.
"""
import json, pathlib, subprocess, sys

import numpy as np

SPLIT = {293: [3, 5], 399: [3], 494: [2], 699: [3], 1004: [3], 1310: [3], 1346: [3], 1652: [3], 1742: [3], 1797: [3], 1877: [3]}
FPS = 30
W, H, Y0 = 360, 180, 330


def main(video):
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', video, '-vf', f'crop=720:360:0:{Y0},scale={W}:{H},format=gray', '-f', 'rawvideo', '-'],
        capture_output=True, check=True,
    ).stdout
    n = len(raw) // (W * H)
    ink = np.frombuffer(raw, dtype=np.uint8)[: n * W * H].reshape(n, H, W) > 110
    new = np.zeros(n, int)
    for i in range(1, n):
        prev = ink[max(0, i - 2)].copy()
        grown = prev.copy()
        for d in (-3, -2, -1, 1, 2, 3):
            grown |= np.roll(prev, d, 1) | np.roll(prev, d, 0)
        new[i] = (ink[i] & ~grown).sum()

    onsets, i = [], 1
    while i < n:
        if new[i] > 30 and new[i - 1] <= 30 and (i < 2 or new[i - 2] <= 30):
            j = i
            while j < n and (new[j] > 30 or (j + 1 < n and new[j + 1] > 30)):
                j += 1
            onsets.append(i)
            onsets.extend(i + off for off in SPLIT.get(i, []))
            i = j
            continue
        i += 1

    pages = pathlib.Path(__file__).with_name('caption_pages.txt').read_text(encoding='utf-8')
    words = pages.replace('|', ' ').split()
    if len(words) != len(onsets):
        sys.exit(f'{len(onsets)} onsets for {len(words)} words — check SPLIT')
    json.dump([{'w': w, 't': round(f / FPS, 3)} for w, f in zip(words, onsets)], sys.stdout, ensure_ascii=False)


if __name__ == '__main__':
    main(sys.argv[1])
