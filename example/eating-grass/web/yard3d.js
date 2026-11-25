// ================= 3D backyard lawn by day (picket fence, flower bed, shed, round tree, grass tufts + a tall CHEW patch the puppy can nibble), toon-shaded =================
// Inked by the project's post-process. Sky dome + sun are flagged userData.ndSkip = true.
//
//   import { createYard, CHEW } from './yard3d.js';
//   const yard = createYard(THREE, scene, { toon });         // main.js, once
//   yard.set({ t: f / 30, chew: { amt: 0..1, tug: 0..1 } });   // every frame: amt = how much of the tall patch is eaten (blades shorten), tug = blades near the mouth bend toward it
//
// World: lawn at y = 0 around the origin; fence along the back (z = -2.4) and both sides (x = +-2.8); flower bed in front of the back fence; shed back-left; tree back-right.
// CHEW = centre of the tall-grass patch (radius CHEW.r): put the grazing puppy with its nose over it (dog.pose({ w:{ graze:1 }, look: [CHEW.x, 0, CHEW.z], neck: 1 })).
// Camera presets (9:16): puppy chewing pos [CHEW.x + 0.9, 0.75, CHEW.z + 1.6] look [CHEW.x, 0.25, CHEW.z] fov 42; wide yard pos [0.4, 1.6, 4.2] look [0, 0.5, -0.6] fov 46.

export const CHEW = { x: 0.15, z: 0.05, r: 0.28 };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const rng = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

export const createYard = (THREE, scene, { toon = (o) => new THREE.MeshToonMaterial(o) } = {}) => {
  const root = new THREE.Group(); root.name = 'yard'; scene.add(root);
  const R = rng(5);
  const tex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = root, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

  const lawnTex = (() => { const [c, g] = cv(256, 256); g.fillStyle = '#7fbf5a'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 240; i++) { g.fillStyle = ['#74b352', '#8dca64', '#6aa94c'][i % 3]; g.beginPath(); g.ellipse(R() * 256, R() * 256, 3 + R() * 9, 2 + R() * 4, R() * 3, 0, 7); g.fill(); }
    return tex(c, 10, 10); })();
  const skyTex = (() => { const [c, g] = cv(64, 512); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#5fa6f0'); gr.addColorStop(0.7, '#bfe0fa'); gr.addColorStop(1, '#e8f4fb');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 512); const t = tex(c); t.wrapS = THREE.ClampToEdgeWrapping; return t; })();
  const glowTex = (rgb) => { const [c, g] = cv(128, 128); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, `rgba(${rgb},.95)`); r.addColorStop(0.3, `rgba(${rgb},.5)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return tex(c); };
  const M = {
    lawn: toon({ map: lawnTex }), picket: toon({ color: '#fbf3e2' }), soil: toon({ color: '#7a5036' }), bedEdge: toon({ color: '#c9b49a' }), trunk: toon({ color: '#7a5036' }),
    leafA: toon({ color: '#5f9e4e' }), leafB: toon({ color: '#78b25a' }), shed: toon({ color: '#d9774f' }), roof: toon({ color: '#7a4e33' }), shedDoor: toon({ color: '#b85f3e' }),
    stem: toon({ color: '#4d8a46' }), petals: ['#ff6b8a', '#ffd93b', '#ffffff', '#b48cff'].map((c) => toon({ color: c })), ball: toon({ color: '#e05a4f' }),
  };

  // ---------- lawn, fence, flower bed, shed, tree, a ball ----------
  const lawn = add(new THREE.PlaneGeometry(40, 30), M.lawn, 0, 0, -4, root, false); lawn.rotation.x = -Math.PI / 2;
  const fence = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.round(L / 0.16), ang = Math.atan2(x1 - x0, z1 - z0);
    for (let i = 0; i <= n; i++) { const u = i / n, p = add(box(0.09, 0.8, 0.025), M.picket, x0 + (x1 - x0) * u, 0.4, z0 + (z1 - z0) * u); p.rotation.y = ang + Math.PI / 2;
      const tip = add(new THREE.ConeGeometry(0.064, 0.08, 4), M.picket, p.position.x, 0.84, p.position.z); tip.rotation.y = ang + Math.PI / 4; }
    for (const y of [0.22, 0.6]) { const r = add(box(0.03, 0.06, L), M.picket, (x0 + x1) / 2, y, (z0 + z1) / 2); r.rotation.y = ang; r.position.add(new THREE.Vector3(Math.cos(ang), 0, -Math.sin(ang)).multiplyScalar(-0.03)); } };
  fence(-2.8, -2.4, 2.8, -2.4); fence(-2.8, 1.6, -2.8, -2.4); fence(2.8, -2.4, 2.8, 1.6);
  add(box(4.2, 0.12, 0.55), M.bedEdge, 0.5, 0.06, -2.0); add(box(4.05, 0.13, 0.42), M.soil, 0.5, 0.07, -2.0);
  for (let i = 0; i < 22; i++) { const x = -1.45 + i * 0.185 + R() * 0.06, z = -2.0 + (R() - 0.5) * 0.25, h = 0.22 + R() * 0.2;
    add(new THREE.CylinderGeometry(0.008, 0.01, h, 5), M.stem, x, 0.13 + h / 2, z); add(new THREE.SphereGeometry(0.05 + R() * 0.02, 10, 8), M.petals[i % 4], x, 0.15 + h, z).scale.y = 0.7;
    if (i % 3 === 0) add(new THREE.SphereGeometry(0.07, 8, 6), M.stem, x + 0.06, 0.2, z).scale.set(1, 0.6, 0.8); }
  { const s = new THREE.Group(); s.position.set(-2.1, 0, -1.7); s.rotation.y = 0.35; root.add(s); add(box(1.0, 1.1, 0.8), M.shed, 0, 0.55, 0, s);
    for (const sg of [-1, 1]) { const r = add(box(0.62, 0.05, 0.95), M.roof, sg * 0.27, 1.27, 0, s); r.rotation.z = -sg * 0.55; }
    add(box(0.42, 0.75, 0.02), M.shedDoor, 0.1, 0.38, 0.41, s); }
  { const g = new THREE.Group(); g.position.set(2.1, 0, -1.6); root.add(g); add(new THREE.CylinderGeometry(0.09, 0.13, 1.6, 8), M.trunk, 0, 0.8, 0, g);
    for (const [dx, dy, dz, r, m] of [[0, 1.9, 0, 0.75, M.leafA], [-0.5, 1.7, 0.2, 0.5, M.leafB], [0.5, 1.75, 0.1, 0.55, M.leafB], [0, 2.4, -0.1, 0.5, M.leafA]]) add(new THREE.SphereGeometry(r, 14, 10), m, dx, dy, dz, g); }
  add(new THREE.SphereGeometry(0.08, 14, 10), M.ball, -1.0, 0.08, 0.7);

  // ---------- grass blades: short tufts across the lawn + the tall CHEW patch (instanced, like forest3d.js) ----------
  const NB = 2600, NC = 500, blades = new THREE.InstancedMesh(new THREE.ConeGeometry(0.022, 1, 4).translate(0, 0.5, 0), toon({ color: '#ffffff' }), NB);
  blades.castShadow = true; blades.receiveShadow = true; blades.frustumCulled = false; root.add(blades);
  blades.userData.ndSkip = true;   // grass is not inked (as in At Your Feet's forest; the kit's nd pass has no instancing)
  const B = [], col = new THREE.Color();
  for (let i = 0; i < NB; i++) {
    let x, z, h; const tall = i < NC;
    if (tall) { const a = R() * 6.28, r = Math.sqrt(R()) * CHEW.r; x = CHEW.x + Math.cos(a) * r; z = CHEW.z + Math.sin(a) * r; h = 0.18 + R() * 0.12; }
    else { x = (R() - 0.5) * 5.4; z = -1.75 + R() * 4.2; h = 0.06 + R() * 0.08; }
    B.push({ x, z, h, a: R() * 6.28, ph: R() * 6.28, tall }); blades.setColorAt(i, col.set(tall ? ['#4f9a4c', '#5fae55', '#3f8a42'][i % 3] : ['#6aaa4c', '#7cbc58', '#5c9c46'][i % 3]));
  }
  const m4 = new THREE.Matrix4(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3(), AXY = new THREE.Vector3(0, 1, 0), AXX = new THREE.Vector3(1, 0, 0);

  // ---------- sky dome, sun, lights ----------
  const sky = add(new THREE.SphereGeometry(40, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }), 0, -1, 0, root, false); sky.userData.ndSkip = true;
  for (const [s, op] of [[10, 0.6], [3, 1]]) { const m = add(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: glowTex('255,246,200'), transparent: true, depthWrite: false, fog: false, opacity: op }), 6, 10, -24, root, false); m.userData.ndSkip = true; }
  root.add(new THREE.HemisphereLight('#fff6e4', '#a8c48a', 1.8));
  const sun = new THREE.DirectionalLight('#fff0d4', 2.5); sun.castShadow = true; sun.position.set(-2.4, 4.5, 3.0); sun.target.position.set(0, 0, -0.4);
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
  { const c = sun.shadow.camera; c.left = -3.5; c.right = 3.5; c.top = 3.5; c.bottom = -3.5; c.near = 1; c.far = 14; c.updateProjectionMatrix(); }
  root.add(sun); root.add(sun.target);
  const fog = new THREE.Fog('#e8f4fb', 10, 34);

  /** st: { t seconds, chew: { amt 0..1 eaten, tug 0..1 bend toward the middle (the mouth) } } */
  const set = (st = {}) => {
    const t = st.t || 0, amt = clamp(st.chew?.amt ?? 0), tug = clamp(st.chew?.tug ?? 0);
    scene.background = scene.background || new THREE.Color(); scene.background.set('#e8f4fb'); scene.fog = fog;
    for (let i = 0; i < NB; i++) {
      const b = B[i]; let tilt = 0.06 + 0.04 * Math.sin(t * 1.6 + b.ph + b.x * 2), ang = b.a, h = b.h;
      if (b.tall) { const d = Math.hypot(b.x - CHEW.x, b.z - CHEW.z) / CHEW.r, eat = amt * clamp(1.3 - d);   // the middle goes first
        h *= 1 - 0.75 * eat; if (tug) { ang = Math.atan2(CHEW.x - b.x, CHEW.z - b.z); tilt += tug * 0.5 * clamp(1.2 - d) * (0.6 + 0.4 * Math.sin(t * 9 + b.ph)); } }
      qa.setFromAxisAngle(AXY, ang); qb.setFromAxisAngle(AXX, tilt); qa.multiply(qb);
      m4.compose(ps.set(b.x, 0, b.z), qa, sc.set(1, h, 1)); blades.setMatrixAt(i, m4);
    }
    blades.instanceMatrix.needsUpdate = true;
    root.updateMatrixWorld(true);
  };
  return { root, set, M };
};
