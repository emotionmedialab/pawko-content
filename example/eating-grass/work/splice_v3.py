# v3: CTA tail "Comment PAW and I'll send you my complete dog training guide." (voice_cta.wav = voice.mp3 + 0.11 s + CTA take, 58.19 s)
import json
s = open('web/story.js', encoding='utf8').read()
R = [
 ("const TOTAL = 1630;", "const TOTAL = 1746;   // v3: + CTA tail (voice_cta.wav). CTA words: Comment 1636 | PAW 1642 | and 1671 | complete 1692 | training 1713 | guide 1724"),
 ("short: 1595 };", "short: 1595, comment: 1636, paw: 1642, cand: 1671, training: 1713, guide: 1724 };"),
 ("hi: ['grass',", "hi: ['paw', 'guide', 'training', 'grass',"),
 ("T({ text: 'TALL OR\\nSHORT?', a: w.tall - 1, b: TOTAL + 6, at: [540, 300], size: 180 });",
  "T({ text: 'TALL OR\\nSHORT?', a: w.tall - 1, b: 1633, at: [540, 300], size: 180 });\n"
  "  T({ text: 'COMMENT PAW!', a: w.paw - 1, b: TOTAL + 6, at: [540, 270], size: 150, angle: -5 });"),
 ("for (const g of [check, warn]) { g.visible = false; scene.add(g); }",
  "const arrow = new THREE.Group(); const arr = [[-0.18, 0.5], [0.18, 0.5], [0.18, 0.05], [0.42, 0.05], [0, -0.5], [-0.42, 0.05], [-0.18, 0.05]];   // v3: down-arrow under COMMENT PAW!\n"
  "  flat(arrow, arr, 1.18, '#1a1226', 0); flat(arrow, arr, 1.0, '#ffd93b', 0.004);\n"
  "  for (const g of [check, warn, arrow]) { g.visible = false; scene.add(g); }"),
 ("check.visible = warn.visible = false;", "check.visible = warn.visible = arrow.visible = false;"),
 ("{ id: 'e2-push-in', a: 1579, b: TOTAL - 1, k: 'yard', own: false, run: (f) => { const cam = glide(1579, TOTAL - 1,",
  "{ id: 'e2-push-in', a: 1579, b: 1633, k: 'yard', own: false, run: (f) => { const cam = glide(1579, 1633,"),
]
for x, y in R:
    assert x in s, x[:80]
    s = s.replace(x, y)
# new CTA shots after e2
anchor = "  ];\n  const SITP"
assert anchor in s
cta = """    // CTA: the puppy trots to the camera, wagging ("Comment PAW"), then the owner kneels beside it and pets it (title + drawn arrow up top, faces below)
    { id: 'cta1-trot-to-cam', a: 1634, b: 1690, k: 'yard', own: false, run: (f) => { const t = ramp(f, 1634, 1672), p = V(lerp(0.2, 0.45, t), 0, lerp(-0.7, 0.45, t)), yaw = 0.2;
      place(p, yaw, 0.02 * Math.max(0, Math.sin(f * 0.6)) * (1 - t)); strand.visible = false; tug = 0; const sit = ramp(f, 1672, 1684);
      const cam = L3([0.62, 0.62, 2.35], [0.6, 0.6, 2.0], ramp(f, 1634, 1690));
      dog.pose({ ...base(f), w: { stand: 1 - sit, sit }, gait: t < 1 ? { phase: f * 0.13, amp: 26, lift: 1.1, k: 1 - ramp(f, 1666, 1672) } : null, look: V(...cam), neck: 0.85, aimEyes: true, ears: -0.2, wag: Math.sin(f * 0.6) * 0.9, tail: 0.8, jaw: 0.3, tongue: 0.7 });
      const h = hd(); return { pos: cam, look: [h.x, h.y + 0.12, h.z], fov: 40 }; },
      icons: (f, C0) => icon(arrow, C0, f, w.paw + 2, 1690, 0.0, 0.5, 0.11, 0.5) },
    { id: 'cta2-owner-pets', a: 1691, b: TOTAL - 1, k: 'yard', own: true, run: (f) => { const p = V(0.45, 0, 0.45);
      place(p, 0.2); strand.visible = false; tug = 0;
      const oat = [1.0, 0.42], oface = -1.45;
      owner.pose({ w: { kneel: 1 }, at: oat, face: oface, head: [14, 0, 6], breath: breathe(f), blink: blinkAt(f + 33), smile: 0.6 });
      dog.pose({ ...base(f), w: { sit: 1 }, look: V(0.55, 0.7, 3.4), neck: 0.85, aimEyes: true, ears: -0.2, wag: Math.sin(f * 0.6) * 0.9, tail: 0.8, jaw: 0.3, tongue: 0.7, blink: f % 40 < 6 && f > 1700 ? 1 : 0 });
      const t = ramp(f, 1691, 1700), hd0 = dog.boneWorld('head'), bk = dog.boneWorld('top');
      owner.reach({ w: { kneel: 1 }, at: oat, face: oface, head: [14, 0, 6], breath: breathe(f), blink: blinkAt(f + 33), smile: 0.6 }, { R: [hd0.clone().lerp(bk, 0.5 + 0.5 * Math.sin((f - 1691) * 0.25)).add(V(0, 0.12, 0)), t] });
      return glide(1691, TOTAL - 1, C([0.6, 0.85, 3.6], [0.7, 0.85, 0.45], 48), C([0.65, 0.82, 3.2], [0.7, 0.83, 0.45], 46))(f); },
      icons: (f, C0) => icon(arrow, C0, f, 1691, TOTAL + 10, 0.0, 0.5, 0.11, 0.5) },
"""
s = s.replace(anchor, cta + anchor)
open('web/story.js', 'w', encoding='utf8').write(s)

W = json.load(open('web/words.json'))
for wd, a, b in [("Comment", 54.52, 54.75), ("PAW", 54.75, 55.25), ("and", 55.71, 55.79), ("I'll", 55.79, 55.93), ("send", 55.93, 56.09), ("you", 56.09, 56.25),
                 ("my", 56.25, 56.39), ("complete", 56.39, 56.73), ("dog", 56.73, 57.09), ("training", 57.09, 57.45), ("guide.", 57.45, 57.85)]:
    W.append({"w": wd, "s": a, "e": b})
json.dump(W, open('web/words.json', 'w'), indent=1)
print('ok')
