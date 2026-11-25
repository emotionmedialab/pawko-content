// "Trainer legs" — kit-piece proof: the 3D trainer lower body (legs3d.js) with the 3D puppy. Three 3.6 s test shots, no voice, no trainer card.
//   weave    0..107   legs apart, the puppy weaves through them (gap -> around the left leg -> back toward the gap) while the trainer steps
//   peek   108..215   puppy stands in the gap between the legs, head pops out forward of the shins and looks around
//   footsies 216..323 puppy's front paws ride on the shoes; the trainer takes 2 small steps, the puppy backs up with him
// Every keyed frame is relative to the shot start (S.a); nothing is tied to a voice. Hard cuts only, one sun (day).
import { M, camFromKeys, blinkAt, clamp, lerp, ramp, spline } from './motion.js';
import { legsTimeline } from './legs3d.js';
import { POSES } from './dogrig.js';
export const FPS = 30, TOTAL = 324, DECK = 0;
const MAT = 0.064;
const SH = 108;   // frames per shot
export const SHOTS = [
  { id: 'weave', a: 0, b: SH - 1, light: 'day' },
  { id: 'peek', a: SH, b: 2 * SH - 1, light: 'day' },
  { id: 'footsies', a: 2 * SH, b: 3 * SH - 1, light: 'day' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
export const LIGHTS = { day: { az: 135, el: 50, sky: '#c4d6f2', ground: '#8a8262', hemi: 1.2, sun: '#fff1dc', sunI: 2.4, fog: '#cadcf0', fogNear: 60, fogFar: 700,
  skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.08, vig: 0.2, shadowExt: 3 } };
export const lightFor = (S) => ({ ...LIGHTS[S.light] });
const sm = M.smooth;
const add = (a, b) => a.map((v, i) => v + b[i]);

// ---------- the trainer's legs: one timeline per shot ----------
const mid = (p) => [(p.L.x + p.R.x) / 2, (p.L.z + p.R.z) / 2];
const PLAN = {
  // trainer faces +z (toward the camera side), legs apart, 3 slow steps
  weave: legsTimeline({ at: [0, 0], yaw: 0, y: MAT, stance: 'apart',
    steps: [{ foot: 'R', a: 14, b: 38, fwd: 0.14 }, { foot: 'L', a: 44, b: 68, fwd: 0.14 }, { foot: 'R', a: 74, b: 98, fwd: 0.14 }] }),
  // legs a little apart, trainer faces the camera; one small weight-shift step so the legs are not frozen
  peek: legsTimeline({ at: [0, 0], yaw: 0.15, y: MAT, stance: 0.18, steps: [{ foot: 'L', a: SH + 80, b: SH + 100, fwd: 0.03, side: 0.02, lift: 0.04 }] }),
  // trainer faces +x, feet nearly together; two small steps (right, then left)
  footsies: legsTimeline({ at: [0, 0], yaw: Math.PI / 2, y: MAT, stance: 0.065,
    steps: [{ foot: 'R', a: 2 * SH + 40, b: 2 * SH + 58, fwd: 0.1, lift: 0.04 }, { foot: 'L', a: 2 * SH + 64, b: 2 * SH + 82, fwd: 0.1, lift: 0.04 }] }),
};
export const legsAt = (f) => PLAN[shotAt(f).id](f);

// ---------- weave: the puppy's path, in the trainer's frame (v = lateral toward the trainer's left leg, u = forward), so it moves with the feet ----------
const WPATH = [[0.0, 0.5], [0.0, 0.26], [0.0, -0.08], [0.02, -0.4], [0.2, -0.5], [0.38, -0.36], [0.44, -0.02], [0.38, 0.28], [0.26, 0.4], [0.14, 0.42]];
const wProg = (n) => { const t = clamp((n - 4) / 100); return 0.55 * t + 0.45 * sm(t); };
const wPos = (f) => {   // world x,z of the puppy in the weave shot
  const p = PLAN.weave(f), m = mid(p), [v, u] = spline(WPATH, wProg(f)), c = Math.cos(p.yaw), s = Math.sin(p.yaw);
  return [m[0] + c * v + s * u, m[1] - s * v + c * u];
};
const WD = []; { let ph = 0, prev = wPos(0); for (let f = 0; f < SH; f++) { const q = wPos(f), d = Math.hypot(q[0] - prev[0], q[1] - prev[1]); ph += d / 0.5; WD.push({ ph, sp: d * 30 }); prev = q; } }
const wHead = (f) => { const a = wPos(Math.max(0, f - 2)), b = wPos(Math.min(SH - 1, f + 2)); return Math.atan2(b[0] - a[0], b[1] - a[1]); };

// ---------- footsies: paws on the shoes ----------
const P0 = 6;   // body pitch (deg) of the paws pose
POSES.paws = { drop: 0, dropF: 0, pitch: P0, L: { flS: [-12, 0, 0], flE: [0, 0, 0], flW: [0, 0, 0] } };
const GS = [-56, 32, 4], GE = [-48, 48, 8];   // paw lookup grid: shoulder swing / elbow swing (deg) min, max, step
const REF = { grid: [] };   // paw ball position relative to the puppy's root (nose +x) for every (shoulder, elbow) pair, filled in by calibrate()
export const calibrate = (poseFn, root) => {
  root.position.set(0, 0, 0); root.rotation.set(0, Math.PI / 2, 0); root.updateMatrixWorld(true);
  for (let s = GS[0]; s <= GS[1]; s += GS[2]) { const row = []; for (let e = GE[0]; e <= GE[1]; e += GE[2]) { const r = poseFn({ w: { paws: 1 }, P: { paws: { ...POSES.paws, L: { ...POSES.paws.L, flS: [s, 0, 0], flE: [e, 0, 0] } } }, look: null }).paw[0]; row.push([r[0], r[1]]); } REF.grid.push(row); }
  REF.x0 = pawAt(-12, 0)[0];
};
const pawAt = (s, e) => {   // bilinear lookup of the paw ball (forward, up)
  const gi = clamp((s - GS[0]) / GS[2], 0, REF.grid.length - 1.001), gj = clamp((e - GE[0]) / GE[2], 0, REF.grid[0].length - 1.001), i = Math.floor(gi), j = Math.floor(gj), u = gi - i, v = gj - j, G = REF.grid;
  return [0, 1].map((k) => (G[i][j][k] * (1 - v) + G[i][j + 1][k] * v) * (1 - u) + (G[i + 1][j][k] * (1 - v) + G[i + 1][j + 1][k] * v) * u);
};
const pawIK = (x, y) => {   // shoulder/elbow swing (deg) that put the paw ball at (x forward, y up) relative to the root: a few Newton steps on the lookup
  let s = -12, e = 0, best = 9;   // start from the closest grid vertex
  REF.grid.forEach((row, i) => row.forEach((p, j) => { const dd = Math.hypot(p[0] - x, p[1] - y); if (dd < best) { best = dd; s = GS[0] + i * GS[2]; e = GE[0] + j * GE[2]; } }));
  for (let it = 0; it < 4; it++) {
    const p = pawAt(s, e), ps = pawAt(s + 2, e), pe = pawAt(s, e + 2), a = (ps[0] - p[0]) / 2, c = (ps[1] - p[1]) / 2, b = (pe[0] - p[0]) / 2, d = (pe[1] - p[1]) / 2, det = a * d - b * c || 1e-6;
    const ex = x - p[0], ey = y - p[1]; s = clamp(s + (d * ex - b * ey) / det, GS[0], GS[1]); e = clamp(e + (-c * ex + a * ey) / det, GE[0], GE[1]);
  }
  return { s, e };
};
const shoeTop = (k, p) => {   // world point on the toe box of foot k (matches legs.shoeTop)
  const f = p[k], z = 0.17, pitch = f.pitch || 0;
  return [f.x + Math.sin(f.yaw) * z * Math.cos(pitch), MAT + 0.085 + (f.lift || 0) + z * Math.sin(pitch) - 0.02, f.z + Math.cos(f.yaw) * z * Math.cos(pitch)];
};
const BACK = 0.07, TURN = -0.45, PAWR = 0.014;   // paw ball bone sits this far above the sole
const FD = [];       // footsies: puppy root per frame (built on first use, after calibrate)
const footsies = (f) => {
  const p = PLAN.footsies(f), tL = shoeTop('L', p), tR = shoeTop('R', p), yaw = p.yaw + Math.PI + TURN;   // the puppy faces the trainer, nose angled toward the camera side so the near leg does not hide its head
  const fx = Math.sin(yaw), fz = Math.cos(yaw), cx = (tL[0] + tR[0]) / 2, cz = (tL[2] + tR[2]) / 2;
  const pos = [cx - fx * (REF.x0 + BACK), MAT, cz - fz * (REF.x0 + BACK)];
  // dog-left paw rests on the trainer's R shoe, dog-right paw on the L shoe: each paw follows its own shoe (2-bone solve on shoulder + elbow)
  const dP = 150 * Math.max(p.L.lift, p.R.lift);   // the body tips up (deg) while a shoe is lifted, so both paws rise with it (~0.004 m forward, 0.0062 m up per degree)
  const ik = (t) => pawIK(REF.x0 + BACK + (t[0] - cx) * fx + (t[2] - cz) * fz - 0.004 * dP, t[1] + PAWR - MAT - 0.0062 * dP);
  const mp = mid(p), dist = mp[0] * Math.sin(p.yaw) + mp[1] * Math.cos(p.yaw);   // how far the feet have advanced along the heading
  return { pos, yaw, L: ik(tR), R: ik(tL), pitch: P0 + dP, dist, p };
};
const fSpeed = (f) => (f <= 2 * SH ? 0 : Math.abs(footsies(f).dist - footsies(f - 1).dist) * 30);

// ---------- cameras (dog-down-ii types: low 3/4 / low side) ----------
const CAMS = {
  weave: [{ f: 0, pos: [0.7, 0.5, 2.9], look: [0.2, 0.36, 0.05], fov: 46 }, { f: SH - 1, pos: [0.66, 0.5, 2.85], look: [0.2, 0.36, 0.05], fov: 46 }],
  peek: [{ f: SH, pos: [0.95, 0.4, 1.8], look: [0.05, 0.3, 0.0], fov: 42 }, { f: 2 * SH - 1, pos: [0.88, 0.4, 1.74], look: [0.05, 0.3, 0.05], fov: 42 }],
  footsies: [{ f: 2 * SH, pos: [0.3, 0.45, 2.45], look: [0.3, 0.4, 0.0], fov: 40 }, { f: 3 * SH - 1, pos: [0.36, 0.45, 2.4], look: [0.34, 0.4, 0.0], fov: 40 }],
};
export const camAt = (f) => { const c = camFromKeys(CAMS[shotAt(f).id], f, {}); c.shadowAt = [0.15, 0.2, 0]; return c; };
export const dofAt = (f) => ({ focus: Math.hypot(...camAt(f).pos.map((v, i) => v - [0.2, 0.3, 0][i])), cinf: 4 });

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f), n = f - S.a;
  const base = { pos: [0, MAT, 0], yaw: 0, w: { stand: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.5 * Math.sin(f * 0.3), tail: 0.2, neck: 0.7, ears: 0.1 * Math.sin(f * 0.1) };
  if (S.id === 'weave') {
    const q = wPos(f), yaw = wHead(f), d = WD[f], gk = clamp(d.sp / 0.4);
    return { ...base, pos: [q[0], MAT, q[1]], yaw, gait: gk > 0.02 ? { phase: d.ph, amp: 24, lift: 1.1, k: gk } : undefined, look: [q[0] + Math.sin(yaw) * 2, 0.15, q[1] + Math.cos(yaw) * 2], neck: 0.5, aimEyes: true, wag: 0.6 * Math.sin(f * 0.35) };
  }
  if (S.id === 'peek') {
    const p = PLAN.peek(f), yw = p.yaw, c = camAt(f).pos;
    // u = forward distance of the puppy's root from the ankle line: tucked back (nose behind the shins), then pops forward
    const pop = sm(ramp(n, 20, 44)), back = sm(ramp(n, 74, 96)), u = lerp(-0.5, -0.2, pop) - 0.05 * back, v = 0.0;
    const m = mid(p), x = m[0] + Math.sin(yw) * u + Math.cos(yw) * v, z = m[1] + Math.cos(yw) * u - Math.sin(yw) * v;
    const moving = pop > 0.001 && pop < 0.999 ? 1 : 0;
    const lk = Math.sin(Math.PI * ramp(n, 50, 90));   // glance left then right once it is out
    const look = [c[0] + Math.cos(yw) * 0.35 * Math.sin(2 * Math.PI * ramp(n, 50, 92)), 0.18 + 0.05 * lk, c[2]];
    return { ...base, pos: [x, MAT, z], yaw: yw + 0.3, aimEyes: true, gait: moving ? { phase: u / 0.5 * 2, amp: 16, lift: 0.8, k: 1 } : undefined, look, neck: 1,
      headTilt: 12 * Math.sin(Math.PI * ramp(n, 46, 72)), ears: -0.3 * pop, wag: Math.sin(f * 0.5) * (0.4 + pop) };
  }
  // footsies
  const d = footsies(f), gk = clamp(fSpeed(f) / 0.25);
  const P = { paws: { drop: 0, dropF: 0, pitch: d.pitch, L: { flS: [d.L.s, 0, 0], flE: [d.L.e, 0, 0], flW: [0, 0, 0] }, R: { flS: [d.R.s, 0, 0], flE: [d.R.e, 0, 0] } } };
  return { ...base, pos: d.pos, yaw: d.yaw, w: { paws: 1 }, P, gait: gk > 0.02 ? { phase: -d.dist / 0.3, amp: 18, lift: 1.0, k: gk, hindOnly: true } : undefined,
    look: [camAt(f).pos[0], 0.12, camAt(f).pos[2]], neck: 0.55, aimEyes: true, wag: Math.sin(f * 0.6) * 0.9, tail: 0.3 };
};

export const actorsAt = () => [];
export const worldAt = () => ({});
export const fxAt = () => [];
