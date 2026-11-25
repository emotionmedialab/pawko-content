// "Crate IV" - stay calm in the crate while you leave home. Clone of Crate III (crate.js, timer badges, cameras). 1075 frames, timed to voice.mp3 (Holden).
// Word frames (round(s*30); sentence-start words from the silence_end before them):
// Let's 0 leave 62 home 67 | Grab 99 chew 107 toy 113 pet 137 camera 142 if 154 | Settle 202 crate 232 | Step 272 out 278 front 287 door 293 one 309 two 322 minutes 327 |
// Then 356 come 358 back 364 | Slowly 395 build 403 five 423 ten 450 twenty 474 then 502 thirty 508 | Keep 552 goodbyes 559 hellos 582 boring 593 |
// Watch 646 camera 656 gone 680 | If 715 panics 726 you 752 went 754 long 764 | Cut 802 time 808 back 815 build 840 up 846 more 857 slowly 869 |
// When 912 come 917 calm 940 dog 947 | say 980 yes 986 click 1015 | then 1047 reward 1051 | end 1074.
// RE-TIME: run transcribe.py on a new voice, update TOTAL and `w`. Every shot/action is keyed to `w`. Hard cuts only. The trainer never walks or slides: he is cut out of frame.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
import { CRATE, doorEdge } from './crate.js';
export const FPS = 30, TOTAL = 1075, DECK = 0;
const w = {
  leave: 62, grab: 99, chew: 107, pet: 137, ifw: 154, settle: 202, crate: 232, step: 272, front: 287, one: 309, two: 322, then1: 356, back: 364,
  slowly: 395, five: 423, ten: 450, twenty: 474, thirty: 508, keep: 552, hellos: 582, boring: 593, watch: 646, ifp: 715, panics: 726, you: 752, cut: 802, backw: 815,
  build: 840, more: 857, slow2: 869, when: 912, come: 917, calm: 940, dog: 947, say: 980, yes: 986, click: 1015, then2: 1047, reward: 1051, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },              // trainer beside the crate, door swings shut
  { id: 'setup', a: w.grab, b: w.settle - 1, light: 'day' },      // chew toy, then the pet camera card
  { id: 'shut', a: w.settle, b: w.step - 1, light: 'day' },       // POV: hand swings the door shut (puppy settled with the toy)
  { id: 'step', a: w.step, b: w.front - 1, light: 'day' },        // trainer glances to the door, then a hard cut
  { id: 'alone', a: w.front, b: w.then1 - 1, light: 'day' },      // puppy alone, "1-2 min" badge, settles with the toy
  { id: 'back', a: w.then1, b: w.slowly - 1, light: 'day' },      // hard cut back: kneeling trainer, calm return
  { id: 'times', a: w.slowly, b: w.keep - 1, light: 'day' },      // 5, 10, 20, 30 min badges
  { id: 'boring', a: w.keep, b: w.watch - 1, light: 'day' },      // calm kneeling trainer, neutral face, check
  { id: 'cam', a: w.watch, b: w.ifp - 1, light: 'day' },          // pet-camera view card: puppy calm
  { id: 'panic', a: w.ifp, b: w.you - 1, light: 'day' },          // MISTAKE: puppy stands, whines, red cross
  { id: 'toolong', a: w.you, b: w.cut - 1, light: 'day' },        // MISTAKE: "2 hrs" badge, still whining
  { id: 'cutback', a: w.cut, b: w.build - 1, light: 'day' },      // FIX: smaller timer + check, puppy calms
  { id: 'build2', a: w.build, b: w.slow2 - 1, light: 'day' },     // FIX: 5 min, 10 min again, slowly
  { id: 'calmP', a: w.slow2, b: w.when - 1, light: 'day' },       // FIX: calm puppy close, green check
  { id: 'back2', a: w.when, b: w.dog - 1, light: 'day' },         // back to a calm dog
  { id: 'open', a: w.dog, b: w.say - 1, light: 'day' },           // POV: hand opens the door
  { id: 'yes', a: w.say, b: w.then2 - 1, light: 'golden' },       // trainer: "yes" + click
  { id: 'final', a: w.then2, b: TOTAL - 1, light: 'golden' },     // POV: reward through the open door
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

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 135, el: 50, sky: '#c4d6f2', ground: '#8a8262', hemi: 1.2, sun: '#fff1dc', sunI: 2.4, fog: '#cadcf0', fogNear: 60, fogFar: 700,
    skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.08, vig: 0.2, shadowExt: 3 },
  golden: { az: 120, el: 30, sky: '#ffe8cc', ground: '#8a7a62', hemi: 1.2, sun: '#ffe2bc', sunI: 2.4, fog: '#f4d6b0', fogNear: 60, fogFar: 650,
    skyTop: '#6f8fd8', skyHor: '#ffd2a0', sat: 1.04, vig: 0.24, shadowExt: 3, gain: '#fffaf2' },
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });

// ---------- staging ----------
const MAT = 0.064, K = 0.00225, ST = 1.08;
const CR = [0, MAT, 0];                                   // crate centre on the mat (door on +x)
const FLR = MAT + CRATE.FLOOR;                            // top of the soft mat inside the crate
const DOGPOS = [0.08, FLR, 0], DOGYAW = Math.PI / 2;      // puppy inside, nose toward the door
const TRN = [-0.8, MAT, 0.2];                          // trainer kneels BESIDE the crate (left of it, facing right)
const TOY_IN = [0.38, FLR + 0.036, 0.2];                   // toy lying beside the front paws
const TOY_MAT = [0.95, MAT + 0.036, 0.5];                  // toy lying on the mat (setup shot)
let CUR = [0, 1, 3], TCUR = TRN;
const axisOf = (pos) => { const ry = Math.atan2(CUR[0] - pos[0], CUR[2] - pos[2]); return [Math.cos(ry), 0, -Math.sin(ry)]; };
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
const MOUTH = () => add(NOSE('down'), [0.06, -0.02, 0.0]);        // treat held at the bars, at the down puppy's mouth
const MOUTH_SIT = () => add(NOSE('sit'), [0.06, -0.04, 0.0]);
const HEADP = () => add(NOSE('down'), [-0.1, 0.09, 0]);           // hearts anchor

// ---------- door ----------
const CL = w.crate - 17;                                   // hand reaches the door; latch lands on "crate"
const doorAt = (f) => {
  switch (shotAt(f).id) {
    case 'hook': return 0.55 * (1 - sm(ramp(f, w.leave - 8, w.leave + 18)));
    case 'setup': return 1;
    case 'shut': return 1 - sm(ramp(f, CL - 4, w.crate + 6));
    case 'open': return sm(ramp(f, w.dog + 6, w.dog + 28));
    case 'yes': case 'final': return 1;
  }
  return 0;
};
const doorWorld = (f, y) => add(CR, doorEdge(doorAt(f), y));

// ---------- whining: the panic shots ----------
const whineAt = (f) => { const id = shotAt(f).id; return (id === 'panic' && f >= w.ifp + 8) || id === 'toolong' ? 1 : 0; };

// ---------- camera-relative helpers (hands come from below the frame) ----------
const camVec = (f) => {
  const C = camAt(f), fw = C.look.map((v, i) => v - C.pos[i]), n = Math.hypot(...fw), F = fw.map((v) => v / n);
  const R0 = [-F[2], 0, F[0]], rn = Math.hypot(...R0), R = R0.map((v) => v / rn);
  const U = [R[1] * F[2] - R[2] * F[1], R[2] * F[0] - R[0] * F[2], R[0] * F[1] - R[1] * F[0]];
  return { C, F, R, U };
};
const OFF = (f) => { const { C, F, R, U } = camVec(f); return C.pos.map((v, i) => v + F[i] * 0.95 - U[i] * 0.6 + R[i] * 0.85); };
const HK = (f, keys) => KF(f, keys.map(([fr, p]) => [fr, p || OFF(f)]));

// ---------- the puppy ----------
export const dog3At = (f) => {
  if (globalThis.TEST?.dog) return globalThis.TEST.dog;
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { down: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85, ears: 0.3 * Math.max(0, Math.sin(f * 0.09)) ** 6 - 0.1 };
  const W = worldAt(f);
  const sw = (a, b, c = 0.05) => lerp(a, b, 0.5 + 0.5 * Math.sin(f * c));   // slow sweep
  const toTrainer = [TRN[0] + 0.2, 0.45, TRN[2] + 0.4];
  const lids = (a) => (f > a ? 0.5 + 0.15 * Math.sin(f * 0.05) : base.blink);   // sleepy half-closed eyes
  switch (S.id) {
    case 'hook': {
      return { ...base, look: f < 44 ? toTrainer : f < 60 ? [lerp(toTrainer[0], 1.2, sm(ramp(f, 44, 60))), 0.3, lerp(toTrainer[2], 2.6, sm(ramp(f, 44, 60)))] : [1.2, 0.3, 2.6], neck: 0.6,
        ears: f > w.leave + 18 ? 0.3 : -0.1, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2, blink: f > w.leave + 24 && f < w.leave + 32 ? 1 : base.blink };
    }
    case 'setup': return { ...base, pos: [1.25, MAT, -0.15], yaw: 0.5, w: { sit: 1 }, look: f < w.pet - 4 ? TOY_MAT : [1.85, 0.7, -0.75], neck: 1, wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    case 'shut': return { ...base, look: f < CL + 14 ? [0.8, 0.2, 1.0] : [1.2, 0.2, 0.9], neck: 0.45, wag: 0.4 * Math.sin(f * 0.3), blink: f > w.crate + 8 && f < w.crate + 15 ? 1 : base.blink };
    case 'step': return { ...base, look: [TRN[0] + 0.3, 0.5, TRN[2] + 0.5], neck: 0.6, ears: 0.3, wag: 0.3 * Math.sin(f * 0.3), tail: 0.15 };
    case 'alone': {   // ears perk and the head follows where he left (screen left), then it settles with the toy
      const k = sm(ramp(f, w.front, w.front + 12)), settle = sm(ramp(f, w.front + 30, w.front + 62));
      return { ...base, look: [lerp(-1.6, 0.9, settle), 0.3 - 0.1 * settle, lerp(1.1, 1.4, settle)], neck: 0.6, ears: 0.5 * k * (1 - settle) + 0.2 * Math.sin(f * 0.07) ** 2 * (1 - settle), headTilt: 6 * Math.sin(f * 0.1) * (1 - settle),
        wag: 0.15 * Math.sin(f * 0.3), blink: settle > 0.3 && blinkAt(f, 6) ? 1 : base.blink };
    }
    case 'back': return { ...base, look: toTrainer, neck: 0.6, wag: 0.5 * Math.sin(f * 0.3), tail: 0.25, ears: 0.2, blink: f > w.then1 + 24 && f < w.then1 + 31 ? 1 : base.blink };
    case 'times': return { ...base, look: [sw(1.0, 1.5, 0.04), 0.3, 1.4], neck: 0.6, ears: 0.3, breath: 0.3 + 0.3 * Math.sin(f * 0.12), blink: lids(w.thirty - 10), wag: 0.12 * Math.sin(f * 0.2) };
    case 'boring': return { ...base, look: [toTrainer[0], 0.4 + 0.05 * Math.sin(f * 0.04), toTrainer[2]], neck: 0.6, wag: 0.3 * Math.sin(f * 0.2), tail: 0.15, ears: 0.25 * Math.max(0, Math.sin(f * 0.13)) ** 2, headTilt: 5 * Math.sin(f * 0.06),
      blink: blinkAt(f, 5) ? 1 : base.blink };
    case 'cam': return { ...base, look: [sw(1.1, 1.5, 0.035), 0.3, sw(1.0, 1.4, 0.05)], neck: 0.55, ears: 0.3 * Math.max(0, Math.sin(f * 0.11)) ** 2, breath: 0.3 + 0.3 * Math.sin(f * 0.12), blink: lids(w.watch + 20), wag: 0.1 * Math.sin(f * 0.2) };
    case 'panic': {   // the puppy gets up and whines
      const up = sm(ramp(f, w.ifp, w.ifp + 28)), j = Math.abs(Math.sin(f * 0.5)) * up, wh = whineAt(f) ? Math.abs(Math.sin(f * 0.42)) : 0;
      return { ...base, w: { down: 1 - up, stand: up }, look: [sw(1.3, 1.7, 0.2), 0.1, 0.9], neck: 0.4, ears: -0.4 * up, wag: 0.2 * Math.sin(f * 0.7) * up, tail: 0.1, jaw: 0.4 * wh, pos: [DOGPOS[0], DOGPOS[1] + 0.05 * j, DOGPOS[2]] };
    }
    case 'toolong': {
      const j = Math.abs(Math.sin(f * 0.45)), wh = Math.abs(Math.sin(f * 0.42));
      return { ...base, w: { stand: 1 }, look: [sw(1.4, 1.8, 0.17), 0.1, sw(0.7, 1.3, 0.11)], neck: 0.4, ears: -0.4, wag: 0.2 * Math.sin(f * 0.7), tail: 0.1, jaw: 0.4 * wh, pos: [DOGPOS[0], DOGPOS[1] + 0.08 * j, DOGPOS[2]] };
    }
    case 'cutback': {   // the timer shrinks and the puppy lies back down
      const dn = sm(ramp(f, w.cut + 2, w.cut + 32));
      return { ...base, w: { down: dn, stand: 1 - dn }, look: [sw(1.2, 1.6, 0.06), 0.35, 1.2], neck: 0.6, ears: -0.4 * (1 - dn) + 0.3 * dn * Math.max(0, Math.sin(f * 0.11)) ** 2, wag: 0.3 * Math.sin(f * 0.25) * dn, tail: 0.1, blink: dn > 0.7 && blinkAt(f, 6) ? 1 : base.blink };
    }
    case 'build2': return { ...base, look: [sw(1.1, 1.5, 0.05), 0.3, 1.3], neck: 0.6, ears: 0.3, breath: 0.3 + 0.3 * Math.sin(f * 0.12), wag: 0.2 * Math.sin(f * 0.2) };
    case 'calmP': return { ...base, look: [sw(1.0, 1.4, 0.04), 0.15, 1.3], neck: 0.5, blink: lids(w.slow2 + 6), breath: 0.35 + 0.35 * Math.sin(f * 0.12), ears: 0.4, wag: 0.25 * Math.sin(f * 0.1) };
    case 'back2': return { ...base, look: toTrainer, neck: 0.6, wag: 0.4 * Math.sin(f * 0.25), tail: 0.2, ears: 0.2, blink: f > w.when + 14 && f < w.when + 21 ? 1 : base.blink };
    case 'open': return { ...base, look: [1.5, 0.12, 0.9], neck: 0.45, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2, ears: 0.3 };
    case 'yes': return { ...base, look: [TRN[0] + 0.3, 0.7, TRN[2] + 0.3], neck: 0.7, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    case 'final': {
      const t0 = w.reward + 4, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, look: W.treat && !W.treatHide ? W.treat : [1.2, 0.15, 0.9], neck: 0.85, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- props: toy, treat, hand ----------
const toyPath = (f) => {
  const id = shotAt(f).id;
  if (id === 'setup') return f < w.pet - 4 ? { pos: TOY_MAT, yaw: 0.6 } : null;
  return { pos: TOY_IN, yaw: 0.5 };
};
const treatPath = (f) => (shotAt(f).id === 'final' ? HK(f, [[w.then2, null], [w.reward + 2, MOUTH()]]) : null);
// the hand: below the frame at a, on the door latch from b to c (following the swinging door), below the frame again at d
const follow = (f, a, b, c, d) => {
  const at = (g) => add(doorWorld(g, 0.2), [0.1, 0, 0.0]);
  if (f < b) return HK(f, [[a, null], [b, at(b)]]);
  if (f <= c) return at(f);
  return HK(f, [[c, at(c)], [d, null]]);
};
const handFor = (f) => {
  const S = shotAt(f).id, t = treatPath(f);
  if (S === 'shut') return { at: follow(f, CL - 14, CL - 4, w.crate + 6, w.crate + 22), pose: 'relax', side: 0.16 };
  if (S === 'open') return { at: follow(f, w.dog - 2, w.dog + 4, w.dog + 28, w.dog + 33), pose: 'relax', side: 0.16 };
  if (S === 'final') return t && { treat: t, side: 0.22 };
  return null;
};
export const worldAt = (f) => {
  if (globalThis.TEST?.W) return globalThis.TEST.W;
  const S = shotAt(f), W = {};
  W.crate = { pos: CR, yaw: 0, door: doorAt(f) };
  const toy = toyPath(f); if (toy) W.toy = toy;
  const t = treatPath(f); if (t) W.treat = t;
  const hd = handFor(f); if (hd) W.hand = hd;
  if (S.id === 'final' && f >= w.reward + 4) W.treatHide = true;
  return W;
};

// ---------- the 2D trainer (hook, step, back, boring, back2, yes) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5;
  return { kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 4,
    near: { to: [318, 690 - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present', lean: 6 };
};
const trainerAt = (f) => {
  const hi = idle(f, 3), id = shotAt(f).id;
  const o = { hose: true, kneel: 1, expr: 'smile', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.2, headTilt: hi.headTilt, near: 'present', far: 'present', lean: 6 };
  if (id === 'hook') { o.expr = f > 30 ? 'grin' : 'smile'; o.look = f > 40 ? -0.2 : 0.8; o.near = f > w.leave + 20 ? 'present' : { to: [270, 806], hand: 'fist', bend: -1 }; }
  if (id === 'step') { o.expr = 'smile'; o.look = 0.9; o.lean = 8; }
  if (id === 'back' || id === 'back2') { o.expr = f < w.then1 + 12 || (id === 'back2' && f < w.when + 12) ? 'grin' : 'smile'; o.talk = talkAt(f) * 0.5; o.lean = 4; }
  if (id === 'boring') { o.expr = 'focus'; o.talk = talkAt(f) * 0.35; o.lean = 3; o.look = f < w.hellos ? -0.4 : -0.2; }
  return o;
};

// ---------- cameras ----------
const HC = (a, b) => [{ f: a, pos: [1.8, 0.65, 2.3], look: [-0.32, 0.9, 0.1], fov: 52 }, { f: b, pos: [1.62, 0.62, 2.08], look: [-0.35, 0.88, 0.1], fov: 52 }];   // trainer beside the crate (Crate II hook)
const PV = (a, b, l0 = [0.25, 0.28, 0.0], l1 = [0.27, 0.24, 0.0]) => [{ f: a, pos: [1.3, 0.88, 0.56], look: l0, fov: 42 }, { f: b, pos: [1.24, 0.82, 0.53], look: l1, fov: 42 }];   // gold POV keys
const CAMS = {
  hook: [{ f: 0, pos: [1.8, 0.65, 2.3], look: [-0.32, 0.9, 0.1], fov: 52 }, { f: w.leave + 24, pos: [1.75, 0.64, 2.25], look: [-0.32, 0.9, 0.1], fov: 52 }, { f: w.grab - 1, pos: [1.6, 0.62, 2.05], look: [-0.35, 0.88, 0.1], fov: 52 }],
  setup: [{ f: w.grab, pos: [1.5, 0.38, 1.25], look: [0.95, 0.07, 0.5], fov: 36 }, { f: w.pet - 5, pos: [1.45, 0.36, 1.2], look: [0.95, 0.07, 0.5], fov: 36 },
    { f: w.pet - 4, pos: [2.75, 0.98, 0.4], look: [1.85, 0.68, -0.75], fov: 40 }, { f: w.settle - 1, pos: [2.6, 0.95, 0.25], look: [1.85, 0.66, -0.75], fov: 40 }],
  shut: PV(w.settle, w.step - 1),
  step: HC(w.step, w.front - 1),
  alone: [{ f: w.front, pos: [3.0, 0.8, 0.2], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.then1 - 1, pos: [2.8, 0.78, 0.2], look: [0.3, 0.78, 0.0], fov: 42 }],
  back: HC(w.then1, w.slowly - 1),
  times: [{ f: w.slowly, pos: [2.9, 1.0, 1.3], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.ten - 4, pos: [2.82, 0.98, 1.27], look: [0.3, 0.78, 0.0], fov: 42 },
    { f: w.ten - 3, pos: [3.0, 0.8, 0.2], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.thirty - 5, pos: [2.92, 0.8, 0.18], look: [0.3, 0.78, 0.0], fov: 42 },
    { f: w.thirty - 4, pos: [1.9, 1.4, 2.4], look: [0.1, 0.78, 0.0], fov: 42 }, { f: w.keep - 1, pos: [1.85, 1.38, 2.3], look: [0.1, 0.78, 0.0], fov: 42 }],
  boring: [{ f: w.keep, pos: [1.8, 0.65, 2.3], look: [-0.32, 0.9, 0.1], fov: 52 }, { f: w.hellos, pos: [1.72, 0.64, 2.2], look: [-0.33, 0.89, 0.1], fov: 52 }, { f: w.watch - 1, pos: [1.62, 0.62, 2.08], look: [-0.35, 0.88, 0.1], fov: 52 }],
  cam: [{ f: w.watch, pos: [2.7, 0.72, 0.2], look: [0.22, 0.34, 0.0], fov: 31 }, { f: w.ifp - 1, pos: [2.4, 0.68, 0.2], look: [0.24, 0.34, 0.0], fov: 26 }],
  panic: PV(w.ifp, w.you - 1, [0.25, 0.35, 0.0], [0.27, 0.3, 0.0]),
  toolong: [{ f: w.you, pos: [2.9, 1.0, 1.3], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.cut - 1, pos: [2.82, 0.98, 1.27], look: [0.3, 0.78, 0.0], fov: 42 }],
  cutback: [{ f: w.cut, pos: [3.0, 0.8, 0.2], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.build - 1, pos: [2.85, 0.78, 0.2], look: [0.3, 0.78, 0.0], fov: 42 }],
  build2: [{ f: w.build, pos: [1.9, 1.4, 2.4], look: [0.1, 0.78, 0.0], fov: 42 }, { f: w.slow2 - 1, pos: [1.85, 1.38, 2.3], look: [0.1, 0.78, 0.0], fov: 42 }],
  calmP: PV(w.slow2, w.when - 1, [0.28, 0.25, 0.0], [0.3, 0.22, 0.0]),
  back2: HC(w.when, w.dog - 1),
  open: PV(w.dog, w.say - 1),
  yes: [{ f: w.say, pos: [1.8, 0.65, 2.3], look: [-0.32, 0.9, 0.1], fov: 52 }, { f: w.then2 - 1, pos: [1.65, 0.63, 2.1], look: [-0.34, 0.88, 0.1], fov: 52 }],
  final: PV(w.then2, TOTAL - 1, [0.4, 0.3, 0.0], [0.4, 0.3, 0.0]),
};
const HANDCAMS = ['shut', 'open', 'final'];
export const camAt = (f) => {
  if (globalThis.TEST?.cam) return globalThis.TEST.cam;
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (HANDCAMS.includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (['hook', 'step', 'back', 'boring', 'back2', 'yes'].includes(S.id)) return { focus: dist(C.pos, [0.3, 0.35, -0.1]), cinf: 5 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  return { focus: dist(C.pos, [0.25, 0.35, 0.0]), cinf: 4 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
const TRAINER_SHOTS = ['hook', 'step', 'back', 'boring', 'back2'];
export const actorsAt = (f, T) => {
  CUR = camAt(f).pos; TCUR = TRN;
  const S = shotAt(f), out = [];
  const put = (tO) => out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: 0.85, flip: false, order: 1, ground: MAT, blobW: 0.8 });
  if (S.id === 'yes') put(roundAll({ ...trainerYes(f), mirror: false }));
  if (TRAINER_SHOTS.includes(S.id)) put(roundAll({ ...trainerAt(f), mirror: false }));
  return out;
};
const BUB_YES = [TRN[0] + 0.45, 0.7, TRN[2] + 0.1];
// cards are anchored at their feet: FXc places the badge CENTRE (design point 300,500) at `pos`
const FXc = (key, draw, pos, s, extra = {}) => FX(key, draw, [pos[0], pos[1] - 1.1 * s, pos[2]], s, extra);
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
const PETCAM = [1.85, 0.68, -0.75];   // the pet camera card in the setup shot
const TIMES = [[w.five - 3, w.ten - 3, '5 min'], [w.ten - 3, w.twenty - 3, '10 min'], [w.twenty - 3, w.thirty - 4, '20 min'], [w.thirty - 4, w.keep - 2, '30 min']];
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FXc(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.09, rise = 0.22) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.09, at[1] + 0.06 + k * rise, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const side = (p, k) => { const { R } = camVec(f); return add(p, R.map((v) => v * k)); };   // slide an anchor sideways (screen right) so FX never sit on the muzzle
  const sigh = (a, b, at, k = 0.11) => { if (f >= a && f < b) { const t = q(ramp(f, a, b), 2); out.push(FXc('si' + t, (p) => T.fxSigh(p, t), side(at, k), 0.16)); } };
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  const timers = (list, s = 0.5) => { for (const [a, b, label] of list) if (f >= a && f < b) { const k = pop(a, b), prog = q(ramp(f, a + 4, b - 6), 2); if (k > 0.02) out.push(FXc('tm' + label + k + prog, (p) => T.fxTimer(p, label, prog), [0.2, 1.15, 0.1], s * k, { roll: 0 })); } };
  const MUZ = add(NOSE('stand'), [0.03, 0.0, -0.04]);
  const FACE = add(NOSE('down'), [0.1, 0.02, 0.1]);
  const TOP = [0.15, 1.1, 0.0];                 // badge anchor above the crate in the wide trainer cameras
  const POVB = [0.5, 0.66, 0.0];                // badge anchor above the puppy in the POV cameras
  if (S.id === 'hook') sigh(w.leave + 22, w.leave + 52, FACE);
  if (S.id === 'setup') {
    badge(T.fxCheck, 'ok', w.chew + 4, w.pet - 2, [TOY_MAT[0] + 0.05, 0.2, TOY_MAT[2]], 0.12);
    if (f >= w.pet - 3) { const k = q(sm(ramp(f, w.pet - 3, w.pet + 13)) * (1 - sm(ramp(f, w.settle, w.settle + 6))), 2), t = q((f / 20) % 1, 1); if (k > 0.02) out.push(FXc('pc' + k + t, (p) => T.fxPetCam(p, t), PETCAM, 0.45 * k, { roll: q(0.07 * Math.sin(f * 0.07), 2) })); }
    badge(T.fxCheck, 'ok2', w.ifw + 8, w.settle + 6, [PETCAM[0], 0.93, PETCAM[2]], 0.13);
  }
  if (S.id === 'shut') hearts(w.crate + 16, add(HEADP(), [0, -0.08, 0]), 3, 0.08, 0.07);
  if (S.id === 'alone') { timers([[w.one - 3, w.then1 - 2, '1-2 min']]); sigh(w.front + 36, w.front + 66, FACE); }
  if (S.id === 'back') sigh(w.back, w.back + 28, FACE);
  if (S.id === 'times') timers(TIMES);
  if (S.id === 'boring') { badge(T.fxCheck, 'okb', w.boring, w.watch - 4, TOP, 0.3); sigh(w.hellos + 4, w.hellos + 34, FACE); }
  if (S.id === 'cam') {
    const { C, F } = camVec(f), s = 0.29 * Math.tan(C.fov * Math.PI / 360) / 0.268, cp = C.pos.map((v, i) => v + F[i] * 1.3);   // hollow frame fixed in front of the camera (the push-in happens inside it)
    out.push(FX('cf' + q((f / 30) % 1, 1), (p) => T.fxCamFrame(p, (f / 30) % 1), [cp[0], cp[1] - 1.1 * s, cp[2]], s, { roll: 0 }));
    sigh(w.watch + 24, w.watch + 54, FACE);
  }
  if (S.id === 'panic') { badge(T.fxCross, 'no', w.panics - 2, w.you - 3, POVB, 0.14); if (whineAt(f)) { const t = q((f * 0.045) % 1, 2); out.push(FXc('wh' + t, (p) => T.fxWhine(p, t), MUZ, 0.3)); } }
  if (S.id === 'toolong') {
    timers([[w.you - 1, w.cut - 2, '2 hrs']]);
    if (whineAt(f)) { const t = q((f * 0.045) % 1, 2); out.push(FXc('wh' + t, (p) => T.fxWhine(p, t), side(MUZ, 0.16), 0.5)); }
  }
  if (S.id === 'cutback') { timers([[w.cut + 2, w.backw + 8, '5 min']], 0.4); badge(T.fxCheck, 'ok5', w.backw + 8, w.build - 2, [0.2, 1.15, 0.1], 0.2); }
  if (S.id === 'build2') timers([[w.build - 1, w.build + 15, '5 min'], [w.build + 15, w.slow2 - 1, '10 min']], 0.4);
  if (S.id === 'calmP') { badge(T.fxCheck, 'ok4', w.slow2 + 6, w.when - 4, [0.5, 0.64, -0.06], 0.11); sigh(w.slow2 + 2, w.slow2 + 32, FACE, 0.04); }
  if (S.id === 'back2') hearts(w.come + 4, HEADP());
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.55);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FXc('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.5, 1.0, TRN[2] + 0.2], 0.3)); }
  if (S.id === 'final') {
    hearts(w.reward + 5, add(HEADP(), [0, -0.1, 0]), 4, 0.08, 0.08);
    if (f >= w.reward) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('down'), [0.05, 0.15, -0.3 + i * 0.3]), 0.5, { order: 7 })); }
  }
  return out;
};
