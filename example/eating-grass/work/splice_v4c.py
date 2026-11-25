# v4 second audit round: 3/4 faces instead of frontal (no foreshortened/pug snouts, no chin-up), no aimEyes toggles (head snaps), hands off faces, framing
s = open('web/story.js', encoding='utf8').read()
R = [
 # faceAt: the subject looks 0.6 m to the side of the camera and low -> a 3/4 face, slightly down
 ("poseFn(V(pos[0], Math.min(pos[1], 0.3), pos[2]));",
  "{ const h1 = head(), fx = h1.x - pos[0], fz = h1.z - pos[2], n = Math.hypot(fx, fz) || 1; poseFn(V(pos[0] - fz / n * 0.6, 0.2, pos[2] + fx / n * 0.6)); }"),
 # aimEyes toggles caused head snaps: constant per pose
 ("look, neck: lerp(1, 0.8, up), aimEyes: up > 0.5, jaw:", "look, neck: lerp(1, 0.8, up), aimEyes: false, jaw:"),
 ("neck: 0.9, aimEyes: up > 0.5, ears: 0.2, wag: Math.sin(f * 0.35) * 0.4 }); };", "neck: 0.9, aimEyes: false, ears: 0.2, wag: Math.sin(f * 0.35) * 0.4 }); };"),
 ("neck: lerp(0.8, 1, d), aimEyes: d < 0", "neck: lerp(0.8, 1, d), aimEyes: false && d < 0"),
 ("neck: 1 - 0.2 * up, aimEyes: up > 0.5, ears: lerp(0.1, -", "neck: 1 - 0.2 * up, aimEyes: false, ears: lerp(0.1, -"),
 ("aimEyes: up > 0.5, neck: lerp(1, 0.8, up), jaw: 0.15 + 0", "aimEyes: false, neck: lerp(1, 0.8, up), jaw: 0.15 + 0"),
 # r2: no up/down pop
 ("graze(f, { up: 1 - 0.6 * ramp(f, 318, 330) * (1 - ramp(f, 336, 346)), lk: p })", "graze(f, { up: 1, lk: p })"),
 # pets: hand on the back (not in front of the snout); cta2 second hand on the back too, owner turns his face to camera
 ("{ R: [hd0.clone().lerp(bk, 0.6 + 0.4 * Math.sin((f - a) * 0.25)).add(V(0, 0.06, 0)), t] }); };", "{ R: [bk.clone().lerp(hd0, 0.25 + 0.2 * Math.sin((f - a) * 0.25)).add(V(0, 0.09, 0)), t] }); };"),
 # wolves: the background pack-mate out of the tail line
 ("[0.95, -1.45, -0.7, 1.05]", "[1.7, -1.1, -0.7, 1.05]"),
 # wolf front shot: 3/4 from its front-right, the wolf looks low past the camera
 ("faceAt(f, 967, 1003, [-1.15, 0.8, 1.6], [-1.3, 0.7, 1.2], 40, () => {}, wolfHead, -0.08)", "faceAt(f, 967, 1003, [-0.55, 0.85, 1.6], [-0.6, 0.83, 1.55], 40, () => {}, wolfHead, -0.08)"),
 (".lerp(V(-1.3, 0.55, 1.3), up)", ".lerp(V(-1.7, 0.3, 1.2), up)"),
 # couch close: higher 3/4, head stays down on its paws (no lift)
 ("faceAt(f, 1163, 1183, [1.45, 0.82, -0.4], [1.38, 0.78, -0.55], 38, () => {}, hd, -0.05)", "faceAt(f, 1163, 1183, [1.35, 1.25, -0.55], [1.32, 1.24, -0.6], 40, () => {}, hd, -0.05)"),
 ("up = f < 1163 ? ramp(f, 1144, 1154) : ramp(f, 1170, 1178),", "up = f < 1163 ? ramp(f, 1144, 1154) : 0,"),
 ("neck: lerp(0.45, 0.75, up), aimEyes: up > 0.5,", "neck: lerp(0.45, 0.75, up), aimEyes: false,"),
 # sitting ending + CTA: higher camera, look low (no chin-up)
 ("C([1.15, 0.7, 1.75], [0.45, 0.32, -0.05], 40), C([1.08, 0.68, 1.62], [0.45, 0.32, -0.05], 40)", "C([1.25, 0.9, 1.75], [0.45, 0.3, -0.05], 40), C([1.18, 0.9, 1.65], [0.45, 0.3, -0.05], 40)"),
 ("C([0.85, 0.62, 1.4], [0.5, 0.36, 0.0], 38), C([0.75, 0.58, 1.18], [0.5, 0.36, 0.0], 38)", "C([0.95, 0.85, 1.35], [0.5, 0.33, 0.0], 38), C([0.9, 0.85, 1.3], [0.5, 0.33, 0.0], 38)"),
 ("look: V(cam.pos[0], 0.3, cam.pos[2]), neck: 0.9,", "look: V(cam.pos[0] + 0.5, 0.12, cam.pos[2]), neck: 0.9,"),
 ("look: V(cam[0], 0.3, cam[2]), neck: 0.85,", "look: V(cam[0] + 0.5, 0.12, cam[2]), neck: 0.85,"),
 ("const cam = L3([0.62, 0.5, 2.35], [0.6, 0.48, 2.0], ramp(f, 1634, 1690));", "const cam = L3([0.62, 0.7, 2.35], [0.6, 0.68, 2.0], ramp(f, 1634, 1690));"),
 ("w: { sit: 1 }, look: V(0.6, 0.3, 3.9),", "w: { sit: 1 }, look: V(1.4, 0.15, 3.9),"),
 # framing nits
 ("icon(check, C0, f, w.checked - 2, 196, 0.45, 0.1, 0.16, 0.5)", "icon(check, C0, f, w.checked - 2, 196, 0.5, 0.42, 0.13, 0.5)"),
 ("return { pos: [bx - 0.22, 1.0, BR.z + 0.55], look: [bx - 0.28, 0.0, BR.z], fov: 40 };", "return { pos: [bx - 0.1, 1.0, BR.z + 0.6], look: [bx - 0.16, 0.0, BR.z], fov: 40 };"),
 ("const cx = lerp(p.x + 0.1, RP.x - 0.1, 0.3);", "const cx = p.x - 0.12;"),
 ("C([1.0, 1.0, 3.15], [0.15, 0.2, 1.0], 40), C([0.92, 0.98, 3.0], [0.1, 0.2, 1.0], 40)", "C([0.85, 1.0, 3.15], [0.0, 0.2, 1.0], 40), C([0.8, 0.98, 3.0], [-0.05, 0.2, 1.0], 40)"),
 ("C([0.95, 0.55, 0.85], [0.3, 0.24, -0.03], 32), C([0.82, 0.5, 0.7], [0.3, 0.24, -0.03], 30), true)(f)", "C([0.95, 0.55, 0.85], [0.26, 0.24, -0.03], 32), C([0.88, 0.52, 0.78], [0.26, 0.24, -0.03], 31), true)(f)"),
 ("const BEDLOOK = V(BED.x - 0.35, 0.22, -1.85);", "const BEDLOOK = V(BED.x - 0.35, 0.25, -1.7);"),
]
for x, y in R:
    assert x in s, x[:90]
    s = s.replace(x, y)
# cta2: both hands on the back, owner's face turned to the camera
x = "{ R: [hd0.clone().lerp(bk, 0.5 + 0.5 * Math.sin((f - 1691) * 0.25)).add(V(0, 0.12, 0)), t] });"
assert x in s
s = s.replace(x, "{ R: [bk.clone().lerp(hd0, 0.3 + 0.2 * Math.sin((f - 1691) * 0.25)).add(V(0, 0.09, 0)), t], L: [bk.clone().add(V(0.05, 0.06, -0.08)), t] });")
s = s.replace("const oat = [0.97, 0.92], oface = -1.45;\n      owner.pose({ w: { kneel: 1 }, at: oat, face: oface, head: [14, 0, 6],", "const oat = [0.97, 0.92], oface = -1.45;\n      owner.pose({ w: { kneel: 1 }, at: oat, face: oface, head: [8, 35, 0],")
s = s.replace("{ w: { kneel: 1 }, at: oat, face: oface, head: [14, 0, 6], breath: breathe(f), blink: blinkAt(f + 33), smile: 0.6 }, {", "{ w: { kneel: 1 }, at: oat, face: oface, head: [8, 35, 0], breath: breathe(f), blink: blinkAt(f + 33), smile: 0.6 }, {")
open('web/story.js', 'w', encoding='utf8').write(s)
print('ok')
