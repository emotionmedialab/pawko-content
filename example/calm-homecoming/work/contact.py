# Contact audit: for the given shots, every `step`-th QA frame, the lower-middle 1080x1080 of the frame at 540x540, 6 per sheet.
#   py work/contact.py stills/qa 1 04 06 13 ...   (step 1 = every QA frame = every 3rd video frame) -> stills/contact/<shot>_<n>.jpg
import sys, glob, re, os, json
from PIL import Image, ImageDraw
d, step, ids = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
shots = json.load(open('work/shots.json')); os.makedirs('stills/contact', exist_ok=True)
fs = {int(re.search(r'f(\d+)', f).group(1)): f for f in glob.glob(d + '/f*.jpg')}
for s in shots:
    if s['id'][:2] not in ids: continue
    ks = [k for k in sorted(fs) if s['a'] <= k <= s['b']][::step]
    for n in range(0, len(ks), 6):
        ch = ks[n:n + 6]; sh = Image.new('RGB', (540 * 3, 540 * ((len(ch) + 2) // 3)))
        for i, k in enumerate(ch):
            im = Image.open(fs[k]).crop((0, 500, 1080, 1580)).resize((540, 540)); dr = ImageDraw.Draw(im); dr.rectangle((0, 0, 50, 16), fill='black'); dr.text((3, 2), str(k), fill='yellow')
            sh.paste(im, ((i % 3) * 540, (i // 3) * 540))
        sh.save(f"stills/contact/{s['id']}_{n // 6:02d}.jpg", quality=85)
print(len(glob.glob('stills/contact/*.jpg')))
