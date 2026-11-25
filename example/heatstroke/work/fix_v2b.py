p='web/story.js'; s=open(p,encoding='utf8').read()
R=[("rest = ramp(f, 576, 590) * (1 - ramp(f, 636, 652))","rest = ramp(f, 576, 590) * (1 - ramp(f, 600, 614))"),
("look: dog.root.localToWorld(V(0.35 * away, lerp(0.02, -0.22, rest) + bob, 0.8))","look: f >= 614 ? V(DX + 1.0, 0.3 + bob, 1.75) : dog.root.localToWorld(V(0.35 * away, lerp(0.02, -0.14, rest) + bob, 0.8))"),
("C([OX - 1.7, 1.25, 1.95], [OX, 1.25, OZ], 38)","C([OX - 1.95, 1.22, 2.25], [OX, 1.22, OZ], 38)"),
("C([sx + 1.3, 0.4, sz + 1.5], [sx + 0.1, 0.32, sz + 0.1], 40), C([sx + 1.1, 0.38, sz + 1.25], [sx + 0.1, 0.32, sz + 0.1], 40)","C([sx - 0.9, 0.4, sz + 1.45], [sx + 0.15, 0.32, sz + 0.15], 40), C([sx - 0.75, 0.38, sz + 1.25], [sx + 0.15, 0.32, sz + 0.15], 40)"),
("blink: (f % 60) < 8 ? 1 : 0,","blink: blinkAt(f + 20),"),
("C([0.95, 0.55, 1.9], [0.05, 0.32, 0.35], 40), C([0.8, 0.5, 1.65], [0.05, 0.32, 0.35], 40)","C([-0.75, 0.55, 1.45], [0.0, 0.3, 0.35], 40), C([-0.62, 0.5, 1.25], [0.0, 0.3, 0.35], 40)"),
]
for a,b in R:
    c=s.count(a); assert c==1, (a[:70],c); s=s.replace(a,b)
open(p,'w',encoding='utf8').write(s); print('ok')
