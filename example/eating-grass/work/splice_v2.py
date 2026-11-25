# v2 (coordinator review): visible eating (head dips / bobs into the tuft, frantic on "desperately"), more movement in near-static shots, couch pose, captions clear of the puppy
L = open('web/story.js', encoding='utf8').read().split('\n')
def setl(n, text):   # replace 1-based line n (checks it starts as expected)
    L[n - 1] = text

def check(n, start):
    assert L[n - 1].lstrip().startswith(start), (n, L[n - 1][:80])

check(107, 'const AMT')
setl(107, "  const AMT = (f) => 0.2 + 0.5 * ramp(f, 0, 1380) + 0.2 * ramp(f, 1381, 1500);   // patch eaten: slowly, the same in every yard shot (continuity); faster while he eats desperately")
check(112, '// puppy grazing')
setl(112, "  // puppy grazing at the patch: chewing jaw + the head dips and bobs into the tuft (fast = frantic: quick, deep repeated dips); up 0..1 lifts the head (strand in the mouth) toward `lk`")
check(114, 'place(RP, Y0)')
setl(114, "    const fr = fast > 1.5, ph = f * (fr ? 0.62 : 0.2), bob = (1 - up) * (fr ? 0.5 : 0.22) * Math.pow(0.5 + 0.5 * Math.sin(ph), fr ? 3 : 2), c = chewJ(f, fast, 0.7);\n"
         "    place(fr ? RP.clone().addScaledVector(DIR, 0.025 * Math.sin(ph)) : RP, Y0);")
check(115, 'const look')
setl(115, "    const g0 = GRAZE_LOOK.clone().add(V(0, 0.45 * bob, 0)), look = up > 0 && lk ? g0.lerp(lk, up) : g0;")
check(116, 'dog.pose')
setl(116, "    dog.pose({ ...base(f), w: { stand: up + bob, graze: 1 - up - bob }, look, neck: lerp(1, 0.8, up), aimEyes: up > 0.5, jaw: 0.12 + 0.3 * c, ears: fr ? 0.3 * Math.sin(ph) : 0.1, wag: Math.sin(f * (fr ? 0.6 : 0.3)) * (0.3 + 0.3 * up) });")
check(117, 'strand.visible')
setl(117, "    strand.visible = up > 0.6; tug = (1 - up) * clamp(0.35 + 0.65 * c) * (fr ? 1 : 0.8) * (1 - 0.6 * bob);")

S = {
 'h4-face-strand': "    { id: 'h4-eating-close', a: 88, b: 116, k: 'yard', own: false, run: (f) => { graze(f); return glide(88, 116, C([0.95, 0.5, 0.75], [0.3, 0.24, -0.02], 30), C([0.8, 0.46, 0.62], [0.3, 0.24, -0.02], 30))(f); } },",
 's2-happy-lift': "    { id: 's2-happy-lift', a: 197, b: 248, k: 'yard', own: false, run: (f) => faceAt(f, 197, 248, [1.45, 0.8, 1.35], [1.05, 0.68, 0.95], 38, (p) => graze(f, { up: ramp(f, 206, 224), lk: p })) },",
 'st3-favourite': "    { id: 'st3-favourite', a: 430, b: 487, k: 'yard', own: false, run: (f) => { graze(f);\n      return glide(430, 487, C([1.45, 0.85, 1.7], [0.45, 0.28, -0.05], 38), C([1.05, 0.66, 1.15], [0.42, 0.26, -0.05], 36))(f); } },",
 'st7-head-down': "    { id: 'st7-head-down', a: 633, b: 689, k: 'yard', own: false, run: (f) => { const d = ramp(f, 634, 650);\n      if (d >= 1) graze(f); else { place(RP, Y0); dog.pose({ ...base(f), w: { stand: 1 - d, graze: d }, look: V(GRAZE_LOOK.x, lerp(0.25, 0, d), GRAZE_LOOK.z), neck: lerp(0.8, 1, d), aimEyes: d < 0.5, jaw: d * (0.12 + 0.3 * chewJ(f)) }); strand.visible = false; tug = d * chewJ(f) * 0.8; }\n      return glide(633, 689, C([1.5, 0.85, 1.45], [0.45, 0.28, -0.05], 38), C([1.0, 0.62, 0.95], [0.42, 0.26, -0.05], 36))(f); } },",
 'r1-owner-kneels': None, 'r2-low-front': None,
 'q1-head-tilt': "    { id: 'q1-head-tilt', a: 778, b: 806, k: 'yard', own: false, run: (f) => faceAt(f, 778, 806, [-0.15, 0.6, 1.05], [0.05, 0.52, 0.72], 34, (p) => { place(RP, Y0); strand.visible = false; tug = 0;\n      dog.pose({ ...base(f), w: { stand: 1 }, look: p.clone().add(V(0.12 * Math.sin(ramp(f, 780, 800) * Math.PI), 0.1 * Math.sin(ramp(f, 782, 800) * Math.PI), 0)), neck: 0.8, aimEyes: true, ears: lerp(0.1, -0.6, ramp(f, 779, 787)) + (f > 796 && f < 800 ? 0.5 : 0), wag: 0.4 * Math.sin(f * 0.35), tail: 0.4 }); }, hd, -0.06) },",
 'q2-looks-off': "    { id: 'q2a-looks-off', a: 807, b: 826, k: 'yard', own: false, run: (f) => faceAt(f, 807, 826, [0.5, 0.62, 1.25], [0.25, 0.6, 1.1], 38, (p) => { place(RP, Y0); strand.visible = false; tug = 0; const tn = ramp(f, 809, 819);\n      dog.pose({ ...base(f), w: { stand: 1 }, look: p.clone().lerp(V(-2.5, 0.75, 2.5), tn), neck: 0.8, aimEyes: true, ears: lerp(0.1, -0.4, tn), wag: 0, tail: 0.2 }); }, hd, -0.05) },\n"
                   "    { id: 'q2b-yard-push', a: 827, b: 846, k: 'yard', own: false, run: (f) => { place(RP, Y0); strand.visible = false; tug = 0;\n      dog.pose({ ...base(f), w: { stand: 1 }, look: V(-2.5, 0.75, 2.5), neck: 0.8, aimEyes: true, ears: -0.4 + (f % 40 > 35 ? 0.4 : 0), wag: 0, tail: 0.2 });\n      return glide(827, 846, C([1.5, 1.5, 2.6], [-0.2, 0.35, 0.3], 44), C([1.1, 1.15, 1.9], [-0.1, 0.32, 0.2], 42))(f); } },",
 'f2-wolf-grazes': "    { id: 'f2-wolf-grazes', a: 882, b: 931, k: 'forest', run: (f) => glide(882, 931, C([-0.4, 1.05, 3.3], [-0.75, 0.32, 0.0], 40), C([-0.6, 0.78, 2.4], [-0.82, 0.3, 0.0], 38))(f) },",
 'f3-wolf-front': "    { id: 'f3a-wolf-low', a: 932, b: 966, k: 'forest', run: (f) => glide(932, 966, C([-0.1, 0.45, 1.5], [-0.9, 0.3, 0.0], 38), C([-0.3, 0.42, 1.1], [-0.95, 0.3, 0.0], 36))(f) },\n"
                    "    { id: 'f3b-wolf-front', a: 967, b: 1003, k: 'forest', run: (f) => faceAt(f, 967, 1003, [-1.15, 0.8, 1.6], [-1.3, 0.7, 1.2], 40, () => {}, wolfHead, -0.08) },",
 'c1-wolf-match': "    { id: 'c1-wolf-match', a: 1083, b: 1108, k: 'forest', run: (f) => glide(1083, 1108, C([-0.45, 0.95, 3.0], [-0.75, 0.32, 0.0], 40), C([-0.62, 0.8, 2.45], [-0.8, 0.3, 0.0], 38))(f) },",
 'c4-couch-close': "    { id: 'c4-couch-close', a: 1163, b: 1183, k: 'room', own: false, run: (f) => faceAt(f, 1163, 1183, [1.45, 0.82, -0.4], [1.38, 0.78, -0.55], 38, () => {}, hd, -0.05) },",
 'k3-make-sick': None,
 'v1-fast-chew': "    { id: 'v1-fast-chew', a: 1381, b: 1417, k: 'yard', own: false, run: (f) => { graze(f, { fast: 2 }); return glide(1381, 1417, C([1.45, 0.9, 1.9], [0.45, 0.28, 0.0], 40), C([1.0, 0.62, 1.2], [0.4, 0.26, -0.05], 36))(f); } },",
 'v2-desperate-high': "    { id: 'v2-desperate-close', a: 1418, b: 1453, k: 'yard', own: false, run: (f) => { graze(f, { fast: 2.2 }); return glide(1418, 1453, C([0.95, 0.55, 0.85], [0.3, 0.24, -0.03], 32), C([0.82, 0.5, 0.7], [0.3, 0.24, -0.03], 30))(f); } },",
 'v3-owner-concern': None,
}
out = []
for ln in L:
    key = next((k for k in S if f"id: '{k}'" in ln), None)
    if key is None or S[key] is None:
        out.append(ln); continue
    out.append(S[key]); S[key] = 'done'
s = '\n'.join(out)
# shots whose body spans two lines: patch by string
R = [
 # r1/r2: the puppy looks up at once and the kneeling owner pets it (stroke); cameras put the puppy's face above the caption line
 ("head: [18, 0, 6], smile: 0.2 }); graze(f, { up: ramp(f, 252, 268), lk: owner.info.head.clone() });\n      return glide(249, 296,",
  "head: [18, 0, 6], smile: 0.2 }); graze(f, { up: ramp(f, 249, 259), lk: owner.info.head.clone() }); pet(f, 266);\n      return glide(249, 296,"),
 ("head: [18, 0, 6], smile: 0.2 }); graze(f, { up: 1, lk: owner.info.head.clone() });\n      return glide(297, 346,",
  "head: [18, 0, 6], smile: 0.2 }); graze(f, { up: 1, lk: owner.info.head.clone() }); pet(f, 297);\n      return glide(297, 346,"),
 ("C([2.53, 0.95, 3.24], [0.7, 0.85, -0.3], 42), C([2.45, 0.94, 3.1], [0.7, 0.85, -0.3], 42)", "C([2.6, 0.95, 3.35], [0.7, 0.75, -0.3], 42), C([2.35, 0.92, 2.95], [0.7, 0.75, -0.3], 42)"),
 ("C([0.0, 0.95, 4.2], [0.75, 0.88, -0.4], 40), C([0.02, 0.94, 4.05], [0.75, 0.88, -0.4], 40)", "C([0.1, 0.95, 4.3], [0.75, 0.78, -0.4], 40), C([0.15, 0.93, 3.85], [0.75, 0.78, -0.4], 40)"),
 # k3: push in, head lift, ear flick, wag
 ("return faceAt(f, 1269, 1315, [-0.3, 0.65, 2.0], [-0.28, 0.63, 1.9], 38,", "return faceAt(f, 1269, 1315, [-0.4, 0.7, 2.25], [-0.22, 0.6, 1.6], 38,"),
 ("ears: lerp(0.1, -0.3, up), wag: 0 }); }, hd, -0.02); } },", "ears: lerp(0.1, -0.3, up) + (f > 1300 && f < 1304 ? 0.5 : 0), wag: 0.3 * up * Math.sin(f * 0.35), look2: 0 }); }, hd, -0.02); } },"),
 # v3: owner turns his head from the puppy to the camera while the camera pushes in
 ("owner.pose(ownerArgs(f, { head: [24, 0, lerp(6, 16, ramp(f, 1454, 1480))], smile: 0.02 }));\n      return glide(1454, 1495, ocam(-0.75, 1.7, 1.12, 1.42, 36), ocam(-0.75, 1.55, 1.12, 1.42, 36))(f); } },",
  "owner.pose(ownerArgs(f, { head: [lerp(24, 6, ramp(f, 1470, 1486)), lerp(0, -22, ramp(f, 1470, 1486)), lerp(6, 14, ramp(f, 1454, 1480))], smile: 0.02 }));\n      return glide(1454, 1495, ocam(-0.75, 2.0, 1.12, 1.42, 36), ocam(-0.6, 1.4, 1.15, 1.42, 36))(f); } },"),
 # st9: push-in
 ("C([0.2, 1.1, 3.1], [0.8, 1.15, -0.5], 42), C([0.22, 1.1, 2.95], [0.8, 1.15, -0.5], 42)", "C([0.2, 1.1, 3.2], [0.8, 1.15, -0.5], 42), C([0.35, 1.12, 2.7], [0.82, 1.15, -0.5], 42)"),
 # wolf grazer bobs into the clump like the puppy
 ("const up = f >= 932 && f < 1004 ? ramp(f, 950, 966) * (1 - ramp(f, 985, 1000)) : 0;",
  "const up = f >= 967 && f < 1004 ? ramp(f, 970, 984) * (1 - ramp(f, 994, 1003)) : 0, bob = (1 - up) * 0.22 * Math.pow(0.5 + 0.5 * Math.sin(f * 0.19), 2);"),
 ("wf.pose({ ...b, w: { graze: 1 - up, stand: up }, look: V(GZ[0] - 0.15, 0, GZ[1]).lerp(",
  "wf.pose({ ...b, w: { graze: 1 - up - bob, stand: up + bob }, look: V(GZ[0] - 0.15, 0.45 * bob, GZ[1]).lerp("),
 # couch: lies diagonally (3/4 toward the front), head on its paws, lifts it to the camera with a wag
 ("dog.root.position.copy(SEAT); dog.root.rotation.set(0, Math.PI / 2 + 0.25, 0); dog.root.updateMatrixWorld(true);\n    const lk = f < 1163 ? V(0.8, 1.3, 1.6) : V(1.12, 0.9, -0.6);\n    dog.pose({ ...base(f), w: { down: 1 }, look: lk, neck: 0.7, aimEyes: true, ears: 0.1, wag: Math.sin(f * 0.35) * 0.6, tail: 0.3 }); strand.visible = false;",
  "dog.root.position.copy(SEAT); dog.root.rotation.set(0, Math.PI / 2 - 0.55, 0); dog.root.updateMatrixWorld(true);\n"
  "    const paws = dog.root.localToWorld(V(0, -0.12, 0.6)), up = f < 1163 ? ramp(f, 1144, 1154) : ramp(f, 1170, 1178), lk = paws.lerp(f < 1163 ? V(0.95, 1.3, 1.75) : V(1.4, 0.8, -0.5), up);\n"
  "    dog.pose({ ...base(f), w: { down: 1 }, look: lk, neck: lerp(0.45, 0.75, up), aimEyes: up > 0.5, ears: lerp(0.25, 0.0, up), blink: up < 0.3 && f % 50 < 20 ? 1 : blinkAt(f + 20), wag: Math.sin(f * 0.35) * (0.3 + 0.4 * up), tail: 0.3 }); strand.visible = false;"),
 ("const SEAT = V(0.72, 0.475, -1.33);", "const SEAT = V(0.62, 0.475, -1.45);"),
 # pet helper (kneel recipe from redo-parts proof d) right after ownerArgs
 ("  const ownerArgs = (f, o = {}) => ({ w: { stand: 1 }, at: OWN, face: OF, head: [22, 0, 10], breath: breathe(f), blink: blinkAt(f + 33), smile: 0.08, ...o });",
  "  const ownerArgs = (f, o = {}) => ({ w: { stand: 1 }, at: OWN, face: OF, head: [22, 0, 10], breath: breathe(f), blink: blinkAt(f + 33), smile: 0.08, ...o });\n"
  "  // kneeling owner strokes the puppy's head/back (redo-parts pet recipe); call after the puppy is posed\n"
  "  const pet = (f, a) => { const t = ramp(f, a, a + 10); if (t <= 0) return; const hd0 = dog.boneWorld('head'), bk = dog.boneWorld('top');\n"
  "    owner.reach({ ...ownerArgs(f), w: { kneel: 1 }, at: KN, face: KF, head: [18, 0, 6], smile: 0.4 }, { R: [hd0.clone().lerp(bk, 0.5 + 0.5 * Math.sin((f - a) * 0.25)).add(V(0, 0.12, 0)), t] }); };"),
]
for x, y in R:
    assert x in s, x[:90]
    s = s.replace(x, y)
s = s.replace(", look2: 0 }", " }")
open('web/story.js', 'w', encoding='utf8').write(s)
print('ok', [k for k, v in S.items() if v not in (None, 'done')])
