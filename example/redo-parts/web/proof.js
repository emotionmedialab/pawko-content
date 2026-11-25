// Proof scenes for the redo parts. Each PROOFS[x](ctx) builds its scene and returns { TOTAL, frame(f) -> camera, after?(f) }.
import { createOwner, STRIDE } from './owner3d.js';
import { createStreet, SHADE } from './street3d.js';
import { createBucket, createWater, createLeash } from './props3d.js';
import { createCaptions } from './captions.js';
import { createLiving, FAN, SPOT } from './living3d.js';
import { createEntry, MAT } from './entry3d.js';
import { createYard, CHEW } from './yard3d.js';
import { createForest, greyWolf, CLUMP } from './forest3d.js';
import { makeDog } from './dogrig.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const ramp = (f, a, b) => sm((f - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const breathe = (f) => 0.5 + 0.5 * Math.sin(f * 0.16);
const blinkAt = (f) => ((f % 70) < 3 ? 1 : 0);
const testGround = (THREE, scene, toon) => {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), toon({ color: '#9cc58a' })); g.rotation.x = -Math.PI / 2; g.receiveShadow = true; scene.add(g);
  scene.add(new THREE.HemisphereLight('#fff6e4', '#c9b49a', 1.9)); const k = new THREE.DirectionalLight('#fff0d4', 2.6); k.position.set(-2.4, 3.6, 2.8); k.castShadow = true; scene.add(k);
  scene.background = new THREE.Color('#e7d9c4');
};

const dayOwner = (THREE, scene, toon) => { const o = createOwner(THREE, scene, { toon }); o.setOutfit('day'); o.setCap('day'); o.setShoes(true); return o; };
const pant = (f, k = 1) => ({ jaw: k * (0.5 + 0.25 * Math.sin(f * 0.9)), tongue: k, breath: 0.5 + 0.5 * Math.sin(f * 0.9) });   // heavy panting recipe

export const PROOFS = {
  // (a) hot walk: owner + puppy on a leash along the sunny path, heat shimmer, the puppy pants, slows, lies down and flops on its side; owner stops, turns, "1 STOP"
  async a({ THREE, scene, renderer, toon, dog }) {
    const street = createStreet(THREE, scene, { toon }), owner = dayOwner(THREE, scene, toon), leash = createLeash(THREE, scene, { toon });
    const cap = createCaptions(THREE, renderer, {}); cap.step({ n: 1, text: 'STOP', a: 112, b: 159, at: [540, 300] }); cap.pop({ text: 'PANT! PANT!', a: 30, b: 70, at: [560, 330], angle: -6, size: 120 });
    const V = (x, y, z) => new THREE.Vector3(x, y, z), SPD = 0.026, X0 = -2.2;
    return { TOTAL: 160, after: (f) => cap.render(f), frame(f) {
      // owner: walks until ~f 84 (eases to a stop), then turns toward the puppy and looks down
      const go = 1 - ramp(f, 76, 96), dist = (() => { let d = 0; for (let i = 0; i < f; i++) d += SPD * (1 - ramp(i, 76, 96)); return d; })();
      const ox = X0 + dist, turn = ramp(f, 90, 112);
      owner.pose({ w: { stand: 1 }, at: [ox, -0.22], face: lerp(Math.PI / 2, -0.6, turn), walk: { phase: dist / STRIDE, k: go }, head: [lerp(0, 22, turn), 0, 0], breath: breathe(f), blink: blinkAt(f), smile: lerp(0.3, 0.05, turn) });
      // puppy: trots at the owner's right (camera side), slows (stops ~f 72), lies down (72-92), flops onto its side (92-112)
      const dgo = 1 - ramp(f, 50, 66); let dd = 0; for (let i = 0; i < f; i++) dd += SPD * (1 - ramp(i, 50, 66));
      const dx = X0 + 0.45 + dd, down = ramp(f, 66, 86), flop = ramp(f, 86, 106);
      dog.root.position.set(dx, 0, 0.42); dog.root.rotation.set(0, Math.PI / 2, 0); dog.root.updateMatrixWorld(true);
      dog.pose({ ...pant(f), w: { stand: 1 - down, down: down * (1 - flop), flop }, roll: 90 * flop, counter: 70 * (1 - flop), lift: -25 * (1 - flop), gait: dgo > 0.02 ? { phase: dd / 0.3, amp: 22 * dgo, lift: dgo, k: 1 } : null,
        look: dog.root.localToWorld(V(0, lerp(0.1, -0.3, down), 1.0)), neck: 0.7, aimEyes: true, ears: 0.4, blink: flop > 0.5 ? 0.6 : blinkAt(f + 20), tail: -0.3, wag: 0 });
      leash.set({ a: owner.info.R.H, b: dog.boneWorld('n2'), sag: lerp(0.3, 0.8, ramp(f, 56, 90)) });
      const cx = lerp(X0 + 0.3, X0 + 2.3, ramp(f, 0, 110)), cam = [cx, 1.05, 4.7];
      street.set({ t: f / 30, heat: 1, shade: 0, focusX: cx, cam });
      return { pos: cam, look: [cx, 0.88, 0], fov: 40 };
    } };
  },

  // (b) shade + water: the puppy lies in the tree's shadow pool (it turns cool blue, "2 SHADE"), the owner pours a bucket of cool water over its back ("3 WATER")
  async b({ THREE, scene, renderer, toon, dog }) {
    const street = createStreet(THREE, scene, { toon }), owner = dayOwner(THREE, scene, toon), bucket = createBucket(THREE, scene, { toon }), water = createWater(THREE, scene, { toon });
    const cap = createCaptions(THREE, renderer, {}); cap.step({ n: 2, text: 'SHADE', a: 12, b: 70, at: [540, 300] }); cap.step({ n: 3, text: 'WATER', a: 92, b: 179, at: [540, 300] });
    const V = (x, y, z) => new THREE.Vector3(x, y, z), [sx, sz] = SHADE.spot;
    return { TOTAL: 180, after: (f) => cap.render(f), frame(f) {
      const pour = ramp(f, 96, 120) * (1 - ramp(f, 160, 176)), flow = ramp(f, 108, 116) * (1 - ramp(f, 156, 164));
      // puppy lying in the shade, panting (less once it is wet)
      dog.root.position.set(sx + 0.15, 0, sz + 0.15); dog.root.rotation.set(0, -0.35, 0); dog.root.updateMatrixWorld(true);
      dog.pose({ ...pant(f, lerp(1, 0.6, ramp(f, 120, 170))), w: { down: 1 }, look: V(sx + 1.2, 0.3, sz + 2.5), neck: 0.6, aimEyes: true, ears: 0.3, blink: blinkAt(f + 20), wag: ramp(f, 150, 170) * Math.sin(f * 0.5) * 0.4 });
      // owner: stands behind-left of the puppy, holds the bucket at the hips, tips it over the puppy's back
      const at = [sx - 0.5, sz - 0.25], face = 1.25, fw = V(Math.sin(face), 0, Math.cos(face));
      const bpos = V(at[0], 0, at[1]).addScaledVector(fw, 0.42 + 0.1 * pour); bpos.y = lerp(0.42, 0.55, pour);
      bucket.set({ at: [bpos.x, bpos.y, bpos.z], yaw: face, tilt: 1.5 * pour, water: 1 - 0.8 * ramp(f, 110, 160) });
      const bp = bucket.pts();
      owner.pose({ w: { stand: 1 - pour * 0.7, pour: pour * 0.7 }, at, face, head: [lerp(10, 30, pour), 0, 0], breath: breathe(f), blink: blinkAt(f), smile: 0.4, ik: { R: bp.handle, L: bp.base } });
      const back = dog.boneWorld('sp3').add(V(0, 0.06, 0));
      water.set({ from: bp.lip, to: back, amt: flow, t: f / 30, splash: flow, puddle: ramp(f, 112, 170) });
      const c = ramp(f, 0, 180), cam = [lerp(sx + 0.75, sx + 0.6, c), 1.2, lerp(4.4, 4.1, c)];
      street.set({ t: f / 30, heat: lerp(0.8, 0.3, ramp(f, 10, 60)), shade: ramp(f, 14, 44), focusX: sx, cam });
      return { pos: cam, look: [sx - 0.15, 0.8, sz], fov: 44 };
    } };
  },

  // (g) owner pose gallery (day outfit): stand -> walk cycle -> arms folded + look away -> phone at the ear -> crouch -> kneel + reach -> pour stance -> stand
  async g({ THREE, scene, renderer, toon, dog }) {
    testGround(THREE, scene, toon); dog.root.visible = false;
    const owner = dayOwner(THREE, scene, toon), cap = createCaptions(THREE, renderer, {});
    const K = ['stand', 'walk', 'fold', 'phone', 'crouch', 'kneel', 'pour', 'stand'], N = 30;
    K.forEach((k, i) => cap.pop({ text: k, a: i * N + 4, b: i * N + N - 3, at: [540, 1500], angle: 0, size: 90 }));
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    return { TOTAL: K.length * N, after: (f) => cap.render(f), frame(f) {
      const i = Math.floor(f / N), t = ramp(f % N, 0, 10), prev = K[Math.max(0, i - 1)], cur = K[i];
      const W = (k) => (k === 'walk' || k === 'fold' || k === 'phone' ? 'stand' : k);
      const w = {}; w[W(prev)] = (w[W(prev)] || 0) + 1 - t; w[W(cur)] = (w[W(cur)] || 0) + t;
      const amt = (k) => (cur === k ? t : 0) + (prev === k ? 1 - t : 0);
      const args = { w, at: [0, 0], face: cur === 'walk' || prev === 'walk' ? lerp(0.5, 1.3, amt('walk')) : 0.5, walk: { phase: f / 24, k: amt('walk') }, head: [0, 60 * amt('fold'), 0], breath: breathe(f), blink: blinkAt(f), phone: amt('phone') > 0.85 };
      owner.reach(args, { L: ['foldL', amt('fold')], R: amt('fold') ? ['foldR', amt('fold')] : ['earR', amt('phone')] });
      if (cur === 'kneel') owner.reach(args, { R: [V(0.35, 0.35, 0.55), t] });
      return { pos: [0.3, 1.0, 3.7], look: [0, 0.82, 0], fov: 40 };
    } };
  },
  // (h) puppy pose gallery (dogrig additions): stand -> pant (tongue) -> jump up -> graze + chew -> lie down -> collapsed on the side -> pretty
  async h({ THREE, scene, renderer, toon, dog }) {
    testGround(THREE, scene, toon); const cap = createCaptions(THREE, renderer, {});
    const V = (x, y, z) => new THREE.Vector3(x, y, z), N = 34;
    const K = [['stand', { stand: 1 }], ['pant', { stand: 1 }], ['jump', { jump: 1 }], ['graze', { graze: 1 }], ['down', { down: 1 }], ['flop (side)', { flop: 1 }], ['pretty', { pretty: 1 }]];
    K.forEach(([k], i) => cap.pop({ text: k, a: i * N + 4, b: i * N + N - 3, at: [540, 1500], angle: 0, size: 90 }));
    return { TOTAL: K.length * N, after: (f) => cap.render(f), frame(f) {
      const i = Math.floor(f / N), t = ramp(f % N, 0, 12), [pk, pw] = K[Math.max(0, i - 1)], [ck, cw] = K[i];
      const w = {}; for (const k in pw) w[k] = (w[k] || 0) + pw[k] * (1 - t); for (const k in cw) w[k] = (w[k] || 0) + cw[k] * t;
      const side = (ck === 'flop (side)' ? t : 0) + (pk === 'flop (side)' ? 1 - t : 0), gz = (ck === 'graze' ? t : 0) + (pk === 'graze' ? 1 - t : 0), pa = (ck === 'pant' ? t : 0) + (pk === 'pant' ? 1 - t : 0);
      const hop = ck === 'jump' ? 0.05 * Math.max(0, Math.sin((f % N) / N * Math.PI * 3)) : 0;
      dog.root.position.set(0, hop, 0); dog.root.rotation.set(0, 0.9, 0); dog.root.updateMatrixWorld(true);
      const lk = gz > 0.5 ? dog.root.localToWorld(V(0, 0, 0.3)) : ck === 'jump' ? V(0.6, 0.9, 1.6) : V(1.0, 0.35, 2.2);
      dog.pose({ ...pant(f, pa), w, roll: 90 * side, counter: 70 * (1 - side), lift: -25 * (1 - side), look: side > 0.5 ? null : lk, neck: gz > 0.5 ? 1 : 0.8, aimEyes: gz < 0.5,
        jaw: pa ? pant(f, pa).jaw : gz * (0.15 + 0.3 * (0.5 + 0.5 * Math.sin(f * 0.7))), blink: side > 0.5 ? 1 : blinkAt(f), wag: Math.sin(f * 0.4) * 0.5 * (1 - side), tail: 0.2 });
      return { pos: [0.9, 0.55, 1.6], look: [0, 0.24, 0], fov: 38 };
    } };
  },

  // (a) hot walk: owner + puppy on a leash along the sunny path, heat shimmer, the puppy pants, slows, lies down and flops on its side; owner stops, turns, "1 STOP"
  async a({ THREE, scene, renderer, toon, dog }) {
    const street = createStreet(THREE, scene, { toon }), owner = dayOwner(THREE, scene, toon), leash = createLeash(THREE, scene, { toon });
    const cap = createCaptions(THREE, renderer, {}); cap.step({ n: 1, text: 'STOP', a: 112, b: 159, at: [540, 300] }); cap.pop({ text: 'PANT! PANT!', a: 30, b: 70, at: [560, 330], angle: -6, size: 120 });
    const V = (x, y, z) => new THREE.Vector3(x, y, z), SPD = 0.026, X0 = -2.2;
    return { TOTAL: 160, after: (f) => cap.render(f), frame(f) {
      // owner: walks until ~f 84 (eases to a stop), then turns toward the puppy and looks down
      const go = 1 - ramp(f, 76, 96), dist = (() => { let d = 0; for (let i = 0; i < f; i++) d += SPD * (1 - ramp(i, 76, 96)); return d; })();
      const ox = X0 + dist, turn = ramp(f, 90, 112);
      owner.pose({ w: { stand: 1 }, at: [ox, -0.22], face: lerp(Math.PI / 2, -0.6, turn), walk: { phase: dist / STRIDE, k: go }, head: [lerp(0, 22, turn), 0, 0], breath: breathe(f), blink: blinkAt(f), smile: lerp(0.3, 0.05, turn) });
      // puppy: trots at the owner's right (camera side), slows (stops ~f 72), lies down (72-92), flops onto its side (92-112)
      const dgo = 1 - ramp(f, 50, 66); let dd = 0; for (let i = 0; i < f; i++) dd += SPD * (1 - ramp(i, 50, 66));
      const dx = X0 + 0.45 + dd, down = ramp(f, 66, 86), flop = ramp(f, 86, 106);
      dog.root.position.set(dx, 0, 0.42); dog.root.rotation.set(0, Math.PI / 2, 0); dog.root.updateMatrixWorld(true);
      dog.pose({ ...pant(f), w: { stand: 1 - down, down: down * (1 - flop), flop }, roll: 90 * flop, counter: 70 * (1 - flop), lift: -25 * (1 - flop), gait: dgo > 0.02 ? { phase: dd / 0.3, amp: 22 * dgo, lift: dgo, k: 1 } : null,
        look: dog.root.localToWorld(V(0, lerp(0.1, -0.3, down), 1.0)), neck: 0.7, aimEyes: true, ears: 0.4, blink: flop > 0.5 ? 0.6 : blinkAt(f + 20), tail: -0.3, wag: 0 });
      leash.set({ a: owner.info.R.H, b: dog.boneWorld('n2'), sag: lerp(0.3, 0.8, ramp(f, 56, 90)) });
      const cx = lerp(X0 + 0.3, X0 + 2.3, ramp(f, 0, 110)), cam = [cx, 1.05, 4.7];
      street.set({ t: f / 30, heat: 1, shade: 0, focusX: cx, cam });
      return { pos: cam, look: [cx, 0.88, 0], fov: 40 };
    } };
  },

  // (b) shade + water: the puppy lies in the tree's shadow pool (it turns cool blue, "2 SHADE"), the owner pours a bucket of cool water over its back ("3 WATER")
  async b({ THREE, scene, renderer, toon, dog }) {
    const street = createStreet(THREE, scene, { toon }), owner = dayOwner(THREE, scene, toon), bucket = createBucket(THREE, scene, { toon }), water = createWater(THREE, scene, { toon });
    const cap = createCaptions(THREE, renderer, {}); cap.step({ n: 2, text: 'SHADE', a: 12, b: 70, at: [540, 300] }); cap.step({ n: 3, text: 'WATER', a: 92, b: 179, at: [540, 300] });
    const V = (x, y, z) => new THREE.Vector3(x, y, z), [sx, sz] = SHADE.spot;
    return { TOTAL: 180, after: (f) => cap.render(f), frame(f) {
      const pour = ramp(f, 96, 120) * (1 - ramp(f, 160, 176)), flow = ramp(f, 108, 116) * (1 - ramp(f, 156, 164));
      // puppy lying in the shade, panting (less once it is wet)
      dog.root.position.set(sx + 0.15, 0, sz + 0.15); dog.root.rotation.set(0, -0.35, 0); dog.root.updateMatrixWorld(true);
      dog.pose({ ...pant(f, lerp(1, 0.6, ramp(f, 120, 170))), w: { down: 1 }, look: V(sx + 1.2, 0.3, sz + 2.5), neck: 0.6, aimEyes: true, ears: 0.3, blink: blinkAt(f + 20), wag: ramp(f, 150, 170) * Math.sin(f * 0.5) * 0.4 });
      // owner: stands behind-left of the puppy, holds the bucket at the hips, tips it over the puppy's back
      const at = [sx - 0.5, sz - 0.25], face = 1.25, fw = V(Math.sin(face), 0, Math.cos(face));
      const bpos = V(at[0], 0, at[1]).addScaledVector(fw, 0.42 + 0.1 * pour); bpos.y = lerp(0.42, 0.55, pour);
      bucket.set({ at: [bpos.x, bpos.y, bpos.z], yaw: face, tilt: 1.5 * pour, water: 1 - 0.8 * ramp(f, 110, 160) });
      const bp = bucket.pts();
      owner.pose({ w: { stand: 1 - pour * 0.7, pour: pour * 0.7 }, at, face, head: [lerp(10, 30, pour), 0, 0], breath: breathe(f), blink: blinkAt(f), smile: 0.4, ik: { R: bp.handle, L: bp.base } });
      const back = dog.boneWorld('sp3').add(V(0, 0.06, 0));
      water.set({ from: bp.lip, to: back, amt: flow, t: f / 30, splash: flow, puddle: ramp(f, 112, 170) });
      const c = ramp(f, 0, 180), cam = [lerp(sx + 0.75, sx + 0.6, c), 1.2, lerp(4.4, 4.1, c)];
      street.set({ t: f / 30, heat: lerp(0.8, 0.3, ramp(f, 10, 60)), shade: ramp(f, 14, 44), focusX: sx, cam });
      return { pos: cam, look: [sx - 0.15, 0.8, sz], fov: 44 };
    } };
  },

  // pose test: owner ground poses (not a deliverable)
  async o({ THREE, scene, toon, dog }) {
    testGround(THREE, scene, toon); dog.root.visible = false;
    const owner = createOwner(THREE, scene, { toon }); owner.setOutfit('day'); owner.setCap('day'); owner.setShoes(true);
    const T = [
      () => owner.pose({ w: { stand: 1 }, at: [0, 0], face: 0.5 }),
      () => owner.pose({ w: { stand: 1 }, at: [0, 0], face: 1.57, walk: { phase: 0.1 } }),
      () => owner.pose({ w: { stand: 1 }, at: [0, 0], face: 1.57, walk: { phase: 0.35 } }),
      () => owner.pose({ w: { kneel: 1 }, at: [0, 0], face: 1.2 }),
      () => owner.pose({ w: { crouch: 1 }, at: [0, 0], face: 1.2 }),
      () => owner.pose({ w: { pour: 1 }, at: [0, 0], face: 1.2 }),
      () => owner.pose({ w: { stand: 1 }, at: [0, 0], face: 0.4, head: [-8, 60, 6], ik: { L: 'foldL', R: 'foldR' } }),
      () => owner.pose({ w: { stand: 1 }, at: [0, 0], face: 0.4, ik: { R: 'earR' }, phone: true }),
      () => owner.pose({ w: { stand: 1 }, at: [0, 0], face: 0.4, keys: true, ik: { L: new THREE.Vector3(0.3, 1.0, 0.45) } }),
    ];
    return { TOTAL: T.length, frame(f) { T[f](); return { pos: [0, 1.0, 3.6], look: [0, 0.8, 0], fov: 40 }; } };
  },
  // (c) indoors: the puppy lies on the rug in the fan's airflow (blades spin, air lines flow, ears flutter, "4 AIR"); hard cut: owner on the phone to the vet ("5 VET")
  async c({ THREE, scene, renderer, toon, dog }) {
    const room = createLiving(THREE, scene, { toon }), owner = dayOwner(THREE, scene, toon); owner.setShoes(false);
    const cap = createCaptions(THREE, renderer, {}); cap.step({ n: 4, text: 'AIR', a: 8, b: 86, at: [540, 300] }); cap.step({ n: 5, text: 'VET', a: 96, b: 179, at: [540, 300] });
    const V = (x, y, z) => new THREE.Vector3(x, y, z), yaw = Math.atan2(FAN.pos[0] - SPOT[0], FAN.pos[1] - SPOT[1]) + 0.5;
    return { TOTAL: 180, after: (f) => cap.render(f), frame(f) {
      const vet = f >= 90;
      room.set({ t: f / 30, fan: ramp(f, 0, 12), air: ramp(f, 4, 20) });
      dog.root.position.set(SPOT[0], 0, SPOT[1]); dog.root.rotation.set(0, yaw, 0); dog.root.updateMatrixWorld(true);
      dog.pose({ ...pant(f, lerp(1, 0.35, ramp(f, 20, 140))), w: { down: 1 }, look: vet ? V(1.4, 0.5, 3.2) : room.pts().fanFace.clone().lerp(V(0.6, 0.4, 3), 0.55), neck: 0.6, aimEyes: true,
        ears: 0.5 + 0.35 * Math.sin(f * 1.7), blink: (f % 60) < 10 ? 1 : 0, wag: 0 });   // ears flutter in the air; slow, content blinks
      owner.root.visible = vet;
      if (vet) owner.reach({ w: { stand: 1 }, at: [0.85, -0.55], face: -0.45, head: [6, 10, 0], breath: breathe(f), blink: blinkAt(f), smile: 0.05, phone: ramp(f, 92, 104) > 0.85 }, { R: ['earR', ramp(f, 92, 104)] });
      if (!vet) { const c = ramp(f, 0, 90); return { pos: [lerp(0.6, 0.5, c), 1.0, lerp(3.0, 2.8, c)], look: [-0.3, 0.45, 0.0], fov: 44 }; }
      const c = ramp(f, 90, 180); return { pos: [lerp(0.95, 0.85, c), 1.3, lerp(3.7, 3.45, c)], look: [0.35, 0.92, -0.3], fov: 42 };
    } };
  },

  // (d) calm homecoming: door opens, owner walks in with keys, takes his shoes off on the mat while the puppy jumps up at his legs, hangs the keys on the rack,
  //     then folds his arms and looks away (5:00 timer) while the puppy jumps and spins; the puppy calms down and sits, the owner kneels and pets it
  async d({ THREE, scene, renderer, toon, dog }) {
    const hall = createEntry(THREE, scene, { toon }), owner = dayOwner(THREE, scene, toon);
    const cap = createCaptions(THREE, renderer, {}); cap.timer({ from: 300, to: 0, a: 118, b: 196, at: [840, 250], size: 120, hold: 10 });
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    // owner walk legs: [f0, f1, from[x,z], to[x,z]]; between legs he stands still
    const LEGS = [[8, 44, [0, -2.3], [0, -1.3]], [84, 100, [0, -1.3], [0.55, -1.36]], [116, 134, [0.55, -1.36], [0.05, -1.05]]];
    const ownerAt = (f) => { let at = LEGS[0][2], dist = 0, k = 0;
      for (const [a, b, A, B] of LEGS) { const L = Math.hypot(B[0] - A[0], B[1] - A[1]), t = clamp((f - a) / (b - a)); if (f < a) break; at = [lerp(A[0], B[0], t), lerp(A[1], B[1], t)]; dist += L * t; if (t > 0 && t < 1) k = 1; }
      return { at, dist, k }; };
    const FACE = (f) => f < 84 ? 0 : f < 100 ? lerp(0, 2.35, ramp(f, 84, 100)) : f < 116 ? 2.35 : lerp(2.35, 1.25, ramp(f, 116, 134));
    let shoesOff = false;
    return { TOTAL: 270, after: (f) => cap.render(f), frame(f) {
      const O = ownerAt(f), face = FACE(f), fw = V(Math.sin(face), 0, Math.cos(face));
      shoesOff = f >= 62; owner.setShoes(!shoesOff);
      hall.set({ door: ramp(f, 0, 18) * (1 - ramp(f, 50, 70)), keysOnHook: f >= 106, shoesOnMat: shoesOff, clock: 360 + f * 0.2 });
      // owner
      const crouch = ramp(f, 46, 56) * (1 - ramp(f, 70, 80)), fold = ramp(f, 124, 138) * (1 - ramp(f, 196, 206)), kneel = ramp(f, 204, 224);
      const args = { w: { stand: 1 - crouch * 0.7 - kneel, crouch: crouch * 0.7, kneel }, at: O.at, face, walk: { phase: O.dist / 0.816, k: O.k }, breath: breathe(f), blink: blinkAt(f),
        head: [lerp(0, 18, crouch) - 8 * fold + 6 * kneel, -62 * fold, -6 * fold], smile: fold > 0.5 ? 0.05 : 0.4, keys: f < 106 };
      const reachKeys = ramp(f, 96, 106) * (1 - ramp(f, 106, 116));
      const pr = owner.info; owner.pose(args);
      const footL = owner.info.L.A.clone().add(V(0, 0.05, 0)), footR = owner.info.R.A.clone().add(V(0, 0.05, 0));
      // puppy: waits, runs in, jumps up at his legs (spins once), calms and sits
      const front = V(O.at[0], 0, O.at[1]).addScaledVector(fw, 0.42);
      let dp, dyaw, dw, gait = null, hop = 0, look;
      const ownerHead = owner.info.head.clone();
      if (f < 24) { dp = V(0.35, 0, -0.45); dyaw = Math.PI - 0.3; dw = { stand: 1 }; hop = 0.03 * Math.max(0, Math.sin(f * 0.6)); look = V(0, 0.9, -2.0); }
      else if (f < 44) { const t = ramp(f, 24, 44); dp = V(0.35, 0, -0.45).lerp(front, t); dyaw = Math.atan2(front.x - 0.35, front.z + 0.45); dw = { stand: 1 }; gait = { phase: f * 0.12, amp: 30, lift: 1.2, k: 1 }; look = ownerHead; }
      else if (f < 182) {
        const spin = ramp(f, 150, 172), cyc = 0.5 - 0.5 * Math.cos(2 * Math.PI * (f - 44) / 20), jumping = 1 - ramp(f, 146, 152) + ramp(f, 172, 176) * (1 - ramp(f, 178, 182));
        dp = front.clone(); if (spin > 0 && spin < 1) dp.add(V(0.1 * Math.sin(spin * Math.PI * 2), 0, 0.1 * (1 - Math.cos(spin * Math.PI * 2))));
        dyaw = Math.atan2(O.at[0] - dp.x, O.at[1] - dp.z) + spin * Math.PI * 2;
        const j = cyc * clamp(jumping); dw = { stand: 1 - j, jump: j }; hop = 0.05 * Math.max(0, Math.sin(2 * Math.PI * (f - 44) / 20 - 0.6)) * clamp(jumping);
        if (spin > 0 && spin < 1) gait = { phase: f * 0.15, amp: 20, lift: 1, k: 1 };
        look = ownerHead;
      } else { dp = front.clone(); dyaw = Math.atan2(O.at[0] - dp.x, O.at[1] - dp.z); const sit = ramp(f, 182, 198); dw = { stand: 1 - sit, sit }; look = ownerHead; }
      dog.root.position.copy(dp).add(V(0, hop, 0)); dog.root.rotation.set(0, dyaw, 0); dog.root.updateMatrixWorld(true);
      const calm = ramp(f, 182, 200);
      dog.pose({ ...pant(f, 1 - calm), w: dw, gait, look, neck: 0.8, aimEyes: true, ears: lerp(-0.4, 0.2, calm), wag: Math.sin(f * lerp(0.9, 0.35, calm)) * lerp(0.9, 0.5, calm), tail: lerp(0.8, 0.3, calm), blink: blinkAt(f + 20), jaw: lerp(0.5 + 0.25 * Math.sin(f * 0.9), 0.15, calm) });
      // hands: shoes (crouch), keys to the rack, folded arms, pet the puppy
      const tg = {};
      if (crouch > 0) { tg.L = [footL, crouch]; tg.R = [footR, crouch]; }
      if (reachKeys > 0) tg.L = [hall.pts().rack.add(V(0, -0.04, 0.02)), reachKeys];
      if (fold > 0) { tg.L = ['foldL', fold]; tg.R = ['foldR', fold]; }
      const pet = ramp(f, 222, 232);
      if (pet > 0) { const hd = dog.boneWorld('head'), back = dog.boneWorld('top'); tg.R = [hd.clone().lerp(back, 0.5 + 0.5 * Math.sin((f - 222) * 0.25)).add(V(0, 0.12, 0)), pet]; }
      owner.reach(args, tg);
      // cameras: 1 wide door shot, 2 medium side shot (folded arms + jumping puppy), 3 low kneel / pet shot
      if (f < 116) { const c = ramp(f, 0, 116); return { pos: [lerp(0.4, 0.3, c), 1.25, lerp(2.7, 2.4, c)], look: [0.12, 0.92, -1.0], fov: 46 }; }
      if (f < 216) { const c = ramp(f, 116, 216); return { pos: [lerp(0.3, 0.25, c), 1.15, lerp(2.3, 2.15, c)], look: [0.2, 0.92, -1.0], fov: 46 }; }
      const c = ramp(f, 216, 270); return { pos: [lerp(0.3, 0.25, c), 1.0, lerp(1.75, 1.6, c)], look: [0.22, 0.68, -1.0], fov: 44 };
    } };
  },

  // (e) backyard: the puppy trots onto the lawn, lowers its head and chews the tall grass patch (blades tug and shorten), "8 IN 10" pop stat
  async e({ THREE, scene, renderer, toon, dog }) {
    const yard = createYard(THREE, scene, { toon });
    const cap = createCaptions(THREE, renderer, {}); cap.title({ text: '8 IN 10', a: 80, b: 159, at: [540, 330], size: 200 }); cap.pop({ text: 'dogs eat grass', a: 86, b: 159, at: [540, 500], angle: -4, size: 90 });
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    return { TOTAL: 160, after: (f) => cap.render(f), frame(f) {
      const walk = ramp(f, 0, 36), down = ramp(f, 30, 50), chew = f > 50 ? 0.5 + 0.5 * Math.sin((f - 50) * 0.7) : 0;
      const yaw = -1.2, dir = V(Math.sin(yaw), 0, Math.cos(yaw)), stop = V(CHEW.x, 0, CHEW.z).addScaledVector(dir, -0.36);   // nose over the patch
      const p = stop.clone().addScaledVector(dir, -0.4 * (1 - walk));
      dog.root.position.copy(p); dog.root.rotation.set(0, yaw, 0); dog.root.updateMatrixWorld(true);
      dog.pose({ w: { stand: 1 - down, graze: down }, gait: walk < 1 ? { phase: f * 0.09, amp: 22 * (1 - walk * 0.6), lift: 1, k: 1 - walk } : null, look: V(CHEW.x, lerp(0.25, 0, down), CHEW.z), neck: lerp(0.8, 1, down), aimEyes: !down,
        jaw: down * (0.15 + 0.35 * chew), blink: blinkAt(f + 20), breath: breathe(f), wag: Math.sin(f * 0.3) * 0.4, tail: 0.3, ears: 0.1 });
      yard.set({ t: f / 30, chew: { amt: ramp(f, 54, 150), tug: down * chew } });
      if (f < 80) { const c = ramp(f, 0, 80); return { pos: [lerp(1.5, 1.3, c), 0.85, lerp(2.2, 2.0, c)], look: [CHEW.x + 0.42, 0.28, CHEW.z], fov: 42 }; }
      const c = ramp(f, 80, 160); return { pos: [lerp(0.4, 0.35, c), 1.35, lerp(3.4, 3.2, c)], look: [0.0, 0.55, -0.5], fov: 46 };
    } };
  },

  // (f) daytime forest: the same forest3d set with light:'day'; a grey wolf (greyWolf = the recoloured puppy rig) grazes the tall grass clump, two pack-mates rest; "1,571 OWNERS" pop stat
  async f({ THREE, scene, renderer, toon, dog, loadGltf, ndSkin, grad }) {
    dog.root.visible = false;
    const forest = createForest(THREE, scene, { toon }); forest.pack.forEach((w) => { w.g.visible = false; }); forest.watch.g.visible = false;
    const wolves = [];
    for (const [x, z, yaw, k] of [[-0.85, -0.1, -1.75, 1.1], [0.1, -1.25, -0.6, 1.05], [0.4, -2.0, -0.5, 1.0]]) { const w = greyWolf(THREE, makeDog, await loadGltf(), { scale: 2.1 * k, grad, ndSkin, day: true }); forest.root.add(w.root); wolves.push({ w, x, z, yaw }); }
    const cap = createCaptions(THREE, renderer, {}); cap.title({ text: '1,571\nOWNERS', a: 60, b: 149, at: [540, 330], size: 170 });
    const V = (x, y, z) => new THREE.Vector3(x, y, z), G = [CLUMP.x[1] + 0.05, -0.05];
    return { TOTAL: 150, after: (f) => cap.render(f), frame(f) {
      forest.set({ t: f / 30, light: 'day', grass: { at: [G[0] - 0.15, G[1]], r: 0.4, amt: 0.5 + 0.4 * ramp(f, 30, 140), dir: 1.2 }, watch: { look: [0, 0, 0] } });
      wolves.forEach(({ w, x, z, yaw }, i) => {
        w.root.position.set(x, 0, z); w.root.rotation.set(0, yaw, 0); w.root.updateMatrixWorld(true);
        const b = { breath: 0.5 + 0.5 * Math.sin(f / 30 * 2.2 + i * 1.7) };
        if (i === 0) { const chew = 0.5 + 0.5 * Math.sin(f * 0.6); w.pose({ ...b, w: { graze: 1 }, look: V(G[0] - 0.1, 0.0, G[1] + 0.1), neck: 1, jaw: 0.15 + 0.35 * chew, blink: blinkAt(f), ears: -0.2, wag: 0, tail: -0.2 }); }
        else if (i === 1) w.pose({ ...b, w: { down: 1 }, look: w.root.localToWorld(V(0.3, 0.15, 0.8)), neck: 0.7, aimEyes: true, blink: (f % 80) < 40 ? 1 : 0, ears: 0.3 });
        else w.pose({ ...b, w: { sit: 1 }, look: V(-1.4, 0.4, 0.1 + Math.sin(f * 0.04) * 0.4), neck: 0.8, aimEyes: true, blink: blinkAt(f + 30), ears: -0.4 });
      });
      const c = ramp(f, 0, 150); return { pos: [lerp(-0.5, -0.6, c), lerp(1.4, 1.35, c), lerp(3.7, 3.45, c)], look: [-0.62, 0.35, -0.3], fov: 46 };
    } };
  },
};
