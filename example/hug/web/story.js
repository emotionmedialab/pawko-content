// "Hug" — the puppy rises from a sit, rests its front paws on the kneeling trainer's chest and its head on his shoulder. 3D puppy (dog-puppy.glb) + the 2D bald trainer, 1140 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3, voice.mp3.words.json, round(s*30)): Let's 0 give 40 hug 51 | Only 86 (silence_end 84) loves 127 contact 147 | Sit 188 (whisper; silence_end 191) floor 203 chair 233 front 274 you 284 |
// Hold 308 (silence_end 311) treat 319 above 326 shoulder 341 guide 363 paws 398 onto 411 you 421 | Reward 454 | Next 488 (silence_end 489) reward 508 head 547 shoulder 565 | Keep 598 gentle 606 |
// Then 642 (silence_end 638) say 642 hug 653 paws 689 up 705 | Keep 733 (silence_end 735) nails 739 trimmed 748 | If 791 (silence_end 792) leans 806 away 812 unsure 841 may 879 hugs 901 |
// Never 941 (silence_end 937) hold 941 there 958 | Keep 989 (silence_end 991) short 998 optional 1019 | Say 1056 (silence_end 1052) yes 1057 click 1084 | Then 1109 (silence_end 1113) reward 1117 | end 1139.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and action is keyed to `w`.
// Pointers: HAND in POV shots. Hard cuts only, no flashes. Puppy near the origin, nose toward +x. Camera keys are the locked Down II / Crawl ones.
// Trainer shots (hook camera, card faces the puppy): the kneeling card is drawn at ST 0.82 (not 1.08) so a puppy's front paws can reach his chest and its head his shoulder.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1140, DECK = 0;
// key word frames (first frame of the word)
const w = {
  give: 40, hug1: 51, only: 86, loves: 127, contact: 147, sit1: 191, floor: 203, chair: 233, front: 274, hold: 311, treat: 319, above: 326, shoulder1: 341, guide: 363, paws1: 398, onto: 411, reward1: 454,
  next: 489, reward2: 508, head: 547, shoulder2: 565, keep1: 598, gentle: 606, say1: 642, hug2: 653, paws2: 689, up: 705, keep2: 735, nails: 739, trimmed: 748, if: 792, leans: 806, away: 812, unsure: 841,
  may: 879, hugs: 901, never: 941, there: 958, keep3: 991, short: 998, optional: 1019, say2: 1056, yes: 1057, click: 1084, then2: 1113, reward3: 1117, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.only - 1, light: 'day' },               // trainer + puppy: the puppy rises, paws on his chest, head on his shoulder
  { id: 'loves', a: w.only, b: w.sit1 - 1, light: 'day' },         // low orbit: a happy, relaxed puppy, check (loves close contact)
  { id: 'floor', a: w.sit1, b: w.front - 1, light: 'day' },        // trainer kneeling on the floor, puppy sitting in front of him
  { id: 'front', a: w.front, b: w.hold - 1, light: 'day' },        // POV: the dog in front of you
  { id: 'hold', a: w.hold, b: w.guide - 1, light: 'day' },         // POV: treat above your shoulder
  { id: 'guide', a: w.guide, b: w.next - 1, light: 'day' },        // POV: guide the front paws up, reward
  { id: 'rest', a: w.next, b: w.keep1 - 1, light: 'day' },         // trainer: paws up, head rests on his shoulder, check
  { id: 'gentle', a: w.keep1, b: w.say1 - 1, light: 'day' },       // keep it gentle: calm low orbit
  { id: 'cue', a: w.say1, b: w.keep2 - 1, light: 'day' },          // POV: "Hug!" bubble as the paws go up
  { id: 'nails', a: w.keep2, b: w.if - 1, light: 'day' },          // ground-level: a raised paw, check (nails trimmed)
  { id: 'lean', a: w.if, b: w.may - 1, light: 'day' },             // trainer: the puppy leans away, unsure
  { id: 'no', a: w.may, b: w.never - 1, light: 'day' },            // low orbit: the puppy looks away, cross (may not enjoy hugs)
  { id: 'never', a: w.never, b: w.keep3 - 1, light: 'day' },       // trainer: never hold them there: the puppy lowers its paws freely, cross
  { id: 'short', a: w.keep3, b: w.say2 - 1, light: 'day' },        // keep it short and optional: relaxed sit, yawn
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
const MAT = 0.064, K = 0.00225, ST = 1.08, LEAN = 30;
const DOGPOS = [0, MAT, 0], DOGYAW = Math.PI / 2;      // POV / low-orbit puppy on the mat, nose toward +x
const TRN = [0.57, MAT, -0.66];
const HUGPOS = [0.23, MAT, -0.54];                       // trainer shots: the puppy sits just in front of his card, facing him (rump planted here)
let CUR = [0, 1, 3], TCUR = TRN;
const axisOf = (pos) => { const ry = Math.atan2(CUR[0] - pos[0], CUR[2] - pos[2]); return [Math.cos(ry), 0, -Math.sin(ry)]; };
/** world point -> trainer design point along the camera ray (flipped card) */
const tD = (P) => {
  const C = CUR, TR0 = TCUR, ax = axisOf(TR0), n = [-ax[2], 0, ax[0]];
  const d = [P[0] - C[0], P[1] - C[1], P[2] - C[2]], den = d[0] * n[0] + d[2] * n[2] || 1e-6;
  const s = ((TR0[0] - C[0]) * n[0] + (TR0[2] - C[2]) * n[2]) / den, Q = [C[0] + d[0] * s, C[1] + d[1] * s, C[2] + d[2] * s];
  return [300 - ((Q[0] - TR0[0]) * ax[0] + (Q[2] - TR0[2]) * ax[2]) / (K * ST), 975 - (Q[1] - TR0[1]) / (K * ST)];
};
/** trainer design point -> world point (front camera, card plane) */
const D2W = (d) => [TRN[0] + (300 - d[0]) * K * ST, MAT + (975 - d[1]) * K * ST, TRN[2]];
const SHO = trainerShoulder({ hose: true, kneel: 1, lean: LEAN }, 'far');   // his shoulder on the puppy's side (design point)
const HEADPT = D2W(add(SHO, [46, 45]));                  // where the puppy's chin rests: on his shoulder
const ABOVE = D2W(add(SHO, [60, -10]));                  // a treat held above his shoulder

// ---------- reference points from the real rig ----------
const REF = {};
export const calibrate = (poseFn, root) => {
  root.position.set(...DOGPOS); root.rotation.set(0, DOGYAW, 0); root.updateMatrixWorld(true);
  const far = [3, 0.3, 0];
  REF.sit = poseFn({ w: { sit: 1 }, look: far });
  REF.down = poseFn({ w: { down: 1 }, look: far });
  REF.stand = poseFn({ w: { stand: 1 }, look: far });
  REF.pretty = poseFn({ w: { pretty: 1 }, look: [3, 0.55, 0] });
  REF.hug = poseFn({ w: { hug: 1 }, look: [3, 0.3, 0], neck: 1 });
  console.log('REF', JSON.stringify({ sit: REF.sit.nose, pretty: REF.pretty.nose, hugHead: REF.hug.head, hugNose: REF.hug.nose, hugPaw: REF.hug.paw, HEADPT, ABOVE, SHO }));
  root.position.set(...DOGPOS);
};
const NOSE = (r) => REF[r].nose;
const NP = (pr) => lerp3(NOSE('sit'), NOSE('pretty'), pr);                 // nose while rising from a sit (pr 0) to sit pretty (pr 1)
const AHEAD = (pr) => add(NP(pr), [0.11, 0.05, -0.09]);                         // the lure: just ahead of and above the nose
const MOUTHP = (pr) => add(NP(pr), [0.07, -0.02, -0.04]);                      // reward at the mouth
const START = [0.95, 0.12, 0.45];
const PFZ = 0.1;   // the final POV puppy sits a little to the side so the background cone is not on its head
// chomp frames (the reward lands at the mouth)
const HE = w.hug1 + 22, TG = w.reward1 + 4, TQ = w.up + 14;
// how far the puppy has risen from the sit (0 sit, 1 sit pretty) in the POV shots, and how far its paws have reached forward (0 tucked, 1 reached)
const PR = {
  hold: (f) => 0.3 * sm(ramp(f, w.above, w.guide - 8)),
  guide: (f) => sm(ramp(f, w.guide + 2, w.onto + 8)) * (1 - sm(ramp(f, TG + 8, TG + 24))),
  cue: (f) => sm(ramp(f, w.paws2 - 14, w.up + 6)),
};
const PH = {
  guide: () => 0,   // POV: the paws stay tucked (reaching forward would cover the face); the reach shows in the trainer shots
  cue: () => 0,
};
// the lure follows the puppy's nose, then lifts to the mouth at frame tc
const lure = (id, f, tc) => { const p = PR[id]; return f < tc - 5 ? AHEAD(p(f)) : KF(f, [[tc - 5, AHEAD(p(tc - 5))], [tc, MOUTHP(p(tc))]]); };
// the trainer shots: p = risen (0 sit .. 1 upright), h = paws reached onto his chest, r = head resting on his shoulder
const HG = {
  hook: (f) => ({ p: sm(ramp(f, w.give, w.give + 20)), h: sm(ramp(f, w.give + 12, w.hug1 + 10)), r: sm(ramp(f, HE + 2, HE + 16)) }),
  rest: (f) => ({ p: sm(ramp(f, w.next, w.next + 16)), h: sm(ramp(f, w.next + 8, w.next + 26)), r: sm(ramp(f, w.reward2 + 4, w.head - 2)) }),
  never: (f) => ({ p: 1 - sm(ramp(f, w.never + 16, w.never + 40)), h: 1 - sm(ramp(f, w.never + 8, w.never + 28)), r: 1 - sm(ramp(f, w.never + 2, w.never + 16)) }),
};

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { sit: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const lk = (p) => { const n = NP(p); return [n[0] + 0.4, n[1] - 0.28, 0]; };   // eyes level: never a steep look-up
  const eat = (t0) => ({ jaw: f >= t0 + 15 ? 0.3 : chompAt(f, t0), ...(f > t0 + 1 ? happy : {}), blink: f > t0 + 1 && f < t0 + 7 ? 1 : base.blink });
  // balancing on the haunches: tiny weight shifts, ear flicks
  const bal = (pr) => ({ headTilt: (2 + pr * 4) * Math.sin(f * 0.11), ears: (0.12 + pr * 0.25) * Math.sin(f * 0.17), wag: lerp(0.4 * Math.sin(f * 0.25), 0.9 * Math.sin(f * 0.45), pr) });
  const rise = (p, h) => ({ w: { sit: 1 - p, pretty: p * (1 - h), hug: p * h } });
  // at the trainer: look at the treat above his shoulder, then settle the chin on it
  const atHim = (g, look) => ({ ...base, pos: HUGPOS, ...rise(g.p, g.h), look: lerp3(look, add(HEADPT, [0.06, -0.1, 0]), g.r), neck: 1, headTilt: 2 + 12 * g.r, ears: 0.1 + 0.3 * g.r + 0.08 * Math.sin(f * 0.15),
    wag: lerp(0.4 * Math.sin(f * 0.25), 0.7 * Math.sin(f * 0.4), g.p) });
  const sitAt = { ...base, pos: HUGPOS };
  const flick = Math.max(0, Math.sin(f * 0.21)) ** 6;
  switch (S.id) {
    case 'hook': { const g = HG.hook(f); return { ...atHim(g, W.treat || ABOVE), ...(f >= HE ? eat(HE) : {}), ...(f >= HE + 2 ? { headTilt: 2 + 12 * g.r } : {}) }; }
    case 'loves': return { ...base, look: add(NOSE('sit'), [0.5, -0.4, 0.35]), neck: 1, headTilt: 5 * Math.sin(f * 0.07), ears: 0.2 - 0.5 * flick, wag: 0.9 * Math.sin(f * 0.6), tail: 0.35, breath: 0.35 + 0.3 * Math.sin(f * 0.12),
      jaw: 0.25 + 0.2 * Math.sin(f * 0.11), blink: f % 61 < 6 ? 1 : 0 };
    case 'floor': return { ...sitAt, look: add(ABOVE, [0, -0.1, 0]), neck: 1, headTilt: 5 * Math.sin(f * 0.06) + 3, ears: 0.15 - 0.45 * flick, wag: 0.9 * Math.sin(f * 0.4), tail: 0.35, yaw: DOGYAW + 0.12 * Math.sin(f * 0.045) };
    case 'front': return { ...base, look: lk(0), neck: 1, ears: -0.15 + 0.1 * Math.sin(f * 0.13), wag: 0.5 * Math.sin(f * 0.3), headTilt: 4 * Math.sin(f * 0.09) };
    case 'hold': { const p = PR.hold(f); return { ...base, ...rise(p, 0), look: lk(p), neck: 1, ...bal(p) }; }
    case 'guide': { const p = PR.guide(f), h = PH.guide(f); return { ...base, ...rise(p, h), look: lk(p), neck: 1, ...bal(p), ...(f >= TG ? eat(TG) : {}) }; }
    case 'rest': { const g = HG.rest(f); return atHim(g, ABOVE); }
    case 'gentle': return { ...base, look: add(NOSE('sit'), [0.5, -0.45, 0.05]), neck: 1, ears: 0.3 + 0.15 * Math.sin(f * 0.1), wag: 0.25 * Math.sin(f * 0.12), blink: f % 53 > 30 && f % 53 < 40 ? 1 : 0, breath: 0.35 + 0.3 * Math.sin(f * 0.1) };
    case 'cue': {
      const p = PR.cue(f), h = PH.cue(f), perk = f >= w.say1 && f < w.say1 + 24 ? -0.6 * Math.sin(Math.PI * ramp(f, w.say1, w.say1 + 24)) : 0;
      return { ...base, ...rise(p, h), look: lk(p), neck: 1, ...bal(p), ears: perk + 0.25 * p * Math.sin(f * 0.17), ...(f >= TQ ? eat(TQ) : {}) };
    }
    case 'nails': {   // a sit with one front paw lifted, then lowered
      const up = sm(ramp(f, w.keep2 + 4, w.keep2 + 22)) * (1 - sm(ramp(f, w.trimmed + 14, w.trimmed + 32)));
      return { ...base, w: { sit: 1 - up, shake: up }, look: add(NOSE('sit'), [0.6, -0.5, 0.2]), neck: 1, headTilt: 3 * Math.sin(f * 0.08), ears: 0.2 * Math.sin(f * 0.15), wag: 0.7 * Math.sin(f * 0.35), tail: 0.25 };
    }
    case 'lean': {   // unsure: the body turns away, the head turns further away, ears flat, slow blink
      const a = sm(ramp(f, w.if, w.if + 32));
      return { ...sitAt, yaw: DOGYAW - 1.25 * a, look: [HUGPOS[0] - 0.7, -0.15, HUGPOS[2] + 0.6], neck: 1, ears: 1 * a, tail: -0.3 * a, wag: 0.05 * Math.sin(f * 0.1), headTilt: -10 * a, breath: 0.4 + 0.3 * Math.sin(f * 0.14), blink: f % 47 > 28 && f % 47 < 36 ? 1 : 0 };
    }
    case 'no': return { ...base, yaw: DOGYAW - 0.9, look: [-0.7, -0.1, 0.5], neck: 1, ears: 0.9, tail: 0, wag: 0.05 * Math.sin(f * 0.1), headTilt: -6, breath: 0.4 + 0.3 * Math.sin(f * 0.14), blink: f % 47 > 28 && f % 47 < 36 ? 1 : 0 };
    case 'never': {
      const g = HG.never(f), away = sm(ramp(f, w.never + 30, w.there + 20));
      return { ...atHim(g, add(HEADPT, [0.2, 0.0, 0.3])), look: lerp3(add(HEADPT, [0.06, -0.1, 0]), [HUGPOS[0] + 0.6, 0.2, HUGPOS[2] + 0.5], 1 - g.r), ears: 0.1 + 0.2 * away, wag: 0.1 * Math.sin(f * 0.2) };
    }
    case 'short': {   // keep it short: a yawn, then it turns its head away (optional)
      const y = Math.sin(Math.PI * ramp(f, w.short + 4, w.short + 30));
      return { ...base, look: add(NOSE('sit'), [0.5, -0.45, 0.05]), neck: 1, jaw: 0.9 * y, blink: y > 0.3 ? 1 : base.blink, ears: 0.4 + 0.2 * Math.sin(f * 0.1), wag: 0.2 * Math.sin(f * 0.12) };
    }
    case 'yes': return { ...base, pos: [0.0, MAT, -0.2], look: [TRN[0] + 0.05, -0.05, TRN[2]], neck: 1, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    case 'povFinal': {
      const t0 = w.reward3 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, pos: [0, MAT, PFZ], look: W.treatHide || !W.treat ? [0.9, 0.3, 0.3 + PFZ] : W.treat, neck: 0.8, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: hand pointer + biscuit ----------
const treatPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'hook': return f < w.give ? ABOVE : KF(f, [[w.give, ABOVE], [HE, add(HEADPT, [0.05, -0.04, 0.04])]]);
    case 'hold': return KF(f, [[w.hold, START], [w.hold + 16, add(AHEAD(0), [0.0, 0.03, 0.0])]]);
    case 'guide': return f < w.guide + 10 ? add(AHEAD(PR.guide(f)), [0.0, 0.03 * (1 - PR.guide(f)), 0]) : lure('guide', f, TG);
    case 'cue': return f < w.say1 + 14 ? KF(f, [[w.say1, START], [w.say1 + 14, AHEAD(0)]]) : lure('cue', f, TQ);
    case 'povFinal': return add(KF(f, [[w.then2, add(MOUTHP(0), [0.3, 0.14, 0.05])], [w.reward3 + 2, MOUTHP(0)]]), [0, 0, PFZ]);   // hand lingers to the end
  }
  return null;
};
const HANDSHOTS = ['hold', 'guide', 'cue', 'povFinal'];
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f);
  if (t) W.treat = t;
  if (t && HANDSHOTS.includes(S.id)) W.hand = { treat: t, side: S.id === 'povFinal' ? 0.22 : S.id === 'hold' ? 0.28 : 0.16 };
  const eatAt = { hook: HE, guide: TG, cue: TQ }[S.id];
  if ((eatAt !== undefined && f >= eatAt + 3) || (S.id === 'povFinal' && f >= w.reward3 + 4)) W.treatHide = true;
  return W;
};

// ---------- the 2D trainer (trainer shots + yes) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5;
  return { kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 4,
    near: { to: [318, 690 - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present', lean: 6 };
};
const trainerAt = (f) => {
  const S = shotAt(f).id, hi = idle(f, 3), W = worldAt(f);
  const o = { hose: true, kneel: 1, expr: 'grin', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.2, headTilt: hi.headTilt, lean: LEAN, near: 'thumb', far: 'present' };
  if (S === 'hook') {   // treat above his shoulder, the puppy comes up to it, he gives it, then his hand rests behind its back
    o.near = 'hang';
    if (W.treat && !W.treatHide) {
      const T = tD(W.treat), Sh = trainerShoulder(o, 'far'), ang = Math.atan2(T[1] - Sh[1], T[0] - Sh[0]);
      const kind = f >= HE - 5 ? 'give' : 'treat', off = kind === 'give' ? [19, -12] : [25, -3], s = 2.08 * 1.05 * ST / 1.08, sy = Math.cos(ang) < 0 ? -1 : 1;
      const Wr = [T[0] - (Math.cos(ang) * off[0] * s - Math.sin(ang) * off[1] * sy * s), T[1] - (Math.sin(ang) * off[0] * s + Math.cos(ang) * off[1] * sy * s)];
      o.far = { to: Wr, hand: kind, bend: 1, rot: ang * 180 / Math.PI };
    } else o.far = { to: add(SHO, [24, 100]), hand: 'open', bend: 1 };
    o.expr = f > w.hug1 + 20 ? 'proud' : 'grin';
  } else if (S === 'floor') { o.far = { to: add(SHO, [70, 120]), hand: 'open', bend: 1 }; o.near = 'hang'; o.look = 0.4; }
  else if (S === 'rest') { o.far = { to: add(SHO, [24, 100]), hand: 'open', bend: 1 }; o.near = 'hang'; o.expr = 'proud'; }
  else if (S === 'lean') { o.expr = 'patient'; o.far = { to: add(SHO, [70, 130]), hand: 'open', bend: 1 }; o.near = 'hang'; }
  else if (S === 'never') { o.expr = 'patient'; o.far = { to: add(SHO, [24 + 70 * sm(ramp(f, w.never, w.never + 12)), 100 - 60 * sm(ramp(f, w.never, w.never + 12))]), hand: 'open', bend: 1 }; o.near = 'hang'; }
  return o;
};

// ---------- cameras: the locked Down II / Crawl keys; only look-at targets are nudged ----------
const CALM = (a, b) => [{ f: a, pos: [1.25, 0.42, 0.95], look: [0.14, 0.18, 0.0], fov: 47 }, { f: b, pos: [0.3, 0.46, 1.45], look: [0.1, 0.18, 0.0], fov: 47, path: [[0.85, 0.44, 1.3]] }];
const HOOKCAM = (a, b) => [{ f: a, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: b, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }];
const CAMS = {
  hook: HOOKCAM(0, w.only - 1),
  loves: CALM(w.only, w.sit1 - 1),
  floor: HOOKCAM(w.sit1, w.front - 1),
  front: [{ f: w.front, pos: [1.28, 0.88, 0.56], look: [0.2, 0.22, 0.0], fov: 42 }, { f: w.hold - 1, pos: [1.22, 0.82, 0.53], look: [0.22, 0.16, 0.0], fov: 42 }],
  hold: [{ f: w.hold, pos: [1.3, 0.8, 0.58], look: [0.24, 0.19, 0.0], fov: 42 }, { f: w.guide - 1, pos: [1.25, 0.77, 0.55], look: [0.25, 0.18, 0.0], fov: 42 }],
  guide: [{ f: w.guide, pos: [1.3, 0.9, 0.6], look: [0.2, 0.33, 0.0], fov: 42 }, { f: w.next - 1, pos: [1.24, 0.84, 0.57], look: [0.22, 0.24, 0.0], fov: 42 }],
  rest: HOOKCAM(w.next, w.keep1 - 1),
  gentle: CALM(w.keep1, w.say1 - 1),
  cue: [{ f: w.say1, pos: [1.3, 0.9, 0.6], look: [0.2, 0.33, 0.0], fov: 42 }, { f: w.keep2 - 1, pos: [1.24, 0.84, 0.57], look: [0.22, 0.24, 0.0], fov: 42 }],
  nails: [{ f: w.keep2, pos: [1.38, 0.46, 0.74], look: [0.14, 0.24, 0.0], fov: 40 }, { f: w.if - 1, pos: [1.32, 0.44, 0.71], look: [0.15, 0.22, 0.0], fov: 40 }],
  lean: HOOKCAM(w.if, w.may - 1),
  no: CALM(w.may, w.never - 1),
  never: HOOKCAM(w.never, w.keep3 - 1),
  short: CALM(w.keep3, w.say2 - 1),
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then2 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  povFinal: [{ f: w.then2, pos: [1.34, 0.84, 0.72], look: [0.17, 0.2, 0.0], fov: 42 }, { f: TOTAL - 1, pos: [1.29, 0.81, 0.69], look: [0.18, 0.2, 0.0], fov: 42 }],
};
const BIAS = { front: [0, 0.1, 0], hold: [0, 0.12, 0], guide: [0, 0.12, 0], cue: [0, 0.12, 0], nails: [0, 0.2, 0] };   // look-at nudges that keep the whole dog inside the frame
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  const calm = ['loves', 'gentle', 'no', 'short'].includes(S.id), a = SHOTS.find((s) => s.id === S.id).a, b = SHOTS.find((s) => s.id === S.id).b;
  const bias = calm ? [-0.1 + 0.1 * ramp(f, a, b), 0.12, 0] : BIAS[S.id];
  if (bias) c.look = add(c.look, bias);
  if (S.id.startsWith('pov') || HANDSHOTS.includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), head = REF.sit ? REF.sit.head : [0.2, 0.4, 0];
  if (['hook', 'floor', 'rest', 'lean', 'never', 'yes'].includes(S.id)) return { focus: dist(C.pos, [0.3, 0.35, -0.3]), cinf: 6 };
  if (['loves', 'gentle', 'no', 'short'].includes(S.id)) return { focus: dist(C.pos, [0.1, 0.22, 0]), cinf: 9 };
  if (S.id === 'nails') return { focus: dist(C.pos, [0.18, 0.2, 0]), cinf: 8 };
  return { focus: dist(C.pos, head), cinf: 6 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  CUR = camAt(f).pos; TCUR = TRN;
  const S = shotAt(f), out = [];
  const card = (tO) => out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 });
  if (S.id === 'yes') card(roundAll({ ...trainerYes(f), mirror: true }));
  if (['hook', 'floor', 'rest', 'lean', 'never'].includes(S.id)) card(roundAll({ ...trainerAt(f), mirror: true }));
  return out;
};
const BUB_CUE = [0.2, 0.5, -0.02], BUB_YES = [-0.12, 0.74, -0.45];   // bubble anchor points (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.12, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const BADGE = [-0.1, 0.9, HUGPOS[2] + 0.06], BS = 0.3;   // trainer shots: full-size badge in the clear space left of the puppy, away from his cap
  const TOPHEAD = [HEADPT[0] - 0.2, 0.6, HUGPOS[2] + 0.06];          // above the resting head, trainer shots
  if (S.id === 'hook') hearts(HE + 8, TOPHEAD, 3, 0.07);
  if (S.id === 'loves') badge(T.fxCheck, 'ok', w.loves, w.sit1 - 20, [0.1, 0.6, 0.1], 0.18);
  if (S.id === 'rest') { hearts(w.head + 4, TOPHEAD, 3, 0.07); badge(T.fxCheck, 'ok', w.head + 14, w.keep1, BADGE, BS); }
  if (S.id === 'nails') badge(T.fxCheck, 'ok', w.nails, w.if, [0.15, 0.6, 0.1], 0.13);
  if (S.id === 'lean') badge(T.fxCross, 'no', w.unsure, w.may, BADGE, BS);
  if (S.id === 'no') badge(T.fxCross, 'no', w.may, w.never, [0.0, 0.58, 0.1], 0.2);
  if (S.id === 'never') badge(T.fxCross, 'no', w.never + 30, w.keep3, BADGE, BS);
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'cue') { bubble('bd', 'Hug!', 'as the paws go up', '#ffffff', w.hug2 - 2, w.up + 8, BUB_CUE, 0.2); hearts(TQ + 1, add(NP(0.9), [-0.1, 0.1, 0]), 3, 0.06); }
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward3 + 3, add(NP(0), [-0.12, -0.08, PFZ]), 4, 0.06);
    if (f >= w.reward3) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward3 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('sit'), [0.05, 0.05, -0.2 + i * 0.2 + PFZ]), 0.4, { order: 7 })); }
  }
  return out;
};
