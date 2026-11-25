// "Sit & stay III" — build duration (30 s -> 60 s), step out of sight, distractions (helper / ball / doorbell), back turned, "okay" + play, the mistake and the fix.
// 3D puppy (dog-puppy.glb) + the 2D bald trainer, 1123 frames, timed to voice.mp3 (Holden). Cloned from sit-stay-ii (approved): same cameras, footprint pairs, bubbles, toss.
// Word frames (voice.mp3, voice.mp3.words.json, round(s*30); sentence starts taken from silence_end): Let's 0 stay 55 | Grab 100 (silence_end 100) treats 103 helper 122 |
// Build 152 (silence_end 152) up 154 thirty 164 then 189 sixty 192 seconds 201 rewarding 229 often 234 first 255 | Next 293 step 301 sight 326 one 339 second 346 | Return 374 reward 404 |
// Stretch 444 time 458 slowly 466 | Now 510 helper 522 walk 530 by 539 | bounce 562 ball 570 ring 590 doorbell 600 | Reward 634 big 640 holds 679 | Then 719 back 741 turned 748 sitting 771 chair 785 |
// Release 817 OK 834 then 872 play 875 | If 914 dog 919 breaks 924 | you 950 added 952 once 975 | Go 1004 back 1006 step 1016 | Say 1039 yes 1044 click 1067 | then 1095 reward 1097 | end 1122.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and
// action is keyed to `w` (+/- a few frames). Camera keys are the locked ones from dog-down-ii / sit-stay-ii (LOCKED SHOT LIBRARY).
// Hard cuts only, no flashes. Puppy at the origin, nose toward +x.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1123, DECK = 0;
// key word frames (first frame of the word)
const w = {
  grab: 100, helper: 122, build: 152, thirty: 164, sixty: 192, rewarding: 229, next: 293, step: 301, sight: 326, one: 339, ret1: 374, reward1: 404, stretch: 444,
  now: 510, walk: 530, bounce: 562, ring: 590, door: 600, big: 634, holds: 679, then1: 719, turned: 748, sitting: 771, chair: 785,
  release: 817, okay: 834, play: 872, if: 914, breaks: 924, added: 950, go: 1004, step2: 1016, say: 1039, yes: 1044, click: 1067, then2: 1095, reward2: 1097, fin: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },                 // trainer kneels beside the sitting puppy, hand signal
  { id: 'setup', a: w.grab, b: w.build - 1, light: 'day' },          // treat jar, then the puppy on the mat; check on "helper"
  { id: 'build', a: w.build, b: w.next - 1, light: 'day' },          // POV: time badge 30 s -> 60 s (ring pulses), two treats while it holds
  { id: 'away', a: w.next, b: w.ret1 - 1, light: 'day' },           // hard cut: footprints go out, puppy alone, head tracks off-screen, "1 s" badge
  { id: 'ret', a: w.ret1, b: w.reward1 - 1, light: 'day' },          // hard cut: trainer kneels beside the puppy, check
  { id: 'reward1', a: w.reward1, b: w.stretch - 1, light: 'day' },   // POV: treat
  { id: 'stretch', a: w.stretch, b: w.now - 1, light: 'day' },       // puppy alone again, footprints stretch out, badge 3 s -> 10 s
  { id: 'walkby', a: w.now, b: w.bounce - 1, light: 'day' },         // helper walks by (off screen): footstep rings, head tracks sideways
  { id: 'ball', a: w.bounce, b: w.ring - 1, light: 'day' },          // a toon ball bounces past in the background
  { id: 'bell', a: w.ring, b: w.big - 1, light: 'day' },             // doorbell (off screen): ding-dong rings, head turns sideways
  { id: 'rewardB', a: w.big, b: w.then1 - 1, light: 'day' },         // POV: big reward (two treats), check
  { id: 'turned', a: w.then1, b: w.sitting - 1, light: 'day' },      // trainer turned away, puppy holds, check
  { id: 'hold', a: w.sitting, b: w.release - 1, light: 'day' },      // POV: puppy holds, check
  { id: 'toss', a: w.release, b: w.play - 1, light: 'day' },         // "Okay!" releases it; a treat is tossed, chomp
  { id: 'play', a: w.play, b: w.if - 1, light: 'day' },              // play: hops and a happy tail
  { id: 'mistake', a: w.if, b: w.go - 1, light: 'day' },             // MISTAKE: breaks the stay (red cross), then sits again
  { id: 'goback', a: w.go, b: w.say - 1, light: 'day' },             // POV: go back a step: badge 60 s -> 30 s, check
  { id: 'yes', a: w.say, b: w.then2 - 1, light: 'golden' },          // trainer: "yes" + click
  { id: 'povFinal', a: w.then2, b: TOTAL - 1, light: 'golden' },     // POV: reward, confetti
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
const MAT = 0.064;
const ST = 1.08;
const DOGPOS = [0, MAT, 0], DOGYAW = Math.PI / 2;      // puppy on the mat, nose toward +x
const TRN = [0.52, MAT, -0.66];
const HOOKP = [0, MAT, -0.48];                          // hook / ret / turned: puppy close to the trainer's card plane
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
const MOUTHS = () => add(NOSE('sit'), [0.06, -0.03, 0]);      // a treat delivered to the sitting puppy

// ---------- trainer card (kneeling; hook / ret / turned / yes). He never moves. ----------
const trainerPlace = () => ({ x: TRN[0], z: TRN[2], y: MAT, s: ST, flip: true, kneel: 1 });

// ---------- footprints (white beads, same trail system): the trainer's path out, off screen ----------
const SP = 0.065, S0 = 0.12, DIR = [0.7, 0.71], PERP = [-0.71, 0.7];
const FPB = () => [NOSE('sit')[0] + 0.05, 0];
const YAW = Math.atan2(-DIR[1], DIR[0]);
// a stage: n footprint pairs out (o0..o1); then the puppy keeps tracking him beyond the last pair, off screen
const STAWAY = { n: 3, o0: w.step, o1: w.sight + 4 }, STRET = { n: 3, o0: w.stretch + 6, o1: w.stretch + 56 };
const pairAt = (i) => {
  const B = FPB(), c = [B[0] + DIR[0] * (S0 + i * SP), B[1] + DIR[1] * (S0 + i * SP)];
  return [[c[0] + PERP[0] * 0.03 - DIR[0] * 0.02, MAT + 0.012, c[1] + PERP[1] * 0.03 - DIR[1] * 0.02, YAW], [c[0] - PERP[0] * 0.03 + DIR[0] * 0.02, MAT + 0.012, c[1] - PERP[1] * 0.03 + DIR[1] * 0.02, YAW]];
};
const stagePts = (f, st) => {
  const pts = [];
  for (let i = 0; i < st.n; i++) if (f >= st.o0 + (st.o1 - st.o0) * (i + 1) / st.n) pts.push(...pairAt(i));
  return pts;
};
/** where the (off screen) walker is: distance along the path in metres */
const EX = 0.55;
const leadD = (f, st) => (f < st.o0 ? 0 : st.n * SP * clamp((f - st.o0) / (st.o1 - st.o0), 0, 1) + EX * sm(ramp(f, st.o1, st.o1 + 24)));
const leadPt = (f, st) => { const d = S0 + leadD(f, st), B = FPB(); return [B[0] + DIR[0] * d, 0.1, B[1] + DIR[1] * d]; };

// ---------- distractions, all off screen: where the puppy looks ----------
const HELPER = (f) => lerp3([1.0, 0.1, 0.8], [1.0, 0.1, -1.0], sm(ramp(f, w.now + 8, w.bounce - 6)));         // the helper walks by (sideways sweep)
const BALLP = (f) => { const u = ramp(f, w.bounce + 1, w.ring - 2); return [lerp(0.3, 0.5, u), 0.06 + 0.2 * Math.abs(Math.sin(Math.PI * 3 * u)), lerp(-0.36, -0.24, u)]; };   // toon ball bounces beside the puppy, at mat level (MAT is added below)
const PLAYB = (f) => { const u = ramp(f, w.play + 2, w.play + 32); return [lerp(0.85, 0.4, u), MAT + 0.075 + 0.3 * Math.abs(Math.cos(Math.PI * 2.5 * u)) * (1 - 0.6 * u), lerp(0.05, 0.2, u)]; };   // the ball is tossed in and bounces; the puppy bounds after it
const BELLT = [1.4, 0.1, -0.9];                                                                                 // the doorbell is behind the puppy's shoulder

// ---------- the puppy ----------
const LOOKD = (f) => [0.9, 0.06, 0.25 * Math.sin(f * 0.03)];   // default gaze: low, drifting a little
const REW = { build: [236, 270], reward1: [416], rewardB: [646, 690] };   // frames a treat reaches the mouth
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { sit: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.3 * Math.sin(f * 0.25), tail: 0.1, neck: 1, aimEyes: true, headTilt: 3 * Math.sin(f * 0.04), ears: -0.05 * Math.sin(f * 0.07) };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  switch (S.id) {
    case 'turned': return { ...base, look: [0.4 + 0.5 * Math.sin(f * 0.07), 0.1, -0.9 + 0.3 * Math.sin(f * 0.05)], neck: 0.5, ears: 0.15 * Math.sin(f * 0.12), wag: 0.3 * Math.sin(f * 0.3), tail: 0.15, headTilt: 6 * Math.sin(f * 0.06), blink: blinkAt(f, 6) ? 1 : 0 };
    case 'hook': case 'ret': {
      return { ...base, pos: HOOKP, look: [TRN[0] + 0.02, 0.42, TRN[2]], neck: 0.7, ears: -0.2, wag: S.id === 'ret' ? Math.sin(f * 0.8) : 0.5 * Math.sin(f * 0.3), tail: S.id === 'ret' ? 0.35 : 0.1 };
    }
    case 'away': case 'stretch': {
      const st = S.id === 'away' ? STAWAY : STRET, L = leadPt(Math.max(f, st.o0), st);
      return { ...base, look: [L[0], 0.1, L[2] + 0.04 * Math.sin(f * 0.1)], neck: 1, ears: -0.2 + 0.15 * Math.sin(f * 0.09), tail: 0.15, wag: 0.2 * Math.sin(f * 0.25), headTilt: 4 * Math.sin(f * 0.05) };
    }
    case 'setup': {
      return { ...base, look: [1.3, -0.3, 0.7 + 0.1 * Math.sin(f * 0.05)], neck: 0.3, headTilt: 10 * Math.sin(Math.PI * ramp(f, w.helper - 20, w.helper + 20)), wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    }
    case 'build': case 'reward1': case 'rewardB': {
      const ts = REW[S.id], ch = Math.max(...ts.map((t) => chompAt(f, t + 2)));
      const bl = ts.some((t) => f > t + 2 && f < t + 8);
      return { ...base, look: W.treatHide || !W.treat ? LOOKD(f) : W.treat, neck: 0.9, jaw: ch, wag: ts.some((t) => f > t + 2) ? Math.sin(f * 0.8) * 0.9 : 0.4 * Math.sin(f * 0.4), tail: ts.some((t) => f > t + 2) ? 0.3 : 0.15, blink: bl ? 1 : base.blink };
    }
    case 'walkby': {
      const H = HELPER(f);
      return { ...base, look: H, neck: 0.4, ears: -0.35 * sm(ramp(f, w.now + 14, w.now + 24)), tail: 0.1, wag: 0.2 * Math.sin(f * 0.25) };
    }
    case 'ball': {
      const B = BALLP(f);
      return { ...base, look: [B[0], B[1], B[2]], neck: 1, ears: -0.35, wag: 0.2 * Math.sin(f * 0.25) };
    }
    case 'bell': {
      const turn = sm(ramp(f, w.door - 2, w.door + 12)) * (1 - sm(ramp(f, w.door + 26, w.door + 40)));
      return { ...base, look: lerp3([1.5, -0.1, 0.4], BELLT, turn), neck: 0.3, ears: -0.35 * turn, headTilt: 8 * turn, wag: 0.3 * Math.sin(f * 0.25) };
    }
    case 'hold': {
      return { ...base, look: [0.9, 0.1, -0.2 + 0.25 * Math.sin(f * 0.05)], neck: 1, ears: 0.1 * Math.sin(f * 0.11), wag: 0.3 * Math.sin(f * 0.3), tail: 0.15 };
    }
    case 'toss': {
      const up = sm(ramp(f, w.okay + 2, w.okay + 28)), walk = sm(ramp(f, FLY.land + 4, FLY.eat - 4)), ch = chompAt(f, FLY.eat), dip = sm(ramp(f, FLY.land + 2, FLY.eat - 6));
      const tr = f >= FLY.a && !W.treatHide && W.treat ? W.treat : null;
      return { ...base, w: { sit: 1 - up, stand: up }, look: tr ? [tr[0], tr[1], tr[2]] : [0.9, 0.0, 0.4], neck: 0.6 + 0.4 * dip, ears: -0.4 * up, tail: 0.4 * up, wag: up > 0.3 ? Math.sin(f * 0.8) * 0.9 : 0.2 * Math.sin(f * 0.25),
        pos: add(lerp3(DOGPOS, [0.03, MAT, 0], up), [0.14 * walk, 0.006 * Math.abs(Math.sin(f * 0.6)) * walk * (1 - sm(ramp(f, FLY.eat - 4, FLY.eat))), 0]), jaw: f >= FLY.eat + 14 ? 0.3 : ch, blink: f > FLY.eat && f < FLY.eat + 6 ? 1 : base.blink };
    }
    case 'play': {   // after the release: bounds after the tossed ball, tail going
      const u = ramp(f, w.play + 2, w.play + 32), B = PLAYB(f), hop = Math.abs(Math.sin((f - w.play) * 0.32)) * 0.05 * (1 - 0.6 * ramp(f, w.if - 10, w.if - 1));
      return { ...base, w: { stand: 1 }, pos: [lerp(0.15, 0.2, sm(u)), MAT + hop, lerp(0, 0.06, sm(u))], yaw: DOGYAW + 0.4 * sm(u), look: [B[0], B[1], B[2]], neck: 0.8, ears: 0.3 * Math.sin(f * 0.5), tail: 0.4, wag: Math.sin(f * 0.9) * 1.3, jaw: 0.3 };
    }
    case 'mistake': {
      const gets = w.breaks, up = M.smooth(M.smooth(ramp(f, gets - 8, gets + 24))) * (1 - sm(ramp(f, w.go - 28, w.go - 4)));
      const settled = ramp(f, gets + 24, gets + 36) * (1 - sm(ramp(f, w.go - 34, w.go - 24))), sway = settled * Math.sin(f * 0.09);
      const turn = sm(ramp(f, gets + 30, gets + 48)) * (1 - sm(ramp(f, w.added + 22, w.added + 42)));
      return { ...base, w: { sit: 1 - up, stand: up }, look: [0.9, 0.0, lerp(0.55, -0.35, turn) + 0.8 * settled * Math.sin((f - gets) * 0.07)], neck: 0.6 - 0.1 * up, ears: -0.3 * up + (f > w.go - 20 && f < w.go ? 0.4 : 0), tail: 0.4 * up,
        wag: up > 0.5 ? Math.sin(f * 0.8) : 0.2 * Math.sin(f * 0.3), pos: add(lerp3(DOGPOS, [0.03, MAT, 0], up), [0.03 * sway, 0, 0.02 * sway]), yaw: DOGYAW + 0.14 * sway, headTilt: f > w.go - 24 ? 5 : 0, blink: f >= gets + 12 && f < gets + 17 ? 1 : base.blink };
    }
    case 'goback': {
      return { ...base, look: LOOKD(f), neck: 0.9, ears: 0.1, blink: base.blink, wag: 0.4 * Math.sin(f * 0.3) };
    }
    case 'yes': {
      return { ...base, look: [TRN[0] + 0.05, 0.5, TRN[2]], neck: 0.7, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    }
    case 'povFinal': {
      const t0 = w.reward2 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, look: W.treatHide || !W.treat ? LOOKD(f) : W.treat, neck: 0.9, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: hand / biscuit / footprints / ball ----------
const FLY = { a: w.okay + 7, land: w.okay + 16, eat: w.okay + 25 }, LAND = [0.5, MAT + 0.03, 0.06];                    // tossed treat: leaves the hand, caught
const treatPath = (f) => {
  const S = shotAt(f), ts = REW[S.id];
  if (ts) {   // each treat: enters from below, reaches the mouth, then the hand pulls away (the last one hides on the chomp)
    for (let i = 0; i < ts.length; i++) {
      const t = ts[i], last = i === ts.length - 1, next = last ? 1e9 : ts[i + 1] - 14;
      if (f < t - 14) return i === 0 ? null : START;
      if (f < next) return KF(f, [[t - 14, START], [t - 2, MOUTHS()], [t + 10, MOUTHS()], [t + (last ? 22 : 20), START]]);
    }
    return START;
  }
  switch (S.id) {
    case 'toss': {
      if (f < FLY.a) return null;
      const u = clamp((f - FLY.a) / (FLY.land - FLY.a), 0, 1), A = [1.3, 0.7, -0.9];
      return [lerp(A[0], LAND[0], u), lerp(A[1], LAND[1], u) + 0.45 * 4 * u * (1 - u), lerp(A[2], LAND[2], u)];
    }
    case 'povFinal': return KF(f, [[w.then2, add(MOUTHS(), [0.3, 0.14, 0.05])], [w.reward2 + 2, MOUTHS()]]);
  }
  return null;
};
const HANDSHOTS = ['build', 'reward1', 'rewardB', 'povFinal'];
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f);
  if (t) W.treat = t;
  if (t && HANDSHOTS.includes(S.id)) W.hand = { treat: t, side: S.id === 'povFinal' ? 0.22 : 0.16 };
  const ts = REW[S.id];
  if ((ts && ts.some((x, i) => f >= x && (i === ts.length - 1 || f < x + 18))) || (S.id === 'povFinal' && f >= w.reward2 + 4) || (S.id === 'toss' && f >= FLY.eat)) W.treatHide = true;
  if (S.id === 'toss') W.treatS = 2.2;
  const bead = (pts) => { W.trail = pts; W.trailS = 1.6; W.trailCol = '#ffffff'; };
  const flat = (pts) => { bead(pts); W.trailFlat = true; W.trailS = 1.8; };
  if (S.id === 'away') flat(stagePts(f, STAWAY));
  if (S.id === 'stretch') flat(stagePts(f, STRET));
  if (S.id === 'ball') { const b = BALLP(f); W.ball = [b[0], b[1] + MAT, b[2]]; }
  if (S.id === 'play') W.ball = PLAYB(f);
  return W;
};

// ---------- the 2D trainer (hook, ret, turned, yes) ----------
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
  if (S.id === 'ret') o.expr = f > w.ret1 + 12 ? 'proud' : 'grin';
  return o;
};

// ---------- cameras (locked keys from dog-down-ii / sit-stay-ii) ----------
const HOOKC = (a, b) => [{ f: a, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: b, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }];
const STEPC = (a, b) => [{ f: a, pos: [1.12, 0.84, 0.88], look: [0.28, 0.4, 0.12], fov: 44 }, { f: b, pos: [1.08, 0.81, 0.85], look: [0.28, 0.4, 0.12], fov: 44 }];   // raised 3/4, closer: dog mid-upper frame, footprints run down the middle
const POVSIT = (a, b) => [{ f: a, pos: [1.02, 0.78, 0.46], look: [0.2, 0.46, 0.0], fov: 42 }, { f: b, pos: [0.98, 0.75, 0.44], look: [0.2, 0.44, 0.0], fov: 42 }];   // dog mid-frame, room above the head for badges
const FACEC = (a, b) => [{ f: a, pos: [1.4, 0.6, 1.15], look: [0.18, 0.44, 0.0], fov: 44 }, { f: b, pos: [1.34, 0.58, 1.1], look: [0.18, 0.44, 0.0], fov: 44 }];   // front 3/4 on the face (the doghouse framing from setup)
const SIDEC = (a, b, dx = 0) => [{ f: a, pos: [0.82 + dx, 0.5, 1.54], look: [0.14 + dx, 0.36, 0.09], fov: 46 }, { f: b, pos: [0.64 + dx, 0.5, 1.38], look: [0.14 + dx, 0.34, 0.09], fov: 46 }];   // dx slides the frame so the tail stays inside
const CAMS = {
  hook: HOOKC(0, w.grab - 1),
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.helper - 6, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },   // jar ... hard cut ...
    { f: w.helper - 5, pos: [1.3, 0.7, 1.05], look: [0.1, 0.34, 0.0], fov: 40 }, { f: w.build - 1, pos: [1.22, 0.66, 0.98], look: [0.1, 0.34, 0.0], fov: 40 }],       // ... to the puppy on the mat
  build: POVSIT(w.build, w.next - 1),
  away: STEPC(w.next, w.ret1 - 1),
  ret: HOOKC(w.ret1, w.reward1 - 1),
  reward1: POVSIT(w.reward1, w.stretch - 1),
  stretch: STEPC(w.stretch, w.now - 1),
  walkby: STEPC(w.now, w.bounce - 1),
  ball: [{ f: w.bounce, pos: [1.4, 0.6, 1.2], look: [0.22, 0.32, -0.1], fov: 44 }, { f: w.ring - 1, pos: [1.37, 0.59, 1.17], look: [0.22, 0.32, -0.1], fov: 44 }],   // wide front 3/4: puppy left, ball beside it
  bell: SIDEC(w.ring, w.big - 1),
  rewardB: POVSIT(w.big, w.then1 - 1),
  turned: FACEC(w.then1, w.sitting - 1),
  hold: POVSIT(w.sitting, w.release - 1),
  toss: [{ f: w.release, pos: [0.72, 0.5, 1.54], look: [0.04, 0.36, 0.09], fov: 46 }, { f: FLY.a - 1, pos: [0.74, 0.5, 1.53], look: [0.06, 0.36, 0.08], fov: 46 }, { f: FLY.land, pos: [0.82, 0.5, 1.5], look: [0.15, 0.36, 0.04], fov: 46 }, { f: FLY.eat, pos: [0.94, 0.5, 1.43], look: [0.26, 0.35, -0.02], fov: 46 }, { f: w.play - 1, pos: [0.94, 0.5, 1.43], look: [0.26, 0.35, -0.02], fov: 46 }],
  play: [{ f: w.play, pos: [1.3, 0.9, 1.1], look: [0.25, 0.28, 0.05], fov: 54 }, { f: w.if - 1, pos: [1.26, 0.88, 1.07], look: [0.25, 0.28, 0.05], fov: 54 }],   // wide enough for the whole dog and the ball
  mistake: SIDEC(w.if, w.go - 1, -0.05).map((k) => ({ ...k, fov: 52 })),
  goback: POVSIT(w.go, w.say - 1),
  yes: [{ f: w.say, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then2 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  povFinal: POVSIT(w.then2, TOTAL - 1),
};
const POVIDS = ['build', 'reward1', 'rewardB', 'hold', 'goback', 'povFinal'];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (POVIDS.includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), head = REF.sit ? REF.sit.head : [0.3, 0.4, 0];
  if (S.id === 'hook' || S.id === 'yes' || S.id === 'ret') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'ball' || S.id === 'turned') return { focus: dist(C.pos, [0.1, 0.22, 0]), cinf: 9 };
  if (S.id === 'bell' || S.id === 'mistake' || S.id === 'toss') return { focus: dist(C.pos, [0.1, 0.3, 0]), cinf: 6 };
  if (['away', 'stretch', 'walkby', 'play'].includes(S.id)) return { focus: dist(C.pos, [0.12, 0.15, 0]), cinf: 4 };
  return { focus: dist(C.pos, head), cinf: 6 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'yes') { const tO = roundAll({ ...trainerYes(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 }); }
  if (S.id === 'hook' || S.id === 'ret') {
    const P = trainerPlace(f), tO = roundAll({ ...trainerAt(f), mirror: P.flip });
    out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: P.x, y: P.y, z: P.z, s: P.s, flip: P.flip, order: 1, ground: MAT, blobW: 0.8 });
  }
  return out;
};
const BUB_OK = [0.2, 0.66, 0.0];   // bubble anchor points (tuned on stills)
const TB = [0.12, 0.47, 0.0];      // time badge beside the sitting puppy (POV cameras; card origin is its foot, centre is 1.125*s above)
const TBL = [0.12, 0.47, 0.05];     // left of TB, for the goback shot (a check sits to its right)
const TBS = [0.12, 0.52, 0.0];   // same, raised 3/4 camera
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] - 0.06 + k * 0.06, at[2] - 0.12], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = add(NOSE('sit'), [-0.08, 0.06, 0]);
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  // time badge with ring pulses (the pulse phase repeats every 22 frames)
  const timeBadge = (text, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b), ph = q(((f - a) % 22) / 22, 2); if (k > 0.02) out.push(FX('tb' + text + k + ph, (p) => T.fxTime(p, text, ph), pos, s * k, { order: 8 })); } };
  // sound rings from off screen (a pulse every 16 frames)
  const sound = (a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b), ph = q(((f - a) % 16) / 16, 2); if (k > 0.02) out.push(FX('sr' + k + ph, (p) => T.fxSound(p, ph, -1), pos, s * k, { order: 8 })); } };
  const burst = (t0, pos, sc) => { const k = q(ramp(f, t0, t0 + 16), 2); if (k > 0 && k < 1) out.push(FX('ck' + t0 + k, (p) => T.fxClick(p, k), pos, sc)); };
  if (S.id === 'setup') badge(T.fxCheck, 'ok', w.helper, w.build, [0.5, 0.1, 0.5], 0.11);
  if (S.id === 'build') {
    timeBadge('30 s', w.thirty - 2, w.sixty - 2, TB, 0.17); timeBadge('60 s', w.sixty - 2, w.rewarding - 10, TB, 0.17);
    for (const t of REW.build) hearts(t + 3, HEAD);
  }
  if (S.id === 'away') timeBadge('1 s', w.one - 2, w.ret1, TBS, 0.15);
  if (S.id === 'ret') badge(T.fxCheck, 'ok', w.ret1 + 12, w.reward1, [-0.05, 0.5, HOOKP[2]], 0.2);
  if (S.id === 'reward1') hearts(REW.reward1[0] + 3, HEAD);
  if (S.id === 'stretch') { timeBadge('3 s', w.stretch + 8, w.stretch + 36, TBS, 0.15); timeBadge('10 s', w.stretch + 36, w.now, TBS, 0.15); }
  if (S.id === 'walkby') sound(w.now + 8, w.bounce - 2, TBS, 0.2);
  if (S.id === 'bell') { sound(w.ring + 6, w.door + 30, [0.38, 0.5, 0.24], 0.2); }
  if (S.id === 'rewardB') { for (const t of REW.rewardB) hearts(t + 3, HEAD, 4, 0.06); badge(T.fxCheck, 'ok', w.holds, w.then1, TB, 0.17); }
  if (S.id === 'turned') badge(T.fxCheck, 'ok', w.turned + 12, w.sitting, [0.1, 0.62, 0.0], 0.15);
  if (S.id === 'hold') badge(T.fxCheck, 'ok', w.chair, w.release, TB, 0.17);
  if (S.id === 'toss') { bubble('bo', 'Okay!', '', '#fbf0b4', w.okay - 2, w.okay + 30, BUB_OK, 0.2); hearts(FLY.eat + 2, add(NOSE('stand'), [0.1, 0.06, 0])); }

  if (S.id === 'mistake') {
    badge(T.fxCross, 'no', w.breaks + 2, w.added + 4, [0.3, 0.55, 0.1], 0.2);
    if (f >= w.go - 26 && f < w.go - 2) { const t = q(ramp(f, w.go - 26, w.go - 2), 2); out.push(FX('si' + t, (p) => T.fxSigh(p, t), add(NOSE('sit'), [0.14, -0.05, 0.04]), 0.12)); }
  }
  if (S.id === 'goback') {
    timeBadge('60 s', w.go, w.step2, TBL, 0.16); timeBadge('30 s', w.step2, w.say, TBL, 0.16);
    badge(T.fxCheck, 'ok', w.step2 + 10, w.say, [0.12, 0.47, -0.16], 0.13);
  }
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, [-0.12, 0.78, -0.45], 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward2 + 3, HEAD, 4, 0.06);
    if (f >= w.reward2) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward2 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('sit'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
