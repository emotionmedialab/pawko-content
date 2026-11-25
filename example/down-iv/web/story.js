// "Down IV" — a down that works anywhere: surfaces, a door, a helper, a TV, real life. 3D puppy (dog-puppy.glb) + the 2D bald trainer, 1147 frames, timed to voice.mp3 (Holden).
// Cloned from the approved Down III. Word frames (voice.mp3.words.json, round(s*30); sentence-start words from silence_end):
// Let's 0 down 28 anywhere 50 | Grab 104 (silence_end 103) mat 126 helper 141 | Practice 176 (silence_end 178) grass 187 tile 195 carpet 211 (whisper 233) and 226 pavement 228 |
// New 272 strange 299 so 325 easy 331 | Next 373 (silence_end 373) step 389 behind 398 door 406 one 424 second 431 | then 457 (silence_end 458) come 461 back 467 |
// Reward 497 (silence_end 497) still 530 down 538 | Now 577 add 597 (silence_end 597) real 602 life 610 | Have 650 (silence_end 650) helper 656 walk 662 TV 704 (turn 691) open 725 door 739 |
// Then 768 (silence_end 768) daily 793 while 817 (silence_end 816) cook 823 guests 844 visit 850 | If 887 (silence_end 887) breaks 896 it 934 hard 950 |
// Lower 982 (silence_end 981) distraction 992 try 1019 again 1025 | Say 1058 yes 1064 click 1088 | then 1113 reward 1118 | end 1146.
// Hard cuts only, no flashes. Puppy at the origin, nose toward +x. Door / helper / TV are never drawn: sound ring + SFX + the puppy's head turning sideways.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1147, DECK = 0;
// key word frames (first frame of the word)
const w = {
  down1: 28, anywhere: 50, grab: 104, mat: 126, helper: 141, prac: 176, grass: 187, tile: 195, carpet: 211, pave: 228, new: 272, strange: 299, so: 325, easy: 331,
  next: 373, step: 389, behind: 398, one: 424, second: 431, then: 457, back: 462, reward1: 497, still: 530, down2: 538, now: 577, real: 602, life: 610,
  have: 650, walk: 662, tv: 704, open: 725, daily: 768, cook: 823, guests: 844, visit: 850, if: 887, breaks: 896, hard: 934, lower: 982, again: 1025,
  say: 1058, yes: 1064, click: 1088, then2: 1113, reward2: 1118, fin: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day', cam: 'hook' },                       // trainer + puppy: sit -> down, hand signal; sparks on "anywhere"
  { id: 'jar', a: w.grab, b: w.mat - 6, light: 'day', cam: 'jar' },                    // "Grab treats": the treat jar
  { id: 'mat', a: w.mat - 5, b: w.helper - 1, light: 'day', cam: 'puppyClose' },       // "a mat": puppy on the mat, check
  { id: 'helper', a: w.helper, b: w.prac - 1, light: 'day', cam: 'clap' },             // "a helper": sound ring off screen, the head turns
  { id: 'prac', a: w.prac, b: w.grass - 3, light: 'day', cam: 'build', g: 'mat' },     // "Practice on": still the mat
  { id: 'grass', a: w.grass - 2, b: w.tile - 3, light: 'day', cam: 'around', g: 'grass' },
  { id: 'tile', a: w.tile - 2, b: w.carpet - 4, light: 'day', cam: 'ask', g: 'tile' },
  { id: 'carpet', a: w.carpet - 3, b: w.pave - 3, light: 'day', cam: 'pov', g: 'carpet' },
  { id: 'pave', a: w.pave - 2, b: w.new - 1, light: 'day', cam: 'build', g: 'pavement' },   // puppy holds the down, check
  { id: 'strange', a: w.new, b: w.so - 1, light: 'day', cam: 'hold', g: 'tile' },       // slippery tile feels strange: head tilt, ears back
  { id: 'easy', a: w.so, b: w.next - 1, light: 'day', cam: 'clap', g: 'mat' },          // start easy: the mat, calm, check
  { id: 'trainerA', a: w.next, b: w.behind - 2, light: 'day', cam: 'hook' },            // kneeling trainer: "Next, step"
  { id: 'door1', a: w.behind - 1, b: w.one - 4, light: 'day', cam: 'build' },           // puppy alone: ears and head track the trainer off screen
  { id: 'door2', a: w.one - 3, b: w.then - 1, light: 'day', cam: 'clap' },              // "one second": time badge, pulse, the puppy holds
  { id: 'trainerB', a: w.then, b: w.reward1 - 1, light: 'day', cam: 'hook' },           // back: kneeling trainer again
  { id: 'povReward', a: w.reward1, b: w.now - 1, light: 'day', cam: 'pov' },            // POV: treat while still down, check
  { id: 'life1', a: w.now, b: w.real - 3, light: 'day', cam: 'hold', g: 'grass' },
  { id: 'life2', a: w.real - 2, b: w.have - 1, light: 'day', cam: 'okay', g: 'carpet' },   // "real life": sparks
  { id: 'helperW', a: w.have, b: w.tv - 14, light: 'day', cam: 'clap', g: 'carpet' },   // helper walks in: footsteps, rings, head turn, check
  { id: 'tv', a: w.tv - 13, b: w.open - 3, light: 'day', cam: 'hold', g: 'tile' },      // TV on: rings, head turn, check
  { id: 'doorOpen', a: w.open - 2, b: w.daily - 1, light: 'day', cam: 'okay', g: 'mat' },   // door opens: creak, rings, head turn, check
  { id: 'daily', a: w.daily, b: w.cook - 8, light: 'day', cam: 'build', g: 'grass' },   // daily: gold pulses
  { id: 'cook', a: w.cook - 7, b: w.guests - 1, light: 'day', cam: 'around', g: 'tile' },   // while you cook: sizzle
  { id: 'guests', a: w.guests, b: w.if - 1, light: 'day', cam: 'ask', g: 'carpet' },    // guests visit: doorbell ring, check
  { id: 'popUp', a: w.if, b: w.lower - 1, light: 'day', cam: 'popUp' },                 // MISTAKE: gets up, red cross
  { id: 'lower', a: w.lower, b: w.again - 8, light: 'day', cam: 'clap', g: 'mat' },     // distraction rings shrink, puppy calms
  { id: 'fix', a: w.again - 7, b: w.say - 1, light: 'day', cam: 'hook' },               // try again: kneeling trainer, puppy down, check
  { id: 'yes', a: w.say, b: w.then2 - 1, light: 'golden', cam: 'yes' },                 // trainer: "yes" + click
  { id: 'povFinal', a: w.then2, b: TOTAL - 1, light: 'golden', cam: 'povFinal' },       // POV: reward, confetti
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
const DOGPOS = [0, MAT, 0], DOGYAW = Math.PI / 2;      // puppy on the mat, nose toward +x
const TRN = [0.52, MAT, -0.66];                         // kneeling trainer card (never moves)
const HOOKP = [0, MAT, -0.48];                          // trainer shots: puppy close to the trainer's card plane
const START = [0.95, 0.12, 0.42];                       // hand rest point: below the frame in POV shots
const REST = [0.9, 0.06, 0.34];                          // puppy looks at the camera side
const SIDE_R = [0.8, 0.0, -0.9], SIDE_L = [0.5, 0.0, 0.95], SIDE_F = [1.4, 0.0, -0.2];   // head-turn targets (sounds off screen)
const gl = (f, a, hold, rise = 8, fall = 14) => sm(ramp(f, a, a + rise)) * (1 - sm(ramp(f, a + hold, a + hold + fall)));   // quick glance envelope

// ---------- reference points from the real rig (filled in by calibrate() once the GLB is loaded) ----------
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
const MOUTH = () => add(NOSE('down'), [0.05, -0.02, 0]);

// ---------- the puppy ----------
const POVT = { povReward: w.down2 - 4 };   // frame the treat reaches the mouth in the POV shot
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { down: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const calm = { ...base, look: REST, neck: 0.3, ears: 0.05 * Math.sin(f * 0.1), breath: 0.35 + 0.3 * Math.sin(f * 0.14), wag: 0.3 * Math.sin(f * 0.22), tail: 0.15 };
  // a sound off screen: the head turns toward `to`, ears back, then returns
  const sound = (a, hold, to, from = REST, extra = {}) => { const g = gl(f, a, hold); return { ...calm, look: lerp3(from, to, g), ears: -0.55 * g - 0.1, headTilt: 6 * g, neck: 0.3, ...extra }; };
  const atTrainer = { ...base, pos: HOOKP, look: [TRN[0] + 0.02, 0.3, TRN[2]], neck: 0.7 };
  switch (S.id) {
    case 'hook': {
      const dn = sm(ramp(f, 4, w.down1 - 2)), exc = f >= w.anywhere - 6 && f < w.anywhere + 40;
      return { ...base, pos: HOOKP, w: { sit: 1 - dn, down: dn }, look: [TRN[0] + 0.02, 0.8 - 0.5 * dn, TRN[2]], neck: 1 - 0.3 * dn,
        ears: exc ? -0.5 : f < w.down1 - 4 ? -0.3 : 0, wag: exc ? Math.sin(f * 0.8) * 1.1 : 0.4 * Math.sin(f * 0.25), tail: exc ? 0.35 : 0.1, jaw: exc ? 0.3 : 0.1 };
    }
    case 'jar': return base;
    case 'mat': return { ...calm, look: [1.6, 0.04 + 0.02 * Math.sin(f * 0.05), 0.3], wag: 0.6 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2, headTilt: 5 * Math.sin(f * 0.09) };
    case 'helper': return sound(w.helper - 2, 22, SIDE_R, REST, { wag: 0.4 * Math.sin(f * 0.3) });
    case 'prac': return { ...calm, wag: 0.5 * Math.sin(f * 0.4), tail: 0.25 };
    case 'grass': return { ...calm, wag: 0.6 * Math.sin(f * 0.45), tail: 0.25, headTilt: 5 };
    case 'tile': return { ...calm, ears: -0.15, headTilt: 4 * Math.sin(f * 0.15) };
    case 'carpet': return { ...calm, wag: 0.5 * Math.sin(f * 0.4), tail: 0.25, blink: f >= w.carpet + 6 && f < w.carpet + 11 ? 1 : base.blink };
    case 'pave': return { ...calm, headTilt: 5 * Math.sin(f * 0.11), wag: 0.5 * Math.sin(f * 0.3), tail: 0.22, ears: -0.4 * gl(f, w.pave + 14, 6, 4, 8) };
    case 'strange': {   // slippery tile: low look at the paws, head tilts, ears back, tail tucked
      const sw = Math.sin(f * 0.07);
      return { ...base, w: { down: 1 }, look: [0.62 + 0.08 * sw, 0.03, 0.32], neck: 0.4, ears: -0.45 + 0.2 * Math.sin(f * 0.13), headTilt: 8 * Math.sin(f * 0.1), tail: 0.0, wag: 0.1 * Math.sin(f * 0.2),
        blink: f >= w.strange + 4 && f < w.strange + 9 ? 1 : base.blink };
    }
    case 'easy': return { ...calm, ears: 0.1, ...(f >= w.easy ? { wag: Math.sin(f * 0.8) * 0.9, tail: 0.3 } : {}), blink: f >= w.easy + 6 && f < w.easy + 11 ? 1 : base.blink };
    case 'trainerA': return { ...atTrainer, ears: f >= w.step - 4 ? -0.3 : 0, wag: 0.4 * Math.sin(f * 0.25) };
    case 'door1': { const g = sm(ramp(f, w.behind - 2, w.behind + 12)); return { ...calm, look: lerp3(REST, SIDE_R, g), ears: -0.5 * g, neck: 0.5, headTilt: 5 * g }; }
    case 'door2': {
      const back = sm(ramp(f, w.then - 14, w.then - 2));
      return { ...calm, look: lerp3(lerp3(SIDE_R, [0.8, 0.14, -1.0], 0.5 + 0.5 * Math.sin(f * 0.07)), [0.6, 0.3, -0.7], back), ears: -0.4 + (f >= w.second && f < w.second + 6 ? -0.4 : 0), neck: 0.5, headTilt: 4 };
    }
    case 'trainerB': return { ...atTrainer, ears: f >= w.back ? -0.3 : 0, ...(f > w.back + 6 ? happy : { wag: 0.4 * Math.sin(f * 0.25) }) };
    case 'povReward': {
      const t1 = POVT.povReward, ch = chompAt(f, t1 + 2);
      return { ...base, w: { down: 1 }, look: W.treatHide || !W.treat ? REST : W.treat, neck: 0.8, jaw: f >= t1 + 16 ? 0.3 : ch,
        ...(f > t1 + 2 ? happy : {}), blink: f > t1 + 2 && f < t1 + 8 ? 1 : base.blink };
    }
    case 'life1': return { ...calm, ears: f >= w.now + 20 ? -0.3 * gl(f, w.now + 20, 4, 3, 6) : 0 };
    case 'life2': return { ...calm, ears: -0.35 * gl(f, w.real - 2, 10), wag: Math.sin(f * 0.5) * 0.6, tail: 0.25 };
    case 'helperW': return sound(w.walk - 8, 36, lerp3(SIDE_R, [0.9, 0.12, -0.2], sm(ramp(f, w.walk, w.tv - 14))), REST);
    case 'tv': return sound(w.tv - 8, 30, SIDE_L);
    case 'doorOpen': return sound(w.open - 8, 34, SIDE_F);
    case 'daily': return { ...calm, wag: 0.5 * Math.sin(f * 0.35), tail: 0.22, ears: f > w.daily + 22 && f < w.daily + 30 ? -0.4 : 0 };
    case 'cook': return sound(w.cook - 8, 20, SIDE_R);
    case 'guests': return sound(w.guests - 6, 30, SIDE_L, REST, { wag: 0.4 * Math.sin(f * 0.3) });
    case 'popUp': {
      const up = M.smooth(M.smooth(ramp(f, w.breaks - 4, w.breaks + 26))), settled = ramp(f, w.breaks + 26, w.breaks + 40);
      const turn = sm(ramp(f, w.breaks + 26, w.breaks + 44)) * (1 - sm(ramp(f, w.breaks + 56, w.breaks + 76))), turn2 = sm(ramp(f, w.hard + 4, w.hard + 20)) * (1 - sm(ramp(f, w.hard + 34, w.hard + 50)));
      const sway = settled * Math.sin(f * 0.06);
      return { ...base, w: { down: 1 - up, stand: up }, look: [0.9, 0.16, lerp(0.55, -0.45, Math.max(turn, turn2))], neck: 0.55 - 0.1 * up, ears: -0.3 * up + (f > w.hard - 8 && f < w.hard - 2 ? -0.5 : 0), tail: 0.4 * up,
        wag: up > 0.5 ? Math.sin(f * 0.8) : 0.2 * Math.sin(f * 0.3), pos: add(lerp3(DOGPOS, [0.03, MAT, 0], up), [0.012 * sway, 0, 0.01 * sway]), yaw: DOGYAW + 0.07 * sway * settled, blink: f >= w.breaks + 8 && f < w.breaks + 13 ? 1 : base.blink };
    }
    case 'lower': { const g = gl(f, w.lower - 2, 12), g2 = 0.5 * gl(f, w.lower + 12, 6); return { ...calm, look: lerp3(REST, SIDE_L, Math.max(g, g2)), ears: -0.5 * g - 0.2 * g2, neck: 0.55, wag: 0.4 * Math.sin(f * 0.3), tail: 0.2 }; }
    case 'fix': return { ...atTrainer, ears: f >= w.again ? -0.4 : 0, ...(f > w.again ? happy : { wag: 0.4 * Math.sin(f * 0.25) }) };
    case 'yes': {
      return { ...base, w: { down: 1 }, look: [TRN[0] + 0.05, 0.35, TRN[2]], neck: 0.7, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0,
        jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    }
    case 'povFinal': {
      const t0 = w.reward2 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, w: { down: 1 }, look: W.treatHide || !W.treat ? REST : W.treat, neck: 0.8, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4,
        blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: hand + biscuit + rings ----------
const treatPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'povReward': { const t1 = POVT.povReward; return KF(f, [[w.reward1, [0.7, 0.18, 0.32]], [t1 - 2, MOUTH()], [t1 + 10, MOUTH()], [t1 + 26, START]]); }
    case 'povFinal': return KF(f, [[w.then2, add(MOUTH(), [0.3, 0.14, 0.05])], [w.reward2 + 2, MOUTH()]]);
  }
  return null;
};
const HANDSHOTS = ['povReward', 'povFinal'];
/** gold ground rings pulsing (time passing) at the given start frames; at most 2 alive at once */
const pulses = (f, starts, life, c, rMax) => starts.map((s0) => { const u = (f - s0) / life; return u >= 0 && u < 1 ? { p: [c[0], MAT + 0.006, c[2]], r: 0.1 + (rMax - 0.1) * sm(u), a: (1 - u) * 0.95 } : null; }).filter(Boolean);
const PUL = { door2: [w.one + 2], daily: [w.daily + 14, w.daily + 26, w.daily + 38] };
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f);
  if (t) W.treat = t;
  if (S.g) W.ground = S.g;
  if (t && HANDSHOTS.includes(S.id)) W.hand = { treat: t, side: S.id === 'povFinal' ? 0.22 : 0.16 };
  if ((S.id === 'povReward' && f >= POVT.povReward) || (S.id === 'povFinal' && f >= w.reward2 + 4)) W.treatHide = true;
  if (PUL[S.id]) W.rings = pulses(f, PUL[S.id], 18, [0.15, 0, 0], 0.42);
  return W;
};

// ---------- the 2D trainer (hook, trainerA/B, fix, yes): kneeling card, never moves ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5;
  return { kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 4,
    near: { to: [318, 690 - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present', lean: 6 };
};
const trainerAt = (f) => {
  const hi = idle(f, 3), S = shotAt(f);
  const o = { hose: true, kneel: 1, expr: 'grin', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.2, headTilt: hi.headTilt, near: 'thumb', far: 'present' };
  if (S.id === 'hook') { o.expr = f > 30 ? 'grin' : 'smile'; o.far = f >= 6 && f < w.down1 + 10 ? 'signal' : 'present'; o.look = 0.6; }
  if (S.id === 'trainerA') { o.expr = 'smile'; o.look = 0.4; }
  if (S.id === 'trainerB') { o.expr = f > w.back ? 'proud' : 'grin'; o.look = 0.4; }
  if (S.id === 'fix') { o.expr = f > w.again + 4 ? 'proud' : 'grin'; }
  return o;
};
const TRAINER_SHOTS = ['hook', 'trainerA', 'trainerB', 'fix'];

// ---------- cameras (keys copied verbatim from dog-down-ii / down-iii; shot start -> end) ----------
const CAMTYPE = {
  hook: [{ pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  yes: [{ pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  jar: [{ pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 }],
  puppyClose: [{ pos: [1.22, 0.52, 1.0], look: [0.04, 0.2, 0.0], fov: 38 }, { pos: [1.1, 0.47, 0.9], look: [0.04, 0.19, 0.0], fov: 38 }],
  ask: [{ pos: [1.26, 0.85, 0.58], look: [0.22, 0.22, 0.0], fov: 42 }, { pos: [1.24, 0.82, 0.56], look: [0.23, 0.2, 0.0], fov: 42 }],
  build: [{ pos: [1.32, 0.66, 0.66], look: [0.18, 0.25, 0.0], fov: 42 }, { pos: [1.24, 0.6, 0.62], look: [0.19, 0.23, 0.0], fov: 42 }],
  around: [{ pos: [1.32, 0.66, 0.66], look: [0.18, 0.27, 0.0], fov: 42 }, { pos: [1.26, 0.62, 0.63], look: [0.19, 0.23, 0.0], fov: 42 }],
  pov: [{ pos: [1.3, 0.8, 0.58], look: [0.24, 0.19, 0.0], fov: 42 }, { pos: [1.25, 0.77, 0.55], look: [0.25, 0.18, 0.0], fov: 42 }],
  clap: [{ pos: [1.5, 0.55, 0.96], look: [0.12, 0.2, 0.0], fov: 40 }, { pos: [1.2, 0.46, 0.76], look: [0.12, 0.21, 0.0], fov: 40 }],
  okay: [{ pos: [1.3, 0.62, 0.7], look: [0.14, 0.3, 0.1], fov: 46 }, { pos: [1.25, 0.6, 0.68], look: [0.14, 0.3, 0.1], fov: 46 }],
  hold: [{ pos: [1.05, 0.72, 1.0], look: [0.12, 0.24, 0.03], fov: 42 }, { pos: [1.0, 0.7, 0.96], look: [0.13, 0.23, 0.03], fov: 42 }],
  popUp: [{ pos: [0.9, 0.5, 1.5], look: [0.22, 0.36, 0.05], fov: 46 }, { pos: [0.72, 0.5, 1.34], look: [0.22, 0.34, 0.05], fov: 46 }],
  povFinal: [{ pos: [1.34, 0.84, 0.72], look: [0.17, 0.2, 0.0], fov: 42 }, { pos: [1.29, 0.81, 0.69], look: [0.18, 0.2, 0.0], fov: 42 }],
};
export const camAt = (f) => {
  const S = shotAt(f), T = CAMTYPE[S.cam], c = camFromKeys([{ f: S.a, ...T[0] }, { f: S.b, ...T[1] }], f, {});
  if (S.cam === 'pov' || S.cam === 'povFinal' || S.cam === 'ask') { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), head = REF.down ? REF.down.head : [0.3, 0.3, 0];
  if (S.cam === 'hook' || S.cam === 'yes') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.cam === 'around') return { focus: dist(C.pos, [0.1, 0.1, 0]), cinf: 8 };
  if (S.cam === 'jar' || S.cam === 'puppyClose') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.cam === 'clap') return { focus: dist(C.pos, [0.1, 0.22, 0]), cinf: 9 };
  if (S.cam === 'popUp') return { focus: dist(C.pos, [0.1, 0.3, 0]), cinf: 6 };
  if (S.cam === 'build' || S.cam === 'okay' || S.cam === 'hold') return { focus: dist(C.pos, [0.12, 0.15, 0]), cinf: 4 };
  return { focus: dist(C.pos, head), cinf: 6 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'yes') { const tO = roundAll({ ...trainerYes(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 }); }
  if (TRAINER_SHOTS.includes(S.id)) {
    const tO = roundAll({ ...trainerAt(f), mirror: true });
    out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: MAT, z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 });
  }
  return out;
};
const BUB_TIME = [0.2, 0.34, -0.02], BUB_YES = [-0.12, 0.78, -0.45];   // bubble anchor points (tuned on stills)
const CHK = [0.2, 0.42, 0.1];                                          // check badge above the puppy (3/4 cameras)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = add(NOSE('down'), [-0.08, 0.06, 0]);
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  // sound rings from an off-screen source: staggered bursts
  const ping = (a, at, s = 0.3, n = 2) => { for (let i = 0; i < n; i++) { const k = q(ramp(f, a + i * 9, a + i * 9 + 16), 2); if (k > 0 && k < 1) out.push(FX("pg" + i + k, (p) => T.fxClick(p, k), at, 1.1 * s * (1 - 0.25 * i))); } };
  const P_R = [0.3, 0.25, -0.2], P_L = [-0.2, 0.0, -0.4], P_F = [0.4, 0.25, -0.05];
  if (S.id === 'hook') {   // "anywhere": sparks around the puppy, which stays down
    [[0.22, 0.5, -0.42, 0], [0.55, 0.34, -0.4, 5], [-0.08, 0.36, -0.4, 9]].forEach(([x, y, z, d], i) => { const a = w.anywhere - 4 + d, k = ramp(f, a, a + 22); if (k > 0 && k < 1) out.push(FX('sp' + i + q(k, 2), (p) => T.fxSpark2(p, 1), [x, y + 0.05 * k, z], 0.2 * M.back(ramp(f, a, a + 7)) * (1 - k * k), { alpha: q(1 - k * k, 2) })); });
  }
  if (S.id === 'mat') badge(T.fxCheck, 'ok', w.mat, w.helper, [0.5, 0.1, 0.5], 0.11);
  if (S.id === 'helper') ping(w.helper + 2, P_R, 0.3);
  if (S.id === 'pave') badge(T.fxCheck, 'ok', w.pave + 8, w.new, CHK, 0.12);
  if (S.id === 'easy') badge(T.fxCheck, 'ok', w.easy, w.next, CHK, 0.12);
  if (S.id === 'door2' || S.id === 'door1') bubble('bt', '1 sec', '', '#e3f2ff', w.one - 3, w.then, BUB_TIME, 0.2);
  if (S.id === 'door1') ping(w.behind, P_R, 0.3, 1);
  if (S.id === 'povReward') { hearts(POVT.povReward + 3, HEAD); badge(T.fxCheck, 'ok', w.down2, w.now, [0.2, 0.34, 0.1], 0.12); }
  if (S.id === 'life2') [[w.real - 2, [0.1, 0.5, 0.08]], [w.life - 2, [0.45, 0.4, 0.08]]].forEach(([a, p0], i) => { const k = ramp(f, a, a + 22); if (k > 0 && k < 1) out.push(FX('sl' + i + q(k, 2), (p) => T.fxSpark2(p, 1), [p0[0], p0[1] + 0.05 * k, p0[2]], 0.11 * M.back(ramp(f, a, a + 7)) * (1 - k * k), { alpha: q(1 - k * k, 2) })); });
  if (S.id === 'helperW') { ping(w.walk, P_R, 0.3); ping(w.walk + 22, P_R, 0.36); badge(T.fxCheck, 'ok', w.tv - 24, w.tv - 13, CHK, 0.12); }
  if (S.id === 'tv') { ping(w.tv - 2, P_L, 0.3); ping(w.tv + 14, P_L, 0.3, 1); badge(T.fxCheck, 'ok', w.open - 16, w.open - 2, CHK, 0.12); }
  if (S.id === 'doorOpen') { ping(w.open - 2, P_F, 0.3); badge(T.fxCheck, 'ok', w.daily - 16, w.daily, CHK, 0.12); }
  if (S.id === 'cook') ping(w.cook - 2, P_R, 0.3);
  if (S.id === 'guests') { ping(w.guests - 2, P_L, 0.3); badge(T.fxCheck, 'ok', w.visit + 2, w.if, CHK, 0.12); }
  if (S.id === 'popUp') badge(T.fxCross, 'no', w.hard - 3, w.lower, [0.3, 0.5, 0.1], 0.2);
  if (S.id === 'lower') { ping(w.lower - 2, P_L, 0.34, 1); ping(w.lower + 12, P_L, 0.2, 1); }
  if (S.id === 'fix') badge(T.fxCheck, 'ok', w.again, w.say, [-0.05, 0.5, HOOKP[2]], 0.2);
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward2 + 3, HEAD, 4, 0.06);
    if (f >= w.reward2) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward2 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('down'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
