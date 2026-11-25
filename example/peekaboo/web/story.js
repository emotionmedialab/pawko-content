// "Peekaboo" — teach the puppy to stand between your legs and peek out. 3D puppy + 3D trainer legs (legs3d.js) + the 2D kneeling trainer (hook, yes). 1047 frames, timed to voice.mp3 (Holden).
// Word frames (round(s*30); sentence starts taken from silencedetect): Let's 0 teach 8 dog 19 peekaboo 40 | Grab 84 treats 86 space 106 stand 120 |
// Start 159 weave 174 | Stand 213 feet 228 apart 234 | lure 255 through 276 legs 289 | When 325 between 340 legs 355 | stop 380 reward 404 |
// Next 451 reward 472 staying 493 seconds 518 | Feed 553 low 564 knees 605 | Now 640 say 643 peekaboo 653 middle 707 | If 738 feet 753 quickly 759 step 790 dog 807 |
// Keep 836 slow 851 relaxed 877 | and 906 peek 918 out 925 | Say 956 yes 964 click 992 | then 1020 reward 1024 | end 1046.
// RE-TIME: update TOTAL and the word table `w`; every shot and action is keyed to `w`. Hard cuts only, no flashes, one sun (day; golden for yes/final).
// Legs shots: the trainer faces +z (camera side), the puppy's frame is (v = sideways, u = forward of the ankle line). The kneeling-trainer shots copy dog-down-ii.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
import { legsTimeline } from './legs3d.js';
export const FPS = 30, TOTAL = 1047, DECK = 0;
const w = {
  peekaboo1: 40, grab: 84, space: 106, stand: 120, start: 159, weaveW: 174, standW: 213, apart: 234, lure: 255, legs1: 289,
  when: 325, between: 340, legs2: 355, stop: 380, reward1: 404, next: 451, reward2: 472, seconds: 518, feed: 553, knees: 605,
  now: 640, peekaboo: 653, middle: 707, if: 738, quickly: 759, step: 790, dog2: 807, keep: 836, relaxed: 877, and2: 906, out: 925,
  say: 956, yes: 964, click: 992, then: 1020, reward3: 1024, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },             // trainer lures the puppy, chomp
  { id: 'setup', a: w.grab, b: w.space - 1, light: 'day' },       // treat jar
  { id: 'weave', a: w.space, b: w.when - 1, light: 'day' },       // legs: space to stand, feet apart, lure through the legs
  { id: 'peek', a: w.when, b: w.next - 1, light: 'day' },         // puppy comes through, stands between the legs, stop + reward
  { id: 'stay', a: w.next, b: w.feed - 1, light: 'day' },         // stays a few seconds, reward
  { id: 'knees', a: w.feed, b: w.now - 1, light: 'day' },         // feed low between the knees
  { id: 'peekaboo', a: w.now, b: w.if - 1, light: 'day' },        // cue "Peekaboo!" bubble
  { id: 'mistake', a: w.if, b: w.keep - 1, light: 'day' },        // quick foot: cross
  { id: 'fix', a: w.keep, b: w.say - 1, light: 'day' },           // slow relaxed steps: check
  { id: 'yes', a: w.say, b: w.then - 1, light: 'golden' },        // kneeling trainer: yes + click
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
  { foot: 'R', a: L0 + 22, b: L0 + 50, side: -0.065, lift: 0.05 }, { foot: 'L', a: L0 + 40, b: L0 + 68, side: 0.065, lift: 0.05 },   // space to stand: feet to natural
  { foot: 'R', a: w.standW + 4, b: w.standW + 34, side: -0.07, lift: 0.05 }, { foot: 'L', a: w.standW + 18, b: w.standW + 46, side: 0.07, lift: 0.05 },   // feet apart (0.18)
  { foot: 'L', a: 480, b: 504, side: 0.015, lift: 0.03 }, { foot: 'R', a: 690, b: 714, side: -0.015, lift: 0.03 },   // tiny weight shifts while it stays
  { foot: 'R', a: w.quickly - 3, b: w.quickly + 11, fwd: 0.12, side: 0.025, lift: 0.14 },                                            // MISTAKE: a quick step
  { foot: 'R', a: w.keep + 6, b: w.keep + 44, fwd: -0.1, lift: 0.05 }, { foot: 'L', a: w.keep + 50, b: w.keep + 86, side: 0.01, fwd: 0.02, lift: 0.04 },   // slow relaxed steps
] });
export const legsAt = (f) => PLAN(f);
export const legsOn = (f) => f >= w.space && f < w.say;

// ---------- the puppy in the legs section ----------
// weave (space..when): arrives, waits, then follows the treat through the gap and around the left leg. Frame (v = trainer's left, u = forward), moves with the feet.
const WPATH = [[0.0, 0.5], [0.0, 0.26], [0.0, -0.08], [0.02, -0.4], [0.2, -0.5], [0.38, -0.36]];
const WS = w.lure + 4;   // the puppy starts to follow the treat here (after the legs are apart)
const wvu = (f) => {
  if (f < WS) { const k = sm(ramp(f, WS - 24, WS)); return [0.1 - 0.1 * k, 0.42 + 0.08 * k]; }
  const x = clamp((f - WS) / (w.when - 2 - WS)); return spline(WPATH, 0.8 * (0.6 * x + 0.4 * sm(x)));
};
const wPos = (f) => { const p = PLAN(f), m = mid(p), [v, u] = wvu(f), c = Math.cos(p.yaw), s = Math.sin(p.yaw); return [m[0] + c * v + s * u, m[1] - s * v + c * u]; };
const WD = []; { let ph = 0, prev = wPos(w.space), hd = -2.6; for (let f = w.space; f < w.when; f++) { const q2 = wPos(f), dx = q2[0] - prev[0], dz = q2[1] - prev[1], d = Math.hypot(dx, dz); ph += d / 0.5;
  if (d > 0.002) { const t = Math.atan2(dx, dz); let dd = t - hd; dd -= 2 * Math.PI * Math.round(dd / (2 * Math.PI)); hd += dd * 0.25; }
  WD[f] = { ph, sp: d * 30, yaw: hd }; prev = q2; } }
// peek / stay / knees / peekaboo / mistake / fix: u = forward distance of the puppy's root from the ankle line
const UK = [[w.when, -0.62], [w.when + 26, -0.2], [w.feed, -0.17], [w.now, -0.17], [w.now + 6, -0.36], [w.now + 14, -0.15], [w.if + 20, -0.15], [w.quickly + 12, -0.15],
  [w.quickly + 24, -0.23], [w.keep, -0.23], [w.and2 - 6, -0.19], [w.out, -0.13], [w.say - 1, -0.13]];
const uAt = (f) => KF(f, UK);
const VOFF = -0.025, YOFF = 0.24;
const peekPos = (f) => { const p = PLAN(f), m = mid(p), u = uAt(f), yw = p.yaw, v = VOFF; return { x: m[0] + Math.sin(yw) * u + Math.cos(yw) * v, z: m[1] + Math.cos(yw) * u - Math.sin(yw) * v, yaw: yw + YOFF, u }; };
const inLegs = legsOn;
// puppy position/heading for the legs section: { pos:[x,z], yaw }
const pupAt = (f) => { if (f < w.when) { const q2 = wPos(f); return { x: q2[0], z: q2[1], yaw: WD[f].yaw }; } const p = peekPos(f); return { x: p.x, z: p.z, yaw: p.yaw }; };
const fwdOf = (P, d) => [Math.sin(P.yaw) * d, 0, Math.cos(P.yaw) * d];
// the treat in the legs section: low and ahead of the puppy (never over the face)
const legsTreat = (f) => {
  const P = pupAt(f);
  if (f < WS - 8) return null;
  if (f < w.when) { const a = fwdOf(P, 0.16); return [P.x + a[0], MAT + 0.12, P.z + a[2]]; }
  const e = EAT[shotAt(f).id], s = shotAt(f).id, a = fwdOf(P, 0.32), m = fwdOf(P, 0.09);
  const low = [P.x + a[0], HEADY() - 0.15, P.z + a[2]], mouth = [P.x + m[0], HEADY() - 0.15, P.z + m[2]], t0 = e - 26;
  if (e === undefined || f < t0) return null;   // comes in from the camera side, low, to the mouth
  const c = camAt(f).pos, d = [c[0] - mouth[0], c[2] - mouth[2]], L = Math.hypot(d[0], d[1]), away = [mouth[0] + d[0] / L * 0.3, MAT + 0.02, mouth[2] + d[1] / L * 0.3];   // the hand drops out toward the camera and down
  return KF(f, [[t0, add(low, [0.1, 0.0, 0.45])], [t0 + 16, low], [e - 9, low], [e, mouth], [e + 10, mouth], [e + 24, away]]);
};
const EAT = { peek: w.reward1, stay: w.seconds + 6, knees: w.knees - 3 };

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { stand: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  switch (S.id) {
    case 'hook': {
      const ch = chompAt(f, w.peekaboo1 + 1);
      return { ...base, pos: HOOKP, w: { sit: 1 }, look: W.treat || SH(add(N_SIT(), [0.1, 0.0, 0])), neck: 1, jaw: f >= w.peekaboo1 + 15 ? 0.3 : ch, ...(f > w.peekaboo1 - 3 ? happy : {}), ears: f > 12 && f < w.peekaboo1 - 7 ? -0.4 : 0,
        blink: f > w.peekaboo1 + 1 && f < w.peekaboo1 + 7 ? 1 : base.blink, headTilt: 8 * Math.sin(Math.PI * ramp(f, 6, 30)) };
    }
    case 'setup': return { ...base, w: { sit: 1 }, look: [1.6, 0.12, 0.3], neck: 1 };
    case 'weave': {
      const n = f - S.a, wd = WD[f], x = wPos(f), moving = wd.sp > 0.04, k = clamp(wd.sp / 0.4), t = legsTreat(f);
      const pre = f < WS - 6;
      const yaw = pre && !moving ? lerp(wd.yaw, wd.yaw + 0.9, sm(ramp(f, w.space + 6, w.space + 34))) : wd.yaw;   // waiting: turns its head and body a little toward the camera
      const tg = t || [x[0] + Math.sin(wd.yaw) * 1.5, 0.12, x[1] + Math.cos(wd.yaw) * 1.5];
      return { ...base, pos: [x[0], MAT, x[1]], yaw, gait: k > 0.02 ? { phase: wd.ph, amp: 24, lift: 1.1, k } : undefined, look: pre ? [x[0] + 0.5, 0.2, x[1] + 1.4] : tg, neck: 0.6, aimEyes: true, wag: 0.6 * Math.sin(f * 0.35), tail: 0.25 };
    }
    case 'peek': case 'stay': case 'knees': case 'peekaboo': case 'mistake': case 'fix': {
      const P = peekPos(f), p = PLAN(f), c = camAt(f).pos, n = f - S.a, t = W.treat;
      const moving = f < w.when + 26 || (f >= w.now && f < w.now + 14) || (f >= w.quickly + 12 && f < w.quickly + 24) || (f >= w.and2 - 6 && f < w.out) ? 1 : 0;
      const dir = f >= w.now && f < w.now + 6 || (f >= w.quickly + 12 && f < w.quickly + 24) ? -1 : 1;
      const ate = f >= (EAT[S.id] ?? 1e9);
      const look = t && !W.treatHide ? add(t, [0, 0.08, 0]) : [c[0] + 0.12 * Math.sin(f * 0.045), 0.2 + 0.04 * Math.sin(f * 0.03), c[2]];
      const ch = S.id in EAT ? Math.max(chompAt(f, EAT[S.id])) : 0;
      let tilt = 0;
      if (S.id === 'peekaboo') tilt = 12 * Math.sin(Math.PI * ramp(f, w.now + 14, w.now + 44));
      if (S.id === 'peek') tilt = 8 * Math.sin(Math.PI * ramp(f, w.when + 28, w.when + 56));
      if (S.id === 'mistake') tilt = f > w.quickly + 8 ? -10 * Math.sin(Math.PI * ramp(f, w.quickly + 8, w.if + 70)) : 0;
      return { ...base, pos: [P.x, MAT, P.z], yaw: P.yaw, aimEyes: true, gait: moving ? { phase: dir * P.u / 0.5 * 2, amp: 16, lift: 0.8, k: 1 } : undefined, look, neck: 1, headTilt: tilt, jaw: f >= EAT[S.id] + 15 ? 0.25 : ch,
        ears: f > w.when + 20 ? 0.12 * Math.sin(f * 0.07) - 0.2 * (S.id === 'mistake' && f > w.quickly + 6 ? 1 : 0) : -0.3, wag: ate || f > w.when + 34 ? Math.sin(f * 0.5) * 0.9 : Math.sin(f * 0.5) * 0.5, tail: 0.3,
        blink: ate && f < EAT[S.id] + 7 ? 1 : base.blink };
    }
    case 'yes': {
      return { ...base, w: { sit: 1 }, look: [TRN[0] + 0.05, 0.55, TRN[2]], neck: 1, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    }
    case 'povFinal': {
      const t0 = w.reward3 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, w: { sit: 1 }, look: W.treatHide || !W.treat ? [0.9, 0.24, 0.3] : W.treat, neck: 0.8, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props ----------
const treatPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'hook': return SH(KF(f, [[0, add(N_SIT(), [0.12, 0.04, 0])], [10, N_SIT()], [w.peekaboo1 - 8, N_SIT()], [w.peekaboo1 + 1, MOUTH_SIT()]]));
    case 'weave': case 'peek': case 'stay': case 'knees': return legsTreat(f);
    case 'povFinal': return KF(f, [[w.then, add(MOUTH_SIT(), [0.3, 0.14, 0.05])], [w.reward3 + 2, MOUTH_SIT()]]);
  }
  return null;
};
const PAWSHOTS = ['weave'];   // between the legs there is no cursor: it would sit on the dog
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f);
  if (t) W.treat = t;
  if (S.id === 'povFinal' && t) W.hand = { treat: t, side: 0.22 };
  const ate = EAT[S.id] !== undefined && f >= EAT[S.id];
  if ((S.id === 'hook' && f > w.peekaboo1 + 5) || (S.id === 'povFinal' && f >= w.reward3 + 4) || ate) W.treatHide = true;
  if (['peek', 'stay', 'knees'].includes(S.id) && t) W.hand = { treat: t, side: 0.24 };   // the POV hand holds every treat, arm up from the bottom edge
  if (PAWSHOTS.includes(S.id) && t) {
    W.trailCol = '#ff8fb0';
    const e = EAT[S.id], k = e !== undefined ? sm(ramp(f, e, e + 14)) : 0;
    W.paw = { pos: ate ? add(t, [0.1 * k, 0.7 * k, 0]) : t, s: 0.95 };   // after the chomp the paw flies up and out of frame
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
    const kind = f > w.peekaboo1 + 5 ? 'palm' : f >= w.peekaboo1 - 5 ? 'give' : 'treat', off = kind === 'give' ? [19, -12] : [25, -3], s = 2.08 * 1.05, sy = Math.cos(ang) < 0 ? -1 : 1;
    const Wr = [T[0] - (Math.cos(ang) * off[0] * s - Math.sin(ang) * off[1] * sy * s), T[1] - (Math.sin(ang) * off[0] * s + Math.cos(ang) * off[1] * sy * s)];
    o.far = { to: Wr, hand: kind, bend: 1, rot: ang * 180 / Math.PI }; o.lean = 10;
  } else o.far = 'present';
  return o;
};

// ---------- cameras ----------
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.space - 1, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 }],
  weave: [{ f: w.space, pos: [0.55, 0.45, 2.25], look: [0.1, 0.54, 0.05], fov: 46 }, { f: w.when - 1, pos: [0.5, 0.45, 2.2], look: [0.1, 0.54, 0.0], fov: 46 }],
  peek: [{ f: w.when, pos: [0.84, 0.34, 1.46], look: [0.0, 0.39, -0.05], fov: 42 }, { f: w.next - 1, pos: [0.78, 0.34, 1.40], look: [0.0, 0.39, -0.05], fov: 42 }],
  stay: [{ f: w.next, pos: [0.62, 0.34, 1.46], look: [-0.02, 0.39, -0.05], fov: 42 }, { f: w.feed - 1, pos: [0.56, 0.34, 1.40], look: [-0.02, 0.39, -0.05], fov: 42 }],
  knees: [{ f: w.feed, pos: [0.34, 0.34, 1.34], look: [-0.02, 0.39, -0.05], fov: 42 }, { f: w.now - 1, pos: [0.28, 0.34, 1.29], look: [-0.02, 0.39, -0.05], fov: 42 }],
  peekaboo: [{ f: w.now, pos: [0.84, 0.34, 1.46], look: [0.0, 0.39, -0.05], fov: 42 }, { f: w.if - 1, pos: [0.78, 0.34, 1.40], look: [0.0, 0.39, -0.05], fov: 42 }],
  mistake: [{ f: w.if, pos: [0.92, 0.34, 1.5], look: [0.0, 0.39, -0.05], fov: 42 }, { f: w.keep - 1, pos: [0.88, 0.34, 1.46], look: [0.0, 0.39, -0.05], fov: 42 }],
  fix: [{ f: w.keep, pos: [0.67, 0.34, 1.51], look: [0.0, 0.39, -0.05], fov: 42 }, { f: w.say - 1, pos: [0.62, 0.34, 1.46], look: [0.0, 0.39, -0.05], fov: 42 }],
  yes: [{ f: w.say, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  povFinal: [{ f: w.then, pos: [1.34, 0.84, 0.72], look: [0.17, 0.2, 0.0], fov: 42 }, { f: TOTAL - 1, pos: [1.29, 0.81, 0.69], look: [0.18, 0.2, 0.0], fov: 42 }],
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (S.id.startsWith('pov')) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
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
const BUB_CUE = [0.0, 0.32, -0.05], BUB_YES = [-0.12, 0.78, -0.45];
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
  if (S.id === 'hook') hearts(w.peekaboo1 + 1, [0.38, 0.4, -0.42], 3, 0.07);
  if (S.id === 'peek') { hearts(w.reward1 + 1, toCam(hp(-0.06), 0.4), 3, 0.09); badge(T.fxCheck, 'ok', w.legs2 - 2, w.stop + 14, toCam(hp(0.08), 0.4), 0.14); }
  if (S.id === 'stay') hearts(w.seconds + 7, toCam(hp(-0.06), 0.4), 3, 0.09);
  if (S.id === 'knees') hearts(w.knees - 2, toCam(hp(-0.14), 0.4), 3, 0.09);
  if (S.id === 'peekaboo') bubble('bd', 'Peekaboo!', '', '#ffffff', w.peekaboo - 2, w.middle + 14, toCam(BUB_CUE, 0.6), 0.22);
  if (S.id === 'mistake') badge(T.fxCross, 'no', w.step - 3, w.keep, toCam(hp(0.08), 0.4), 0.18);
  if (S.id === 'fix') badge(T.fxCheck, 'ok', w.relaxed - 2, w.and2 + 10, toCam(hp(0.08), 0.4), 0.14);
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    const HEAD = add(NOSE('sit'), [-0.08, 0.06, 0]);
    hearts(w.reward3 + 3, HEAD, 4, 0.06);
    if (f >= w.reward3) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward3 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('sit'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
