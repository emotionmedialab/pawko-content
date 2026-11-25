#!/usr/bin/env bash
# Render the five proof clips + contact sheets:  bash proofs.sh [a b c d e]   (GPU, ~0.1-0.3 s/frame)
cd "$(dirname "$0")"
declare -A N=([a]=120 [b]=120 [c]=90 [d]=90 [e]=120); declare -A T=([a]=a-owner-asleep-lamp-off [b]=b-owner-sits-up-hugs-puppy [c]=c-forest-wolves-eyes [d]=d-alarm-clock [e]=e-captions-popText-title)
for h in ${@:-a b c d e}; do
  rm -rf work/f$h; HASH="#$h" GPU=1 node render.mjs work/f$h "0-$((${N[$h]}-1))" 1 0.95 2>&1 | grep -v "GL Driver\|X3595"
  ffmpeg -v error -y -framerate 30 -i work/f$h/f%04d.jpg -c:v libx264 -crf 17 -pix_fmt yuv420p out/${T[$h]}.mp4
  mkdir -p out/sheets/$h; rm -f out/sheets/$h/*; ffmpeg -v error -y -i out/${T[$h]}.mp4 -vf "select='not(mod(n\,3))',scale=162:-1,tile=10x10" -vsync vfr out/sheets/$h/s%d.jpg
done
