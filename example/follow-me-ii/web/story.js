// "Follow me II" — leash walking #2: stay with you through turns, speed changes and a distraction. 3D puppy + harness/leash (web/leash.js) in the backyard, the 2D kneeling trainer in the hook and the "yes", 1222 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3, round(s*30); sentence-start words from the silence_end before them):
// Let's 0 teach 8 dog 18 stick 32 you 46 every 58 turn 70 | Clip 114 leash 128 head 151 somewhere 156 quiet 164 outside 176 | Walk 229 slow 238 figure 246 eight 258 make 286 U 296 turn 300 |
// When 341 dog 346 catches 353 beside 370 leg 385 | reward 409 right 415 there 428 | Now 468 change 469 speed 482 | Walk 518 fast 521 then 553 slow 556 then 591 stop 595 | Reward 638 dog 653 matching 668 you 677 |
// Next 721 practice 743 near 752 bush 764 or 772 quiet 789 toy 799 | If 834 dog 838 loses 844 track 854 you 878 added 888 surprises 894 too 909 soon 921 | Keep 962 turns 971 predictable 980 first 1010 |
// then 1035 reward 1039 every 1049 second 1061 or 1080 third 1087 time 1093 | Say 1129 yes 1133 or 1144 click 1160 | then 1197 reward 1199 | end 1221.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w`. Every shot boundary and action is keyed to `w`.
// The puppy's dog path IS the figure eight (a Gerono lemniscate); the camera follows the trainer's arc along it, so the world turns behind the puppy. The leash is drawn by leash.js.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1222, DECK = 0;
const w = {
  lets: 0, stick: 32, clip: 114, leash1: 128, head: 151, walk1: 229, figure: 246, makeU: 286, when: 341, beside: 370, leg: 385, reward1: 409, now: 468, walkF: 518, slowW: 553, stopW: 595,
  reward2: 638, matching: 668, next: 721, bush: 764, toyW: 799, if: 834, loses: 844, surprises: 894, soon: 921, keep: 962, predictable: 980, then: 1035, every: 1049, third: 1087,
  say: 1129, yes: 1133, click: 1160, then2: 1197, reward3: 1199, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.clip - 1, light: 'day' },                 // kneeling trainer + puppy on a loose leash, check on "stick with you"
  { id: 'setup', a: w.clip, b: w.walk1 - 1, light: 'day' },          // clip-on close-up, then a hard cut to the quiet lawn
  { id: 'path', a: w.walk1, b: w.when - 1, light: 'day' },           // the figure eight as a dotted trail, the puppy follows it
  { id: 'catchUp', a: w.when, b: w.reward1 - 15, light: 'day' },     // lags, then catches up beside the leg
  { id: 'rewardLeg', a: w.reward1 - 14, b: w.now - 1, light: 'day' },// reward right there
  { id: 'speed', a: w.now, b: w.reward2 - 1, light: 'day' },         // fast, slow, stop: trail dots spread / bunch, the puppy matches
  { id: 'rewardMatch', a: w.reward2, b: w.next - 1, light: 'day' },  // reward for matching
  { id: 'distract', a: w.next, b: w.if - 1, light: 'day' },          // near a bush and a quiet toy
  { id: 'loseTrack', a: w.if, b: w.keep - 1, light: 'day' },         // MISTAKE: eyes on the toy, leash goes tight (red + cross)
  { id: 'predict', a: w.keep, b: w.then - 1, light: 'day' },         // predictable turns: loose leash, check
  { id: 'rewardEvery', a: w.then, b: w.say - 1, light: 'day' },      // reward every second or third time
  { id: 'yes', a: w.say, b: w.then2 - 1, light: 'golden' },          // trainer: "yes" + click
  { id: 'povFinal', a: w.then2, b: TOTAL - 1, light: 'golden' },     // POV: reward, confetti
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const sm = M.smooth;
const KF = (f, keys, ease = sm) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) { const [fa, va] = keys[i], [fb, vb] = keys[i + 1]; if (f <= fb) { const t = ease((f - fa) / (fb - fa)); return Array.isArray(va) ? va.map((v, k) => lerp(v, vb[k], t)) : lerp(va, vb, t); } }
  return keys[keys.length - 1][1];
};
const add = (a, b) => a.map((v, i) => v + b[i]);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const mul = (a, k) => a.map((v) => v * k);
const norm = (a) => mul(a, 1 / (Math.hypot(...a) || 1));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const chompAt = (f, t0, n = 14) => (f >= t0 && f < t0 + n ? Math.abs(Math.sin((f - t0) * 0.75)) : 0);

// ---------- lights (Down II) ----------
export const LIGHTS = {
  day: { az: 135, el: 50, sky: '#c4d6f2', ground: '#8a8262', hemi: 1.2, sun: '#fff1dc', sunI: 2.4, fog: '#cadcf0', fogNear: 60, fogFar: 700, skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.08, vig: 0.2, shadowExt: 3 },
  golden: { az: 120, el: 30, sky: '#ffe8cc', ground: '#8a7a62', hemi: 1.2, sun: '#ffe2bc', sunI: 2.4, fog: '#f4d6b0', fogNear: 60, fogFar: 650, skyTop: '#6f8fd8', skyHor: '#ffd2a0', sat: 1.04, vig: 0.24, shadowExt: 3, gain: '#fffaf2' },
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });

// ---------- the figure eight (Gerono lemniscate), parametrised by arc length ----------
const PA = 2.3, PB = 3.4, NS = 3000;
const pxz = (t) => [PA * Math.sin(t), PB * Math.sin(t) * Math.cos(t)];
const ptan = (t) => norm([PA * Math.cos(t), PB * Math.cos(2 * t)]);
const CUM = [0]; for (let i = 1; i <= NS; i++) { const a = pxz((i - 1) / NS * 2 * Math.PI), b = pxz(i / NS * 2 * Math.PI); CUM.push(CUM[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
const LAP = CUM[NS];
const pathAt = (s) => {   // -> { x, z, hx, hz } (unit heading)
  s = ((s % LAP) + LAP) % LAP; let lo = 0, hi = NS; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (CUM[m] <= s) lo = m; else hi = m; }
  const t = (lo + (s - CUM[lo]) / (CUM[hi] - CUM[lo])) / NS * 2 * Math.PI, [x, z] = pxz(t), [hx, hz] = ptan(t);
  return { x, z, hx, hz };
};
const S0 = 0.6;   // the walk starts a little way along the path

// ---------- staging ----------
const K = 0.00225, ST = 1.08, DOGYAW = Math.PI / 2, HEEL = 0.3, TAUT = 1.12, LOOSE = 0.95, SIDE = 0.5;
const TRN = [0.52, 0, -0.66];                           // trainer card (hook / yes)
const HOOKD = [0.1, 0, -0.45];                          // puppy position in the hook / yes (faces the trainer)
let CUR = [0, 1, 3], TCUR = TRN;
const axisOf = (pos) => { const ry = Math.atan2(CUR[0] - pos[0], CUR[2] - pos[2]); return [Math.cos(ry), 0, -Math.sin(ry)]; };
const tD = (P) => {
  const C = CUR, TR0 = TCUR, ax = axisOf(TR0), n = [-ax[2], 0, ax[0]];
  const d = [P[0] - C[0], P[1] - C[1], P[2] - C[2]], den = d[0] * n[0] + d[2] * n[2] || 1e-6;
  const s = ((TR0[0] - C[0]) * n[0] + (TR0[2] - C[2]) * n[2]) / den, Q = [C[0] + d[0] * s, C[1] + d[1] * s, C[2] + d[2] * s];
  return [300 - ((Q[0] - TR0[0]) * ax[0] + (Q[2] - TR0[2]) * ax[2]) / (K * ST), 975 - (Q[1] - TR0[1]) / (K * ST)];
};
const dP = ([dx, dy]) => { const ax = axisOf(TRN), s = (300 - dx) * K * ST; return [TRN[0] + ax[0] * s, (975 - dy) * K * ST, TRN[2] + ax[2] * s]; };
const REF = {};
export const calibrate = (poseFn, root) => {
  root.position.set(0, 0, 0); root.rotation.set(0, DOGYAW, 0); root.updateMatrixWorld(true);
  const far = [3, 0.3, 0];
  REF.sit = poseFn({ w: { sit: 1 }, look: far }); REF.stand = poseFn({ w: { stand: 1 }, look: far });
};
const noseAt = (x, z, yaw, pose = 'stand', dy = 0) => { const n = REF[pose].nose, c = Math.cos(yaw - DOGYAW), s = Math.sin(yaw - DOGYAW); return [x + n[0] * c + n[2] * s, n[1] + dy, z - n[0] * s + n[2] * c]; };
const ringAt = (x, z, yaw, y = 0.41) => [x + 0.103 * Math.sin(yaw), y, z + 0.103 * Math.cos(yaw)];

// ---------- walking: trainer arc sT(f), puppy offset along the path A(f), turn-back ----------
const SPD = 0.024;   // m per frame (0.72 m/s)
const SEG = (f, a, b, up, dn) => sm(ramp(f, a, a + up)) * (1 - sm(ramp(f, b - dn, b)));
const vAt = (f) => {
  let v = SEG(f, w.walk1, w.reward1 - 12, 14, 18) * SPD;
  if (f >= w.now && f < w.reward2) {   // speed shot: normal, fast, slow, stop
    v = KF(f, [[w.now, 0], [w.now + 14, SPD], [w.walkF - 6, SPD], [w.walkF + 8, 0.05], [w.slowW - 4, 0.05], [w.slowW + 8, 0.012], [w.stopW - 2, 0.012], [w.stopW + 8, 0]]);
  } else if (f >= w.next && f < w.keep) v = SEG(f, w.next + 1, w.loses + 8, 12, 20) * SPD;
  else if (f >= w.keep && f < w.then) v = SEG(f, w.keep, w.then - 1, 12, 14) * SPD;
  return v;
};
const SS = [S0]; for (let f = 1; f <= TOTAL; f++) SS.push(SS[f - 1] + vAt(f));
const sT = (f) => SS[clamp(Math.round(f), 0, TOTAL)];
// puppy turns round to look back and walks to us (loseTrack): t0 = start, sc = time scale. yaw is relative to the path heading.
const TURN = (f, t0, sc) => {
  const t = (f - t0) / sc;
  const yaw = KF(t, [[0, 0], [14, 0], [34, -170], [66, -170], [92, -360]]) * Math.PI / 180;
  const off = KF(t, [[0, TAUT], [34, TAUT], [70, HEEL]]);
  return { off, yaw, back: sm(ramp(t, 0, 14)) * (1 - sm(ramp(t, 70, 92))) };
};
const T_TURN = 922, SC_TURN = 0.45;
const alongA = (f) => {
  let A = HEEL;
  if (f >= w.walk1 + 60) A = KF(f, [[w.when - 24, HEEL], [w.when, -0.75]]);              // dawdles just before "when your dog catches up"
  if (f >= w.when) A = KF(f, [[w.when, -0.75], [w.when + 10, -0.75], [w.beside + 2, HEEL]]);
  if (f >= w.if - 12) A = KF(f, [[w.if - 12, HEEL], [w.loses + 22, TAUT]]);                // eyes on the toy: it forges ahead
  if (f >= T_TURN) A = TURN(f, T_TURN, SC_TURN).off;
  if (f >= w.keep) A = HEEL;
  return A;
};
const yawRelAt = (f) => (f >= T_TURN && f < w.keep ? TURN(f, T_TURN, SC_TURN).yaw : 0);
const backAt = (f) => (f >= T_TURN && f < w.keep ? TURN(f, T_TURN, SC_TURN).back : 0);
const dogP = (f) => {
  const st = sT(f), A = alongA(f), p = pathAt(st + A), yr = yawRelAt(f), hy = Math.atan2(p.hx, p.hz);
  return { x: p.x, z: p.z, hx: p.hx, hz: p.hz, yaw: hy + yr, yr, A, st };
};
const DP = []; { let ph = 0; for (let f = 0; f <= TOTAL; f++) { const a = DP.length ? DP[f - 1] : dogP(0), b = dogP(f), d = Math.hypot(b.x - a.x, b.z - a.z) + 0.12 * Math.abs(b.yaw - a.yaw); ph += d / 0.42; DP.push({ ...b, ph, sp: d * 30 }); } }
const DPf = (f) => DP[clamp(Math.round(f), 0, TOTAL)];
// leash tension: taut only while the puppy is ahead AND still facing forward; turning toward the trainer slackens within ~6 frames
const tension = (f) => {
  const d = DPf(f), t = sm(ramp(d.A, 0.62, 1.05)), yr = d.yr;
  return yr < -0.01 ? Math.min(t, 1 - sm(ramp(-yr, 0.12, 1.0))) : t;
};
// trainer, hand (out of frame: behind and to the right of the puppy), props
const trP = (f) => { const p = pathAt(sT(f)); return { x: p.x - p.hz * SIDE, z: p.z + p.hx * SIDE, hx: p.hx, hz: p.hz }; };   // right of the path = +90 deg of heading: (-hz, hx)
const handOf = (f) => { const d = DPf(f); return [d.x - d.hx * 1.05 - d.hz * SIDE, 0.75, d.z - d.hz * 1.05 + d.hx * SIDE]; };   // always trailing behind the puppy, out of frame: taut/slack comes from tension()
const STOPS = { loseA: sT(w.loses + 12) };
export const PROPS = (() => {
  const b = pathAt(sT(w.next + 50) + 0.4), tp = pathAt(sT(w.loses + 12) + TAUT + 0.4), toyP = { x: tp.x - tp.hz * 0.55, z: tp.z + tp.hx * 0.55 };
  return { cones: [[PA * 0.5, 0], [-PA * 0.5, 0]], bush: [b.x + b.hz * 5.2, b.z - b.hx * 5.2], toy: [toyP.x, toyP.z] };   // bush on the far (left) side of the path
})();

export const propsVis = (f) => { const id = shotAt(f).id, on = id === 'distract' || id === 'loseTrack'; return { cones: false, bush: on, toy: on }; };   // props only where they can never stand between camera and puppy

// ---------- cameras ----------
const trackCam = (f, dist = 2.15, h = 0.62, ly = 0.5) => {   // side tracking rig: the puppy in profile, world turns with the path
  const S = shotAt(f), d = DPf(f), p = pathAt(sT(f) + 0.9 * d.A + (S.id === 'loseTrack' ? 0.3 * (1 - sm(ramp(f, T_TURN, T_TURN + 10))) - 0.1 * sm(ramp(f, T_TURN + 10, T_TURN + 20)) : 0.06));
  const dd = (S.id === 'loseTrack' ? 2.6 : dist) - 0.001 * (f - S.a);
  return { pos: [p.x - p.hz * dd, h, p.z + p.hx * dd], look: [p.x, ly, p.z], fov: 44 };
};
const frontCam = (f, key = 0) => { const d = DPf(f), r = [-d.hz, d.hx]; return { pos: [d.x + d.hx * (1.28 + key) + r[0] * 0.56, 0.88, d.z + d.hz * (1.28 + key) + r[1] * 0.56], look: [d.x + d.hx * 0.2, 0.22, d.z + d.hz * 0.2], fov: 42 }; };
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.clip - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  setup: [{ f: w.clip, pos: [1.0, 0.52, 1.25], look: [0.1, 0.3, 0.0], fov: 38 }, { f: w.head - 5, pos: [0.93, 0.52, 1.18], look: [0.1, 0.3, 0.0], fov: 38 },
    { f: w.head - 4, pos: [0.0, 0.62, 2.45], look: [0.0, 0.5, 0.0], fov: 44 }, { f: w.walk1 - 1, pos: [0.0, 0.62, 2.3], look: [0.0, 0.5, 0.0], fov: 44 }],
  yes: [{ f: w.say, pos: [0.3, 0.82, 2.3], look: [0.34, 0.5, -0.35], fov: 43 }, { f: w.then2 - 1, pos: [0.32, 0.78, 2.15], look: [0.35, 0.52, -0.35], fov: 43 }],
};
const FRONT = ['rewardLeg', 'rewardMatch', 'rewardEvery', 'povFinal'];
export const camAt = (f) => {
  const S = shotAt(f); let c;
  if (CAMS[S.id]) c = camFromKeys(CAMS[S.id], f, {});
  else if (FRONT.includes(S.id)) c = camFromKeys([{ f: S.a, ...frontCam(f) }, { f: S.b, ...frontCam(f, -0.1) }], f, {});
  else if (S.id === 'path') c = trackCam(f, 2.25, 0.95, 0.32);
  else if (S.id === 'speed') c = trackCam(f, 3.0, 0.95, 0.32);
  else if (S.id === 'distract') c = trackCam(f, 2.15, 1.05, 0.36);
  else c = trackCam(f);
  if (!CAMS[S.id]) { c.pos = add(c.pos, [0.005 * Math.sin(f * 0.11), 0.004 * Math.sin(f * 0.07 + 1), 0.005 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 0.5 * Math.sin(f * 0.05); }
  c.shadowAt = [c.look[0], 0.1, c.look[2]];
  return c;
};
const camBasis = (f) => { const C = camAt(f), fw = norm(sub(C.look, C.pos)), rt = norm(cross(fw, [0, 1, 0])), up = cross(rt, fw); return { C, fw, rt, up }; };
const handPt = (f, a, b, c) => { const { C, fw, rt, up } = camBasis(f); return add(C.pos, add(mul(fw, a), add(mul(rt, b), mul(up, c)))); };

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f), d = DPf(f);
  const base = { pos: [d.x, 0, d.z], yaw: d.yaw, w: { stand: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.7, ears: 0.2 * Math.max(0, Math.sin(f * 0.09)) };
  const W = worldAt(f), happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const gk = clamp(d.sp / 0.5), gait = gk > 0.02 ? { phase: d.ph, amp: 24 + 8 * clamp((d.sp - 0.8) / 0.7), lift: 1.1, k: gk } : undefined;
  const ahead = [d.x + d.hx * 2.2, 0.12, d.z + d.hz * 2.2], camP = camAt(f).pos, toBack = [camP[0], 0.1, camP[2]];
  const bump = (a, b) => sm(ramp(f, a, a + 8)) * (1 - sm(ramp(f, b - 8, b)));
  switch (S.id) {
    case 'hook': return { ...base, pos: HOOKD, yaw: DOGYAW, w: { sit: 1 }, look: [TRN[0] - 0.05, 0.75, TRN[2]], neck: 0.9, wag: 0.8 * Math.sin(f * 0.5), tail: 0.2, ears: -0.2 };
    case 'setup': {
      const p0 = { ...base, pos: [0, 0, 0], yaw: DOGYAW };
      if (f < w.head - 4) return { ...p0, w: { stand: 1 }, look: [0.9, -0.15, 0.9], neck: 0.6, wag: 0.6 * Math.sin(f * 0.45), tail: 0.2, ears: -0.2, headTilt: 7 * Math.sin(Math.PI * ramp(f, w.clip + 18, w.leash1 + 12)) };
      return { ...p0, w: { stand: 1 }, look: [3, 0.08 + 0.1 * Math.sin(f * 0.03), 0.3 * Math.sin(f * 0.04)], neck: 0.5, wag: 0.5 * Math.sin(f * 0.35), tail: 0.2 + 0.2 * Math.max(0, Math.sin(f * 0.14)), ears: 0.2 * Math.max(0, Math.sin(f * 0.09)) };
    }
    case 'path': case 'catchUp': return { ...base, gait, look: ahead, neck: 0.5, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2 + 0.2 * Math.max(0, Math.sin(f * 0.14)) };
    case 'speed': return { ...base, gait, look: ahead, neck: 0.5, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2 + 0.2 * Math.max(0, Math.sin(f * 0.14)), ears: base.ears + (f > w.walkF && f < w.slowW ? 0.35 : 0) };
    case 'rewardLeg': case 'rewardMatch': case 'rewardEvery': {
      const ts = S.id === 'rewardLeg' ? [w.reward1 + 3] : S.id === 'rewardMatch' ? [w.reward2 + 12] : [w.then + 6, w.third - 4];
      const ch = Math.max(...ts.map((t0) => chompAt(f, t0))), after = ts.some((t0) => f >= t0 + 14);
      return { ...base, look: W.treat || add(noseAt(d.x, d.z, d.yaw), [0.1, 0.05, 0]), neck: 1, jaw: ch || (after ? 0.25 : 0), ...(ts.some((t0) => f > t0) ? happy : {}), blink: ts.some((t0) => f > t0 && f < t0 + 6) ? 1 : base.blink, gait };
    }
    case 'distract': {
      const gl = bump(w.bush - 4, w.bush + 20);
      return { ...base, gait, look: lerp3(ahead, [PROPS.bush[0], 0.3, PROPS.bush[1]], gl * 0.8), neck: 0.55, wag: 0.4 * Math.sin(f * 0.3), tail: 0.2 + 0.2 * Math.max(0, Math.sin(f * 0.14)) };
    }
    case 'loseTrack': {
      const toy = [PROPS.toy[0], 0.1, PROPS.toy[1]], lk = sm(ramp(f, w.if + 4, w.if + 16)), tn = tension(f), back = backAt(f);
      const look = lerp3(lerp3(ahead, toy, lk), toBack, back);
      return { ...base, gait, lean: tn * (5 + 1.5 * Math.sin(f * 0.09)), look, neck: 1.0 - 0.4 * back, wag: 0.1, tail: 0.1 + 0.3 * Math.max(0, Math.sin(f * 0.15)), ears: 0.4 * tn - 0.4 * back };
    }
    case 'predict': return { ...base, gait, look: ahead, neck: 0.5, wag: 0.6 * Math.sin(f * 0.3), tail: 0.3 + 0.2 * Math.max(0, Math.sin(f * 0.14)) };
    case 'yes': return { ...base, pos: HOOKD, yaw: DOGYAW, w: { sit: 1 }, look: [TRN[0] - 0.05, 0.75, TRN[2]], neck: 0.9, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    case 'povFinal': {
      const t0 = w.reward3 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, w: { sit: 1 }, look: W.treatHide || !W.treat ? add(noseAt(d.x, d.z, d.yaw, 'sit'), [0.5 * d.hx, -0.4, 0.5 * d.hz]) : add(W.treat, [0, -0.25, 0]), neck: 0.7, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- hands, treat, leash, trail ----------
const treatPath = (f) => {
  const S = shotAt(f), d = DPf(f);
  const mouth = (pose = 'stand') => add(noseAt(d.x, d.z, d.yaw, pose), [0.05 * Math.sin(d.yaw), -0.035, 0.05 * Math.cos(d.yaw)]);
  const rest = (g) => handPt(g, 0.75, 0.2, -0.42);
  const feed = (t0, a, b) => KF(f, [[a, rest(f)], [t0 - 3, mouth()], [t0 + 12, mouth()], [b, rest(f)]]);
  switch (S.id) {
    case 'rewardLeg': { const t0 = w.reward1 + 3; return feed(t0, S.a, t0 + 28); }
    case 'rewardMatch': { const t0 = w.reward2 + 12; return feed(t0, S.a, t0 + 28); }
    case 'rewardEvery': {
      const t1 = w.then + 6, t2 = w.third - 4;
      if (f < t2 - 20) return feed(t1, S.a, t1 + 28);
      return KF(f, [[t2 - 20, rest(f)], [t2 - 3, mouth()], [t2 + 12, mouth()], [t2 + 28, rest(f)]]);
    }
    case 'povFinal': { const t0 = w.reward3 + 2; return KF(f, [[w.then2, rest(f)], [t0 - 3, mouth('sit')], [t0, mouth('sit')]]); }
  }
  return null;
};
const frontShot = (f) => FRONT.includes(shotAt(f).id);
const colAt = (f) => {
  const t = tension(f), win = (a, b) => (f >= a && f < b ? sm(ramp(f, a, a + 6)) * (1 - sm(ramp(f, b - 6, b))) : 0);
  const green = Math.max(win(w.beside - 8, w.reward1), win(w.keep + 14, w.then - 2), win(w.walkF - 2, w.walkF + 40), win(w.stopW - 4, w.stopW + 30)), red = sm(ramp(t, 0.5, 0.92));
  const base = [0.24, 0.43, 0.71], g = [0.25, 0.75, 0.42], r = [0.88, 0.25, 0.22];
  const c = lerp3(lerp3(base, g, green * (1 - red)), r, red);
  return '#' + c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
};
// the planned figure eight as a dotted trail (path shot) and time-stamped dots behind the puppy (speed shot): spacing = speed
const PATHDOTS = []; for (let s = 0; s < LAP; s += 0.26) { const p = pathAt(s); PATHDOTS.push([p.x, 0.02, p.z]); }
const trailAt = (f) => {
  const S = shotAt(f);
  const d = DPf(f), far = (p) => Math.hypot(p[0] - d.x, p[2] - d.z) > 0.5;   // no beads under the puppy's paws
  if (S.id === 'path') return PATHDOTS.filter(far);
  if (S.id === 'predict') { const s0 = sT(f); return PATHDOTS.filter((_, i) => { const s = i * 0.26, ds = ((s - s0) % LAP + LAP) % LAP; return ds > 0.5 && ds < 3.4; }).filter(far); }
  if (S.id === 'speed') { const out = []; for (let g = w.now + 4; g <= f - 3; g += 9) { const p = pathAt(sT(g) + alongA(g)); out.push([p.x, 0.02, p.z]); } return out.filter((p) => Math.hypot(p[0] - d.x, p[2] - d.z) > 0.3); }
  return null;
};
export const worldAt = (f) => {
  const S = shotAt(f), W = {}, d = DPf(f);
  CUR = camAt(f).pos;
  const t = treatPath(f); if (t) W.treat = t;
  const slack = LOOSE * (1 - tension(f)) + 0.02;
  if (S.id === 'hook' || S.id === 'yes') W.leash = { hand: trainerHandWorld(f), slack: 0.4, col: colAt(f) };
  else if (S.id === 'setup') W.leash = { hand: f < w.head - 4 ? [-0.55, 0.95, 0.65] : [-1.0, 0.75, 0.5], slack: LOOSE, col: colAt(f) };
  else if (frontShot(f)) { W.leash = { hand: [d.x - d.hx * 0.2 - d.hz * 0.9, 0.75, d.z - d.hz * 0.2 + d.hx * 0.9], slack, col: colAt(f) }; if (t) W.hand = { treat: t, pose: 'pinch', side: 0.16 }; }
  else W.leash = { hand: handOf(f), slack, col: colAt(f) };
  const tr = trailAt(f); if (tr) { W.trail = tr; W.trailCol = '#ffffff'; }
  const hide = (S.id === 'rewardLeg' && f >= w.reward1 + 13) || (S.id === 'rewardMatch' && f >= w.reward2 + 22) || (S.id === 'povFinal' && f >= w.reward3 + 4)
    || (S.id === 'rewardEvery' && ((f >= w.then + 16 && f < w.third - 23) || f >= w.third + 6));
  if (hide) W.treatHide = true;
  return W;
};
const HANDD = { hook: [272, 810], yes: [272, 810] };
function trainerHandWorld(f) { const S = shotAt(f); CUR = camAt(f).pos; return dP(HANDD[S.id] || HANDD.hook); }

// ---------- the 2D trainer (hook + yes, kneeling) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerHook = (f) => {
  const hi = idle(f, 3); CUR = camAt(f).pos;
  return { hose: true, kneel: 1, expr: f > 36 ? 'grin' : 'smile', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt, bob: hi.bob * 40, lean: 2, near: { to: tD(trainerHandWorld(f)), hand: 'fist', bend: -1 }, far: 'hip' };
};
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5; CUR = camAt(f).pos;
  return { hose: true, kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 3, bob: hi.bob * 40,
    near: { to: tD(trainerHandWorld(f)), hand: 'fist', bend: -1 }, far: { to: [225, 700 - 50 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: 1 }, click: clickOn ? 1 : 0 };
};
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), d = DPf(f);
  if (S.id === 'hook' || S.id === 'yes') return { focus: Math.hypot(C.pos[0] - 0.3, C.pos[1] - 0.5, C.pos[2] + 0.3), cinf: 5 };
  if (S.id === 'setup' && f >= w.head - 4) return { focus: Math.hypot(C.pos[0] - 0.5, C.pos[1] - 0.3, C.pos[2]), cinf: 6 };
  return { focus: Math.hypot(C.pos[0] - d.x, C.pos[1] - 0.25, C.pos[2] - d.z), cinf: 4 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  CUR = camAt(f).pos; TCUR = TRN;
  const S = shotAt(f), out = [];
  const card = (o) => out.push({ key: 'tr' + JSON.stringify(o), draw: (p) => T.trainerDraw(p, o), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: 0, blobW: 0.8 });
  if (S.id === 'yes') card(roundAll({ ...trainerYes(f), mirror: true }));
  if (S.id === 'hook') card(roundAll({ ...trainerHook(f), mirror: true }));
  return out;
};
const BUB_YES = [0.0, 0.74, -0.45];
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f), d = DPf(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = add(noseAt(d.x, d.z, d.yaw, S.id === 'povFinal' ? 'sit' : 'stand'), [0, 0.12, 0]);
  const above = [d.x, 0.8, d.z];
  if (S.id === 'hook') badge(T.fxCheck, 'ok', w.stick + 4, w.stick + 40, [0.0, 0.82, -0.42], 0.22);
  if (S.id === 'setup' && f < w.head - 4) badge(T.fxCheck, 'ok', w.leash1 + 4, w.head - 4, [0.0, 0.5, 0.45], 0.11);
  if (S.id === 'catchUp') badge(T.fxCheck, 'ok', w.beside + 4, w.reward1 - 14, above, 0.17);
  if (S.id === 'rewardLeg') hearts(w.reward1 + 4, HEAD);
  if (S.id === 'speed') { badge(T.fxCheck, 'ok', w.stopW + 2, w.reward2 - 2, above, 0.17); }
  if (S.id === 'rewardMatch') hearts(w.reward2 + 13, HEAD);
  if (S.id === 'loseTrack') badge(T.fxCross, 'no', w.loses + 24, w.soon + 14, above, 0.28);
  if (S.id === 'predict') badge(T.fxCheck, 'ok', w.predictable, w.then - 2, above, 0.17);
  if (S.id === 'rewardEvery') { hearts(w.then + 7, HEAD); hearts(w.third - 3, HEAD); }
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), add(dP([185, 640]), [0, 0.1, 0.12]), 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward3 + 3, HEAD, 4, 0.06);
    if (f >= w.reward3) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward3 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(noseAt(d.x, d.z, d.yaw, 'sit'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
