# v3: camera moves -> static or a gentle sideways drift; push-ins kept only on emphasis beats (PUSH)
import re
PUSH = {'01', '04', '05', '18', '19', '21', '44', '45', '46', '47'}
s = open('web/story.js', encoding='utf8').read(); out = []; n = 0
for l in s.split('\n'):
    m = re.search(r"\{ id: '(\d\d)-", l)
    if m and m.group(1) not in PUSH:
        n += 1
        g = re.search(r"glide\((\d+|TOTAL - 1), (\d+|TOTAL - 1), C\(\[([^\]]+)\], \[([^\]]+)\], ([\d.]+)\), C\(\[([^\]]+)\], \[([^\]]+)\], ([\d.]+)\)\)", l)
        if g:   # B = A shifted 4 cm sideways, same look + fov (drift, no push)
            a, b, pa, la, fa = g.group(1), g.group(2), g.group(3), g.group(4), g.group(5)
            x = [float(v) for v in pa.split(', ')]; x[0] += 0.04
            l = l.replace(g.group(0), f"glide({a}, {b}, C([{pa}], [{la}], {fa}), C([{x[0]:g}, {x[1]:g}, {x[2]:g}], [{la}], {fa}))")
        l = re.sub(r"(pupCam\([-\d.]+, [-\d.]+, [-\d.]+, [-\d.]+, [-\d.]+), [-\d.]+, ", r"\1, 0, ", l)   # push 0
        l = re.sub(r"(headCam\([-\d.]+, [-\d.]+, [-\d.]+, [-\d.]+), [-\d.]+, ", r"\1, 0, ", l)
    out.append(l)
open('web/story.js', 'w', encoding='utf8').write('\n'.join(out)); print('de-pushed shots:', n)
