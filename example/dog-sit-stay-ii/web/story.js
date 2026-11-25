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
  { id: 'hook', a: 0, b: w.walk - 1, light: 'day' },               // trainer kneels beside the sitting puppy, hand signal
  { id: 'away', a: w.walk, b: w.grab - 1, light: 'day' },          // hard cut: footprints walk away, the puppy stays and watches
  { id: 'setup', a: w.grab, b: w.ask - 1, light: 'day' },          // treat jar, then the puppy on the mat; check on "space"
  { id: 'ask', a: w.ask, b: w.take - 1, light: 'day' },            // POV: stand -> sit, "Stay!" bubble, flat palm held, then pulled away
  { id: 'step1', a: w.take, b: w.reward1 - 1, light: 'day' },      // raised 3/4: footprint pairs out (1 step) and back
  { id: 'reward1', a: w.reward1, b: w.steps - 1, light: 'day' },   // POV: treat for the sitting puppy
  { id: 'steps', a: w.steps, b: w.always - 1, light: 'day' },      // raised 3/4: 2 steps, then 5 steps
  { id: 'backWalk', a: w.always, b: w.dog - 1, light: 'day' },     // footprints walk back to the puppy
  { id: 'back', a: w.dog, b: w.next - 1, light: 'day' },           // hard cut: trainer already beside the puppy; check on "release"
  { id: 'around', a: w.next, b: w.feed - 1, light: 'day' },        // footprint ring around the sitting puppy, which tracks it
  { id: 'povStay', a: w.feed, b: w.dont - 1, light: 'day' },       // POV: two treats while it keeps sitting
  { id: 'mistake1', a: w.dont, b: w.then1 - 1, light: 'day' },     // MISTAKE: called over, gets up, red cross
  { id: 'toss', a: w.then1, b: w.if - 1, light: 'day' },           // "Okay!" releases it; a treat is tossed, chomp
  { id: 'mistake2', a: w.if, b: w.itwas - 1, light: 'day' },       // gets up (cross), quietly sits again (sigh, check)
  { id: 'calm', a: w.itwas, b: w.every - 1, light: 'day' },        // low orbit, relaxed sit, sigh
  { id: 'retWalk', a: w.every, b: w.return - 1, light: 'day' },    // footprints walk back to the puppy
  { id: 'ret', a: w.return, b: w.say2 - 1, light: 'day' },         // hard cut: trainer beside the puppy
  { id: 'yes', a: w.say2, b: w.then2 - 1, light: 'golden' },       // trainer: "yes" + click
  { id: 'povFinal', a: w.then2, b: TOTAL - 1, light: 'golden' },   // POV: reward, confetti
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
const TRN = [0.52, MAT, -0.66];
const HOOKP = [0, MAT, -0.48];                          // hook / back / ret: puppy close to the trainer's card plane
const START = [0.95, 0.12, 0.42];                       // hand rest point: below the frame in POV shots

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
const N_SIT = () => add(NOSE('sit'), [0.06, -0.005, 0]);
const MOUTHS = () => add(NOSE('sit'), [0.06, -0.03, 0]);      // a treat delivered to the sitting puppy
const CATCH = () => add(NOSE('stand'), [0.07, -0.03, 0]);     // the tossed treat is caught here

// ---------- trainer card (kneeling; hook / back / ret / yes). He slides in depth, never stands. ----------
const trainerPlace = () => ({ x: TRN[0], z: TRN[2], y: MAT, s: ST, flip: true, kneel: 1, moving: false });

// ---------- footprints (white beads, same trail system): the trainer's path, off screen ----------
const SP = 0.1, S0 = 0.22, DIR = [0.83, 0.55], PERP = [-0.55, 0.83];
const FPB = () => [NOSE('sit')[0] + 0.05, 0];
const YAW = Math.atan2(-DIR[1], DIR[0]);
// a stage: n footprint pairs out (o0..o1), then back (r0..r1); o0 < 0 = already drawn
const ST1 = { n: 1, o0: w.take + 5, o1: w.take + 17, r0: w.ret1, r1: w.ret1 + 14 }, STA = { n: 2, o0: w.two - 2, o1: w.two + 14, r0: w.two + 21, r1: w.two + 34 };
const STB = { n: 5, o0: w.five - 2, o1: w.five + 22, r0: w.always + 2, r1: w.dog - 4 }, STR = { n: 3, o0: -1, o1: -1, r0: w.every + 1, r1: w.return - 2 }, STAWAY = { n: 3, o0: w.walk + 2, o1: w.walk + 28, r0: 99999, r1: 99999 };
const pairAt = (i, lane) => {
  const B = FPB(), c = [B[0] + DIR[0] * (S0 + i * SP) + PERP[0] * lane, B[1] + DIR[1] * (S0 + i * SP) + PERP[1] * lane];
  return [[c[0] + PERP[0] * 0.03 - DIR[0] * 0.02, MAT + 0.012, c[1] + PERP[1] * 0.03 - DIR[1] * 0.02, YAW], [c[0] - PERP[0] * 0.03 + DIR[0] * 0.02, MAT + 0.012, c[1] - PERP[1] * 0.03 + DIR[1] * 0.02, YAW]];
};
const stagePts = (f, st) => {
  const pts = [];
  for (let i = 0; i < st.n; i++) if (st.o0 < 0 || f >= st.o0 + (st.o1 - st.o0) * (i + 1) / st.n) pts.push(...pairAt(i, 0));
  for (let j = 0; j < st.n; j++) if (f >= st.r0 + (st.r1 - st.r0) * (j + 1) / st.n) pts.push(...pairAt(st.n - 1 - j, 0.13));
  return pts;
};
/** where the (off screen) walker is: distance along the path in metres */
const leadD = (f, st) => {
  const L = st.n * SP;
  if (st.o0 >= 0 && f < st.o0) return 0;
  if (f < st.r0) return st.o0 < 0 ? L : L * clamp((f - st.o0) / (st.o1 - st.o0), 0, 1);
  return L * (1 - clamp((f - st.r0) / (st.r1 - st.r0), 0, 1));
};
const stageAt = (f) => (f < w.grab ? STAWAY : f < w.reward1 ? ST1 : f < w.five ? STA : f < w.dog ? STB : STR);
const leadPt = (f) => { const st = stageAt(f), d = S0 + leadD(f, st), B = FPB(); return [B[0] + DIR[0] * d, 0.3, B[1] + DIR[1] * d]; };
const returning = (f) => { const st = stageAt(f); return f >= st.r0 && f < st.r1 + 8; };
// footprint ring around the puppy for "walk a small circle"
const RING = { c: [0.2, 0, -0.04], r: 0.21 };
const ringU = (g) => ramp(g, w.next + 6, w.next + 62);
const ringPt = (g) => { const a = (20 + 360 * ringU(g)) * Math.PI / 180; return [RING.c[0] + RING.r * Math.cos(a), MAT + 0.012, RING.c[2] + RING.r * Math.sin(a)]; };

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { sit: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.3 * Math.sin(f * 0.25), tail: 0.1, neck: 1 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  switch (S.id) {
    case 'hook': case 'back': case 'ret': {
      return { ...base, pos: HOOKP, look: [TRN[0] + 0.02, 0.8, TRN[2]], ears: -0.2, wag: 0.5 * Math.sin(f * 0.3) };
    }
    case 'away': case 'step1': case 'steps': case 'backWalk': case 'retWalk': {
      const L = leadPt(f), ret = returning(f);
      return { ...base, look: [L[0], 0.3, L[2]], neck: 0.8, ears: -0.2, tail: ret ? 0.35 : 0.15, wag: ret ? 1.0 * Math.sin(f * 0.8) : 0.2 * Math.sin(f * 0.25), headTilt: 4 * Math.sin(f * 0.05) };
    }
    case 'setup': {
      return { ...base, look: [1.6, 0.12 + 0.03 * Math.sin(f * 0.05), 0.3], headTilt: 10 * Math.sin(Math.PI * ramp(f, w.space - 20, w.space + 20)), wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    }
    case 'ask': {
      const s = sm(ramp(f, w.sit - 6, w.sit + 22)), perk = f >= w.say1 && f < w.say1 + 24 ? -0.7 * Math.sin(Math.PI * ramp(f, w.say1, w.say1 + 24)) : 0;
      return { ...base, w: { stand: 1 - s, sit: s }, look: W.lead || [0.95, 0.42, 0.15], neck: 0.75, ears: perk - 0.2, headTilt: f >= w.say1 - 6 && f < w.say1 + 10 ? 8 * Math.sin(Math.PI * ramp(f, w.say1 - 6, w.say1 + 10)) : 0, wag: 0.5 * Math.sin(f * 0.4) };
    }
    case 'reward1': {
      const t1 = POVT.reward1, ch = chompAt(f, t1 + 2);
      return { ...base, look: W.treatHide || !W.treat ? [0.9, 0.3, 0.3] : W.treat, neck: 0.9, jaw: f >= t1 + 16 ? 0.3 : ch, ...(f > t1 + 2 ? happy : {}), blink: f > t1 + 2 && f < t1 + 8 ? 1 : base.blink };
    }
    case 'around': {
      const P = ringPt(clamp(f, w.next + 6, w.feed - 8));
      return { ...base, look: [clamp(P[0], 0.2, 1.0), 0.3, clamp(P[2], -0.3, 0.6)], neck: 0.8, ears: -0.1, wag: 0.3 * Math.sin(f * 0.15) };
    }
    case 'povStay': {
      const t1 = POVT.povStay1, t2 = POVT.povStay2, ch = Math.max(chompAt(f, t1 + 2), chompAt(f, t2 + 2));
      return { ...base, look: W.treatHide || !W.treat ? [0.9, 0.3, 0.3] : W.treat, neck: 0.9, jaw: ch, wag: 0.8 * Math.sin(f * 0.5), tail: 0.25, blink: (f > t1 + 2 && f < t1 + 8) || (f > t2 + 2 && f < t2 + 8) ? 1 : base.blink };
    }
    case 'mistake1': {
      const up = M.smooth(M.smooth(ramp(f, w.call + 8, w.call + 36))), settled = ramp(f, w.call + 36, w.call + 50);
      const sway = settled * Math.sin(f * 0.09), turn = sm(ramp(f, w.call, w.call + 14));
      const glance = sm(ramp(f, w.stay2 - 6, w.stay2 + 8)) * (1 - sm(ramp(f, w.stay2 + 22, w.stay2 + 38)));
      return { ...base, w: { sit: 1 - up, stand: up }, look: [0.9, 0.2, lerp(0.15, 1.2, Math.max(0, turn - glance * 0.7)) + 0.9 * settled * Math.sin((f - w.call) * 0.07)], neck: 0.6 - 0.1 * up, ears: -0.7 * sm(ramp(f, w.call, w.call + 6)) + 0.3 * up, tail: 0.4 * up,
        wag: up > 0.5 ? Math.sin(f * 0.8) : 0.2 * Math.sin(f * 0.3), pos: add(lerp3(DOGPOS, [0.03, MAT, 0], up), [0.05 * sway, 0, 0.03 * sway]), yaw: DOGYAW + 0.2 * sway * settled, headTilt: 5 * turn, blink: f >= w.stay2 + 4 && f < w.stay2 + 9 ? 1 : base.blink };
    }
    case 'toss': {
      const up = sm(ramp(f, w.okay + 2, w.okay + 28)), walk = sm(ramp(f, FLY.land + 6, FLY.eat - 4)), ch = chompAt(f, FLY.eat), dip = sm(ramp(f, FLY.land + 4, FLY.eat - 6));
      const tr = f >= FLY.a && !W.treatHide && W.treat ? W.treat : null;
      return { ...base, w: { sit: 1 - up, stand: up }, look: tr ? [tr[0], tr[1], tr[2]] : [0.9, 0.3, 0.4], neck: 0.6 + 0.4 * dip, ears: -0.4 * up, tail: 0.4 * up, wag: up > 0.3 ? Math.sin(f * 0.8) * 0.9 : 0.2 * Math.sin(f * 0.25),
        pos: add(lerp3(DOGPOS, [0.03, MAT, 0], up), [0.14 * walk, 0.006 * Math.abs(Math.sin(f * 0.6)) * walk * (1 - sm(ramp(f, FLY.eat - 4, FLY.eat))), 0]), jaw: f >= FLY.eat + 14 ? 0.3 : ch, blink: f > FLY.eat && f < FLY.eat + 6 ? 1 : base.blink };
    }
    case 'mistake2': {
      const up = M.smooth(M.smooth(ramp(f, w.gets - 8, w.up + 18))) * (1 - sm(ramp(f, w.reset + 2, w.reset + 28)));
      const settled = ramp(f, w.up + 18, w.up + 32) * (1 - sm(ramp(f, w.reset - 4, w.reset + 6))), sway = settled * Math.sin(f * 0.09);
      const turn = sm(ramp(f, w.up + 26, w.up + 46)) * (1 - sm(ramp(f, w.up + 60, w.up + 80)));
      return { ...base, w: { sit: 1 - up, stand: up }, look: [0.9, 0.2, lerp(0.55, -0.35, turn) + 0.8 * settled * Math.sin((f - w.gets) * 0.07)], neck: 0.6 - 0.1 * up, ears: -0.3 * up + (f > w.reset && f < w.reset + 20 ? 0.4 : 0), tail: 0.4 * up,
        wag: up > 0.5 ? Math.sin(f * 0.8) : 0.2 * Math.sin(f * 0.3), pos: add(lerp3(DOGPOS, [0.03, MAT, 0], up), [0.03 * sway, 0, 0.02 * sway]), yaw: DOGYAW + 0.14 * sway, headTilt: f > w.reset + 10 ? 5 : 0, blink: f >= w.up + 8 && f < w.up + 13 ? 1 : base.blink };
    }
    case 'calm': {
      const lid = f > w.itwas + 14 && f < w.every - 10 ? 0.45 + 0.15 * Math.sin(f * 0.05) : blinkAt(f, 8) ? 1 : 0;
      return { ...base, look: add(NOSE('sit'), [0.45, -0.3, 0.05 + 0.04 * Math.sin(f * 0.03)]), neck: 0.7, blink: lid, breath: 0.35 + 0.35 * Math.sin(f * 0.12), ears: 0.3, wag: 0.3 * Math.sin(f * 0.1) };
    }
    case 'yes': {
      return { ...base, look: [TRN[0] + 0.05, 0.95, TRN[2]], wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    }
    case 'povFinal': {
      const t0 = w.reward2 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, look: W.treatHide || !W.treat ? [0.9, 0.3, 0.3] : W.treat, neck: 0.9, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: hand / biscuit / footprints ----------
const POVT = { reward1: w.reward1 + 10, povStay1: w.feed + 12, povStay2: w.feed + 58 };   // frame a treat reaches the mouth
const FLY = { a: 741, land: 751, eat: 778 }, LAND = [0.5, MAT + 0.03, 0.06];                                         // tossed treat: leaves the hand, caught
const treatPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'reward1': { const t1 = POVT.reward1; return KF(f, [[w.reward1, [0.7, 0.18, 0.32]], [t1 - 2, MOUTHS()], [t1 + 10, MOUTHS()], [t1 + 26, START]]); }
    case 'povStay': {
      const t1 = POVT.povStay1, t2 = POVT.povStay2;
      if (f < t1) return KF(f, [[w.feed, [0.7, 0.18, 0.32]], [t1 - 2, MOUTHS()]]);
      if (f < t1 + 10) return MOUTHS();
      if (f < t2) return KF(f, [[t1 + 10, MOUTHS()], [t1 + 20, START], [t2 - 14, START], [t2 - 2, MOUTHS()]]);
      return MOUTHS();
    }
    case 'toss': {
      if (f < FLY.a) return null;
      const u = clamp((f - FLY.a) / (FLY.land - FLY.a), 0, 1), A = [1.3, 0.7, -0.9];
      return [lerp(A[0], LAND[0], u), lerp(A[1], LAND[1], u) + 0.45 * 4 * u * (1 - u), lerp(A[2], LAND[2], u)];
    }
    case 'povFinal': return KF(f, [[w.then2, add(MOUTHS(), [0.3, 0.14, 0.05])], [w.reward2 + 2, MOUTHS()]]);
  }
  return null;
};
const leadPath = (f) => {
  const S = shotAt(f);
  if (S.id === 'ask') {   // flat palm held beside the chest while it sits and stays, then pulled back below the frame
    const top = [N_SIT()[0] + 0.18, N_SIT()[1] - 0.12, 0.02];
    return KF(f, [[w.ask, [0.75, 0.25, -0.18]], [w.ask + 9, top], [w.say1 + 24, top], [w.say1 + 38, [0.95, 0.12, 0.45]]]);
  }
  return null;
};
const HANDSHOTS = ['reward1', 'povStay', 'povFinal'];
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f), lead = leadPath(f);
  if (t) W.treat = t;
  if (lead) W.lead = lead;
  if (t && HANDSHOTS.includes(S.id)) W.hand = { treat: t, side: S.id === 'povFinal' ? 0.22 : 0.16 };
  if (S.id === 'ask') W.hand = { at: lead, pose: 'five', mode: 'reach', palm: [0, -1, 0], fingers: [-0.85, -0.4, -0.35], grip: 'palm', side: 0.12 };
  if ((S.id === 'reward1' && f >= POVT.reward1) || (S.id === 'povStay' && (f >= POVT.povStay1 && f < POVT.povStay1 + 18 || f >= POVT.povStay2)) || (S.id === 'povFinal' && f >= w.reward2 + 4) || (S.id === 'toss' && f >= FLY.eat)) W.treatHide = true;
  if (S.id === 'toss') W.treatS = 2.2;
  const bead = (pts) => { W.trail = pts; W.trailS = 1.6; W.trailCol = '#ffffff'; };
  const flat = (pts) => { bead(pts); W.trailFlat = true; W.trailS = 1.8; };
  if (S.id === 'away') flat(stagePts(f, STAWAY));
  if (S.id === 'step1') flat(stagePts(f, ST1));
  if (S.id === 'steps') flat(f < w.five ? stagePts(f, STA) : stagePts(f, STB));
  if (S.id === 'backWalk') flat(stagePts(f, STB));
  if (S.id === 'retWalk') flat(stagePts(f, STR));
  if (S.id === 'around' && f >= w.next + 6) {
    const pts = []; let last = null;
    for (let g = w.next + 6; g <= Math.min(f, w.feed - 8); g += 0.5) { const p = ringPt(g); if (!last || Math.hypot(p[0] - last[0], p[2] - last[2]) > 0.055) { pts.push(p); last = p; } }
    bead(pts);
  }
  return W;
};

// ---------- the 2D trainer (hook, back, ret, yes) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5;
  return { kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 4,
    near: { to: [318, 690 - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present', lean: 6 };
};
const trainerAt = (f) => {
  const hi = idle(f, 3), S = shotAt(f), P = trainerPlace(f);
  const o = { hose: true, kneel: P.kneel, expr: 'grin', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.2, headTilt: hi.headTilt, near: 'thumb', far: 'present' };
  if (S.id === 'hook') { o.expr = f > 20 ? 'grin' : 'smile'; o.far = f >= 20 ? 'signal' : 'present'; o.look = 0.6; }
  if (S.id === 'back') o.expr = f > w.dog ? 'proud' : 'grin';
  return o;
};

// ---------- cameras (locked keys from dog-down-ii / dog-down-iii) ----------
const STAND = (a, b) => [{ f: a, pos: [1.32, 0.66, 0.66], look: [0.18, 0.27, 0.0], fov: 42 }, { f: b, pos: [1.26, 0.62, 0.63], look: [0.19, 0.23, 0.0], fov: 42 }];
const HOOKC = (a, b) => [{ f: a, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: b, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }];
const STEPC = (a, b) => [{ f: a, pos: [1.5, 1.0, 1.0], look: [0.4, 0.15, 0.2], fov: 42 }, { f: b, pos: [1.4, 0.94, 0.92], look: [0.38, 0.15, 0.18], fov: 42 }];   // dog-down-ii 'stand' keys, raised for a sitting puppy
const POVSIT = (a, b) => [{ f: a, pos: [1.28, 0.88, 0.56], look: [0.2, 0.22, 0.0], fov: 42 }, { f: b, pos: [1.22, 0.82, 0.53], look: [0.22, 0.16, 0.0], fov: 42 }];
const CAMS = {
  hook: HOOKC(0, w.grab - 1),
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.space - 6, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },   // jar ... hard cut ...
    { f: w.space - 5, pos: [1.22, 0.52, 1.0], look: [0.04, 0.2, 0.0], fov: 38 }, { f: w.ask - 1, pos: [1.1, 0.47, 0.9], look: [0.04, 0.19, 0.0], fov: 38 }],         // ... to the puppy on the mat
  ask: [{ f: w.ask, pos: [1.3, 0.9, 0.6], look: [0.2, 0.33, 0.0], fov: 42 }, { f: w.take - 1, pos: [1.24, 0.84, 0.57], look: [0.22, 0.24, 0.0], fov: 42 }],
  away: STEPC(w.walk, w.grab - 1), step1: STEPC(w.take, w.reward1 - 1), backWalk: STEPC(w.always, w.dog - 1), retWalk: STEPC(w.every, w.return - 1),
  reward1: POVSIT(w.reward1, w.steps - 1),
  steps: STEPC(w.steps, w.always - 1),
  back: HOOKC(w.dog, w.next - 1),
  around: POVSIT(w.next, w.feed - 1),
  povStay: POVSIT(w.feed, w.dont - 1),
  mistake1: [{ f: w.dont, pos: [0.82, 0.5, 1.54], look: [0.14, 0.36, 0.09], fov: 46 }, { f: w.then1 - 1, pos: [0.64, 0.5, 1.38], look: [0.14, 0.34, 0.09], fov: 46 }],
  toss: [{ f: w.then1, pos: [0.82, 0.5, 1.54], look: [0.14, 0.36, 0.09], fov: 46 }, { f: 740, pos: [0.84, 0.5, 1.53], look: [0.16, 0.36, 0.08], fov: 46 }, { f: 751, pos: [0.92, 0.5, 1.5], look: [0.25, 0.36, 0.04], fov: 46 }, { f: 778, pos: [1.04, 0.5, 1.43], look: [0.36, 0.35, -0.02], fov: 46 }, { f: w.if - 1, pos: [1.04, 0.5, 1.43], look: [0.36, 0.35, -0.02], fov: 46 }],
  mistake2: [{ f: w.if, pos: [0.82, 0.5, 1.54], look: [0.14, 0.36, 0.09], fov: 46 }, { f: w.itwas - 1, pos: [0.64, 0.5, 1.38], look: [0.14, 0.34, 0.09], fov: 46 }],
  calm: [{ f: w.itwas, pos: [1.47, 0.47, 1.14], look: [0.12, 0.18, 0.0], fov: 38 }, { f: w.every - 1, pos: [0.36, 0.52, 1.74], look: [-0.02, 0.18, 0.01], fov: 38, path: [[1.0, 0.49, 1.57]] }],
  ret: HOOKC(w.return, w.say2 - 1),
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then2 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  povFinal: POVSIT(w.then2, TOTAL - 1),
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (S.id.startsWith('pov') || S.id === 'ask' || S.id === 'reward1') { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), head = REF.sit ? REF.sit.head : [0.3, 0.4, 0];
  if (S.id === 'hook' || S.id === 'yes' || S.id === 'back' || S.id === 'ret') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'calm') return { focus: dist(C.pos, [0.1, 0.22, 0]), cinf: 9 };
  if (S.id === 'mistake1' || S.id === 'mistake2') return { focus: dist(C.pos, [0.1, 0.3, 0]), cinf: 6 };
  if (S.id === 'step1' || S.id === 'steps' || S.id === 'away' || S.id === 'backWalk' || S.id === 'retWalk' || S.id === 'around' || S.id === 'toss') return { focus: dist(C.pos, [0.12, 0.15, 0]), cinf: 4 };
  return { focus: dist(C.pos, head), cinf: 6 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'yes') { const tO = roundAll({ ...trainerYes(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 }); }
  if (S.id === 'hook' || S.id === 'back' || S.id === 'ret') {
    const P = trainerPlace(f), tO = roundAll({ ...trainerAt(f), mirror: P.flip });
    out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: P.x, y: P.y, z: P.z, s: P.s, flip: P.flip, order: 1, ground: MAT, blobW: 0.8 });
  }
  return out;
};
const BUB_CNT = [0.5, 0.02, 0.45], BUB_CUE = [0.2, 0.42, -0.02], BUB_OK = [0.2, 0.66, 0.0], BUB_YES = [-0.12, 0.78, -0.45];   // bubble anchor points (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = add(NOSE('sit'), [-0.08, 0.06, 0]);
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  const burst = (t0, pos, sc) => { const k = q(ramp(f, t0, t0 + 16), 2); if (k > 0 && k < 1) out.push(FX('ck' + t0 + k, (p) => T.fxClick(p, k), pos, sc)); };
  if (S.id === 'setup') badge(T.fxCheck, 'ok', w.space, w.ask, [0.5, 0.1, 0.5], 0.11);
  if (S.id === 'ask') bubble('bd', 'Stay!', '', '#ffffff', w.say1 - 2, w.say1 + 24, BUB_CUE, 0.2);
  if (S.id === 'reward1') hearts(POVT.reward1 + 3, HEAD);
  if (S.id === 'step1') bubble('c1', '1 step', '', '#ffffff', w.take - 2, w.reward1 - 6, BUB_CNT, 0.2);
  if (S.id === 'steps') { bubble('c2', '2 steps', '', '#ffffff', w.two - 4, w.five - 4, BUB_CNT, 0.2); bubble('c5', '5 steps', '', '#ffffff', w.five - 2, w.always, BUB_CNT, 0.2); }
  if (S.id === 'back') badge(T.fxCheck, 'ok', w.release, w.next, [-0.05, 0.5, HOOKP[2]], 0.2);
  if (S.id === 'povStay') { hearts(POVT.povStay1 + 3, HEAD); hearts(POVT.povStay2 + 3, HEAD); badge(T.fxCheck, 'ok', w.sitting, w.dont, [0.2, 0.62, 0.1], 0.14); }
  if (S.id === 'mistake1') {
    burst(w.call, [0.55, 0.12, -0.2], 0.3); burst(w.call + 9, [0.55, 0.23, -0.2], 0.2);
    badge(T.fxCross, 'no', w.stay2 - 3, w.then1, [0.3, 0.55, 0.1], 0.2);
  }
  if (S.id === 'toss') { bubble('bo', 'Okay!', '', '#fbf0b4', w.okay - 2, w.okay + 30, BUB_OK, 0.2); hearts(FLY.eat + 2, add(NOSE('stand'), [0.1, 0.06, 0])); }
  if (S.id === 'mistake2') {
    badge(T.fxCross, 'no', w.up - 3, w.reset, [0.3, 0.55, 0.1], 0.2);
    if (f >= w.reset + 4 && f < w.reset + 32) { const t = q(ramp(f, w.reset + 4, w.reset + 32), 2); out.push(FX('si' + t, (p) => T.fxSigh(p, t), add(NOSE('sit'), [0.14, -0.05, 0.04]), 0.12)); }
    badge(T.fxCheck, 'ok', w.reset + 26, w.itwas, [0.3, 0.55, 0.1], 0.14);
  }
  if (S.id === 'calm' && f >= w.hard && f < w.hard + 28) { const t = q(ramp(f, w.hard, w.hard + 28), 2); out.push(FX('si' + t, (p) => T.fxSigh(p, t), add(NOSE('sit'), [0.12, -0.1, 0.08]), 0.12)); }
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward2 + 3, HEAD, 4, 0.06);
    if (f >= w.reward2) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward2 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('sit'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
