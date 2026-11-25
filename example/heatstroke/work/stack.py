# stack per-shot QA sheets into a few review pages (throwaway):  py work/stack.py stills/qa_sheets work/rev 4
import sys, glob, os
from PIL import Image
d, out, per = sys.argv[1], sys.argv[2], int(sys.argv[3]); os.makedirs(out, exist_ok=True)
fs = sorted(glob.glob(d + '/*.jpg'))
for k in range(0, len(fs), per):
    ims = [Image.open(f) for f in fs[k:k + per]]; W = 2160
    ims = [im.resize((int(im.width * 0.75), int(im.height * 0.75))) for im in ims]
    sh = Image.new('RGB', (int(W * 0.75), sum(i.height + 8 for i in ims)), 'white'); y = 0
    for im in ims: sh.paste(im, (0, y)); y += im.height + 8
    sh.save(f'{out}/r{k // per + 1:02d}.jpg', quality=80); print(f'{out}/r{k // per + 1:02d}.jpg', [os.path.basename(f) for f in fs[k:k + per]])
