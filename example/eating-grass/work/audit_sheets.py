"""Full-size audit sheets (Nel's rule): every 3rd frame, 540 px wide tiles (3 per sheet row, 2 rows), close-ups at 810 px (2 per sheet).
py work/audit_sheets.py stills/qa4 stills/audit   (needs work/shots.json)"""
import sys, glob, re, os, json
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
CLOSE = {'h4-eating-close', 's2-happy-lift', 'st2-plants-bed', 'st8-1in5-face', 'q1-head-tilt', 'q2a-looks-off', 'f3b-wolf-front', 'c4-couch-close',
         'k3-make-sick', 'k4-toxic-bed', 'k5-toxic-flowers', 'v2-desperate-close', 'h5-owner-close', 'v3-owner-concern'}
shots = json.load(open('work/shots.json'))
fs = {int(re.search(r'f(\d+)', f).group(1)): f for f in glob.glob(d + '/f*.jpg')}
for n, s in enumerate(shots):
    ks = [k for k in sorted(fs) if s['a'] <= k <= s['b']]
    tw, cols, per = (810, 2, 2) if s['id'] in CLOSE else (540, 3, 6)
    th = tw * 16 // 9
    for c in range(0, len(ks), per):
        ch = ks[c:c + per]; rows = (len(ch) + cols - 1) // cols
        sh = Image.new('RGB', (tw * cols, th * rows), 'black')
        for i, k in enumerate(ch):
            im = Image.open(fs[k]).resize((tw, th)); dr = ImageDraw.Draw(im); dr.rectangle((0, 0, 70, 22), fill='black'); dr.text((4, 4), str(k), fill='yellow')
            sh.paste(im, ((i % cols) * tw, (i // cols) * th))
        sh.save(f"{out}/{n + 1:02d}_{s['id']}_{c // per + 1}.jpg", quality=82)
print(len(glob.glob(out + '/*.jpg')))
