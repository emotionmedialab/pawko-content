// "Footsies" (#56) — puppy puts its front paws on the trainer's shoes (3D trainer legs, legs3d.js) and walks along. 3D puppy + 2D kneeling trainer (hook + yes). 1140 frames, voice.mp3.
// Word frames (voice.mp3, round(s*30); sentence starts from silence_end): Let's 0 teach 9 dog 19 footsies 28 | This 77 small 102 medium 120 | Wear 168 closed 170 toe 179 shoes 193 |
// Hold 233 treat 239 low 245 near 257 feet 278 | When 312 dog 316 steps 323 onto 330 shoes 345 reward 368 | Next 408 reward 414 both 455 front 464 paws 475 stay 488 feet 508 |
// Then 538 take 542 tiny 563 step 575 and 589 reward 607 staying 631 on 647 | Say 680 footsies 686 step 724 up 730 | If 761 hops 772 off 780 your 806 step 808 big 826 |
// Shuffle 858 little 885 build 891 small 908 step 921 time 957 | Soon 989 walking 1017 together 1025 | Say 1061 yes 1066 click 1089 then 1114 reward 1116 | end 1139.
// Every shot/action is keyed to `w`. Pointers: PAW cursor in the floating legs shots, HAND in the POV final. Hard cuts only. Legs shots: trainer legs at the origin facing +x, puppy in front of the shoes facing -x.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
import { legsTimeline } from './legs3d.js';
import { POSES } from './dogrig.js';
export const FPS = 30, TOTAL = 1140, DECK = 0;
const w = {
  foot: 28, small: 102, wear: 168, closed: 170, hold: 233, low: 245, feet1: 278, when: 312, steps: 323, shoes2: 345, reward1: 368, next: 408, reward2: 414, both: 455, stay: 488, feet2: 508,
  then1: 538, step: 575, reward3: 607, say1: 680, footsies: 686, stepup: 724, if: 761, hops: 772, big: 826, shuffle: 858, build: 891, smallstep: 908, step3: 921, soon: 989, together: 1025,
  say2: 1061, yes: 1066, click: 1089, then2: 1114, reward4: 1116,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: 76, light: 'day' },
  { id: 'small', a: 77, b: 167, light: 'day' },         // small/medium dog beside the legs
  { id: 'shoes', a: 168, b: 232, light: 'day' },        // closed-toe shoes close up, check
  { id: 'treat', a: 233, b: 311, light: 'day' },        // treat held low near the feet (paw cursor)
  { id: 'up1', a: 312, b: 406, light: 'day' },          // steps onto the shoes, reward
  { id: 'both', a: 407, b: 539, light: 'day' },         // one paw on: no reward; both paws stay: reward
  { id: 'tiny', a: 540, b: 606, light: 'day' },         // one tiny step
  { id: 'tiny2', a: 607, b: 679, light: 'day' },        // reward for staying on
  { id: 'cue', a: 680, b: 760, light: 'day' },          // "footsies" as it steps up
  { id: 'hop', a: 761, b: 857, light: 'day' },          // MISTAKE: step too big, hops off, cross
  { id: 'shuffle', a: 858, b: 988, light: 'day' },      // small shuffles, one at a time, check
  { id: 'walk', a: 989, b: 1059, light: 'day' },        // walking together
  { id: 'yes', a: 1060, b: 1113, light: 'golden' },
  { id: 'final', a: 1114, b: TOTAL - 1, light: 'golden' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const sm = M.smooth;
const KF = (f, keys, ease = sm) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) { const [fa, va] = keys[i], [fb, vb] = keys[i + 1]; if (f <= fb) { const t = ease((f - fa) / (fb - fa)); return Array.isArray(va) ? va.map((v, k) => lerp(v, vb[k], t)) : lerp(va, vb, t); } }
  return keys[keys.length - 1][1];
};
const add = (a, b) => a.map((v, i) => v + b[i]);
const chompAt = (f, t0, n = 14) => (f >= t0 && f < t0 + n ? Math.abs(Math.sin((f - t0) * 0.75)) : 0);

export const LIGHTS = {
  day: { az: 135, el: 50, sky: '#c4d6f2', ground: '#8a8262', hemi: 1.2, sun: '#fff1dc', sunI: 2.4, fog: '#cadcf0', fogNear: 60, fogFar: 700,
    skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.08, vig: 0.2, shadowExt: 3 },
  golden: { az: 120, el: 30, sky: '#ffe8cc', ground: '#8a7a62', hemi: 1.2, sun: '#ffe2bc', sunI: 2.4, fog: '#f4d6b0', fogNear: 60, fogFar: 650,
    skyTop: '#6f8fd8', skyHor: '#ffd2a0', sat: 1.04, vig: 0.24, shadowExt: 3, gain: '#fffaf2' },
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });

// ---------- staging ----------
const MAT = 0.064, K = 0.00225, ST = 1.08;
const DOGPOS = [0, MAT, 0], DOGYAW = Math.PI / 2;
const TRN = [0.52, MAT, -0.66];
const HOOKP = [0, MAT, -0.48];
const SH = (P) => [P[0], P[1], P[2] + HOOKP[2]];
let CUR = [0, 1, 3], TCUR = TRN;
const axisOf = (pos) => { const ry = Math.atan2(CUR[0] - pos[0], CUR[2] - pos[2]); return [Math.cos(ry), 0, -Math.sin(ry)]; };
const tD = (P) => {
  const C = CUR, TR0 = TCUR, ax = axisOf(TR0), n = [-ax[2], 0, ax[0]];
  const d = [P[0] - C[0], P[1] - C[1], P[2] - C[2]], den = d[0] * n[0] + d[2] * n[2] || 1e-6;
  const s = ((TR0[0] - C[0]) * n[0] + (TR0[2] - C[2]) * n[2]) / den, Q = [C[0] + d[0] * s, C[1] + d[1] * s, C[2] + d[2] * s];
  return [300 - ((Q[0] - TR0[0]) * ax[0] + (Q[2] - TR0[2]) * ax[2]) / (K * ST), 975 - (Q[1] - TR0[1]) / (K * ST)];
};

// ---------- trainer legs: one plan for the whole legs section, away from the camera in the other shots ----------
const NOLEGS = ['hook', 'yes', 'final'];
const FP = legsTimeline({ at: [0, 0], yaw: Math.PI / 2, y: MAT, stance: 0.065, steps: [
  { foot: 'R', a: 182, b: 196, fwd: 0, lift: 0.04 }, { foot: 'L', a: 204, b: 218, fwd: 0, lift: 0.04 },   // toe taps while the shoes are shown
  { foot: 'R', a: 548, b: 568, fwd: 0.08, lift: 0.04 }, { foot: 'L', a: 572, b: 592, fwd: 0.08, lift: 0.04 },        // one tiny step
  { foot: 'R', a: 786, b: 808, fwd: 0.26, lift: 0.09 }, { foot: 'L', a: 814, b: 834, fwd: 0.26, lift: 0.05 },        // too big: the puppy hops off
  { foot: 'R', a: 905, b: 921, fwd: 0.06, lift: 0.035 }, { foot: 'L', a: 925, b: 941, fwd: 0.06, lift: 0.035 }, { foot: 'R', a: 950, b: 966, fwd: 0.06, lift: 0.035 },   // small shuffles
  { foot: 'L', a: 995, b: 1011, fwd: 0.09, lift: 0.04 }, { foot: 'R', a: 1015, b: 1031, fwd: 0.09, lift: 0.04 }, { foot: 'L', a: 1035, b: 1051, fwd: 0.09, lift: 0.04 },   // walking together
] });
const AWAY = legsTimeline({ at: [60, 60], yaw: 0, y: MAT, stance: 'natural' });
export const legsAt = (f) => (NOLEGS.includes(shotAt(f).id) ? AWAY(f) : FP(f));
const adv = (f) => { const p = FP(f); return (p.L.x + p.R.x) / 2; };

// ---------- reference points + paw IK (calibrate() runs once the GLB is loaded) ----------
const REF = { grid: [] };
const P0 = 6;
POSES.paws = { drop: 0, dropF: 0, pitch: P0, L: { flS: [-12, 0, 0], flE: [0, 0, 0], flW: [0, 0, 0] } };
const GS = [-56, 32, 4], GE = [-48, 48, 8];
export const calibrate = (poseFn, root) => {
  root.position.set(0, 0, 0); root.rotation.set(0, Math.PI / 2, 0); root.updateMatrixWorld(true);
  for (let s = GS[0]; s <= GS[1]; s += GS[2]) { const row = []; for (let e = GE[0]; e <= GE[1]; e += GE[2]) { const r = poseFn({ w: { paws: 1 }, P: { paws: { ...POSES.paws, L: { ...POSES.paws.L, flS: [s, 0, 0], flE: [e, 0, 0] } } }, look: null }).paw[0]; row.push([r[0], r[1]]); } REF.grid.push(row); }
  REF.x0 = pawAt(-12, 0)[0];
  root.position.set(...DOGPOS); root.rotation.set(0, DOGYAW, 0); root.updateMatrixWorld(true);
  REF.sit = poseFn({ w: { sit: 1 }, look: [3, 0.3, 0] });
  root.position.set(...DOGPOS);
};
const pawAt = (s, e) => {
  const gi = clamp((s - GS[0]) / GS[2], 0, REF.grid.length - 1.001), gj = clamp((e - GE[0]) / GE[2], 0, REF.grid[0].length - 1.001), i = Math.floor(gi), j = Math.floor(gj), u = gi - i, v = gj - j, G = REF.grid;
  return [0, 1].map((k) => (G[i][j][k] * (1 - v) + G[i][j + 1][k] * v) * (1 - u) + (G[i + 1][j][k] * (1 - v) + G[i + 1][j + 1][k] * v) * u);
};
const pawIK = (x, y) => {   // nearest grid vertex, then a local search on the bilinear lookup (never diverges; an unreachable target gives the closest paw)
  let s = -12, e = 0, best = 9;
  REF.grid.forEach((row, i) => row.forEach((p, j) => { const dd = Math.hypot(p[0] - x, p[1] - y); if (dd < best) { best = dd; s = GS[0] + i * GS[2]; e = GE[0] + j * GE[2]; } }));
  const err = (a, c) => { const p = pawAt(a, c); return Math.hypot(p[0] - x, p[1] - y); };
  for (const st of [4, 2, 1, 0.5]) for (let it = 0; it < 3; it++) { let bs = s, be = e, bd = err(s, e); for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const a = clamp(s + i * st, GS[0], GS[1]), c = clamp(e + j * st, GE[0], GE[1]), d = err(a, c); if (d < bd) { bd = d; bs = a; be = c; } } if (bs === s && be === e) break; s = bs; e = be; }
  const p = pawAt(s, e); return { s, e, err: Math.hypot(p[0] - x, p[1] - y) };
};
const shoeTop = (k, p) => {
  const f = p[k], z = 0.17, pitch = f.pitch || 0;
  return [f.x + Math.sin(f.yaw) * z * Math.cos(pitch), MAT + 0.085 + (f.lift || 0) + z * Math.sin(pitch) - 0.02, f.z + Math.cos(f.yaw) * z * Math.cos(pitch)];
};
const BACK = 0.06, TURN = 0.55, PAWR = 0.02, OFF = 0.12;
// paw-on-shoe amount per puppy paw (0 = on the mat in front of the shoes, 1 = on the toe cap). Puppy-left paw rides the trainer's R shoe.
const UL = [[0, 0], [326, 0], [346, 1], [668, 1], [682, 0], [712, 0], [728, 1], [790, 1], [804, 0], [862, 0], [880, 1]];
const UR = [[0, 0], [330, 0], [350, 1], [396, 1], [410, 0], [455, 0], [470, 1], [668, 1], [682, 0], [716, 0], [732, 1], [792, 1], [806, 0], [866, 0], [884, 1]];
const fd = (f) => {   // the puppy in the legs shots
  const p = FP(f), tL = shoeTop('L', p), tR = shoeTop('R', p), yaw = p.yaw + Math.PI + TURN, fx = Math.sin(yaw), fz = Math.cos(yaw);
  const cx = (tL[0] + tR[0]) / 2, cz = (tL[2] + tR[2]) / 2, uL = KF(f, UL), uR = KF(f, UR), ua = (uL + uR) / 2, b = OFF * (1 - Math.max(uL, uR));
  const hop = 0.05 * Math.sin(Math.PI * ramp(f, 790, 806));
  const e = 0.6 * (1 - sm(ramp(f, 80, 128))) + 0.22 * sm(ramp(f, 784, 802)) * (1 - sm(ramp(f, 858, 884)));   // the puppy trots in at the start of the legs section
  const es = 0.6 * Math.max(p.L.lift, p.R.lift);   // the puppy leans back a little while a shoe swings, so the head keeps clear of the shin
  const pos = [cx - fx * (REF.x0 + BACK + b + e + es), MAT + hop, cz - fz * (REF.x0 + BACK + b + e + es)];
  const dP = 150 * Math.max(p.L.lift, p.R.lift);
  const ik = (t, u) => {   // target between the mat just in front of the puppy (reach 0.22 from the root) and the toe cap
    const xon = REF.x0 + BACK + b + es + (t[0] - cx) * fx + (t[2] - cz) * fz, y = lerp(MAT + 0.032, t[1], u) + 0.03 * 4 * u * (1 - u);
    return pawIK(lerp(0.22, xon, u) - 0.004 * dP, y + PAWR - MAT - 0.0062 * dP);
  };
  const mp = [(p.L.x + p.R.x) / 2, (p.L.z + p.R.z) / 2];
  return { pos, yaw, L: ik(tR, uL), R: ik(tL, uR), pitch: P0 + dP, dist: mp[0] * Math.sin(p.yaw) + mp[1] * Math.cos(p.yaw) + b + e, ua, fx, fz, cx, cz, tL, tR };
};
const nose = (f) => { const d = fd(f); return [d.pos[0] + Math.sin(d.yaw) * 0.25, d.pos[1] + 0.25 + 0.14 * d.ua, d.pos[2] + Math.cos(d.yaw) * 0.25]; };   // measured from the rig
const MOUTHW = (f) => add(nose(f), [-0.06, -0.22, 0.1]);
const SPOT = (f) => { const d = fd(f); return [d.cx - d.fx * 0.06, MAT + 0.1, d.cz - d.fz * 0.06 + 0.04]; };   // treat held low just above the toe caps

// ---------- the puppy ----------
const N_SIT = () => add(REF.sit.nose, [0.06, -0.005, 0]);
const MOUTH = () => add(REF.sit.nose, [0.05, -0.04, 0]);
const CHOMPS = [w.reward1, w.feet2, w.reward3];
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { sit: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85 };
  const W = worldAt(f), happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  if (S.id === 'hook') {
    const ch = chompAt(f, w.foot + 1);
    return { ...base, pos: HOOKP, look: W.treat || SH(add(N_SIT(), [0.1, 0, 0])), neck: 1, jaw: f >= w.foot + 15 ? 0.3 : ch, ...(f > w.foot - 3 ? happy : {}), ears: f > 12 && f < w.foot - 7 ? -0.4 : 0,
      blink: f > w.foot + 1 && f < w.foot + 7 ? 1 : base.blink };
  }
  if (S.id === 'yes') return { ...base, look: [TRN[0] + 0.05, 0.5, TRN[2]], neck: 0.6, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
  if (S.id === 'final') {
    const t0 = w.reward4 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
    return { ...base, look: W.treatHide || !W.treat ? [0.9, 0.3, 0.3] : W.treat, neck: 0.8, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
  }
  if (S.id === 'shoes') return { ...base, pos: [4, MAT, 1], look: [0, 0.2, 2], neck: 0.5 };
  // legs shots
  const d = fd(f), d0 = fd(f - 1), gk = f <= w.small ? 0 : clamp(Math.abs(d.dist - d0.dist) * 30 / 0.25), c = camAt(f).pos;
  const P = { paws: { drop: 0, dropF: 0, pitch: d.pitch, L: { flS: [d.L.s, 0, 0], flE: [d.L.e, 0, 0], flW: [0, 0, 0] }, R: { flS: [d.R.s, 0, 0], flE: [d.R.e, 0, 0] } } };
  const ch = Math.max(...CHOMPS.map((t) => chompAt(f, t)));
  const eaten = CHOMPS.some((t) => f > t && f < t + 8);
  const look = W.treat && !W.treatHide ? W.treat : [c[0], 0.02, c[2]];
  const bd = f >= w.if + 14 && f < w.shuffle - 30 ? 1 : 0;   // after the hop: a worried glance, ears back
  return { ...base, pos: d.pos, yaw: d.yaw, w: { paws: 1 }, P, gait: gk > 0.02 ? { phase: -d.dist / 0.3, amp: 18, lift: 1.0, k: gk, hindOnly: true } : undefined,
    look, neck: W.treat ? 0.9 : 0.95, aimEyes: true, jaw: ch, wag: Math.sin(f * 0.6) * (eaten || ch ? 1.1 : 0.9), tail: 0.3, ears: bd ? -0.4 : 0.1 * Math.sin(f * 0.1), blink: eaten ? 1 : base.blink };
};

// ---------- treat / pointers ----------
// reward: the POV hand brings the treat up from below the frame to the mouth (the arm runs to the frame edge), holds while it is eaten, then drops out again
const REW = (f, t) => {
  const home = (g) => add(MOUTHW(g), [0.5, -0.5, 0.8]);
  if (f < t - 14 || f > t + 28) return null;
  if (f < t - 3) return lerp3(home(f), MOUTHW(f), sm(ramp(f, t - 14, t - 3)));
  if (f < t + 12) return MOUTHW(f);
  return lerp3(MOUTHW(f), home(f), sm(ramp(f, t + 12, t + 28)));
};
const treatPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'hook': return SH(KF(f, [[0, add(N_SIT(), [0.06, 0.02, 0])], [8, N_SIT()], [w.foot - 4, add(MOUTH(), [0.02, 0.0, 0])], [w.foot + 1, MOUTH()]]));
    case 'treat': return KF(f, [[w.hold, add(SPOT(f), [0.5, 0.3, 0.2])], [w.low, SPOT(f)]]);
    case 'up1': return REW(f, w.reward1);
    case 'both': return REW(f, w.feet2);
    case 'tiny': case 'tiny2': return REW(f, w.reward3);
    case 'final': return KF(f, [[w.then2, add(MOUTH(), [0.3, 0.14, 0.05])], [w.reward4 + 2, MOUTH()]]);
  }
  return null;
};
const EAT = { up1: w.reward1, both: w.feet2, tiny: w.reward3, tiny2: w.reward3 };
export const worldAt = (f) => {
  const S = shotAt(f), W = {}, t = treatPath(f);
  if (t) W.treat = t;
  if (S.id === 'final' && t) W.hand = { treat: t, side: 0.22 };
  if ((S.id === 'hook' && f > w.foot + 5) || (S.id === 'final' && f >= w.reward4 + 4) || (EAT[S.id] && f >= EAT[S.id] + 2)) W.treatHide = true;
  if (EAT[S.id] === undefined && !['hook', 'final'].includes(S.id)) { /* no paw without a treat */ }
  if (t && S.id !== 'hook' && S.id !== 'final' && S.id !== 'treat') W.hand = { treat: t, side: 0.2 };
  if (t && S.id === 'treat') {
    const k = EAT[S.id] ? sm(ramp(f, EAT[S.id], EAT[S.id] + 14)) : 0;
    W.paw = { pos: W.treatHide ? add(t, [0.1 * k, 0.7 * k, 0]) : t, s: 0.95 };
    W.trailCol = '#ff8fb0';
  }
  return W;
};

// ---------- the 2D trainer (hook + yes) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5;
  return { kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 4,
    near: { to: [318, 690 - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present', lean: 6 };
};
const trainerAt = (f) => {
  const hi = idle(f, 3), W = worldAt(f);
  const o = { hose: true, kneel: 1, expr: f > 30 ? 'grin' : 'smile', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: f > 40 ? -0.2 : 0.8, headTilt: hi.headTilt, near: f > 50 ? 'thumb' : { to: [270, 806], hand: 'fist', bend: -1 } };
  if (W.treat) {
    const T = tD(W.treat), S = trainerShoulder(o, 'far'), ang = Math.atan2(T[1] - S[1], T[0] - S[0]);
    const kind = f > w.foot + 5 ? 'palm' : f >= w.foot - 5 ? 'give' : 'treat', off = kind === 'give' ? [19, -12] : [25, -3], s = 2.08 * 1.05, sy = Math.cos(ang) < 0 ? -1 : 1;
    const Wr = [T[0] - (Math.cos(ang) * off[0] * s - Math.sin(ang) * off[1] * sy * s), T[1] - (Math.sin(ang) * off[0] * s + Math.cos(ang) * off[1] * sy * s)];
    o.far = { to: Wr, hand: kind, bend: 1, rot: ang * 180 / Math.PI }; o.lean = 10;
  } else o.far = 'present';
  return o;
};

// ---------- cameras ----------
// legs shots: keys are given for the legs at rest; the camera then follows the trainer's advance
const LC = {
  small: [{ f: 77, pos: [0.30, 0.5, 2.4], look: [0.38, 0.80, 0], fov: 38 }, { f: 167, pos: [0.25, 0.5, 2.33], look: [0.38, 0.80, 0], fov: 38 }],
  shoes: [{ f: 168, pos: [0.85, 0.32, 1.35], look: [0.08, 0.50, 0], fov: 38 }, { f: 232, pos: [0.8, 0.32, 1.28], look: [0.08, 0.50, 0], fov: 38 }],
  treat: [{ f: 233, pos: [1.35, 0.5, 2.0], look: [0.3, 0.75, 0], fov: 38 }, { f: 311, pos: [1.29, 0.5, 1.94], look: [0.3, 0.75, 0], fov: 38 }],
  up1: [{ f: 312, pos: [1.3, 0.5, 1.95], look: [0.3, 0.75, 0], fov: 38 }, { f: 406, pos: [1.24, 0.5, 1.89], look: [0.3, 0.75, 0], fov: 38 }],
  both: [{ f: 407, pos: [1.7, 0.5, 1.5], look: [0.3, 0.72, 0], fov: 38 }, { f: 539, pos: [1.62, 0.5, 1.44], look: [0.3, 0.72, 0], fov: 38 }],
  tiny: [{ f: 540, pos: [0.30, 0.5, 2.4], look: [0.4, 0.80, 0], fov: 38 }, { f: 606, pos: [0.25, 0.5, 2.33], look: [0.4, 0.80, 0], fov: 38 }],
  tiny2: [{ f: 607, pos: [1.2, 0.5, 1.8], look: [0.3, 0.72, 0], fov: 38 }, { f: 679, pos: [1.14, 0.5, 1.74], look: [0.3, 0.72, 0], fov: 38 }],
  cue: [{ f: 680, pos: [0.20, 0.5, 2.4], look: [0.38, 0.80, 0], fov: 38 }, { f: 760, pos: [0.15, 0.5, 2.33], look: [0.38, 0.80, 0], fov: 38 }],
  hop: [{ f: 761, pos: [0.3, 0.5, 2.5], look: [0.3, 0.70, 0], fov: 38 }, { f: 857, pos: [0.25, 0.5, 2.43], look: [0.3, 0.70, 0], fov: 38 }],
  shuffle: [{ f: 858, pos: [1.18, 0.5, 2.1], look: [0.30, 0.70, 0], fov: 38 }, { f: 988, pos: [1.12, 0.5, 2.04], look: [0.30, 0.70, 0], fov: 38 }],
  walk: [{ f: 989, pos: [1.08, 0.5, 2.1], look: [0.30, 0.70, 0], fov: 38 }, { f: 1059, pos: [1.02, 0.5, 2.04], look: [0.30, 0.70, 0], fov: 38 }],
};
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: 76, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then2 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  final: [{ f: w.then2, pos: [1.34, 0.7, 0.72], look: [0.17, 0.3, 0], fov: 42 }, { f: TOTAL - 1, pos: [1.29, 0.68, 0.69], look: [0.18, 0.3, 0], fov: 42 }],
};
export const camAt = (f) => {
  const S = shotAt(f), L = LC[S.id], c = camFromKeys(L || CAMS[S.id], f, {});
  if (L) { c.pos = c.pos.map((v, i) => c.look[i] + (v - c.look[i]) * 1.18); c.look = add(c.look, [0.08, 0, 0]); c.pos = add(c.pos, [0.08, 0, 0]); const a = adv(f); c.pos = add(c.pos, [a, 0, 0]); c.look = add(c.look, [a, 0, 0]); c.shadowAt = [0.3 + a, 0.2, 0]; return c; }
  if (S.id === 'final') { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (S.id === 'hook' || S.id === 'yes') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.id === 'final') return { focus: dist(C.pos, REF.sit ? REF.sit.head : [0.3, 0.3, 0]), cinf: 6 };
  return { focus: dist(C.pos, [C.look[0], 0.2, 0]), cinf: 5 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  CUR = camAt(f).pos; TCUR = TRN;
  const S = shotAt(f), out = [];
  if (S.id === 'yes') { const tO = roundAll({ ...trainerYes(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 }); }
  if (S.id === 'hook') { const tO = roundAll({ ...trainerAt(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 }); }
  return out;
};
const BUB_YES = [-0.12, 0.78, -0.45];
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  const legsShot = !NOLEGS.includes(S.id);
  const head = legsShot ? add(nose(f), [-0.04, 0.1, 0.0]) : null;   // above the puppy's head, inside the frame
  const above = (dy = 0.3) => add(nose(f), [0, dy, 0.02]);
  if (S.id === 'hook') hearts(w.foot + 1, [0.38, 0.36, -0.42], 3, 0.07);
  if (S.id === 'shoes') badge(T.fxCheck, 'ok', w.closed + 2, w.hold - 4, [0.3, 0.45, 0.1], 0.16);
  if (S.id === 'up1') hearts(w.reward1 + 1, head);
  if (S.id === 'both') { hearts(w.feet2 + 1, head); badge(T.fxCheck, 'ok', w.stay, w.feet2 - 4, above(0.34), 0.15); }
  if (S.id === 'tiny2') hearts(w.reward3 + 1, head);
  if (S.id === 'cue') bubble('bd', 'Footsies!', '', '#ffffff', w.footsies - 2, w.if - 4, add(nose(f), [0.3, 0.42, 0.3]), 0.3);
  if (S.id === 'hop') badge(T.fxCross, 'no', w.hops + 36, w.shuffle - 4, above(0.4), 0.2);
  if (S.id === 'shuffle') badge(T.fxCheck, 'ok', w.smallstep + 4, w.soon - 30, above(0.34), 0.15);
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'final') {
    const HEAD = add(REF.sit.nose, [-0.08, 0.06, 0]);
    hearts(w.reward4 + 3, HEAD, 4, 0.06);
    if (f >= w.reward4) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward4 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(REF.sit.nose, [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
