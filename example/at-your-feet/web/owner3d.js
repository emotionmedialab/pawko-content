// ================= 3D dog OWNER in the kit's toon style (round head, chunky pyjamas, mustard bobble cap), posed for the bed =================
// Own design: warm coral pyjamas, mustard beanie with a cream band and a bobble, cream socks. Inked by the project's post-process.
//
//   import { createOwner, OWNER_POSES } from './owner3d.js';
//   const owner = createOwner(THREE, scene, { toon });                         // main.js, once
//   owner.pose({ w:{ sleep:0.7, side:0.3 }, breath, blink, smile, ik:{ L:Vector3, R:Vector3 } });   // every frame
//   room.set({ cover:-0.4, caps: owner.capsules() });                            // bedroom3d.js: the duvet drapes over the body (no clipping)
//
// Pose = weighted blend of the named poses in OWNER_POSES (weights are normalised, default { sleep:1 }), same idea as dogrig.js:
//   sleep (on the back, head on the pillow, arms by the sides)   side (rolled onto the right side toward the lamp, -x)
//   sit (sitting up against the pillows, legs stretched under the duvet)   hug (sit + head tipped down + big smile)
// owner.setCap('sleep'|'day'): soft white sleep cap with a brown bobble (default) / white-and-brown brim cap like the trainer's.
// Extra params: breath 0..1 (chest rise; use 0.5+0.5*sin), blink 0..1 (overrides the pose's eyes: 1 = shut), smile 0..1,
//   ik: { L, R } world points (THREE.Vector3) the left / right HAND must reach (2-bone IK, the arm stretches to its limit if too far).
// Poses are in bedroom3d.js room space (bed at the origin, mattress top 0.52). Units: metres, degrees.
// owner.capsules() -> [[a,b,r]...] world capsules for bedroom3d's duvet (pelvis, legs, feet, arms resting on the bed, torso only while lying down); owner.points() -> { chest, head, handL, handR, pelvis }.
// Left = the owner's left: with the owner lying on the back, head toward the headboard, that is +x.
import { BED } from './bedroom3d.js';

const rad = (d) => d * Math.PI / 180;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const COL = { skin: '#f6d0ac', skinD: '#e6a98a', top: '#ee7b6d', pants: '#e2675d', trim: '#fff1dc', white: '#f6f3ec', brown: '#7a4e33', brownD: '#53321f', dark: '#2b1d1d', sock: '#f6efe2', blush: '#f2808a', mouth: '#a8383c', hair: '#6a4a38' };
const D = { px: 0, py: 0, pz: 0, pitch: 0, spin: 0, yaw: 0, spine: 0, headUp: 0, hp: 0, hy: 0, hr: 0,
  lsp: 0, lsa: 10, le: 10, rsp: 0, rsa: 10, re: 10, lhf: 0, lha: 5, lk: 0, rhf: 0, rha: 5, rk: 0, blink: 0, smile: 0.3 };
export const OWNER_POSES = {
  sleep: { ...D, px: -0.1, py: BED.top + 0.17, pz: 0.02, pitch: -90, headUp: 0.14, hp: -6, le: 22, re: 22, blink: 1, smile: 0.15 },
  side: { ...D, px: -0.22, py: BED.top + 0.2, pz: 0.02, pitch: -90, spin: -90, headUp: 0.08, hp: -4, lsp: 25, lsa: 14, le: 40, rsp: 5, rsa: 10, re: 70, lhf: 14, lk: 28, rhf: 6, rk: 22, blink: 1, smile: 0.15 },
  sit: { ...D, px: -0.05, py: BED.top + 0.14, pz: -0.58, spine: -6, hp: 4, lsp: 8, lsa: 12, le: 20, rsp: 8, rsa: 12, re: 20, lhf: 85, lha: 6, lk: 8, rhf: 85, rha: 6, rk: 8, blink: 0, smile: 0.35 },
  hug: { ...D, px: -0.05, py: BED.top + 0.14, pz: -0.58, spine: 4, hp: 14, lsp: 8, lsa: 12, le: 20, rsp: 8, rsa: 12, re: 20, lhf: 85, lha: 6, lk: 8, rhf: 85, rha: 6, rk: 8, blink: 0.75, smile: 1 },
};
const KEYS = Object.keys(D);

export const createOwner = (THREE, scene, { toon = (o) => new THREE.MeshToonMaterial(o) } = {}) => {
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const root = new THREE.Group(); root.name = 'owner'; scene.add(root);
  const M = {}; for (const k in COL) M[k] = toon({ color: COL[k] });
  const mk = (geo, mat, parent = root, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const ball = (r, mat, parent, x, y, z, sx = 1, sy = 1, sz = 1) => mk(new THREE.SphereGeometry(r, 20, 14), mat, parent, x, y, z, sx, sy, sz);
  const tube = (rTop, rBot, mat) => mk(new THREE.CylinderGeometry(rTop, rBot, 1, 14, 1), mat);   // unit-length tube, stretched between two joints
  const LEN = { thigh: 0.34, shin: 0.32, upper: 0.26, fore: 0.25 };

  // ---------- body ----------
  mk(new THREE.SphereGeometry(1, 20, 14), M.pants, root, 0, 0, 0, 0.2, 0.13, 0.17);                      // pelvis
  const spine = new THREE.Group(); spine.position.set(0, 0.06, 0); root.add(spine);
  mk(new THREE.CapsuleGeometry(0.18, 0.3, 8, 18), M.top, spine, 0, 0.24, 0, 1.1, 1, 0.95);                  // torso
  mk(new THREE.CylinderGeometry(0.19, 0.2, 0.03, 20), M.trim, spine, 0, 0.0, 0, 1.05, 1, 0.9);                // hem band
  for (const y of [0.18, 0.3]) ball(0.017, M.trim, spine, 0, y, 0.17);                                       // buttons
  const neck = new THREE.Group(); neck.position.set(0, 0.5, 0); spine.add(neck);
  mk(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 14), M.skin, neck, 0, 0.03, 0);
  const head = new THREE.Group(); head.position.set(0, 0.07, 0.0); neck.add(head);
  const HR = 0.155, HY = 0.16;   // head radius, head centre height above the head pivot (round head like the Pawko trainer, smaller than before)
  ball(HR, M.skin, head, 0, HY, 0.0, 1.04, 1, 1);                                                           // round head
  for (const s of [-1, 1]) ball(0.035, M.skin, head, s * 0.155, HY - 0.01, 0, 0.6, 1, 0.8);                  // ears
  const eyes = [-1, 1].map((s) => ball(0.02, M.dark, head, s * 0.06, HY + 0.02, 0.138, 1, 1.5, 0.4));          // big oval eyes
  const glints = [-1, 1].map((s) => ball(0.007, M.white, head, s * 0.06 + 0.006, HY + 0.034, 0.15));           // eye highlights (hidden when the eyes are shut)
  for (const s of [-1, 1]) { const br = mk(new THREE.BoxGeometry(0.04, 0.008, 0.01), M.hair, head, s * 0.062, HY + 0.075, 0.13); br.rotation.z = -s * 0.2; }   // brows
  ball(0.016, M.skinD, head, 0, HY - 0.012, 0.155);                                                         // nose
  for (const s of [-1, 1]) { const c = mk(new THREE.CircleGeometry(0.034, 14), M.blush, head, s * 0.098, HY - 0.025, 0.122); c.rotation.y = s * 0.8; }   // rosy cheeks
  const mouth = mk(new THREE.CircleGeometry(0.032, 16, Math.PI, Math.PI), M.mouth, head, 0, HY - 0.05, 0.142);    // open smile (lower half-disc)
  // cap: 'sleep' = soft white sleep cap with a brown band + bobble; 'day' = white-front / brown-back cap with a brown brim (the trainer's cap)
  const capG = new THREE.Group(); capG.position.set(0, HY + 0.045, -0.005); capG.rotation.x = -0.2; head.add(capG);
  const CR = 0.17, front = mk(new THREE.SphereGeometry(CR, 24, 12, -Math.PI / 2, Math.PI, 0, Math.PI / 2), M.white, capG), back = mk(new THREE.SphereGeometry(CR, 24, 12, Math.PI / 2, Math.PI, 0, Math.PI / 2), M.white, capG);
  const band = mk(new THREE.TorusGeometry(CR, 0.028, 10, 28), M.brown, capG); band.rotation.x = Math.PI / 2;
  const bobble = ball(0.05, M.brown, capG, 0, CR + 0.02, 0), brim = mk(new THREE.SphereGeometry(1, 20, 8), M.brownD, capG, 0, -0.01, CR * 0.95, 0.16, 0.014, 0.12);
  const setCap = (kind) => { const day = kind === 'day'; back.material = day ? M.brown : M.white; bobble.visible = !day; brim.visible = day; };
  setCap('sleep');
  for (const s of [-1, 1]) ball(0.05, M.hair, head, s * 0.115, HY - 0.01, -0.07, 1, 1.1, 1);                   // hair at the sides
  ball(0.06, M.hair, head, 0, HY + 0.01, -0.11);

  // ---------- limbs: tubes stretched between joint points (like legs3d.js) ----------
  const limb = (side) => ({
    upper: tube(0.075, 0.066, M.top), fore: tube(0.066, 0.058, M.top), elbow: ball(0.066, M.top, root), shoulder: ball(0.08, M.top, root), cuff: tube(0.062, 0.062, M.trim), hand: ball(1, M.skin, root, 0, 0, 0, 0.062, 0.085, 0.05), thumb: ball(0.032, M.skin, root),
    thigh: tube(0.1, 0.08, M.pants), shin: tube(0.075, 0.062, M.pants), knee: ball(0.08, M.pants, root), ankle: ball(0.062, M.pants, root), foot: ball(0.065, M.sock, root, 0, 0, 0, 0.95, 0.75, 1.8), side });
  const A = { L: limb(1), R: limb(-1) };
  const up = V(0, 1, 0), v = V(), q = new THREE.Quaternion();
  const span = (m, a, b) => { v.subVectors(b, a); const len = v.length(); m.position.copy(a).addScaledVector(v, 0.5); m.quaternion.copy(q.setFromUnitVectors(up, v.divideScalar(len || 1))); m.scale.set(1, len || 1e-4, 1); };
  const Qx = (d) => new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), rad(d)), Qz = (d) => new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), rad(d)), Qy = (d) => new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), rad(d));
  const dirOf = (qq) => V(0, -1, 0).applyQuaternion(qq);
  const info = { L: {}, R: {}, chest: V(), head: V(), pelvis: V(), torsoA: V(), torsoB: V(), lying: false };
  const W = (p) => root.localToWorld(p.clone());

  const pose = (o = {}) => {
    const w = { ...(o.w || { sleep: 1 }) }; let sum = 0; for (const k in w) sum += w[k]; sum = sum || 1;
    const p = {}; for (const k of KEYS) p[k] = 0; for (const k in w) { const P = OWNER_POSES[k]; for (const key of KEYS) p[key] += P[key] * w[k] / sum; }
    if (o.blink !== undefined) p.blink = o.blink; if (o.smile !== undefined) p.smile = o.smile;
    // root placement: yaw about the vertical, then lie down (pitch), then spin about the body's own long axis
    root.position.set(p.px, p.py, p.pz);
    root.quaternion.copy(Qy(p.yaw)).multiply(Qx(p.pitch)).multiply(Qy(p.spin));
    spine.rotation.set(rad(p.spine), 0, 0); const b = o.breath || 0; spine.scale.set(1 + 0.02 * b, 1 + 0.012 * b, 1 + 0.05 * b);
    root.updateMatrixWorld(true);
    // head: lifted by `headUp` metres in WORLD space (resting on the pillow), nods / turns / tilts
    const inv = new THREE.Quaternion().multiplyQuaternions(root.quaternion, spine.quaternion).invert();
    neck.position.set(0, 0.5, 0).add(V(0, p.headUp, 0).applyQuaternion(inv));
    head.rotation.set(rad(p.hp), rad(p.hy), rad(p.hr));
    const k = 1 - clamp(p.blink); eyes.forEach((e) => { e.scale.y = 0.2 + 1.3 * k; }); glints.forEach((g) => { g.visible = k > 0.5; });
    mouth.scale.set(0.7 + 0.5 * p.smile, 0.25 + 0.9 * p.smile, 1);
    root.updateMatrixWorld(true);
    // joints in root space
    const sm = spine.matrix, sq = spine.quaternion;
    for (const key of ['L', 'R']) {
      const s = key === 'L' ? 1 : -1, a = A[key], I = info[key], pre = key === 'L' ? 'l' : 'r';
      // arm
      const S = V(s * 0.215, 0.39, 0).applyMatrix4(sm);
      let E, H;
      if (o.ik && o.ik[key]) {
        const T = root.worldToLocal(o.ik[key].clone()), dv = T.clone().sub(S), d = Math.min(dv.length(), 0.999 * (LEN.upper + LEN.fore)); dv.normalize();
        const pole = V(s * 0.8, -0.7, -0.35).applyQuaternion(sq); pole.addScaledVector(dv, -pole.dot(dv)).normalize();
        const aa = (LEN.upper ** 2 - LEN.fore ** 2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, LEN.upper ** 2 - aa * aa));
        E = S.clone().addScaledVector(dv, aa).addScaledVector(pole, hh); H = S.clone().addScaledVector(dv, d);
      } else {
        const qs = sq.clone().multiply(Qz(s * p[pre + 'sa'])).multiply(Qx(-p[pre + 'sp'])); E = S.clone().addScaledVector(dirOf(qs), LEN.upper);
        H = E.clone().addScaledVector(dirOf(qs.clone().multiply(Qx(-p[pre + 'e']))), LEN.fore);
      }
      span(a.upper, S, E); span(a.fore, E, H); a.elbow.position.copy(E); a.shoulder.position.copy(S);
      const fd = H.clone().sub(E).normalize(); span(a.cuff, H.clone().addScaledVector(fd, -0.06), H.clone().addScaledVector(fd, -0.005));
      a.hand.position.copy(H).addScaledVector(fd, 0.06); a.hand.quaternion.setFromUnitVectors(up, fd); a.thumb.position.copy(a.hand.position).add(V(-s * 0.05, 0.015, 0.02).applyQuaternion(a.hand.quaternion));
      // leg
      const Hp = V(s * 0.09, -0.02, 0), qh = Qz(s * p[pre + 'ha']).multiply(Qx(-p[pre + 'hf'])), K = Hp.clone().addScaledVector(dirOf(qh), LEN.thigh), q2 = qh.clone().multiply(Qx(p[pre + 'k'])), An = K.clone().addScaledVector(dirOf(q2), LEN.shin);
      span(a.thigh, Hp, K); span(a.shin, K, An); a.knee.position.copy(K); a.ankle.position.copy(An); a.foot.position.copy(An).add(V(0, 0, 0.05).applyQuaternion(q2).add(V(0, -0.02, 0).applyQuaternion(q2))); a.foot.quaternion.copy(q2);
      Object.assign(I, { S: W(S), E: W(E), H: W(H), hip: W(Hp), K: W(K), A: W(An), T: W(An.clone().add(V(0, -0.02, 0.13).applyQuaternion(q2))) });
    }
    root.updateMatrixWorld(true);
    info.pelvis = W(V(0, 0, 0)); info.chest = spine.localToWorld(V(0, 0.34, 0.1)); info.head = head.localToWorld(V(0, HY, 0));
    info.torsoA = spine.localToWorld(V(0, 0.0, 0)); info.torsoB = spine.localToWorld(V(0, 0.46, 0));
    info.lying = info.torsoB.y < BED.top + 0.5;
  };
  /** world capsules [a, b, r] for bedroom3d's duvet: pelvis, thighs, shins (+ torso while lying down) */
  const capsules = () => {
    const c = [[info.pelvis.clone().add(V(0, 0, 0)), info.pelvis.clone().add(V(0, 0, 0.001)), 0.15]];
    for (const k of ['L', 'R']) { const I = info[k]; c.push([I.hip, I.K, 0.085], [I.K, I.A, 0.065], [I.A, I.T, 0.065]);
      if (I.E.y < BED.top + 0.5 && I.H.y < BED.top + 0.5) c.push([I.E, I.H, 0.07]); }   // an arm resting on the mattress goes under the duvet too
    if (info.lying) c.push([info.torsoA, info.torsoB, 0.175]);
    return c;
  };
  const points = () => ({ chest: info.chest.clone(), head: info.head.clone(), pelvis: info.pelvis.clone(), handL: info.L.H.clone(), handR: info.R.H.clone() });
  pose();
  return { root, pose, capsules, points, info, head, setCap, M };
};
