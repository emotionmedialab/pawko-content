s = open('web/story.js', encoding='utf8').read()
R = [
 # pops that cross a cut end on the cut
 ("P({ text: '?', a: w.sick - 2, b: w.sick + 30,", "P({ text: '?', a: w.sick - 2, b: 87,"),
 ("T({ text: 'TALL OR\\nSHORT?', a: w.tall - 1, b: TOTAL - 1,", "T({ text: 'TALL OR\\nSHORT?', a: w.tall - 1, b: TOTAL + 6,"),
 # s2: more side-on so the legs are not seen through the patch
 ("[0.95, 0.68, 1.3], [0.85, 0.66, 1.2], 38, (p) => graze(f, { up: ramp(f, 200, 222), lk: p }))", "[1.3, 0.75, 1.2], [1.2, 0.73, 1.1], 38, (p) => graze(f, { up: ramp(f, 200, 222), lk: p }))"),
 # r1/r2: the puppy lifts its head to the kneeling owner (keeps its face above the caption); r2 framed so his head clears the title
 ("{ id: 'r1-owner-kneels', a: 249, b: 296, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(", "{ id: 'r1-owner-kneels', a: 249, b: 296, k: 'yard', own: true, run: (f) => { owner.pose("),
 ("{ id: 'r2-low-front', a: 297, b: 346, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(", "{ id: 'r2-low-front', a: 297, b: 346, k: 'yard', own: true, run: (f) => { owner.pose("),
 ("head: [18, 0, 6], smile: 0.2 });\n      return glide(249, 296,", "head: [18, 0, 6], smile: 0.2 }); graze(f, { up: ramp(f, 252, 268), lk: owner.info.head.clone() });\n      return glide(249, 296,"),
 ("head: [18, 0, 6], smile: 0.2 });\n      return glide(297, 346,", "head: [18, 0, 6], smile: 0.2 }); graze(f, { up: 1, lk: owner.info.head.clone() });\n      return glide(297, 346,"),
 ("C([2.3, 1.0, 2.0], [0.85, 0.7, -0.4], 44), C([2.2, 0.98, 1.88], [0.85, 0.7, -0.4], 44)", "C([2.1, 0.95, 2.4], [0.7, 0.68, -0.3], 42), C([2.0, 0.93, 2.28], [0.7, 0.68, -0.3], 42)"),
 ("C([-0.3, 0.7, 1.55], [0.45, 0.33, -0.15], 40), C([-0.24, 0.68, 1.42], [0.45, 0.33, -0.15], 40)", "C([-0.7, 0.95, 2.3], [0.6, 0.68, -0.35], 40), C([-0.62, 0.93, 2.15], [0.6, 0.68, -0.35], 40)"),
 ("[-0.65, 0.75, -0.75], [-0.6, 0.73, -0.8], 40, () => bedSniff(f), hd, -0.04) },", "[-0.85, 0.8, -0.6], [-0.8, 0.78, -0.65], 40, () => bedSniff(f), hd, -0.04) },"),
 ("C([0.45, 1.1, 2.9], [0.9, 1.0, -0.5], 42), C([0.47, 1.1, 2.75], [0.9, 1.0, -0.5], 42)", "C([0.2, 1.05, 3.1], [0.8, 0.95, -0.5], 42), C([0.22, 1.05, 2.95], [0.8, 0.95, -0.5], 42)"),
 # q2: 3/4 front, the puppy gazes off to screen left (no back of the head)
 ("{ id: 'q2-looks-off', a: 807, b: 846, k: 'yard', own: false, run: (f) => { place(RP, Y0);\n      dog.pose({ ...base(f), w: { stand: 1 }, look: V(-2.5, 0.6, -3.0), neck: 0.8, aimEyes: true, ears: -0.3, wag: 0, tail: 0.2 }); strand.visible = false; tug = 0;\n      return glide(807, 846, C([1.45, 0.7, 0.85], [-0.4, 0.42, -1.0], 40), C([1.35, 0.68, 0.75], [-0.4, 0.42, -1.0], 40))(f); } },",
  "{ id: 'q2-looks-off', a: 807, b: 846, k: 'yard', own: false, run: (f) => faceAt(f, 807, 846, [0.45, 0.6, 1.2], [0.42, 0.59, 1.1], 38, () => { place(RP, Y0); strand.visible = false; tug = 0;\n      dog.pose({ ...base(f), w: { stand: 1 }, look: V(-2.5, lerp(0.5, 0.8, ramp(f, 810, 830)), 2.5), neck: 0.8, aimEyes: true, ears: -0.3 + (f % 50 > 44 ? 0.4 : 0), wag: 0, tail: 0.2 }); }, hd, -0.05) },"),
 # wolves: the grazer stands side-on at the clump's right edge facing -x (pines behind it from the +z cameras)
 ("const GZ = [CLUMP.x[0] + 0.35, CLUMP.z[1] + 0.02];   // grazing point: the front edge of the tall clump (the wolf stands in the short grass in front of it)",
  "const GZ = [CLUMP.x[1] + 0.05, 0.0];   // grazing point: the right edge of the tall clump (the wolf stands in the short grass beside it, facing -x)"),
 ("[[GZ[0], GZ[1] + 0.52, Math.PI, 1.1],", "[[GZ[0] + 0.62, GZ[1], -Math.PI / 2, 1.1],"),
 ("grass: { at: [GZ[0], GZ[1] - 0.05], r: 0.35, amt: 0.6, dir: Math.PI }", "grass: { at: [GZ[0] - 0.1, GZ[1]], r: 0.35, amt: 0.6, dir: -Math.PI / 2 }"),
 ("look: V(GZ[0], 0, GZ[1] - 0.1).lerp(V(-0.5, 0.72, 0.74), up), aimEyes: up > 0.5", "look: V(GZ[0] - 0.15, 0, GZ[1]).lerp(V(-1.3, 0.72, 1.3), up), aimEyes: up > 0.5"),
 ("C([0.8, 0.85, 1.45], [GZ[0] + 0.05, 0.32, GZ[1] + 0.4], 40), C([0.7, 0.83, 1.42], [GZ[0] + 0.05, 0.32, GZ[1] + 0.4], 40)", "C([-0.6, 0.9, 2.6], [-0.85, 0.32, 0.0], 40), C([-0.62, 0.88, 2.45], [-0.85, 0.32, 0.0], 40)"),
 ("C([0.75, 0.85, 1.45], [GZ[0] + 0.05, 0.32, GZ[1] + 0.4], 40), C([0.68, 0.83, 1.42], [GZ[0] + 0.05, 0.32, GZ[1] + 0.4], 40)", "C([-0.6, 0.9, 2.6], [-0.85, 0.32, 0.0], 40), C([-0.62, 0.88, 2.5], [-0.85, 0.32, 0.0], 40)"),
 ("faceAt(f, 932, 1003, [-0.45, 0.75, 0.75], [-0.55, 0.72, 0.72], 40, () => {}, wolfHead, -0.08)", "faceAt(f, 932, 1003, [-1.25, 0.75, 1.35], [-1.3, 0.72, 1.28], 40, () => {}, wolfHead, -0.08)"),
 # broom: top-down-ish, ground fills the frame
 ("const BR = { x0: 0.5, x1: -0.8, z: 1.2 };", "const BR = { x0: 0.5, x1: -0.8, z: 0.95 };"),
 ("return { pos: [bx - 0.15, 0.85, BR.z + 1.5], look: [bx - 0.2, 0.25, BR.z], fov: 42 };", "return { pos: [bx - 0.15, 1.35, BR.z + 0.95], look: [bx - 0.2, 0.15, BR.z], fov: 42 };"),
 ("return { pos: [bx - 0.3, 0.72, BR.z + 1.15], look: [bx - 0.4, 0.12, BR.z], fov: 40 };", "return { pos: [bx - 0.3, 1.0, BR.z + 0.55], look: [bx - 0.35, 0.0, BR.z], fov: 40 };"),
 # couch: owner beside the sofa arm, camera frames both
 ("owner.pose({ w: { stand: 1 }, at: [1.75, -0.95], face: -1.6,", "owner.pose({ w: { stand: 1 }, at: [2.08, -1.3], face: -1.75,"),
 ("C([0.95, 1.3, 1.9], [1.3, 0.9, -1.25], 44), C([1.0, 1.28, 1.75], [1.3, 0.9, -1.25], 44)", "C([0.9, 1.25, 1.75], [1.4, 0.85, -1.35], 44), C([0.95, 1.23, 1.6], [1.4, 0.85, -1.35], 44)"),
 # careful / chemicals / toxic: icons clear of faces; the puppy moved away from the red ball
 ("icon(warn, C0, f, w.careful - 2, 1223, -0.55, 0.3, 0.13, 0.5)", "icon(warn, C0, f, w.careful - 2, 1223, 0.3, 0.62, 0.13, 0.5)"),
 ("icon(warn, C0, f, w.garden - 4, 1268, 0.45, 0.3, 0.13, 0.5)", "icon(warn, C0, f, w.garden - 4, 1268, 0.55, -0.15, 0.13, 0.5)"),
 ("p = V(-0.6, 0, 0.55).addScaledVector(DIR, 0.25 * t);", "p = V(-0.2, 0, 0.8).addScaledVector(DIR, 0.25 * t);"),
 ("C([0.1, 1.0, 2.7], [-0.75, 0.2, 0.55], 40), C([0.02, 0.98, 2.55], [-0.8, 0.2, 0.55], 40)", "C([0.5, 1.0, 2.95], [-0.35, 0.2, 0.8], 40), C([0.42, 0.98, 2.8], [-0.4, 0.2, 0.8], 40)"),
 ("const p = V(-0.6, 0, 0.55).addScaledVector(DIR, 0.25);", "const p = V(-0.2, 0, 0.8).addScaledVector(DIR, 0.25);"),
 ("[-0.45, 0.65, 1.55], [-0.47, 0.63, 1.45], 38,", "[-0.15, 0.65, 1.85], [-0.17, 0.63, 1.75], 38,"),
 ("icon(warn, C0, f, w.toxic - 6, 1347, 0.5, 0.3, 0.12, 0.5)", "icon(warn, C0, f, w.toxic - 6, 1347, -0.55, -0.3, 0.12, 0.5)"),
 ("faceAt(f, 1348, 1380, [1.3, 0.7, -0.55], [1.25, 0.68, -0.6], 38,", "faceAt(f, 1348, 1380, [-0.15, 0.55, -1.0], [-0.12, 0.54, -1.05], 34,"),
 ("icon(warn, C0, f, 1348, 1380, -0.5, 0.3, 0.12, 0.5)", "icon(warn, C0, f, 1348, 1380, 0.55, 0.3, 0.12, 0.5)"),
]
for x, y in R:
    assert x in s, x
    s = s.replace(x, y)
open('web/story.js', 'w', encoding='utf8').write(s)
print('ok')
