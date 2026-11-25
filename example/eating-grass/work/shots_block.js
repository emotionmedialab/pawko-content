  // ---------- shots ----------
  // each shot: k = set ('yard' | 'forest' | 'room'), own = owner visible, run(f) poses everything and returns the camera
  const hd = () => dog.headWorld();
  // face shot: camera glides A -> B, the subject is posed first (it may look at the camera), then the camera aims at its head (head sits just above centre)
  const faceAt = (f, a, b, A, B, fov, poseFn, head = hd, dy = -0.03) => { const pos = L3(A, B, ramp(f, a, b)); poseFn(V(...pos)); const h = head(); return { pos, look: [h.x, h.y + dy, h.z], fov }; };
  // owner camera: from heading hg (radians, 0 = +z) at distance d around his head, aimed at height ly (1.5 keeps his head mid-frame, clear of the top titles)
  const OH = [1.19, 1.53, -0.73];
  const ocam = (hg, d, cy, ly, fov, at = OH) => C([at[0] + Math.sin(hg) * d, cy, at[2] + Math.cos(hg) * d], [at[0], ly, at[2]], fov);
  const wolfHead = () => wolves[0].w.headWorld();
  const BEDLOOK = V(BED.x - 0.35, 0.3, -1.85);
  const bedSniff = (f, lk = null, up = 0) => { place(BED, BEDYAW); strand.visible = false; tug = 0;
    dog.pose({ ...base(f), w: { stand: 1 }, look: lk ? BEDLOOK.clone().lerp(lk, up) : BEDLOOK, neck: 0.9, aimEyes: up > 0.5, ears: 0.2, wag: Math.sin(f * 0.35) * 0.4 }); };
  const SHOTS = [
    // hook: ~1 cut per second
    { id: 'h1-chew-profile', a: 0, b: 29, k: 'yard', own: false, run: (f) => { graze(f); return glide(0, 29, C([1.3, 0.78, 1.5], [0.45, 0.26, -0.05], 36), C([1.22, 0.76, 1.4], [0.45, 0.26, -0.05], 36))(f); } },
    { id: 'h2-owner-worried', a: 30, b: 57, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f, { head: [lerp(14, 24, ramp(f, 30, 50)), 0, lerp(4, 12, ramp(f, 34, 54))] }));
      return glide(30, 57, ocam(-0.33, 2.3, 1.5, 1.42, 40), ocam(-0.33, 2.1, 1.5, 1.42, 40))(f); } },
    { id: 'h3-wide-yard', a: 58, b: 87, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f));
      return glide(58, 87, C([0.4, 1.45, 3.4], [0.75, 0.7, -0.4], 46), C([0.45, 1.4, 3.2], [0.75, 0.7, -0.4], 46))(f); } },
    { id: 'h4-face-strand', a: 88, b: 116, k: 'yard', own: false, run: (f) => faceAt(f, 88, 116, [0.05, 0.62, 1.05], [0.1, 0.6, 0.95], 36, (p) => graze(f, { up: ramp(f, 86, 98), lk: p })) },
    { id: 'h5-owner-close', a: 117, b: 146, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f, { head: [26, 0, lerp(8, 14, ramp(f, 117, 140))] }));
      return glide(117, 146, ocam(-1.25, 1.6, 1.55, 1.45, 36), ocam(-1.25, 1.5, 1.55, 1.45, 36))(f); } },
    // science checked -> not quite like that
    { id: 's1-science-high', a: 147, b: 196, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f, { head: [20, 0, 6] }));
      return glide(147, 196, C([0.9, 2.6, 2.7], [0.8, 0.35, -0.45], 44), C([0.85, 2.5, 2.5], [0.8, 0.35, -0.45], 44))(f); }, icons: (f, C0) => icon(check, C0, f, w.checked - 2, 196, -0.35, -0.2, 0.2, 0.5) },
    { id: 's2-happy-lift', a: 197, b: 248, k: 'yard', own: false, run: (f) => faceAt(f, 197, 248, [0.95, 0.68, 1.3], [0.85, 0.66, 1.2], 38, (p) => graze(f, { up: ramp(f, 200, 222), lk: p })) },
    // researchers looked into it
    { id: 'r1-owner-kneels', a: 249, b: 296, k: 'yard', own: true, run: (f) => { graze(f); owner.pose({ ...ownerArgs(f), w: { kneel: 1 }, at: KN, face: KF, head: [18, 0, 6], smile: 0.2 });
      return glide(249, 296, C([2.1, 1.05, 1.6], [0.75, 0.62, -0.35], 42), C([2.0, 1.02, 1.5], [0.75, 0.62, -0.35], 42))(f); } },
    { id: 'r2-low-front', a: 297, b: 346, k: 'yard', own: true, run: (f) => { graze(f); owner.pose({ ...ownerArgs(f), w: { kneel: 1 }, at: KN, face: KF, head: [18, 0, 6], smile: 0.2 });
      return glide(297, 346, C([-0.35, 0.8, 1.9], [0.6, 0.45, -0.35], 40), C([-0.28, 0.78, 1.75], [0.6, 0.45, -0.35], 40))(f); } },
    // 8 in 10 dogs eat plants, grass is the favourite
    { id: 'st1-8in10-wide', a: 347, b: 399, k: 'yard', own: false, run: (f) => { graze(f);
      return glide(347, 399, C([-0.4, 1.0, 2.5], [0.45, 0.3, -0.3], 40), C([-0.32, 0.98, 2.3], [0.45, 0.3, -0.3], 40))(f); } },
    { id: 'st2-plants-bed', a: 400, b: 429, k: 'yard', own: false, run: (f) => faceAt(f, 400, 429, [-0.45, 0.7, -1.0], [-0.4, 0.68, -1.05], 40, () => bedSniff(f), hd, -0.08) },
    { id: 'st3-favourite', a: 430, b: 487, k: 'yard', own: false, run: (f) => { graze(f, { up: ramp(f, 450, 464) * (1 - ramp(f, 478, 487)), lk: V(1.3, 0.75, 1.5) });
      return glide(430, 487, C([1.3, 0.78, 1.5], [0.45, 0.3, -0.05], 38), C([1.2, 0.75, 1.38], [0.45, 0.3, -0.05], 38))(f); } },
    // 1,500+ owners
    { id: 'st4-owner-1500', a: 488, b: 533, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f, { face: lerp(OF, -0.3, ramp(f, 488, 506)), head: [lerp(20, 2, ramp(f, 488, 506)), 0, 0], smile: 0.5 }));
      return glide(488, 533, ocam(0.05, 2.5, 1.5, 1.5, 40), ocam(0.05, 2.3, 1.5, 1.5, 40))(f); } },
    { id: 'st5-owners-wide', a: 534, b: 566, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f, { face: -0.3, head: [4, 0, 0], smile: 0.5 }));
      return glide(534, 566, C([2.2, 1.3, 3.0], [0.8, 0.85, -0.5], 46), C([2.1, 1.28, 2.85], [0.8, 0.85, -0.5], 46))(f); } },
    // fewer than 1 in 10 seemed sick: the puppy trots in happily, lowers its head to the patch on "eating grass"
    { id: 'st6-trot-in', a: 567, b: 632, k: 'yard', own: false, run: (f) => { const t = ramp(f, 567, 632), p = RP.clone().addScaledVector(DIR, -1.6 * (1 - t));
      place(p, Y0); const g = t < 0.98 ? 1 : 0;
      dog.pose({ ...base(f), w: { stand: 1 }, gait: g ? { phase: f * 0.09, amp: 24, lift: 1, k: 1 - ramp(f, 622, 632) } : null, look: p.clone().addScaledVector(DIR, 1).add(V(0, 0.25, 0)), neck: 0.8, aimEyes: true, wag: Math.sin(f * 0.5) * 0.6, tail: 0.5 });
      strand.visible = false; tug = 0; const cx = lerp(p.x + 0.1, RP.x - 0.1, 0.3);
      return { pos: [cx + 0.45, 0.8, p.z + 2.0], look: [cx, 0.32, p.z], fov: 40 }; } },
    { id: 'st7-head-down', a: 633, b: 689, k: 'yard', own: false, run: (f) => { const d = ramp(f, 634, 650); place(RP, Y0);
      dog.pose({ ...base(f), w: { stand: 1 - d, graze: d }, look: V(GRAZE_LOOK.x, lerp(0.25, 0, d), GRAZE_LOOK.z), neck: lerp(0.8, 1, d), aimEyes: d < 0.5, jaw: d * (0.12 + 0.3 * chewJ(f)) }); strand.visible = false; tug = d * chewJ(f) * 0.8;
      return glide(633, 689, C([1.35, 0.75, 1.25], [0.45, 0.28, -0.05], 38), C([1.25, 0.72, 1.12], [0.45, 0.28, -0.05], 38))(f); } },
    // only about 1 in 5 threw up after
    { id: 'st8-1in5-face', a: 690, b: 735, k: 'yard', own: false, run: (f) => faceAt(f, 690, 735, [0.0, 0.62, 1.1], [0.05, 0.6, 1.0], 38, (p) => graze(f, { up: ramp(f, 692, 708), lk: p }), hd, -0.08) },
    { id: 'st9-owner-smile', a: 736, b: 777, k: 'yard', own: true, run: (f) => { owner.pose(ownerArgs(f, { head: [16, 0, lerp(8, 0, ramp(f, 736, 756))], smile: lerp(0.1, 0.6, ramp(f, 736, 756)) }));
      graze(f, { up: 1, lk: owner.info.head.clone() });
      return glide(736, 777, C([0.7, 1.25, 2.4], [0.85, 0.95, -0.45], 44), C([0.72, 1.24, 2.25], [0.85, 0.95, -0.45], 44))(f); } },
    // so why do they do it?
    { id: 'q1-head-tilt', a: 778, b: 806, k: 'yard', own: false, run: (f) => faceAt(f, 778, 806, [0.0, 0.55, 0.85], [0.03, 0.54, 0.78], 36, (p) => { place(RP, Y0); strand.visible = false; tug = 0;
      dog.pose({ ...base(f), w: { stand: 1 }, look: p.clone().add(V(0, 0.12 * Math.sin(ramp(f, 782, 800) * Math.PI), 0)), neck: 0.8, aimEyes: true, ears: lerp(0.1, -0.5, ramp(f, 780, 790)), wag: 0.2 * Math.sin(f * 0.3) }); }, hd, -0.06) },
    { id: 'q2-looks-off', a: 807, b: 846, k: 'yard', own: false, run: (f) => { place(RP, Y0);
      dog.pose({ ...base(f), w: { stand: 1 }, look: V(-2.5, 0.6, -3.0), neck: 0.8, aimEyes: true, ears: -0.3, wag: 0, tail: 0.2 }); strand.visible = false; tug = 0;
      return glide(807, 846, C([1.45, 0.7, 0.85], [-0.4, 0.42, -1.0], 40), C([1.35, 0.68, 0.75], [-0.4, 0.42, -1.0], 40))(f); } },
    // wolves (day forest)
    { id: 'f1-pack-wide', a: 847, b: 881, k: 'forest', run: (f) => glide(847, 881, C([-0.2, 2.0, 4.4], [-0.5, 0.3, -0.1], 48), C([-0.2, 1.9, 4.1], [-0.5, 0.3, -0.1], 48))(f) },
    { id: 'f2-wolf-grazes', a: 882, b: 931, k: 'forest', run: (f) => glide(882, 931, C([0.8, 0.85, 1.45], [GZ[0] + 0.05, 0.32, GZ[1] + 0.4], 40), C([0.7, 0.83, 1.42], [GZ[0] + 0.05, 0.32, GZ[1] + 0.4], 40))(f) },
    { id: 'f3-wolf-front', a: 932, b: 1003, k: 'forest', run: (f) => faceAt(f, 932, 1003, [-0.45, 0.75, 0.75], [-0.55, 0.72, 0.72], 40, () => {}, wolfHead, -0.08) },
    { id: 'f4-broom', a: 1004, b: 1043, k: 'forest', run: (f) => { const bx = broomX(f); return { pos: [bx - 0.15, 0.85, BR.z + 1.5], look: [bx - 0.2, 0.25, BR.z], fov: 42 }; } },
    { id: 'f5-worms-out', a: 1044, b: 1082, k: 'forest', run: (f) => { const bx = broomX(f); return { pos: [bx - 0.35, 0.6, BR.z + 1.05], look: [bx - 0.4, 0.15, BR.z], fov: 40 }; } },
    // instinct still there: wolf / puppy match cut, then the couch
    { id: 'c1-wolf-match', a: 1083, b: 1108, k: 'forest', run: (f) => glide(1083, 1108, C([0.75, 0.85, 1.45], [GZ[0] + 0.05, 0.32, GZ[1] + 0.4], 40), C([0.68, 0.83, 1.42], [GZ[0] + 0.05, 0.32, GZ[1] + 0.4], 40))(f) },
    { id: 'c2-puppy-match', a: 1109, b: 1135, k: 'yard', own: false, run: (f) => { graze(f); return glide(1109, 1135, C([1.3, 0.78, 1.5], [0.45, 0.26, -0.05], 36), C([1.22, 0.76, 1.4], [0.45, 0.26, -0.05], 36))(f); } },
    { id: 'c3-couch-wide', a: 1136, b: 1162, k: 'room', own: true, run: (f) => glide(1136, 1162, C([0.75, 1.35, 1.7], [1.25, 0.85, -1.3], 44), C([0.8, 1.32, 1.55], [1.25, 0.85, -1.3], 44))(f) },
    { id: 'c4-couch-close', a: 1163, b: 1183, k: 'room', own: false, run: (f) => faceAt(f, 1163, 1183, [1.12, 0.92, -0.55], [1.12, 0.9, -0.62], 38, () => {}, hd, -0.06) },
    // just be careful: garden chemicals, toxic plants
    { id: 'k1-careful-owner', a: 1184, b: 1223, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f, { face: lerp(OF, -0.3, ramp(f, 1184, 1200)), head: [lerp(18, 4, ramp(f, 1184, 1200)), 0, 6], smile: 0.1 }));
      return glide(1184, 1223, ocam(0.15, 2.2, 1.5, 1.45, 40), ocam(0.15, 2.05, 1.5, 1.45, 40))(f); }, icons: (f, C0) => icon(warn, C0, f, w.careful - 2, 1223, 0.55, 0.3, 0.14, 0.5) },
    { id: 'k2-chemicals-lawn', a: 1224, b: 1268, k: 'yard', own: false, run: (f) => { const t = ramp(f, 1224, 1268), p = V(-0.6, 0, 0.55).addScaledVector(DIR, 0.25 * t);
      place(p, Y0); dog.pose({ ...base(f), w: { stand: 0.4, graze: 0.6 }, gait: { phase: f * 0.04, amp: 10, lift: 0.6, k: 0.6 }, look: p.clone().addScaledVector(DIR, 0.6), neck: 1, ears: 0.1, wag: 0.2 * Math.sin(f * 0.3) });
      strand.visible = false; tug = 0; return glide(1224, 1268, C([0.1, 1.0, 2.7], [-0.75, 0.2, 0.55], 40), C([0.02, 0.98, 2.55], [-0.8, 0.2, 0.55], 40))(f); },
      icons: (f, C0) => icon(warn, C0, f, w.garden - 4, 1268, 0.0, 0.02, 0.14, 0.5) },
    { id: 'k3-make-sick', a: 1269, b: 1315, k: 'yard', own: false, run: (f) => { const p = V(-0.6, 0, 0.55).addScaledVector(DIR, 0.25);
      return faceAt(f, 1269, 1315, [-1.15, 0.62, 1.4], [-1.12, 0.6, 1.32], 38, (cp) => { place(p, Y0); const up = ramp(f, 1272, 1290); strand.visible = false; tug = 0;
        dog.pose({ ...base(f), w: { stand: 0.4 + 0.6 * up, graze: 0.6 * (1 - up) }, look: p.clone().addScaledVector(DIR, 0.6).lerp(cp, up), neck: 1 - 0.2 * up, aimEyes: up > 0.5, ears: lerp(0.1, -0.3, up), wag: 0 }); }, hd, -0.08); } },
    { id: 'k4-toxic-bed', a: 1316, b: 1347, k: 'yard', own: false, run: (f) => faceAt(f, 1316, 1347, [-0.5, 0.72, -0.95], [-0.45, 0.7, -1.0], 40, () => bedSniff(f), hd, -0.1),
      icons: (f, C0) => icon(warn, C0, f, w.toxic - 6, 1347, -0.5, -0.1, 0.12, 0.5) },
    { id: 'k5-toxic-flowers', a: 1348, b: 1380, k: 'yard', own: false, run: (f) => faceAt(f, 1348, 1380, [1.3, 0.7, -0.55], [1.25, 0.68, -0.6], 38, (p) => bedSniff(f, p, ramp(f, 1352, 1366)), hd, -0.1),
      icons: (f, C0) => icon(warn, C0, f, 1348, 1380, -0.5, -0.05, 0.12, 0.5) },
    // suddenly eats grass desperately, or vomits every time -> see a vet (phone call)
    { id: 'v1-fast-chew', a: 1381, b: 1417, k: 'yard', own: false, run: (f) => { graze(f, { fast: 2 }); return glide(1381, 1417, C([1.45, 0.9, 1.9], [0.45, 0.28, 0.0], 40), C([1.15, 0.75, 1.45], [0.42, 0.26, -0.05], 38))(f); } },
    { id: 'v2-desperate-high', a: 1418, b: 1453, k: 'yard', own: false, run: (f) => { graze(f, { fast: 2.2 }); return glide(1418, 1453, C([0.6, 1.3, 1.05], [0.35, 0.2, -0.1], 36), C([0.58, 1.25, 0.98], [0.35, 0.2, -0.1], 36))(f); } },
    { id: 'v3-owner-concern', a: 1454, b: 1495, k: 'yard', own: true, run: (f) => { graze(f, { fast: 2 }); owner.pose(ownerArgs(f, { head: [24, 0, lerp(6, 16, ramp(f, 1454, 1480))], smile: 0.02 }));
      return glide(1454, 1495, ocam(-1.25, 1.6, 1.55, 1.45, 36), ocam(-1.25, 1.45, 1.55, 1.45, 36))(f); } },
    { id: 'v4-vet-call', a: 1496, b: 1535, k: 'yard', own: true, run: (f) => { graze(f); const r = ramp(f, 1497, 1509);
      owner.reach(ownerArgs(f, { face: -0.45, head: [6, 10, 0], smile: 0.1, phone: r > 0.85 }), { R: ['earR', r] });
      return glide(1496, 1535, ocam(0.0, 2.4, 1.5, 1.5, 40), ocam(0.0, 2.25, 1.5, 1.5, 40))(f); } },
    // does yours prefer tall grass or short grass? (warm close on the puppy sitting by the half-eaten patch)
    { id: 'e1-sit-warm', a: 1536, b: 1578, k: 'yard', own: false, run: (f) => { const cam = glide(1536, 1578, C([1.15, 0.7, 1.75], [0.45, 0.32, -0.05], 40), C([1.08, 0.68, 1.62], [0.45, 0.32, -0.05], 40))(f); sitEnd(f, cam); return cam; } },
    { id: 'e2-push-in', a: 1579, b: TOTAL - 1, k: 'yard', own: false, run: (f) => { const cam = glide(1579, TOTAL - 1, C([0.85, 0.62, 1.4], [0.5, 0.36, 0.0], 38), C([0.75, 0.58, 1.18], [0.5, 0.36, 0.0], 38))(f); sitEnd(f, cam); return cam; } },
  ];
