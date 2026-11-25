// "Sit Pretty" — a gentle, brief beg pose (upright on the haunches, front paws lifted). 3D puppy (dog-puppy.glb) + the 2D bald trainer, 1020 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3, voice.mp3.words.json, round(s*30)): Let's 0 sit 27 pretty 33 | Grab 67 non-slip 85 floor 99 | Skip 128 (silence_end 127) growing 152 puppies 161 sore 206 joints 244 |
// Ask 283 (silence_end 282) sit 296 | Hold 326 treat 333 above 349 nose 363 lift 382 slowly 392 | Reward 428 (silence_end 427) lift 445 paws 470 | Then 509 ask 512 longer 531 paws 551 up 558 |
// Keep 587 sessions 590 short 597 | Say 635 (silence_end 632) sit 647 pretty 655 starts 686 rise 701 | If 735 jumps 745 stands 765 up 772 lifted 796 high 812 too 833 fast 838 |
// Keep 872 (silence_end 874; whisper 868) close 889 nose 908 | Say 937 yes 943 click 968 | Then 994 reward 995 | end 1019.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and action is keyed to `w`.
// Pointers: HAND in POV shots, PAW cursor in floating shots. Hard cuts only, no flashes. Puppy at the origin, nose toward +x. Camera keys are the locked Down II / Crawl ones.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1020, DECK = 0;
// key word frames (first frame of the word)
const w = {
  sit1: 27, pretty1: 33, grab: 67, nonslip: 85, floor1: 99, skip: 128, growing: 152, skipB: 214, joints: 244, ask: 283, sit2: 296, hold: 326, above: 349, nose1: 363, lift1: 382, slowly: 392,
  reward1: 428, lift2: 445, paws1: 470, then1: 509, longer: 531, up1: 558, keep1: 587, short: 597, say1: 635, sit3: 647, starts: 686, rise: 701,
  if: 735, jumps: 745, stands: 765, high: 812, fast: 838, keep2: 872, close: 889, nose2: 908, say2: 937, yes: 943, click: 968, then2: 994, reward2: 995, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },               // trainer lures; the puppy sits pretty briefly, chomp
  { id: 'setup', a: w.grab, b: w.skip - 1, light: 'day' },         // jar -> mat, check on "non-slip floor"
  { id: 'skip', a: w.skip, b: w.skipB - 1, light: 'day' },         // WARNING: the puppy sits (stiffly), red cross + caution card: skip for growing puppies
  { id: 'skip2', a: w.skipB, b: w.ask - 1, light: 'day' },         // ...and for sore hips, backs, joints: slow orbit, the same sitting puppy
  { id: 'ask', a: w.ask, b: w.hold - 1, light: 'day' },            // POV: ask for a sit
  { id: 'hold', a: w.hold, b: w.reward1 - 1, light: 'day' },       // POV: treat just above the nose, lift it slowly, check
  { id: 'lift', a: w.reward1, b: w.then1 - 1, light: 'day' },      // ground-level: reward any small lift of the front paws, check
  { id: 'longer', a: w.then1, b: w.keep1 - 1, light: 'day' },      // floating: a little longer with the paws up, then down
  { id: 'keep', a: w.keep1, b: w.say1 - 1, light: 'day' },         // keep sessions short: relaxed sit, yawn
  { id: 'cue', a: w.say1, b: w.if - 1, light: 'day' },             // POV: "Sit pretty!" bubble as the puppy starts to rise
  { id: 'popUp', a: w.if, b: w.keep2 - 1, light: 'day' },          // MISTAKE: lure too high / fast (red), puppy hops up and stands, cross
  { id: 'fix', a: w.keep2, b: w.say2 - 1, light: 'day' },          // treat close to the nose (green), gentle rise, check
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
const HOOKP = [0, MAT, -0.48];                          // hook: puppy close to the trainer's card plane (his hand stays visible)
const SH = (P) => [P[0] + HOOKP[0], P[1], P[2] + HOOKP[2]];
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
export const calibrate = (poseFn, root) => {
  root.position.set(...DOGPOS); root.rotation.set(0, DOGYAW, 0); root.updateMatrixWorld(true);
  const far = [3, 0.3, 0];
  REF.sit = poseFn({ w: { sit: 1 }, look: far });
  REF.down = poseFn({ w: { down: 1 }, look: far });
  REF.stand = poseFn({ w: { stand: 1 }, look: far });
  REF.pretty = poseFn({ w: { pretty: 1 }, look: [3, 0.55, 0] });
  root.position.set(...DOGPOS);
};
const NOSE = (r) => REF[r].nose;
const NP = (pr) => lerp3(NOSE('sit'), NOSE('pretty'), pr);                 // nose while rising from a sit (pr 0) to sit pretty (pr 1)
const AHEAD = (pr) => add(NP(pr), [0.11, 0.05, -0.09]);                         // the lure: just ahead of and above the nose
const MOUTHP = (pr) => add(NP(pr), [0.07, -0.02, -0.04]);                      // reward at the mouth
const START = [0.95, 0.12, 0.45];
const PFZ = 0.1;   // the final POV puppy sits a little to the side so the background cone is not on its head                                           // a hand parks its treat here: just below the POV frame
// the key lure step: ~3 cm above the nose, centred in front of the face, then raised ~9 cm slowly while the paws come up
const HOLDT = (f) => add(NP(PR.hold(f)), [0.07, 0.05 + 0.09 * sm(ramp(f, w.lift1, w.reward1 - 6)), 0]);
// chomp frames (the reward lands at the mouth)
const HE = 48, TL = w.lift2 + 7, TLo = w.then1 + 59, TQ = w.rise + 21, TF = w.nose2 + 12;
// how far the puppy has risen from the sit (0 sit, 1 sit pretty); each curve is brief and gentle
const PR = {
  hook: (f) => sm(ramp(f, 14, 36)) * (1 - sm(ramp(f, HE + 6, HE + 20))),
  hold: (f) => 0.5 * sm(ramp(f, w.lift1 + 2, w.reward1 - 4)),
  lift: (f) => 0.5 * sm(ramp(f, w.reward1 + 6, TL + 1)) * (1 - sm(ramp(f, w.then1 - 24, w.then1 - 6))),
  longer: (f) => sm(ramp(f, w.then1 + 3, w.then1 + 27)) * (1 - sm(ramp(f, TLo + 4, TLo + 18))),
  cue: (f) => 0.9 * sm(ramp(f, w.starts, w.rise + 12)),
  fix: (f) => 0.85 * sm(ramp(f, w.keep2 + 4, w.keep2 + 34)) * (1 - sm(ramp(f, TF + 6, TF + 16))),
};
// the lure follows the puppy's nose, then lifts to the mouth at frame tc
const lure = (id, f, tc) => { const p = PR[id]; return f < tc - 5 ? AHEAD(p(f)) : KF(f, [[tc - 5, AHEAD(p(tc - 5))], [tc, MOUTHP(p(tc))]]); };

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
  const rise = (p) => ({ w: { sit: 1 - p, pretty: p } });
  switch (S.id) {
    case 'hook': { const p = PR.hook(f); return { ...base, ...rise(p), pos: HOOKP, look: SH(lk(p)), neck: 1, ...eat(HE), ...bal(p), ears: f < HE ? -0.3 : 0 }; }
    case 'setup': return { ...base, look: [0.9, -0.1 + 0.03 * Math.sin(f * 0.05), 0.3], neck: 1, headTilt: 10 * Math.sin(Math.PI * ramp(f, 100, 126)), wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    case 'skip': case 'skip2': {   // the puppy just sits, a little stiff and still: ear flick, slow weight shift, blink
      const flick = Math.max(0, Math.sin(f * 0.21)) ** 6;
      return { ...base, w: { sit: 1 }, look: lk(0), neck: 1, headTilt: 4 * Math.sin(f * 0.05), ears: 0.25 - 0.7 * flick, wag: 0.12 * Math.sin(f * 0.09), tail: 0.05, breath: 0.35 + 0.3 * Math.sin(f * 0.12) };
    }
    case 'ask': {
      const st = sm(ramp(f, w.ask, w.sit2 + 6));
      return { ...base, w: { stand: 1 - st, sit: st }, look: lk(0), neck: 1, ears: -0.2 * st, wag: 0.5 * Math.sin(f * 0.3) };
    }
    case 'hold': { const p = PR.hold(f); return { ...base, ...rise(p), look: lk(p), neck: 1, ...bal(p) }; }
    case 'lift': { const p = PR.lift(f); return { ...base, ...rise(p), look: lk(p), neck: 1, ...bal(p), ...(f >= TL ? eat(TL) : {}) }; }
    case 'longer': { const p = PR.longer(f); return { ...base, ...rise(p), look: lk(p), neck: 1, ...bal(p), ...(f >= TLo ? eat(TLo) : {}) }; }
    case 'keep': {   // keep it short: relaxed sit, a yawn
      const y = Math.sin(Math.PI * ramp(f, w.keep1 + 8, w.keep1 + 34));
      return { ...base, look: add(NOSE('sit'), [0.5, -0.3, 0.05]), neck: 0.9, jaw: 0.9 * y, blink: y > 0.3 ? 1 : base.blink, ears: 0.4 + 0.2 * Math.sin(f * 0.1), wag: 0.2 * Math.sin(f * 0.12) };
    }
    case 'cue': {
      const p = PR.cue(f), perk = f >= w.sit3 && f < w.sit3 + 24 ? -0.6 * Math.sin(Math.PI * ramp(f, w.sit3, w.sit3 + 24)) : 0;
      return { ...base, ...rise(p), look: lk(p), neck: 1, ...bal(p), ears: perk + 0.25 * p * Math.sin(f * 0.17), ...(f >= TQ ? eat(TQ) : {}) };
    }
    case 'popUp': {
      const up = sm(sm(ramp(f, w.if + 8, w.stands + 10))), hop = 0.05 * Math.sin(Math.PI * ramp(f, w.jumps - 2, w.jumps + 12));
      return { ...base, w: { sit: 1 - up, stand: up }, pos: [0, MAT + hop, 0], look: W.treat ? [W.treat[0], Math.min(W.treat[1], 0.4 + 0.1 * up), W.treat[2]] : null, neck: 0.5, ears: -0.3 * up + 0.2 * Math.sin(f * 0.13),
        tail: 0.4 * up, wag: up > 0.5 ? Math.sin(f * 0.8) : 0.3 * Math.sin(f * 0.3), blink: f >= w.stands + 14 && f < w.stands + 19 ? 1 : base.blink };
    }
    case 'fix': { const p = PR.fix(f); return { ...base, ...rise(p), look: lk(p), neck: 1, ...bal(p), ...(f >= TF ? eat(TF) : {}) }; }
    case 'yes': return { ...base, look: [TRN[0] + 0.05, 0.5, TRN[2]], neck: 0.6, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    case 'povFinal': {
      const t0 = w.reward2 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, pos: [0, MAT, PFZ], look: W.treatHide || !W.treat ? [0.9, 0.3, 0.3 + PFZ] : W.treat, neck: 0.8, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: hand / paw pointer + biscuit + trail ----------
const treatPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'hook': return SH(f < HE - 5 ? AHEAD(PR.hook(f)) : KF(f, [[HE - 5, AHEAD(PR.hook(HE - 5))], [HE, MOUTHP(PR.hook(HE))]]));
    case 'ask': return KF(f, [[w.ask, START], [w.ask + 16, AHEAD(0)]]);
    case 'hold': return f < w.hold + 14 ? KF(f, [[w.hold, START], [w.hold + 14, HOLDT(w.hold + 14)]]) : HOLDT(f);
    case 'lift': return f < w.reward1 + 6 ? AHEAD(0) : lure('lift', f, TL);
    case 'longer': return f < w.then1 + 8 ? KF(f, [[w.then1, add(AHEAD(0), [0.1, 0.0, 0.0])], [w.then1 + 8, AHEAD(0)]]) : lure('longer', f, TLo);
    case 'cue': return f < w.say1 + 14 ? KF(f, [[w.say1, START], [w.say1 + 14, AHEAD(0)]]) : lure('cue', f, TQ);
    case 'popUp': return KF(f, [[w.if, AHEAD(0)], [w.if + 6, AHEAD(0)], [w.if + 18, add(NOSE('sit'), [0.1, 0.32, 0])], [w.stands + 6, add(NOSE('stand'), [0.07, 0.2, 0])], [w.fast - 2, add(NOSE('stand'), [0.07, 0.2, 0])],
      [w.fast + 8, add(NOSE('stand'), [0.12, 0.26, 0])], [w.keep2 - 1, add(NOSE('stand'), [0.12, 0.26, 0])]]);
    case 'fix': return f < w.keep2 + 8 ? KF(f, [[w.keep2, add(AHEAD(0), [0.14, 0.02, 0])], [w.keep2 + 8, AHEAD(0)]]) : lure('fix', f, TF);
    case 'povFinal': return add(KF(f, [[w.then2, add(MOUTHP(0), [0.3, 0.14, 0.05])], [w.reward2 + 2, MOUTHP(0)]]), [0, 0, PFZ]);   // hand lingers to the end
  }
  return null;
};
const EAT = { lift: TL + 2, longer: TLo + 2, fix: TF + 2 };
const HANDSHOTS = ['ask', 'hold', 'cue', 'povFinal'];
const PAWSHOTS = { lift: '#ff8fb0', longer: '#ff8fb0', popUp: '#ff5a5a', fix: '#6fe08a' };
const TRAIL = { popUp: [w.if + 4, treatPath] };   // only the mistake is trailed (a vertical bead column would paint over the face in the other shots)
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f);
  if (t) W.treat = t;
  const tr = TRAIL[S.id];
  if (tr && f > tr[0] && tr[1](f)) {
    const pts = []; let last = null;
    for (let g = tr[0]; g <= f; g += 0.5) { const p = tr[1](g); if (!p) break; if (!last || Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]) > 0.03) { pts.push(p); last = p; } }
    W.trail = pts.slice(0, -1);
  }
  if (t && HANDSHOTS.includes(S.id)) W.hand = { treat: t, side: S.id === 'povFinal' ? 0.22 : S.id === 'hold' ? 0.28 : 0.16 };
  const eatAt = { hook: HE, lift: TL, longer: TLo, cue: TQ, fix: TF }[S.id];
  if ((eatAt !== undefined && f >= eatAt + 3) || (S.id === 'povFinal' && f >= w.reward2 + 4)) W.treatHide = true;
  if (PAWSHOTS[S.id]) {
    W.trailCol = PAWSHOTS[S.id];
    const pt = t && (S.id === 'popUp' ? t : add(t, S.id === 'fix' ? [0.2, 0.08, 0] : [0.08, 0.03, 0]));   // the cursor stays ahead of the nose, never over the face
    if (t) W.paw = { pos: W.treatHide ? add(pt, [0.3 * sm(ramp(f, EAT[S.id], EAT[S.id] + 14)), 0.7 * sm(ramp(f, EAT[S.id], EAT[S.id] + 14)), 0]) : pt, s: 0.8 };   // after the chomp the paw exits up and sideways
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

// ---------- cameras: the locked Down II / Crawl keys; only look-at targets are nudged ----------
const CALM = (a, b) => [{ f: a, pos: [1.25, 0.42, 0.95], look: [0.14, 0.18, 0.0], fov: 47 }, { f: b, pos: [0.3, 0.46, 1.45], look: [0.1, 0.18, 0.0], fov: 47, path: [[0.85, 0.44, 1.3]] }];
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.nonslip - 1, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },
    { f: w.nonslip, pos: [1.22, 0.52, 1.0], look: [0.04, 0.2, 0.0], fov: 38 }, { f: w.skip - 1, pos: [1.1, 0.47, 0.9], look: [0.04, 0.19, 0.0], fov: 38 }],
  skip: [{ f: w.skip, pos: [1.32, 0.66, 0.66], look: [0.18, 0.27, 0.0], fov: 42 }, { f: w.skipB - 1, pos: [1.26, 0.62, 0.63], look: [0.19, 0.23, 0.0], fov: 42 }],
  skip2: CALM(w.skipB, w.ask - 1),
  ask: [{ f: w.ask, pos: [1.28, 0.88, 0.56], look: [0.2, 0.22, 0.0], fov: 42 }, { f: w.hold - 1, pos: [1.22, 0.82, 0.53], look: [0.22, 0.16, 0.0], fov: 42 }],
  hold: [{ f: w.hold, pos: [1.3, 0.8, 0.58], look: [0.24, 0.19, 0.0], fov: 42 }, { f: w.reward1 - 1, pos: [1.25, 0.77, 0.55], look: [0.25, 0.18, 0.0], fov: 42 }],
  lift: [{ f: w.reward1, pos: [1.38, 0.46, 0.74], look: [0.14, 0.24, 0.0], fov: 40 }, { f: w.then1 - 1, pos: [1.32, 0.44, 0.71], look: [0.15, 0.22, 0.0], fov: 40 }],
  longer: [{ f: w.then1, pos: [1.32, 0.66, 0.66], look: [0.18, 0.27, 0.0], fov: 42 }, { f: w.keep1 - 1, pos: [1.26, 0.62, 0.63], look: [0.19, 0.23, 0.0], fov: 42 }],
  keep: CALM(w.keep1, w.say1 - 1),
  cue: [{ f: w.say1, pos: [1.3, 0.9, 0.6], look: [0.2, 0.33, 0.0], fov: 42 }, { f: w.if - 1, pos: [1.24, 0.84, 0.57], look: [0.22, 0.24, 0.0], fov: 42 }],
  popUp: [{ f: w.if, pos: [0.84, 0.5, 1.3], look: [0.34, 0.36, 0.05], fov: 58 }, { f: w.keep2 - 1, pos: [0.78, 0.6, 1.45], look: [0.34, 0.42, 0.05], fov: 58 }],
  fix: [{ f: w.keep2, pos: [1.32, 0.66, 0.66], look: [0.18, 0.27, 0.0], fov: 42 }, { f: w.say2 - 1, pos: [1.26, 0.62, 0.63], look: [0.19, 0.23, 0.0], fov: 42 }],
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then2 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  povFinal: [{ f: w.then2, pos: [1.34, 0.84, 0.72], look: [0.17, 0.2, 0.0], fov: 42 }, { f: TOTAL - 1, pos: [1.29, 0.81, 0.69], look: [0.18, 0.2, 0.0], fov: 42 }],
};
const BIAS = { popUp: [-0.2, 0.0, 0], ask: [0, 0.1, 0], hold: [0, 0.12, 0], lift: [0, 0.2, 0], longer: [0, 0.22, 0], cue: [0, 0.12, 0], fix: [0.08, 0.22, 0], skip: [0, 0.2, 0] };   // look-at nudges that keep the whole dog (and the cursor) inside the frame
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  const calm = S.id === 'skip2' || S.id === 'keep', a = SHOTS.find((s) => s.id === S.id).a, b = SHOTS.find((s) => s.id === S.id).b;
  const bias = calm ? [-0.1 + 0.1 * ramp(f, a, b), 0.12, 0] : BIAS[S.id];
  if (bias) c.look = add(c.look, bias);
  if (S.id.startsWith('pov') || HANDSHOTS.includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), head = REF.sit ? REF.sit.head : [0.2, 0.4, 0];
  if (S.id === 'hook' || S.id === 'yes') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'skip2' || S.id === 'keep') return { focus: dist(C.pos, [0.1, 0.22, 0]), cinf: 9 };
  if (S.id === 'lift') return { focus: dist(C.pos, [0.18, 0.2, 0]), cinf: 8 };
  if (S.id === 'popUp') return { focus: dist(C.pos, [0.1, 0.3, 0]), cinf: 6 };
  if (S.id === 'longer' || S.id === 'fix') return { focus: dist(C.pos, [0.12, 0.2, 0]), cinf: 4 };
  return { focus: dist(C.pos, head), cinf: 6 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  CUR = camAt(f).pos; TCUR = TRN;
  const S = shotAt(f), out = [];
  if (S.id === 'yes') { const tO = roundAll({ ...trainerYes(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 }); }
  if (S.id === 'hook') { const tO = roundAll({ ...trainerAt(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 }); }
  return out;
};
const BUB_CUE = [0.2, 0.5, -0.02], BUB_YES = [-0.12, 0.78, -0.45];   // bubble anchor points (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.12, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = (p) => add(NP(p), [-0.1, 0.1, 0]);
  if (S.id === 'hook') hearts(HE + 1, add(HEAD(0), [HOOKP[0], 0.0, HOOKP[2] + 0.06]), 3, 0.07);
  if (S.id === 'setup') badge(T.fxCheck, 'ok', w.floor1 + 4, w.skip, [0.5, 0.1, 0.5], 0.11);
  if (S.id === 'skip') badge(T.fxCross, 'no', w.growing - 2, w.skipB, [0.02, 0.56, 0.1], 0.18);
  if (S.id === 'skip2') badge(T.fxCross, 'no', w.skipB, w.joints + 16, [0.0, 0.6, 0.1], 0.2);
  if (S.id === 'hold') badge(T.fxCheck, 'ok', w.nose1, w.reward1 - 4, [0.2, 0.55, 0.1], 0.13);
  if (S.id === 'lift') { hearts(TL + 1, HEAD(0.5)); badge(T.fxCheck, 'ok', w.paws1, w.then1, [0.15, 0.6, 0.1], 0.13); }
  if (S.id === 'longer') hearts(TLo + 1, HEAD(1));
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'skip') bubble('cc', 'Skip it', 'puppies, sore joints', '#ffd9d4', w.growing - 2, w.skipB, [0.34, 0.5, 0.1], 0.15);
  if (S.id === 'skip2') bubble('cd', 'Skip it', 'puppies, sore joints', '#ffd9d4', w.skipB, w.joints + 16, [0.34, 0.55, 0.1], 0.15);
  if (S.id === 'cue') { bubble('bd', 'Sit pretty!', 'as it rises', '#ffffff', w.sit3 - 2, w.rise + 8, BUB_CUE, 0.2); hearts(TQ + 1, HEAD(0.9)); }
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'popUp') badge(T.fxCross, 'no', w.high - 3, w.keep2, [0.2, 0.7, 0.1], 0.2);
  if (S.id === 'fix') { hearts(TF + 1, HEAD(0.85)); badge(T.fxCheck, 'ok', w.close, w.say2, [0.1, 0.66, 0.1], 0.14); }
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward2 + 3, add(HEAD(0), [0, 0, PFZ]), 4, 0.06);
    if (f >= w.reward2) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward2 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('sit'), [0.05, 0.05, -0.2 + i * 0.2 + PFZ]), 0.4, { order: 7 })); }
  }
  return out;
};
