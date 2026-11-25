# v2 (coordinator review): alive collapsed puppy (belly-down, eyes open, panting), no long static holds, h4 reframe, sitting puppy in the shade
p='web/story.js'; s=open(p,encoding='utf8').read()
R=[
# 3. h4: puppy fully in frame
("{ id: 'h4-owner-glance', a: 101, b: 131, k: 'street', cam: push(track(ox, [1.4, 1.35, 2.3], [0.25, 1.05, 0.05], 38), 101, 131, 0.06) },",
 "{ id: 'h4-owner-glance', a: 101, b: 131, k: 'street', cam: push(track(ox, [1.7, 1.05, 3.1], [0.35, 0.72, 0.15], 40), 101, 131, 0.08) },"),
# 1. flop shot -> exhausted puppy lowers its chin
("{ id: 'g6-flop-side', a: 572, b: 594,","{ id: 'g6-chin-down', a: 572, b: 594,"),
# 2. act fast: shorter push-in on the puppy + owner reacting
("{ id: 'a2-puppy-down-pushin', a: 620, b: 666, k: 'street', cam: glide(620, 666, C([DX + 1.0, 0.5, 1.75], [DX + 0.12, 0.2, DZ], 40), C([DX + 0.97, 0.49, 1.7], [DX + 0.12, 0.2, DZ], 40)) },",
 "{ id: 'a2-puppy-down-pushin', a: 620, b: 642, k: 'street', cam: glide(620, 642, C([DX + 1.0, 0.5, 1.75], [DX + 0.12, 0.2, DZ], 40), C([DX + 0.75, 0.42, 1.35], [DX + 0.12, 0.2, DZ], 40)) },\n    { id: 'a3-owner-reacts', a: 643, b: 666, k: 'street', cam: glide(643, 666, C([OX - 1.05, 1.35, 1.2], [OX, 1.4, OZ], 38), C([OX - 0.85, 1.38, 0.95], [OX, 1.42, OZ], 38)) },"),
("C([OX + 0.15, 1.1, 4.6], [OX - 0.15, 1.1, 0.1], 42)","C([OX + 0.15, 1.12, 4.0], [OX - 0.15, 1.1, 0.1], 42)"),
("C([BUCKET0[0] + 0.86, 0.58, BUCKET0[2] + 0.58], [BUCKET0[0], 0.28, BUCKET0[2]], 40)","C([BUCKET0[0] + 0.62, 0.48, BUCKET0[2] + 0.42], [BUCKET0[0], 0.28, BUCKET0[2]], 40)"),
("{ id: 'r6-trap-heat-face', a: 1230, b: 1285, k: 'street', cam: faceCam(0.25, 1.2, 1.05, 0.12, 36, 1230, 1285, -0.1) },",
 "{ id: 'r6a-trap-heat-face', a: 1230, b: 1257, k: 'street', cam: faceCam(0.25, 1.3, 0.95, 0.12, 36, 1230, 1257, -0.1) },\n    { id: 'r6b-heat-low-side', a: 1258, b: 1285, k: 'street', cam: glide(1258, 1285, C([sx + 1.3, 0.4, sz + 1.5], [sx + 0.1, 0.32, sz + 0.1], 40), C([sx + 1.1, 0.38, sz + 1.25], [sx + 0.1, 0.32, sz + 0.1], 40)) },"),
("{ id: 'v5-puppy-seems-fine', a: 1545, b: 1586, k: 'room', cam: faceCam(1.5, 1.25, 1.1, 0.12, 38, 1545, 1586, -0.08) },",
 "{ id: 'v5-puppy-seems-fine', a: 1545, b: 1565, k: 'room', cam: faceCam(1.5, 1.3, 1.0, 0.12, 38, 1545, 1565, -0.08) },\n    { id: 'v6-puppy-wag-low', a: 1566, b: 1586, k: 'room', cam: glide(1566, 1586, C([0.95, 0.55, 1.9], [0.05, 0.32, 0.35], 40), C([0.8, 0.5, 1.65], [0.05, 0.32, 0.35], 40)) },"),
# p1: STOP hand gesture
("""      owner.pose({ ...base, w: { stand: 1 }, at: [OX, OZ], face: lerp(Math.PI / 2 - 0.9, tf, turn), head: [lerp(24, 26, turn), lerp(-25, 0, turn), lerp(0, 8, ramp(f, 640, 660))] });
      return;""","""      const args = { ...base, w: { stand: 1 }, at: [OX, OZ], face: lerp(Math.PI / 2 - 0.9, tf, turn), head: [lerp(24, 26, turn) - 14 * ramp(f, 668, 680), lerp(-25, 0, turn), lerp(0, 8, ramp(f, 640, 660))] };
      const stop = ramp(f, 669, 681) * (1 - ramp(f, 704, 716));   // "stop": left palm up and out
      owner.pose(args);
      const fw = V(Math.sin(args.face), 0, Math.cos(args.face));
      owner.reach(args, stop > 0 ? { L: [owner.info.chest.clone().addScaledVector(fw, 0.38).add(V(0, 0.12, 0)), stop] } : {});
      return;"""),
("const hd = dog.boneWorld('head'), top = dog.boneWorld('top');\n      owner.reach(args, pet > 0 ? { R: [hd.clone().lerp(top, 0.5 + 0.5 * Math.sin((f - 738) * 0.2)).add(V(0, 0.08, 0)), pet] } : {});",
 "const top = dog.boneWorld('top'), sp = dog.boneWorld('sp3');\n      owner.reach(args, pet > 0 ? { R: [top.clone().lerp(sp, 0.5 + 0.5 * Math.sin((f - 738) * 0.2)).add(V(0, 0.06, 0)), pet] } : {});"),
# 1. alive collapsed puppy
("""    if (f < w.two) {   // refuses to get up (head down, turned away from the pull), then flops onto its side and stays there
      const flop = ramp(f, 574, 590);
      dog.root.position.set(DX, 0, DZ); dog.root.rotation.set(0, Math.PI / 2, 0); dog.root.updateMatrixWorld(true);
      dog.pose({ ...base, ...pant(f, 1), w: { down: 1 - flop, flop }, roll: 90 * flop, counter: 70 * (1 - flop), lift: -25 * (1 - flop),
        look: flop > 0.5 ? null : dog.root.localToWorld(V(0.35, -0.2, 0.7)), blink: flop > 0.5 ? 0.6 : 0.3, ears: 0.5 });
      return;""","""    if (f < w.two) {   // exhausted, belly-down, eyes open, heavy panting: refuses the pull (head turned away), rests its chin low, lifts its head again
      const away = 1 - ramp(f, 566, 580), rest = ramp(f, 576, 590) * (1 - ramp(f, 636, 652)), bob = 0.03 * Math.sin(f * 0.9);
      dog.root.position.set(DX, 0, DZ); dog.root.rotation.set(0, Math.PI / 2, 0); dog.root.updateMatrixWorld(true);
      dog.pose({ ...base, ...pant(f, 1), w: { down: 1 }, look: dog.root.localToWorld(V(0.35 * away, lerp(0.02, -0.22, rest) + bob, 0.8)), neck: lerp(0.7, 0.5, rest), ears: 0.5 });
      return;"""),
("""      dog.pose({ ...base, ...pant(f, 1), w: { flop: 1 - up, stand: up }, roll: 90 * (1 - up), counter: 70 * up, lift: -25 * up,
        gait: L.k > 0.02 ? { phase: L.dist / 0.3, amp: 18 * L.k, lift: L.k, k: 1 } : null, look: up > 0.5 ? fwdLook(0.0) : null, blink: up > 0.5 ? base.blink : 0.6 });""",
 """      dog.pose({ ...base, ...pant(f, 1), w: { down: 1 - up, stand: up },
        gait: L.k > 0.02 ? { phase: L.dist / 0.3, amp: 18 * L.k, lift: L.k, k: 1 } : null, look: fwdLook(0.0) });"""),
# 4. shade: the puppy sits (reads as a puppy, not long and low) and turns its head now and then
("""    dog.pose({ ...base, ...pant(f, lerp(1, 0.55, cool)), w: { stand: 1 - down, down }, gait: turn > 0 && turn < 1 ? { phase: f * 0.08, amp: 14, lift: 1, k: 1 } : null,
      look: V(sx + 1.2, 0.3, sz + 2.5), neck: 0.6, ears: 0.3, blink: blinkAt(f + 20), wag: ramp(f, 1180, 1200) * Math.sin(f * 0.5) * 0.3 });""",
 """    const sway = f > 1230 ? 0.7 * Math.sin((f - 1230) * 0.07) : 0;
    dog.pose({ ...base, ...pant(f, lerp(1, 0.55, cool)), w: { stand: 1 - down, sit: down }, gait: turn > 0 && turn < 1 ? { phase: f * 0.08, amp: 14, lift: 1, k: 1 } : null,
      look: V(sx + 1.2 + sway, 0.45, sz + 2.5), neck: 0.6, ears: 0.3, blink: blinkAt(f + 20), wag: ramp(f, 1180, 1200) * Math.sin(f * 0.5) * 0.3 });"""),
("hip = sp.clone().add(sp.clone().sub(n2).multiplyScalar(0.7))","hip = sp.clone().add(sp.clone().sub(n2).multiplyScalar(0.4))"),
# 2. seems fine: head turns, bigger wag
(".lerp(V(-0.2, 0.3, 2.0), fine);",".lerp(V(-0.2 + 0.5 * Math.sin((f - 1530) * 0.08) * fine, 0.3, 2.0), fine);"),
("wag: fine * Math.sin(f * 0.4) * 0.4, tail: 0.2 * fine","wag: fine * Math.sin(f * 0.5) * 0.8, tail: 0.5 * fine"),
("sag: f >= w.refusing && f < 574 ? 0.05","sag: f >= w.refusing && f < 566 ? 0.05"),
]
for a,b in R:
    c=s.count(a); assert c==1, (a[:70],c); s=s.replace(a,b)
open(p,'w',encoding='utf8').write(s); print('ok')
