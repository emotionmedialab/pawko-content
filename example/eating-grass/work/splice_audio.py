s = open('audio.py', encoding='utf8').read()
a = s.index('# Key word frames'); b = s.index('def write(')
s = s[:a] + open('work/audio_cues.py', encoding='utf8').read() + s[b:]
s = s.replace('"""Music bed + SFX stems for At Your Feet (1663 frames).', '"""Music bed + SFX stems for Eating Grass (1630 frames, copied from At Your Feet).')
s = s.replace('TOTAL = 1710', 'TOTAL = 1630')
s = s.replace('F = lambda f: (f + 47) / 30   # v1 cue frames -> shifted by the longer hook line', 'F = lambda f: f / 30   # cue frame -> seconds')
open('audio.py', 'w', encoding='utf8').write(s)
print('ok')
