"""Build src/data/timeline.json from the 18 scripted segments and the per-word
onsets measured from the narration (tools/word_times.json).

Each segment starts on its first spoken word; it ends where the next one starts.
Run:  python3 tools/build_timeline.py
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
DURATION = 63.133  # seconds; the narration video is 3788 frames at 60 fps
PUNCT = re.compile(r'[‌،؛:.!?؟«»"\s]')


def norm(word):
    return PUNCT.sub('', word)


segments = json.loads((ROOT / 'tools/segments.json').read_text(encoding='utf-8'))
spoken = json.loads((ROOT / 'tools/word_times.json').read_text(encoding='utf-8'))

cursor = 0
for seg in segments:
    words = seg['fullText'].split()
    seg['words'] = []
    for w in words:
        heard = spoken[cursor]
        if norm(heard['w']) != norm(w):
            raise SystemExit(f"segment {seg['id']}: script word {w!r} != narration word {heard['w']!r}")
        seg['words'].append({'text': w, 'start': heard['t']})
        cursor += 1
if cursor != len(spoken):
    raise SystemExit(f'{len(spoken) - cursor} narration words left over')

out = []
for i, seg in enumerate(segments):
    start = 0.0 if i == 0 else seg['words'][0]['start']
    end = DURATION if i == len(segments) - 1 else segments[i + 1]['words'][0]['start']
    out.append({
        'id': seg['id'],
        'sceneId': seg['sceneId'],
        'startTime': round(start, 3),
        'endTime': round(end, 3),
        'fullText': seg['fullText'],
        'highlightedPhrase': seg['highlightedPhrase'],
        'words': seg['words'],
    })

dest = ROOT / 'src/data/timeline.json'
dest.write_text(json.dumps({'duration': DURATION, 'fps': 60, 'segments': out}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
for s in out:
    print(f"{s['id']}  scene {s['sceneId']}  {s['startTime']:6.3f} → {s['endTime']:6.3f}  {len(s['words'])} words")
