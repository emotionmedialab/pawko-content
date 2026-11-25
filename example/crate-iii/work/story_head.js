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
