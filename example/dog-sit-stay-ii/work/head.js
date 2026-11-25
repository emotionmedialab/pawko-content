// "Sit & stay II" — add distance (steps, a small circle), a treat toss, and what to do when the puppy gets up. 3D puppy (dog-puppy.glb) + the 2D bald trainer, 1047 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3, voice.mp3.words.json, round(s*30); sentence starts taken from silence_end): Let's 0 stay 28 even 49 walk 62 away 67 | Grab 101 (silence_end 103) treats 104 space 127 |
// Ask 150 (silence_end 153) sit 166 say 185 stay 192 | Take 226 (silence_end 230) one 233 step 240 back 250 return 269 reward 297 | then 324 (silence_end 329) two 331 then 363 five 370 |
// Always 405 come 410 back 419 dog 433 before 439 release 456 | Next 491 walk 494 circle 519 them 541 | Feed 566 treats 571 still 605 sitting 611 | Don't 638 call 643 you 659 stay 675 ends 681 |
// Then 716 say 720 okay 727 toss 756 treat 767 | If 794 dog 800 gets 807 up 812 quietly 830 reset 839 | It 874 hard 888 now 902 | Every 931 return 947 say 969 yes 974 or 985 click 997 | then 1024 reward 1025 | end 1046.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and
// action is keyed to `w` (+/- a few frames). Camera keys are the locked ones from dog-down-ii / dog-down-iii (LOCKED SHOT LIBRARY).
// Hard cuts only, no flashes. Puppy at the origin, nose toward +x.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1047, DECK = 0;
// key word frames (first frame of the word)
const w = {
  walk: 62, grab: 101, space: 127, ask: 150, sit: 166, say1: 185, take: 226, step: 233, ret1: 269, reward1: 297, steps: 324, two: 331, five: 370,
  always: 405, back: 419, dog: 433, release: 456, next: 491, circle: 519, feed: 566, still: 605, sitting: 611,
  dont: 638, call: 643, stay2: 675, ends: 681, then1: 716, okay: 727, toss: 756, treat: 767, if: 794, gets: 807, up: 812, reset: 839, itwas: 874, hard: 888,
  every: 931, return: 947, say2: 969, yes: 974, click: 997, then2: 1024, reward2: 1025, fin: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },              // trainer + puppy sitting; on "walk away" the trainer card slides back, the puppy stays
  { id: 'setup', a: w.grab, b: w.ask - 1, light: 'day' },         // treat jar, then the puppy on the mat; check on "space"
  { id: 'ask', a: w.ask, b: w.take - 1, light: 'day' },           // POV: stand -> sit, "Stay!" bubble, flat palm held, then pulled away
  { id: 'step1', a: w.take, b: w.reward1 - 1, light: 'day' },     // floating 3/4: footprints out (one step back) and back
  { id: 'reward1', a: w.reward1, b: w.steps - 1, light: 'day' },  // POV: treat for the sitting puppy
  { id: 'steps', a: w.steps, b: w.always - 1, light: 'day' },     // floating 3/4: two steps, then five (longer footprint lines)
  { id: 'back', a: w.always, b: w.next - 1, light: 'day' },       // trainer card slides back to the puppy; check on "release"
  { id: 'around', a: w.next, b: w.feed - 1, light: 'day' },       // footprint ring around the sitting puppy, which tracks it
  { id: 'povStay', a: w.feed, b: w.dont - 1, light: 'day' },      // POV: two treats while it keeps sitting
  { id: 'mistake1', a: w.dont, b: w.then1 - 1, light: 'day' },    // MISTAKE: called over, gets up, red cross
  { id: 'toss', a: w.then1, b: w.if - 1, light: 'day' },          // "Okay!" releases it; a treat is tossed, chomp
  { id: 'mistake2', a: w.if, b: w.itwas - 1, light: 'day' },      // gets up (cross), quietly sits again (sigh, check)
  { id: 'calm', a: w.itwas, b: w.every - 1, light: 'day' },       // low orbit, relaxed sit, sigh
  { id: 'ret', a: w.every, b: w.say2 - 1, light: 'day' },         // trainer card slides back to the puppy
  { id: 'yes', a: w.say2, b: w.then2 - 1, light: 'golden' },      // trainer: "yes" + click
  { id: 'povFinal', a: w.then2, b: TOTAL - 1, light: 'golden' },  // POV: reward, confetti
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

