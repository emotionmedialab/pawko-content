// "Crate II" — relax in the crate with the door closed. 3D puppy (dog-puppy.glb) + wire crate (crate.js) + the 2D bald trainer, 1085 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3 = ElevenLabs "Holden", voice.mp3.words.json, round(s*30); sentence-start words taken from the silence_end before them):
// Let's 0 relax 34 crate 56 door 79 closed 86 | Grab 132 stuffed 144 toy 160 treats 178 | Give 215 toy 238 crate 252 | close 278 door 290 | and 316 sit 317 next 331 |
// Reward 368 calm 374 behavior 388 | Start 429 ten 440 seconds 446 | then 481 one 484 minute 490 | then 515 five 517 | Do 551 several 553 short 566 sessions 576 day 598 |
// keep 617 low-key 628 | If 664 dog 669 whines 676 | don't 705 open 709 door 719 yet 725 | Opening 753 now 761 teaches 771 whining 794 works 804 |
// Wait 845 short 857 pause 863 quiet 881 | then 916 open 918 | When 950 they 952 settle 955 quietly 964 | say 995 yes 999 or 1010 click 1027 | then 1061 reward 1064 | end 1084.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and
// action is keyed to `w` (+/- a few frames), so nothing else needs to change. Pointers: HAND in POV shots. Hard cuts only, no flashes.
// Puppy inside the crate (crate at the origin, door on +x), nose toward +x.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
import { CRATE, doorEdge } from './crate.js';
export const FPS = 30, TOTAL = 1085, DECK = 0;
// key word frames (first frame of the word)
const w = {
  relax: 34, door1: 79, closed: 86, grab: 132, toy1: 160, treats: 178, give: 215, toy2: 238, crate2: 252, close: 278, door2: 290, sit: 317, next: 331,
  reward1: 368, calm: 374, behavior: 388, start: 429, ten: 440, then1: 481, one: 484, then2: 515, five: 517, doo: 551, several: 553, sessions: 576, day: 598,
  keep: 617, lowkey: 628, if: 664, whines: 676, dont: 705, open1: 709, door3: 719, yet: 725, opening: 753, now: 761, teaches: 771, whining: 794, works: 804,
  wait: 845, pause: 863, quiet: 881, then3: 916, open2: 918, when: 950, settle: 955, say: 995, yes: 999, click: 1027, then4: 1061, reward3: 1064, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },              // trainer + crate, the door swings shut on "door closed"
  { id: 'setup', a: w.grab, b: w.give - 1, light: 'day' },        // the stuffed toy, then the treat jar
  { id: 'give', a: w.give, b: w.close - 1, light: 'day' },        // POV: the hand puts the toy in the crate
  { id: 'shut', a: w.close, b: w.sit - 1, light: 'day' },         // POV: the hand swings the door shut
  { id: 'beside', a: w.sit, b: w.reward1 - 1, light: 'day' },     // POV: sit right next to it (hand rests on the crate)
  { id: 'treat', a: w.reward1, b: w.start - 1, light: 'day' },    // POV: treat through the bars for calm behaviour
  { id: 'times', a: w.start, b: w.doo - 1, light: 'day' },        // 10 sec -> 1 min -> 5 min timer badges
  { id: 'daily', a: w.doo, b: w.if - 1, light: 'day' },           // several short sessions, low-key
  { id: 'whine', a: w.if, b: w.dont - 1, light: 'day' },          // whining puppy
  { id: 'hold', a: w.dont, b: w.opening - 1, light: 'day' },      // MISTAKE: hand goes for the latch, red cross, hand pulls back
  { id: 'caved', a: w.opening, b: w.wait - 1, light: 'day' },     // MISTAKE: door opens on the whine, puppy learns whining works
  { id: 'fix', a: w.wait, b: w.when - 1, light: 'day' },          // wait for the quiet, check, then open
  { id: 'settle', a: w.when, b: w.say - 1, light: 'day' },        // settles quietly
  { id: 'yes', a: w.say, b: w.then4 - 1, light: 'golden' },       // trainer: "yes" + click
  { id: 'final', a: w.then4, b: TOTAL - 1, light: 'golden' },     // POV: reward through the open door, confetti
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
const CR = [0, MAT, 0];                                   // crate centre on the mat (door on +x)
const FLR = MAT + CRATE.FLOOR;                            // top of the soft mat inside the crate
const DOGPOS = [0.08, FLR, 0], DOGYAW = Math.PI / 2;      // puppy inside, nose toward the door
const TRN = [-0.85, MAT, 0.2];                          // trainer kneels BESIDE the crate (left of it, facing right)
const TOY_IN = [0.38, FLR + 0.036, 0.2];                   // toy lying beside the front paws
const TOY_MAT = [0.95, MAT + 0.036, 0.5];                  // toy lying on the mat (setup shot)
let CUR = [0, 1, 3], TCUR = TRN;
const axisOf = (pos) => { const ry = Math.atan2(CUR[0] - pos[0], CUR[2] - pos[2]); return [Math.cos(ry), 0, -Math.sin(ry)]; };
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
const MOUTH = () => add(NOSE('down'), [0.06, -0.02, 0.0]);        // treat held at the bars, at the down puppy's mouth
const MOUTH_SIT = () => add(NOSE('sit'), [0.06, -0.04, 0.0]);
const HEADP = () => add(NOSE('down'), [-0.1, 0.09, 0]);           // hearts anchor

// ---------- door ----------
const doorAt = (f) => {
  switch (shotAt(f).id) {
    case 'hook': return 0.55 * (1 - sm(ramp(f, w.door1 - 12, w.closed + 4)));
    case 'setup': case 'give': return 1;
    case 'shut': return 1 - sm(ramp(f, w.close - 4, w.door2 + 6));
    case 'caved': return sm(ramp(f, w.opening + 2, w.opening + 26));
    case 'fix': return sm(ramp(f, w.open2 - 6, w.open2 + 18));
    case 'settle': case 'yes': case 'final': return 1;
  }
  return 0;
};
const doorWorld = (f, y) => add(CR, doorEdge(doorAt(f), y));

// ---------- whining (puppy sits at the door and whines) ----------
const whineAt = (f) => {
  const S = shotAt(f).id;
  if (S === 'whine' || S === 'hold') return 1;
  if (S === 'caved') return f < w.opening + 16 ? 1 : 0;
  if (S === 'fix') return f < w.pause - 3 ? 1 : 0;
  return 0;
};

// ---------- camera-relative helpers (hands come from below the frame) ----------
const camVec = (f) => {
  const C = camAt(f), fw = C.look.map((v, i) => v - C.pos[i]), n = Math.hypot(...fw), F = fw.map((v) => v / n);
  const R0 = [F[1] * 0 - F[2] * 1, F[2] * 0 - F[0] * 0, F[0] * 1 - F[1] * 0], rn = Math.hypot(...R0), R = R0.map((v) => v / rn);   // F x up
  const U = [R[1] * F[2] - R[2] * F[1], R[2] * F[0] - R[0] * F[2], R[0] * F[1] - R[1] * F[0]];                                    // R x F
  return { C, F, R, U };
};
const OFF = (f) => { const { C, F, R, U } = camVec(f); return C.pos.map((v, i) => v + F[i] * 0.95 - U[i] * 0.9 + R[i] * 0.25); };   // below the frame
/** hand keyframes: [frame, point | null (null = below the frame)] */
const HK = (f, keys) => KF(f, keys.map(([fr, p]) => [fr, p || OFF(f)]));

// ---------- the puppy ----------
export const dog3At = (f) => {
  if (globalThis.TEST?.dog) return globalThis.TEST.dog;
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { down: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85, ears: 0.3 * Math.max(0, Math.sin(f * 0.09)) ** 6 - 0.1 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const nib = (t0, n = 14) => chompAt(f, t0, n);
  const whine = whineAt(f), wh = whine ? Math.abs(Math.sin(f * 0.42)) : 0;
  switch (S.id) {
    case 'hook': {
      const sitUp = sm(ramp(f, 4, 14)) * (1 - sm(ramp(f, w.door1 - 6, w.closed + 10)));
      return { ...base, w: { down: 1 }, look: f < 44 ? [TRN[0] + 0.2, 0.45, TRN[2] + 0.4] : f < 60 ? [lerp(TRN[0] + 0.2, 1.2, sm(ramp(f, 44, 60))), 0.3, lerp(TRN[2] + 0.4, 2.6, sm(ramp(f, 44, 60)))] : [1.2, 0.3, 2.6], neck: 0.6, ears: f > w.closed ? 0.3 : -0.1, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2 + 0.1 * sitUp, blink: f > w.closed + 6 && f < w.closed + 14 ? 1 : base.blink };
    }
    case 'setup': {
      return { ...base, pos: [1.25, MAT, -0.15], yaw: 0.5, w: { sit: 1 }, look: f < w.treats - 8 ? TOY_MAT : [1.85, 0.7, -0.75], neck: 1, wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    }
    case 'give': {
      const t = W.toy ? W.toy.pos : TOY_IN, st = f > w.crate2 + 6;
      return { ...base, look: st ? add(TOY_IN, [0.02, 0.05, 0]) : add(t, [0, 0.04, 0]), neck: 1, jaw: nib(w.crate2 + 12), blink: f > w.crate2 + 8 && f < w.crate2 + 14 ? 1 : base.blink,
        ...(f > w.crate2 + 12 ? { wag: Math.sin(f * 0.6) * 0.9, tail: 0.3 } : {}) };
    }
    case 'shut': return { ...base, look: [0.8, 0.5, 0.9], neck: 0.9, wag: 0.4 * Math.sin(f * 0.3) };
    case 'beside': return { ...base, look: [1.5, 0.3, 1.2], neck: 0.6, ears: 0.3, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2, blink: f > w.sit + 20 && f < w.sit + 27 ? 1 : base.blink };
    case 'treat': {
      const c1 = w.reward1 + 14, c2 = w.behavior + 14;
      return { ...base, look: W.treat && !W.treatHide ? W.treat : [1.2, 0.5, 0.8], neck: 0.9, jaw: Math.max(nib(c1), nib(c2)), ears: 0.2,
        ...(f > c1 ? { wag: Math.sin(f * 0.8) * 0.9, tail: 0.3 } : {}), blink: (f > c1 && f < c1 + 7) || (f > c2 && f < c2 + 7) ? 1 : base.blink };
    }
    case 'times': return { ...base, look: [1.4, 0.4, 1.4], neck: 0.8, jaw: 0, ears: 0.3, breath: 0.3 + 0.3 * Math.sin(f * 0.12), blink: f > w.then1 + 4 && f < w.then1 + 14 ? 1 : base.blink };
    case 'daily': {
      const hp = sm(ramp(f, w.lowkey - 6, w.lowkey + 30));
      const lid = f > w.lowkey + 16 ? 0.55 + 0.15 * Math.sin(f * 0.05) : blinkAt(f, 8) ? 1 : 0;
      return { ...base, w: { down: 1 - hp, hip: hp }, look: add(NOSE('down'), [0.5, -0.1, 0.2]), neck: 0.7, blink: lid, breath: 0.35 + 0.35 * Math.sin(f * 0.12), ears: 0.35 * hp, wag: 0.3 * Math.sin(f * 0.1) };
    }
    case 'whine': case 'hold': {
      const up = sm(ramp(f, S.a, S.a + 8));
      return { ...base, w: { sit: 1 }, look: [0.9 + 0.5 * Math.sin(f * 0.05), 0.12, 1.3], neck: 0.4, ears: -0.5 - 0.2 * wh, headTilt: 9 * Math.sin(f * 0.21), jaw: 0.25 * wh, tail: 0.05, wag: 0.1 * Math.sin(f * 0.3), breath: 0.4 + 0.3 * Math.sin(f * 0.35) };
    }
    case 'caved': {
      const up = sm(ramp(f, w.opening + 14, w.teaches + 16));
      return { ...base, w: { sit: 1 - up, stand: up }, look: [1.0 + 0.5 * Math.sin(f * 0.05), 0.15 + 0.05 * up, 1.3], neck: 0.4, ears: f < w.opening + 16 ? -0.5 : 0.2, headTilt: f < w.opening + 16 ? 9 * Math.sin(f * 0.21) : 0, jaw: f < w.opening + 16 ? 0.25 * wh : 0.2,
        wag: up > 0.4 ? Math.sin(f * 0.9) * 1.2 : 0.1, tail: 0.1 + 0.3 * up, breath: 0.4 + 0.3 * Math.sin(f * 0.35) };
    }
    case 'fix': {
      const dn = sm(ramp(f, w.pause + 4, w.pause + 34));
      const wq = whineAt(f) ? Math.abs(Math.sin(f * 0.42)) : 0;
      return { ...base, w: { sit: 1 - dn, down: dn }, look: [1.0 + 0.4 * Math.sin(f * 0.05), 0.12, 1.3], neck: 0.4, ears: -0.5 * (1 - dn) + 0.3 * dn, headTilt: whineAt(f) ? 9 * Math.sin(f * 0.21) : 0, jaw: 0.25 * wq, tail: 0.05, wag: 0.1 * Math.sin(f * 0.3),
        blink: f > w.pause + 10 && f < w.pause + 17 ? 1 : f > w.quiet + 14 && f < w.quiet + 21 ? 1 : base.blink };
    }
    case 'settle': {
      const lid = f > w.settle + 4 ? 0.5 + 0.15 * Math.sin(f * 0.05) : blinkAt(f, 8) ? 1 : 0;
      return { ...base, look: add(NOSE('down'), [0.45, -0.12, 0.1]), neck: 0.7, blink: lid, breath: 0.35 + 0.35 * Math.sin(f * 0.12), ears: 0.4, wag: 0.3 * Math.sin(f * 0.1) };
    }
    case 'yes': return { ...base, look: [TRN[0] + 0.05, 0.95, TRN[2]], neck: 1, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    case 'final': {
      const t0 = w.reward3 + 4, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, look: W.treat && !W.treatHide ? W.treat : [1.2, 0.5, 0.9], neck: 0.85, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- props: toy, treat, hand ----------
const toyPath = (f) => {
  switch (shotAt(f).id) {
    case 'hook': return { pos: TOY_IN, yaw: 0.5 };
    case 'setup': return f < w.treats - 8 ? { pos: TOY_MAT, yaw: 0.6 } : null;
    case 'give': return { pos: HK(f, [[w.give - 6, null], [w.toy2 - 6, [0.95, 0.4, 0.3]], [w.crate2 - 2, add(TOY_IN, [0.0, 0.1, 0.0])], [w.crate2 + 6, TOY_IN]]), yaw: 0.5 };
    case 'shut': case 'beside': case 'treat': case 'times': case 'daily': case 'whine': case 'hold': case 'caved': case 'fix': case 'settle': case 'yes': case 'final': return { pos: TOY_IN, yaw: 0.5 };
  }
  return null;
};
const treatPath = (f) => {
  switch (shotAt(f).id) {
    case 'treat': {
      const c1 = w.reward1 + 14, c2 = w.behavior + 14, M1 = MOUTH();
      if (f < c2 - 26) return HK(f, [[w.reward1 - 6, null], [c1 - 3, M1], [c1 + 10, M1], [c1 + 24, null]]);
      return HK(f, [[c2 - 26, null], [c2 - 3, M1], [c2 + 10, M1], [c2 + 24, null]]);
    }
    case 'final': return HK(f, [[w.then4, null], [w.reward3 + 2, MOUTH()]]);
  }
  return null;
};
// the hand: below the frame at a, on the door latch from b to c (following the swinging door), below the frame again at d
const follow = (f, a, b, c, d) => {
  const at = (g) => add(doorWorld(g, 0.3), [0.04, 0, 0.0]);
  if (f < b) return HK(f, [[a, null], [b, at(b)]]);
  if (f <= c) return at(f);
  return HK(f, [[c, at(c)], [d, null]]);
};
const handFor = (f) => {
  const S = shotAt(f).id, t = treatPath(f);
  if (S === 'give') { const tp = toyPath(f); return { at: f < w.crate2 + 6 ? tp.pos : HK(f, [[w.crate2 + 6, TOY_IN], [w.crate2 + 16, null]]), pose: 'pinch', side: 0.16 }; }
  if (S === 'shut') return { at: follow(f, w.close - 14, w.close - 4, w.door2 + 6, w.door2 + 22), pose: 'relax', side: 0.16 };
  if (S === 'beside') return null;
  if (S === 'beside_old') return { at: HK(f, [[w.sit - 2, null], [w.sit + 10, [0.3, MAT + CRATE.H + 0.045, 0.1]]]), pose: 'relax', mode: 'reach', palm: [0, -1, 0], fingers: [-0.9, 0, -0.35], grip: 'palm', side: 0.12 };
  if (S === 'treat' || S === 'final') return t && { treat: t, side: S === 'final' ? 0.22 : 0.16 };
  if (S === 'hold') return { at: follow(f, w.dont - 8, w.dont + 6, w.door3 + 4, w.yet + 12), pose: 'relax', side: 0.16 };
  if (S === 'caved') return { at: follow(f, w.opening - 12, w.opening - 4, w.opening + 26, w.opening + 46), pose: 'relax', side: 0.16 };
  if (S === 'fix') return { at: follow(f, w.then3 - 8, w.then3 + 2, w.open2 + 18, w.open2 + 36), pose: 'relax', side: 0.16 };
  return null;
};
export const worldAt = (f) => {
  if (globalThis.TEST?.W) return globalThis.TEST.W;
  const S = shotAt(f), W = {};
  W.crate = { pos: CR, yaw: 0, door: doorAt(f) };
  const toy = toyPath(f); if (toy) W.toy = toy;
  const t = treatPath(f); if (t) W.treat = t;
  const hd = (S.id === 'fix' && f < w.then3 - 8) || (S.id === 'caved' && f > w.opening + 46) || (S.id === 'hold' && f > w.yet + 12) ? null : handFor(f);
  if (hd) W.hand = hd;
  if ((S.id === 'treat' && ((f >= w.reward1 + 14 && f < w.behavior - 12) || f >= w.behavior + 14)) || (S.id === 'final' && f >= w.reward3 + 4)) W.treatHide = true;
  return W;
};

// ---------- the 2D trainer (hook + yes) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5;
  return { kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 4,
    near: { to: [318, 690 - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present', lean: 6 };
};
const trainerHook = (f) => {
  const hi = idle(f, 3);
  return { hose: true, kneel: 1, expr: f > 30 ? 'grin' : 'smile', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: f > 40 ? -0.2 : 0.8, headTilt: hi.headTilt, near: f > w.closed ? 'thumb' : { to: [270, 806], hand: 'fist', bend: -1 }, far: 'present', lean: 6 };
};

// ---------- cameras ----------
const CAMS = {
  hook: [{ f: 0, pos: [1.8, 0.65, 2.3], look: [-0.15, 0.95, 0.1], fov: 50 }, { f: w.closed + 6, pos: [1.75, 0.64, 2.25], look: [-0.15, 0.95, 0.1], fov: 50 }, { f: w.grab - 1, pos: [1.6, 0.62, 2.05], look: [-0.2, 0.92, 0.1], fov: 50 }],
  setup: [{ f: w.grab, pos: [1.5, 0.38, 1.25], look: [0.95, 0.07, 0.5], fov: 36 }, { f: w.treats - 9, pos: [1.45, 0.36, 1.2], look: [0.95, 0.07, 0.5], fov: 36 },
    { f: w.treats - 8, pos: [2.75, 0.98, 0.4], look: [1.85, 0.68, -0.75], fov: 40 }, { f: w.give - 1, pos: [2.68, 0.96, 0.3], look: [1.85, 0.66, -0.75], fov: 40 }],
  give: [{ f: w.give, pos: [1.3, 0.88, 0.56], look: [0.25, 0.28, 0.0], fov: 42 }, { f: w.close - 1, pos: [1.24, 0.82, 0.53], look: [0.27, 0.24, 0.0], fov: 42 }],
  shut: [{ f: w.close, pos: [1.3, 0.88, 0.56], look: [0.25, 0.28, 0.0], fov: 42 }, { f: w.sit - 1, pos: [1.24, 0.82, 0.53], look: [0.27, 0.24, 0.0], fov: 42 }],
  beside: [{ f: w.sit, pos: [1.3, 0.88, 0.56], look: [0.25, 0.28, 0.0], fov: 42 }, { f: w.reward1 - 1, pos: [1.24, 0.82, 0.53], look: [0.27, 0.24, 0.0], fov: 42 }],
  treat: [{ f: w.reward1, pos: [1.3, 0.88, 0.56], look: [0.25, 0.28, 0.0], fov: 42 }, { f: w.start - 1, pos: [1.24, 0.82, 0.53], look: [0.27, 0.24, 0.0], fov: 42 }],
  times: [{ f: w.start, pos: [2.9, 1.0, 1.3], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.then1 - 1, pos: [2.82, 0.98, 1.27], look: [0.3, 0.78, 0.0], fov: 42 },
    { f: w.then1, pos: [3.0, 0.8, 0.2], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.then2 - 1, pos: [2.92, 0.8, 0.18], look: [0.3, 0.78, 0.0], fov: 42 },
    { f: w.then2, pos: [1.9, 1.4, 2.4], look: [0.1, 0.78, 0.0], fov: 42 }, { f: w.doo - 1, pos: [1.85, 1.38, 2.3], look: [0.1, 0.78, 0.0], fov: 42 }],
  daily: [{ f: w.doo, pos: [1.7, 0.8, 2.6], look: [0.45, 0.5, 0.0], fov: 42 }, { f: w.keep - 1, pos: [1.45, 0.75, 2.2], look: [0.45, 0.45, 0.0], fov: 42 },
    { f: w.keep, pos: [1.9, 0.55, 1.1], look: [0.3, 0.33, 0.0], fov: 40 }, { f: w.if - 1, pos: [1.8, 0.55, 1.0], look: [0.3, 0.33, 0.0], fov: 40 }],
  whine: [{ f: w.if, pos: [1.3, 0.88, 0.56], look: [0.25, 0.28, 0.0], fov: 42 }, { f: w.dont - 1, pos: [1.24, 0.82, 0.53], look: [0.27, 0.24, 0.0], fov: 42 }],
  hold: [{ f: w.dont, pos: [1.3, 0.88, 0.56], look: [0.25, 0.28, 0.0], fov: 42 }, { f: w.opening - 1, pos: [1.24, 0.82, 0.53], look: [0.27, 0.24, 0.0], fov: 42 }],
  caved: [{ f: w.opening, pos: [1.3, 0.88, 0.56], look: [0.25, 0.28, 0.0], fov: 42 }, { f: w.wait - 1, pos: [1.24, 0.82, 0.53], look: [0.27, 0.24, 0.0], fov: 42 }],
  fix: [{ f: w.wait, pos: [1.3, 0.88, 0.56], look: [0.25, 0.28, 0.0], fov: 42 }, { f: w.when - 1, pos: [1.24, 0.82, 0.53], look: [0.27, 0.24, 0.0], fov: 42 }],
  settle: [{ f: w.when, pos: [2.4, 0.55, 0.3], look: [0.3, 0.32, 0.0], fov: 40 }, { f: w.say - 1, pos: [2.1, 0.5, 0.5], look: [0.3, 0.32, 0.0], fov: 40 }],
  yes: [{ f: w.say, pos: [1.8, 0.65, 2.3], look: [-0.15, 0.95, 0.1], fov: 50 }, { f: w.then4 - 1, pos: [1.65, 0.63, 2.1], look: [-0.18, 0.93, 0.1], fov: 50 }],
  final: [{ f: w.then4, pos: [1.3, 0.88, 0.56], look: [0.25, 0.28, 0.0], fov: 42 }, { f: TOTAL - 1, pos: [1.24, 0.82, 0.53], look: [0.27, 0.24, 0.0], fov: 42 }],
};
const HANDCAMS = ['give', 'shut', 'beside', 'treat', 'hold', 'caved', 'fix', 'final'];
export const camAt = (f) => {
  if (globalThis.TEST?.cam) return globalThis.TEST.cam;
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (HANDCAMS.includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (S.id === 'hook' || S.id === 'yes') return { focus: dist(C.pos, [0.3, 0.35, -0.1]), cinf: 5 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  return { focus: dist(C.pos, [0.25, 0.35, 0.0]), cinf: 4 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  CUR = camAt(f).pos; TCUR = TRN;
  const S = shotAt(f), out = [];
  const put = (tO) => out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: 0.85, flip: false, order: 1, ground: MAT, blobW: 0.8 });
  if (S.id === 'yes') put(roundAll({ ...trainerYes(f), mirror: false }));
  if (S.id === 'hook') put(roundAll({ ...trainerHook(f), mirror: false }));
  return out;
};
const BUB_YES = [TRN[0] + 0.45, 0.7, TRN[2] + 0.1];
// cards are anchored at their feet: FXc places the badge CENTRE (design point 300,500) at `pos`
const FXc = (key, draw, pos, s, extra = {}) => FX(key, draw, [pos[0], pos[1] - 1.1 * s, pos[2]], s, extra);
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
const TIMES = [[w.ten - 3, w.then1 - 2, '10 sec', 0.2], [w.one - 3, w.then2 - 2, '1 min', 0.45], [w.five - 3, w.doo - 2, '5 min', 0.9]];
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FXc(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.09) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.09, at[1] + 0.06 + k * 0.22, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const sigh = (a, b, at) => { if (f >= a && f < b) { const t = q(ramp(f, a, b), 2); out.push(FXc('si' + t, (p) => T.fxSigh(p, t), at, 0.16)); } };
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  const MUZ = add(NOSE('sit'), [0.03, 0.0, -0.12]);   // whine waves leave the muzzle of the sitting puppy
  const whine = (at) => { if (whineAt(f)) { const t = q((f * 0.045) % 1, 2); out.push(FXc('wh' + t, (p) => T.fxWhine(p, t), at, 0.5)); } };
  if (S.id === 'hook') { sigh(w.closed + 6, w.closed + 36, add(NOSE('down'), [0.1, 0.02, 0.1])); }
  if (S.id === 'setup') {
    badge(T.fxCheck, 'ok', w.toy1 + 4, w.treats - 8, [TOY_MAT[0] + 0.1, 0.3, TOY_MAT[2]], 0.14);
    badge(T.fxCheck, 'ok2', w.treats + 4, w.give, [1.85, 1.0, -0.55], 0.15);
  }
  if (S.id === 'give') hearts(w.crate2 + 14, HEADP());
  if (S.id === 'beside') hearts(w.sit + 22, HEADP());
  if (S.id === 'treat') { hearts(w.reward1 + 15, HEADP()); hearts(w.behavior + 15, HEADP()); sigh(w.calm + 4, w.calm + 34, add(NOSE('down'), [0.1, 0.02, 0.1])); }
  if (S.id === 'times') for (const [a, b, label, fr] of TIMES) if (f >= a && f < b) { const k = pop(a, b), prog = q(ramp(f, a + 4, b - 6), 2); if (k > 0.02) out.push(FXc('tm' + label + k + prog, (p) => T.fxTimer(p, label, prog), [0.2, 1.15, 0.1], 0.5 * k, { roll: 0 })); }
  if (S.id === 'daily') {
    [[w.several, -0.1], [w.several + 14, 0.3], [w.sessions + 2, 0.7]].forEach(([a, x], i) => badge((p, k) => T.fxTimer(p, '', 1), 'sn' + i, a, w.keep, [x, 1.1, 0.2], 0.4));
    sigh(w.lowkey + 4, w.lowkey + 34, add(NOSE('down'), [0.1, 0.02, 0.1]));
  }
  if (S.id === 'whine' || S.id === 'hold' || S.id === 'caved' || S.id === 'fix') whine(MUZ);
  if (S.id === 'hold') badge(T.fxCross, 'no', w.open1 - 3, w.opening, [0.5, 0.66, 0.0], 0.14);
  if (S.id === 'caved') badge(T.fxCross, 'no2', w.teaches - 2, w.wait, [0.5, 0.66, 0.0], 0.14);
  if (S.id === 'fix') { badge(T.fxCheck, 'ok', w.quiet, w.then3, [0.5, 0.66, 0.0], 0.14); hearts(w.open2 + 24, HEADP()); }
  if (S.id === 'settle') sigh(w.settle + 4, w.settle + 34, add(NOSE('down'), [0.1, 0.02, 0.1]));
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.55);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FXc('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.5, 1.0, TRN[2] + 0.2], 0.3)); }
  if (S.id === 'final') {
    hearts(w.reward3 + 5, HEADP(), 4, 0.08);
    if (f >= w.reward3) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward3 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('down'), [0.05, 0.15, -0.3 + i * 0.3]), 0.5, { order: 7 })); }
  }
  return out;
};
