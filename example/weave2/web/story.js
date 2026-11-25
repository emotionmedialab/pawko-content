// "Weave" (rebuild 2, cloned from the approved peekaboo project) — teach the dog to weave through the trainer's legs. 3D puppy + 3D trainer legs (legs3d.js) + the 2D kneeling trainer (hook, yes). 1049 frames, timed to voice.mp3 (approved narrator).
// Word frames (round(s*30); sentence starts from silencedetect, copied from example/weave): Let's 0 teach 8 dog 17 weave 28 legs 46 | Grab 83 treats 88 space 104 walk 118 | Stand 153 feet 169 wide 175 apart 182 |
// Hold 217 treat 223 behind 229 leg 246 guide 265 dog 277 through 284 gap 295 | Reward 326 other 344 side 348 | Next 389 step 404 forward 414 foot 437 pass 453 under 459 | Reward 495 each 499 pass 511 |
// Now 551 switch 553 hands 562 lure 584 walk 644 | Say 679 weave 684 go 711 | If 745 hesitates 757 bumps 779 legs 792 steps 815 big 834 | Take 866 small 868 slow 878 bigger 938 dogs 944 | Say 979 yes 985 click 1002 reward 1024 | end 1048.
// RE-TIME: update TOTAL and the word table `w`; shots and actions are keyed to `w`. Hard cuts only, no flashes, one sun (day; golden for yes/final).
// Staging (NOT a whole figure-8): short cuts, each framed like peekaboo. a) puppy goes behind -> front through the gap; b) curls round the screen-LEFT leg (camera pans left) and back behind;
// c) back through the gap while the foot steps; d) round the screen-RIGHT leg (pan right); then the other-hand pass, the cue pass, the mistake and the fix. The lure hand always comes up from the bottom edge.
// Trainer frame: v = sideways (+v = screen right), u = forward of the ankle line toward the camera. Legs shots: the trainer faces +z (camera side).
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
import { legsTimeline } from './legs3d.js';
export const FPS = 30, TOTAL = 1049, DECK = 0;
const w = {
  legs: 46, grab: 83, space: 104, stand1: 153, apart: 182, hold: 217, guide: 265, reward1: 326, next: 389, step: 404, pass: 453, reward2: 495, now: 551, hands: 562, lure: 584, walk: 644,
  say: 679, weave: 684, go: 711, if: 745, hes: 757, bumps: 779, big: 834, take: 866, slow: 878, say2: 979, yes: 985, click: 1002, then: 1018, reward3: 1024, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },             // trainer lures the puppy, chomp
  { id: 'setup', a: w.grab, b: w.space - 1, light: 'day' },       // treat jar
  { id: 'space', a: w.space, b: w.hold - 1, light: 'day' },       // legs: space to walk, feet step apart, puppy waits behind
  { id: 'gap', a: w.hold, b: w.reward1 - 1, light: 'day' },       // (a) hand lures the puppy through the gap, behind -> front
  { id: 'reward', a: w.reward1, b: w.next - 1, light: 'day' },    // reward, then (b) the puppy curls round the left leg (camera pans left)
  { id: 'step', a: w.next, b: w.reward2 - 1, light: 'day' },      // (c) trainer steps forward as the puppy passes under
  { id: 'pass', a: w.reward2, b: w.now - 1, light: 'day' },       // reward each pass, (d) round the right leg (pan right)
  { id: 'switch', a: w.now, b: w.say - 1, light: 'day' },         // other (left) hand lures it through again while the trainer walks, then round the left leg
  { id: 'cue', a: w.say, b: w.if - 1, light: 'day' },             // "Weave!" bubble as it goes through the gap
  { id: 'mistake', a: w.if, b: w.take - 1, light: 'day' },        // hesitates, big step: cross
  { id: 'fix', a: w.take, b: w.say2 - 1, light: 'day' },          // small slow steps: smooth pass, check
  { id: 'yes', a: w.say2, b: w.then - 1, light: 'golden' },       // kneeling trainer: yes + click
  { id: 'povFinal', a: w.then, b: TOTAL - 1, light: 'golden' },   // POV: reward, confetti
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
const DOGPOS = [0, MAT, 0], DOGYAW = Math.PI / 2;      // kneeling-trainer shots: puppy on the mat, nose toward +x
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
const REF = {};
export const calibrate = (poseFn, root) => {
  root.position.set(...DOGPOS); root.rotation.set(0, DOGYAW, 0); root.updateMatrixWorld(true);
  const far = [3, 0.3, 0];
  REF.sit = poseFn({ w: { sit: 1 }, look: far });
  REF.down = poseFn({ w: { down: 1 }, look: far });
  REF.stand = poseFn({ w: { stand: 1 }, look: far });
  root.position.set(...DOGPOS);
};
const NOSE = (r) => REF[r].nose;
const N_SIT = () => add(NOSE('sit'), [0.06, -0.005, 0]);
const MOUTH_SIT = () => add(NOSE('sit'), [0.05, -0.03, 0]);
const HEADY = () => REF.stand.nose[1];                 // standing nose height (world)
const FWD = () => REF.stand.nose[0];                   // nose distance ahead of the root

// ---------- the trainer's legs: ONE plan for the whole legs section (cuts between cameras, legs keep their state) ----------
const mid = (p) => [(p.L.x + p.R.x) / 2, (p.L.z + p.R.z) / 2];
const L0 = w.space;
const PLAN = legsTimeline({ at: [0, 0], yaw: 0.15, y: MAT, stance: 'together', steps: [
  { foot: 'R', a: L0 + 22, b: L0 + 50, side: -0.065, lift: 0.05 }, { foot: 'L', a: L0 + 40, b: L0 + 68, side: 0.065, lift: 0.05 },   // space to walk: feet to natural
  { foot: 'R', a: w.stand1 + 4, b: w.stand1 + 34, side: -0.07, lift: 0.05 }, { foot: 'L', a: w.stand1 + 18, b: w.stand1 + 46, side: 0.07, lift: 0.05 },   // feet apart
  { foot: 'R', a: w.step + 8, b: w.pass - 2, fwd: 0.12, lift: 0.1 },                       // ONE step forward while the puppy passes under
  { foot: 'L', a: 470, b: 494, fwd: 0.12, lift: 0.06 },                                    // catches up
  { foot: 'L', a: w.lure + 2, b: w.lure + 28, fwd: 0.08, lift: 0.05 }, { foot: 'R', a: w.lure + 30, b: w.lure + 54, fwd: 0.08, lift: 0.05 },   // small walking steps
  { foot: 'R', a: w.big - 8, b: w.big + 6, fwd: 0.12, side: 0.02, lift: 0.14 },            // MISTAKE: a big step
  { foot: 'R', a: w.slow + 6, b: w.slow + 40, fwd: -0.08, lift: 0.04 }, { foot: 'L', a: w.slow + 44, b: w.slow + 78, fwd: -0.08, lift: 0.04 },   // slow small steps
] });
export const legsAt = (f) => PLAN(f);
export const legsOn = (f) => f >= w.space && f < w.say2;
const inLegs = legsOn;

// ---------- the puppy in the legs section ----------
// Path in the trainer frame [frame, v, u] (u = forward of the ankle line toward the camera, v = sideways, +v = screen right). Hermite through the waypoints; the two segments are separate takes (a cut between them).
const SEGS = [[
  [104, -0.3, -0.4], [150, -0.3, -0.4], [186, 0, -0.26], [216, 0.01, -0.24], [262, 0, -0.24],
  [270, 0, -0.22], [290, 0, 0.0], [308, 0, 0.22], [322, 0, 0.3], [352, 0, 0.3],                                                 // (a) through the gap
  [362, -0.16, 0.32], [372, -0.34, 0.28], [380, -0.44, 0.1], [390, -0.44, -0.12], [400, -0.32, -0.32], [410, -0.12, -0.46], [422, 0, -0.3], [444, 0, -0.24],   // (b) round the screen-left leg
  [452, 0, -0.23], [462, 0, -0.02], [478, 0, 0.22], [492, 0, 0.3], [524, 0, 0.3],                                                 // (c) through the gap again
  [534, 0.16, 0.32], [544, 0.34, 0.28], [552, 0.44, 0.1], [562, 0.44, -0.12], [572, 0.32, -0.32], [582, 0.12, -0.46], [592, 0, -0.32], [600, 0, -0.26],   // (d) round the screen-right leg
  [606, 0, -0.24], [616, 0, -0.02], [630, 0, 0.22], [642, 0, 0.3], [664, 0, 0.3],                                                 // the other-hand pass
  [664, 0, 0.3], [670, -0.16, 0.32], [678, -0.34, 0.28], [686, -0.44, 0.1], [694, -0.44, -0.12], [702, -0.32, -0.32], [710, -0.12, -0.46], [716, 0, -0.3],   // round the left leg again
  [720, 0, -0.25], [730, 0, -0.02], [738, 0, 0.22], [744, 0, 0.3],                                                                 // the cue pass
], [
  [745, 0, -0.5], [757, 0, -0.3], [770, 0.01, -0.2], [800, 0.02, -0.2], [815, -0.01, -0.2], [828, 0, -0.2], [848, 0, -0.34], [865, 0, -0.4],   // hesitates, backs off at the big step
  [866, 0, -0.36], [884, 0, -0.28], [906, 0, -0.02], [924, 0, 0.22], [938, 0, 0.3], [978, 0, 0.3],                                  // the slow, smooth pass
]];
const cr = (P, f) => {
  const n = P.length; if (f <= P[0][0]) return [P[0][1], P[0][2]]; if (f >= P[n - 1][0]) return [P[n - 1][1], P[n - 1][2]];
  let i = 0; while (P[i + 1][0] < f) i++;
  const p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, n - 1)], h = p2[0] - p1[0], t = (f - p1[0]) / h, t2 = t * t, t3 = t2 * t;
  const o = [0, 0];
  for (let k = 0; k < 2; k++) { const m1 = (p2[k + 1] - p0[k + 1]) / (p2[0] - p0[0]), m2 = (p3[k + 1] - p1[k + 1]) / (p3[0] - p1[0]);
    o[k] = (2 * t3 - 3 * t2 + 1) * p1[k + 1] + (t3 - 2 * t2 + t) * h * m1 + (-2 * t3 + 3 * t2) * p2[k + 1] + (t3 - t2) * h * m2; }
  return o;
};
const vuAt = (f) => cr(SEGS[f >= SEGS[1][0][0] ? 1 : 0], f);
const YOFF = 0.24, CUT = SEGS[1][0][0];
const PD = [];   // per frame: world x, z, heading, speed (m/s, trainer frame), gait phase, v, u
{ let ph = 0, prev = null, hd = 0.39;
  for (let f = w.space; f < w.say2; f++) {
    const p = PLAN(f), m = mid(p), [v, u] = vuAt(f), c = Math.cos(p.yaw), s = Math.sin(p.yaw);
    const ok = prev && f !== CUT, dv = ok ? v - prev[0] : 0, du = ok ? u - prev[1] : 0, d = Math.hypot(dv, du);
    if (ok) { ph += d / 0.5; const tg = d > 0.003 ? p.yaw + Math.atan2(dv, du) : p.yaw + YOFF; let dd = tg - hd; dd -= 2 * Math.PI * Math.round(dd / (2 * Math.PI)); hd += dd * 0.2; }
    PD[f] = { x: m[0] + s * u + c * v, z: m[1] + c * u - s * v, yaw: hd, sp: d * 30, ph, v, u }; prev = [v, u];
  } }
const pupAt = (f) => PD[clamp(f, w.space, w.say2 - 1)];
const fwdOf = (P, d) => [Math.sin(P.yaw) * d, 0, Math.cos(P.yaw) * d];
// the lure hand: (lure) treat held low in front of the final spot, then to the mouth; (lead) treat just ahead of the nose; (hold) held out and not taken.
const CH = [334, 500, 646, 955];     // chomp frames: one per reward
const TS = [   // L: the left hand; x: no reward, ends at e
  { k: 'lure', t0: 232, e: CH[0] }, { k: 'lead', a: 356, b: 376, L: 1 }, { k: 'lure', t0: 426, e: CH[1] }, { k: 'lead', a: 526, b: 546 }, { k: 'lure', t0: 588, e: CH[2], L: 1 },
  { k: 'lead', a: 668, b: 688, L: 1 }, { k: 'lure', t0: 702, e: 744, x: 1 }, { k: 'hold', a: 752, b: 782 }, { k: 'lure', t0: 884, e: CH[3] },
];
let SEG = null;   // the segment legsTreat last answered from (for the hand side)
const away = (f, L) => { const C = camAt(f), d = C.look.map((v, i) => v - C.pos[i]), n = Math.hypot(...d), fw = d.map((v) => v / n), side = L ? -0.24 : 0.24, rt = [-fw[2], 0, fw[0]], r = Math.hypot(rt[0], rt[2]);
  return [C.pos[0] + fw[0] * 0.32 + rt[0] / r * side, C.pos[1] + fw[1] * 0.32 - 0.5, C.pos[2] + fw[2] * 0.32 + rt[2] / r * side]; };   // below the bottom edge, on the arm's side
const drift = (f) => [0.012 * Math.sin(f * 0.21), 0.01 * Math.sin(f * 0.17), 0];
const legsTreat = (f) => {
  for (const S of TS) {
    SEG = S;
    if (S.k === 'lure') {
      if (f < S.t0 || f >= (S.x ? S.e + 1 : S.e + 18)) continue;
      const P = pupAt(S.e), a = fwdOf({ yaw: P.yaw }, 0.38), m = fwdOf(P, 0.09);
      const low = [P.x + a[0], HEADY() - 0.19, P.z + a[2]], mouth = [P.x + m[0], HEADY() - 0.15, P.z + m[2]];
      const t = S.x ? KF(f, [[S.t0, away(S.t0, S.L)], [S.t0 + 16, low], [S.e, low]]) : KF(f, [[S.t0, away(S.t0, S.L)], [S.t0 + 16, low], [S.e - 5, low], [S.e, mouth], [S.e + 6, mouth], [S.e + 18, away(S.e + 18, S.L)]]);
      return f < S.e - 5 ? add(t, drift(f)) : t;
    }
    if (S.k === 'hold') {
      if (f < S.a || f >= S.b + 12) continue;
      const p = PLAN(f), m = mid(p), c = Math.cos(p.yaw), s = Math.sin(p.yaw), tg = [m[0] + s * 0.45, HEADY() - 0.15, m[1] + c * 0.45];
      const lo = (k) => away(k).map((v, i) => v + (tg[i] - v) * 0.7);   // held low, only the hand tip comes into the bottom-right of the frame
      return add(KF(f, [[S.a, away(S.a)], [S.a + 12, lo(S.a + 12)], [S.b, lo(S.b)], [S.b + 12, away(S.b + 12)]]), f < S.b ? drift(f) : [0, 0, 0]);
    }
    if (f < S.a || f >= S.b + 10) continue;
    const P = pupAt(Math.min(f + 10, w.say2 - 1)), a = fwdOf(P, 0.3), tg = [P.x + a[0], HEADY() - 0.15, P.z + a[2]];
    return f > S.b ? KF(f, [[S.b, tg], [S.b + 10, away(S.b + 10, S.L)]]) : f < S.a + 10 ? KF(f, [[S.a, away(S.a, S.L)], [S.a + 10, tg]]) : tg;
  }
  SEG = null; return null;
};

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { stand: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  switch (S.id) {
    case 'hook': {
      const ch = chompAt(f, w.legs + 1);
      return { ...base, pos: HOOKP, w: { sit: 1 }, look: W.treat || SH(add(N_SIT(), [0.1, 0.0, 0])), neck: 1, jaw: f >= w.legs + 15 ? 0.3 : ch, ...(f > w.legs - 3 ? happy : {}), ears: f > 12 && f < w.legs - 7 ? -0.4 : 0,
        blink: f > w.legs + 1 && f < w.legs + 7 ? 1 : base.blink, headTilt: 8 * Math.sin(Math.PI * ramp(f, 6, 30)) };
    }
    case 'setup': return { ...base, w: { sit: 1 }, look: [1.6, 0.12, 0.3], neck: 1 };
    case 'yes': {
      return { ...base, w: { sit: 1 }, look: [TRN[0] + 0.05, 0.55, TRN[2]], neck: 1, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    }
    case 'povFinal': {
      const t0 = w.reward3 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, w: { sit: 1 }, look: W.treatHide || !W.treat ? [0.9, 0.24, 0.3] : W.treat, neck: 0.8, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  // legs shots: one puppy for all of them
  const P = pupAt(f), c = camAt(f).pos, t = W.treat, k = clamp(P.sp / 0.4), moving = P.sp > 0.04;
  const lc = CH.filter((e) => e <= f).pop(), ate = lc !== undefined && f < lc + 40;
  const look = t && !W.treatHide ? add(t, [0, 0.08, 0]) : [c[0] + 0.12 * Math.sin(f * 0.045), 0.2 + 0.04 * Math.sin(f * 0.03), c[2]];
  const ch = Math.max(0, ...CH.map((e) => chompAt(f, e)));
  let tilt = 0;
  if (S.id === 'mistake') tilt = -12 * Math.sin(Math.PI * ramp(f, w.hes, w.take - 10));
  if (S.id === 'space') tilt = 10 * Math.sin(Math.PI * ramp(f, w.stand1, w.hold - 6));
  const sad = S.id === 'mistake' && f > w.hes && f < w.take - 12;
  return { ...base, pos: [P.x, MAT, P.z], yaw: P.yaw, aimEyes: true, gait: moving ? { phase: P.ph, amp: 22, lift: 1.0, k } : undefined, look, neck: 1, headTilt: tilt, jaw: lc !== undefined && f >= lc + 15 && f < lc + 40 ? 0.25 : ch,
    ears: sad ? -0.5 : f > w.hold ? 0.12 * Math.sin(f * 0.07) : -0.3, wag: ate ? Math.sin(f * 0.5) * 0.9 : sad ? 0.1 : Math.sin(f * 0.5) * 0.5, tail: sad ? 0 : 0.3, blink: lc !== undefined && f >= lc && f < lc + 7 ? 1 : base.blink };
};

// ---------- 3D props ----------
const treatPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'hook': return SH(KF(f, [[0, add(N_SIT(), [0.12, 0.04, 0])], [10, N_SIT()], [w.legs - 8, N_SIT()], [w.legs + 1, MOUTH_SIT()]]));
    case 'povFinal': return KF(f, [[w.then, add(MOUTH_SIT(), [0.3, 0.14, 0.05])], [w.reward3 + 2, MOUTH_SIT()]]);
  }
  return inLegs(f) ? legsTreat(f) : null;
};
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f);
  if (t) W.treat = t;
  if (S.id === 'povFinal' && t) W.hand = { treat: t, side: 0.22 };
  const lc = CH.filter((e) => e <= f).pop();
  if ((S.id === 'hook' && f > w.legs + 5) || (S.id === 'povFinal' && f >= w.reward3 + 4) || (inLegs(f) && lc !== undefined && f >= lc && f < lc + 20)) W.treatHide = true;
  if (inLegs(f) && t) { if (SEG && SEG.L) W.hand2 = { treat: t, side: -0.24 }; else W.hand = { treat: t, side: 0.24 }; }   // the left hand takes over for "switch hands"
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
    const kind = f > w.legs + 5 ? 'palm' : f >= w.legs - 5 ? 'give' : 'treat', off = kind === 'give' ? [19, -12] : [25, -3], s = 2.08 * 1.05, sy = Math.cos(ang) < 0 ? -1 : 1;
    const Wr = [T[0] - (Math.cos(ang) * off[0] * s - Math.sin(ang) * off[1] * sy * s), T[1] - (Math.sin(ang) * off[0] * s + Math.cos(ang) * off[1] * sy * s)];
    o.far = { to: Wr, hand: kind, bend: 1, rot: ang * 180 / Math.PI }; o.lean = 10;
  } else o.far = 'present';
  return o;
};

// ---------- cameras ----------
const PK = [0.0, 0.45, -0.05], ZM = 1.8, pk = (f, x, z, lx = 0, fov = 38, zm = ZM, ly = 0) => ({ f, pos: [PK[0] + lx + (x - PK[0]) * zm, 0.36, PK[2] + (z - PK[2]) * zm], look: [PK[0] + lx, PK[1] + ly, PK[2]], fov: q(2 * Math.atan(Math.tan(fov * Math.PI / 360) / zm) * 180 / Math.PI, 2) });   // peekaboo's low camera, pulled back so the puppy stays under 55%; lx pans sideways; zm = pull-back
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.space - 1, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 }],
  space: [pk(w.space, 0.7, 1.5, -0.14, 40), pk(w.hold - 1, 0.84, 1.46)],
  gap: [pk(w.hold, 0.84, 1.46), pk(w.reward1 - 1, 0.78, 1.40)],
  reward: [pk(w.reward1, 0.62, 1.46), pk(352, 0.6, 1.44), pk(364, 0.58, 1.5, -0.38, 48, 2.5, 0.1), pk(w.next - 1, 0.58, 1.5, -0.38, 48, 2.5, 0.1)],
  step: [pk(w.next, 0.66, 1.5, -0.38, 48, 2.5, 0.1), pk(422, 0.84, 1.46), pk(w.reward2 - 1, 0.78, 1.40)],
  pass: [pk(w.reward2, 0.62, 1.46), pk(524, 0.62, 1.44), pk(536, 0.7, 1.5, 0.38, 48, 2.5, 0.1), pk(w.now - 1, 0.7, 1.5, 0.38, 48, 2.5, 0.1)],
  switch: [pk(w.now, 0.7, 1.5, 0.38, 48, 2.5, 0.1), pk(590, 0.84, 1.46), pk(664, 0.8, 1.42), pk(w.say - 1, 0.58, 1.5, -0.38, 48, 2.5, 0.1)],
  cue: [pk(w.say, 0.58, 1.5, -0.38, 48, 2.5, 0.1), pk(706, 0.58, 1.5, -0.38, 48, 2.5, 0.1), pk(w.if - 1, 0.8, 1.44, 0, 38)],
  mistake: [pk(w.if, 0.92, 1.5), pk(w.take - 1, 0.88, 1.46)],
  fix: [pk(w.take, 0.67, 1.51), pk(w.say2 - 1, 0.62, 1.46)],
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  povFinal: [{ f: w.then, pos: [1.34, 0.84, 0.72], look: [0.17, 0.2, 0.0], fov: 42 }, { f: TOTAL - 1, pos: [1.29, 0.81, 0.69], look: [0.18, 0.2, 0.0], fov: 42 }],
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (S.id.startsWith('pov')) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  if (inLegs(f) && true) { const m = mid(PLAN(f)), k = 0.75; c.pos = add(c.pos, [m[0] * k, 0, m[1] * k]); c.look = add(c.look, [m[0] * k, 0, m[1] * k]); }   // the camera follows the trainer's steps
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (S.id === 'hook' || S.id === 'yes') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (inLegs(f)) { const P = pupAt(f); return { focus: dist(C.pos, [P.x, 0.25, P.z]), cinf: 4 }; }
  return { focus: dist(C.pos, REF.sit ? REF.sit.head : [0.3, 0.3, 0]), cinf: 6 };
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
const BUB_CUE = [-0.06, 0.32, -0.05], BUB_YES = [-0.12, 0.78, -0.45];
const toCam = (p, d) => { const c = CUR, v = [c[0] - p[0], c[2] - p[2]], L = Math.hypot(v[0], v[1]) || 1; return [p[0] + v[0] / L * d, p[1], p[2] + v[1] / L * d]; };   // move a point toward the camera so legs never cover it
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  // puppy head point (legs shots): above the head, for hearts and badges
  const hp = (y) => { const P = pupAt(f), a = fwdOf(P, FWD() * 0.6); return [P.x + a[0], HEADY() + y, P.z + a[2]]; };
  if (S.id === 'hook') hearts(w.legs + 1, [0.38, 0.4, -0.42], 3, 0.07);
  for (const e of CH) if (inLegs(f) && f >= e && f < e + 30) hearts(e + 1, toCam(hp(-0.06), 0.4), 3, 0.09);
  if (S.id === 'cue') { const m = mid(PLAN(f)); bubble('bd', 'Weave!', '', '#ffffff', w.weave - 2, w.go + 14, toCam([m[0] + BUB_CUE[0], BUB_CUE[1], m[1] + BUB_CUE[2]], 0.6), 0.22); }
  if (S.id === 'mistake') badge(T.fxCross, 'no', w.bumps - 3, w.big + 4, toCam(hp(0.08), 0.4), 0.18);
  if (S.id === 'fix') badge(T.fxCheck, 'ok', w.slow + 16, w.say2 - 2, toCam(hp(0.08), 0.4), 0.14);
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click + 8, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    const HEAD = add(NOSE('sit'), [-0.08, 0.06, 0]);
    hearts(w.reward3 + 3, HEAD, 4, 0.06);
    if (f >= w.reward3) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward3 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('sit'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
