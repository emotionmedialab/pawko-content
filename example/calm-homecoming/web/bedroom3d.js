// ================= 3D night bedroom set (bed + duvet + pillows, bedside table + lamp, window + moon, door, alarm clock), toon-shaded =================
// Inked by the project's post-process (normal/depth edge pass), so plain MeshToonMaterial meshes are all that is needed.
// Emissive glows are flagged userData.ndSkip = true (the project's ink pass must hide them, same flag as the kit's clouds).
//
//   import { createBedroom, BED } from './bedroom3d.js';
//   const room = createBedroom(THREE, scene, { toon });      // main.js, once. toon = (opts) => MeshToonMaterial (the kit's helper)
//   room.set({ light:'night', lamp:1, door:0, clock:'23:00', cover:-0.4, caps: owner.capsules() });   // every frame (see set())
//   room.heightAt(x, z) = top of the duvet (put the puppy / the owner's hands there);  room.pts() = lampSwitch, doorKnob, edge points
//
// Room space (the owner poses in owner3d.js use the same space): x = right when looking from the foot of the bed toward the headboard, y = up, z = toward the foot of the bed.
// Bed centred on the origin, long axis along z: headboard z = -1.05, footboard z = +1.1, mattress top y = 0.52 (BED.top).
// Bedside table + lamp + clock on the -x side at z -0.45; window in the back wall (z -1.9) over the bed; door in the back wall left of the bed (x -1.95..-1.05). Floor y = 0.

export const BED = { top: 0.52, halfW: 0.68, head: -1.0, foot: 1.0 };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };

const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };

export const createBedroom = (THREE, scene, { toon = (o) => new THREE.MeshToonMaterial(o) } = {}) => {
  const root = new THREE.Group(); root.name = 'bedroom'; scene.add(root);
  const tex = (c, rx = 1, ry = 1) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = root, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; };
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const rrect = (w, d, r) => { const s = new THREE.Shape(); s.moveTo(-w + r, -d); s.lineTo(w - r, -d); s.quadraticCurveTo(w, -d, w, -d + r); s.lineTo(w, d - r); s.quadraticCurveTo(w, d, w - r, d); s.lineTo(-w + r, d); s.quadraticCurveTo(-w, d, -w, d - r); s.lineTo(-w, -d + r); s.quadraticCurveTo(-w, -d, -w + r, -d); return s; };
  // rounded slab, half sizes w/d (x/z), thickness t, bevel r; lies flat (y up), bottom at y = 0
  const slab = (w, d, t, r, bev = 0.02) => { const g = new THREE.ExtrudeGeometry(rrect(w, d, r), { depth: t - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 2 }); g.rotateX(-Math.PI / 2); g.translate(0, bev, 0); return g; };

  // ---------- materials + painted textures ----------
  const floorTex = (() => { const [c, g] = cv(512, 512); const cols = ['#c98f55', '#bd824a', '#d29a62', '#c28850'];
    for (let i = 0; i < 8; i++) { g.fillStyle = cols[i % 4]; g.fillRect(0, i * 64, 512, 64); g.fillStyle = 'rgba(70,38,16,.9)'; g.fillRect(0, i * 64, 512, 3);
      const cut = (i * 211) % 512; g.fillRect(cut, i * 64, 3, 64);
      for (let k = 0; k < 6; k++) { g.strokeStyle = 'rgba(110,64,28,.35)'; g.lineWidth = 1.5; g.beginPath(); const y = i * 64 + 8 + k * 9; g.moveTo(0, y); g.bezierCurveTo(150, y + 3, 300, y - 3, 512, y + 2); g.stroke(); } }
    return tex(c, 3, 3); })();
  const quiltTex = (() => { const [c, g] = cv(256, 256); g.fillStyle = '#5a8fe0'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#6c9fec' : '#4f84d8'; g.beginPath(); g.roundRect(i * 128 + 6, j * 128 + 6, 116, 116, 30); g.fill(); }
    g.strokeStyle = '#2f55a0'; g.lineWidth = 6; g.setLineDash([14, 10]); g.strokeRect(0, 0, 256, 256); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
    return tex(c, 1, 1); })();
  const skyTex = (day) => { const [c, g] = cv(256, 320); const gr = g.createLinearGradient(0, 0, 0, 320);
    if (day) { gr.addColorStop(0, '#5fa6f0'); gr.addColorStop(1, '#bfe0fa'); } else { gr.addColorStop(0, '#0b1544'); gr.addColorStop(1, '#27408c'); }
    g.fillStyle = gr; g.fillRect(0, 0, 256, 320);
    if (day) { g.fillStyle = '#fff'; for (const [x, y, r] of [[70, 90, 26], [100, 100, 32], [135, 92, 24], [190, 210, 22], [215, 218, 28]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } g.fillStyle = '#ffe48a'; g.beginPath(); g.arc(190, 60, 30, 0, 7); g.fill(); }
    else { g.fillStyle = 'rgba(190,205,255,.18)'; g.beginPath(); g.arc(150, 110, 62, 0, 7); g.fill(); g.fillStyle = '#f6f2d8'; g.beginPath(); g.arc(150, 110, 38, 0, 7); g.fill();
      g.fillStyle = '#dcd8b8'; for (const [x, y, r] of [[138, 100, 8], [162, 124, 6], [150, 90, 4]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
      g.fillStyle = '#fff'; for (const [x, y] of [[40, 40], [200, 30], [60, 200], [210, 170], [100, 260], [30, 130], [230, 250], [120, 30]]) g.fillRect(x, y, 4, 4); }
    return tex(c); };
  const skyNight = skyTex(false), skyDay = skyTex(true);
  const M = {
    floor: toon({ map: floorTex }), wall: toon({ color: '#cdbfae' }), base: toon({ color: '#efe8dc' }), dark: toon({ color: '#5a3a28' }), mid: toon({ color: '#7a5036' }), light: toon({ color: '#a8754a' }),
    sheet: toon({ color: '#e6edff' }), quilt: toon({ map: quiltTex, side: THREE.DoubleSide }), hem: toon({ color: '#cfe0ff' }), pillow: toon({ color: '#f2f5ff' }), pillow2: toon({ color: '#9db8ea' }),
    frame: toon({ color: '#efe9dd' }), curtain: toon({ color: '#44579a' }), door: toon({ color: '#8a5a3a' }), knob: toon({ color: '#d9b050' }),
    shadeOff: toon({ color: '#e9dcc0' }), lampBase: toon({ color: '#3f5aa8' }), metal: toon({ color: '#d9b050' }),
    clock: toon({ color: '#2a2a33' }), clockTrim: toon({ color: '#c8402f' }),
  };
  const pane = new THREE.MeshBasicMaterial({ map: skyNight, fog: false });
  const hall = new THREE.MeshBasicMaterial({ color: '#2b1c18', fog: false });

  // ---------- room shell ----------
  const floor = add(new THREE.PlaneGeometry(4.6, 7.4), M.floor, 0, 0, 1.45, root, false); floor.rotation.x = -Math.PI / 2; floor.userData.floor = true;
  const WX = 2.3, WZ0 = -1.9, WZ1 = 4.8, CH = 3.6;
  const wallBox = (x0, y0, x1, y1, z, t = 0.1) => add(box(x1 - x0, y1 - y0, t), M.wall, (x0 + x1) / 2, (y0 + y1) / 2, z, root, false);   // back-wall pieces (window opening)
  const wx0 = 0.5, wx1 = 1.3, wy0 = 1.05, wy1 = 2.05;   // window opening in the back wall
  wallBox(-WX, 0, -1.95, CH, WZ0); wallBox(-1.05, 0, wx0, CH, WZ0); wallBox(wx1, 0, WX, CH, WZ0); wallBox(wx0, 0, wx1, wy0, WZ0); wallBox(wx0, wy1, wx1, CH, WZ0);
  const sky = add(new THREE.PlaneGeometry(1.4, 1.75), pane, (wx0 + wx1) / 2, (wy0 + wy1) / 2, WZ0 - 0.12, root, false); sky.userData.ndSkip = true;
  for (const [w, h, x, y] of [[0.9, 0.06, 0.9, wy0 - 0.02], [0.9, 0.06, 0.9, wy1 + 0.02], [0.06, 1.1, wx0 - 0.02, 1.55], [0.06, 1.1, wx1 + 0.02, 1.55], [0.03, 1.0, 0.9, 1.55], [0.8, 0.03, 0.9, 1.55]]) add(box(w, h, 0.12), M.frame, x, y, WZ0 + 0.03, root, false);
  add(box(1.0, 0.04, 0.2), M.frame, 0.9, wy0 - 0.05, WZ0 + 0.1, root, false);   // sill
  for (const s of [-1, 1]) add(box(0.3, 1.45, 0.07), M.curtain, 0.9 + s * 0.6, 1.5, WZ0 + 0.12, root, false);   // curtains
  add(box(2 * WX, CH, 0.1), M.wall, 0, CH / 2, WZ1, root, false);                                   // wall behind the camera
  add(box(0.1, CH, WZ1 - WZ0), M.wall, -WX, CH / 2, (WZ0 + WZ1) / 2, root, false);                  // table-side wall
  add(box(0.1, CH, WZ1 - WZ0), M.wall, WX, CH / 2, (WZ0 + WZ1) / 2, root, false);                    // +x wall
  // door in the back wall, left of the bed (x -1.95..-1.05, y 0..2.05), hinged at x = -1.95, swings into the room
  const dx0 = -1.95, dx1 = -1.05, dh = 2.05;
  add(box(dx1 - dx0, CH - dh, 0.1), M.wall, (dx0 + dx1) / 2, (dh + CH) / 2, WZ0, root, false);   // above the door
  add(box(0.8, dh, 0.1), hall, (dx0 + dx1) / 2, dh / 2, WZ0 - 0.5, root, false);                   // dim hallway behind the door
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(dx1 - dx0, dh), new THREE.MeshBasicMaterial({ color: '#ffb868', transparent: true, opacity: 0.0, fog: false })); stripe.position.set((dx0 + dx1) / 2, dh / 2, WZ0 - 0.1); stripe.userData.ndSkip = true; root.add(stripe);
  for (const x of [dx0, dx1]) add(box(0.06, dh, 0.14), M.frame, x, dh / 2, WZ0 + 0.02, root, false);
  add(box(dx1 - dx0 + 0.06, 0.06, 0.14), M.frame, (dx0 + dx1) / 2, dh, WZ0 + 0.02, root, false);
  const hinge = new THREE.Group(); hinge.position.set(dx0 + 0.03, 0, WZ0 + 0.04); root.add(hinge);
  add(box(dx1 - dx0 - 0.06, dh - 0.04, 0.05), M.door, (dx1 - dx0) / 2 - 0.03, (dh - 0.04) / 2, 0, hinge);
  add(new THREE.SphereGeometry(0.04, 10, 8), M.knob, dx1 - dx0 - 0.15, 1.0, 0.05, hinge);
  for (const x of [0.25, 0.62]) add(box(0.28, 0.8, 0.01), M.mid, x, 1.2, 0.03, hinge, false);   // door panels
  for (const [x0, z0, w, d] of [[0.6, WZ0 + 0.06, 2 * WX - 1.2, 0.04], [-WX + 0.06, 0.8, 0.04, WZ1 - WZ0]]) add(box(w, 0.12, d), M.base, x0, 0.06, z0, root, false);   // skirting boards

  // ---------- bed ----------
  const bedG = new THREE.Group(); root.add(bedG);
  add(box(1.5, 0.22, 2.12), M.dark, 0, 0.23, 0.02, bedG);                                                  // frame
  for (const [x, z] of [[-0.68, -0.98], [0.68, -0.98], [-0.68, 1.02], [0.68, 1.02]]) add(box(0.1, 0.12, 0.1), M.dark, x, 0.06, z, bedG);
  add(slab(BED.halfW, 1.0, 0.2, 0.1), M.sheet, 0, 0.32, 0.0, bedG);                                      // mattress, top y = 0.52
  { const hb = new THREE.Shape(); hb.moveTo(-0.78, 0); hb.lineTo(0.78, 0); hb.lineTo(0.78, 0.95); hb.quadraticCurveTo(0.78, 1.12, 0.6, 1.12); hb.lineTo(-0.6, 1.12); hb.quadraticCurveTo(-0.78, 1.12, -0.78, 0.95); hb.closePath();
    add(new THREE.ExtrudeGeometry(hb, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 }), M.mid, 0, 0.12, -1.13, bedG);
    add(box(1.56, 0.5, 0.07), M.mid, 0, 0.42, 1.1, bedG); add(box(1.56, 0.06, 0.1), M.light, 0, 0.7, 1.1, bedG); }   // headboard + footboard
  const pillow = (w, d, t, mat, x, y, z, rx = 0) => { const m = add(slab(w, d, t, 0.12, 0.05), mat, x, y, z, bedG); m.rotation.x = rx; return m; };
  pillow(0.3, 0.2, 0.2, M.pillow, 0, BED.top, -0.82);                                                      // pillow under the head (top y = 0.72)
  pillow(0.32, 0.2, 0.2, M.pillow2, 0.02, BED.top + 0.17, -0.9, -1.05);                                   // second pillow leaning on the headboard

  // ---------- duvet: a height-field mesh draped over the owner's capsules (no clipping by construction) ----------
  // cross-sections: [coordinate, drop] pairs. Top rows carry the bulge; the last rows round the edge and hang down.
  const NXT = 15, NZT = 26;
  const xs = [], zsTail = [];
  for (let i = 0; i < NXT; i++) xs.push([lerp(-0.54, 0.54, i / (NXT - 1)), 0]);
  for (const [a, d] of [[0.3, 0.035], [0.65, 0.11], [1.0, 0.2], [1.0, 0.33]]) { xs.push([0.54 + 0.2 * Math.sin(a * 1.57), d]); }
  for (let i = 0; i < 4; i++) xs.unshift([-xs[NXT + i][0], xs[NXT + i][1]]);
  const NX = xs.length;
  for (const [a, d] of [[0.3, 0.035], [0.65, 0.11], [1.0, 0.2], [1.0, 0.33]]) zsTail.push([0.88 + 0.14 * Math.sin(a * 1.57), d]);
  const NZ = NZT + zsTail.length;
  const quilt = new THREE.Mesh(new THREE.BufferGeometry(), M.quilt); quilt.castShadow = true; quilt.receiveShadow = true; bedG.add(quilt);
  { const pos = new Float32Array(NX * NZ * 3), uv = new Float32Array(NX * NZ * 2), idx = [];
    for (let j = 0; j < NZ - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = j * NX + i; idx.push(a, a + NX, a + 1, a + 1, a + NX, a + NX + 1); }
    quilt.geometry.setIndex(idx); quilt.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3)); quilt.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); }
  const hemBeads = Array.from({ length: 19 }, () => add(new THREE.SphereGeometry(0.06, 12, 8), M.hem, 0, 0.6, -0.4, bedG));   // rolled top hem of the duvet (a row of beads that follows the edge)
  const DUV = 0.15, THICK = 0.08;   // flat duvet thickness above the mattress, cover thickness over a body
  let caps = [], edgeZ = -0.4;
  const hf = (x, z) => {   // duvet top height at (x, z) in room space
    let h = BED.top + DUV + 0.018 * Math.sin(x * 11 + 0.5) * Math.sin(z * 11);
    for (const [a, b, r] of caps) {
      const abx = b.x - a.x, abz = b.z - a.z, L2 = abx * abx + abz * abz, t = L2 < 1e-6 ? 0 : clamp(((x - a.x) * abx + (z - a.z) * abz) / L2);
      const d = Math.hypot(x - (a.x + abx * t), z - (a.z + abz * t)), R = r + THICK, S = R + 0.14;
      if (d < S) { const py = Math.min(lerp(a.y, b.y, t), BED.top + 0.34); h = Math.max(h, BED.top + DUV + (py + R - BED.top - DUV) * Math.sqrt(1 - (d / S) ** 2)); }
    }
    return h;
  };
  const buildQuilt = () => {
    const P = quilt.geometry.attributes.position, U = quilt.geometry.attributes.uv; let n = 0;
    for (let j = 0; j < NZ; j++) {
      const zt = j < NZT ? [lerp(edgeZ, 0.88, j / (NZT - 1)), 0] : zsTail[j - NZT];
      for (let i = 0; i < NX; i++) {
        const [x, dx] = xs[i], [z, dz] = zt, drop = Math.max(dx, dz), top = drop === 0 ? hf(x, z) : lerp(hf(clamp(x, -0.54, 0.54), clamp(z, edgeZ, 0.88)), BED.top + DUV, 0.7);
        P.setXYZ(n, x, top - drop, z); U.setXY(n, x * 1.1, z * 1.1); n++;
      }
    }
    P.needsUpdate = true; U.needsUpdate = true; quilt.geometry.computeVertexNormals(); quilt.geometry.computeBoundingSphere();
    hemBeads.forEach((m, i) => { const x = lerp(-0.54, 0.54, i / 18); m.position.set(x, hf(x, edgeZ) - 0.005, edgeZ); });
  };

  // ---------- bedside table, lamp, alarm clock ----------
  const tab = new THREE.Group(); tab.position.set(-1.0, 0, -0.45); root.add(tab);
  add(box(0.44, 0.04, 0.44), M.light, 0, 0.5, 0, tab); add(box(0.4, 0.46, 0.4), M.mid, 0, 0.25, 0, tab); add(box(0.34, 0.16, 0.02), M.light, 0.0, 0.34, 0.205, tab); add(new THREE.SphereGeometry(0.02, 8, 6), M.knob, 0, 0.34, 0.225, tab);
  add(box(0.34, 0.16, 0.02), M.light, 0.205, 0.34, 0, tab).rotation.y = Math.PI / 2;   // drawer faces on the front and on the bed side
  add(new THREE.SphereGeometry(0.02, 8, 6), M.knob, 0.225, 0.34, 0, tab);
  const lampG = new THREE.Group(); lampG.position.set(-0.07, 0.52, -0.08); tab.add(lampG);
  add(new THREE.CylinderGeometry(0.08, 0.1, 0.06, 18), M.lampBase, 0, 0.03, 0, lampG);
  add(new THREE.CylinderGeometry(0.014, 0.014, 0.3, 8), M.metal, 0, 0.2, 0, lampG);
  const shadeMat = new THREE.MeshBasicMaterial({ color: '#ffd9a0', side: THREE.DoubleSide });
  const shade = add(new THREE.CylinderGeometry(0.1, 0.17, 0.2, 20, 1, true), shadeMat, 0, 0.42, 0, lampG, false);
  add(new THREE.CylinderGeometry(0.1, 0.1, 0.012, 20), M.metal, 0, 0.52, 0, lampG, false);
  const knob = add(new THREE.SphereGeometry(0.022, 8, 6), M.knob, 0.03, 0.2, 0.0, lampG);   // the switch (a bump on the lamp stem)
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: (() => { const [c, g] = cv(64, 64); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,200,120,.75)'); r.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return tex(c); })(), transparent: true, depthWrite: false, fog: false, opacity: 0 }));
  glow.userData.ndSkip = true; glow.position.set(0, 0.4, 0.2); lampG.add(glow);

  const clockG = new THREE.Group(); clockG.position.set(-0.92, 0.52, -0.25); clockG.rotation.y = 0.5; root.add(clockG);
  { const sh = rrect(0.12, 0.07, 0.03), g = new THREE.ExtrudeGeometry(sh, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 }); g.translate(0, 0.095, -0.035);
    add(g, M.clock, 0, 0, 0, clockG); }
  for (const x of [-0.07, 0.07]) { add(new THREE.SphereGeometry(0.03, 12, 8), M.clockTrim, x, 0.2, 0, clockG); }   // alarm bells
  for (const x of [-0.08, 0.08]) add(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 8), M.metal, x, 0.015, 0, clockG);
  const dispC = (() => { const [c, g] = cv(512, 256); return { c, g, t: tex(c) }; })();
  const disp = add(new THREE.PlaneGeometry(0.2, 0.1), new THREE.MeshBasicMaterial({ map: dispC.t, fog: false }), 0, 0.095, 0.0545, clockG, false);
  const dglow = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.35), new THREE.MeshBasicMaterial({ map: (() => { const [c, g] = cv(64, 64); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,40,30,.4)'); r.addColorStop(1, 'rgba(255,40,30,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return tex(c); })(), transparent: true, depthWrite: false, fog: false }));
  dglow.userData.ndSkip = true; dglow.position.set(0, 0.095, 0.1); clockG.add(dglow);
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  let clockKey = '';
  const drawClock = (txt, colon) => {   // red 7-segment time "HH:MM"
    const key = txt + colon; if (key === clockKey) return; clockKey = key;
    const g = dispC.g; g.fillStyle = '#1a0606'; g.fillRect(0, 0, 512, 256); g.fillStyle = '#ff2a1f'; g.shadowColor = '#ff2a1f'; g.shadowBlur = 14;
    const seg = (x, y, w, h) => { g.beginPath(); g.roundRect(x, y, w, h, 6); g.fill(); };
    const digits = txt.replace(':', '').split(''), W = 78, H = 150, T = 16;
    digits.forEach((ch, k) => { const x = 40 + k * 100 + (k > 1 ? 30 : 0), y = 50, s = SEG[ch] || '';
      const S = { a: [x + T, y, W - 2 * T, T], b: [x + W - T, y + T, T, H / 2 - T - 4], c: [x + W - T, y + H / 2 + 4, T, H / 2 - T - 4], d: [x + T, y + H - T, W - 2 * T, T], e: [x, y + H / 2 + 4, T, H / 2 - T - 4], f: [x, y + T, T, H / 2 - T - 4], g: [x + T, y + H / 2 - T / 2, W - 2 * T, T] };
      for (const k2 of s) seg(...S[k2]); });
    if (colon) { g.beginPath(); g.arc(256, 100, 9, 0, 7); g.arc(256, 150, 9, 0, 7); g.fill(); }
    g.shadowBlur = 0; dispC.t.needsUpdate = true;
  };

  // ---------- lights (night / day presets) ----------
  const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); root.add(hemi);
  const key = new THREE.DirectionalLight('#ffffff', 2); key.castShadow = true; key.position.set(-2.4, 3.6, 2.8); key.target.position.set(0, 0.4, 0);
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0006; key.shadow.normalBias = 0.03; key.shadow.radius = 2;
  { const c = key.shadow.camera; c.left = -3; c.right = 3; c.top = 3; c.bottom = -3; c.near = 1; c.far = 12; c.updateProjectionMatrix(); }
  root.add(key); root.add(key.target);
  const rim = new THREE.DirectionalLight('#c8d8ff', 0); rim.position.set(2.8, 3.2, -3); rim.target.position.set(0, 0.6, 0.3); root.add(rim); root.add(rim.target);   // moonlight rim from behind: outlines whatever sits on the duvet
  const lampL = new THREE.PointLight('#ffb867', 0, 5, 1.6); lampL.position.set(-1.07, 1.05, -0.5); root.add(lampL);
  const LOOK = {
    night: { hemiSky: '#6f86d8', hemiGround: '#40386a', hemi: 1.25, key: '#a9c2ff', keyI: 1.5, rim: 1.3, bg: '#4a5496', wall: '#a8aac8' },
    day: { hemiSky: '#fff6e4', hemiGround: '#c9b49a', hemi: 1.9, key: '#fff0d4', keyI: 2.6, rim: 0, bg: '#e7d9c4', wall: '#e7d9c4' },
  };

  // ---------- set(): one call per frame ----------
  /** st: { light:'night'|'day', lamp:0..1 (1 = on), door:0..1 (0 closed, 1 = 0.9 rad open; 0.2 = a creak), clock:'HH:MM', colon:bool, cover: z of the duvet top edge (default -0.4; pull it toward the headboard = up the body), caps: owner.capsules() } */
  const set = (st = {}) => {
    const L = LOOK[st.light || 'night'], lamp = st.lamp ?? 1;
    hemi.color.set(L.hemiSky); hemi.groundColor.set(L.hemiGround); hemi.intensity = L.hemi; key.color.set(L.key); key.intensity = L.keyI; rim.intensity = L.rim;
    scene.background = scene.background || new THREE.Color(); scene.background.set(L.bg); M.wall.color.set(L.wall);
    pane.map = st.light === 'day' ? skyDay : skyNight; pane.needsUpdate = true;
    lampL.intensity = lamp * 5; shadeMat.color.set(lamp > 0.5 ? '#ffd9a0' : '#a89a80'); glow.material.opacity = lamp * 0.9;
    hinge.rotation.y = -(st.door || 0) * 0.9; stripe.material.opacity = clamp((st.door || 0) * 4) * 0.55;
    drawClock(st.clock || '23:00', st.colon ?? true);
    caps = (st.caps || []).map(([a, b, r]) => [a, b, r]); edgeZ = st.cover ?? -0.4; buildQuilt();
    root.updateMatrixWorld(true);
  };
  const P = (o, x, y, z) => o.localToWorld(new THREE.Vector3(x, y, z));
  /** world points: lampSwitch (hand target to turn the lamp off), doorKnob, clockFace, edge(side -1|1) = the duvet's top corner (a hand target for pulling it up) */
  const pts = () => ({ lampSwitch: P(lampG, 0.03, 0.2, 0.02), doorKnob: P(hinge, dx1 - dx0 - 0.15, 1.0, 0.05), clockFace: P(clockG, 0, 0.095, 0.06),
    edge: (s) => new THREE.Vector3(s * 0.5, hf(s * 0.5, edgeZ) + 0.02, edgeZ + 0.03) });
  return { root, set, heightAt: hf, pts, M };
};
