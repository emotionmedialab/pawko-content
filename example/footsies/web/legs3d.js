// ================= 3D trainer LOWER BODY (two jeans legs + two sneakers), toon-shaded =================
// For the dog-training shorts: the trainer from the hip down (the camera never shows the upper body).
// Colours match the 2D trainer card (trainer.js): jeans #3d64b0, rolled cuff #7c9ad6, brown sneakers #7a4e33, white soles.
// Inked by the project's post-process (normal/depth edge pass), so plain MeshToonMaterial meshes are all that is needed.
//
//   import { createLegs, legsTimeline, STANCE } from './legs3d.js';
//   const legs = createLegs(THREE, scene, { toon });          // main.js, once. toon = (opts) => MeshToonMaterial (the kit's helper)
//   legs.pose(params);                                        // main.js, every frame (params come from story.js)
//   const plan = legsTimeline({ at:[x,z], yaw, y, stance:'apart', steps:[{ foot:'R', a:30, b:52, fwd:0.18 }] });   // story.js
//   export const legsAt = (f) => plan(f);                     // -> params for legs.pose
//
// Conventions (same as dogrig.js): yaw 0 faces +z, yaw PI/2 faces +x; forward = (sin yaw, 0, cos yaw);
// the trainer's LEFT side = (cos yaw, 0, -sin yaw), foot 'L' is on that side. Units are metres; y = ground (mat top).
// Scale: hip joint 0.98 m, knee 0.46 m, shoe 0.29 m long and 0.085 m tall. A puppy shoulder (~0.4 m) reaches the knee.

export const STANCE = { together: 0.075, natural: 0.14, apart: 0.22 };   // half the distance between the feet (m)
const D = { hipW: 0.085, thigh: 0.46, shin: 0.44, ankle: 0.085, hip: 0.98, ext: 0.5 };   // ext: trouser tube runs this far above the hip joint (always out of frame)
const COL = { jeans: '#3d64b0', cuff: '#7c9ad6', shoe: '#7a4e33', sole: '#f4f1ea', toe: '#efe6d6' };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };

export const createLegs = (THREE, scene, { toon = (o) => new THREE.MeshToonMaterial(o) } = {}) => {
  const root = new THREE.Group(); root.name = 'legs'; scene.add(root);
  const M = { jeans: toon({ color: COL.jeans }), cuff: toon({ color: COL.cuff }), shoe: toon({ color: COL.shoe }), sole: toon({ color: COL.sole }), toe: toon({ color: COL.toe }) };
  const mk = (geo, mat, parent = root) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const tube = (rTop, rBot, mat) => mk(new THREE.CylinderGeometry(rTop, rBot, 1, 14, 1), mat);   // unit-length tapered tube, stretched between two points
  const ball = (r, mat) => mk(new THREE.SphereGeometry(r, 14, 10), mat);

  const sneaker = () => {   // local frame: origin = ankle, toe along +z, floor at y = -D.ankle
    const g = new THREE.Group(); root.add(g);
    const sh = new THREE.Shape(), w = 0.056, r = 0.05;   // sole outline in (x, -z): heel at z=-0.085, toe at z=+0.205
    sh.moveTo(-w + 0.02, 0.085); sh.lineTo(w - 0.02, 0.085); sh.quadraticCurveTo(w, 0.085, w, 0.065); sh.lineTo(w, -0.205 + r); sh.quadraticCurveTo(w, -0.205, w - r, -0.205);
    sh.lineTo(-w + r, -0.205); sh.quadraticCurveTo(-w, -0.205, -w, -0.205 + r); sh.lineTo(-w, 0.065); sh.quadraticCurveTo(-w, 0.085, -w + 0.02, 0.085);
    const sole = mk(new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 }), M.sole, g);
    sole.rotation.x = -Math.PI / 2; sole.position.y = -D.ankle;
    const up = (rx, ry, rz, x, y, z, mat) => { const m = mk(new THREE.SphereGeometry(1, 16, 12), mat, g); m.scale.set(rx, ry, rz); m.position.set(x, y, z); return m; };
    up(0.054, 0.04, 0.125, 0, -0.045, 0.085, M.shoe);     // toe box (top surface is at local y = 0)
    up(0.052, 0.058, 0.07, 0, -0.022, -0.012, M.shoe);    // heel + ankle collar
    up(0.046, 0.03, 0.05, 0, -0.05, 0.175, M.toe);        // toe cap
    return g;
  };
  const part = () => ({ thigh: tube(0.098, 0.074, M.jeans), shin: tube(0.07, 0.054, M.jeans), knee: ball(0.075, M.jeans), cuff: tube(0.062, 0.062, M.cuff), shoe: sneaker() });
  const leg = { L: part(), R: part() };
  const crotch = ball(1, M.jeans), trunk = tube(1, 1, M.jeans);   // joins the two thighs into trousers; runs up and out of frame
  const info = { L: {}, R: {} };

  const up = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), q = new THREE.Quaternion();
  const span = (m, a, b) => { v.subVectors(b, a); const len = v.length(); m.position.copy(a).addScaledVector(v, 0.5); m.quaternion.copy(q.setFromUnitVectors(up, v.divideScalar(len))); m.scale.set(1, len, 1); };

  /** params: { y, yaw, sway:[x,z], L:{x,z,lift,pitch,yaw}, R:{...} }  (see legsTimeline). Feet are placed exactly; the pelvis follows them. */
  const pose = (p) => {
    const yaw = p.yaw ?? 0, fw = [Math.sin(yaw), Math.cos(yaw)], sd = [Math.cos(yaw), -Math.sin(yaw)], y0 = p.y ?? 0;
    const mid = [(p.L.x + p.R.x) / 2 + (p.sway?.[0] ?? 0), (p.L.z + p.R.z) / 2 + (p.sway?.[1] ?? 0)];
    const R = 0.995 * (D.thigh + D.shin), hips = {};
    let hipY = D.hip;   // the pelvis sinks just enough that neither leg over-reaches
    for (const k of ['L', 'R']) {
      const s = k === 'L' ? 1 : -1, hx = mid[0] + sd[0] * s * D.hipW, hz = mid[1] + sd[1] * s * D.hipW, f = p[k];
      const h = Math.hypot(f.x - hx, f.z - hz), a = D.ankle + (f.lift || 0);
      hipY = Math.min(hipY, a + Math.sqrt(Math.max(0.0001, R * R - h * h)));
      hips[k] = [hx, hz];
    }
    for (const k of ['L', 'R']) {
      const f = p[k], P = leg[k], H = new THREE.Vector3(hips[k][0], y0 + hipY, hips[k][1]), A = new THREE.Vector3(f.x, y0 + D.ankle + (f.lift || 0), f.z);
      const dv = new THREE.Vector3().subVectors(A, H), d = Math.min(dv.length(), 0.999 * (D.thigh + D.shin)); dv.normalize();
      const a = (D.thigh ** 2 - D.shin ** 2 + d * d) / (2 * d), hh = Math.sqrt(Math.max(0, D.thigh ** 2 - a * a));
      const fy = f.yaw ?? yaw, pole = new THREE.Vector3(Math.sin(fy), 0, Math.cos(fy)); pole.addScaledVector(dv, -pole.dot(dv)).normalize();   // knee bends toward the foot's heading
      const K = H.clone().addScaledVector(dv, a).addScaledVector(pole, hh);
      const top = H.clone().add(new THREE.Vector3().subVectors(H, K).normalize().multiplyScalar(D.ext));
      span(P.thigh, K, top); span(P.shin, A, K); P.knee.position.copy(K);
      const sdir = new THREE.Vector3().subVectors(K, A).normalize(); span(P.cuff, A.clone().addScaledVector(sdir, -0.02), A.clone().addScaledVector(sdir, 0.035));
      P.shoe.position.copy(A); P.shoe.rotation.set(-(f.pitch || 0), fy, 0, 'YXZ');
      Object.assign(info[k], { hip: H, knee: K, ankle: A, top });
    }
    const cy = y0 + hipY;   // trousers seat: crotch ball + a trunk that rises well above any frame
    crotch.scale.set(D.hipW + 0.1, 0.13, 0.12); crotch.position.set(mid[0], cy - 0.04, mid[1]); crotch.rotation.y = yaw;
    trunk.scale.set(D.hipW + 0.1, 1.0, 0.12); trunk.position.set(mid[0], cy + 0.46, mid[1]); trunk.rotation.y = yaw;
    root.updateMatrixWorld(true);
  };
  /** world point on the toe of a shoe ('L'|'R'), where a paw rests (z = distance forward of the ankle) */
  const shoeTop = (k, z = 0.17) => leg[k].shoe.localToWorld(new THREE.Vector3(0, -0.02, z));   // default: on the toe cap
  /** leg axes as [[a,b,radius]...] in world space (for clearance tests) */
  const segments = () => ['L', 'R'].flatMap((k) => [[info[k].top, info[k].knee, 0.085], [info[k].knee, info[k].ankle, 0.06]]);
  return { root, pose, shoeTop, segments, info, tops: () => [trunk.position.clone().add(new THREE.Vector3(0, 0.5, 0))] };
};

/** Frame-keyed stepping. Returns plan(f) -> params for legs.pose(). Pure function of f; feet are planted exactly (no sliding).
 *  at [x,z] = pelvis centre at rest, yaw = heading (number or f=>number), y = ground height, stance = name | half-width in metres.
 *  steps: [{ foot:'L'|'R', a, b, fwd, side?, to?:[x,z], yaw?, lift? }]  frames a..b the foot swings from where it stood to
 *  `to` (world) or fwd/side metres from where it stood (along the heading at frame a); lift = peak foot height (default 0.12). */
export const legsTimeline = ({ at = [0, 0], yaw = 0, y = 0, stance = 'natural', steps = [], sway = 0.035 } = {}) => {
  const hw = typeof stance === 'number' ? stance : STANCE[stance], Y = typeof yaw === 'function' ? yaw : () => yaw;
  const y00 = Y(0);
  const feet = { L: { x: at[0] + Math.cos(y00) * hw, z: at[1] - Math.sin(y00) * hw, yaw: y00 }, R: { x: at[0] - Math.cos(y00) * hw, z: at[1] + Math.sin(y00) * hw, yaw: y00 } };
  const cur = { L: { ...feet.L }, R: { ...feet.R } }, seq = { L: [], R: [] };
  for (const s of [...steps].sort((p, q) => p.a - q.a)) {   // resolve relative steps once
    const c = cur[s.foot], h = Y(s.a), to = s.to ? { x: s.to[0], z: s.to[1] } : { x: c.x + Math.sin(h) * (s.fwd || 0) + Math.cos(h) * (s.side || 0), z: c.z + Math.cos(h) * (s.fwd || 0) - Math.sin(h) * (s.side || 0) };
    const e = { ...s, from: { ...c }, to: { ...to, yaw: s.yaw ?? c.yaw } }; seq[s.foot].push(e); cur[s.foot] = e.to;
  }
  return (f) => {
    const out = { y, yaw: Y(f), L: null, R: null, sway: [0, 0] };
    let swing = null;
    for (const k of ['L', 'R']) {
      let st = { ...feet[k], lift: 0, pitch: 0 }, e = null;
      for (const s of seq[k]) if (f >= s.a) e = s;
      if (e) {
        const t = clamp((f - e.a) / (e.b - e.a)), u = sm(t);
        st = { x: e.from.x + (e.to.x - e.from.x) * u, z: e.from.z + (e.to.z - e.from.z) * u, yaw: e.from.yaw + (e.to.yaw - e.from.yaw) * u, lift: t > 0 && t < 1 ? (e.lift ?? 0.12) * Math.sin(Math.PI * t) : 0, pitch: t > 0 && t < 1 ? -0.25 * Math.sin(2 * Math.PI * t) : 0 };
        if (t > 0 && t < 1) swing = { k, env: Math.sin(Math.PI * t) };
      }
      out[k] = st;
    }
    if (swing) { const sp = swing.k === 'L' ? -1 : 1, hh = Y(f), a = sway * swing.env * sp; out.sway = [Math.cos(hh) * a, -Math.sin(hh) * a]; }   // pelvis leans over the planted foot
    return out;
  };
};
