// "Place II" — go to the place mat, even when the doorbell rings. 3D puppy (dog-puppy.glb) + the 2D bald trainer, 1145 frames, timed to voice.mp3 (Holden).
// Cloned from the approved Down III. New: a coral place mat (W.rug), a real walk cycle (gait) to the mat, a pointing POV hand, doorbell = sound rings + head turn, time badge.
// Word frames (voice.mp3.words.json, round(s*30)): Let's 0 go 31 place 38 even 65 (silence_end 67) doorbell 81 rings 92 | Grab 124 (silence_end 123; whisper 127) mat 131 treats 157 helper 181 |
// Stand 216 (silence_end 215) steps 230 say 266 (silence_end 266; whisper 263) place 281 point 310 (silence_end 310; whisper 312) mat 329 | Reward 359 (silence_end 359; whisper 358) dog 381 goes 387 there 397 |
// Next 435 (silence_end 431; whisper 437) helper 463 ring 472 bell 485 | Reward 515 your 520 going 548 mat 566 staying 583 | Then 620 (silence_end 618; whisper 622) slowly 622 build 632 minute 670 more 686 |
// Always 719 (silence_end 717; whisper 724) release 724 OK 743 | so 777 over 817 | If 845 (silence_end 847; whisper 837) leaves 860 mat 879 don't 903 scold 911 | Quietly 944 reset 958 make 990 easier 1013 |
// Say 1051 (silence_end 1051; whisper 1054) yes 1055 click 1084 | then 1115 (silence_end 1117; whisper 1112) reward 1121 | end 1144.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and
// action is keyed to `w` (+/- a few frames). Pointers: HAND in POV shots, PAW cursor in floating shots.
// Hard cuts only, no flashes. Puppy at the origin, nose toward +x.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1145, DECK = 0;
// key word frames (first frame of the word)
const w = {
  go: 31, place1: 38, even: 65, door: 81, rings: 92, grab: 124, mat1: 131, treats: 157, helper1: 181, stand: 216, steps: 230, say: 266, place2: 281, point: 310, mat2: 329,
  reward1: 359, dog: 381, there: 397, next: 435, helper2: 463, ring: 472, bell: 485, reward2: 515, going: 548, mat3: 566, staying: 583,
  then1: 620, build: 632, minute: 670, more: 686, always: 719, okay: 743, so: 777, over: 817, if: 845, leaves: 860, mat4: 879, dont: 903, scold: 911,
  quietly: 944, reset: 958, make: 990, easier: 1013, say2: 1051, yes: 1055, click: 1084, then2: 1115, reward3: 1121, fin: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },              // trainer + puppy: walks to the mat on "place", lies down; the doorbell turns its head
  { id: 'setup', a: w.grab, b: w.stand - 1, light: 'day' },       // mat close-up (check), treat jar (hard cut), puppy looks toward the helper
  { id: 'ask', a: w.stand, b: w.reward1 - 1, light: 'day' },      // POV: a few steps away, "Place!" bubble, pointing hand, puppy walks to the mat and lies down
  { id: 'povReward', a: w.reward1, b: w.next - 1, light: 'day' }, // POV: reward on the mat, check
  { id: 'bell', a: w.next, b: w.reward2 - 1, light: 'day' },      // helper rings the bell (off screen): sound rings, head turns
  { id: 'goStay', a: w.reward2, b: w.then1 - 1, light: 'day' },   // walks to the mat and stays: reward + check
  { id: 'build', a: w.then1, b: w.always - 1, light: 'day' },     // time builds: ring pulses + stopwatch badge
  { id: 'okay', a: w.always, b: w.so - 1, light: 'day' },         // "Okay!" bubble releases the puppy up
  { id: 'over', a: w.so, b: w.if - 1, light: 'day' },             // released: steps off the mat, wags, check on "over"
  { id: 'leave', a: w.if, b: w.quietly - 1, light: 'day' },       // MISTAKE: leaves the mat, red cross, no scolding
  { id: 'fix', a: w.quietly, b: w.say2 - 1, light: 'day' },       // reset + easier: the mat is one step away, check
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

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 135, el: 50, sky: '#c4d6f2', ground: '#8a8262', hemi: 1.2, sun: '#fff1dc', sunI: 2.4, fog: '#cadcf0', fogNear: 60, fogFar: 700,
    skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.08, vig: 0.2, shadowExt: 3 },
  golden: { az: 120, el: 30, sky: '#ffe8cc', ground: '#8a7a62', hemi: 1.2, sun: '#ffe2bc', sunI: 2.4, fog: '#f4d6b0', fogNear: 60, fogFar: 650,
    skyTop: '#6f8fd8', skyHor: '#ffd2a0', sat: 1.04, vig: 0.24, shadowExt: 3, gain: '#fffaf2' },
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });

// ---------- staging ----------
const MAT = 0.064, ST = 1.08;
const DOGPOS = [0, MAT, 0], DOGYAW = Math.PI / 2;      // puppy lying on the place mat at the origin, nose toward +x
const TRN = [0.52, MAT, -0.66];
const HOOKP = [0, MAT, -0.48];                          // hook / fix: puppy close to the trainer's card plane
const START = [0.95, 0.12, 0.42];                       // hand rest point: below the frame in POV shots
const FAR = [-0.62, MAT, -0.02];                        // "a few steps away": where the puppy waits before walking to the mat
const NEAR = [-0.5, MAT, 0.18];                         // after the bell: waits here, a little off the mat

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
const FLOOR = () => [NOSE('down')[0] + 0.045, MAT + 0.05, 0];
const REWARD = () => [NOSE('down')[0] + 0.06, NOSE('down')[1] - 0.09, 0];
const MOUTH = () => add(NOSE('down'), [0.05, -0.02, 0]);

// ---------- the walk: real stepping (gait phase follows the distance walked) ----------
const STRIDE = 0.42;
/** straight walk from A to B between frames t0..t1: position, heading, gait phase and speed (m/frame) */
const leg = (f, t0, t1, A, B) => {
  const s = sm(ramp(f, t0, t1)), s2 = sm(ramp(f + 1, t0, t1)), L = Math.hypot(B[0] - A[0], B[2] - A[2]);
  return { p: lerp3(A, B, s), yaw: Math.atan2(B[0] - A[0], B[2] - A[2]), ph: (L * s) / STRIDE, sp: L * (s2 - s), s };
};
const gaitOf = (g) => (g.sp > 0.0015 ? { phase: g.ph, amp: 26, lift: 1.15, k: clamp(g.sp / 0.009) } : undefined);
/** yaw: the heading while walking, eased in/out of the resting heading (DOGYAW) around a leg */
const yawOf = (g, f, t0, t1) => lerp(DOGYAW, g.yaw, sm(ramp(f, t0 - 8, t0 + 4)) * (1 - sm(ramp(f, t1 - 4, t1 + 8))));

// the place mat for each shot (the cut hides every move): { x, z, sx, sz }
const rugAt = (f) => {
  const S = shotAt(f);
  if (S.id === 'hook') return { x: 0.25, z: -0.46, sx: 0.95, sz: 0.75 };
  if (S.id === 'fix') return { x: 0.4, z: -0.42, sx: 0.9, sz: 0.75 };
  if (S.id === 'leave') return { x: -0.5, z: 0, sx: 0.95, sz: 1 };
  if (S.id === 'yes') return { x: 0.14, z: 0, sx: 1, sz: 1 };
  if (S.id === 'setup') return { x: 0.52, z: 0.08, sx: 0.8, sz: 0.8 };
  return { x: 0.02, z: 0, sx: 1, sz: 1 };
};

// ---------- the puppy ----------
const SND = { hook: [-0.02, 0.0, -0.1], bell: [-0.5, -0.4, 0.52] };   // where the doorbell rings are drawn (the bell itself is off screen)
const DOOR = [-0.35, 0.2, 1.0];                                          // the puppy turns its head toward the door
const ringK = (f, a, b) => sm(ramp(f, a, a + 8)) * (1 - sm(ramp(f, b, b + 14)));
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { down: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  switch (S.id) {
    case 'hook': {
      const up = sm(ramp(f, 14, 30)), dn = sm(ramp(f, 54, 82)), g = leg(f, w.go, 64, [-0.02, MAT, HOOKP[2]], [0.25, MAT, HOOKP[2]]);
      const k = ringK(f, w.door + 3, w.rings + 14);
      const lk = lerp3([TRN[0] + 0.02, 0.5 - 0.2 * dn, TRN[2]], DOOR, k);
      return { ...base, pos: g.p, yaw: yawOf(g, f, w.go, 64), w: { sit: 1 - up, stand: up * (1 - dn), down: up * dn }, gait: gaitOf(g), look: lk, neck: 1 - 0.3 * k, ears: -0.9 * k + (f < w.go - 4 ? -0.3 : 0), headTilt: 6 * k,
        wag: k > 0.2 ? 0.2 * Math.sin(f * 0.3) : 0.4 * Math.sin(f * 0.25), tail: 0.1, jaw: 0.1 };
    }
    case 'setup': {
      const toH = sm(ramp(f, w.helper1 - 4, w.helper1 + 12));
      return { ...base, pos: [0.0, MAT, 0.0], w: { sit: 1 }, look: lerp3([0.5, 0.05, 0.1], [0.2, 0.15, -1.4], toH), neck: 1, headTilt: 8 * Math.sin(Math.PI * ramp(f, w.mat1 - 10, w.mat1 + 20)) + 6 * toH,
        wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 - 0.5 * toH };
    }
    case 'ask': {
      const up = sm(ramp(f, w.place2 + 3, w.place2 + 20)), dn = sm(ramp(f, w.mat2 + 6, w.reward1 - 2));
      const g = leg(f, w.place2 + 18, w.mat2 + 12, FAR, DOGPOS);
      const hand = W.hand ? add(W.hand.at, [0, 0.12, 0]) : [1.3, 0.35, 0.5];
      const k1 = sm(ramp(f, 238, 250)) * (1 - sm(ramp(f, 262, 274))), cam0 = lerp3([1.4, 0.0, 0.45], [-0.05, 0.0, 0.05], k1);
      const lk = f < w.place2 - 6 ? cam0 : f < w.mat2 + 14 ? lerp3([1.4, 0.0, 0.45], [0.2, 0.2, 0.02], sm(ramp(f, w.place2, w.place2 + 18))) : [0.9, 0.24, 0.3];
      const sw = (1 - up) * Math.sin(f * 0.09);
      return { ...base, pos: add(g.p, [0.01 * sw, 0, 0.012 * sw]), roll: 3 * sw, yaw: yawOf(g, f, w.place2 + 18, w.mat2 + 12), w: { sit: 1 - up, stand: up * (1 - dn), down: up * dn }, gait: gaitOf(g), look: lk, neck: f < w.place2 + 18 ? 1 : 0.7,
        ears: f >= w.place2 - 4 && f < w.place2 + 14 ? -0.6 : (f >= 226 && f < 232) || (f >= 254 && f < 259) ? -0.5 : -0.1, headTilt: f >= w.place2 - 4 && f < w.place2 + 10 ? 8 * Math.sin(Math.PI * ramp(f, w.place2 - 4, w.place2 + 10)) : 0,
        wag: up > 0.2 ? 0.8 * Math.sin(f * 0.5) : 0.3 * Math.sin(f * 0.3), tail: 0.2 + 0.2 * up };
    }
    case 'povReward': {
      const t1 = POVT.povReward, ch = chompAt(f, t1 + 2);
      return { ...base, w: { down: 1 }, look: W.treatHide || !W.treat ? [0.9, 0.24, 0.3] : W.treat, neck: 0.8, jaw: f >= t1 + 16 ? 0.3 : ch,
        ...(f > t1 + 2 ? happy : {}), blink: f > t1 + 2 && f < t1 + 8 ? 1 : base.blink };
    }
    case 'bell': {
      const k = ringK(f, w.ring + 2, w.bell + 12), up = sm(ramp(f, w.reward2 - 22, w.reward2 - 2));
      const kr = sm(ramp(f, w.next + 12, w.next + 24)) * (1 - sm(ramp(f, w.next + 38, w.next + 50))), lk = lerp3(lerp3([1.4, -0.1, 0.5], [0.0, 0.0, 0.0], kr), DOOR, k);
      const flick = (f >= w.next + 14 && f < w.next + 20) || (f >= w.helper2 - 8 && f < w.helper2 - 2) ? -0.5 : 0;
      return { ...base, pos: NEAR, w: { sit: 1 - up, stand: up }, look: lk, neck: 1 - 0.3 * k, ears: flick - 0.9 * k, headTilt: 7 * k, breath: 0.35 + 0.3 * Math.sin(f * 0.12),
        wag: 0.25 * Math.sin(f * 0.22), tail: 0.15 };
    }
    case 'goStay': {
      const dn = sm(ramp(f, w.going + 6, w.staying - 1)), g = leg(f, w.reward2 + 6, w.mat3 - 6, NEAR, DOGPOS), t1 = POVT.goStay, ch = chompAt(f, t1 + 2);
      const lk = f < w.mat3 + 12 ? [1.4, 0.0, 0.5] : W.treatHide || !W.treat ? [0.9, 0.24, 0.3] : W.treat;
      return { ...base, pos: g.p, yaw: yawOf(g, f, w.reward2 + 6, w.mat3 - 6), w: { stand: 1 - dn, down: dn }, gait: gaitOf(g), look: f >= t1 - 6 && W.treat && !W.treatHide ? W.treat : lk, neck: 0.75,
        jaw: f >= t1 + 16 ? 0.3 : ch, ears: f < w.reward2 + 14 ? -0.4 : 0, ...(f > t1 + 2 ? happy : { wag: 0.3 * Math.sin(f * 0.3) }), blink: f > t1 + 2 && f < t1 + 8 ? 1 : base.blink };
    }
    case 'build': {
      const flick = (f >= w.build + 24 && f < w.build + 30) || (f >= w.minute + 18 && f < w.minute + 24) ? -0.5 : 0;
      return { ...base, w: { down: 1 }, look: [0.9, 0.0, 0.35 + 0.1 * Math.sin(f * 0.04)], neck: 0.75, ears: flick, wag: 0.3 * Math.sin(f * 0.2), tail: 0.15, breath: 0.4 + 0.3 * Math.sin(f * 0.12),
        headTilt: 5 * Math.sin(f * 0.03) };
    }
    case 'okay': {
      const up = sm(ramp(f, w.okay + 2, w.okay + 30));
      return { ...base, w: { down: 1 - up, stand: up }, look: [0.9, lerp(0.05, -0.1, up), 0.5], neck: 0.4 - 0.1 * up, ears: -0.5 * up, tail: 0.4 * up, wag: up > 0.3 ? Math.sin(f * 0.8) : 0.2 * Math.sin(f * 0.25),
        pos: lerp3(DOGPOS, [0.03, MAT, 0], up), jaw: up > 0.3 ? 0.3 : 0, blink: f >= w.okay + 34 && f < w.okay + 40 ? 1 : base.blink };
    }
    case 'over': {
      const A = [0.03, MAT, 0], B = [0.34, MAT, 0.06], g = leg(f, w.so + 14, w.over - 6, A, B);
      const arrive = sm(ramp(f, w.over - 8, w.over + 8));
      return { ...base, pos: g.p, yaw: yawOf(g, f, w.so + 14, w.over - 6), w: { stand: 1 }, gait: gaitOf(g), look: lerp3([1.7, 0.0, 0.5], [1.7, 0.0, 0.9], arrive), neck: 0.7, ears: -0.4 * arrive,
        wag: Math.sin(f * 0.8) * (0.5 + 0.6 * arrive), tail: 0.35, jaw: 0.3 };
    }
    case 'leave': {
      const up = sm(ramp(f, w.leaves - 12, w.leaves + 14)), g = leg(f, w.leaves + 8, w.mat4 + 40, [-0.2, MAT, 0], [0.02, MAT, 0.02]);
      const stay = 1 - sm(ramp(f, w.leaves + 4, w.leaves + 20)), back = sm(ramp(f, w.mat4 + 36, w.dont + 4));
      const lk = lerp3(lerp3([0.9, 0.24, 0.3], [1.6, 0.3, 0.4], 1 - stay), [0.0, 0.25, 0.3], back);
      const sway = back * Math.sin(f * 0.07);
      return { ...base, pos: add(f < w.leaves + 8 ? [-0.2, MAT, 0] : g.p, [0, 0, 0.01 * sway]), yaw: yawOf(g, f, w.leaves + 8, w.mat4 + 40) + 0.12 * back, w: { down: 1 - up, stand: up }, gait: gaitOf(g), look: lk, neck: 0.65, ears: back * -0.4,
        headTilt: 8 * back * Math.sin(f * 0.09), wag: 0.2 + back * 0.3 * Math.sin(f * 0.25), tail: 0.15, blink: f >= w.leaves + 14 && f < w.leaves + 19 ? 1 : base.blink };
    }
    case 'fix': {
      const sit = sm(ramp(f, w.reset - 6, w.reset + 14)), g = leg(f, w.make - 6, w.easier - 3, [0.1, MAT, HOOKP[2]], [0.33, MAT, HOOKP[2]]), dn = sm(ramp(f, w.easier - 12, w.easier + 18));
      const tr = [TRN[0] + 0.02, 0.35, TRN[2]];
      const sitW = sit * (1 - sm(ramp(f, w.make - 14, w.make - 4)));
      return { ...base, pos: g.p, yaw: yawOf(g, f, w.make - 6, w.easier - 3), w: { sit: sitW * (1 - dn), stand: (1 - sitW) * (1 - dn), down: dn }, gait: gaitOf(g), look: tr, neck: 1,
        ears: f >= w.easier - 6 ? -0.4 : -0.1, wag: f > w.easier ? Math.sin(f * 0.8) * 1.0 : 0.3 * Math.sin(f * 0.25), tail: f > w.easier ? 0.3 : 0.1 };
    }
    case 'yes': {
      return { ...base, pos: [0.12, MAT, 0], w: { down: 1 }, look: [TRN[0] + 0.05, 0.3, TRN[2]], neck: 0.7, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0,
        jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    }
    case 'povFinal': {
      const t0 = w.reward3 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, w: { down: 1 }, look: W.treatHide || !W.treat ? [0.9, 0.24, 0.3] : W.treat, neck: 0.8, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4,
        blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: hand / paw pointer + biscuit + rings ----------
const POVT = { povReward: w.reward1 + 16, goStay: w.staying + 6 };   // frame the treat reaches the mouth in each POV shot
const treatPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'povReward': { const t1 = POVT.povReward; return KF(f, [[w.reward1, [0.7, 0.18, 0.32]], [t1 - 2, MOUTH()], [t1 + 10, MOUTH()], [t1 + 26, START]]); }
    case 'goStay': { const t1 = POVT.goStay; if (f < t1 - 16) return null; return KF(f, [[t1 - 16, START], [t1 - 2, MOUTH()], [t1 + 10, MOUTH()], [t1 + 26, START]]); }
    case 'povFinal': return KF(f, [[w.then2, add(MOUTH(), [0.3, 0.14, 0.05])], [w.reward3 + 2, MOUTH()]]);
  }
  return null;
};
// the pointing hand: rises from below the frame, points at the mat while the puppy walks, then pulls back
const POINT_AT = [0.55, 0.2, 0.1];
const pointPath = (f) => KF(f, [[w.place2 + 2, START], [w.place2 + 18, POINT_AT], [w.mat2 + 4, add(POINT_AT, [-0.04, 0, 0])], [w.reward1 - 8, START]]);
const HANDSHOTS = ['povReward', 'povFinal', 'goStay'];
/** gold ground rings pulsing (time passing) at the given start frames; at most 2 alive at once */
const pulses = (f, starts, life, c, rMax) => starts.map((s0) => { const u = (f - s0) / life; return u >= 0 && u < 1 ? { p: [c[0], MAT + 0.012, c[2]], r: 0.1 + (rMax - 0.1) * sm(u), a: (1 - u) * 0.95 } : null; }).filter(Boolean);
const PUL = { build: [w.then1 + 4, w.then1 + 30, w.build + 36, w.minute - 14, w.minute + 10, w.more + 2, w.more + 22, w.always - 22], fix: [w.easier + 16, w.easier + 30] };
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f);
  if (t) W.treat = t;
  W.rug = rugAt(f);
  if (t && HANDSHOTS.includes(S.id)) W.hand = { treat: t, side: S.id === 'povFinal' ? 0.22 : 0.16 };
  if (S.id === 'ask' && f >= w.place2 + 2 && f < w.reward1 - 3) W.hand = { at: pointPath(f), pose: 'point', mode: 'reach', palm: [0, -1, 0], fingers: [-0.9, -0.2, -0.3], grip: 'palm', side: 0.2 };
  if ((S.id === 'povReward' && f >= POVT.povReward) || (S.id === 'goStay' && f >= POVT.goStay) || (S.id === 'povFinal' && f >= w.reward3 + 4)) W.treatHide = true;
  if (S.id === 'fix') W.rings = pulses(f, PUL.fix, 16, [0.33, 0, HOOKP[2]], 0.4);
  else if (PUL[S.id]) W.rings = pulses(f, PUL[S.id], 24, [0.1, 0, 0], 0.5);
  return W;
};

// ---------- the 2D trainer (hook, fix, yes): kneeling, never moves ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5;
  return { kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 4,
    near: { to: [318, 690 - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present', lean: 6 };
};
const trainerAt = (f) => {
  const hi = idle(f, 3), S = shotAt(f);
  const o = { hose: true, kneel: 1, expr: 'grin', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.2, headTilt: hi.headTilt, near: 'thumb', far: 'present' };
  if (S.id === 'hook') { o.expr = f > 30 ? 'grin' : 'smile'; o.far = f >= 6 && f < w.place1 + 24 ? 'signal' : 'present'; o.look = 0.6; }
  if (S.id === 'fix') { o.expr = f > w.easier ? 'proud' : 'grin'; }
  return o;
};

// ---------- cameras ----------
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  setup: [{ f: w.grab, pos: [1.6, 0.62, 1.25], look: [0.15, 0.2, 0.0], fov: 38 }, { f: w.treats - 6, pos: [1.52, 0.6, 1.18], look: [0.15, 0.2, 0.0], fov: 38 },
    { f: w.treats - 5, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.helper1 - 6, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },      // mat ... hard cut to the jar ...
    { f: w.helper1 - 5, pos: [1.6, 0.62, 1.25], look: [0.15, 0.2, 0.0], fov: 38 }, { f: w.stand - 1, pos: [1.52, 0.6, 1.18], look: [0.15, 0.2, 0.0], fov: 38 }],       // ... and back to the puppy
  ask: [{ f: w.stand, pos: [0.7, 0.68, 0.4], look: [-0.42, 0.3, 0.0], fov: 38 }, { f: w.say, pos: [1.5, 0.9, 0.56], look: [-0.12, 0.18, 0.0], fov: 42 }, { f: w.reward1 - 1, pos: [1.46, 0.88, 0.54], look: [-0.1, 0.17, 0.0], fov: 42 }],   // the trainer steps back
  povReward: [{ f: w.reward1, pos: [1.3, 0.8, 0.58], look: [0.24, 0.19, 0.0], fov: 42 }, { f: w.next - 1, pos: [1.25, 0.77, 0.55], look: [0.25, 0.18, 0.0], fov: 42 }],
  bell: [{ f: w.next, pos: [1.0, 0.6, 0.65], look: [-0.45, 0.25, 0.15], fov: 40 }, { f: w.reward2 - 1, pos: [0.96, 0.58, 0.62], look: [-0.44, 0.25, 0.15], fov: 40 }],
  goStay: [{ f: w.reward2, pos: [1.45, 0.84, 0.6], look: [-0.1, 0.18, 0.04], fov: 42 }, { f: w.mat3, pos: [1.34, 0.82, 0.58], look: [0.1, 0.18, 0.02], fov: 42 }, { f: w.then1 - 1, pos: [1.3, 0.8, 0.58], look: [0.2, 0.18, 0.0], fov: 42 }],
  build: [{ f: w.then1, pos: [1.32, 0.66, 0.66], look: [0.18, 0.25, 0.0], fov: 42 }, { f: w.always - 1, pos: [1.24, 0.6, 0.62], look: [0.19, 0.23, 0.0], fov: 42 }],
  okay: [{ f: w.always, pos: [1.3, 0.62, 0.7], look: [0.14, 0.3, 0.1], fov: 46 }, { f: w.so - 1, pos: [1.25, 0.6, 0.68], look: [0.14, 0.3, 0.1], fov: 46 }],
  over: [{ f: w.so, pos: [1.9, 0.72, 0.98], look: [0.15, 0.3, 0.0], fov: 42 }, { f: w.if - 1, pos: [1.82, 0.7, 0.94], look: [0.18, 0.3, 0.0], fov: 42 }],
  leave: [{ f: w.if, pos: [0.72, 0.5, 1.7], look: [0.03, 0.3, 0.0], fov: 46 }, { f: w.quietly - 1, pos: [0.7, 0.5, 1.62], look: [0.05, 0.3, 0.0], fov: 46 }],
  fix: [{ f: w.quietly, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.say2 - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then2 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  povFinal: [{ f: w.then2, pos: [1.34, 0.84, 0.72], look: [0.17, 0.2, 0.0], fov: 42 }, { f: TOTAL - 1, pos: [1.29, 0.81, 0.69], look: [0.18, 0.2, 0.0], fov: 42 }],
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (S.id.startsWith('pov') || S.id === 'ask' || S.id === 'goStay') { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), head = REF.down ? REF.down.head : [0.3, 0.3, 0];
  if (S.id === 'hook' || S.id === 'yes' || S.id === 'fix') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.id === 'ask' || S.id === 'bell' || S.id === 'goStay') return { focus: dist(C.pos, [-0.05, 0.15, 0]), cinf: 9 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'over' || S.id === 'leave') return { focus: dist(C.pos, [0.3, 0.2, 0]), cinf: 9 };
  if (S.id === 'build' || S.id === 'okay') return { focus: dist(C.pos, [0.12, 0.15, 0]), cinf: 4 };
  return { focus: dist(C.pos, head), cinf: 6 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'yes') { const tO = roundAll({ ...trainerYes(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 }); }
  if (S.id === 'hook' || S.id === 'fix') {
    const tO = roundAll({ ...trainerAt(f), mirror: true });
    out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: MAT, z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 });
  }
  return out;
};
const BUB_CUE = [-0.2, 0.5, -0.02], BUB_OK = [0.14, 0.46, 0.0], BUB_YES = [-0.12, 0.78, -0.45];   // bubble anchor points (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = add(NOSE('down'), [-0.08, 0.06, 0]);
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  const doorbell = (at, a, sc) => [[0, 0.3], [9, 0.2]].forEach(([d, s], i) => { const k = q(ramp(f, a + d, a + d + 18), 2); if (k > 0 && k < 1) out.push(FX('db' + i + k, (p) => T.fxClick(p, k), [at[0], at[1] + 0.1 * i, at[2]], s * sc)); });
  if (S.id === 'hook') doorbell(SND.hook, w.door, 1.8);   // "doorbell" / "rings": ding-dong, two sound rings; the helper is off screen
  if (S.id === 'hook') doorbell(SND.hook, w.rings - 2, 1.6);
  if (S.id === 'setup') { badge(T.fxCheck, 'ok', w.mat1, w.treats - 5, [0.52, 0.2, 0.08], 0.12); badge(T.fxCheck, 'ok2', w.treats - 2, w.helper1 - 6, [1.85, 0.8, -0.75], 0.09); badge(T.fxCheck, 'ok3', w.helper1 + 8, w.stand, [0.0, 0.6, 0.0], 0.12); }
  if (S.id === 'ask') {
    bubble('bd', 'Place!', '', '#ffffff', w.place2 - 2, w.place2 + 30, BUB_CUE, 0.26);
    badge(T.fxCheck, 'ok', w.reward1 - 14, w.reward1, [0.2, 0.42, 0.05], 0.12);
  }
  if (S.id === 'povReward') { hearts(POVT.povReward + 3, HEAD); badge(T.fxCheck, 'ok', w.there, w.next, [0.2, 0.34, 0.1], 0.12); }
  if (S.id === 'bell') { doorbell(SND.bell, w.ring, 2.8); doorbell(SND.bell, w.bell - 2, 2.4); }
  if (S.id === 'goStay') { hearts(POVT.goStay + 3, HEAD); badge(T.fxCheck, 'ok', w.staying, w.then1, [0.2, 0.34, 0.1], 0.12); }
  if (S.id === 'build') {
    const fill = KF(f, [[w.then1 + 2, 0.04], [w.minute, 0.5], [w.more + 14, 1.0]]), k = q(M.back(ramp(f, w.then1 + 2, w.then1 + 12)) * (1 - sm(ramp(f, w.always - 6, w.always))), 2);
    if (k > 0.02) out.push(FX('tm' + k + q(fill, 2), (p) => T.fxTimer(p, 1, fill), [0.16, 0.42, 0.08], 0.13 * k, { roll: q(0.04 * Math.sin(f * 0.2), 2) }));
  }
  if (S.id === 'okay') bubble('bo', 'Okay!', '', '#fbf0b4', w.okay - 2, w.okay + 30, BUB_OK, 0.22);
  if (S.id === 'over') badge(T.fxCheck, 'ok', w.over, w.if, [0.3, 0.44, 0.06], 0.12);
  if (S.id === 'leave') badge(T.fxCross, 'no', w.leaves + 8, w.quietly, [dog3At(f).pos[0] + 0.15, 0.62, 0.0], 0.2);
  if (S.id === 'fix') badge(T.fxCheck, 'ok', w.easier + 2, w.say2, [0.2, 0.52, HOOKP[2]], 0.2);
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward3 + 3, HEAD, 4, 0.06);
    if (f >= w.reward3) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward3 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('down'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
