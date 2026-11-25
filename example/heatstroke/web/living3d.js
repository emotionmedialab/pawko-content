// ================= 3D daytime living room (sofa, rug, window, plant, water bowl) + a standing ELECTRIC FAN with spinning blades and visible air lines =================
// Inked by the project's post-process. The window sky and the air lines are flagged userData.ndSkip = true.
//
//   import { createLiving, FAN, SPOT } from './living3d.js';
//   const room = createLiving(THREE, scene, { toon });      // main.js, once
//   room.set({ t: f / 30, fan: 0..1, air: 0..1 });            // every frame: fan = blade speed (0 = still), air = how strong the air lines are
//
// Room space: floor y = 0, back wall z = -2 (window right of centre, sofa under it), side walls x = +-2.4, open toward +z (camera side).
// The fan stands at FAN.pos facing SPOT (the cool spot on the rug in its airflow: lay the puppy there, head toward the fan).
// room.pts() -> { fanFace (world point at the fan's grille centre), bowl (water bowl centre) }.
// Camera presets (9:16): fan + puppy pos [0.55, 1.0, 2.9] look [-0.3, 0.45, 0.0] fov 44; owner on the phone behind the puppy pos [0.9, 1.3, 3.6] look [0.35, 0.92, -0.3] fov 42.

export const FAN = { pos: [-0.8, -0.35], h: 0.95 };
export const SPOT = [0.1, 0.35];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

export const createLiving = (THREE, scene, { toon = (o) => new THREE.MeshToonMaterial(o) } = {}) => {
  const root = new THREE.Group(); root.name = 'living'; scene.add(root);
  const tex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = root, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const rbox = (w, h, d, r) => { const s = new THREE.Shape(), x = w / 2 - r, y = h / 2 - r; s.absarc(x, y, r, 0, Math.PI / 2); s.absarc(-x, y, r, Math.PI / 2, Math.PI); s.absarc(-x, -y, r, Math.PI, Math.PI * 1.5); s.absarc(x, -y, r, Math.PI * 1.5, Math.PI * 2);
    const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelThickness: r, bevelSize: r * 0.6, bevelSegments: 3 }); g.translate(0, 0, -(d - 2 * r) / 2); return g; };

  // ---------- painted textures (floor copied from bedroom3d.js) ----------
  const floorTex = (() => { const [c, g] = cv(512, 512); const cols = ['#c98f55', '#bd824a', '#d29a62', '#c28850'];
    for (let i = 0; i < 8; i++) { g.fillStyle = cols[i % 4]; g.fillRect(0, i * 64, 512, 64); g.fillStyle = 'rgba(70,38,16,.9)'; g.fillRect(0, i * 64, 512, 3);
      const cut = (i * 211) % 512; g.fillRect(cut, i * 64, 3, 64);
      for (let k = 0; k < 6; k++) { g.strokeStyle = 'rgba(110,64,28,.35)'; g.lineWidth = 1.5; g.beginPath(); const y = i * 64 + 8 + k * 9; g.moveTo(0, y); g.bezierCurveTo(150, y + 3, 300, y - 3, 512, y + 2); g.stroke(); } }
    return tex(c, 3, 3); })();
  const rugTex = (() => { const [c, g] = cv(256, 256); g.fillStyle = '#e9b54f'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#c98a2e'; g.lineWidth = 10;
    for (const r of [118, 92, 66]) { g.beginPath(); g.arc(128, 128, r, 0, 7); g.stroke(); } return tex(c); })();
  const skyTex = (() => { const [c, g] = cv(256, 320); const gr = g.createLinearGradient(0, 0, 0, 320); gr.addColorStop(0, '#5fa6f0'); gr.addColorStop(1, '#bfe0fa'); g.fillStyle = gr; g.fillRect(0, 0, 256, 320);
    g.fillStyle = '#fff'; for (const [x, y, r] of [[70, 90, 26], [100, 100, 32], [135, 92, 24], [190, 210, 22], [215, 218, 28]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.fillStyle = '#ffe48a'; g.beginPath(); g.arc(190, 60, 30, 0, 7); g.fill(); g.fillStyle = '#7fbf6a'; g.fillRect(0, 280, 256, 40); return tex(c); })();
  const dashTex = (() => { const [c, g] = cv(256, 8); for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,255,255,1)'; g.beginPath(); g.roundRect(i * 64 + 4, 1, 34, 6, 3); g.fill(); } return tex(c); })();
  const M = {
    floor: toon({ map: floorTex }), wall: toon({ color: '#efe0c6' }), base: toon({ color: '#fbf5ea' }), frame: toon({ color: '#fbf5ea' }), curtain: toon({ color: '#e07a5f' }),
    sofa: toon({ color: '#4f86c6' }), cushion: toon({ color: '#f2c14e' }), wood: toon({ color: '#9a6a44' }), rug: toon({ map: rugTex }), pot: toon({ color: '#d9734a' }),
    leaf: toon({ color: '#5aa35a' }), leafD: toon({ color: '#3f8a4a' }), art: toon({ color: '#9ad0c2' }), artF: toon({ color: '#7a4e33' }), bowl: toon({ color: '#d84f4f' }), water: toon({ color: '#9fdcff' }),
    fan: toon({ color: '#eef4f8' }), fanD: toon({ color: '#9fb4c4' }), blade: toon({ color: '#8fc9e8' }),
  };

  // ---------- shell: floor, back wall with a window, side walls, skirting ----------
  const floor = add(new THREE.PlaneGeometry(4.8, 6), M.floor, 0, 0, 1, root, false); floor.rotation.x = -Math.PI / 2;
  const WZ = -2, CH = 3.2, wx0 = 0.35, wx1 = 1.55, wy0 = 1.0, wy1 = 2.1;
  const wall = (x0, y0, x1, y1) => add(box(x1 - x0, y1 - y0, 0.1), M.wall, (x0 + x1) / 2, (y0 + y1) / 2, WZ, root, false);
  wall(-2.4, 0, wx0, CH); wall(wx1, 0, 2.4, CH); wall(wx0, 0, wx1, wy0); wall(wx0, wy1, wx1, CH);
  const sky = add(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: skyTex, fog: false }), (wx0 + wx1) / 2, (wy0 + wy1) / 2, WZ - 0.15, root, false); sky.userData.ndSkip = true;
  for (const [w, h, x, y] of [[1.3, 0.06, 0.95, wy0], [1.3, 0.06, 0.95, wy1], [0.06, 1.16, wx0, 1.55], [0.06, 1.16, wx1, 1.55], [0.04, 1.1, 0.95, 1.55]]) add(box(w, h, 0.12), M.frame, x, y, WZ + 0.03, root, false);
  for (const s of [-1, 1]) add(box(0.32, 1.5, 0.06), M.curtain, 0.95 + s * 0.78, 1.5, WZ + 0.12, root, false);
  for (const s of [-1, 1]) add(box(0.1, CH, 6), M.wall, s * 2.4, CH / 2, 1, root, false);
  add(box(4.8, 0.12, 0.04), M.base, 0, 0.06, WZ + 0.07, root, false);
  // picture on the wall left of the window
  add(box(0.7, 0.5, 0.04), M.artF, -1.1, 1.65, WZ + 0.07); add(box(0.6, 0.4, 0.02), M.art, -1.1, 1.65, WZ + 0.1);

  // ---------- sofa under the window, rug, plant, water bowl ----------
  const sofa = new THREE.Group(); sofa.position.set(0.95, 0, -1.55); root.add(sofa);
  add(rbox(1.9, 0.36, 0.8, 0.08), M.sofa, 0, 0.3, 0, sofa); add(rbox(1.9, 0.5, 0.22, 0.08), M.sofa, 0, 0.7, -0.3, sofa);
  for (const s of [-1, 1]) add(rbox(0.22, 0.5, 0.8, 0.08), M.sofa, s * 0.92, 0.45, 0, sofa);
  for (const x of [-0.45, 0.45]) { const c = add(rbox(0.5, 0.36, 0.14, 0.06), M.cushion, x, 0.68, -0.13, sofa); c.rotation.x = -0.25; }
  for (const [x, z] of [[-0.85, 0.32], [0.85, 0.32], [-0.85, -0.32], [0.85, -0.32]]) add(new THREE.CylinderGeometry(0.03, 0.025, 0.12, 8), M.wood, x, 0.06, z, sofa);
  const rug = add(new THREE.CylinderGeometry(1.25, 1.25, 0.012, 40), M.rug, 0.1, 0.006, 0.15, root, false); rug.scale.z = 0.8;
  { const p = new THREE.Group(); p.position.set(-1.95, 0, -1.6); root.add(p); add(new THREE.CylinderGeometry(0.2, 0.15, 0.36, 14), M.pot, 0, 0.18, 0, p);
    for (let i = 0; i < 7; i++) { const l = add(new THREE.SphereGeometry(0.13, 10, 8), i % 2 ? M.leaf : M.leafD, Math.cos(i * 0.9) * 0.14, 0.5 + (i % 3) * 0.16, Math.sin(i * 0.9) * 0.14, p); l.scale.set(0.8, 1.5, 0.5); l.rotation.set(Math.cos(i) * 0.5, i, Math.sin(i) * 0.5); } }
  const bowlP = [1.55, 0.55];
  add(new THREE.CylinderGeometry(0.13, 0.16, 0.07, 18), M.bowl, bowlP[0], 0.035, bowlP[1]); add(new THREE.CircleGeometry(0.11, 18), M.water, bowlP[0], 0.066, bowlP[1]).rotation.x = -Math.PI / 2;

  // ---------- standing electric fan: base, pole, motor, grille rings + spokes, 3 spinning blades; aimed at SPOT ----------
  const fan = new THREE.Group(); fan.position.set(FAN.pos[0], 0, FAN.pos[1]); root.add(fan);
  fan.rotation.y = Math.atan2(SPOT[0] - FAN.pos[0], SPOT[1] - FAN.pos[1]);   // local +z = toward the spot
  add(new THREE.CylinderGeometry(0.2, 0.23, 0.05, 24), M.fanD, 0, 0.025, 0, fan); add(new THREE.CylinderGeometry(0.022, 0.026, FAN.h, 10), M.fan, 0, FAN.h / 2, 0, fan);
  const headG = new THREE.Group(); headG.position.set(0, FAN.h, 0); headG.rotation.x = 0.42; fan.add(headG);   // tipped down toward the floor
  add(new THREE.SphereGeometry(0.09, 14, 10), M.fan, 0, 0, -0.1, headG).scale.set(1, 1, 1.3);
  for (const z of [0.02, 0.1]) add(new THREE.TorusGeometry(0.26, 0.012, 8, 36), M.fan, 0, 0, z, headG);
  for (let i = 0; i < 8; i++) { const sp = add(new THREE.CylinderGeometry(0.005, 0.005, 0.52, 4), M.fan, 0, 0, 0.1, headG, false); sp.rotation.z = i * Math.PI / 8; }
  add(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16), M.fanD, 0, 0, 0.11, headG).rotation.x = Math.PI / 2;
  const blades = new THREE.Group(); blades.position.z = 0.06; headG.add(blades);
  for (let i = 0; i < 3; i++) { const g = new THREE.Group(); g.rotation.z = i * Math.PI * 2 / 3; blades.add(g); const b = add(new THREE.SphereGeometry(1, 14, 8), M.blade, 0, 0.13, 0, g); b.scale.set(0.085, 0.12, 0.012); b.rotation.y = 0.35; }
  add(new THREE.SphereGeometry(0.035, 10, 8), M.fanD, 0, 0, 0.06, headG);

  // ---------- air lines: thin dashed tubes flowing from the grille toward the spot (dashes scroll along them) ----------
  root.updateMatrixWorld(true);
  const airMat = new THREE.MeshBasicMaterial({ map: dashTex, transparent: true, depthWrite: false, opacity: 0, fog: false });
  const air = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2, r = 0.05 + 0.13 * ((i * 3) % 4) / 3, pts = [];
    for (let k = 0; k <= 12; k++) { const u = k / 12, sp = 0.12 + 0.35 * u;   // the stream widens as it travels
      pts.push(headG.localToWorld(new THREE.Vector3(Math.cos(a) * r * (1 + 2.2 * u) + 0.05 * Math.sin(u * 9 + i), Math.sin(a) * r * (1 + 1.4 * u) + 0.04 * Math.cos(u * 8 + i * 2), 0.18 + u * 1.7 * (0.9 + 0.1 * (i % 3)))).add(new THREE.Vector3(0, -sp * 0.0, 0))); }
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.012, 5, false), airMat.clone()); m.material.map = dashTex.clone(); m.material.map.needsUpdate = true; m.material.map.repeat.set(2, 1);
    m.userData.ndSkip = true; m.userData.ph = i * 0.31; root.add(m); air.push(m);
  }

  // ---------- lights: bright daylight (bedroom3d.js 'day' preset values) ----------
  root.add(new THREE.HemisphereLight('#fff6e4', '#c9b49a', 1.9));
  const key = new THREE.DirectionalLight('#fff0d4', 2.6); key.castShadow = true; key.position.set(-2.4, 3.6, 2.8); key.target.position.set(0, 0.4, 0);
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0006; key.shadow.normalBias = 0.03; key.shadow.radius = 2;
  { const c = key.shadow.camera; c.left = -3; c.right = 3; c.top = 3; c.bottom = -3; c.near = 1; c.far = 12; c.updateProjectionMatrix(); }
  root.add(key); root.add(key.target);

  /** st: { t seconds, fan 0..1 blade speed, air 0..1 air-line strength } */
  const set = (st = {}) => {
    const t = st.t || 0, sp = clamp(st.fan ?? 1), a = clamp(st.air ?? sp);
    scene.background = scene.background || new THREE.Color(); scene.background.set('#efe0c6'); scene.fog = null;
    blades.rotation.z = -t * 26 * sp;   // ~4 rev/s at full speed (strobes into a blur-like look at 30 fps, like a real fan on video)
    air.forEach((m) => { m.material.opacity = a; m.material.map.offset.x = -(t * 1.4 + m.userData.ph); });
    root.updateMatrixWorld(true);
  };
  const pts = () => ({ fanFace: headG.localToWorld(new THREE.Vector3(0, 0, 0.1)), bowl: new THREE.Vector3(bowlP[0], 0.07, bowlP[1]) });
  return { root, set, pts, M };
};
