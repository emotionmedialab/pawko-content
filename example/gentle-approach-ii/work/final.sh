cd /c/Users/admin/Desktop/Work/dog-app/cartoon-short-kit/example/follow-me-ii
SHOTS=1 GPU=1 node render.mjs frames "721-833" 2>&1 | grep -v X3595 | tail -1 > work/render.log
bash finish.sh "Follow Me II" > work/finish.log 2>&1
mkdir -p ../../../production/out; cp out/Follow-Me-II.mp4 ../../../production/out/Follow-Me-II.mp4
rm -rf stills/mp4f stills/final3 stills/final_sheets; mkdir stills/mp4f stills/final3
ffmpeg -v error -i out/Follow-Me-II.mp4 -vsync 0 -qscale:v 3 stills/mp4f/m%04d.jpg
N=$(ls stills/mp4f | wc -l)
for i in $(seq 0 3 1221); do j=$((i+1)); [ $j -gt $N ] && j=$N; cp stills/mp4f/m$(printf %04d $j).jpg stills/final3/f$(printf %04d $i).jpg; done
py qasheets.py stills/final3 stills/final_sheets > work/sheets.log
echo ALLDONE >> work/sheets.log
