#!/bin/bash
# usage: mont.sh dir out  (all jpgs in dir, 5 per row, scaled 360 wide)
d=$1; o=$2; n=$(ls $d/*.jpg | wc -l)
ffmpeg -v error -y -pattern_type glob -i "$d/*.jpg" -vf "scale=360:-1,tile=5x$(( (n+4)/5 ))" -frames:v 1 $o
