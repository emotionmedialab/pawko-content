import sys, glob
from PIL import Image, ImageDraw
d, out, n = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 4
fs = sorted(glob.glob(d + '/*.jpg'))
for k in range(0, len(fs), n):
    ims = [Image.open(f) for f in fs[k:k + n]]
    W = max(i.width for i in ims); H = sum(i.height + 30 for i in ims)
    sh = Image.new('RGB', (W, H), 'black'); y = 0; dr = ImageDraw.Draw(sh)
    for f, i in zip(fs[k:k + n], ims): dr.text((4, y + 8), __import__('os').path.basename(f), fill='white'); sh.paste(i, (0, y + 30)); y += i.height + 30
    sh.save(f'{out}_{k // n + 1:02d}.jpg', quality=80); print(f'{out}_{k // n + 1:02d}.jpg')
