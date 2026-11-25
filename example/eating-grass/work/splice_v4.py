# v4 (Nel's rules): drift-by-default cameras (push-in only where flagged), strand in the mouth, no tongue, no chin-up looks
s = open('web/story.js', encoding='utf8').read()
R = [
 # camera helpers: without push, the move from A to B keeps only its sideways part (max 8 cm) -> a gentle drift, no zoom-in
 ("const glide = (a, b, A, B) => (f) => { const t = ramp(f, a, b); return { pos: L3(A.pos, B.pos, t), look: L3(A.look, B.look, t), fov: lerp(A.fov, B.fov, t) }; };",
  "const drift = (A, B) => { const fw = A.look.map((v, i) => v - A.pos[i]), n = Math.hypot(...fw), u = fw.map((v) => v / n), d = B.pos.map((v, i) => v - A.pos[i]), k = d[0] * u[0] + d[1] * u[1] + d[2] * u[2];\n"
  "  let lat = d.map((v, i) => v - k * u[i]); const m = Math.hypot(...lat); if (m > 0.08) lat = lat.map((v) => v * 0.08 / m);\n"
  "  return { pos: A.pos.map((v, i) => v + lat[i]), look: A.look.map((v, i) => v + lat[i]), fov: A.fov }; };\n"
  "const glide = (a, b, A, B, push = false) => { if (!push) B = drift(A, B); return (f) => { const t = ramp(f, a, b); return { pos: L3(A.pos, B.pos, t), look: L3(A.look, B.look, t), fov: lerp(A.fov, B.fov, t) }; }; };"),
 ("const faceAt = (f, a, b, A, B, fov, poseFn, head = hd, dy = -0.03) => { const pos = L3(A, B, ramp(f, a, b)); poseFn(V(...pos));",
  "const faceAt = (f, a, b, A, B, fov, poseFn, head = hd, dy = -0.03, push = false) => { if (!push) { const h0 = head(); B = drift({ pos: A, look: [h0.x, h0.y, h0.z] }, { pos: B, look: [h0.x, h0.y, h0.z] }).pos; }\n"
  "    const pos = L3(A, B, ramp(f, a, b)); poseFn(V(pos[0], Math.min(pos[1], 0.46), pos[2]));   // the dog looks at the camera at head height (no chin-up)"),
 # push-ins kept only on emphasis beats: hook eating close, "desperately" (2), the CTA pet shot (+ cta1's own trot-in)
 ("C([1.2, 0.58, 1.05], [0.38, 0.24, -0.04], 32), C([1.0, 0.52, 0.85], [0.36, 0.24, -0.04], 32))(f)", "C([1.2, 0.58, 1.05], [0.38, 0.24, -0.04], 32), C([1.0, 0.52, 0.85], [0.36, 0.24, -0.04], 32), true)(f)"),
 ("C([1.45, 0.9, 1.9], [0.45, 0.28, 0.0], 40), C([1.0, 0.62, 1.2], [0.4, 0.26, -0.05], 36))(f)", "C([1.45, 0.9, 1.9], [0.45, 0.28, 0.0], 40), C([1.0, 0.62, 1.2], [0.4, 0.26, -0.05], 36), true)(f)"),
 ("C([0.95, 0.55, 0.85], [0.3, 0.24, -0.03], 32), C([0.82, 0.5, 0.7], [0.3, 0.24, -0.03], 30))(f)", "C([0.95, 0.55, 0.85], [0.3, 0.24, -0.03], 32), C([0.82, 0.5, 0.7], [0.3, 0.24, -0.03], 30), true)(f)"),
 ("C([0.62, 0.95, 4.1], [0.7, 0.68, 0.9], 42), C([0.66, 0.95, 3.75], [0.7, 0.7, 0.9], 42))(f)", "C([0.62, 0.95, 4.1], [0.7, 0.68, 0.9], 42), C([0.66, 0.95, 3.75], [0.7, 0.7, 0.9], 42), true)(f)"),
 # strand: at the mouth line (measured on the face close-up), parented to the jaw
 ("|| '0,0.08,0').split(',')", "|| '0,0.075,0').split(',')"),
 # no hanging tongue (it sat under the chin); look targets at head height
 ("w: { sit: 1 }, look: V(0.6, 0.95, 3.9), neck: 0.85, aimEyes: true, ears: -0.2, wag: Math.sin(f * 0.6) * 0.9, tail: 0.8, jaw: 0.3, tongue: 0.7,",
  "w: { sit: 1 }, look: V(0.6, 0.48, 3.9), neck: 0.85, aimEyes: true, ears: -0.2, wag: Math.sin(f * 0.6) * 0.9, tail: 0.8, jaw: 0.25,"),
 ("look: V(...cam.pos), neck: 0.9, aimEyes: true, ears: (f % 60 > 54 ? -0.5 : 0.1), wag: Math.sin(f * 0.45) * 0.7, tail: 0.6, jaw: 0.25, tongue: 0.6 });",
  "look: V(cam.pos[0], 0.46, cam.pos[2]), neck: 0.9, aimEyes: true, ears: (f % 60 > 54 ? -0.5 : 0.1), wag: Math.sin(f * 0.45) * 0.7, tail: 0.6, jaw: 0.25 });"),
 ("look: V(...cam), neck: 0.85, aimEyes: true, ears: -0.2, wag: Math.sin(f * 0.6) * 0.9, tail: 0.8, jaw: 0.3, tongue: 0.7 });",
  "look: V(cam[0], 0.46, cam[2]), neck: 0.85, aimEyes: true, ears: -0.2, wag: Math.sin(f * 0.6) * 0.9, tail: 0.8, jaw: 0.25 });"),
 (".lerp(V(-1.3, 0.72, 1.3), u", ".lerp(V(-1.3, 0.55, 1.3), u"),
]
for x, y in R:
    assert x in s, x[:90]
    s = s.replace(x, y)
open('web/story.js', 'w', encoding='utf8').write(s)
print('ok')
