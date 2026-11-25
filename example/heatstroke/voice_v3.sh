#!/usr/bin/env bash
# v3 narration: voice.mp3 cut after "...even if they seem fine." (+0.35 s pause) + cta-comment-paw.mp3, CTA gain-matched to the voice's integrated loudness.
set -e; CUT=52.47
lufs() { ffmpeg -hide_banner -i "$@" -af ebur128 -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | awk '{print $2}'; }
ffmpeg -v error -y -i voice.mp3 -t $CUT -af "afade=t=out:st=$(py -c "print($CUT-0.03)"):d=0.03" -ar 44100 -ac 1 work/v3_main.wav
VI=$(lufs work/v3_main.wav); CI=$(lufs cta-comment-paw.mp3); G=$(py -c "print(round($VI - ($CI), 2))"); echo "voice $VI LUFS, cta $CI LUFS -> cta gain $G dB"
ffmpeg -v error -y -i cta-comment-paw.mp3 -af "volume=${G}dB,afade=t=in:d=0.01" -ar 44100 -ac 1 work/v3_cta.wav
ffmpeg -v error -y -i work/v3_main.wav -i work/v3_cta.wav -filter_complex "[0][1]concat=n=2:v=0:a=1" voice_v3.wav
ffprobe -v error -show_entries format=duration -of csv=p=0 voice_v3.wav
