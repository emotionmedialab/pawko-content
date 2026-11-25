// "Crate V" - rest in the crate for longer, the healthy way. Clone of Crate III (crate.js, timer badges, kneeling-trainer + POV cameras). 1090 frames, timed to voice.mp3 (Holden).
// Word frames (round(s*30); sentence-start words from the silence_end before them):
// Let's 0 rest 27 crate 44 longer 56 | The 82 healthy 83 | Grab 129 chew 136 toy 140 plan 160 exercise 174 | Leave 213 one 245 hour 252 toy 271 | Come 304 back 306 calmly 312 |
// Between 353 sessions 366 go 389 walk 404 play 418 | Keep 455 steady 463 routine 470 because 485 predictable 503 days 514 relax 547 | The 596 big 598 mistake 602 crating 619 long 638 |
// Puppies 668 one 690 hour 699 month 715 age 727 | Adults 755 four 775 six 788 hours 796 most 811 | Need 847 longer 849 | Ask 879 friend 888 dog 902 walker 911 help 926 |
// Back 966 calm 976 dog 982 | Say 1014 yes 1018 or 1030 click 1043 | then 1052 reward 1069 | end 1089.
// RE-TIME: run transcribe.py on a new voice, update TOTAL and `w`. Every shot/action is keyed to `w`. Hard cuts only. The trainer never walks or slides: he is cut out of frame.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
import { CRATE, doorEdge } from './crate.js';
export const FPS = 30, TOTAL = 1090, DECK = 0;
const w = {
  crate1: 44, grab: 129, toy1: 140, plan: 160, leave: 213, hourA: 242, one: 245, come: 304, calmly: 312, between: 353, sessions: 366, go: 389, play: 418,
  keep: 455, steady: 463, because: 485, predict: 503, days: 514, relax: 547, big: 598, crating: 619, mist: 602, puppies: 668, adults: 755, need: 847, ask: 879, friend: 888, walker: 911, help: 926,
  backW: 966, calm: 976, dogW: 982, open: 996, say: 1014, yes: 1018, click: 1043, then2: 1052, reward: 1069, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },              // trainer beside the crate, door swings shut
  { id: 'setup', a: w.grab, b: w.leave - 1, light: 'day' },       // chew toy on the mat, then the ball on the lawn (exercise)
  { id: 'shut', a: w.leave, b: w.hourA - 1, light: 'day' },       // POV: hand swings the door shut
  { id: 'hour', a: w.hourA, b: w.come - 1, light: 'day' },        // "1 hr" badge, puppy resting with the toy
  { id: 'back', a: w.come, b: w.between - 1, light: 'day' },      // hard cut back: kneeling trainer, calm return
  { id: 'sess', a: w.between, b: w.go - 1, light: 'day' },        // door open, happy puppy, session done (check)
  { id: 'trot', a: w.go, b: w.play - 1, light: 'day' },           // walk: puppy trots on the lawn
  { id: 'play', a: w.play, b: w.keep - 1, light: 'day' },         // play: chases the ball, hearts
  { id: 'routA', a: w.keep, b: w.days - 1, light: 'day' },        // steady routine: sun -> moon day-cycle card
  { id: 'routB', a: w.days, b: 595, light: 'day' },               // predictable days help dogs relax: calm puppy, check, hearts
  { id: 'mistake', a: 596, b: w.puppies - 1, light: 'day' },      // big mistake: "8 hr" timer, red cross, restless puppy
  { id: 'puppies', a: w.puppies, b: w.adults - 1, light: 'day' }, // info card: puppies
  { id: 'adults', a: w.adults, b: w.need - 1, light: 'day' },     // info card: adults
  { id: 'need', a: w.need, b: w.ask - 1, light: 'day' },          // need longer? puppy thinks
  { id: 'helper', a: w.ask, b: w.backW - 1, light: 'day' },       // an off-screen helper: puppy looks aside, tail wags, footsteps
  { id: 'back2', a: w.backW, b: w.open - 1, light: 'day' },       // back to a calm dog
  { id: 'open', a: w.open, b: w.say - 1, light: 'day' },          // POV: hand opens the door
  { id: 'yes', a: w.say, b: w.then2 - 1, light: 'golden' },       // trainer: "yes" + click
  { id: 'final', a: w.then2, b: TOTAL - 1, light: 'golden' },     // POV: reward through the open door
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const sm = M.smooth, lin = (t) => t;
const KF = (f, keys, ease = sm) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) { const [fa, va] = keys[i], [fb, vb] = keys[i + 1]; if (f <= fb) { const t = ease((f - fa) / (fb - fa)); return Array.isArray(va) ? va.map((v, k) => lerp(v, vb[k], t)) : lerp(va, vb, t); } }
  return keys[keys.length - 1][1];
};
const add = (a, b) => a.map((v, i) => v + b[i]);

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
const LZ = 1.7;                                            // lawn runs happen at this z, left of the crate
let CUR = [0, 1, 3], TCUR = TRN;
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
const MOUTH = () => add(NOSE('down'), [0.06, -0.02, 0.0]);
const HEADP = () => add(NOSE('down'), [-0.1, 0.09, 0]);           // hearts anchor
const HEADS = () => add(NOSE('stand'), [-0.1, 0.1, 0]);

// ---------- lawn runs (straight along +x at z = LZ), reset at every hard cut ----------
const dogP = (f) => {
  const S = shotAt(f);
  if (S.id === 'trot') return { x: lerp(-3.4, -2.0, clamp((f - S.a) / (S.b - S.a))), z: LZ };
  if (S.id === 'play') return { x: KF(f, [[S.a, -3.2], [w.play + 20, -2.25], [w.play + 28, -2.1]], lin), z: LZ };
  return { x: 0, z: 0 };
};
const DP = []; { let ph = 0; for (let f = 0; f <= TOTAL; f++) { const a = DP.length ? DP[f - 1] : dogP(0), b = dogP(f), same = f > 0 && shotAt(f).id === shotAt(f - 1).id, d = same ? Math.hypot(b.x - a.x, b.z - a.z) : 0; ph += d / 0.5; DP.push({ ...b, ph, sp: d * 30 }); } }
const DPf = (f) => DP[clamp(Math.round(f), 0, TOTAL)];
const BALL = (f) => {   // bouncing in the setup, thrown ahead of the puppy in "play"
  const id = shotAt(f).id;
  if (id === 'setup' && f >= w.plan) return [1.85, 0.09 + 0.22 * Math.abs(Math.sin((f - w.plan) * 0.13)), 0.9];
  if (id === 'play') { const x = KF(f, [[w.play, -2.55], [w.play + 18, -1.7], [w.play + 24, -1.65]], lin), t = f - w.play; return [x, 0.09 + (t < 22 ? 0.2 * Math.abs(Math.sin(t * 0.3)) * (1 - t / 22) : 0), LZ]; }
  return null;
};

// ---------- door ----------
const doorAt = (f) => {
  switch (shotAt(f).id) {
    case 'hook': return 0.55 * (1 - sm(ramp(f, w.crate1 - 8, w.crate1 + 18)));
    case 'setup': return 1;
    case 'shut': return 1 - sm(ramp(f, w.leave + 4, w.leave + 22));
    case 'sess': return 1;
    case 'open': return sm(ramp(f, w.open + 2, w.open + 16));
    case 'yes': case 'final': return 1;
  }
  return 0;
};
const doorWorld = (f, y) => add(CR, doorEdge(doorAt(f), y));

// ---------- whining (the restless puppy in the mistake) ----------
const whineAt = (f) => (shotAt(f).id === 'mistake' && f >= w.mist + 6 ? 1 : 0);

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
  const S = shotAt(f), d = DPf(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { down: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85, ears: 0.3 * Math.max(0, Math.sin(f * 0.09)) ** 6 - 0.1 };
  const W = worldAt(f);
  const sw = (a, b, c = 0.05) => lerp(a, b, 0.5 + 0.5 * Math.sin(f * c));   // slow sweep
  const toTrainer = [TRN[0] + 0.2, 0.45, TRN[2] + 0.4];
  const gk = clamp(d.sp / 0.5), gait = gk > 0.02 ? { phase: d.ph, amp: 24, lift: 1.1, k: gk } : undefined;
  const lawn = { ...base, pos: [d.x, 0, d.z], yaw: DOGYAW, w: { stand: 1 }, gait };
  switch (S.id) {
    case 'hook': {
      const t0 = w.crate1 - 21, t1 = w.crate1 - 5;
      return { ...base, look: f < t0 ? toTrainer : f < t1 ? [lerp(toTrainer[0], 1.2, sm(ramp(f, t0, t1))), 0.3, lerp(toTrainer[2], 2.6, sm(ramp(f, t0, t1)))] : [1.2, 0.3, 2.6], neck: 0.6,
        ears: f > w.crate1 + 18 ? 0.3 : -0.1, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2, blink: f > w.crate1 + 24 && f < w.crate1 + 32 ? 1 : base.blink };
    }
    case 'setup': {
      if (f < w.plan) return { ...base, pos: [1.25, MAT, -0.15], yaw: 0.5, w: { sit: 1 }, look: TOY_MAT, neck: 1, wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
      const b = BALL(f);   // puppy sits on the lawn, eyes follow the bouncing ball
      return { ...base, pos: [1.35, 0, 0.9], yaw: DOGYAW, w: { sit: 1 }, look: [b[0], b[1] * 0.6 + 0.1, b[2]], neck: 0.9, wag: 0.8 * Math.sin(f * 0.5), tail: 0.25, ears: 0.15 };
    }
    case 'shut': return { ...base, look: f < w.leave + 14 ? [0.8, 0.12, 1.0] : [1.2, 0.12, 0.9], neck: 0.5, wag: 0.4 * Math.sin(f * 0.3), blink: f > w.leave + 20 && f < w.leave + 27 ? 1 : base.blink };
    case 'hour': {   // resting with the chew toy: head down on it, slow eyelids
      const lid = f > w.one + 40 ? 0.45 + 0.15 * Math.sin(f * 0.05) : base.blink;
      return { ...base, look: [0.55 + 0.05 * Math.sin(f * 0.07), 0.1, 0.35], neck: 0.5, blink: lid, ears: 0.2, breath: 0.3 + 0.3 * Math.sin(f * 0.12), jaw: f > w.one + 8 && f < w.one + 40 ? 0.1 + 0.12 * Math.abs(Math.sin(f * 0.4)) : 0, wag: 0.2 * Math.sin(f * 0.2) };
    }
    case 'back': return { ...base, look: toTrainer, neck: 0.6, wag: 0.5 * Math.sin(f * 0.3), tail: 0.25, ears: 0.2, blink: f > w.come + 30 && f < w.come + 37 ? 1 : base.blink };
    case 'sess': {   // door open: up on all fours, tail wagging, glancing outside
      const up = sm(ramp(f, w.between + 2, w.between + 20));
      return { ...base, w: { down: 1 - up, stand: up }, look: [1.5, 0.25, 0.9 + 0.5 * Math.sin(f * 0.06)], neck: 0.6, wag: Math.sin(f * 0.8) * 0.9 * up, tail: 0.3, ears: 0.3 };
    }
    case 'trot': return { ...lawn, look: [d.x + 2.2, 0.12, d.z], neck: 0.5, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2 + 0.2 * Math.max(0, Math.sin(f * 0.14)) };
    case 'play': {
      const b = BALL(f), t = f - w.play, got = t > 26;
      return { ...lawn, look: [b[0], b[1], b[2]], neck: got ? 0.8 : 0.5, wag: Math.sin(f * 0.8) * (got ? 1.1 : 0.7), tail: 0.35, jaw: got ? 0.15 + 0.2 * Math.abs(Math.sin(t * 0.5)) : 0, ears: 0.2 * (got ? 0 : 1), blink: got && t > 30 && t < 36 ? 1 : base.blink };
    }
    case 'routA': return { ...base, look: [sw(0.9, 1.5, 0.03), 0.2, 1.3], neck: 0.6, ears: 0.2, breath: 0.3 + 0.3 * Math.sin(f * 0.12), blink: blinkAt(f, 6) ? 1 : 0 };
    case 'routB': {
      const lid = f > w.days + 20 ? 0.5 + 0.15 * Math.sin(f * 0.05) : base.blink;
      return { ...base, look: [sw(0.7, 1.6, 0.045), 0.15, sw(0.9, 1.6, 0.03)], neck: 0.5, blink: lid, breath: 0.35 + 0.35 * Math.sin(f * 0.12), ears: 0.4 + 0.3 * Math.max(0, Math.sin(f * 0.11)) ** 3, wag: 0.25 * Math.sin(f * 0.1), headTilt: 6 * Math.sin(f * 0.05), pos: [DOGPOS[0], DOGPOS[1], 0.03 * Math.sin(f * 0.06)] };
    }
    case 'mistake': {   // restless: sits up, shifts, head turns, whining
      const up = sm(ramp(f, w.mist - 4, w.mist + 14)), wh = whineAt(f) ? Math.abs(Math.sin(f * 0.42)) : 0;
      return { ...base, pos: [DOGPOS[0], DOGPOS[1], 0.05 * Math.sin(f * 0.09) * up], yaw: DOGYAW + 0.35 * Math.sin(f * 0.07) * up, w: { down: 1 - up, stand: up }, look: [sw(0.9, 1.5, 0.08), 0.2, sw(0.4, 1.6, 0.11)], neck: 0.5, ears: -0.4 * up, headTilt: 8 * up * Math.sin(f * 0.21), jaw: 0.2 * wh, tail: 0.05, wag: 0.1 };
    }
    case 'puppies': return { ...base, look: [sw(1.0, 1.5, 0.04), 0.25, 1.3], neck: 0.6, ears: 0.3, breath: 0.3 + 0.3 * Math.sin(f * 0.12), blink: blinkAt(f, 7) ? 1 : 0, wag: 0.7 * Math.sin(f * 0.3) * (Math.sin(f * 0.05) > 0 ? 1 : 0.3), tail: 0.25, ears: 0.3 + 0.4 * Math.max(0, Math.sin(f * 0.13)) ** 4 };
    case 'adults': return { ...base, look: [sw(1.2, 0.7, 0.035), 0.3, 1.2], neck: 0.6, ears: 0.25, breath: 0.3 + 0.3 * Math.sin(f * 0.1), blink: blinkAt(f, 9) ? 1 : 0, wag: 0.7 * Math.sin(f * 0.3) * (Math.sin(f * 0.05) > 0 ? 1 : 0.3), tail: 0.25 };
    case 'need': {   // thinking: sits up, head tilts left then right
      const up = sm(ramp(f, w.need, w.need + 14));
      return { ...base, w: { down: 1 - up, stand: up }, look: [0.9, 0.2, 1.3], neck: 0.6, headTilt: 12 * Math.sin((f - w.need) * 0.13), ears: 0.4 * up, tail: 0.1 };
    }
    case 'helper': {   // a helper approaches from off-screen left: ears up, head turns to the side, the tail wags
      const k = sm(ramp(f, w.ask, w.ask + 14)), up = sm(ramp(f, w.ask, w.ask + 24)), happy = sm(ramp(f, w.friend + 6, w.walker));
      return { ...base, w: { down: 1 - up, stand: up }, look: [lerp(0.9, -0.8, k), 0.3, lerp(1.3, 2.6, k)], neck: 0.6, ears: 0.5 * k, tail: 0.15 + 0.3 * happy, wag: Math.sin(f * (0.45 + 0.4 * happy)) * (0.4 + 0.8 * happy), headTilt: 5 * Math.sin(f * 0.1) * k };
    }
    case 'back2': return { ...base, look: toTrainer, neck: 0.6, wag: 0.4 * Math.sin(f * 0.25), tail: 0.2, ears: 0.2, blink: f > w.backW + 14 && f < w.backW + 21 ? 1 : base.blink };
    case 'open': return { ...base, look: [1.5, 0.35, 0.9], neck: 0.6, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2, ears: 0.3 };
    case 'yes': return { ...base, look: [TRN[0] + 0.3, 0.7, TRN[2] + 0.3], neck: 0.7, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    case 'final': {
      const t0 = w.reward + 4, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, look: W.treat && !W.treatHide ? W.treat : [1.2, 0.15, 0.9], neck: 0.6, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- props: toy, ball, treat, hand ----------
const toyPath = (f) => {
  const id = shotAt(f).id;
  if (id === 'setup') return f < w.plan ? { pos: TOY_MAT, yaw: 0.6 } : null;
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
  if (S === 'shut') return { at: follow(f, w.leave - 12, w.leave + 3, w.leave + 22, w.leave + 29), pose: 'relax', side: 0.16 };
  if (S === 'open') return { at: follow(f, w.open - 12, w.open + 2, w.open + 16, w.open + 22), pose: 'relax', side: 0.16 };
  if (S === 'final') return t && { treat: t, side: 0.22 };
  return null;
};
export const worldAt = (f) => {
  if (globalThis.TEST?.W) return globalThis.TEST.W;
  const S = shotAt(f), W = {};
  W.crate = { pos: CR, yaw: 0, door: doorAt(f) };
  const toy = toyPath(f); if (toy) W.toy = toy;
  const ball = BALL(f); if (ball) W.ball = ball;
  const t = treatPath(f); if (t) W.treat = t;
  const hd = handFor(f); if (hd) W.hand = hd;
  if (S.id === 'final' && f >= w.reward + 4) W.treatHide = true;
  return W;
};

// ---------- the 2D trainer (hook, back, calm, yes) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5;
  return { kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 4,
    near: { to: [318, 690 - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present', lean: 6 };
};
const trainerAt = (f) => {
  const hi = idle(f, 3), id = shotAt(f).id;
  const o = { hose: true, kneel: 1, expr: 'smile', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.2, headTilt: hi.headTilt, near: 'thumb', far: 'present', lean: 6 };
  if (id === 'hook') { o.expr = f > 12 ? 'grin' : 'smile'; o.look = f > 20 ? -0.2 : 0.8; o.near = f > w.crate1 + 20 ? 'thumb' : { to: [270, 806], hand: 'fist', bend: -1 }; }
  if (id === 'back' || id === 'back2') { o.expr = f < (id === 'back' ? w.come : w.backW) + 12 ? 'grin' : 'smile'; o.talk = talkAt(f) * 0.5; o.lean = 4; }
  return o;
};

// ---------- cameras ----------
const HC = (a, b) => [{ f: a, pos: [1.8, 0.65, 2.3], look: [-0.32, 0.9, 0.1], fov: 52 }, { f: b, pos: [1.62, 0.62, 2.08], look: [-0.35, 0.88, 0.1], fov: 52 }];   // trainer beside the crate (Crate II hook)
const PV = (a, b, l0 = [0.25, 0.28, 0.0], l1 = [0.27, 0.24, 0.0]) => [{ f: a, pos: [1.3, 0.88, 0.56], look: l0, fov: 42 }, { f: b, pos: [1.24, 0.82, 0.53], look: l1, fov: 42 }];   // gold POV keys
const V1 = (a, b) => [{ f: a, pos: [2.9, 1.0, 1.3], look: [0.3, 0.78, 0.0], fov: 42 }, { f: b, pos: [2.82, 0.98, 1.27], look: [0.3, 0.78, 0.0], fov: 42 }];   // crate-iii "times" views
const V2 = (a, b) => [{ f: a, pos: [3.0, 0.8, 0.2], look: [0.3, 0.78, 0.0], fov: 42 }, { f: b, pos: [2.78, 0.8, 0.1], look: [0.3, 0.78, 0.0], fov: 42 }];
const V3 = (a, b) => [{ f: a, pos: [1.9, 1.4, 2.4], look: [0.1, 0.78, 0.0], fov: 42 }, { f: b, pos: [1.7, 1.36, 2.15], look: [0.1, 0.78, 0.0], fov: 42 }];
const trackCam = (f, dist = 2.3, h = 0.4, ly = 0.55, lx = 0.05) => {   // side tracking rig (follow-me III): the puppy in profile, the world slides behind
  const S = shotAt(f), d = DPf(f), dd = dist - 0.001 * (f - S.a);
  return { pos: [d.x + lx - 0.1, h, d.z + dd], look: [d.x + lx, ly, d.z], fov: 44 };
};
const CAMS = {
  hook: [{ f: 0, pos: [1.8, 0.65, 2.3], look: [-0.32, 0.9, 0.1], fov: 52 }, { f: w.crate1 + 24, pos: [1.75, 0.64, 2.25], look: [-0.32, 0.9, 0.1], fov: 52 }, { f: w.grab - 1, pos: [1.6, 0.62, 2.05], look: [-0.35, 0.88, 0.1], fov: 52 }],
  setup: [{ f: w.grab, pos: [1.5, 0.38, 1.25], look: [0.95, 0.07, 0.5], fov: 36 }, { f: w.plan - 1, pos: [1.45, 0.36, 1.2], look: [0.95, 0.07, 0.5], fov: 36 },
    { f: w.plan, pos: [1.52, 0.5, 3.3], look: [1.52, 0.72, 0.9], fov: 40 }, { f: w.leave - 1, pos: [1.52, 0.48, 3.15], look: [1.52, 0.72, 0.9], fov: 40 }],
  shut: PV(w.leave, w.hourA - 1),
  hour: V1(w.hourA, w.come - 1),
  back: HC(w.come, w.between - 1),
  sess: V3(w.between, w.go - 1),
  routA: V2(w.keep, w.days - 1),
  routB: [{ f: w.days, pos: [1.3, 0.88, 0.56], look: [0.28, 0.25, 0.0], fov: 42 }, { f: 595, pos: [1.12, 0.8, 0.46], look: [0.3, 0.2, 0.0], fov: 42 }],
  mistake: V1(596, w.puppies - 1),
  puppies: V3(w.puppies, w.adults - 1),
  adults: V2(w.adults, w.need - 1),
  need: PV(w.need, w.ask - 1, [0.3, 0.3, 0.0], [0.3, 0.26, 0.0]),
  helper: V1(w.ask, w.backW - 1),
  back2: HC(w.backW, w.open - 1),
  open: PV(w.open, w.say - 1),
  yes: [{ f: w.say, pos: [1.8, 0.65, 2.3], look: [-0.32, 0.9, 0.1], fov: 52 }, { f: w.then2 - 1, pos: [1.65, 0.63, 2.1], look: [-0.34, 0.88, 0.1], fov: 52 }],
  final: PV(w.then2, TOTAL - 1, [0.4, 0.3, 0.0], [0.4, 0.3, 0.0]),
};
const HANDCAMS = ['shut', 'open', 'final'];
export const camAt = (f) => {
  if (globalThis.TEST?.cam) return globalThis.TEST.cam;
  const S = shotAt(f), c = CAMS[S.id] ? camFromKeys(CAMS[S.id], f, {}) : S.id === 'play' ? trackCam(f, 2.65, 0.45, 0.62, 0.15) : trackCam(f);
  if (HANDCAMS.includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  if (!CAMS[S.id]) { c.pos = add(c.pos, [0.005 * Math.sin(f * 0.11), 0.004 * Math.sin(f * 0.07 + 1), 0.005 * Math.sin(f * 0.09 + 2)]); c.roll = 0.5 * Math.sin(f * 0.05); }
  c.shadowAt = CAMS[S.id] ? [0.1, 0.2, 0] : [c.look[0], 0.1, c.look[2]];
  if (S.id === 'setup' && f >= w.plan) c.shadowAt = [1.6, 0.1, 0.9];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (['hook', 'back', 'back2', 'yes'].includes(S.id)) return { focus: dist(C.pos, [0.3, 0.35, -0.1]), cinf: 5 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'trot' || S.id === 'play') return { focus: dist(C.pos, C.look), cinf: 9 };
  return { focus: dist(C.pos, [0.25, 0.35, 0.0]), cinf: 4 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
const TRAINER_SHOTS = ['hook', 'back', 'back2'];
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
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, noDepth: true, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FXc(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.09) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.09, at[1] + 0.06 + k * 0.22, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const sigh = (a, b, at) => { if (f >= a && f < b) { const t = q(ramp(f, a, b), 2); out.push(FXc('si' + t, (p) => T.fxSigh(p, t), at, 0.16)); } };
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  const timer = (label, a, b, p0, p1, pos, s) => { if (f >= a && f < b) { const k = pop(a, b), prog = q(lerp(p0, p1, ramp(f, a + 4, b - 6)), 2); if (k > 0.02) out.push(FXc('tm' + label + k + prog, (p) => T.fxTimer(p, label, prog), pos, s * k, { roll: 0 })); } };
  const MUZ = add(NOSE('stand'), [0.03, 0.0, -0.12]);
  const FACE = add(NOSE('down'), [0.1, 0.02, 0.1]);
  const POVB = [0.5, 0.66, 0.0];                // badge anchor above the puppy in the POV cameras
  if (S.id === 'hook') sigh(w.crate1 + 22, w.crate1 + 52, FACE);
  if (S.id === 'setup') { badge(T.fxCheck, 'ok', w.toy1 + 4, w.plan - 4, [TOY_MAT[0] + 0.02, 0.22, TOY_MAT[2]], 0.08); badge(T.fxCheck, 'ok2', w.plan + 8, w.leave - 3, [1.6, 1.05, 0.9], 0.2); }
  if (S.id === 'hour') timer('1 hr', w.hourA, w.come - 2, 0, 1, [0.2, 1.15, 0.1], 0.5);
  if (S.id === 'back') sigh(w.calmly, w.calmly + 30, FACE);
  if (S.id === 'sess') badge(T.fxCheck, 'ok3', w.between + 14, w.go - 3, [0.2, 1.1, 0.0], 0.3);
  if (S.id === 'play' && f >= w.play + 22) { const d = DPf(f); hearts(w.play + 24, [d.x + 0.3, 0.45, d.z], 4, 0.1); }
  if (S.id === 'routA' && f >= w.steady - 2 && f < w.days - 5) { const k = pop(w.steady - 2, w.days - 4), t = q(ramp(f, w.steady, w.days - 8), 2); if (k > 0.02) out.push(FXc('dy' + k + t, (p) => T.fxDay(p, t), [0.2, 1.15, 0.0], 0.62 * k, { roll: 0 })); }
  if (S.id === 'routB') {   // camera-fixed overlay anchors: badge upper right, hearts to the left, never touching
    const { C, F, R, U } = camVec(f), at = (d, r, u) => C.pos.map((v, i) => v + F[i] * d + R[i] * r + U[i] * u);
    badge(T.fxCheck, 'ok4', w.days + 4, w.days + 52, at(1.0, 0.12, 0.21), 0.14); sigh(w.days + 8, w.days + 38, FACE);
  }
  if (S.id === 'mistake') {
    timer('8 hr', 597, w.puppies - 3, 0.05, 0.9, [0.2, 1.15, 0.1], 0.5);
    badge(T.fxCross, 'no', w.crating, w.puppies - 6, [0.246, 1.15 + 0.1125 * 0.5 - 0.003, 0.12], 0.5);
    if (whineAt(f)) { const t = q((f * 0.045) % 1, 2); out.push(FXc('wh' + t, (p) => T.fxWhine(p, t), MUZ, 0.5)); }
  }
  if (S.id === 'puppies' && f < w.adults - 3) { const k = pop(w.puppies, w.adults - 2), t = q(ramp(f, w.puppies + 6, w.adults - 8), 2); if (k > 0.02) out.push(FXc('pp' + k + t, (p) => T.fxInfo(p, 'Puppies', '~1 hr per month', 'of age', t, '#ffd24a'), [0.2, 1.2 + 0.012 * Math.sin(f * 0.15), 0.1], 0.72 * k, { roll: q(0.02 * Math.sin(f * 0.1), 2) })); }
  if (S.id === 'adults' && f < w.need - 3) { const k = pop(w.adults, w.need - 2), t = q(ramp(f, w.adults + 6, w.need - 8) * 0.75, 2); if (k > 0.02) out.push(FXc('ad' + k + t, (p) => T.fxInfo(p, 'Adults', '4–6 hrs max', '', t, '#7fc4ff'), [0.2, 1.2 + 0.012 * Math.sin(f * 0.15), 0.0], 0.72 * k, { roll: q(0.02 * Math.sin(f * 0.1), 2) })); }
  if (S.id === 'helper') hearts(w.help, HEADS(), 3, 0.09);
  if (S.id === 'back2') { sigh(w.backW + 4, w.backW + 28, FACE); hearts(w.dogW, HEADP()); }
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.55);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FXc('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.5, 1.0, TRN[2] + 0.2], 0.3)); }
  if (S.id === 'final') {
    hearts(w.reward + 5, HEADP(), 4, 0.08);
    if (f >= w.reward) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('down'), [0.05, 0.15, -0.3 + i * 0.3]), 0.5, { order: 7 })); }
  }
  return out;
};
