cd /c/Users/admin/Desktop/Work/dog-app/cartoon-short-kit/example/loose-leash
GPU=1 node render.mjs frames "543-700,825-919" 1 2>&1 | grep -v X3595 | tail -1
bash finish.sh "Loose Leash Walking" > work/finish.log 2>&1
cp out/Loose-Leash-Walking.mp4 ../../../production/out/Loose-Leash-Walking.mp4
rm -rf stills/mp4f stills/final3 stills/final_sheets; mkdir stills/mp4f stills/final3
ffmpeg -v error -i out/Loose-Leash-Walking.mp4 -vsync 0 -qscale:v 3 stills/mp4f/m%04d.jpg
for i in $(seq 0 3 999); do cp stills/mp4f/m$(printf %04d $((i+1))).jpg stills/final3/f$(printf %04d $i).jpg; done; cp stills/mp4f/m1000.jpg stills/final3/f1000.jpg
py qasheets.py stills/final3 stills/final_sheets > work/sheets.log
echo ALLDONE >> work/sheets.log
