"""Beat times and a 30 fps energy envelope for the film (writes audio-data.js).
usage: python3 tools/beats.py audio/song.wav audio-data.js   (needs librosa)"""
import json, sys
import librosa

y, sr = librosa.load(sys.argv[1], sr=22050, mono=True)
oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=256)
_, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=256, units='time', start_bpm=92)
rms = librosa.feature.rms(y=y, hop_length=735)[0]  # 735 samples = one frame at 30 fps
data = {'dur': round(len(y) / sr, 3), 'beats': [round(float(b), 3) for b in beats],
        'env': [round(float(e), 3) for e in rms / rms.max()]}
open(sys.argv[2], 'w').write('window.AUDIO_DATA=' + json.dumps(data) + ';\n')
