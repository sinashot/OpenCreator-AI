#!/bin/bash
# Real voices end to end: ElevenLabs takes -> re-timed film -> score, SFX, mix -> render -> final.
# Needs ELEVENLABS_API_KEY in the environment and api.elevenlabs.io allowed by the network policy.
set -e
cd /home/user/OpenCreator-AI/motion
M=/root/.claude/plugins/synced/582fe1b9-ee7b-4926-b490-23c7897fcae9_d8e9509d-0449-46d8-a0ee-0c0f882588c0/d92346f7-5140-4ddb-b284-a3b42995e5b0/skills/motion-reel
NODE_USE_ENV_PROXY=1 node sina-x-claude/audio/tts.mjs
node sina-x-claude/audio/vo_build.mjs
MOTION_REEL_SKILL=$M uv run sina-x-claude/audio/score.py
node $M/scripts/render.mjs --film sina-x-claude --format 9x16 --hits 2>&1 | grep -v "GPU stall"
node $M/scripts/sfx.mjs sina-x-claude
[ "$1" = "--audio-only" ] && exit 0
RANGES=$(node -e "const d=JSON.parse(require('fs').readFileSync('sina-x-claude/film.json','utf8')).duration;const r=[];for(let a=0;a<d;a+=11)r.push(a+':'+Math.min(d,a+11));console.log(r.join(' '))")
./render_chunks.sh $RANGES
./finish.sh $RANGES
