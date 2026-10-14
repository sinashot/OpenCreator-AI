#!/usr/bin/env bash
# Prepare the song from the phone screen recording:
# trim the 1.6 s of silence before the music, fade the hard cut at the end,
# bring it to about -14 LUFS (Instagram's target), then rebuild beat/energy data.
# usage: tools/prep_audio.sh path/to/Screenrecorder.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p audio
ffmpeg -v error -y -ss 1.60 -i "$1" -vn -ac 2 -ar 48000 \
  -af "afade=t=in:st=0:d=0.05,afade=t=out:st=30.85:d=0.65" audio/trim.wav
ffmpeg -v error -y -i audio/trim.wav \
  -af "volume=7.4dB,alimiter=limit=0.82:attack=3:release=60:level=disabled" -ar 48000 audio/song.wav
python3 tools/beats.py audio/song.wav audio-data.js
