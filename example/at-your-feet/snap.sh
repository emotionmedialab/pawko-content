#!/usr/bin/env bash
# bash snap.sh name "frames"  -> stills/name + stills/name.jpg
rm -rf stills/$1; GPU=1 node render.mjs stills/$1 "$2" 1 0.9 2>&1 | grep -v "GL Driver\|X3595"; py sheet.py stills/$1 stills/$1.jpg ${3:-8}
