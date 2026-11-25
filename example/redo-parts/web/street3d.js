// ================= 3D hot summer park path (paved path, sun-bleached grass, round trees, bench, ONE big shade tree with a cool shadow pool), toon-shaded =================
// Inked by the project's post-process. Sky dome, sun, heat shimmer and the cool shade tint are flagged userData.ndSkip = true (hidden in the normal/depth pass).
//
//   import { createStreet, SHADE, PATH } from './street3d.js';
//   const street = createStreet(THREE, scene, { toon });        // main.js, once
//   street.set({ t: f / 30, heat: 0..1, shade: 0..1, focusX, cam });   // every frame: heat = shimmer + sun glare, shade = cool blue tint of the shadow pool, focusX = subject x, cam = camera pos
//
// World: the path runs along x (walk direction +x), centre line z = 0, half width PATH.half (pavers, y 0.02 on top), grass both sides, ground y = 0.
// The shade tree stands just behind the path at SHADE.tree; its crown hangs over the path and the high noon sun (behind-left, steep) drops its shadow
// on the path around SHADE.spot (put the lying puppy there). Bench + lamp post behind the path at x -2.2; distant round trees and hedges behind; warm haze fog.
// Camera presets (9:16): walk side-on pos [x, 1.25, 4.6] look [x, 0.55, 0] fov 40 (x = the owner); low heat shot pos [x+1.6, 0.35, 1.6] look [x, 0.3, 0] fov 44;
// shade shot pos [SHADE.spot.x + 0.9, 1.5, 3.4] look [SHADE.spot.x, 0.8, -0.2] fov 44 (crown + shadow pool + puppy in frame).

export const PATH = { half: 0.8, x0: -9, x1: 11 };
export const SHADE = { tree: [3.2, -1.25], spot: [3.0, -0.25] };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const rng = (seed) => { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

export const createStreet = (THREE, scene, { toon = (o) => new THREE.MeshToonMaterial(o) } = {}) => {
  const root = new THREE.Group(); root.name = 'street'; scene.add(root);
  const R = rng(7);
  const tex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = root, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

  // ---------- painted textures ----------
  const grassTex = (() => { const [c, g] = cv(256, 256); g.fillStyle = '#b9c66a'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 220; i++) { g.fillStyle = ['#a9b95c', '#c8d07a', '#9fb257', '#d2c981'][i % 4]; g.beginPath(); g.ellipse(R() * 256, R() * 256, 3 + R() * 10, 2 + R() * 4, R() * 3, 0, 7); g.fill(); }
    return tex(c, 14, 14); })();
  const paveTex = (() => { const [c, g] = cv(256, 256); g.fillStyle = '#c9a77a'; g.fillRect(0, 0, 256, 256);
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const o = j % 2 ? 32 : 0; for (const dx of [0, 256]) { g.fillStyle = ['#ecd4a6', '#e6caa0', '#f0dab0'][(i + j) % 3]; g.beginPath(); g.roundRect(i * 64 + o + 3 - dx, j * 64 + 3, 58, 58, 8); g.fill(); } }
    return tex(c, 1, 1); })();
  const skyTex = (() => { const [c, g] = cv(64, 512); const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#6fb4ec'); gr.addColorStop(0.55, '#b9dcf2'); gr.addColorStop(0.8, '#fbe7b4'); gr.addColorStop(1, '#ffd98e');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 512); const t = tex(c); t.wrapS = THREE.ClampToEdgeWrapping; return t; })();
  const glowTex = (rgb) => { const [c, g] = cv(128, 128); const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, `rgba(${rgb},.9)`); r.addColorStop(0.35, `rgba(${rgb},.45)`); r.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return tex(c); };
  const raysTex = (() => { const [c, g] = cv(256, 256); g.translate(128, 128); g.fillStyle = 'rgba(255,236,150,.85)';
    for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(-9, 70); g.lineTo(9, 70); g.lineTo(0, 124); g.closePath(); g.fill(); } return tex(c); })();
  const heatTex = (() => { const [c, g] = cv(128, 256); g.lineWidth = 5; g.lineCap = 'round';
    for (const [x, col] of [[30, 'rgba(255,250,235,.9)'], [64, 'rgba(255,220,160,.8)'], [98, 'rgba(255,250,235,.9)']]) { g.strokeStyle = col; g.beginPath(); for (let y = 0; y <= 256; y += 4) g.lineTo(x + 9 * Math.sin(y / 256 * Math.PI * 4), y); g.stroke(); }
    const t = tex(c); return t; })();

  const M = {
    grass: toon({ map: grassTex }), pave: toon({ map: paveTex }), curb: toon({ color: '#e9e4da' }), trunk: toon({ color: '#7a5036' }),
    leafA: toon({ color: '#5f9e4e' }), leafB: toon({ color: '#78b25a' }), leafC: toon({ color: '#4d8a46' }), hedge: toon({ color: '#6aa553' }),
    wood: toon({ color: '#b07a4a' }), metal: toon({ color: '#4a5a6a' }), lampHead: toon({ color: '#fff4d6' }), bin: toon({ color: '#3f7f6a' }),
  };

  // ---------- ground, path, curbs ----------
  const ground = add(new THREE.PlaneGeometry(60, 40), M.grass, 1, 0, -8, root, false); ground.rotation.x = -Math.PI / 2;
  const pLen = PATH.x1 - PATH.x0, pc = (PATH.x0 + PATH.x1) / 2;
  paveTex.repeat.set(pLen / 1.6, 1);
  add(box(pLen, 0.02, PATH.half * 2), M.pave, pc, 0.01, 0, root, false);
  for (const s of [-1, 1]) add(box(pLen, 0.045, 0.08), M.curb, pc, 0.022, s * (PATH.half + 0.04), root, false);

  // ---------- trees (round crowns), the big shade tree, hedges, bench, lamp, bin ----------
  const tree = (x, z, h, r, mats) => { const g = new THREE.Group(); g.position.set(x, 0, z); root.add(g);
    add(new THREE.CylinderGeometry(0.07 * r / 0.6, 0.11 * r / 0.6, h, 8), M.trunk, 0, h / 2, 0, g);
    for (const [dx, dy, dz, k, m] of [[0, 0, 0, 1, 0], [-0.55, -0.15, 0.1, 0.72, 1], [0.55, -0.1, -0.05, 0.75, 2], [0.1, 0.45, -0.1, 0.7, 1]]) add(new THREE.SphereGeometry(r * k, 14, 10), mats[m], dx * r, h + dy * r, dz * r, g);
    return g; };
  for (let i = 0; i < 16; i++) tree(-12 + i * 1.6 + R() * 0.8, -5.5 - R() * 3, 1.6 + R() * 0.9, 0.55 + R() * 0.35, [M.leafA, M.leafB, M.leafC]);
  for (let i = 0; i < 9; i++) { const h = add(new THREE.SphereGeometry(1, 12, 8), M.hedge, -9 + i * 2.4, 0.3, -3.4); h.scale.set(1.2, 0.45, 0.5); }
  // the shade tree: tall trunk, wide crown leaning out over the path
  const big = new THREE.Group(); big.position.set(SHADE.tree[0], 0, SHADE.tree[1]); root.add(big);
  { const tr = add(new THREE.CylinderGeometry(0.13, 0.2, 2.3, 10), M.trunk, 0, 1.15, 0, big); tr.rotation.x = 0.12;
    for (const [dx, dy, dz, r, m] of [[0, 2.55, 0.5, 1.15, M.leafA], [-0.85, 2.3, 0.75, 0.8, M.leafB], [0.9, 2.35, 0.55, 0.85, M.leafC], [0.1, 3.15, 0.35, 0.8, M.leafB], [0.2, 2.2, 1.25, 0.7, M.leafC], [-0.5, 2.9, -0.2, 0.7, M.leafA]]) add(new THREE.SphereGeometry(r, 16, 12), m, dx, dy, dz, big); }
  // cool shadow pool: a soft blue tint laid on the ground under the crown (the real shadow does the shape; this makes it read "cool")
  const poolMat = new THREE.MeshBasicMaterial({ map: glowTex('120,170,255'), transparent: true, depthWrite: false, opacity: 0, fog: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const pool = add(new THREE.PlaneGeometry(3.4, 2.6), poolMat, SHADE.spot[0], 0.025, SHADE.spot[1] - 0.15, root, false); pool.rotation.x = -Math.PI / 2; pool.userData.ndSkip = true;
  // bench + lamp post + bin behind the path
  { const b = new THREE.Group(); b.position.set(-2.2, 0, -1.25); root.add(b);
    for (const y of [0.42, 0.62, 0.74]) add(box(1.4, 0.05, y === 0.42 ? 0.4 : 0.06), M.wood, 0, y, y === 0.42 ? 0 : -0.19, b);
    for (const x of [-0.6, 0.6]) { add(box(0.06, 0.42, 0.36), M.metal, x, 0.21, 0, b); add(box(0.05, 0.4, 0.05), M.metal, x, 0.6, -0.19, b); } }
  { const l = new THREE.Group(); l.position.set(-0.6, 0, -1.2); root.add(l); add(new THREE.CylinderGeometry(0.04, 0.06, 2.6, 8), M.metal, 0, 1.3, 0, l); add(new THREE.SphereGeometry(0.16, 12, 10), M.lampHead, 0, 2.7, 0, l); }
  add(new THREE.CylinderGeometry(0.2, 0.17, 0.6, 12), M.bin, 0.8, 0.3, -1.2);

  // ---------- sky dome + sun ----------
  const sky = add(new THREE.SphereGeometry(40, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false }), 1, -1, 0, root, false); sky.userData.ndSkip = true;
  const sunG = new THREE.Group(); sunG.position.set(-1.5, 8.5, -24); root.add(sunG);
  const sunMk = (map, s, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false, fog: false })); m.position.z = z; m.userData.ndSkip = true; sunG.add(m); return m; };
  const halo = sunMk(glowTex('255,226,140'), 12, 0), rays = sunMk(raysTex, 7, 0.05), disc = sunMk(glowTex('255,252,230'), 3.2, 0.1);

  // ---------- heat shimmer: wavy rising lines over the path (ribbons that scroll up and fade) ----------
  const heat = [];
  for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.9), new THREE.MeshBasicMaterial({ map: heatTex.clone(), transparent: true, depthWrite: false, opacity: 0, fog: false }));
    m.material.map.needsUpdate = true; m.userData.ndSkip = true; m.userData.base = [PATH.x0 + 3 + i * 1.25 + R() * 0.5, 0.42, (R() - 0.5) * 1.2, R() * 6]; root.add(m); heat.push(m); }

  // ---------- lights: warm hemi + high noon sun from behind-left (steep: the crown's shadow lands ON the path) + a soft front fill (no shadows) for the faces ----------
  const hemi = new THREE.HemisphereLight('#fff3d6', '#c9b07a', 1.7); root.add(hemi);
  const SUN = [-2, 8, -2.5];
  const sun = new THREE.DirectionalLight('#fff0cc', 2.6); sun.castShadow = true; sun.position.set(...SUN); sun.target.position.set(0, 0, 0);
  const fill = new THREE.DirectionalLight('#fff4e0', 1.5); fill.position.set(1.5, 3, 6); root.add(fill);
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
  root.add(sun); root.add(sun.target);
  const fog = new THREE.Fog('#f7e2b2', 9, 34);

  // ---------- set(): one call per frame ----------
  /** st: { t seconds, heat 0..1 (shimmer + sun glare), shade 0..1 (cool tint of the shadow pool), focusX = x the sun's shadow box follows (the subject, default 0), cam = camera position [x,y,z] (the shimmer ribbons turn to it) } */
  const set = (st = {}) => {
    const t = st.t || 0, h = clamp(st.heat ?? 0.6);
    scene.background = scene.background || new THREE.Color(); scene.background.set('#f7e2b2'); scene.fog = fog;
    // shadow box follows the action along the path
    const fx = st.focusX ?? 0; sun.position.set(fx + SUN[0], SUN[1], SUN[2]); sun.target.position.set(fx, 0, 0);
    { const c = sun.shadow.camera; c.left = -4.5; c.right = 4.5; c.top = 4.5; c.bottom = -4.5; c.near = 1; c.far = 20; c.updateProjectionMatrix(); }
    poolMat.opacity = 0.55 * clamp(st.shade ?? 0);
    rays.rotation.z = t * 0.25; rays.material.opacity = 0.35 + 0.65 * h; halo.scale.setScalar(0.8 + 0.4 * h + 0.04 * Math.sin(t * 3)); halo.material.opacity = 0.5 + 0.5 * h;
    heat.forEach((m) => { const [x, y, z, ph] = m.userData.base, k = ((t * 0.45 + ph) % 1); m.position.set(x + 0.04 * Math.sin(t * 2 + ph), y + k * 0.5, z); m.material.opacity = h * 0.55 * Math.sin(Math.PI * k);
      m.material.map.offset.y = -t * 0.6; if (st.cam) m.lookAt(st.cam[0], m.position.y, st.cam[2]); });
    root.updateMatrixWorld(true);
  };
  return { root, set, heat, sun, M };
};
