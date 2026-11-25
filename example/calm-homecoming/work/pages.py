# QA pages: every frame in stills/<d> as 12x4 labelled tiles -> stills/<d>_pages/pNN.jpg   py work/pages.py stills/qa
import sys, glob, re, os
from PIL import Image, ImageDraw
d = sys.argv[1]; out = d + '_pages'; os.makedirs(out, exist_ok=True)
fs = sorted(glob.glob(d + '/f*.jpg')); C, R, tw, th = 12, 4, 180, 320
for p in range(0, len(fs), C * R):
    ch = fs[p:p + C * R]; sh = Image.new('RGB', (tw * C, th * ((len(ch) + C - 1) // C)))
    for i, f in enumerate(ch):
        im = Image.open(f).resize((tw, th)); dr = ImageDraw.Draw(im); dr.rectangle((0, 0, 40, 14), fill='black'); dr.text((3, 2), re.search(r'f(\d+)', f).group(1), fill='yellow')
        sh.paste(im, ((i % C) * tw, (i // C) * th))
    sh.save(f'{out}/p{p // (C * R) + 1:02d}.jpg', quality=85)
print(out, (len(fs) + C * R - 1) // (C * R))
