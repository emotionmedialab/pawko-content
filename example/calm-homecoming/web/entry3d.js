// ================= 3D front-door ENTRYWAY by day (front door that opens onto a sunny street, key rack, console table + key bowl, coat hooks + coat, shoe mat, wall clock) =================
// Inked by the project's post-process. The outside view (sky + garden card) and the door glow are flagged userData.ndSkip = true.
//
//   import { createEntry, DOOR, RACK, MAT } from './entry3d.js';
//   const hall = createEntry(THREE, scene, { toon });     // main.js, once
//   hall.set({ door: 0..1, keysOnHook: bool, shoesOnMat: bool, clock: minutes past 12 (analog wall clock) });   // every frame
//
// Room space: floor y = 0, back wall z = -1.8 with the front door in the middle (opening x -0.475..0.475, 2.1 high), hinged on its LEFT (x -0.475),
// it swings into the hall toward the camera (door 1 = ~86 deg open). Outside the doorway: a sunny garden card. Side walls x = +-1.7, open toward +z.
// Back wall right of the door: console table + key bowl, key rack above it (RACK = hook point for the owner's left hand). Left wall: coat hooks + coat.
// Shoe mat in front of the door (MAT centre); one pair of sneakers always stands at its right end, `shoesOnMat` adds the owner's pair (after he takes them off:
// owner.setShoes(false) on the same frame). Analog wall clock left of the door.
// hall.pts() -> { rack (world hook point), bowl, knob (inside door handle), mat }. Owner walking in: at [0, -2.3] -> [0, -1.0], face 0 (toward the camera).
// Camera presets (9:16): door + owner full body pos [0.35, 1.25, 2.6] look [0.1, 0.95, -1.0] fov 46; low puppy-at-his-legs pos [0.6, 0.55, 1.2] look [0.05, 0.5, -0.9] fov 44.

export const DOOR = { x0: -0.475, x1: 0.475, h: 2.1, z: -1.8 };
export const RACK = [0.95, 1.38, -1.74];
export const MAT = [0, -1.38];
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

export const createEntry = (THREE, scene, { toon = (o) => new THREE.MeshToonMaterial(o) } = {}) => {
  const root = new THREE.Group(); root.name = 'entry'; scene.add(root);
  const tex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = root, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

  // ---------- painted textures ----------
  const tileTex = (() => { const [c, g] = cv(256, 256); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#f3e6cf' : '#d9774f'; g.fillRect(i * 64, j * 64, 64, 64); }
    g.strokeStyle = 'rgba(90,50,30,.45)'; g.lineWidth = 2; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 256); g.moveTo(0, i * 64); g.lineTo(256, i * 64); g.stroke(); } return tex(c, 3.4, 9.4); })();
  const outTex = (() => { const [c, g] = cv(256, 512); const gr = g.createLinearGradient(0, 0, 0, 300); gr.addColorStop(0, '#5fa6f0'); gr.addColorStop(1, '#cfe9fb'); g.fillStyle = gr; g.fillRect(0, 0, 256, 512);
    g.fillStyle = '#fff'; for (const [x, y, r] of [[60, 80, 26], [92, 92, 32], [128, 84, 22]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    g.fillStyle = '#6fb15a'; g.beginPath(); g.ellipse(40, 290, 90, 60, 0, 0, 7); g.ellipse(220, 300, 80, 55, 0, 0, 7); g.fill();   // bushes
    g.fillStyle = '#8fcf6a'; g.fillRect(0, 320, 256, 192); g.fillStyle = '#e8d2a8'; g.beginPath(); g.moveTo(90, 512); g.lineTo(166, 512); g.lineTo(140, 320); g.lineTo(116, 320); g.fill();   // lawn + path
    return tex(c); })();
  const M = {
    tile: toon({ map: tileTex }), floor: toon({ color: '#c98f55' }), wall: toon({ color: '#f1e3c8' }), base: toon({ color: '#fbf5ea' }), frame: toon({ color: '#fbf5ea' }),
    door: toon({ color: '#3f7f8f' }), doorP: toon({ color: '#356c7a' }), knob: toon({ color: '#d9b050' }), wood: toon({ color: '#9a6a44' }), woodL: toon({ color: '#b98256' }),
    mat: toon({ color: '#7a5036' }), matTrim: toon({ color: '#5a3a28' }), coat: toon({ color: '#e0a23e' }), coatD: toon({ color: '#c4862a' }), metal: toon({ color: '#c9ccd4' }),
    bowl: toon({ color: '#5f9ec9' }), shoeA: toon({ color: '#6a4330' }), shoeB: toon({ color: '#e05a4f' }), sole: toon({ color: '#f6efe2' }), key: toon({ color: '#e2b84a' }),
    clock: toon({ color: '#fbf5ea' }), clockRim: toon({ color: '#d9774f' }), dark: toon({ color: '#2b1d1d' }), plant: toon({ color: '#5aa35a' }), pot: toon({ color: '#d9734a' }),
  };

  // ---------- shell: floor (tiles by the door, wood beyond), back wall with the doorway, side walls ----------
  const floor = add(new THREE.PlaneGeometry(3.4, 5), M.floor, 0, 0, 0.7, root, false); floor.rotation.x = -Math.PI / 2;
  const tiles = add(new THREE.PlaneGeometry(3.4, 5), M.tile, 0, 0.002, 0.7, root, false); tiles.rotation.x = -Math.PI / 2;   // calm-homecoming v4: tiles over the whole floor (the plain wood floor read as a flat orange band in low shots)
  const WZ = DOOR.z, CH = 3.0;
  const wallB = (x0, y0, x1, y1) => add(box(x1 - x0, y1 - y0, 0.12), M.wall, (x0 + x1) / 2, (y0 + y1) / 2, WZ, root, false);
  wallB(-1.7, 0, DOOR.x0, CH); wallB(DOOR.x1, 0, 1.7, CH); wallB(DOOR.x0, DOOR.h, DOOR.x1, CH);
  for (const s of [-1, 1]) add(box(0.12, CH, 5), M.wall, s * 1.7, CH / 2, 0.7, root, false);
  for (const x of [DOOR.x0 - 0.04, DOOR.x1 + 0.04]) add(box(0.08, DOOR.h + 0.04, 0.18), M.frame, x, DOOR.h / 2, WZ, root, false);
  add(box(DOOR.x1 - DOOR.x0 + 0.16, 0.08, 0.18), M.frame, 0, DOOR.h + 0.02, WZ, root, false);
  add(box(DOOR.x1 - DOOR.x0, 0.03, 0.2), M.base, 0, 0.015, WZ, root, false);   // threshold
  for (const [x0, x1] of [[-1.7, DOOR.x0 - 0.08], [DOOR.x1 + 0.08, 1.7]]) add(box(x1 - x0, 0.12, 0.04), M.base, (x0 + x1) / 2, 0.06, WZ + 0.08, root, false);
  // outside: porch floor + sunny garden card behind the doorway
  const porch = add(new THREE.PlaneGeometry(1.6, 1.2), toon({ color: '#d8c6a4' }), 0, 0.001, WZ - 0.65, root, false); porch.rotation.x = -Math.PI / 2;
  const out = add(new THREE.PlaneGeometry(2.4, 3.2), new THREE.MeshBasicMaterial({ map: outTex, fog: false }), 0, 1.3, WZ - 1.25, root, false); out.userData.ndSkip = true;
  const sunL = new THREE.PointLight('#fff2cc', 0, 4, 1.5); sunL.position.set(0, 1.6, WZ - 0.4); root.add(sunL);   // daylight spilling in when the door opens

  // ---------- the door (hinged on its left, swings in toward the camera) ----------
  const hinge = new THREE.Group(); hinge.position.set(DOOR.x0 + 0.01, 0, WZ + 0.03); root.add(hinge);
  const dw = DOOR.x1 - DOOR.x0 - 0.02;
  add(box(dw, DOOR.h - 0.02, 0.05), M.door, dw / 2, (DOOR.h - 0.02) / 2, 0, hinge);
  for (const y of [0.55, 1.45]) add(box(dw - 0.22, 0.62, 0.012), M.doorP, dw / 2, y, 0.03, hinge, false);
  add(new THREE.SphereGeometry(0.04, 10, 8), M.knob, dw - 0.1, 1.0, 0.06, hinge); add(new THREE.SphereGeometry(0.04, 10, 8), M.knob, dw - 0.1, 1.0, -0.06, hinge);
  add(new THREE.CircleGeometry(0.06, 16), new THREE.MeshBasicMaterial({ color: '#cfe9fb' }), dw / 2, 1.82, 0.031, hinge, false);   // little round window

  // ---------- console table + key bowl + key rack (right of the door), plant ----------
  const tab = new THREE.Group(); tab.position.set(0.98, 0, WZ + 0.22); root.add(tab);
  add(box(0.8, 0.04, 0.32), M.woodL, 0, 0.8, 0, tab); for (const [x, z] of [[-0.36, -0.12], [0.36, -0.12], [-0.36, 0.12], [0.36, 0.12]]) add(box(0.04, 0.8, 0.04), M.wood, x, 0.4, z, tab);
  add(box(0.72, 0.03, 0.26), M.wood, 0, 0.18, 0, tab);
  const bowl = add(new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.bowl, -0.18, 0.92, 0.0, tab); bowl.scale.y = 0.5; bowl.material.side = THREE.DoubleSide;
  { const p = new THREE.Group(); p.position.set(0.25, 0.82, 0); tab.add(p); add(new THREE.CylinderGeometry(0.07, 0.055, 0.12, 12), M.pot, 0, 0.06, 0, p);
    for (let i = 0; i < 5; i++) { const l = add(new THREE.SphereGeometry(0.06, 8, 6), M.plant, Math.cos(i * 1.3) * 0.05, 0.18 + (i % 2) * 0.06, Math.sin(i * 1.3) * 0.05, p); l.scale.set(0.7, 1.4, 0.5); l.rotation.z = Math.cos(i) * 0.5; } }
  const rack = new THREE.Group(); rack.position.set(RACK[0], RACK[1], WZ + 0.06); root.add(rack);
  add(box(0.42, 0.12, 0.03), M.woodL, 0, 0.03, 0, rack);
  for (const x of [-0.13, 0, 0.13]) { add(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 6), M.metal, x, 0, 0.03, rack).rotation.x = Math.PI / 2; }
  const hookKeys = new THREE.Group(); hookKeys.position.set(0, -0.005, 0.055); rack.add(hookKeys);   // the owner's keys once they are hung up (middle hook)
  add(new THREE.TorusGeometry(0.035, 0.008, 6, 16), M.key, 0, -0.03, 0, hookKeys);
  for (const [x, r] of [[-0.02, 0.3], [0.022, -0.35]]) { const k = new THREE.Group(); k.position.set(x, -0.06, 0); k.rotation.z = r; hookKeys.add(k);
    add(new THREE.CylinderGeometry(0.02, 0.02, 0.008, 12), M.key, 0, -0.01, 0, k).rotation.x = Math.PI / 2; add(box(0.012, 0.07, 0.006), M.key, 0, -0.055, 0, k); }

  // ---------- coat hooks + a hanging coat (left wall), wall clock left of the door ----------
  const coatG = new THREE.Group(); coatG.position.set(-1.62, 0, -1.05); root.add(coatG);
  add(box(0.03, 0.1, 0.6), M.woodL, 0, 1.75, 0, coatG); for (const z of [-0.18, 0.18]) add(new THREE.SphereGeometry(0.025, 8, 6), M.metal, 0.05, 1.75, z, coatG);
  { const c = add(new THREE.CapsuleGeometry(0.16, 0.55, 6, 14), M.coat, 0.14, 1.32, -0.18, coatG); c.scale.set(0.6, 1, 1); add(new THREE.SphereGeometry(0.1, 10, 8), M.coatD, 0.12, 1.72, -0.18, coatG).scale.set(0.6, 0.6, 1.4); }
  const clockG = new THREE.Group(); clockG.position.set(-1.05, 1.8, WZ + 0.08); root.add(clockG);
  add(new THREE.CylinderGeometry(0.17, 0.17, 0.04, 28), M.clockRim, 0, 0, 0, clockG).rotation.x = Math.PI / 2;
  add(new THREE.CircleGeometry(0.145, 28), M.clock, 0, 0, 0.021, clockG, false);
  for (let i = 0; i < 12; i++) add(new THREE.SphereGeometry(0.008, 6, 4), M.dark, Math.sin(i * Math.PI / 6) * 0.12, Math.cos(i * Math.PI / 6) * 0.12, 0.024, clockG, false);
  const hand = (len, w) => { const g = new THREE.Group(); g.position.z = 0.03; clockG.add(g); add(box(w, len, 0.006), M.dark, 0, len / 2 - 0.01, 0, g, false); return g; };
  const hourH = hand(0.08, 0.016), minH = hand(0.12, 0.01);

  // ---------- shoe mat + sneakers ----------
  add(box(0.95, 0.025, 0.55), M.matTrim, MAT[0], 0.0125, MAT[1], root, false); add(box(0.87, 0.028, 0.47), M.mat, MAT[0], 0.014, MAT[1], root, false);
  const sneaker = (x, z, ry, mat, parent) => { const g = new THREE.Group(); g.position.set(x, 0.028, z); g.rotation.y = ry; parent.add(g);
    add(new THREE.SphereGeometry(1, 14, 10), M.sole, 0, 0.02, 0, g).scale.set(0.055, 0.02, 0.13); add(new THREE.SphereGeometry(1, 14, 10), mat, 0, 0.05, -0.015, g).scale.set(0.05, 0.045, 0.11); return g; };
  const shoesA = new THREE.Group(); root.add(shoesA); sneaker(0.33, MAT[1] - 0.04, 0.2, M.shoeB, shoesA); sneaker(0.42, MAT[1] + 0.02, 0.35, M.shoeB, shoesA);   // a pair that lives here
  const shoesB = new THREE.Group(); root.add(shoesB); sneaker(-0.3, MAT[1] + 0.03, -0.25, M.shoeA, shoesB); sneaker(-0.18, MAT[1] + 0.08, -0.1, M.shoeA, shoesB);   // the owner's, once off (same colour as owner3d's shoes)

  // ---------- lights: bright day (bedroom3d.js 'day' values) ----------
  root.add(new THREE.HemisphereLight('#fff6e4', '#c9b49a', 1.9));
  const key = new THREE.DirectionalLight('#fff0d4', 2.4); key.castShadow = true; key.position.set(-2.0, 3.6, 2.8); key.target.position.set(0, 0.6, -1.0);
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0006; key.shadow.normalBias = 0.03; key.shadow.radius = 2;
  { const c = key.shadow.camera; c.left = -2.5; c.right = 2.5; c.top = 3; c.bottom = -2; c.near = 1; c.far = 12; c.updateProjectionMatrix(); }
  root.add(key); root.add(key.target);

  /** st: { door 0..1, keysOnHook bool, shoesOnMat bool, clock minutes (default 18:00 -> 360) } */
  const set = (st = {}) => {
    scene.background = scene.background || new THREE.Color(); scene.background.set('#f1e3c8'); scene.fog = null;
    const d = clamp(st.door || 0); hinge.rotation.y = -d * 1.5; sunL.intensity = d * 3;
    hookKeys.visible = !!st.keysOnHook; shoesB.visible = !!st.shoesOnMat;
    const m = st.clock ?? 360; minH.rotation.z = -(m % 60) / 60 * Math.PI * 2; hourH.rotation.z = -((m / 60) % 12) / 12 * Math.PI * 2;
    root.updateMatrixWorld(true);
  };
  const pts = () => ({ rack: rack.localToWorld(new THREE.Vector3(0, -0.02, 0.06)), bowl: bowl.getWorldPosition(new THREE.Vector3()), knob: hinge.localToWorld(new THREE.Vector3(dw - 0.1, 1.0, 0.08)), mat: new THREE.Vector3(MAT[0], 0.03, MAT[1]) });
  set();
  return { root, set, pts, M };
};
