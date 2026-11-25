# v4 defect fixes (audit of the first v4 render, see work/defects_v4.md)
p = 'web/story.js'; s = open(p, encoding='utf8').read()
R = [
 # p2 / d1 / d2: owner crouches further from the puppy (knee clipped its head), walks a separate line to the shade (legs crossed the puppy)
 ("const KNEEL = [DX - 0.02, 0.1];", "const KNEEL = [DX - 0.2, -0.08];"),
 # r1: bucket off the curb; r4: puppy sits a little further from the pouring bucket (bucket came down into its head)
 ("D2 = [sx + 0.15, sz + 0.15]", "D2 = [sx + 0.25, sz + 0.25]"),
 ("const BUCKET0 = [2.95, 0, -0.95];", "const BUCKET0 = [2.95, 0, -1.08];"),
 # p2: crouch starts at the cut (head was cropped while still standing), pets with the LEFT hand so the leash stays in the right
 ("const kn = ramp(f, 720, 740), pet = ramp(f, 738, 748);", "const kn = ramp(f, 712, 728), pet = ramp(f, 730, 742);"),
 ("owner.reach(args, pet > 0 ? { R: [top.clone().lerp(sp, 0.5 + 0.5 * Math.sin((f - 738) * 0.2)).add(V(0, 0.06, 0)), pet] } : {});",
  "owner.reach(args, pet > 0 ? { L: [top.clone().lerp(sp, 0.5 + 0.5 * Math.sin((f - 730) * 0.2)).add(V(0, 0.06, 0)), pet] } : {});"),
 # d1: getting up from the crouch keeps the face up (pitch +10 on top of the crouch flipped the head to show its back)
 ("walk: { phase: L.dist / STRIDE, k: L.k }, head: [10, -10, 0] });", "walk: { phase: L.dist / STRIDE, k: L.k }, head: [lerp(12, -15, up), -8, 0] });"),
 # bucket: carried one-handed by the handle at the hip; lifted to chest height and tipped with both hands for the pour
 ("const bpos = V(at[0], 0, at[1]).addScaledVector(fw, 0.42 + 0.1 * pour); bpos.y = lerp(0.42, 0.55, pour);",
  "const bpos = V(at[0], 0, at[1]).addScaledVector(fw, lerp(0.42, 0.4, pour)); bpos.y = lerp(0.42, 0.72, pour);"),
 ("smile: 0.2, ik: { R: bp.handle, L: bp.base } });", "smile: 0.2, ik: pour > 0.05 ? { R: bp.handle, L: bp.base } : { R: bp.handle } });"),
 # water section: the dropped leash lies on the ground right beside the puppy and rises to its neck
 ("V(O2[0] + 0.25, 0.02, O2[1] + 0.2), b: dog.boneWorld('n2'), sag: f >= w.refusing && f < 566 ? 0.05 : f < 494 ? 0.35 : 0.7 });",
  "V(D2[0] - 0.3, 0.02, D2[1] + 0.3), b: dog.boneWorld('n2'), sag: f >= w.water ? 0.2 : f >= w.refusing && f < 566 ? 0.05 : f < 494 ? 0.35 : 0.7 });"),
 # CTA: owner kneels a bit further back (knee merged with the puppy), face up, hand strokes the back (not over the head)
 ("DSIT = [OK[0] + okFw[0] * 0.42, OK[1] + okFw[1] * 0.42];", "DSIT = [OK[0] + okFw[0] * 0.55, OK[1] + okFw[1] * 0.55];"),
 ("at: OK, face: OKF, head: [6, 0, 0],", "at: OK, face: OKF, head: [-8, 0, 0],"),
 ("owner.reach(args, pet > 0 ? { R: [hd.clone().lerp(top, 0.5 + 0.5 * Math.sin((f - w.comment - 10) * 0.22)).add(V(0, 0.12, 0)), pet] } : {});",
  "owner.reach(args, pet > 0 ? { R: [top.clone().lerp(dog.boneWorld('sp3'), 0.5 + 0.5 * Math.sin((f - w.comment - 10) * 0.22)).add(V(0, 0.08, 0)), pet] } : {});"),
 # framing: e1 caption on the puppy's head, e3 cap cut, g1 puppy head cut at the bottom, a1 hat cut, p2 head cut, v2 owner on the edge, i1/v3 tail cut, CTA two-shot more side-on
 ("track(ox, [0.6, 0.75, 3.6], [0.6, 1.6, -6], 50)", "track(ox, [0.6, 1.0, 3.9], [0.6, 1.2, -6], 50)"),
 ("track(dxAt, [2.2, 0.5, 2.5], [-0.25, 0.32, 0.1], 44)", "track(dxAt, [2.4, 0.55, 2.7], [-0.25, 0.4, 0.1], 44)"),
 ("track(ox, [1.4, 1.35, 2.3], [0.25, 1.05, 0.05], 38)", "track(ox, [1.7, 1.2, 2.9], [0.3, 0.82, 0.1], 38)"),
 ("C([OX + 1.2, 1.25, 3.3], [OX - 0.25, 0.42, 0.1], 40), 0.06)", "C([OX + 1.3, 1.2, 3.9], [OX - 0.25, 0.55, 0.1], 40), 0.06)"),
 ("C([DX + 1.6, 0.7, 3.6], [DX + 0.05, 0.33, 0.2], 40), -0.08)", "C([DX + 1.7, 0.75, 4.1], [DX - 0.05, 0.4, 0.1], 40), -0.08)"),
 ("C([0.85, 1.3, 3.7], [0.25, 0.92, -0.3], 42), -0.06)", "C([0.9, 1.3, 4.2], [0.35, 0.9, -0.3], 42), -0.06)"),
 ("C([0.55, 1.0, 2.9], [-0.3, 0.3, 0.0], 44), -0.1)", "C([0.6, 1.0, 3.0], [-0.2, 0.3, 0.0], 44), -0.1)"),
 ("C([0.55, 1.0, 2.9], [-0.3, 0.3, 0.0], 44), 0.08)", "C([0.6, 1.0, 3.0], [-0.2, 0.3, 0.0], 44), 0.08)"),
 ("glide(1577, 1686, C([0.3, 0.95, 4.45], [0.05, 0.56, 0.25], 40), C([-0.05, 0.9, 4.05], [0.05, 0.56, 0.25], 40))",
  "glide(1577, 1686, C([-0.75, 0.95, 4.4], [0.1, 0.56, 0.25], 40), C([-0.95, 0.9, 4.0], [0.1, 0.56, 0.25], 40))"),
]
for a, b in R:
    c = s.count(a); assert c == 1, (a[:70], c); s = s.replace(a, b)
open(p, 'w', encoding='utf8').write(s); print('ok')
