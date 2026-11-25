#!/bin/bash
# usage: sheetf.sh name "f1,f2,..." [cols]  -> stills/<name>.jpg  (each tile labelled)
cd "$(dirname "$0")"; rm -rf stills/$1; GPU=1 node render.mjs stills/$1 "$2" 1 2>&1 | grep -E "ERR|error|done"; py sheet.py stills/$1 stills/$1.jpg ${3:-6}
