// "Gentle approach II" — leash walking #25: stay calm around a passing dog. 3D puppy + harness/leash (web/leash.js) in the backyard, a second dog (the same model, charcoal grey) on the far side of the lawn,
// the 2D kneeling trainer in the hook and the "yes", 1056 frames, timed to voice.mp3 (Holden). Cloned from the approved follow-me-ii.
// Word frames (voice.mp3, round(s*30); sentence-start words from the silence_end before them):
// Let's 0 stay 30 calm 37 people 91 | Grab 129 leash 138 best 159 treats 166 | Start 205 far 210 eat 268 | When 300 looks 312 other 330 calmly 343 reward 375 |
// Then 409 reward 414 again 423 look 446 back 452 you 464 | Move 490 closer 493 relaxed 556 | Walk 598 curve 610 | Never 640 straight 643 them 661 |
// If 690 stiffens 701 stops 727 treats 748 you 777 too 782 close 789 | Add 825 distance 830 away 851 | End 887 session 895 calm 938 | Say 967 yes 973 click 997 | then 1029 reward 1033 | end 1055.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w`. Every shot boundary and action is keyed to `w`.
// The PUPPY walks a spiral around the other dog O (polar R(f), theta(f) around O); the camera stays on the outward side, so O is always behind the puppy and nothing is ever between camera and puppy.
// The distance line (dotted) is drawn on the lawn between the dogs; its badge scales with the distance. The leash is drawn by leash.js (trainer = off-screen hand behind the puppy).
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1056, DECK = 0;
const w = {
  lets: 0, stay: 30, people: 91, grab: 129, leash: 138, treats: 166, start: 205, eat: 268, when: 300, looks: 312, calmly: 343, reward1: 375, then1: 409, lookB: 446, you: 464, move: 490, relaxed: 556,
  walk: 598, never: 640, if: 690, stiffens: 701, stops: 727, you2: 777, add: 825, away: 851, end: 887, calm: 938, say: 967, yes: 973, click: 997, then2: 1029, reward3: 1033, last: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },                    // kneeling trainer + puppy; a person passes off-screen (footsteps, the puppy glances), check on "stay calm"
  { id: 'setup', a: w.grab, b: w.treats - 7, light: 'day' },            // leash clip close-up
  { id: 'treat', a: w.treats - 6, b: w.start - 1, light: 'day' },       // POV hand shows the treat
  { id: 'far', a: w.start, b: w.when - 1, light: 'day' },               // far across the lawn: distance line + badge, check
  { id: 'look', a: w.when, b: w.reward1 - 10, light: 'day' },           // looks at the other dog calmly
  { id: 'rewardLook', a: w.reward1 - 9, b: w.then1 - 1, light: 'day' }, // reward (POV hand)
  { id: 'lookBack', a: w.then1, b: w.lookB + 5, light: 'day' },         // looks back at you
  { id: 'rewardBack', a: w.lookB + 6, b: w.move - 1, light: 'day' },    // reward again (POV hand)
  { id: 'closer', a: w.move, b: w.walk - 1, light: 'day' },             // closer, relaxed: the distance badge shrinks
  { id: 'curve', a: w.walk, b: w.if - 1, light: 'day' },                // a curved path, never straight at them
  { id: 'closeIn', a: w.if, b: w.stops + 8, light: 'day' },             // too close: stiffens, leash tight + red
  { id: 'refuse', a: w.stops + 9, b: w.you2 - 1, light: 'day' },        // turns its head away from the treat
  { id: 'tooClose', a: w.you2, b: w.add - 1, light: 'day' },            // red cross
  { id: 'addDist', a: w.add, b: w.end - 1, light: 'day' },              // add distance: the line grows back, slack leash, green, check
  { id: 'endCalm', a: w.end, b: w.say - 1, light: 'day' },              // end calm
  { id: 'yes', a: w.say, b: w.then2 - 1, light: 'golden' },             // trainer: "yes" + click
  { id: 'povFinal', a: w.then2, b: TOTAL - 1, light: 'golden' },        // POV: reward, confetti
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const sm = M.smooth;
const KF = (f, keys, ease = sm) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) { const [fa, va] = keys[i], [fb, vb] = keys[i + 1]; if (f <= fb) { const t = ease((f - fa) / (fb - fa)); return Array.isArray(va) ? va.map((v, k) => lerp(v, vb[k], t)) : lerp(va, vb, t); } }
  return keys[keys.length - 1][1];
};
const KL = (f, keys) => KF(f, keys, (t) => t);
const add = (a, b) => a.map((v, i) => v + b[i]);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const mul = (a, k) => a.map((v) => v * k);
const norm = (a) => mul(a, 1 / (Math.hypot(...a) || 1));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const chompAt = (f, t0, n = 14) => (f >= t0 && f < t0 + n ? Math.abs(Math.sin((f - t0) * 0.75)) : 0);
const angLerp = (a, b, t) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * t; };
const D2R = Math.PI / 180;

// ---------- lights (Down II) ----------
export const LIGHTS = {
  day: { az: 135, el: 50, sky: '#c4d6f2', ground: '#8a8262', hemi: 1.2, sun: '#fff1dc', sunI: 2.4, fog: '#cadcf0', fogNear: 60, fogFar: 700, skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.08, vig: 0.2, shadowExt: 5 },
  golden: { az: 120, el: 30, sky: '#ffe8cc', ground: '#8a7a62', hemi: 1.2, sun: '#ffe2bc', sunI: 2.4, fog: '#f4d6b0', fogNear: 60, fogFar: 650, skyTop: '#6f8fd8', skyHor: '#ffd2a0', sat: 1.04, vig: 0.24, shadowExt: 3, gain: '#fffaf2' },
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });

// ---------- staging ----------
const DOGYAW = Math.PI / 2, HEEL = 0.3, SIDE = 0.5, ST = 1.08, K = 0.00225;
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

// ---------- the other dog O: walks a slow curve into place (frames 205-292), then stands ----------
const OYAW = (f) => KL(f, [[w.start, Math.PI / 2], [w.when - 8, 0.4]]);
const OSP = (f) => KL(f, [[w.start, 0], [w.start + 13, 0.0105], [w.when - 24, 0.0105], [w.when - 8, 0]]);
const OP = []; { let x = 0, z = 0; for (let f = 0; f <= TOTAL; f++) { OP.push([x, z]); x += Math.sin(OYAW(f)) * OSP(f); z += Math.cos(OYAW(f)) * OSP(f); } const e = OP[TOTAL]; for (const p of OP) { p[0] -= e[0]; p[1] -= e[1] + 1.0; } }
const OD = []; { let ph = 0; for (let f = 0; f <= TOTAL; f++) { const a = OP[Math.max(0, f - 1)], b = OP[f], d = Math.hypot(b[0] - a[0], b[1] - a[1]); ph += d / 0.42; OD.push({ x: b[0], z: b[1], yaw: OYAW(f), ph, sp: d * 30 }); } }
const ODf = (f) => OD[clamp(Math.round(f), 0, TOTAL)];

// ---------- the puppy: a spiral around O. R(f) = distance to O, theta(f) = angle round O (starts -62 deg, walks toward +x) ----------
const RK = [[0, 6.0], [w.start, 6.0], [w.move, 6.0], [560, 5.2], [w.walk, 4.8], [689, 3.4], [712, 3.0], [824, 3.0], [886, 4.4], [935, 4.8], [TOTAL, 4.8]];
const VK = [[0, 0], [w.start, 0], [w.start + 9, 0.012], [350, 0.012], [362, 0], [w.then1, 0], [w.then1 + 11, 0.012], [438, 0.012], [448, 0], [w.move - 1, 0], [w.move + 10, 0.015], [w.walk, 0.026], [700, 0.026], [708, 0], [826, 0], [834, 0.008], [886, 0.014], [925, 0.014], [938, 0]];
const PRAW = []; { let th = -62 * D2R; for (let f = 0; f <= TOTAL; f++) { const R = KL(f, RK); if (f) th += KL(f, VK) / R; PRAW.push([OP[f][0] + R * Math.sin(th), OP[f][1] + R * Math.cos(th)]); } }
const PP = []; for (let f = 0; f <= TOTAL; f++) { let sx = 0, sz = 0; for (let k = -6; k <= 6; k++) { const g = clamp(f + k, 0, TOTAL); sx += PRAW[g][0]; sz += PRAW[g][1]; } PP.push([sx / 13, sz / 13]); }
const DP = []; {
  let ph = 0, pyaw = 0;
  for (let f = 0; f <= TOTAL; f++) {
    const a = PP[clamp(f - 3, 0, TOTAL)], b = PP[clamp(f + 3, 0, TOTAL)], vx = b[0] - a[0], vz = b[1] - a[1], v6 = Math.hypot(vx, vz) / 6;
    const o = OP[f], th = Math.atan2(PP[f][0] - o[0], PP[f][1] - o[1]), R = Math.hypot(PP[f][0] - o[0], PP[f][1] - o[1]);
    const base = Math.atan2(Math.cos(th), -Math.sin(th)), yaw = angLerp(base, Math.atan2(vx, vz), sm(ramp(v6, 0.004, 0.009)) * (f < 712 ? 0.45 : 1));   // on the curve the body stays mostly tangent (sideways across the frame)
    const p0 = DP.length ? DP[f - 1] : null, d = p0 ? Math.hypot(PP[f][0] - p0.x, PP[f][1] - p0.z) + 0.12 * Math.abs(angLerp(p0.yaw, yaw, 1) - p0.yaw) : 0;
    ph += d / 0.42; pyaw = yaw;
    DP.push({ x: PP[f][0], z: PP[f][1], yaw, hx: Math.sin(yaw), hz: Math.cos(yaw), th, R, ph, sp: d * 30 });
  }
}
const DPf = (f) => DP[clamp(Math.round(f), 0, TOTAL)];
// leash tension: tight while the puppy stiffens and stares at the other dog (head turned away from the hand), slack again as it is led away
const tension = (f) => KF(f, [[0, 0], [w.if + 8, 0], [w.if + 24, 1], [w.add + 2, 1], [w.add + 14, 0.1], [w.add + 24, 0]]);
const handOf = (f) => { const d = DPf(f); return [d.x - d.hx * 1.05 - d.hz * SIDE, 0.75, d.z - d.hz * 1.05 + d.hx * SIDE]; };   // trailing behind the puppy, out of frame
export const PROPS = { cones: [], bush: [40, -40], toy: [40, -40] };
export const propsVis = () => ({ cones: false, bush: false, toy: false });

// ---------- cameras ----------
// track rig per shot: [dist, height, look y, look-toward-O share, forward angle (deg), fov]. The camera sits on the OUTWARD side of the puppy (O behind it), rotated a little toward its heading so the face shows.
const TC = {
  far: [2.85, 0.85, 0.3, 0.35, 16, 46], look: [2.75, 0.8, 0.3, 0.35, 16, 46], lookBack: [2.7, 0.8, 0.3, 0.35, 18, 46], closer: [2.9, 0.85, 0.3, 0.35, 18, 46], curve: [2.9, 0.85, 0.3, 0.35, 18, 46],
  closeIn: [2.6, 0.78, 0.3, 0.35, 24, 46], tooClose: [2.5, 0.74, 0.3, 0.35, 26, 46], addDist: [2.8, 0.85, 0.3, 0.35, 22, 46], endCalm: [2.8, 0.85, 0.3, 0.35, 18, 46],
};
const trackCam = (f, S) => {
  const [dd0, h, ly, kO, dl, fov] = TC[S.id], d = DPf(f), o = ODf(f), uo = norm([d.x - o.x, d.z - o.z]), t = [Math.cos(d.th), -Math.sin(d.th)], an = dl * D2R;
  const dd = dd0 - 0.0012 * (f - S.a), u = [uo[0] * Math.cos(an) + t[0] * Math.sin(an), uo[1] * Math.cos(an) + t[1] * Math.sin(an)], C = [d.x + u[0] * dd, h, d.z + u[1] * dd];
  const aL = angLerp(Math.atan2(d.x - C[0], d.z - C[2]), Math.atan2(o.x - C[0], o.z - C[2]), kO);   // aim between the two dogs so both stay in the narrow portrait frame
  return { pos: C, look: [C[0] + Math.sin(aL) * dd, ly, C[2] + Math.cos(aL) * dd], fov };
};
const frontCam = (f, key = 0) => { const d = DPf(f), r = [-d.hz, d.hx]; return { pos: [d.x + d.hx * (1.28 + key) + r[0] * 0.56, 0.88, d.z + d.hz * (1.28 + key) + r[1] * 0.56], look: [d.x + d.hx * 0.2, 0.22, d.z + d.hz * 0.2], fov: 42 }; };
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  setup: [{ f: w.grab, pos: [1.0, 0.52, 1.25], look: [0.1, 0.3, 0.0], fov: 38 }, { f: w.treats - 7, pos: [0.93, 0.52, 1.18], look: [0.1, 0.3, 0.0], fov: 38 }],
  yes: [{ f: w.say, pos: [0.3, 0.82, 2.3], look: [0.34, 0.5, -0.35], fov: 43 }, { f: w.then2 - 1, pos: [0.32, 0.78, 2.15], look: [0.35, 0.52, -0.35], fov: 43 }],
};
const FRONT = ['treat', 'rewardLook', 'rewardBack', 'refuse', 'povFinal'];
export const camAt = (f) => {
  const S = shotAt(f); let c;
  if (CAMS[S.id]) c = camFromKeys(CAMS[S.id], f, {});
  else if (FRONT.includes(S.id)) c = camFromKeys([{ f: S.a, ...frontCam(f) }, { f: S.b, ...frontCam(f, -0.1) }], f, {});
  else c = trackCam(f, S);
  if (!CAMS[S.id]) { c.pos = add(c.pos, [0.005 * Math.sin(f * 0.11), 0.004 * Math.sin(f * 0.07 + 1), 0.005 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 0.5 * Math.sin(f * 0.05); }
  const d = DPf(f), o = ODf(f); c.shadowAt = TC[S.id] ? [(d.x + o.x) / 2, 0.1, (d.z + o.z) / 2] : [c.look[0], 0.1, c.look[2]];
  return c;
};
const camBasis = (f) => { const C = camAt(f), fw = norm(sub(C.look, C.pos)), rt = norm(cross(fw, [0, 1, 0])), up = cross(rt, fw); return { C, fw, rt, up }; };
const handPt = (f, a, b, c) => { const { C, fw, rt, up } = camBasis(f); return add(C.pos, add(mul(fw, a), add(mul(rt, b), mul(up, c)))); };

// ---------- the dogs ----------
const OL = (f) => { const d = DPf(f), o = ODf(f), u = norm([o.x - d.x, o.z - d.z]), v = norm([d.hx * 0.4 + u[0] * 0.6, d.hz * 0.4 + u[1] * 0.6]); return [d.x + v[0] * 2, -0.12, d.z + v[1] * 2]; };   // a point toward the other dog (about 55 deg off the heading: the rig's neck turns cleanly that far)   // where the puppy looks to see the other dog
export const dog2At = (f) => {
  const S = shotAt(f); if (f < w.treats || S.id === 'yes' || S.id === 'povFinal') return null;
  const o = ODf(f), k = clamp(o.sp / 0.5), walking = o.sp > 0.05;
  const fwd = [Math.sin(o.yaw), Math.cos(o.yaw)], sniff = 0.5 + 0.5 * Math.sin(f * 0.025);
  const toP = [DPf(f).x, 0.3, DPf(f).z], glance = sm(ramp(Math.sin(f * 0.012 + 1), 0.6, 0.95)) * (f > w.when + 30 ? 1 : 0);   // now and then it glances calmly at our puppy
  return { pos: [o.x, 0, o.z], yaw: o.yaw, w: { stand: 1 }, blink: blinkAt(f, 5) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.17), wag: 0.5 * Math.sin(f * 0.21), tail: 0.2 + 0.1 * Math.sin(f * 0.05), neck: 0.55,
    ears: 0.2 * Math.max(0, Math.sin(f * 0.07 + 2)), look: lerp3([o.x + fwd[0] * 1.6, 0.08 + 0.12 * (1 - sniff), o.z + fwd[1] * 1.6], toP, 0.45 * glance),
    gait: walking ? { phase: o.ph, amp: 24, lift: 1.1, k: k } : undefined };
};
export const dog3At = (f) => {
  const S = shotAt(f), d = DPf(f), o = ODf(f);
  const base = { pos: [d.x, 0, d.z], yaw: d.yaw, w: { stand: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.7, ears: 0.2 * Math.max(0, Math.sin(f * 0.09)) };
  const W = worldAt(f), happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const gk = clamp(d.sp / 0.5), gait = gk > 0.02 ? { phase: d.ph, amp: 24 + 8 * clamp((d.sp - 0.8) / 0.7), lift: 1.1, k: gk } : undefined;
  const ahead = [d.x + d.hx * 2.2, -0.1, d.z + d.hz * 2.2], camP = camAt(f).pos, toCam = [camP[0], 0.1, camP[2]], ol = OL(f);
  const calm = { wag: 0.5 * Math.sin(f * 0.3), tail: 0.2 + 0.2 * Math.max(0, Math.sin(f * 0.14)) };
  const stiffAt = (a, b) => sm(ramp(f, a, b));
  switch (S.id) {
    case 'hook': { const gl = sm(ramp(f, w.people - 6, w.people + 6)) * (1 - sm(ramp(f, w.people + 26, w.people + 38)));   // a person passes off-screen: glances to the front right, then back to the trainer
      return { ...base, pos: HOOKD, yaw: DOGYAW, w: { sit: 1 }, look: lerp3([TRN[0] - 0.05, 0.75, TRN[2]], [0.3, 0.0, 2.2], gl), neck: 1, wag: 0.8 * Math.sin(f * 0.5) * (1 - 0.7 * gl), tail: 0.2, ears: -0.2 + 0.5 * gl }; }
    case 'setup': return { ...base, pos: [0, 0, 0], yaw: DOGYAW, w: { stand: 1 }, look: [0.9, -0.15, 0.9], neck: 0.6, wag: 0.6 * Math.sin(f * 0.45), tail: 0.2, ears: -0.2, headTilt: 7 * Math.sin(Math.PI * ramp(f, w.grab + 6, w.treats - 7)) };
    case 'treat': return { ...base, look: W.treat || ahead, neck: 1, ...happy, wag: 0.7 * Math.sin(f * 0.5), tail: 0.3, ears: -0.3 };
    case 'far': return { ...base, gait, look: ahead, neck: 1, ...calm };
    case 'look': { const gl = sm(ramp(f, w.looks - 4, w.looks + 14)); return { ...base, gait, look: lerp3(ahead, ol, gl), neck: 1, ...calm, headTilt: 5 * gl * Math.sin(f * 0.05) }; }
    case 'rewardLook': case 'rewardBack': {
      const t0 = S.id === 'rewardLook' ? w.reward1 + 3 : w.you - 2, ch = chompAt(f, t0), after = f >= t0 + 14;
      const gl = 1 - sm(ramp(f, t0 - 10, t0 - 3));   // still looking at the other dog, then turns to the hand
      const look = S.id === 'rewardLook' ? lerp3(W.treat || ahead, ol, gl) : (W.treat || ahead);
      return { ...base, look, neck: 1, jaw: ch || (after ? 0.25 : 0), ...(f > t0 ? happy : {}), blink: f > t0 && f < t0 + 6 ? 1 : base.blink, gait };
    }
    case 'lookBack': { const lb = sm(ramp(f, w.lookB - 12, w.lookB)); return { ...base, gait, look: lerp3(ol, toCam, lb), neck: 0.6 + 0.3 * lb, ...calm, ears: 0.1 }; }
    case 'closer': return { ...base, gait, look: lerp3(ahead, ol, 0.35 + 0.35 * Math.sin(f * 0.045)), neck: 1, ...calm };
    case 'curve': return { ...base, gait, look: lerp3(ahead, ol, 0.25 + 0.25 * Math.sin(f * 0.05)), neck: 1, ...calm };
    case 'closeIn': case 'tooClose': case 'refuse': {
      const st = S.id === 'closeIn' ? stiffAt(w.if + 8, w.if + 24) : 1, trem = 0.12 * Math.sin(f * 1.3) * st;
      return { ...base, gait, look: lerp3(lerp3(ahead, ol, 0.45), ol, st), neck: 0.55 + 0.3 * st, wag: 0.4 * Math.sin(f * 0.25) * (1 - st) + trem, tail: 0.1 + 0.8 * st, ears: -0.55 * st, blink: st > 0.5 ? 0 : base.blink, breath: 0.35 + 0.35 * Math.sin(f * 0.45) * st };
    }
    case 'addDist': { const st = 1 - stiffAt(w.add, w.add + 22); return { ...base, gait, look: lerp3(ahead, ol, st), neck: 1, ...calm, tail: 0.15 + 0.7 * st, ears: -0.5 * st, wag: calm.wag * (1 - st) + 0.15 * Math.sin(f * 1.3) * st }; }
    case 'endCalm': { const s = sm(ramp(f, 934, 958)); return { ...base, gait, look: lerp3(ahead, ol, 0.3 + 0.2 * Math.sin(f * 0.04)), neck: 1, ...calm, wag: calm.wag * (1 - s) + 0.9 * Math.sin(f * 0.5) * s }; }
    case 'yes': return { ...base, pos: HOOKD, yaw: DOGYAW, w: { sit: 1 }, look: [TRN[0] - 0.05, 0.75, TRN[2]], neck: 0.9, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    case 'povFinal': {
      const t0 = w.reward3 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, look: W.treatHide || !W.treat ? add(noseAt(d.x, d.z, d.yaw), [0.5 * d.hx, -0.4, 0.5 * d.hz]) : add(W.treat, [0, -0.1, 0]), neck: 0.9, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- hands, treat, leash, trail, distance line ----------
const treatPath = (f) => {
  const S = shotAt(f), d = DPf(f);
  const mouth = (pose = 'stand') => add(noseAt(d.x, d.z, d.yaw, pose), [0.05 * d.hx, -0.035, 0.05 * d.hz]);
  const rest = (g) => handPt(g, 0.55, 0.07, -0.85);   // straight below the frame, on the arm's own axis: hand and sleeve enter and leave together
  const feed = (t0, a, b) => KF(f, [[a, rest(f)], [t0 - 3, mouth()], [t0 + 12, mouth()], [t0 + 16, rest(f)]]);   // drops straight down fast: arm and fist leave together
  switch (S.id) {
    case 'treat': { const lure = add(mouth(), [0.1 * d.hx, 0.03 + 0.012 * Math.sin(f * 0.3), 0.1 * d.hz]); return KF(f, [[S.a, rest(f)], [S.a + 12, lure], [S.b, lure]]); }
    case 'rewardLook': { const t0 = w.reward1 + 3; return feed(t0, S.a, t0 + 28); }
    case 'rewardBack': { const t0 = w.you - 2; return feed(t0, S.a, t0 + 26); }
    case 'refuse': { const near = add(mouth(), [0.1 * d.hx, 0.0, 0.1 * d.hz]); return KF(f, [[S.a, rest(f)], [S.a + 12, near], [S.b - 14, near], [S.b - 9, rest(f)]]); }   // held at the muzzle, ignored
    case 'povFinal': { const t0 = w.reward3 + 2; return KF(f, [[w.then2, rest(f)], [t0 - 3, mouth()], [t0, mouth()]]); }
  }
  return null;
};
const frontShot = (f) => FRONT.includes(shotAt(f).id);
const winF = (f, a, b) => (f >= a && f < b ? sm(ramp(f, a, a + 6)) * (1 - sm(ramp(f, b - 6, b))) : 0);
const greenAt = (f) => (f >= w.add + 4 && f < w.say ? sm(ramp(f, w.add + 4, w.add + 10)) : 0);   // one smooth fade to green after the fix, held until the cut
const redAt = (f) => Math.max(sm(ramp(tension(f), 0.5, 0.92)), winF(f, w.never - 4, w.if - 2));
const colAt = (f) => {
  const green = greenAt(f), red = sm(ramp(tension(f), 0.5, 0.92));
  const base = [0.24, 0.43, 0.71], g = [0.25, 0.75, 0.42], r = [0.88, 0.25, 0.22];
  const c = lerp3(lerp3(base, g, green * (1 - red)), r, red);
  return '#' + c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
};
const lineCol = (f) => { const c = lerp3(lerp3([1, 1, 1], [0.25, 0.75, 0.42], greenAt(f)), [0.89, 0.27, 0.24], redAt(f)); return '#' + c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join(''); };
const TRACK = ['far', 'look', 'lookBack', 'closer', 'curve', 'closeIn', 'tooClose', 'addDist', 'endCalm'];
const distLine = (f) => {   // dotted line on the lawn from the puppy to the other dog
  const d = DPf(f), o = ODf(f), L = Math.hypot(o.x - d.x, o.z - d.z), n = Math.floor(L / 0.2), pts = [];
  for (let i = 0; i <= n; i++) { const s = i * 0.2; if (s > 0.55 && L - s > 0.55) pts.push([d.x + (o.x - d.x) * s / L, 0.02, d.z + (o.z - d.z) * s / L]); }
  return pts;
};
const arcDots = (f) => {   // the planned curve ahead of the puppy
  const d = DPf(f), out = []; let last = [d.x, d.z];
  for (let g = f + 4; g <= Math.min(TOTAL - 1, f + 130); g += 2) { const p = DPf(g); if (Math.hypot(p.x - last[0], p.z - last[1]) >= 0.24) { last = [p.x, p.z]; if (Math.hypot(p.x - d.x, p.z - d.z) > 0.5) out.push([p.x, 0.02, p.z]); } }
  return out;
};
export const worldAt = (f) => {
  const S = shotAt(f), W = {}, d = DPf(f);
  CUR = camAt(f).pos;
  const t = treatPath(f); if (t) W.treat = t;
  const slack = 0.95 * (1 - tension(f)) + 0.02;
  if (S.id === 'hook' || S.id === 'yes') W.leash = { hand: trainerHandWorld(f), slack: 0.4, col: colAt(f) };
  else if (S.id === 'setup') W.leash = { hand: [-0.55, 0.95, 0.65], slack: 0.95, col: colAt(f) };
  else if (frontShot(f)) { W.leash = { hand: [d.x - d.hx * 0.2 - d.hz * 0.9, 0.75, d.z - d.hz * 0.2 + d.hx * 0.9], slack, col: colAt(f) }; if (t) W.hand = { treat: t, pose: 'pinch', side: 0.07 }; }
  else if (TRACK.includes(S.id)) W.leash = { hand: handPt(f, 2.5, -1.4, -0.15), slack, col: colAt(f) };   // the (off-screen) trainer's hand sits just past the left frame edge at hip height: the leash always runs to the edge, never spikes
  else W.leash = { hand: handOf(f), slack, col: colAt(f) };
  if (TRACK.includes(S.id)) { W.dline = { pts: distLine(f), col: lineCol(f) }; if (S.id === 'curve' || S.id === 'addDist') { W.trail = arcDots(f); W.trailCol = '#ffffff'; } }
  const hide = (S.id === 'rewardLook' && f >= w.reward1 + 13) || (S.id === 'rewardBack' && f >= w.you + 12) || (S.id === 'povFinal' && f >= w.reward3 + 4);
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
  if (S.id === 'setup') return { focus: Math.hypot(C.pos[0] - 0.5, C.pos[1] - 0.3, C.pos[2]), cinf: 6 };
  return { focus: Math.hypot(C.pos[0] - d.x, C.pos[1] - 0.25, C.pos[2] - d.z), cinf: TRACK.includes(S.id) ? 2 : 4 };
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
// distance badge: rounded pill with a two-way arrow and the distance in metres
const fxDist = (p, text, col) => {
  const g = p.g; g.save();
  const x = 60, y = 410, W = 480, H = 180, r = 90;
  g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + W - r, y); g.quadraticCurveTo(x + W, y, x + W, y + r); g.quadraticCurveTo(x + W, y + H, x + W - r, y + H); g.lineTo(x + r, y + H); g.quadraticCurveTo(x, y + H, x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  g.lineJoin = 'round'; g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = '#1f1714'; g.lineWidth = 14; g.stroke();
  g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 12; g.lineCap = 'round';
  g.beginPath(); g.moveTo(112, 500); g.lineTo(172, 500); g.stroke();   // arrow shaft (left part)
  g.beginPath(); g.moveTo(128, 472); g.lineTo(104, 500); g.lineTo(128, 528); g.stroke(); g.beginPath(); g.moveTo(156, 472); g.lineTo(180, 500); g.lineTo(156, 528); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1f1714'; g.font = '800 104px Arial, Helvetica, sans-serif'; g.fillText(text, 380, 506);
  g.restore();
};
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f), d = DPf(f), o = ODf(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = add(noseAt(d.x, d.z, d.yaw, 'stand'), [0, 0.12, 0]);
  const above = [d.x, 0.56, d.z];
  if (S.id === 'hook') badge(T.fxCheck, 'ok', w.stay + 4, w.stay + 40, [0.0, 0.82, -0.42], 0.22);
  if (S.id === 'far') badge(T.fxCheck, 'ok', w.eat, w.when - 2, above, 0.22);
  if (S.id === 'look') badge(T.fxCheck, 'ok', w.calmly + 4, w.reward1 - 12, above, 0.22);
  if (S.id === 'rewardLook') hearts(w.reward1 + 4, HEAD);
  if (S.id === 'rewardBack') hearts(w.you - 1, HEAD);
  if (S.id === 'addDist') badge(T.fxCheck, 'ok', w.away, w.end - 2, above, 0.22);
  if (S.id === 'endCalm') badge(T.fxCheck, 'ok', w.calm, w.say - 2, above, 0.22);
  // distance badge on the lawn above the dotted line; its on-screen size shrinks as the dogs get closer
  if (TRACK.includes(S.id)) {
    const mid = [(d.x + o.x) / 2, 0.5, (d.z + o.z) / 2], cd = Math.hypot(CUR[0] - mid[0], CUR[1] - mid[1], CUR[2] - mid[2]), u = clamp((d.R - 2.4) / 3.6), never = f >= w.never - 4 && f < w.if - 2;
    const sc = q(0.15 * cd * (0.7 + 0.3 * u), 2), txt = Math.round(d.R) + ' m', col = redAt(f) > 0.5 ? '#e2463c' : greenAt(f) > 0.5 ? '#2c9a52' : '#2a6fb0';
    if (!never && f >= w.start + 4) { const k = q(M.back(ramp(f, w.start + 4, w.start + 13)), 2); if (k > 0.02) out.push(FX('ds' + txt + col + k, (p) => fxDist(p, txt, col), mid, sc * k, { order: 6 })); }
    if (never) badge(T.fxCross, 'no', w.never - 4, w.if - 2, add(mid, [0, 0.05, 0]), q(0.07 * cd, 2));
    if (S.id === 'tooClose') badge(T.fxCross, 'no', w.you2 + 2, w.add - 2, above, 0.24);
  }
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), add(dP([185, 640]), [0, 0.1, 0.12]), 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward3 + 3, HEAD, 4, 0.06);
    if (f >= w.reward3) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward3 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(noseAt(d.x, d.z, d.yaw), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
