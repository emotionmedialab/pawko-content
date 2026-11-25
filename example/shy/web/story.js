// "Shy" - teach the shy pose: a tiny tape tab on the nose, the paw swipes at it (paw over the muzzle), mark, peel, reward; smaller tape; hand motion; the cue; the tape-left-on mistake. 3D puppy + the 2D bald trainer, 1020 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3, round(s*30); sentence starts from silencedetect silence_end, not whisper):
// Let's 0 act 31 shy 37 | Grab 77 tiny 103 tape 128 | Stick 169 tape 179 lightly 186 nose 222 | When 254 swipe 260 paw 283 | mark 309 | peel 337 tape 346 off 351 right 356 | reward 386 |
// Next 425 smaller 452 each 469 | Then 512 hand 541 nose 571 | Say 604 shy 610 paw 646 lifts 651 | If 690 tape 707 on 712 frustrated 751 | Take 792 off 799 paw 822 | never 847 anything 863 face 887 |
// Say 922 yes 928 click 956 | then 980 reward 992 | end 1019.
// The dog's RIGHT paw is +z in world space (the puppy faces +x); the side cameras sit at +z and see the right paw cross the muzzle. Swipe poses swpA (paw beside the face) -> swpB (over the muzzle) -> swpC (toward the eye).
// Hard cuts only, no flashes. Puppy at the origin, nose toward +x. Only the paw crosses the face (that is the trick); the hand always works beside / below it.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1020, DECK = 0;
// key word frames (first frame of the word)
const w = {
  act: 31, shy1: 37, grab: 77, tiny: 103, tape1: 128, stick: 169, lightly: 186, nose1: 222, when: 254, swipe: 260, paw1: 283, mark: 309, peel: 337, tape2: 346, off: 351, rightaway: 356, reward1: 386,
  next: 425, smaller: 452, each: 469, then: 512, hand: 541, nose2: 571, say1: 604, shy2: 610, paw2: 646, lifts: 651, if: 690, tape3: 707, on: 712, frus: 751,
  take: 792, paw3: 822, never: 847, anything: 863, face: 887, say2: 922, yes: 928, click: 956, then2: 980, reward2: 992, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },              // trainer, the puppy does the shy pose (paw over the face)
  { id: 'setup', a: w.grab, b: w.stick - 1, light: 'day' },       // treat jar, hard cut to the puppy and a hand holding a tiny tape tab
  { id: 'stick', a: w.stick, b: w.when - 1, light: 'day' },       // the tape goes lightly on the nose
  { id: 'swipe', a: w.when, b: w.reward1 - 1, light: 'day' },     // the paw swipes over the muzzle, tape comes off on the paw, mark, peel
  { id: 'reward', a: w.reward1, b: w.next - 1, light: 'day' },    // treat, chomp, hearts
  { id: 'small', a: w.next, b: w.then - 1, light: 'day' },        // a smaller tab, the paw flicks it off
  { id: 'hand', a: w.then, b: w.say1 - 1, light: 'day' },         // just a hand motion near the nose, the paw swipes anyway
  { id: 'cue', a: w.say1, b: w.if - 1, light: 'day' },            // say "shy" (bubble), paw lifts
  { id: 'wrong', a: w.if, b: w.take - 1, light: 'day' },          // MISTAKE: tape left on, frustrated puppy (red cross)
  { id: 'fix', a: w.take, b: w.say2 - 1, light: 'day' },          // paw -> tape off at once; clean face (check)
  { id: 'yes', a: w.say2, b: w.then2 - 1, light: 'golden' },      // trainer: "yes" + click
  { id: 'final', a: w.then2, b: TOTAL - 1, light: 'golden' },     // POV: reward, confetti
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
const R = (f, a, b) => sm(ramp(f, a, b));                                        // smooth 0..1

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
const DOGPOS = [0, MAT, 0], DOGYAW = Math.PI / 2;      // puppy on the mat, nose toward +x
const TRN = [0.52, MAT, -0.66];
const HOOKP = [0, MAT, -0.48];                          // hook: puppy close to the trainer's card plane
let CUR = [0, 1, 3], TCUR = TRN;
const LK = [0.9, 0.12, 0.2];                            // the puppy's resting look target (low, ahead, toward the camera side)

// ---------- reference points from the real rig (filled in by calibrate() once the GLB is loaded) ----------
const REF = {};
export const calibrate = (poseFn, root) => {
  root.position.set(...DOGPOS); root.rotation.set(0, DOGYAW, 0); root.updateMatrixWorld(true);
  REF.sit = poseFn({ w: { sit: 1 }, look: LK });
  REF.A = poseFn({ w: { swpA: 1 }, look: LK });
  REF.H = poseFn({ w: { swpA: 0.5, swpB: 0.5 }, look: LK });   // the paw resting on the face (s = 1.5)
  root.position.set(...DOGPOS);
};
const NOSE = () => REF.sit.nose;
const TAPEP = () => REF.sit.tape;                      // where the tape sits on the muzzle
const TAPEPAW = () => add(REF.H.bR, [0, 0.02, 0.02]);                    // the tape stuck on the raised paw
const MOUTH = () => add(NOSE(), [0.03, 0.0, 0.0]);                    // treat delivered at the sitting puppy's mouth
const HEAD = () => add(REF.sit.head, [0.07, 0.1, 0]);                    // hearts anchor above the head
const HN = () => add(NOSE(), [0.14, 0.0, 0.16]);                         // a hand moving near the nose, clear of the muzzle
const WT = () => add(NOSE(), [0.05, -0.1, 0.04]);                        // setup: the hand holds the tape out to the side, clear of the face
const REST = () => { const t = REF.sit.tape; return [t[0] + 0.1, MAT + 0.012, t[2] + 0.16]; };   // where the flicked tape lands on the mat
const HOLD = (P) => add(P, [0.03, -0.01, 0]);                            // hand position for a pinch that holds something at P
// a hand waiting / leaving: low on the mat just in front of the camera, below the bottom of the frame (same sideways offset as P)
const BELOW = (f, P) => { const c = camAt(f), fw = [c.look[0] - c.pos[0], c.look[2] - c.pos[2]], n = Math.hypot(fw[0], fw[1]), F = [fw[0] / n, fw[1] / n], R3 = [-F[1], F[0]];
  const lat = (P[0] - c.pos[0]) * R3[0] + (P[2] - c.pos[2]) * R3[1];
  return [c.pos[0] + F[0] * 0.5 + R3[0] * lat, 0.1, c.pos[2] + F[1] * 0.5 + R3[1] * lat]; };

// ---------- the swipe: s = 0 sit, 1 paw beside the face (A), 2 over the muzzle (B), 3 toward the eye (C) ----------
// three rubbing strokes over the muzzle (B <-> C), then the paw rests on the face (s = 1.5) with a small wobble until `end`
const strokes = (f, c, end, back = 11) => {
  const keys = [[c - 18, 0], [c - 9, 1], [c, 2], [c + 5, 3], [c + 10, 2.1], [c + 15, 3], [c + 20, 2.1], [c + 25, 3], [c + 31, 1.5]];
  if (end > c + 31) keys.push([end, 1.5]);
  keys.push([end + back, 0]);
  const wob = f > c + 31 && f < end - 26 ? 0.2 * Math.sin((f - c) * 0.4) * Math.min(1, (f - c - 31) / 6) : 0;
  return KF(f, keys) + wob;
};
const swipeKeys = (f) => {
  switch (shotAt(f).id) {
    case 'hook': return KF(f, [[w.act - 9, 0], [w.act - 2, 1], [w.act + 5, 2], [w.act + 10, 3], [w.act + 15, 2.1], [w.act + 20, 3], [w.act + 25, 2.1], [w.act + 30, 3], [w.shy1 + 36, 2.85], [w.grab - 4, 2.9]]);
    case 'swipe': return strokes(f, w.paw1 - 4, w.paw1 + 27, 11);
    case 'small': return strokes(f, w.each - 1, w.each + 31, 10);
    case 'hand': return strokes(f, w.nose2 + 10, w.nose2 + 41, 8);
    case 'cue': return strokes(f, w.paw2 + 2, w.paw2 + 33, 10);
    case 'fix': return strokes(f, w.paw3 - 3, w.paw3 + 28, 11);
    case 'wrong': return R(f, w.if + 4, w.if + 14) * (1 - R(f, w.take - 14, w.take - 2)) * (2.45 + 0.55 * Math.sin(f * 0.5));   // keeps pawing at the nose, the tape stays on
  }
  return 0;
};
const swipeW = (s) => ({ sit: Math.max(0, 1 - s), swpA: s <= 1 ? s : Math.max(0, 2 - s), swpB: s <= 1 ? 0 : s <= 2 ? s - 1 : Math.max(0, 3 - s), swpC: s > 2 ? s - 2 : 0 });

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f), s = swipeKeys(f);
  const flick = Math.max(0, Math.sin(f * 0.11 + 1)) ** 12;   // an ear flick every ~2 s
  const base = { pos: [0.004 * Math.sin(f * 0.037), MAT, 0.004 * Math.sin(f * 0.029 + 1)], yaw: DOGYAW + 0.035 * Math.sin(f * 0.043), ears: -0.25 * flick, w: swipeW(s), roll: 0, blink: blinkAt(f, 8) ? 1 : 0,
    breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 1, look: LK };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const lookC = (P, dy = 0) => [P[0], Math.min(P[1] + dy, 0.34), P[2]];
  const dip = 0.1 * Math.min(1, s);                          // the head dips a little as the paw comes up
  const swipeLook = [LK[0], LK[1] - dip, LK[2] + 0.05];
  switch (S.id) {
    case 'hook': {
      const shy = R(f, w.act - 2, w.act + 12);
      return { ...base, pos: HOOKP, look: lerp3([0.5, 0.66, TRN[2]], [0.7, 0.04, 0.1], shy), headTilt: 8 * shy + 3 * Math.sin(f * 0.12) * shy, wag: 0.5 * Math.sin(f * 0.4), ears: f > 12 ? -0.3 : 0 };
    }
    case 'setup': {
      return { ...base, look: f < w.tiny ? [1.6, 0.12 + 0.03 * Math.sin(f * 0.05), 0.3] : lookC(WT(), 0.03), headTilt: 8 * Math.sin(Math.PI * ramp(f, w.tiny, w.stick)), wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    }
    case 'stick': {
      return { ...base, look: f < w.nose1 + 14 && W.hand ? lookC(add(W.hand.at, [0, 0.02, 0]), 0.03) : [LK[0], LK[1] - 0.04, LK[2]], headTilt: 6 * Math.sin(f * 0.07), wag: 0.5 * Math.sin(f * 0.3), ears: f > w.nose1 + 4 ? -0.3 : -0.2, neck: 0.8 };
    }
    case 'swipe': {
      return { ...base, look: swipeLook, headTilt: 5 * Math.sin(f * 0.07), ...(f >= w.mark - 2 ? happy : { wag: 0.5 * Math.sin(f * 0.4) }), ears: -0.2 };
    }
    case 'reward': {
      const ch = chompAt(f, EAT.reward);
      return { ...base, look: W.treat ? lookC(W.treat, 0.02) : LK, jaw: f >= EAT.reward + 14 ? 0.3 : ch, ...(f > EAT.reward ? happy : { wag: 0.8 * Math.sin(f * 0.5) }), blink: f > EAT.reward && f < EAT.reward + 6 ? 1 : base.blink };
    }
    case 'small': return { ...base, look: swipeLook, headTilt: 4 * Math.sin(f * 0.06), wag: f > w.each + 6 ? Math.sin(f * 0.8) : 0.4 * Math.sin(f * 0.3), tail: 0.2 };
    case 'hand': case 'cue': {
      const done = S.id === 'cue' && f > w.paw2 + 12;
      return { ...base, look: s > 0.2 ? swipeLook : lookC(add(HN(), [0, 0.02, -0.02]), 0.03), headTilt: 6 * Math.sin(f * 0.06), wag: done ? Math.sin(f * 0.7) : 0.5 * Math.sin(f * 0.35), ears: -0.25 };
    }
    case 'wrong': {
      const k = R(f, w.if + 4, w.if + 16);
      return { ...base, yaw: base.yaw + 0.09 * Math.sin(f * 0.21) * k, look: [LK[0], LK[1] - 0.08 * k, LK[2] + 0.35 * Math.sin(f * 0.9) * k], neck: 1, headTilt: 12 * Math.sin(f * 0.9) * k, ears: -0.5 * k, wag: 0.1 * Math.sin(f * 0.2), tail: 0.0, jaw: 0.25 * k * (0.5 + 0.5 * Math.sin(f * 0.5)) };
    }
    case 'fix': {
      const calm = f > w.never + 14;
      return { ...base, look: s > 0.1 ? swipeLook : calm ? [LK[0], LK[1] + 0.05, 0.3 + 0.5 * Math.sin(f * 0.04)] : LK, headTilt: calm ? 7 * Math.sin(f * 0.05) : 4 * Math.sin(f * 0.07), ...(f > w.never ? happy : { wag: 0.5 * Math.sin(f * 0.4) }), ears: calm ? -0.15 : -0.2 };
    }
    case 'yes': {
      return { ...base, look: [TRN[0] + 0.05, 0.5, TRN[2] + 0.2], wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    }
    case 'final': {
      const t0 = EAT.final, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, look: W.treat ? lookC(W.treat, 0.02) : lookC(MOUTH(), 0.03), jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: POV hands, biscuit, tape ----------
const EAT = { reward: w.reward1 + 8, final: w.reward2 + 2 };
const HANDSHOTS = ['setup', 'stick', 'swipe', 'reward', 'small', 'hand', 'cue', 'fix', 'final'];
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const offer = (at0, pose, extra = {}) => ({ at: [at0[0], at0[1] + 0.006 * Math.sin(f * 0.13), at0[2]], pose, mode: 'reach', face: add(TAPEP(), [-0.2, 0, 0]), tilt: 0.12, side: 0.3, ...extra });
  const PINCH = { palm: [0.05, -0.75, -0.6], fingers: [-1, 0.25, -0.1] };         // pinch seen from the side cameras (back of the hand to the camera)
  const jit = (a) => [a * Math.sin(f * 0.09), a * Math.sin(f * 0.07), a * Math.sin(f * 0.05)];
  const tapeFlick = (c, sc = 1) => { const T = REF.sit.tape, Rr = REST(), k = ramp(f, c, c + 14);   // the swipe flicks the tape off the nose onto the mat
    W.tape = f < c ? { on: 'nose', s: sc } : k < 1 ? { on: 'nose', s: sc, off: [(Rr[0] - T[0]) * k, (Rr[1] - T[1]) * k * k + 0.07 * Math.sin(Math.PI * k), (Rr[2] - T[2]) * k] } : { on: 'at', at: Rr, s: sc }; };
  const peel = (f0) => {              // the hand picks the tape up off the mat and carries it out of frame
    const P = HOLD(REST()), at = KF(f, [[f0, BELOW(f0, P)], [f0 + 9, P], [f0 + 13, P], [f0 + 30, BELOW(f0 + 30, P)]]);
    W.hand = offer(at, 'pinch', PINCH);
    W.tape = f < f0 + 13 ? { on: 'at', at: REST(), s: 1 } : f <= f0 + 24 ? { on: 'at', at: add(at, [-0.03, 0.01, 0]), s: 1 } : null;
  };
  switch (S.id) {
    case 'setup': {
      if (f < w.tiny) W.tape = { on: 'at', at: [1.99, 0.545, -0.62], s: 1.6 };   // the tape beside the treat jar
      const at = KF(f, [[w.tiny + 4, BELOW(w.tiny + 4, WT())], [w.tiny + 20, WT()], [w.stick - 8, WT()], [w.stick - 1, BELOW(w.stick - 1, WT())]]);
      if (f >= w.tiny + 2) { W.hand = offer(add(at, jit(0.008)), 'pinch', PINCH); W.tape = { on: 'at', at: add(at, [-0.03, 0.01, 0]), s: 1 }; }
      break;
    }
    case 'stick': {
      const P = HOLD(TAPEP()), AP = add(P, [0.12, 0.03, 0.04]);   // the hand stays ahead of the muzzle, only the fingertips reach the tape spot
      const at = KF(f, [[w.stick, BELOW(w.stick, AP)], [w.lightly + 6, AP], [w.nose1 - 4, P], [w.nose1 + 14, P], [w.nose1 + 30, AP], [w.when - 2, BELOW(w.when - 2, AP)]]);
      W.hand = offer(at, 'pinch', PINCH);
      W.tape = f < w.nose1 + 2 ? (f >= w.lightly + 3 ? { on: 'at', at: add(at, [-0.03, 0.01, 0]), s: 1 } : null) : { on: 'nose', s: 1 };
      break;
    }
    case 'swipe': { tapeFlick(w.paw1 - 4); if (f >= w.peel) peel(w.peel); break; }
    case 'small': tapeFlick(w.each - 1, 0.55); break;
    case 'hand': case 'cue': {
      const a = S.id === 'hand' ? w.then + 8 : w.say1 + 2, b = S.id === 'hand' ? w.nose2 + 2 : w.paw2 - 6;
      const sway = [0.03 * Math.sin(f * 0.2), 0.02 * Math.sin(f * 0.27), 0.03 * Math.cos(f * 0.2)], k = R(f, a + 6, a + 12);
      const at = KF(f, [[a - 8, BELOW(a - 8, HN())], [a + 6, HN()], [b, HN()], [b + 8, BELOW(b + 8, HN())]]);
      if (f >= a - 8 && f <= b + 8) W.hand = offer(add(at, sway.map((v) => v * k)), 'point', PINCH);
      break;
    }
    case 'wrong': W.tape = { on: 'nose', s: 1 }; break;
    case 'fix': { tapeFlick(w.paw3 - 3); if (f >= w.paw3 + 10) peel(w.paw3 + 10); break; }
    case 'reward': {
      const m = KF(f, [[w.reward1 - 2, BELOW(w.reward1 - 2, MOUTH())], [w.reward1 + 5, MOUTH()], [w.reward1 + 14, MOUTH()], [w.reward1 + 26, BELOW(w.reward1 + 26, MOUTH())]]);
      if (f >= w.reward1 - 2 && f <= w.reward1 + 26) { W.treat = add(m, [-0.03, 0.01, 0]); W.hand = offer(add(m, [0.03, -0.01, 0]), 'pinch', PINCH); }
      break;
    }
    case 'final': { const at = KF(f, [[w.then2, BELOW(w.then2, MOUTH())], [w.reward2 - 2, MOUTH()], [w.reward2 + 6, MOUTH()], [w.reward2 + 17, BELOW(w.reward2 + 17, MOUTH())]]); W.hand = offer(add(at, [0.03, -0.01, 0]), 'pinch', PINCH); W.treat = at; break; }
  }
  if (EAT[S.id] && f >= EAT[S.id]) W.treatHide = true;
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
  const hi = idle(f, 3);
  const o = { hose: true, kneel: 1, expr: f > 30 ? 'grin' : 'smile', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: f > 40 ? -0.2 : 0.8, headTilt: hi.headTilt, near: { to: [270, 806], hand: 'fist', bend: -1 } };
  o.far = 'present';
  return o;
};

// ---------- cameras (locked library: keys copied from right-paw / dog-down-ii, only timing changed) ----------
const FRONT = [{ f: 0, pos: [1.34, 0.86, 0.4], look: [0.2, 0.5, 0.0], fov: 46 }, { f: 1, pos: [1.28, 0.83, 0.38], look: [0.2, 0.5, 0.0], fov: 46 }];
const two = (a, b, k0, k1) => [{ ...k0, f: a }, { ...k1, f: b }];
const SIDE0 = { pos: [0.66, 0.5, 1.5], look: [0.14, 0.34, 0.05], fov: 44 }, SIDE1 = { pos: [0.6, 0.54, 1.55], look: [0.14, 0.37, 0.05], fov: 44 };   // the locked 3/4 side shot (dog-down-ii popUp)
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  // from the treat jar on the stool, hard cut to the puppy on the mat
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.tiny - 2, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },
    { ...SIDE0, f: w.tiny - 1 }, { ...SIDE1, f: w.stick - 1 }],
  // POV from the dog's right side (3/4 front): the right paw swipes across the muzzle toward the camera
  stick: two(w.stick, w.when - 1, SIDE0, SIDE1),
  swipe: two(w.when, w.reward1 - 1, SIDE0, SIDE1),
  reward: two(w.reward1, w.next - 1, SIDE0, SIDE1),
  small: two(w.next, w.then - 1, SIDE0, SIDE1),
  hand: two(w.then, w.say1 - 1, SIDE0, SIDE1),
  cue: two(w.say1, w.if - 1, SIDE0, SIDE1),
  wrong: two(w.if, w.take - 1, SIDE0, SIDE1),
  fix: two(w.take, w.say2 - 1, SIDE0, SIDE1),
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then2 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  final: two(w.then2, TOTAL - 1, SIDE0, SIDE1),
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (HANDSHOTS.includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), head = REF.sit ? REF.sit.head : [0.3, 0.3, 0];
  if (S.id === 'hook' || S.id === 'yes') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'both') return { focus: dist(C.pos, [0.15, 0.25, 0]), cinf: 5 };
  return { focus: dist(C.pos, [0.2, 0.28, 0.05]), cinf: 5 };
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
const BUB_CUE = [0.3, 0.62, 0.1], BUB_YES = [-0.12, 0.78, -0.45], BADGE = [0.3, 0.58, 0.08];   // bubble / badge anchors above the head (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const spark = (t0, at, sc) => { if (f >= t0 && f < t0 + 14) { const k = q(ramp(f, t0, t0 + 14), 2); out.push(FX('sp' + k, (p) => T.fxSpark2(p, k), at, sc, { order: 7 })); } };
  if (S.id === 'reward') hearts(EAT.reward + 1, HEAD());
  // cue bubbles (James's look): pop in above the head on the spoken cue / the marker
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'swipe') bubble('bm', 'Yes!', '', '#fbf0b4', w.mark - 2, w.mark + 44, BUB_CUE, 0.2);
  if (S.id === 'cue') bubble('bd', 'Shy!', '', '#ffffff', w.shy2 - 2, w.shy2 + 44, BUB_CUE, 0.2);
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'wrong') badge(T.fxCross, 'no', w.on - 3, w.take - 8, BADGE, 0.2);
  if (S.id === 'fix') badge(T.fxCheck, 'ok', w.anything - 2, w.say2 - 6, BADGE, 0.17);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'final') {
    hearts(w.reward2 + 3, HEAD(), 4, 0.06);
    if (f >= w.reward2) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward2 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE(), [0.05, -0.05, -0.2 + i * 0.2]), 0.3, { order: 7 })); }
  }
  return out;
};
