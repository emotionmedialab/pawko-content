# usage: bash rk.sh dir "frames"
rm -rf stills/$1; GPU=1 node render.mjs stills/$1 "$2" 2>&1 | grep -v X3595 | tail -4; py sheet.py stills/$1 stills/$1.jpg ${3:-8}
