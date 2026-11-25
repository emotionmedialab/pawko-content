// "Tell a Secret" — the puppy rises up on its haunches (sit-pretty pose) to whisper into the kneeling trainer's ear. 3D puppy (dog-puppy.glb) + the 2D bald trainer card, 1030 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3, voice.mp3.words.json, round(s*30); sentence starts from silence_end): Let's 0 tell 29 secret 41 | Grab 72 (silence_end 2.41) quiet 99 room 107 | Kneel 139 (4.64) level 172 |
// Hold 206 (6.85) ear 247 wait 266 sniff 281 | When 320 (10.67) nose 326 touches 333 reward 372 | Next 408 (13.61) take 430 (silence_end 14.34) away 445 | Reward 478 (15.94) moves 506 toward 519 ear 531 |
// Now 564 (18.80) tell 586 secret 594 lean 623 | Keep 658 (21.95) soft 670 | If 704 (23.45) bouncy 722 excited 741 loud 788 | Stay 827 (27.57) calm 853 break 893 | Say 944 (31.46) yes 948 click 970 | then 994 reward 1000 | end 1029.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and action is keyed to `w`.
// Pointers: HAND in the POV shot, none in the card shots (the 2D trainer's own hand does the work). Hard cuts only, no flashes. Camera keys are the locked hook / yes / CALM / popUp / POV ones.
// Card shots: the kneeling trainer card (flipped, faces left) has the puppy beside him on screen right, rising into the sit-pretty reach to his ear. The puppy mirrors the sit-pretty rig (yaw -90).
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1030, DECK = 0;
// key word frames (first frame of the word)
const w = {
  tell1: 29, secret1: 41, grab: 72, quiet: 99, room: 107, kneel: 139, level: 172, hold: 206, ear1: 247, wait: 266, sniff: 281, when: 320, nose1: 326, touches: 333, reward1: 372,
  next: 408, take: 430, away: 445, reward2: 478, moves: 506, toward: 519, ear2: 531, now: 564, tell2: 586, secret2: 594, lean: 623, keep: 658, soft: 670,
  if: 704, bouncy: 722, excited: 741, loud: 788, stay: 827, calm: 853, brk: 893, say: 944, yes: 948, click: 970, then: 994, reward3: 1000, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },              // card: fingers by his ear, the puppy rises, nose touches, reward
  { id: 'setup', a: w.grab, b: w.kneel - 1, light: 'day' },       // jar -> mat, check on "quiet room"
  { id: 'kneel', a: w.kneel, b: w.hold - 1, light: 'day' },       // card: kneeling at the puppy's level
  { id: 'ear', a: w.hold, b: w.wait - 1, light: 'day' },          // card: fingers up beside his ear
  { id: 'sniff', a: w.wait, b: w.when - 1, light: 'day' },        // card (closer): wait while the puppy sniffs
  { id: 'touch', a: w.when, b: w.next - 1, light: 'day' },        // card: nose touches the fingers, reward
  { id: 'away', a: w.next, b: w.reward2 - 1, light: 'day' },      // card: fingers taken away
  { id: 'toward', a: w.reward2, b: w.now - 1, light: 'day' },     // card: the puppy moves toward the ear on its own, reward
  { id: 'cue', a: w.now, b: w.keep - 1, light: 'day' },           // card: "Tell a secret" (bubble), he leans in, the puppy whispers
  { id: 'soft', a: w.keep, b: w.if - 1, light: 'day' },           // calm low orbit: soft voice
  { id: 'bouncy', a: w.if, b: w.stay - 1, light: 'day' },         // MISTAKE: bouncy and loud (red cross)
  { id: 'calm', a: w.stay, b: w.say - 1, light: 'day' },          // quiet and calm: the puppy settles for a short break (green check)
  { id: 'yes', a: w.say, b: w.then - 1, light: 'golden' },        // trainer: "yes" + click
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

