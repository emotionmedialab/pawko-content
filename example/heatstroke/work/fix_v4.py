# v4 (Nel review): new shot list (fewer push-ins) + puppy head angles (no nose-up / underside-of-jaw views)
import shutil
p = 'web/story.js'; shutil.copy(p, 'work/story-v3.js')
L = open(p, encoding='utf8').read().split('\n')
i = next(k for k, l in enumerate(L) if l.startswith('  const SHOTS = ['))
j = next(k for k, l in enumerate(L) if k > i and l.startswith('  ];'))
L[i:j + 1] = open('work/shots_v4.txt', encoding='utf8').read().rstrip('\n').split('\n')
s = '\n'.join(L)
R = [("const lk = room.pts().fanFace.clone().lerp(V(0.6, 0.4, 3), 0.55).lerp(", "const lk = room.pts().fanFace.clone().lerp(V(0.6, 0.4, 3), 0.55).setY(0.38).lerp("),
     ("look: owner.info.head.clone(), neck: 0.8, aimEyes: true, jaw: 0.3,", "look: owner.info.head.clone().setY(0.75), neck: 0.6, aimEyes: true, jaw: 0.3,"),
     ("look: f >= 614 ? V(DX + 1.0, 0.3 + bob, 1.75)", "look: f >= 614 ? V(DX + 1.0, 0.24 + bob, 1.75)"),
     ("look: V(sx + 1.2 + sway, 0.45, sz + 2.5), neck: 0.6", "look: V(sx + 1.2 + sway, 0.36, sz + 2.5), neck: 0.6")]
for a, b in R:
    c = s.count(a); assert c == 1, (a[:60], c); s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s); print('ok')
