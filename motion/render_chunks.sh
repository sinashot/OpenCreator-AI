#!/bin/bash
# Render the film in chunks (video only, 24 fps), so a fix re-renders one chunk, not the film.
cd /home/user/OpenCreator-AI/motion
M=/root/.claude/plugins/synced/582fe1b9-ee7b-4926-b490-23c7897fcae9_d8e9509d-0449-46d8-a0ee-0c0f882588c0/d92346f7-5140-4ddb-b284-a3b42995e5b0/skills/motion-reel
for r in "$@"; do
  echo "== chunk $r $(date +%T)"
  node $M/scripts/render.mjs --film sina-x-claude --format 9x16 --fps 24 --noblur --workers 3 --video-only --range $r 2>&1 | grep -v "GPU stall" | tail -2
done
echo "== done $(date +%T)"
