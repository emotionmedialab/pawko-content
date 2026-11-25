#!/usr/bin/env bash
# Render the redo-parts proof clips + contact sheets:  bash proofs.sh [a b c d e f g h]   (GPU, ~0.15-0.25 s/frame)
# sheets: every 3rd frame, 10x10 tiles -> out/sheets/<x>/s1.jpg
cd "$(dirname "$0")"
declare -A N=([a]=160 [b]=180 [c]=180 [d]=270 [e]=160 [f]=150 [g]=240 [h]=238)
declare -A T=([a]=a-heat-walk-collapse-STOP [b]=b-shade-tree-water-bucket [c]=c-living-room-fan-AIR-phone-VET [d]=d-homecoming-door-keys-shoes-jumpup-timer-pet [e]=e-backyard-puppy-chews-grass [f]=f-day-forest-wolf-grazing [g]=g-owner-pose-gallery [h]=h-puppy-pose-gallery)
for h in ${@:-a b c d e f g h}; do
  rm -rf work/f$h; HASH="#$h" GPU=1 node render.mjs work/f$h "0-$((${N[$h]}-1))" 1 0.95 2>&1 | grep -v "GL Driver\|X3595\|WebGLProgram"
  ffmpeg -v error -y -framerate 30 -i work/f$h/f%04d.jpg -c:v libx264 -crf 17 -pix_fmt yuv420p out/${T[$h]}.mp4
  mkdir -p out/sheets/$h; rm -f out/sheets/$h/*; ffmpeg -v error -y -i out/${T[$h]}.mp4 -vf "select='not(mod(n\,3))',scale=162:-1,tile=10x10" -vsync vfr out/sheets/$h/s%d.jpg
done
