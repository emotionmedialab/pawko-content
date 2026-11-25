// "Pray" — sit on the mat, both front paws resting on a low stool, then bow the head down between the paws. 3D puppy (dog-puppy.glb) + the 2D bald trainer, 984 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3, voice.mp3.words.json, round(s*30); silence_end used for sentence starts):
// Let's 0 pray 26 | Grab 68 (whisper 72, silence_end 68) treats 72 low 91 stool 96 or 105 use 121 arm 133 | Set 164 stool 173 front 194 dog 205 | Once 242 (whisper 238) both 244 paws 260 up 275 on 280 it 284 |
// hold 297 (silence_end 297) treat 304 low 310 just 319 under 337 stool 350 | As 384 dog 389 lowers 396 head 413 between 419 paws 428 reward 462 (whisper 463, silence_end 461) | Next 507 wait 522 few 530 seconds 535 reward 562 but 584 only 587 few 597 |
// Say 627 pray 633 head 667 goes 670 down 676 | If 709 hops 718 off 725 held 748 pose 757 too 761 long 770 | A 803 (whisper 794, silence_end 803) few 805 seconds 810 plenty 825 reward 850 sooner 862 | Say 901 yes 907 click 932 then 955 reward 959 | end 983.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and action is keyed to `w`.
// Pointers: HAND in POV shots, PAW cursor in floating shots. Hard cuts only, no flashes. Puppy at the origin, nose toward +x; the low stool sits 0.46 m in front of it (stoolAt). Camera keys are the locked Down II / Sit-pretty ones, moved to a 3/4 SIDE angle so the stool never blocks the face.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 984, DECK = 0;
// key word frames (first frame of the word)
const w = {
  pray1: 26, grab: 68, stool1: 96, arm: 105, set: 164, stool2: 173, once: 242, up1: 275, hold: 297, low: 310, under: 337, stool3: 350, as: 384, lowers: 396, head1: 413, between: 419, paws2: 428, reward1: 462,
  next: 507, wait: 522, reward2: 562, but: 584, few2: 597, say1: 627, pray2: 633, head2: 667, down: 676, if: 709, hops: 718, off: 725, held: 748, long: 770, a: 803, plenty: 825, reward3: 850, sooner: 862,
  say2: 901, yes: 907, click: 932, then: 955, reward4: 959, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },               // trainer lures; the puppy puts its paws on the stool and bows, chomp
  { id: 'stool', a: w.grab, b: w.arm - 1, light: 'day' },          // setup: the low stool on the mat, check on "low stool"
  { id: 'arm', a: w.arm, b: w.set - 1, light: 'day' },             // POV: "or use your arm": the hand with a treat (an arm works as the platform)
  { id: 'set', a: w.set, b: w.once - 1, light: 'day' },            // the stool right in front of the sitting puppy
  { id: 'up', a: w.once, b: w.hold - 1, light: 'day' },            // both front paws go up on the stool, check
  { id: 'hold', a: w.hold, b: w.as - 1, light: 'day' },            // POV: treat low, just under the stool
  { id: 'lower', a: w.as, b: w.next - 1, light: 'day' },           // POV: the head lowers between the paws, reward
  { id: 'wait', a: w.next, b: w.but - 1, light: 'day' },           // floating: wait a few seconds, then reward
  { id: 'few', a: w.but, b: w.say1 - 1, light: 'day' },            // but only a few: check
  { id: 'cue', a: w.say1, b: w.if - 1, light: 'day' },             // POV: "Pray!" bubble as the head goes down
  { id: 'popUp', a: w.if, b: w.a - 1, light: 'day' },              // MISTAKE: held too long, the puppy hops off (red), cross
  { id: 'fix', a: w.a, b: w.say2 - 1, light: 'day' },              // reward sooner (green), check
  { id: 'yes', a: w.say2, b: w.then - 1, light: 'golden' },        // trainer: "yes" + click
  { id: 'povFinal', a: w.then, b: TOTAL - 1, light: 'golden' },    // POV: reward, confetti
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
const TRN = [0.52, MAT, -0.66];                          // yes shot
const HOOKP = [-0.12, MAT, -0.48], TRNH = [0.72, MAT, -0.66];   // hook: puppy close to the trainer's card plane (his hand stays visible); the stool moves with it
const SH = (P) => [P[0] + HOOKP[0], P[1], P[2] + HOOKP[2]];
const STOOLX = 0.46;
export const stoolAt = (f) => (shotAt(f).id === 'hook' ? [STOOLX + HOOKP[0], MAT, HOOKP[2]] : [STOOLX, MAT, 0]);
let CUR = [0, 1, 3], TCUR = TRN;
const axisOf = (pos) => { const ry = Math.atan2(CUR[0] - pos[0], CUR[2] - pos[2]); return [Math.cos(ry), 0, -Math.sin(ry)]; };
/** world point -> trainer design point along the camera ray (flipped card) */
const tD = (P) => {
  const C = CUR, TR0 = TCUR, ax = axisOf(TR0), n = [-ax[2], 0, ax[0]];
  const d = [P[0] - C[0], P[1] - C[1], P[2] - C[2]], den = d[0] * n[0] + d[2] * n[2] || 1e-6;
  const s = ((TR0[0] - C[0]) * n[0] + (TR0[2] - C[2]) * n[2]) / den, Q = [C[0] + d[0] * s, C[1] + d[1] * s, C[2] + d[2] * s];
  return [300 - ((Q[0] - TR0[0]) * ax[0] + (Q[2] - TR0[2]) * ax[2]) / (K * ST), 975 - (Q[1] - TR0[1]) / (K * ST)];
};

// ---------- reference points from the real rig ----------
const REF = {};
const BOW = 30;                                         // extra head tuck for the full bow (dogrig `bow`)
const LOW = [0.36, MAT + 0.05, 0.04], LOW2 = [0.35, MAT + 0.03, 0.04];   // under the stool top, between its legs   // the lure: low, just under the stool's near rim; then lower, between the paws
const LEVEL = [1.2, MAT + 0.2, 0.1];                   // eyes level look target (never a steep look-up)
export const calibrate = (poseFn, root) => {
  root.position.set(...DOGPOS); root.rotation.set(0, DOGYAW, 0); root.updateMatrixWorld(true);
  const far = [3, 0.3, 0];
  REF.sit = poseFn({ w: { sit: 1 }, look: far });
  REF.down = poseFn({ w: { down: 1 }, look: far });
  REF.stand = poseFn({ w: { stand: 1 }, look: far });
  REF.pray = poseFn({ w: { pray: 1 }, look: LEVEL, neck: 1 });
  REF.prayB = poseFn({ w: { pray: 1 }, look: LOW2, neck: 1, bow: BOW });
  root.position.set(...DOGPOS);
};
const NOSE = (r) => REF[r].nose;
const MOUTHB = () => add(NOSE('prayB'), [0.03, -0.045, 0.0]);                   // reward at the bowed mouth
const MOUTHS = () => add(NOSE('sit'), [0.07, -0.02, -0.04]);                     // reward at the sitting mouth
const START = [0.55, 0.0, 1.2];                                                   // a hand parks its treat here: just below the POV frame
// chomp frames (the reward lands at the mouth)
const HE = 50, TL = w.reward1 - 2, TW = w.reward2 - 3, TQ = w.down + 10, TF = w.reward3 - 3, TY = w.reward4 - 2;
// paws-up amount p (0 sit, 1 paws on the stool) and head bow b (0 level, 1 fully down between the paws) per shot
const hopU = (f) => sm(sm(ramp(f, w.hops + 1, w.hops + 20)));
const PU = (f) => {
  const id = shotAt(f).id;
  switch (id) {
    case 'hook': return sm(ramp(f, 6, 26));
    case 'stool': case 'arm': case 'set': case 'povFinal': return 0;
    case 'up': return sm(ramp(f, w.once + 3, w.up1 + 1));
    case 'popUp': return 1 - hopU(f);
    case 'fix': return sm(ramp(f, w.a, w.a + 20));
    case 'yes': return 1 - sm(ramp(f, w.say2 + 4, w.say2 + 24));
  }
  return 1;
};
const BW = (f) => {
  const id = shotAt(f).id;
  switch (id) {
    case 'hook': return sm(ramp(f, 24, 44));
    case 'hold': return 0.25 * sm(ramp(f, w.hold + 20, w.under + 6));
    case 'lower': return (0.25 + 0.75 * sm(ramp(f, w.lowers - 4, w.paws2 + 2))) * (1 - 0.65 * sm(ramp(f, TL + 16, TL + 40)));
    case 'wait': return (0.35 + 0.65 * sm(ramp(f, w.next + 2, w.wait + 8))) * (1 - 0.8 * sm(ramp(f, TW + 14, TW + 24)));
    case 'few': return 0.2;
    case 'cue': return (0.2 + 0.8 * sm(ramp(f, w.head2 - 8, w.down + 2))) * (1 - 0.7 * sm(ramp(f, TQ + 14, TQ + 30)));
    case 'popUp': return 1 - 0.7 * sm(ramp(f, w.hops - 2, w.hops + 10));
    case 'fix': return sm(ramp(f, w.a + 14, w.plenty + 8)) * (1 - 0.7 * sm(ramp(f, TF + 14, TF + 32)));
  }
  return 0;
};
// the lure follows the head: base path, then it lifts to the mouth at frame tc
const lureTo = (base, f, tc, mouth) => (f < tc - 5 ? base(f) : KF(f, [[tc - 5, base(tc - 5)], [tc, mouth]]));
const LV = () => add(NOSE('pray'), [0.04, -0.12, 0.02]);                         // treat held at the level nose, a little below

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { bow: 10, pos: DOGPOS, yaw: DOGYAW, w: { sit: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 1 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const eat = (t0) => ({ jaw: f >= t0 + 15 ? 0.3 : chompAt(f, t0), ...(f > t0 + 1 ? happy : {}), blink: f > t0 + 1 && f < t0 + 7 ? 1 : base.blink });
  // the pray pose: sit <-> paws on the stool; the paws lift mid-reach (prayLift) so they clear the stool's rim
  const pray = (p, b) => { const lb = 0.9 * Math.sin(Math.PI * p) ** 1.5; return { w: { sit: 1 - p, pray: p * (1 - lb), prayLift: p * lb }, bow: 8 + (BOW - 8) * b }; };
  // weight shifts / ear flicks / tail: never a dead hold
  const life = (p) => { const fl = Math.max(0, Math.sin(f * 0.21)) ** 6; return { headTilt: (2 + 2 * p) * Math.sin(f * 0.11), ears: 0.15 + 0.22 * Math.sin(f * 0.17) - 0.5 * fl, wag: 0.5 * Math.sin(f * 0.3 + 1), breath: 0.3 + 0.3 * Math.sin(f * 0.13) }; };
  const lookT = (b) => { const tr = W.treat && !W.treatHide ? W.treat : null; if (!tr) return LEVEL; return lerp3(LEVEL, tr, Math.min(1, 0.4 + b)); };
  const p = PU(f), b = BW(f);
  switch (S.id) {
    case 'hook': return { ...base, ...pray(p, b), pos: HOOKP, look: SH(lookT(b)), ...life(p), ...eat(HE), ears: f < HE ? -0.3 : 0 };
    case 'stool': return { ...base, pos: [-2.5, MAT, 1.6], look: [0.9, 0.2, 0.3] };   // the prop close-up: the puppy is out of frame
    case 'set': return { ...base, look: [0.9, MAT + 0.1 + 0.02 * Math.sin(f * 0.05), 0.3], ...life(0), headTilt: 8 * Math.sin(f * 0.07) };
    case 'arm': return { ...base, look: W.treat || LEVEL, ...life(0) };
    case 'up': return { ...base, ...pray(p, 0), bow: 14, look: LEVEL, ...life(p), ears: -0.15 * p };
    case 'hold': return { ...base, ...pray(1, b), look: lookT(b), ...life(1) };
    case 'lower': return { ...base, ...pray(1, b), look: lookT(b), ...life(1), ...(f >= TL ? eat(TL) : {}) };
    case 'wait': return { ...base, ...pray(1, b), look: lookT(b), ...life(1), ...(f >= TW ? eat(TW) : {}) };
    case 'few': return { ...base, ...pray(1, b), look: [LEVEL[0], LEVEL[1] - 0.04, LEVEL[2] - 0.1], ...life(1), ...happy, jaw: 0.25 };
    case 'cue': {
      const perk = f >= w.say1 && f < w.say1 + 24 ? -0.6 * Math.sin(Math.PI * ramp(f, w.say1, w.say1 + 24)) : 0;
      return { ...base, ...pray(1, b), look: lookT(b), ...life(1), ...(f >= TQ ? eat(TQ) : {}), ears: perk + 0.2 * Math.sin(f * 0.17) };
    }
    case 'popUp': {   // held too long: the puppy hops off backwards, stands, then sits down
      const up = hopU(f), sit2 = sm(ramp(f, w.long - 6, w.long + 20)), hop = 0.05 * Math.sin(Math.PI * ramp(f, w.hops, w.hops + 16));
      const px = -0.14 * sm(ramp(f, w.hops + 2, w.hops + 22));
      const ww = { pray: 1 - up, stand: up * (1 - sit2), sit: up * sit2 };
      return { ...base, w: ww, bow: 8 + (BOW - 8) * b * (1 - up) + 2 * up, pos: [px, MAT + hop, 0], look: W.treat || LEVEL, ears: -0.3 * up + 0.2 * Math.sin(f * 0.13), tail: 0.4 * up,
        wag: up > 0.5 ? Math.sin(f * 0.8) : 0.3 * Math.sin(f * 0.3), headTilt: 8 * up * Math.sin(f * 0.09), blink: f >= w.held && f < w.held + 5 ? 1 : base.blink };
    }
    case 'fix': return { ...base, ...pray(p, b), look: lookT(b), ...life(p), ...(f >= TF ? eat(TF) : {}) };
    case 'yes': return { ...base, ...pray(p, 0), look: [TRN[0] + 0.05, 0.5, TRN[2]], neck: 0.6, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    case 'povFinal': {
      const ch = f >= TY && f < TY + 16 ? Math.abs(Math.sin((f - TY) * 0.75)) : f >= TY + 16 ? 0.35 : 0;
      return { ...base, look: W.treatHide || !W.treat ? [0.9, 0.3, 0.3] : W.treat, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > TY + 1 && f < TY + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: hand / paw pointer + biscuit + trail ----------
const bob = (f) => [0.003 * Math.sin(f * 0.21), 0.004 * Math.sin(f * 0.17), 0.002 * Math.sin(f * 0.13)];
const treatPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'hook': return SH(lureTo((g) => KF(g, [[0, LV()], [26, LOW], [44, LOW2]]), f, HE, MOUTHB()));
    case 'stool': return add([STOOLX, MAT + 0.21 + 0.022, 0], bob(f));   // a normal-size treat ON the stool top
    case 'arm': return KF(f, [[w.arm, START], [w.arm + 16, add(NOSE('sit'), [0.1, -0.06, 0.02])]]);
    case 'hold': return add(KF(f, [[w.hold, START], [w.low + 8, LV()], [w.under + 3, LOW]]), f > w.under ? bob(f) : [0, 0, 0]);
    case 'lower': {
      const base = (g) => add(KF(g, [[w.as, LOW], [w.paws2 + 2, LOW2]]), bob(g));
      if (f < TL + 14) return lureTo(base, f, TL, MOUTHB());
      return KF(f, [[TL + 14, MOUTHB()], [TL + 26, START]]);
    }
    case 'wait': return lureTo((g) => add(KF(g, [[w.next, LOW], [w.next + 18, LOW2]]), bob(g)), f, TW, MOUTHB());
    case 'cue': {
      const base = (g) => add(KF(g, [[w.say1, START], [w.say1 + 14, LV()], [w.head2 - 4, LOW], [w.down, LOW2]]), g > w.pray2 + 20 ? bob(g) : [0, 0, 0]);
      if (f < TQ + 14) return lureTo(base, f, TQ, MOUTHB());
      return KF(f, [[TQ + 14, MOUTHB()], [TQ + 26, START]]);
    }
    case 'popUp': return add(KF(f, [[w.if, LOW2], [w.if + 6, LOW2], [w.long + 20, add(LOW2, [0.0, -0.01, 0])]]), bob(f));
    case 'fix': return lureTo((g) => KF(g, [[w.a, LV()], [w.plenty, LOW], [w.plenty + 14, LOW2]]), f, TF, MOUTHB());
    case 'povFinal': return KF(f, [[w.then, add(MOUTHS(), [0.3, 0.14, 0.35])], [TY, MOUTHS()]]);
  }
  return null;
};
const EAT = { wait: TW + 2, popUp: 9999, fix: TF + 2 };
const HANDSHOTS = ['arm', 'hold', 'lower', 'cue', 'povFinal'];
const PAWSHOTS = { wait: '#ff8fb0', popUp: '#ff5a5a', fix: '#6fe08a' };
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f);
  if (t) W.treat = t;
  if (t && HANDSHOTS.includes(S.id)) W.hand = { treat: t, side: 0.13 };
  const eatAt = { hook: HE, lower: TL, wait: TW, cue: TQ, fix: TF }[S.id];
  if ((eatAt !== undefined && f >= eatAt + 3) || (S.id === 'povFinal' && f >= TY + 3)) W.treatHide = true;
  if (PAWSHOTS[S.id]) {
    W.trailCol = PAWSHOTS[S.id];
    const lift = { wait: TW - 5, fix: TF - 5 }[S.id], tc = t && lift !== undefined && f > lift ? treatPath(lift) : t;
    const pt = tc && add(tc, [0.02, -0.07, 0.17]);            // the cursor floats in front of and below the treat: never over the head or the stool
    if (t) W.paw = { pos: W.treatHide ? add(pt, [1.0 * sm(ramp(f, EAT[S.id], EAT[S.id] + 14)), 0.0, 0.3 * sm(ramp(f, EAT[S.id], EAT[S.id] + 14))]) : pt, s: 0.8 };
  }
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
  const hi = idle(f, 3), W = worldAt(f);
  const o = { hose: true, kneel: 1, expr: f > 30 ? 'grin' : 'smile', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: f > 40 ? -0.2 : 0.8, headTilt: hi.headTilt, near: f > 50 ? 'thumb' : { to: [270, 806], hand: 'fist', bend: -1 } };
  if (W.treat) {
    const T = tD(W.treat), S = trainerShoulder(o, 'far'), ang = Math.atan2(T[1] - S[1], T[0] - S[0]);
    const kind = f > HE + 5 ? 'palm' : f >= HE - 5 ? 'give' : 'treat', off = kind === 'give' ? [19, -12] : [25, -3], s = 2.08 * 1.05, sy = Math.cos(ang) < 0 ? -1 : 1;
    const Wr = [T[0] - (Math.cos(ang) * off[0] * s - Math.sin(ang) * off[1] * sy * s), T[1] - (Math.sin(ang) * off[0] * s + Math.cos(ang) * off[1] * sy * s)];
    o.far = { to: Wr, hand: kind, bend: 1, rot: ang * 180 / Math.PI }; o.lean = 10;
  } else o.far = 'present';
  return o;
};

// ---------- cameras: the locked Down II / Sit-pretty keys, turned to a 3/4 SIDE view (the stool is in front of the puppy: it must never block the face) ----------
const SIDE = (a, b, y0 = 0.72, y1 = 0.68) => [{ f: a, pos: [0.4, y0, 1.66], look: [0.13, 0.32, 0.0], fov: 50 }, { f: b, pos: [0.36, y1, 1.6], look: [0.14, 0.31, 0.0], fov: 50 }];
const CALM = (a, b) => [{ f: a, pos: [0.75, 0.5, 1.45], look: [0.13, 0.3, 0.0], fov: 50 }, { f: b, pos: [0.3, 0.55, 1.7], look: [0.14, 0.3, 0.0], fov: 50, path: [[0.55, 0.52, 1.55]] }];
const CAMS = {
  hook: [{ f: 0, pos: [0.3, 0.95, 2.6], look: [0.3, 0.62, -0.45], fov: 50 }, { f: w.grab - 1, pos: [0.3, 0.93, 2.5], look: [0.31, 0.62, -0.45], fov: 50 }],
  stool: [{ f: w.grab, pos: [1.3, 0.5, 1.0], look: [0.52, 0.3, 0.02], fov: 40 }, { f: w.arm - 1, pos: [1.05, 0.4, 0.8], look: [0.52, 0.28, 0.02], fov: 40 }],
  arm: SIDE(w.arm, w.set - 1, 0.74, 0.7),
  set: CALM(w.set, w.once - 1),
  up: [{ f: w.once, pos: [0.45, 0.5, 1.6], look: [0.13, 0.3, 0.0], fov: 50 }, { f: w.hold - 1, pos: [0.4, 0.48, 1.55], look: [0.14, 0.3, 0.0], fov: 50 }],
  hold: SIDE(w.hold, w.as - 1),
  lower: SIDE(w.as, w.next - 1, 0.66, 0.6),
  wait: [{ f: w.next, pos: [0.55, 0.5, 1.6], look: [0.13, 0.32, 0.0], fov: 48 }, { f: w.but - 1, pos: [0.48, 0.48, 1.52], look: [0.14, 0.32, 0.0], fov: 48 }],
  few: CALM(w.but, w.say1 - 1),
  cue: SIDE(w.say1, w.if - 1, 0.76, 0.7),
  popUp: [{ f: w.if, pos: [0.07, 0.5, 2.0], look: [0.07, 0.34, 0.0], fov: 55 }, { f: w.a - 1, pos: [0.07, 0.54, 2.05], look: [0.07, 0.36, 0.0], fov: 55 }],
  fix: SIDE(w.a, w.say2 - 1, 0.7, 0.66),
  yes: [{ f: w.say2, pos: [0.2, 0.84, 2.35], look: [0.2, 0.5, -0.3], fov: 44 }, { f: w.then - 1, pos: [0.22, 0.8, 2.2], look: [0.22, 0.52, -0.3], fov: 44 }],
  povFinal: [{ f: w.then, pos: [0.4, 0.78, 1.66], look: [0.13, 0.32, 0.0], fov: 50 }, { f: TOTAL - 1, pos: [0.36, 0.76, 1.6], look: [0.14, 0.31, 0.0], fov: 50 }],
};
const BIAS = {};   // look-at nudges that keep the whole dog (and the cursor) inside the frame
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  const bias = BIAS[S.id];
  if (bias) c.look = add(c.look, bias);
  if (S.id.startsWith('pov') || HANDSHOTS.includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (S.id === 'hook' || S.id === 'yes') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 3 };
  if (S.id === 'stool') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'set' || S.id === 'few') return { focus: dist(C.pos, [0.15, 0.25, 0]), cinf: 8 };
  if (S.id === 'popUp') return { focus: dist(C.pos, [0.1, 0.3, 0]), cinf: 6 };
  return { focus: dist(C.pos, [0.2, 0.3, 0]), cinf: 5 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  CUR = camAt(f).pos;
  const S = shotAt(f), out = [];
  if (S.id === 'yes') { TCUR = TRN; const tO = roundAll({ ...trainerYes(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 }); }
  if (S.id === 'hook') { TCUR = TRNH; const tO = roundAll({ ...trainerAt(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRNH[0], y: TRNH[1], z: TRNH[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 }); }
  return out;
};
const BUB_CUE = [0.12, 0.66, 0.0], BUB_YES = [-0.12, 0.78, -0.45];   // bubble anchor points (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.12, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = [0.14, MAT + 0.46, 0.0];
  if (S.id === 'hook') hearts(HE + 1, add(HEAD, [HOOKP[0], -0.04, HOOKP[2] + 0.06]), 3, 0.07);
  if (S.id === 'stool') 
  if (S.id === 'up') badge(T.fxCheck, 'ok', w.up1 - 2, w.hold, [0.1, 0.72, 0.1], 0.13);
  if (S.id === 'hold') badge(T.fxCheck, 'ok', w.under, w.as - 4, [0.1, 0.72, 0.1], 0.13);
  if (S.id === 'lower') { hearts(TL + 1, HEAD); badge(T.fxCheck, 'ok', w.between, w.next - 30, [0.1, 0.72, 0.1], 0.13); }
  if (S.id === 'wait') hearts(TW + 1, HEAD);
  if (S.id === 'few') badge(T.fxCheck, 'ok', w.few2 - 8, w.say1, [0.1, 0.72, 0.1], 0.13);
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'cue') { bubble('bd', 'Pray!', 'as the head goes down', '#ffffff', w.pray2 - 2, w.down + 24, BUB_CUE, 0.2); hearts(TQ + 1, HEAD); }
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'popUp') badge(T.fxCross, 'no', w.held - 3, w.a, [0.1, 0.72, 0.1], 0.2);
  if (S.id === 'fix') { hearts(TF + 1, HEAD); badge(T.fxCheck, 'ok', w.plenty - 2, w.say2, [0.1, 0.72, 0.1], 0.14); }
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    hearts(TY + 3, add(NOSE('sit'), [0.02, 0.1, 0]), 4, 0.06);
    if (f >= TY) for (let i = 0; i < 3; i++) { const t = q(ramp(f, TY + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('sit'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
