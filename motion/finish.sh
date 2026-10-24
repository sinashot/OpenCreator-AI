#!/bin/bash
# Stitch the rendered chunks, master the audio, mux: out/sina-x-claude/final.mp4 (+ a no-voice cut)
#   ./finish.sh 0:11 11:22 ...   (the same ranges render_chunks.sh rendered)
set -e
cd /home/user/OpenCreator-AI/motion
M=/root/.claude/plugins/synced/582fe1b9-ee7b-4926-b490-23c7897fcae9_d8e9509d-0449-46d8-a0ee-0c0f882588c0/d92346f7-5140-4ddb-b284-a3b42995e5b0/skills/motion-reel
O=out/sina-x-claude
DUR=$(node -e "console.log(JSON.parse(require('fs').readFileSync('sina-x-claude/film.json','utf8')).duration)")
: > $O/chunks.txt
for r in "$@"; do echo "file 'range_9x16_${r/:/-}.mp4'" >> $O/chunks.txt; done
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i $O/chunks.txt -c copy -movflags +faststart $O/video_9x16.mp4
node $M/scripts/mix.mjs sina-x-claude --music-db -4 --vo-db 1
# a cut without the voices, for a different voice-over later
A=sina-x-claude/audio
mv $A/vo.wav $A/vo.keep.wav
cp $A/mix.wav $A/mix.keep.wav
node $M/scripts/mix.mjs sina-x-claude --no-mux --music-db -1
ffmpeg -hide_banner -loglevel error -y -i $O/video_9x16.mp4 -i $A/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -t $DUR -movflags +faststart $O/final_novoice.mp4
mv $A/vo.keep.wav $A/vo.wav; mv $A/mix.keep.wav $A/mix.wav
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact $O/final.mp4
