// ================= small props for the redo reels: water bucket, water stream + splash, leash =================
// Toon meshes, inked by the project's post-process. The splash puddle is flagged userData.ndSkip = true.
//
//   import { createBucket, createWater, createLeash } from './props3d.js';
//   const bucket = createBucket(THREE, scene, { toon });  bucket.set({ at:[x,y,z], yaw, tilt, water:0..1 });  bucket.pts() -> { handle, base, lip } (world)
//   const water = createWater(THREE, scene, { toon });    water.set({ from:Vector3, to:Vector3, amt:0..1, t:seconds, splash:0..1, puddle:0..1 });
//   const leash = createLeash(THREE, scene, { toon });    leash.set({ a:Vector3 (hand), b:Vector3 (puppy's neck), sag:0..1 });  leash.root.visible = false to hide
//
// Bucket: origin = centre of the base, lip toward local +z; tilt (radians) tips it about its middle, lip going forward/down (~1.4 = pouring).
// Pour with two hands: owner.pose({ ..., ik:{ R: pts.handle, L: pts.base } }) (handle = top of the bail handle, base = the back bottom rim).
// Water stream: a falling arc from `from` (use bucket.pts().lip) to `to` (on the puppy's back), with drops running down it; splash = drops bouncing
// off `to`; puddle = a wet patch spreading on the ground under `to` (y of `to` is ignored for the puddle: it lies on y = puddleY, default 0.012).
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

export const createBucket = (THREE, scene, { toon = (o) => new THREE.MeshToonMaterial(o) } = {}) => {
  const root = new THREE.Group(); root.name = 'bucket'; scene.add(root);
  const tilt = new THREE.Group(); tilt.position.y = 0.15; root.add(tilt);   // pivot at mid height
  const body = new THREE.Group(); body.position.y = -0.15; tilt.add(body);
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = body) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const blue = toon({ color: '#3f7fd6', side: THREE.DoubleSide }), rimM = toon({ color: '#2f5fae' }), metal = toon({ color: '#c9ccd4' }), waterM = toon({ color: '#9fdcff' });
  add(new THREE.CylinderGeometry(0.15, 0.12, 0.3, 20, 1, true), blue, 0, 0.15, 0);
  add(new THREE.CircleGeometry(0.12, 20), blue, 0, 0.002, 0).rotation.x = -Math.PI / 2;
  add(new THREE.TorusGeometry(0.15, 0.012, 8, 28), rimM, 0, 0.3, 0).rotation.x = Math.PI / 2;
  const surf = add(new THREE.CircleGeometry(0.14, 20), waterM, 0, 0.24, 0); surf.rotation.x = -Math.PI / 2;
  const handle = add(new THREE.TorusGeometry(0.15, 0.008, 6, 20, Math.PI), metal, 0, 0.29, 0); handle.rotation.y = 0;   // bail: arc over the top, hinged at x = +-0.15
  for (const s of [-1, 1]) add(new THREE.SphereGeometry(0.018, 8, 6), metal, s * 0.15, 0.29, 0);
  const P = (x, y, z) => body.localToWorld(new THREE.Vector3(x, y, z));
  const set = (st = {}) => {
    const at = st.at || [0, 0, 0]; root.position.set(at[0], at[1], at[2]); root.rotation.set(0, st.yaw || 0, 0); tilt.rotation.x = st.tilt || 0;
    const w = clamp(st.water ?? 1); surf.visible = w > 0.03; surf.position.y = 0.02 + 0.22 * w;
    root.updateMatrixWorld(true);
  };
  /** world points: handle (top of the bail), base (back bottom rim, for the second hand), lip (front rim, where the water leaves) */
  const pts = () => ({ handle: P(0, 0.44, 0), base: P(0, 0.03, -0.13), lip: P(0, 0.3, 0.155) });
  set();
  return { root, set, pts };
};

export const createWater = (THREE, scene, { toon = (o) => new THREE.MeshToonMaterial(o) } = {}) => {
  const root = new THREE.Group(); root.name = 'water'; scene.add(root);
  const mat = toon({ color: '#8fd6ff', emissive: '#1d4a6a' }), dropM = toon({ color: '#c4ecff', emissive: '#1d4a6a' });
  const stream = new THREE.Mesh(new THREE.BufferGeometry(), mat); stream.castShadow = false; root.add(stream);
  const drops = Array.from({ length: 10 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), dropM); root.add(m); return m; });
  const splash = Array.from({ length: 16 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), dropM); m.userData.a = i * 2.39996; m.userData.ph = (i * 0.37) % 1; root.add(m); return m; });
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshBasicMaterial({ color: '#7fb8e6', transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
  puddle.rotation.x = -Math.PI / 2; puddle.userData.ndSkip = true; root.add(puddle);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  /** point on the falling arc from a to b (u 0..1): straight in x/z, quadratic drop in y (leaves the lip level, falls steeper near the end) */
  const arc = (a, b, u) => V(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u * u + 0.05 * u * (1 - u), a.z + (b.z - a.z) * u);
  const set = (st = {}) => {
    const amt = clamp(st.amt ?? 1), t = st.t || 0, a = st.from, b = st.to;
    stream.visible = amt > 0.02 && !!a; drops.forEach((d) => { d.visible = stream.visible; });
    if (stream.visible) {
      const curve = new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, i) => arc(a, b, i / 8)));
      stream.geometry.dispose(); stream.geometry = new THREE.TubeGeometry(curve, 24, 0.012 + 0.022 * amt, 8, false);
      drops.forEach((d, i) => { const u = (t * 1.6 + i / drops.length) % 1; d.position.copy(arc(a, b, u)); d.scale.setScalar(0.6 + amt * (0.6 + 0.4 * Math.sin(i * 7))); });
    }
    const sp = clamp(st.splash ?? amt);
    splash.forEach((m) => { const k = (t * 1.8 + m.userData.ph) % 1, r = 0.06 + 0.26 * k, an = m.userData.a; m.visible = sp > 0.05 && !!b;
      if (m.visible) { m.position.set(b.x + Math.cos(an) * r, b.y + 0.22 * k - 0.45 * k * k + 0.02, b.z + Math.sin(an) * r); m.scale.setScalar(sp * (1 - 0.6 * k)); } });
    const pu = clamp(st.puddle ?? 0); puddle.visible = pu > 0.02 && !!b;
    if (puddle.visible) { puddle.position.set(b.x, st.puddleY ?? 0.012, b.z); puddle.scale.set(0.15 + 0.4 * pu, 0.1 + 0.3 * pu, 1); }
    root.updateMatrixWorld(true);
  };
  return { root, set };
};

export const createLeash = (THREE, scene, { toon = (o) => new THREE.MeshToonMaterial(o) } = {}) => {
  const root = new THREE.Group(); root.name = 'leash'; scene.add(root);
  const mat = toon({ color: '#d8453a' });
  const line = new THREE.Mesh(new THREE.BufferGeometry(), mat); line.castShadow = true; root.add(line);
  const clip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), toon({ color: '#c9ccd4' })); root.add(clip);
  const set = (st = {}) => {
    const a = st.a, b = st.b, sag = st.sag ?? 0.5; if (!a || !b) return;
    const d = a.distanceTo(b), pts = [];
    for (let i = 0; i <= 10; i++) { const u = i / 10, p = a.clone().lerp(b, u); p.y -= 4 * u * (1 - u) * sag * 0.25 * d; pts.push(p); }
    line.geometry.dispose(); line.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.009, 6, false); clip.position.copy(b);
    root.updateMatrixWorld(true);
  };
  return { root, set };
};
