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

