// "Crate III" — stay calm in the crate while you leave the room. Clone of Crate II (crate.js, timer badges, cameras). 1109 frames, timed to voice.mp3 (Holden).
// Word frames (round(s*30); sentence-start words from the silence_end before them):
// Let's 0 crate 65 leave 85 room 97 | Grab 139 chew 146 toy 151 treats 172 | Close 213 crate 226 door 230 | then 256 step 258 out 265 sight 274 thirty 289 seconds 299 |
// Come 337 back 339 calmly 346 | Work 392 one 405 then 431 two 435 then 464 five 467 minutes 482 | Always 525 return 531 before 544 gets 574 upset 582 |
// Mix 620 short 623 long 647 absences 655 predict 707 length 721 | If 752 big 764 fuss 769 return 791 coming 817 becomes 830 exciting 842 | Keep 885 calm 892 quiet 922 |
// When 963 come 967 calm 989 dog 996 | say 1023 yes 1027 click 1054 | then 1081 reward 1083 | end 1108.
// RE-TIME: run transcribe.py on a new voice, update TOTAL and `w`. Every shot/action is keyed to `w`. Hard cuts only. The trainer never walks or slides: he is cut out of frame.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
import { CRATE, doorEdge } from './crate.js';
export const FPS = 30, TOTAL = 1109, DECK = 0;
const w = {
  crate1: 65, leave: 85, grab: 139, toy1: 151, treats: 172, close: 213, door2: 230, then1: 256, sight: 274, thirty: 289, come: 337, calmly: 346,
  work: 392, one: 405, t1: 431, two: 435, t2: 464, five: 467, always: 525, ret1: 531, before: 544, gets: 574, upset: 582,
  mix: 620, short: 623, long: 647, abs: 655, predict: 707, length: 721, if: 752, big: 764, fuss: 769, ret2: 791, coming: 817, exciting: 842,
  keep: 885, calm1: 892, quiet: 922, when: 963, comeb: 967, calm2: 989, dog: 996, say: 1023, yes: 1027, click: 1054, then2: 1081, reward: 1083, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },              // trainer beside the crate, door swings shut
  { id: 'setup', a: w.grab, b: w.close - 1, light: 'day' },       // toy, then treat jar
  { id: 'shut', a: w.close, b: w.then1 - 1, light: 'day' },       // POV: hand swings the door shut
  { id: 'step', a: w.then1, b: w.sight - 1, light: 'day' },       // trainer waves, looks away (then a hard cut)
  { id: 'alone', a: w.sight, b: w.come - 1, light: 'day' },       // puppy alone, ears + head track where he left, "30 sec"
  { id: 'back', a: w.come, b: w.work - 1, light: 'day' },         // hard cut back: kneeling trainer, calm return
  { id: 'times', a: w.work, b: w.always - 1, light: 'day' },      // 1 min, 2 min, 5 min badges
  { id: 'upset', a: w.always, b: w.mix - 1, light: 'day' },       // return BEFORE upset: check, then a tiny whine cue
  { id: 'mixA', a: w.mix, b: w.predict - 1, light: 'day' },       // short + long absences: mixed badges
  { id: 'mixB', a: w.predict, b: w.if - 1, light: 'day' },        // puppy can't predict: head tilts, looks around
  { id: 'fuss', a: w.if, b: w.coming - 1, light: 'day' },         // MISTAKE: excited trainer, puppy jumps up
  { id: 'excite', a: w.coming, b: w.keep - 1, light: 'day' },     // MISTAKE: puppy bouncing, red cross
  { id: 'calmT', a: w.keep, b: w.quiet - 1, light: 'day' },       // FIX: calm trainer, calm puppy
  { id: 'calmP', a: w.quiet, b: w.when - 1, light: 'day' },       // FIX: calm puppy close, green check
  { id: 'back2', a: w.when, b: w.calm2 - 1, light: 'day' },       // back to a calm dog
  { id: 'open', a: w.calm2, b: w.say - 1, light: 'day' },         // POV: hand opens the door
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
const doorAt = (f) => {
  switch (shotAt(f).id) {
    case 'hook': return 0.55 * (1 - sm(ramp(f, w.crate1 - 8, w.crate1 + 18)));
    case 'setup': return 1;
    case 'shut': return 1 - sm(ramp(f, w.close - 4, w.door2 + 6));
    case 'open': return sm(ramp(f, w.calm2 + 6, w.calm2 + 28));
    case 'yes': case 'final': return 1;
  }
  return 0;
};
const doorWorld = (f, y) => add(CR, doorEdge(doorAt(f), y));

// ---------- whining: only the short cue just before "upset" ----------
const whineAt = (f) => (shotAt(f).id === 'upset' && f >= w.gets + 4 && f < w.upset + 22 ? 1 : 0);

// ---------- camera-relative helpers (hands come from below the frame) ----------
const camVec = (f) => {
  const C = camAt(f), fw = C.look.map((v, i) => v - C.pos[i]), n = Math.hypot(...fw), F = fw.map((v) => v / n);
  const R0 = [-F[2], 0, F[0]], rn = Math.hypot(...R0), R = R0.map((v) => v / rn);
  const U = [R[1] * F[2] - R[2] * F[1], R[2] * F[0] - R[0] * F[2], R[0] * F[1] - R[1] * F[0]];
  return { C, F, R, U };
};
const OFF = (f) => { const { C, F, R, U } = camVec(f); return C.pos.map((v, i) => v + F[i] * 0.95 - U[i] * 0.9 + R[i] * 0.25); };
const HK = (f, keys) => KF(f, keys.map(([fr, p]) => [fr, p || OFF(f)]));

// ---------- the puppy ----------
export const dog3At = (f) => {
  if (globalThis.TEST?.dog) return globalThis.TEST.dog;
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { down: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85, ears: 0.3 * Math.max(0, Math.sin(f * 0.09)) ** 6 - 0.1 };
  const W = worldAt(f);
  const sw = (a, b, c = 0.05) => lerp(a, b, 0.5 + 0.5 * Math.sin(f * c));   // slow sweep
  const toTrainer = [TRN[0] + 0.2, 0.45, TRN[2] + 0.4];
  switch (S.id) {
    case 'hook': {
      return { ...base, look: f < 44 ? toTrainer : f < 60 ? [lerp(toTrainer[0], 1.2, sm(ramp(f, 44, 60))), 0.3, lerp(toTrainer[2], 2.6, sm(ramp(f, 44, 60)))] : [1.2, 0.3, 2.6], neck: 0.6,
        ears: f > w.crate1 + 18 ? 0.3 : -0.1, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2, blink: f > w.crate1 + 24 && f < w.crate1 + 32 ? 1 : base.blink };
    }
    case 'setup': return { ...base, pos: [1.25, MAT, -0.15], yaw: 0.5, w: { sit: 1 }, look: f < w.treats - 8 ? TOY_MAT : [1.85, 0.7, -0.75], neck: 1, wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    case 'shut': return { ...base, look: f < w.close + 14 ? [0.8, 0.4, 1.0] : [1.2, 0.4, 0.9], neck: 0.6, wag: 0.4 * Math.sin(f * 0.3), blink: f > w.door2 + 8 && f < w.door2 + 15 ? 1 : base.blink };
    case 'step': return { ...base, look: [TRN[0] + 0.3, 0.5, TRN[2] + 0.5], neck: 0.6, ears: 0.3, wag: 0.3 * Math.sin(f * 0.3), tail: 0.15 };
    case 'alone': {   // ears perk and the head follows where he left (screen left), then it settles with the toy
      const k = sm(ramp(f, w.sight, w.sight + 12)), settle = sm(ramp(f, w.sight + 40, w.thirty + 30));
      return { ...base, w: { down: 1 - 0.0 }, look: [lerp(-1.6, 0.9, settle), 0.3 - 0.1 * settle, lerp(1.1, 1.4, settle)], neck: 0.6, ears: 0.5 * k * (1 - settle) + 0.2 * Math.sin(f * 0.07) ** 2 * (1 - settle), headTilt: 6 * Math.sin(f * 0.1) * (1 - settle),
        wag: 0.15 * Math.sin(f * 0.3), blink: settle > 0.3 && blinkAt(f, 6) ? 1 : base.blink };
    }
    case 'back': return { ...base, look: toTrainer, neck: 0.6, wag: 0.5 * Math.sin(f * 0.3), tail: 0.25, ears: 0.2, blink: f > w.come + 30 && f < w.come + 37 ? 1 : base.blink };
    case 'times': return { ...base, look: [1.4, 0.4, 1.4], neck: 0.6, ears: 0.3, breath: 0.3 + 0.3 * Math.sin(f * 0.12), blink: f > w.t1 + 4 && f < w.t1 + 14 ? 1 : base.blink };
    case 'upset': {
      const sit = sm(ramp(f, w.gets - 4, w.gets + 10)), wh = whineAt(f) ? Math.abs(Math.sin(f * 0.42)) : 0;
      return { ...base, w: { down: 1 - sit, sit }, look: [sw(0.9, 1.4, 0.04), 0.15, 1.3], neck: 0.5, ears: -0.4 * sit, headTilt: 8 * sit * Math.sin(f * 0.21), jaw: 0.2 * wh, tail: 0.1, wag: f < w.gets ? 0.5 * Math.sin(f * 0.4) : 0.1 };
    }
    case 'mixA': return { ...base, look: [sw(0.6, 1.5, 0.06), 0.3, 1.4], neck: 0.6, ears: 0.3, breath: 0.3 + 0.3 * Math.sin(f * 0.12) };
    case 'mixB': {   // can't predict: head tilts left then right, ears swivel
      const t = Math.sin(f * 0.07);
      return { ...base, look: [0.9 + 0.7 * t, 0.3, 1.3], neck: 0.6, headTilt: 14 * Math.sin(f * 0.11), ears: 0.3 + 0.3 * Math.sin(f * 0.15), tail: 0.1 };
    }
    case 'fuss': {
      const up = sm(ramp(f, w.big, w.big + 24)), j = Math.abs(Math.sin(f * 0.5)) * up;
      return { ...base, w: { down: 1 - up, stand: up }, look: toTrainer, neck: 0.6, ears: 0.2, wag: Math.sin(f * 0.9) * 1.2 * up, tail: 0.1 + 0.3 * up, pos: [DOGPOS[0], DOGPOS[1] + 0.1 * j, DOGPOS[2]] };
    }
    case 'excite': {
      const j = Math.abs(Math.sin(f * 0.45));
      return { ...base, w: { stand: 1 }, look: [1.5, 0.4, 0.9], neck: 0.6, ears: 0.1, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, pos: [DOGPOS[0], DOGPOS[1] + 0.1 * j, DOGPOS[2]], jaw: 0.4 };
    }
    case 'calmT': return { ...base, look: toTrainer, neck: 0.6, wag: 0.3 * Math.sin(f * 0.2), ears: 0.2, blink: f > w.calm1 + 14 && f < w.calm1 + 21 ? 1 : base.blink };
    case 'calmP': {
      const lid = f > w.quiet + 6 ? 0.5 + 0.15 * Math.sin(f * 0.05) : base.blink;
      return { ...base, look: [sw(1.0, 1.4, 0.04), 0.15, 1.3], neck: 0.5, blink: lid, breath: 0.35 + 0.35 * Math.sin(f * 0.12), ears: 0.4, wag: 0.25 * Math.sin(f * 0.1) };
    }
    case 'back2': return { ...base, look: toTrainer, neck: 0.6, wag: 0.4 * Math.sin(f * 0.25), tail: 0.2, ears: 0.2, blink: f > w.when + 14 && f < w.when + 21 ? 1 : base.blink };
    case 'open': return { ...base, look: [1.5, 0.35, 0.9], neck: 0.6, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2, ears: 0.3 };
    case 'yes': return { ...base, look: [TRN[0] + 0.3, 0.7, TRN[2] + 0.3], neck: 0.7, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    case 'final': {
      const t0 = w.reward + 4, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, look: W.treat && !W.treatHide ? W.treat : [1.2, 0.5, 0.9], neck: 0.85, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- props: toy, treat, hand ----------
const toyPath = (f) => {
  const id = shotAt(f).id;
  if (id === 'setup') return f < w.treats - 8 ? { pos: TOY_MAT, yaw: 0.6 } : null;
  if (id === 'hook') return { pos: TOY_IN, yaw: 0.5 };
  return { pos: TOY_IN, yaw: 0.5 };
};
const treatPath = (f) => (shotAt(f).id === 'final' ? HK(f, [[w.then2, null], [w.reward + 2, MOUTH()]]) : null);
// the hand: below the frame at a, on the door latch from b to c (following the swinging door), below the frame again at d
const follow = (f, a, b, c, d) => {
  const at = (g) => add(doorWorld(g, 0.3), [0.04, 0, 0.0]);
  if (f < b) return HK(f, [[a, null], [b, at(b)]]);
  if (f <= c) return at(f);
  return HK(f, [[c, at(c)], [d, null]]);
};
const handFor = (f) => {
  const S = shotAt(f).id, t = treatPath(f);
  if (S === 'shut') return { at: follow(f, w.close - 14, w.close - 4, w.door2 + 6, w.door2 + 22), pose: 'relax', side: 0.16 };
  if (S === 'open') return { at: follow(f, w.calm2 - 2, w.calm2 + 4, w.calm2 + 28, w.calm2 + 33), pose: 'relax', side: 0.16 };
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

// ---------- the 2D trainer (hook, step, back, fuss, calm, yes) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5;
  return { kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 4,
    near: { to: [318, 690 - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present', lean: 6 };
};
const trainerAt = (f) => {
  const hi = idle(f, 3), id = shotAt(f).id;
  const o = { hose: true, kneel: 1, expr: 'smile', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.2, headTilt: hi.headTilt, near: 'thumb', far: 'present', lean: 6 };
  if (id === 'hook') { o.expr = f > 30 ? 'grin' : 'smile'; o.look = f > 40 ? -0.2 : 0.8; o.near = f > w.crate1 + 20 ? 'thumb' : { to: [270, 806], hand: 'fist', bend: -1 }; }
  if (id === 'step') { o.expr = 'smile'; o.far = 'wave'; o.look = 0.9; o.lean = 10; }
  if (id === 'back' || id === 'back2') { o.expr = f < w.come + 12 ? 'grin' : 'smile'; o.talk = talkAt(f) * 0.5; o.lean = 4; }
  if (id === 'fuss') { const k = ramp(f, w.big - 6, w.big + 12); o.expr = 'yes'; o.far = k > 0 ? 'wave' : 'present'; o.near = k > 0 ? 'wave' : 'thumb'; o.lean = 8 + 10 * k * Math.abs(Math.sin(f * 0.5)); o.talk = 1; }
  if (id === 'calmT') { o.expr = f < w.calm1 ? 'oops' : 'smile'; o.talk = talkAt(f) * 0.4; o.far = 'present'; o.lean = 3; }
  return o;
};

// ---------- cameras ----------
const HC = (a, b) => [{ f: a, pos: [1.8, 0.65, 2.3], look: [-0.32, 0.9, 0.1], fov: 52 }, { f: b, pos: [1.62, 0.62, 2.08], look: [-0.35, 0.88, 0.1], fov: 52 }];   // trainer beside the crate (Crate II hook)
const PV = (a, b, l0 = [0.25, 0.28, 0.0], l1 = [0.27, 0.24, 0.0]) => [{ f: a, pos: [1.3, 0.88, 0.56], look: l0, fov: 42 }, { f: b, pos: [1.24, 0.82, 0.53], look: l1, fov: 42 }];   // gold POV keys
const CAMS = {
  hook: [{ f: 0, pos: [1.8, 0.65, 2.3], look: [-0.32, 0.9, 0.1], fov: 52 }, { f: w.crate1 + 24, pos: [1.75, 0.64, 2.25], look: [-0.32, 0.9, 0.1], fov: 52 }, { f: w.grab - 1, pos: [1.6, 0.62, 2.05], look: [-0.35, 0.88, 0.1], fov: 52 }],
  setup: [{ f: w.grab, pos: [1.5, 0.38, 1.25], look: [0.95, 0.07, 0.5], fov: 36 }, { f: w.treats - 9, pos: [1.45, 0.36, 1.2], look: [0.95, 0.07, 0.5], fov: 36 },
    { f: w.treats - 8, pos: [2.75, 0.98, 0.4], look: [1.85, 0.68, -0.75], fov: 40 }, { f: w.close - 1, pos: [2.68, 0.96, 0.3], look: [1.85, 0.66, -0.75], fov: 40 }],
  shut: PV(w.close, w.then1 - 1),
  step: HC(w.then1, w.sight - 1),
  alone: [{ f: w.sight, pos: [3.0, 0.8, 0.2], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.come - 1, pos: [2.8, 0.78, 0.2], look: [0.3, 0.78, 0.0], fov: 42 }],
  back: HC(w.come, w.work - 1),
  times: [{ f: w.work, pos: [2.9, 1.0, 1.3], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.t1 - 1, pos: [2.82, 0.98, 1.27], look: [0.3, 0.78, 0.0], fov: 42 },
    { f: w.t1, pos: [3.0, 0.8, 0.2], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.t2 - 1, pos: [2.92, 0.8, 0.18], look: [0.3, 0.78, 0.0], fov: 42 },
    { f: w.t2, pos: [1.9, 1.4, 2.4], look: [0.1, 0.78, 0.0], fov: 42 }, { f: w.always - 1, pos: [1.85, 1.38, 2.3], look: [0.1, 0.78, 0.0], fov: 42 }],
  upset: PV(w.always, w.mix - 1),
  mixA: [{ f: w.mix, pos: [2.9, 1.0, 1.3], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.predict - 1, pos: [2.82, 0.98, 1.27], look: [0.3, 0.78, 0.0], fov: 42 }],
  mixB: PV(w.predict, w.if - 1, [0.3, 0.3, 0.0], [0.3, 0.26, 0.0]),
  fuss: HC(w.if, w.coming - 1),
  excite: PV(w.coming, w.keep - 1, [0.25, 0.35, 0.0], [0.27, 0.3, 0.0]),
  calmT: HC(w.keep, w.quiet - 1),
  calmP: PV(w.quiet, w.when - 1, [0.28, 0.25, 0.0], [0.3, 0.22, 0.0]),
  back2: HC(w.when, w.calm2 - 1),
  open: PV(w.calm2, w.say - 1),
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
  if (['hook', 'step', 'back', 'fuss', 'calmT', 'back2', 'yes'].includes(S.id)) return { focus: dist(C.pos, [0.3, 0.35, -0.1]), cinf: 5 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  return { focus: dist(C.pos, [0.25, 0.35, 0.0]), cinf: 4 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
const TRAINER_SHOTS = ['hook', 'step', 'back', 'fuss', 'calmT', 'back2'];
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
const TIMES = [[w.one - 3, w.t1 - 2, '1 min'], [w.two - 3, w.t2 - 2, '2 min'], [w.five - 3, w.always - 2, '5 min']];
const TIMES_MIX = [[w.short - 3, w.long - 3, '15 sec'], [w.long - 3, w.abs + 24, '4 min'], [w.abs + 26, w.predict - 4, '1 min']];
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FXc(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.09) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.09, at[1] + 0.06 + k * 0.22, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const sigh = (a, b, at) => { if (f >= a && f < b) { const t = q(ramp(f, a, b), 2); out.push(FXc('si' + t, (p) => T.fxSigh(p, t), at, 0.16)); } };
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  const timers = (list) => { for (const [a, b, label] of list) if (f >= a && f < b) { const k = pop(a, b), prog = q(ramp(f, a + 4, b - 6), 2); if (k > 0.02) out.push(FXc('tm' + label + k + prog, (p) => T.fxTimer(p, label, prog), [0.2, 1.15, 0.1], 0.5 * k, { roll: 0 })); } };
  const MUZ = add(NOSE('sit'), [0.03, 0.0, -0.12]);
  const FACE = add(NOSE('down'), [0.1, 0.02, 0.1]);
  const TOP = [0.15, 1.1, 0.0];                 // badge anchor above the crate in the wide trainer cameras
  const POVB = [0.5, 0.66, 0.0];                // badge anchor above the puppy in the POV cameras
  if (S.id === 'hook') sigh(w.crate1 + 22, w.crate1 + 52, FACE);
  if (S.id === 'setup') { badge(T.fxCheck, 'ok', w.toy1 + 4, w.treats - 8, [TOY_MAT[0] + 0.1, 0.3, TOY_MAT[2]], 0.14); badge(T.fxCheck, 'ok2', w.treats + 4, w.close, [1.85, 1.0, -0.55], 0.15); }
  if (S.id === 'shut') hearts(w.door2 + 16, HEADP());
  if (S.id === 'alone') { timers([[w.thirty - 3, w.come - 2, '30 sec']]); sigh(w.thirty + 40, w.thirty + 70, FACE); }
  if (S.id === 'back') sigh(w.calmly, w.calmly + 30, FACE);
  if (S.id === 'times') timers(TIMES);
  if (S.id === 'upset') { badge(T.fxCheck, 'ok3', w.ret1, w.gets - 6, POVB, 0.14); if (whineAt(f)) { const t = q((f * 0.045) % 1, 2); out.push(FXc('wh' + t, (p) => T.fxWhine(p, t), MUZ, 0.5)); } }
  if (S.id === 'mixA') timers(TIMES_MIX);
  if (S.id === 'fuss') badge(T.fxCross, 'no', w.big + 6, w.coming, TOP, 0.3);
  if (S.id === 'excite') badge(T.fxCross, 'no2', w.coming, w.keep - 4, POVB, 0.14);
  if (S.id === 'calmT') sigh(w.calm1 + 6, w.calm1 + 36, FACE);
  if (S.id === 'calmP') { badge(T.fxCheck, 'ok4', w.quiet + 6, w.when - 4, POVB, 0.14); sigh(w.quiet + 2, w.quiet + 32, FACE); }
  if (S.id === 'back2') hearts(w.dog, HEADP());
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.55);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FXc('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.5, 1.0, TRN[2] + 0.2], 0.3)); }
  if (S.id === 'final') {
    hearts(w.reward + 5, HEADP(), 4, 0.08);
    if (f >= w.reward) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('down'), [0.05, 0.15, -0.3 + i * 0.3]), 0.5, { order: 7 })); }
  }
  return out;
};
