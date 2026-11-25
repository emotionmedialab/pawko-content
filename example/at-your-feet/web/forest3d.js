// ================= 3D night forest: layered pines, tall grass that can flatten, a sleeping wolf pack + one watcher (stylised wolves), predator eyes =================
// Wolves are built from primitives (no GLB): grey fur, dark saddle, light belly / muzzle / paws, long snout, tall pointed ears, bushy tail.
// Inked by the project's post-process. Glows / eyes are flagged userData.ndSkip = true (the ink pass must hide them, same flag as the kit's clouds).
//
//   import { createForest } from './forest3d.js';
//   const forest = createForest(THREE, scene, { toon });                                   // main.js, once
//   forest.set({ t: f / 30, grass: { at:[x,z], r:0.8, amt:0..1, dir:radians }, watch: { look:[x,y,z] }, eyes: 1 });   // every frame
//
// World: clearing at the origin. Pack x -1.1..0.6, z -0.9..0.9; the watcher sits at the right back edge (WATCH); pines from z -3.5 back and on both sides;
// a tall-grass clump left of the pack (CLUMP) plus low grass behind. Camera that frames it all in 9:16: pos [0,3.0,4.6], look [-0.1,0.2,-0.4], fov 48.
// set(): t = seconds (breathing, sway, blinks); grass = flatten a patch (amt 0 upright .. 1 flat, pushed along dir); watch.look = world point the watcher stares at;
//   eyes 0..1 = how many predator eyes glow (fade by size).

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const rng = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
export const WATCH = { pos: [0.85, 0, -0.55], yaw: 1.1 };
export const CLUMP = { x: [-1.9, -1.3], z: [-1.2, 0.6] };
export const EYES = [[1.7, 0.35, -2.4], [0.9, 0.9, -3.8], [2.0, 0.3, -1.4], [-0.6, 0.4, -3.2], [-1.6, 0.5, -2.2], [0.2, 0.3, -4.2], [1.9, 0.8, -4.6], [-1.4, 0.35, -4.8]];

export const createForest = (THREE, scene, { toon = (o) => new THREE.MeshToonMaterial(o) } = {}) => {
  const root = new THREE.Group(); root.name = 'forest'; scene.add(root);
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = root, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
  const R = rng(11);

  // ---------- ground, lights ----------
  const groundTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#2f5a55'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 160; i++) { g.fillStyle = i % 2 ? '#3a6a60' : '#274c4a'; g.beginPath(); g.ellipse(R() * 256, R() * 256, 4 + R() * 9, 2 + R() * 4, R() * 3, 0, 7); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(16, 16); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const ground = add(new THREE.PlaneGeometry(70, 70), toon({ map: groundTex }), 0, 0, -12, root, false); ground.rotation.x = -Math.PI / 2;
  root.add(new THREE.HemisphereLight('#7a92d8', '#24384a', 1.5));
  const moon = new THREE.DirectionalLight('#b4ccff', 2.2); moon.position.set(-4, 8, 5); moon.target.position.set(0.3, 0, -0.3); moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048); moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.03;
  { const c = moon.shadow.camera; c.left = -4; c.right = 4; c.top = 4; c.bottom = -4; c.near = 1; c.far = 30; c.updateProjectionMatrix(); }
  root.add(moon); root.add(moon.target);
  scene.background = new THREE.Color('#16244c'); scene.fog = new THREE.Fog('#16244c', 5, 24);

  // ---------- pine trees: smaller, many, layered in depth (fog fades the far rows) ----------
  const trunk = toon({ color: '#5a3a2a' }), pines = ['#23606a', '#2a6e70', '#1d5260'].map((c) => toon({ color: c }));
  const pine = (x, z, h) => { const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    add(new THREE.CylinderGeometry(0.06 * h / 3, 0.09 * h / 3, h * 0.25, 6), trunk, 0, h * 0.12, 0, g);
    for (let k = 0; k < 4; k++) add(new THREE.ConeGeometry((0.62 - k * 0.12) * h / 3, h * 0.34, 8), pines[(k + Math.abs(Math.round(x * 3))) % 3], 0, h * (0.3 + k * 0.2), 0, g);
    g.rotation.y = R() * 6; return g; };
  for (let row = 0; row < 6; row++) for (let i = 0; i < 16; i++) pine(-11 + i * 1.45 + R() * 1.1 + (row % 2) * 0.7, -3.6 - row * 2.3 - R() * 1.2, 2.2 + R() * 1.8 + row * 0.15);
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) pine(s * (3.6 + R() * 3), -2.4 - i * 1.0 - R() * 0.6, 2.2 + R() * 1.4);

  // ---------- tall grass: instanced blades that can flatten ----------
  const NB = 1900, blades = new THREE.InstancedMesh(new THREE.ConeGeometry(0.03, 1, 4).translate(0, 0.5, 0), toon({ color: '#ffffff' }), NB);
  blades.castShadow = true; blades.receiveShadow = true; root.add(blades); blades.frustumCulled = false;
  const B = [], col = new THREE.Color();
  for (let i = 0; i < NB; i++) {
    const clump = i < 600; let x, z;
    if (i >= 600 && i < 1000) { x = (R() - 0.5) * 4.6; z = 1.5 + R() * 2.0; if (Math.abs(x) < 0.5) x += Math.sign(x || 1) * 0.6; }   // low foreground grass framing the bottom of the shot
    else if (clump) { x = CLUMP.x[0] + R() * (CLUMP.x[1] - CLUMP.x[0]); z = CLUMP.z[0] + R() * (CLUMP.z[1] - CLUMP.z[0]); }
    else do { x = (R() - 0.5) * 12; z = -5.5 + R() * 5.2; } while ((x > -1.2 && x < 1.8 && z > -2.2) || Math.hypot(x - WATCH.pos[0], z - WATCH.pos[2]) < 0.9);   // low grass behind; short grass under the pack
    B.push({ x, z, h: clump ? 0.55 + R() * 0.45 : i < 1000 ? 0.22 + R() * 0.25 : 0.3 + R() * 0.35, a: R() * 6.28, ph: R() * 6.28 }); blades.setColorAt(i, col.set(['#3f8a62', '#4f9a6c', '#2f7456'][i % 3]));
  }
  const m4 = new THREE.Matrix4(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), AXY = new THREE.Vector3(0, 1, 0), AXX = new THREE.Vector3(1, 0, 0);
  const updateGrass = (t, g) => {
    for (let i = 0; i < NB; i++) {
      const b = B[i]; let k = 0, ang = b.a;
      if (g && g.amt) { const d = Math.hypot(b.x - g.at[0], b.z - g.at[1]); k = g.amt * clamp(1.4 - d / g.r) ** 0.7; ang = g.dir ?? Math.atan2(b.x - g.at[0], b.z - g.at[1]); }
      const tilt = 0.08 + 0.05 * Math.sin(t * 1.7 + b.ph + b.x) + k * (1.45 - 0.08);
      qa.setFromAxisAngle(AXY, ang); qb.setFromAxisAngle(AXX, tilt); qa.multiply(qb);
      m4.compose(ps.set(b.x, 0, b.z), qa, sc.set(1, b.h * (1 - 0.3 * k), 1)); blades.setMatrixAt(i, m4);
    }
    blades.instanceMatrix.needsUpdate = true;
  };

  const rockM = toon({ color: '#6f7686' });
  for (const [x, z, s] of [[-1.5, 1.4, 0.22], [1.6, 1.8, 0.28], [-0.9, 2.6, 0.16], [0.9, 2.9, 0.2], [2.2, 0.8, 0.3]]) { const r = add(new THREE.SphereGeometry(1, 10, 8), rockM, x, s * 0.4, z); r.scale.set(s * 1.3, s * 0.8, s); r.rotation.y = x; }

  // ---------- wolves ----------
  const FUR = toon({ color: '#b9b8bd' }), DARK = toon({ color: '#4d5160' }), LIGHT = toon({ color: '#f4f2f0' }), NOSE = toon({ color: '#1b1b22' });
  const AMBER = new THREE.MeshBasicMaterial({ color: '#ffd24a' });
  const ell = (r, p, mat, parent, rot) => { const m = add(new THREE.SphereGeometry(1, 16, 12), mat, p[0], p[1], p[2], parent); m.scale.set(...r); if (rot) m.rotation.set(...rot); return m; };
  const limbSpan = (a, b, r0, r1, mat, parent) => { const g = new THREE.CylinderGeometry(r1, r0, 1, 8), m = add(g, mat, 0, 0, 0, parent); const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A); m.position.copy(A).addScaledVector(d, 0.5); m.scale.set(1, d.length(), 1); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m; };
  const wolfHead = (parent, awake, earH) => {   // head group: head, long snout, nose, tall pointed ears, eyes. Origin = head centre, nose along +z.
    const g = new THREE.Group(); parent.add(g);
    ell([0.11, 0.1, 0.12], [0, 0, 0], FUR, g); ell([0.065, 0.06, 0.2], [0, -0.03, 0.17], LIGHT, g, [0.12, 0, 0]); ell([0.034, 0.028, 0.028], [0, -0.01, 0.36], NOSE, g);
    const ears = [-1, 1].map((s) => { const e = add(new THREE.ConeGeometry(0.065, earH, 3), DARK, s * 0.07, 0.1 + earH * 0.4, -0.03, g); e.scale.z = 0.35; e.rotation.set(-0.1, 0, -s * 0.15); return e; });
    for (const s of [-1, 1]) { if (awake) { add(new THREE.SphereGeometry(0.02, 10, 8), AMBER, s * 0.06, 0.03, 0.1, g, false).scale.set(1, 1.2, 0.5); ell([0.008, 0.014, 0.006], [s * 0.06, 0.03, 0.118], NOSE, g); } else ell([0.025, 0.005, 0.007], [s * 0.06, 0.03, 0.108], NOSE, g); }
    return { g, ears };
  };
  const tail = (parent, pts) => { pts.forEach((p, i) => ell(p.r, p.p, i === pts.length - 1 ? LIGHT : FUR, parent, p.rot)); };
  const sleeper = () => {   // lying, head on the front paws, bushy tail wrapped round the flank
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    ell([0.22, 0.17, 0.36], [0, 0.17, 0], FUR, body); ell([0.2, 0.08, 0.3], [0, 0.07, 0.04], LIGHT, body);
    for (const s of [-1, 1]) ell([0.06, 0.05, 0.1], [s * 0.09, 0.05, 0.52], LIGHT, body);
    const h = wolfHead(body, false, 0.17); h.g.position.set(0, 0.14, 0.46); h.g.rotation.set(0.12, -0.25, 0.1);
    tail(body, [{ p: [0.17, 0.11, -0.36], r: [0.12, 0.11, 0.18], rot: [0, 0.5, 0] }, { p: [0.34, 0.11, -0.27], r: [0.11, 0.1, 0.15], rot: [0, 1.0, 0] }, { p: [0.42, 0.11, -0.1], r: [0.09, 0.09, 0.12], rot: [0, 1.5, 0] }]);
    return { g, body };
  };
  const watcher = () => {   // sitting upright, head up, ears pricked, bushy tail along the ground
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    ell([0.19, 0.17, 0.22], [0, 0.16, -0.08], FUR, body); ell([0.15, 0.22, 0.14], [0, 0.35, 0.04], FUR, body, [0.25, 0, 0]); ell([0.1, 0.17, 0.07], [0, 0.34, 0.15], LIGHT, body, [0.25, 0, 0]);
    for (const s of [-1, 1]) { limbSpan([s * 0.085, 0.4, 0.07], [s * 0.085, 0.04, 0.24], 0.055, 0.045, LIGHT, body); ell([0.05, 0.04, 0.08], [s * 0.085, 0.04, 0.27], LIGHT, body); }
    tail(body, [{ p: [0.06, 0.07, -0.34], r: [0.1, 0.08, 0.18], rot: [0, 0.25, 0] }, { p: [0.14, 0.07, -0.55], r: [0.1, 0.08, 0.16], rot: [0, 0.45, 0] }, { p: [0.22, 0.07, -0.72], r: [0.08, 0.07, 0.1], rot: [0, 0.6, 0] }]);
    const hg = new THREE.Group(); hg.position.set(0, 0.62, 0.14); body.add(hg); const h = wolfHead(hg, true, 0.22); h.g.rotation.x = 0.1;
    return { g, body, headPivot: hg, ears: h.ears };
  };

  const PACK = [[-0.85, 0.3, 0.3, 1.15], [-0.2, 0.6, -0.25, 1.2], [-0.4, -0.5, 2.5, 1.15], [0.35, 0.1, -1.0, 1.1]];   // x, z, yaw, scale
  const pack = PACK.map(([x, z, yaw, s]) => { const w = sleeper(); w.g.position.set(x, 0, z); w.g.rotation.y = yaw; w.g.scale.setScalar(s); root.add(w.g); return w; });
  const watch = watcher(); watch.g.position.set(...WATCH.pos); watch.g.rotation.y = WATCH.yaw; watch.g.scale.setScalar(1.15); root.add(watch.g);

  // ---------- predator eyes ----------
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,230,90,.8)'); r.addColorStop(1, 'rgba(255,230,90,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#ffe85a', fog: false });
  const eyes = EYES.map(([x, y, z]) => { const g = new THREE.Group(); g.position.set(x, y, z); g.lookAt(0, y, 0); root.add(g);
    for (const s of [-1, 1]) { const e = add(new THREE.SphereGeometry(0.05, 10, 8), eyeMat, s * 0.17, 0, 0, g, false); e.scale.set(1.3, 0.8, 0.5); e.userData.ndSkip = true; }
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshBasicMaterial({ map: glowTex, opacity: 0.5, transparent: true, depthWrite: false, fog: false })); gl.position.z = 0.02; gl.userData.ndSkip = true; g.add(gl); return g; });

  // ---------- set(): one call per frame ----------
  const wv = new THREE.Vector3();
  const set = (st = {}) => {
    const t = st.t || 0;
    updateGrass(t, st.grass);
    pack.forEach((w, i) => { const b = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7); w.body.scale.set(1 + 0.01 * b, 1 + 0.035 * b, 1 + 0.01 * b); });
    root.updateMatrixWorld(true);
    // watcher: head swings (yaw/pitch, clamped) toward the look point, slow breathing
    const L = st.watch?.look ? watch.g.worldToLocal(wv.set(...st.watch.look)) : null;
    if (L) { const yaw = clamp(Math.atan2(L.x, L.z - 0.14), -1.2, 1.2), pit = clamp(-Math.atan2(L.y - 0.6, Math.hypot(L.x, L.z)), -0.5, 0.5); watch.headPivot.rotation.set(pit, yaw, 0); }
    const b = 0.5 + 0.5 * Math.sin(t * 2.4); watch.body.scale.set(1, 1 + 0.015 * b, 1);
    watch.ears.forEach((e, i) => { e.rotation.z = (i ? -1 : 1) * -0.18 + (st.watch?.flick && i ? 0.35 : 0); });
    const E = st.eyes ?? 1;
    eyes.forEach((g, i) => { const on = clamp(E * eyes.length - i), blink = ((t * 0.5 + i * 1.37) % 4) > 3.8 ? 0.1 : 1; g.visible = on > 0; g.scale.set(on, on * blink, on); });
    root.updateMatrixWorld(true);
  };
  return { root, set, pack, watch, WATCH, EYES };
};
