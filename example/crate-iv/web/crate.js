// ================= CRATE + CHEW TOY props (reusable, three.js r160, toon material + the world's ink pass) =================
// A wire dog crate 1.0 m long (x) x 0.66 m wide (z) x 0.72 m high (y) (scaled to the 1.6x puppy: it is 0.73 m long lying down, 0.54 m tall sitting), door on the +x end, hinged on the -z edge (latch on the +z edge).
//   import { makeCrate, makeToy, CRATE, doorEdge } from './crate.js';
//   const crate = makeCrate(THREE, scene, { toon });   // toon(o) -> MeshToonMaterial
//   crate.set({ pos: [x, y, z], yaw, door })           // pos = centre of the crate on the floor; door 0 = closed .. 1 = open (100 deg)
//   const toy = makeToy(THREE, scene, { toon }); toy.set({ pos: [x, y, z], yaw, stand: 0|1 } | null)   // pos = centre of the toy
// Crate-local frame: origin = centre of the base on the floor, +x = door end, +z = the hinge's opposite side.
// CRATE.FLOOR = height of the soft mat's top surface above the floor (a puppy inside stands at pos.y + CRATE.FLOOR).
export const CRATE = { L: 1.0, W: 0.66, H: 0.72, TRAY: 0.035, FLOOR: 0.06, OPEN: 100 * Math.PI / 180 };
/** crate-local point of the door's free edge (middle height) for a door value 0..1 (for a hand to hold). */
export const doorEdge = (door, y = 0.4) => {
  const a = door * CRATE.OPEN;
  return [CRATE.L / 2 + 0.006 + Math.sin(a) * CRATE.W, y, -CRATE.W / 2 + Math.cos(a) * CRATE.W];
};
export const makeCrate = (THREE, parent, { toon }) => {
  const { L, W, H, TRAY } = CRATE, r = 0.0085;
  const mBar = toon({ color: '#7b8798' }), mTray = toon({ color: '#3d4550' }), mMat = toon({ color: '#f0c9a4' }), mMatEdge = toon({ color: '#d9a47e' }), mLatch = toon({ color: '#d8372f' });
  const root = new THREE.Group(); parent.add(root);
  const Y = new THREE.Vector3(0, 1, 0), A = new THREE.Vector3(), B = new THREE.Vector3();
  const bar = (g, a, b, rad = r) => {
    A.set(...a); B.set(...b); const d = B.clone().sub(A), len = d.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, len, 6), mBar);
    m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(Y, d.normalize()); m.castShadow = false; m.receiveShadow = true; g.add(m); return m;
  };
  const box = (g, w, h, d, mat, x, y, z, cast = true) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; g.add(m); return m; };
  const y0 = TRAY, y1 = H, x1 = L / 2, z1 = W / 2;
  // base tray (darker) with a raised rim, and the soft mat inside
  box(root, L + 0.02, TRAY * 0.6, W + 0.02, mTray, 0, TRAY * 0.3, 0);
  box(root, L + 0.02, TRAY * 0.5, 0.014, mTray, 0, TRAY * 0.85, z1 + 0.003); box(root, L + 0.02, TRAY * 0.5, 0.014, mTray, 0, TRAY * 0.85, -z1 - 0.003);
  box(root, 0.014, TRAY * 0.5, W, mTray, -x1 - 0.003, TRAY * 0.85, 0); box(root, 0.014, TRAY * 0.5, W, mTray, x1 + 0.003, TRAY * 0.85, 0);
  { const sh = new THREE.Shape(), w = L / 2 - 0.02, d = W / 2 - 0.02, c = 0.05;
    sh.moveTo(-w + c, -d); sh.lineTo(w - c, -d); sh.quadraticCurveTo(w, -d, w, -d + c); sh.lineTo(w, d - c); sh.quadraticCurveTo(w, d, w - c, d); sh.lineTo(-w + c, d); sh.quadraticCurveTo(-w, d, -w, d - c); sh.lineTo(-w, -d + c); sh.quadraticCurveTo(-w, -d, -w + c, -d);
    const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: CRATE.FLOOR - TRAY - 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.012, bevelSegments: 2 }), [mMat, mMatEdge]);
    m.rotation.x = -Math.PI / 2; m.position.y = TRAY + 0.004; m.castShadow = false; m.receiveShadow = true; root.add(m); }
  // frame: four top rails + four posts
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) bar(root, [sx * x1, y0, sz * z1], [sx * x1, y1, sz * z1], r * 1.25);
  bar(root, [-x1, y1, -z1], [x1, y1, -z1], r * 1.25); bar(root, [-x1, y1, z1], [x1, y1, z1], r * 1.25);
  bar(root, [-x1, y1, -z1], [-x1, y1, z1], r * 1.25); bar(root, [x1, y1, -z1], [x1, y1, z1], r * 1.25);
  bar(root, [-x1, y0, -z1], [x1, y0, -z1], r * 1.25); bar(root, [-x1, y0, z1], [x1, y0, z1], r * 1.25); bar(root, [-x1, y0, -z1], [-x1, y0, z1], r * 1.25);
  // long side walls: vertical bars every 0.0625 + a mid rail
  for (const sz of [-1, 1]) {
    for (let i = 1; i < 12; i++) bar(root, [-x1 + i * L / 12, y0, sz * z1], [-x1 + i * L / 12, y1, sz * z1]);
    bar(root, [-x1, 0.38, sz * z1], [x1, 0.38, sz * z1]);
  }
  // back wall (-x)
  for (let i = 1; i < 8; i++) bar(root, [-x1, y0, -z1 + i * W / 8], [-x1, y1, -z1 + i * W / 8]);
  bar(root, [-x1, 0.38, -z1], [-x1, 0.38, z1]);
  // roof: a few wide-spaced bars
  for (const z of [-W / 4, W / 4]) bar(root, [-x1, y1, z], [x1, y1, z]);
  for (const x of [-L / 3, 0, L / 3]) bar(root, [x, y1, -z1], [x, y1, z1]);
  // door: group pivoting on the -z hinge at the +x end (closed = swings flat across the end)
  const door = new THREE.Group(); door.position.set(x1 + 0.006, 0, -z1); root.add(door);
  bar(door, [0, y0, 0], [0, y1, 0], r * 1.25); bar(door, [0, y0, W], [0, y1, W], r * 1.25);
  bar(door, [0, y0, 0], [0, y0, W], r * 1.25); bar(door, [0, y1, 0], [0, y1, W], r * 1.25); bar(door, [0, 0.38, 0], [0, 0.38, W]);
  for (let i = 1; i < 8; i++) bar(door, [0, y0, i * W / 8], [0, y1, i * W / 8]);
  box(door, 0.02, 0.065, 0.04, mLatch, 0.004, 0.6, W - 0.015, false);
  const set = (o) => {
    root.visible = !!o; if (!o) return;
    root.position.set(...o.pos); root.rotation.y = o.yaw || 0; door.rotation.y = (o.door || 0) * CRATE.OPEN;
  };
  return { root, door, set };
};
/** stuffed chew toy: a red rounded bone with a pale band, lying along the crate's x axis (yaw turns it). pos = centre. */
export const makeToy = (THREE, parent, { toon }) => {
  const root = new THREE.Group(); parent.add(root);
  const mRed = toon({ color: '#e0452f' }), mBand = toon({ color: '#f4efe6' });
  const part = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; root.add(m); return m; };
  const shaft = part(new THREE.CylinderGeometry(0.024, 0.024, 0.15, 14), mRed, 0, 0, 0); shaft.rotation.z = Math.PI / 2;
  const band = part(new THREE.CylinderGeometry(0.0255, 0.0255, 0.03, 14), mBand, 0, 0, 0); band.rotation.z = Math.PI / 2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) part(new THREE.SphereGeometry(0.033, 14, 10), mRed, sx * 0.082, 0, sz * 0.02);
  const set = (o) => { root.visible = !!o; if (!o) return; root.position.set(...o.pos); root.rotation.y = o.yaw || 0; };
  return { root, set };
};
