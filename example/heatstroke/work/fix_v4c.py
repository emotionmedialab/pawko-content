# v4 pass-2 fixes (second audit, see work/defects_v4.md)
p = 'web/story.js'; s = open(p, encoding='utf8').read()
R = [
 # e1: sun/sky shot only (the small puppy always ended up under the caption)
 ("track(ox, [0.6, 1.0, 3.9], [0.6, 0.85, -6], 50)", "track(ox, [0.6, 0.6, 3.6], [0.6, 3.6, -6], 50)"),
 # h3: puppy above the caption line
 ("track(ox, [0.9, 0.32, 2.5], [0.1, 1.05, -1.0], 52)", "track(ox, [0.9, 0.32, 2.5], [0.1, 0.9, -1.0], 52)"),
 # p2: crouch a little closer so the stroking hand reaches the puppy's back
 ("const KNEEL = [DX - 0.2, -0.08];", "const KNEEL = [DX - 0.12, 0.0];"),
 # pour: bucket held further out from the belly
 ("addScaledVector(fw, lerp(0.42, 0.4, pour)); bpos.y = lerp(0.42, 0.72, pour);", "addScaledVector(fw, lerp(0.42, 0.52, pour)); bpos.y = lerp(0.42, 0.66, pour);"),
 # r2: owner's head lower in frame (the "3 WATER" card sat on his cap)
 ("drift(983, 1053, C([sx + 0.75, 1.1, 4.4], [sx - 0.15, 0.45, sz], 44), -0.1)", "drift(983, 1053, C([sx + 0.8, 1.15, 5.1], [sx - 0.1, 0.62, sz], 44), -0.1)"),
 # r6b: puppy's head inside the frame
 ("C([sx - 0.85, 0.45, sz + 1.35], [sx + 0.15, 0.33, sz + 0.15], 40), 0.05)", "C([sx - 0.8, 0.45, sz + 1.45], [sx + 0.3, 0.33, sz + 0.2], 40), 0.05)"),
 # dropped leash lies behind the puppy and curves up to the collar point (upper neck)
 ("V(D2[0] - 0.3, 0.02, D2[1] + 0.3), b: dog.boneWorld('n2'), sag: f >= w.water ? 0.2 :", "V(D2[0] + 0.05, 0.02, D2[1] - 0.55), b: dog.boneWorld('n2').lerp(dog.headWorld(), 0.45), sag: f >= w.water ? 0.6 :"),
 # i3 / v5: puppy lower in frame, whole body in
 ("faceCam(1.3, 1.45, 1.45, 0.05, 38, 1367, 1415, -0.06)", "faceCam(1.3, 1.75, 1.75, 0.08, 38, 1367, 1415, 0.06)"),
 ("faceCam(1.5, 1.2, 1.2, 0.05, 38, 1545, 1560, -0.08)", "faceCam(1.5, 1.5, 1.5, 0.08, 38, 1545, 1560, 0.04)"),
 # CTA: back to the v3 camera (front 3/4: owner's face + puppy 3/4); the pass-1 clip/hand fixes stay
 ("glide(1577, 1686, C([-0.75, 0.95, 4.4], [0.1, 0.56, 0.25], 40), C([-0.95, 0.9, 4.0], [0.1, 0.56, 0.25], 40))",
  "glide(1577, 1686, C([0.3, 0.95, 4.45], [0.05, 0.56, 0.25], 40), C([-0.05, 0.9, 4.05], [0.05, 0.56, 0.25], 40))"),
]
for a, b in R:
    c = s.count(a); assert c == 1, (a[:70], c); s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s); print('ok')
