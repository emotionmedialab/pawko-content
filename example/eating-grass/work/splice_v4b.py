# v4 defect fixes from the full-size audit (see work/defects_v4.md)
s = open('web/story.js', encoding='utf8').read()
R = [
 # chin-up faces: every look-at-camera target sits below head height, so the face tilts slightly down
 ("poseFn(V(pos[0], Math.min(pos[1], 0.46), pos[2]));", "poseFn(V(pos[0], Math.min(pos[1], 0.3), pos[2]));"),
 ("look: V(cam.pos[0], 0.46, cam.pos[2]), neck: 0.9,", "look: V(cam.pos[0], 0.3, cam.pos[2]), neck: 0.9,"),
 ("look: V(cam[0], 0.46, cam[2]), neck: 0.85,", "look: V(cam[0], 0.3, cam[2]), neck: 0.85,"),
 ("w: { sit: 1 }, look: V(0.6, 0.48, 3.9),", "w: { sit: 1 }, look: V(0.6, 0.3, 3.9),"),
 ("lk = paws.lerp(f < 1163 ? V(0.95, 1.3, 1.75) : V(1.4, 0.8, -0.5), up);", "lk = paws.lerp(f < 1163 ? V(0.95, 0.6, 1.75) : V(1.4, 0.6, -0.5), up);"),
 ("const BEDLOOK = V(BED.x - 0.35, 0.3, -1.85);", "const BEDLOOK = V(BED.x - 0.35, 0.22, -1.85);"),
 # head-dips: the look stays on the tuft (no chin lift on the bob); the strand shows while it chews (eating reads), not only when the head is up
 ("const g0 = GRAZE_LOOK.clone().add(V(0, 0.45 * bob, 0)), look", "const g0 = GRAZE_LOOK.clone(), look"),
 ("strand.visible = up > 0.6; tug =", "strand.visible = true; tug ="),
 # s1: the title covered the owner's face -> puppy-only high wide
 ("{ id: 's1-science-high', a: 147, b: 196, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f, { head: [20, 0, 6] }));",
  "{ id: 's1-science-high', a: 147, b: 196, k: 'yard', own: false, run: (f) => { graze(f);"),
 ("C([0.9, 2.6, 2.7], [0.8, 0.35, -0.45], 44), C([0.85, 2.5, 2.5], [0.8, 0.35, -0.45], 44)", "C([0.9, 2.2, 2.6], [0.45, 0.25, -0.1], 42), C([0.82, 2.15, 2.5], [0.45, 0.25, -0.1], 42)"),
 # s2: slower head turn
 ("graze(f, { up: ramp(f, 206, 224), lk: p })", "graze(f, { up: ramp(f, 203, 230), lk: p })"),
 # r1/r2: puppy looks level at the owner's hands (no goat chin-up); hand lands on the head/back; r2 = a different angle (left side, wider)
 ("graze(f, { up: ramp(f, 249, 259), lk: owner.info.head.clone() }); pet(f, 266);", "graze(f, { up: ramp(f, 249, 259), lk: V(KN[0], 0.42, KN[1]) }); pet(f, 266);"),
 ("graze(f, { up: 1, lk: owner.info.head.clone() }); pet(f, 297);", "graze(f, { up: 1, lk: V(KN[0], 0.42, KN[1]) }); pet(f, 297);"),
 ("bk, 0.5 + 0.5 * Math.sin((f - a) * 0.25)).add(V(0, 0.12, 0)), t] }); };", "bk, 0.6 + 0.4 * Math.sin((f - a) * 0.25)).add(V(0, 0.06, 0)), t] }); };"),
 ("C([0.1, 0.95, 4.3], [0.75, 0.62, -0.4], 40), C([0.15, 0.93, 3.85], [0.75, 0.62, -0.4], 40)", "C([-2.39, 1.04, 1.98], [0.65, 0.85, -0.3], 40), C([-2.39, 1.04, 1.98], [0.65, 0.85, -0.3], 40)"),
 # st9: puppy keeps grazing (no cranked-back head)
 ("      graze(f, { up: 1, lk: owner.info.head.clone() });\n      return glide(736, 777,", "      graze(f);\n      return glide(736, 777,"),
 # wolves: spread the pack so no tail/head interpenetrates; the front-shot wolf keeps its head up to the cut
 ("[0.15, -0.35, -0.7, 1.05], [0.75, -1.2, -0.45, 1.0], [-0.45, -0.9, 0.5, 1.0]]", "[0.65, -0.75, -0.7, 1.05], [1.05, -1.7, -0.45, 1.0], [-0.15, -1.45, 0.5, 1.0]]"),
 ("ramp(f, 970, 984) * (1 - ramp(f, 994, 1003))", "ramp(f, 970, 984)"),
 # f5: camera follows the broom so it never leaves an empty frame
 ("run: (f) => glide(1044, 1082, C([-0.1, 1.0, BR.z + 0.55], [-0.18, 0.0, BR.z], 40), C([-0.55, 0.98, BR.z + 0.5], [-0.62, 0.0, BR.z], 40))(f) },",
  "run: (f) => { const bx = broomX(f); return { pos: [bx - 0.22, 1.0, BR.z + 0.55], look: [bx - 0.28, 0.0, BR.z], fov: 40 }; } },"),
 # h1/c2: wider so the rear is not cut
 ("C([1.3, 0.78, 1.5], [0.45, 0.26, -0.05], 36), C([1.22, 0.76, 1.4], [0.45, 0.26, -0.05], 36))(f); } },\n    { id: 'h2", "C([1.3, 0.78, 1.5], [0.55, 0.26, -0.05], 40), C([1.22, 0.76, 1.4], [0.55, 0.26, -0.05], 40))(f); } },\n    { id: 'h2"),
 ("{ graze(f); return glide(1109, 1135, C([1.3, 0.78, 1.5], [0.45, 0.26, -0.05], 36), C([1.22, 0.76, 1.4], [0.45, 0.26, -0.05], 36))(f); } },",
  "{ graze(f); return glide(1109, 1135, C([1.3, 0.78, 1.5], [0.55, 0.26, -0.05], 40), C([1.22, 0.76, 1.4], [0.55, 0.26, -0.05], 40))(f); } },"),
 # k5: title covered the nose -> head lower in frame
 ("(p) => bedSniff(f, p, ramp(f, 1352, 1366)), hd, -0.1)", "(p) => bedSniff(f, p, ramp(f, 1352, 1366)), hd, 0.08)"),
 # hearts near the puppy's head (st3), not on the flower bed
 ("at: [190, 560], angle: -10, size: 170", "at: [330, 600], angle: -10, size: 150"),
 ("at: [800, 640], angle: 10, size: 140", "at: [560, 540], angle: 10, size: 120"),
 # icons: inked like the scene (no scene outlines drawn across them)
 ("m.position.z = z; m.userData.ndSkip = true; g.add(m); return m; };", "m.position.z = z; g.add(m); return m; };"),
 # cta1: lower camera (no flower 'hat' tangent)
 ("const cam = L3([0.62, 0.62, 2.35], [0.6, 0.6, 2.0], ramp(f, 1634, 1690));", "const cam = L3([0.62, 0.5, 2.35], [0.6, 0.48, 2.0], ramp(f, 1634, 1690));"),
]
for x, y in R:
    assert x in s, x[:90]
    s = s.replace(x, y)
open('web/story.js', 'w', encoding='utf8').write(s)
print('ok')
