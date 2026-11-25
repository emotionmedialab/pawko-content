// "Right paw" — teach the right paw: closed fist, open palm, the cue, left/right, the wrong paw. 3D puppy (dog-puppy.glb) + the 2D bald trainer, 1123 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3 = ElevenLabs "Holden", round(s*30); sentence starts taken from silencedetect silence_end, not whisper):
// Let's 0 right 41 paw 48 | Grab 85 treats 88 quiet 107 room 113 | Hold 151 treat 158 closed 172 fist 179 right 213 side 217 | Wait 252 |
// The 283 right 297 paw 303 lifts 311 | reward 339 | Next 377 offer 392 open 406 palm 412 right 433 | Reward 462 paw 493 touches 499 |
// Now 538 say 541 right 566 paw 577 before 596 offer 606 hand 618 | Once 651 both 654 paws 663 solid 679 | ask 706 left 717 right 737 random 758 order 770 |
// If 802 wrong 830 paw 836 | they 863 guessing 871 | Don't 903 reward 909 | Reset 943 reward 966 only 975 correct 996 paw 1004 | Say 1043 yes 1050 click 1073 | then 1100 reward 1106 | end 1122.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and
// action is keyed to `w` (+/- a few frames), so nothing else needs to change. Pointers: HAND in POV shots.
// The dog's RIGHT paw is +z in world space (the puppy faces +x), so from a front camera it is on SCREEN LEFT; the side cameras sit at +z and see its right flank.
// Hard cuts only, no flashes. Puppy at the origin, nose toward +x.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1123, DECK = 0;
// key word frames (first frame of the word)
const w = {
  right1: 41, paw1: 48, grab: 85, quiet: 107, hold: 151, treat1: 158, closed: 172, fist: 179, wait: 252,
  the: 283, right2: 297, lifts: 311, reward1: 339, next: 377, offer1: 392, open: 406, palm: 412, right3: 433,
  reward2: 462, paw3: 493, touches: 499, now: 538, right4: 566, before: 596, offer2: 606, hand: 618,
  once: 651, solid: 679, ask: 706, left1: 717, right5: 737, random: 758, order: 770,
  if: 802, wrong: 830, they: 863, guess: 871, dont: 903, reward3: 909, reset: 943, reward4: 966, only: 975, correct: 996, paw6: 1004,
  say2: 1043, yes: 1050, click: 1073, then: 1100, reward5: 1106, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },              // trainer palm, puppy gives the right paw
  { id: 'setup', a: w.grab, b: w.hold - 1, light: 'day' },        // glide from the treat jar to the mat, check on "quiet room"
  { id: 'fist', a: w.hold, b: w.the - 1, light: 'day' },          // POV: treat pinched, then a closed fist on the dog's right side; wait
  { id: 'lift', a: w.the, b: w.next - 1, light: 'day' },          // the right paw lifts to the fist, reward
  { id: 'palm', a: w.next, b: w.reward2 - 1, light: 'day' },      // open palm offered to the right
  { id: 'touch', a: w.reward2, b: w.now - 1, light: 'day' },      // paw touches the palm, reward
  { id: 'cue', a: w.now, b: w.once - 1, light: 'day' },           // say "right paw" (bubble), then offer the hand
  { id: 'both', a: w.once, b: w.if - 1, light: 'day' },           // left and right, random order (front)
  { id: 'wrong', a: w.if, b: w.dont - 1, light: 'day' },          // MISTAKE: palm on the right, the dog offers the LEFT paw (red cross), guessing
  { id: 'noReward', a: w.dont, b: w.reset - 1, light: 'day' },    // fist withdrawn, no reward (red cross)
  { id: 'fix', a: w.reset, b: w.say2 - 1, light: 'day' },         // reset, reward only the correct (right) paw: check
  { id: 'yes', a: w.say2, b: w.then - 1, light: 'golden' },       // trainer: "yes" + click
  { id: 'final', a: w.then, b: TOTAL - 1, light: 'golden' },      // POV: paw on the palm, reward, confetti
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
const R = (f, a, b) => sm(ramp(f, a, b));                                        // smooth 0..1
const hump = (f, a, b, c, d, h) => h * R(f, a, b) * (1 - R(f, c, d));              // up a..b, hold, down c..d

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
const HOOKP = [0, MAT, -0.48];                          // hook: puppy close to the trainer's card plane
const SH = (P) => [P[0], P[1], P[2] + HOOKP[2]];   // shift a point into the hook position
let CUR = [0, 1, 3], TCUR = TRN;
const axisOf = (pos) => { const ry = Math.atan2(CUR[0] - pos[0], CUR[2] - pos[2]); return [Math.cos(ry), 0, -Math.sin(ry)]; };
/** world point -> trainer design point along the camera ray (flipped card) */
const tD = (P) => {
  const C = CUR, TR0 = TCUR, ax = axisOf(TR0), n = [-ax[2], 0, ax[0]];
  const d = [P[0] - C[0], P[1] - C[1], P[2] - C[2]], den = d[0] * n[0] + d[2] * n[2] || 1e-6;
  const s = ((TR0[0] - C[0]) * n[0] + (TR0[2] - C[2]) * n[2]) / den, Q = [C[0] + d[0] * s, C[1] + d[1] * s, C[2] + d[2] * s];
  return [300 - ((Q[0] - TR0[0]) * ax[0] + (Q[2] - TR0[2]) * ax[2]) / (K * ST), 975 - (Q[1] - TR0[1]) / (K * ST)];
};

// ---------- reference points from the real rig (filled in by calibrate() once the GLB is loaded) ----------
const REF = {};
export const calibrate = (poseFn, root) => {
  root.position.set(...DOGPOS); root.rotation.set(0, DOGYAW, 0); root.updateMatrixWorld(true);
  const far = [3, 0.3, 0];
  REF.sit = poseFn({ w: { sit: 1 }, look: far });
  const lv = [0, 0.25, 0.5, 0.75, 1];   // paw ball positions along the sit -> shakeR / shake blend
  REF.pR = lv.map((r) => poseFn({ w: { sit: 1 - r, shakeR: r }, look: far }).bR);
  REF.pL = lv.map((r) => poseFn({ w: { sit: 1 - r, shake: r }, look: far }).bL);
  root.position.set(...DOGPOS);
};
const NOSE = () => REF.sit.nose;
const pawAt = (P, r) => { const x = clamp(r, 0, 1) * 4, i = Math.min(3, Math.floor(x)), t = x - i; return lerp3(P[i], P[i + 1], t); };
const PAWR = (r) => pawAt(REF.pR, r), PAWL = (r) => pawAt(REF.pL, r);
const MOUTH = () => add(NOSE(), [0.12, -0.08, 0.06]);                    // treat delivered at the sitting puppy's mouth
const HEAD = () => add(REF.sit.head, [0.07, 0.1, 0]);                 // hearts anchor above the head
// a hand waiting / leaving: low on the mat just in front of the camera, below the bottom of the frame (same sideways offset as P)
const BELOW = (f, P) => { const c = camAt(f), fw = [c.look[0] - c.pos[0], c.look[2] - c.pos[2]], n = Math.hypot(fw[0], fw[1]), F = [fw[0] / n, fw[1] / n], R3 = [-F[1], F[0]];
  const lat = (P[0] - c.pos[0]) * R3[0] + (P[2] - c.pos[2]) * R3[1];
  return [c.pos[0] + F[0] * 0.5 + R3[0] * lat, 0.1, c.pos[2] + F[1] * 0.5 + R3[1] * lat]; };
const CT = () => { const p = PAWR(0.72); return [p[0] + 0.065, p[1] + 0.03, 0.1]; };   // the right-paw contact point (fist / palm held here)
const WC = () => [0.36, 0.27, 0.17];                                  // the hand held out to the dog's right (front cameras)
const CTL = () => { const p = PAWL(0.72); return [p[0] + 0.065, p[1] + 0.03, -0.1]; };

// ---------- paw raise: [right, left] 0..1 (0 sit, 1 shake) ----------
const raiseAt = (f) => {
  switch (shotAt(f).id) {
    case 'hook': return [0.72 * R(f, w.right1 - 8, w.paw1 + 8), 0];
    case 'fist': return [0.13 * Math.sin(Math.PI * ramp(f, w.wait + 8, w.the - 2)), 0];                // a hopeful twitch while it waits
    case 'lift': return [0.72 * R(f, w.right2 - 4, w.lifts + 8) * (1 - R(f, w.reward1 + 12, w.reward1 + 34)), 0];
    case 'palm': return [0.3 * R(f, w.right3 + 6, w.reward2 - 1), 0];
    case 'touch': return [(0.3 + 0.42 * R(f, w.reward2 + 4, w.touches - 1)) * (1 - R(f, w.touches + 8, w.touches + 28)), 0];
    case 'cue': return [0.72 * R(f, w.offer2 + 8, w.hand + 8) * (1 - R(f, w.once - 14, w.once - 2)), 0];
    case 'both': return bothAt(f);
    case 'wrong': return [hump(f, w.guess + 3, w.guess + 11, w.guess + 15, w.guess + 22, 0.42), hump(f, w.wrong - 14, w.wrong - 2, w.they - 6, w.they + 6, 0.72) + hump(f, w.guess + 14, w.guess + 22, w.dont, w.dont + 1, 0.5)];
    case 'noReward': return [0, 0.5 * (1 - R(f, w.dont + 16, w.reset - 6))];
    case 'fix': return [hump(f, w.correct - 12, w.paw6 - 1, w.paw6 + 10, w.paw6 + 30, 0.72), 0];
    case 'final': return [0, 0];
  }
  return [0, 0];
};
const bothAt = (f) => {
  const o = w.once;
  const Rr = hump(f, o + 4, o + 16, o + 24, o + 34, 0.72) + hump(f, w.right5 - 10, w.right5 + 4, w.right5 + 14, w.right5 + 26, 0.72) + hump(f, w.order + 4, w.order + 16, w.if, w.if + 1, 0.72);
  const Ll = hump(f, o + 34, o + 44, o + 52, o + 60, 0.72) + hump(f, w.left1 - 10, w.left1 + 4, w.left1 + 14, w.left1 + 26, 0.72) + hump(f, w.random - 6, w.random + 6, w.random + 18, w.random + 28, 0.72);
  return [Rr, Ll];
};

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f), [rR, rL] = raiseAt(f), tot = rR + rL, kk = tot > 1 ? 1 / tot : 1;
  const flick = Math.max(0, Math.sin(f * 0.11 + 1)) ** 12;   // an ear flick every ~2 s
  const base = { pos: [0.004 * Math.sin(f * 0.037), MAT, 0.004 * Math.sin(f * 0.029 + 1)], yaw: DOGYAW + 0.035 * Math.sin(f * 0.043), ears: -0.25 * flick, w: { sit: 1 - tot * kk, shakeR: rR * kk, shake: rL * kk }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0,
    breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 1 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const lookC = (P, dy = 0) => [P[0], Math.min(P[1] + dy, 0.34), P[2]];
  switch (S.id) {
    case 'hook': {
      return { ...base, pos: HOOKP, look: [0.5, 0.66, TRN[2]], ...(f > w.paw1 ? happy : { wag: 0.5 * Math.sin(f * 0.4) }), ears: f > 12 ? -0.3 : 0 };
    }
    case 'setup': {
      return { ...base, look: [1.6, 0.12 + 0.03 * Math.sin(f * 0.05), 0.3], headTilt: 10 * Math.sin(Math.PI * ramp(f, w.quiet - 4, w.quiet + 36)), wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    }
    case 'fist': {
      const sn = 0.02 * Math.sin(f * 0.17);   // sniffing the fist
      return { ...base, look: lookC(CT(), 0.03 + sn), wag: 0.7 * Math.sin(f * 0.3), ears: -0.25 + 0.3 * Math.sin(f * 0.07), neck: 0.8 + 0.2 * Math.sin(f * 0.05), headTilt: 6 * Math.sin(f * 0.045) + (f > w.wait ? 6 * Math.sin(Math.PI * ramp(f, w.wait, w.the)) : 0) };
    }
    case 'lift': {
      const ch = chompAt(f, w.reward1 + 10);
      return { ...base, look: W.treat ? lookC(W.treat, 0.02) : lookC(CT(), 0.03), jaw: f >= w.reward1 + 24 ? 0.3 : ch, ...(f > w.reward1 + 10 ? happy : { wag: 0.8 * Math.sin(f * 0.5) }), blink: f > w.reward1 + 10 && f < w.reward1 + 16 ? 1 : base.blink };
    }
    case 'palm': {
      return { ...base, look: lookC(CT(), 0.03), wag: 0.6 * Math.sin(f * 0.35), ears: -0.3, headTilt: 7 * Math.sin(Math.PI * ramp(f, w.next + 8, w.reward2 - 2)) };
    }
    case 'touch': {
      const ch = chompAt(f, w.touches + 15);
      return { ...base, look: W.treat ? lookC(W.treat, 0.02) : lookC(CT(), 0.03), jaw: f >= w.touches + 29 ? 0.3 : ch, ...(f > w.touches + 15 ? happy : { wag: 0.7 * Math.sin(f * 0.5) }), blink: f > w.touches + 15 && f < w.touches + 21 ? 1 : base.blink };
    }
    case 'cue': {
      const perk = f >= w.right4 - 4 && f < w.right4 + 22 ? -0.7 * Math.sin(Math.PI * ramp(f, w.right4 - 4, w.right4 + 22)) : 0;
      return { ...base, look: f < w.offer2 ? [1.0, 0.2, 0.2 + 0.7 * Math.sin(Math.PI * ramp(f, w.right4 - 4, w.before)) + 0.15 * Math.sin(f * 0.05)] : lookC(CT(), 0.03), ears: perk - 0.2, headTilt: f >= w.right4 && f < w.before ? 8 * Math.sin(Math.PI * ramp(f, w.right4, w.before)) : 0, wag: 0.5 * Math.sin(f * 0.4) };
    }
    case 'both': {
      return { ...base, look: [0.9, 0.22, 0.6 * (rR - rL) + 0.2 * Math.sin(f * 0.05)], neck: 0.6, wag: 0.8 * Math.sin(f * 0.6), tail: 0.25, ears: -0.1 };
    }
    case 'wrong': {
      return { ...base, look: lookC(WC(), 0.03), headTilt: f > w.wrong - 6 ? 8 * Math.sin(f * 0.09) : 0, ears: f > w.wrong ? -0.35 : -0.2, wag: 0.3 * Math.sin(f * 0.3), tail: 0.05 };
    }
    case 'noReward': {
      return { ...base, look: lookC(WC(), 0.03), headTilt: 8 * Math.sin(Math.PI * ramp(f, w.dont + 6, w.reset)), ears: -0.45, wag: 0.1 * Math.sin(f * 0.2), tail: 0.0 };
    }
    case 'fix': {
      const ch = chompAt(f, w.paw6 + 12);
      return { ...base, look: W.treat ? lookC(W.treat, 0.02) : lookC(CT(), 0.03), jaw: f >= w.paw6 + 26 ? 0.3 : ch, ...(f > w.paw6 + 12 ? happy : { wag: 0.5 * Math.sin(f * 0.4) }), blink: f > w.paw6 + 12 && f < w.paw6 + 18 ? 1 : base.blink };
    }
    case 'yes': {
      return { ...base, look: [TRN[0] + 0.05, 0.5, TRN[2] + 0.2], wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    }
    case 'final': {
      const t0 = w.reward5 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, look: W.treat ? lookC(W.treat, 0.02) : lookC(CT(), 0.03), jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: POV hands + biscuit ----------
// treatPath = where the biscuit is (null = none). Rigs: hand = trainer's right hand (arm from the lower right), hand2 = left hand (arm from the lower left).
const EAT = { lift: w.reward1 + 10, touch: w.touches + 15, fix: w.paw6 + 12, final: w.reward5 + 2 };
const treatPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'fist': return f < w.closed + 2 ? CT() : null;   // pinched at first, then hidden inside the fist
    case 'touch': return KF(f, [[w.touches + 2, BELOW(w.touches + 2, MOUTH())], [w.touches + 13, MOUTH()], [w.touches + 26, MOUTH()], [w.touches + 36, BELOW(w.touches + 36, MOUTH())]]);
    case 'fix': return KF(f, [[w.paw6 + 3, BELOW(w.paw6 + 3, MOUTH())], [w.paw6 + 11, MOUTH()], [w.paw6 + 24, MOUTH()], [w.paw6 + 34, BELOW(w.paw6 + 34, MOUTH())]]);
  }
  return null;
};
const HANDSHOTS = ['fist', 'lift', 'palm', 'touch', 'cue', 'wrong', 'noReward', 'fix', 'final'];
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  let t = treatPath(f);
  if (t) W.treat = t;
  const hs = HANDSHOTS.includes(S.id);
  const C = CT(), fistK = sm(ramp(f, w.closed - 6, w.closed + 8));
  // right-side offering hand: right rig from the side cameras, left rig (screen-left arm) from the front cameras
  const offer = (at0, pose, extra = {}) => ({ at: [at0[0], at0[1] + 0.006 * Math.sin(f * 0.13), at0[2]], pose, mode: pose === 'five' ? 'up' : 'reach', face: add(CT(), [-0.2, 0, 0]), tilt: 0.12, side: 0.3, ...extra });
  const FISTO = { palm: [0.05, -0.75, -0.6], fingers: [-1, 0.25, -0.1] };           // fist / pinch seen from the side cameras (back of the hand to the camera)
  const FISTF = { palm: [-1, -0.3, 0], fingers: [0, 0.35, -1] };                 // ... and from the front cameras
  switch (S.id) {
    case 'hook': W.handT = SH(add(PAWR(0.72), [0.07, 0.03, 0])); break;
    case 'fist': W.hand = offer(add(KF(f, [[w.hold, BELOW(w.hold, C)], [w.hold + 14, C], [w.the - 1, C]]), [0.012 * Math.sin(f * 0.09) * sm(ramp(f, w.hold + 14, w.hold + 24)), 0.01 * Math.sin(f * 0.07), 0.01 * Math.sin(f * 0.05)]), { a: 'pinch', b: 'fist', k: fistK }, { mode: 'reach', ...FISTO }); break;
    case 'lift': { const k = R(f, w.reward1 - 2, w.reward1 + 5), at = KF(f, [[w.reward1 - 3, C], [w.reward1 + 7, MOUTH()], [w.reward1 + 14, MOUTH()], [w.reward1 + 30, BELOW(w.reward1 + 30, C)]]);
      W.hand = offer(at, { a: 'fist', b: 'pinch', k }, { mode: 'reach', ...FISTO }); if (k > 0.5) W.treat = add(at, [-0.03, 0.01, 0]); break; }
    case 'palm': W.hand = offer(KF(f, [[w.offer1 - 4, BELOW(w.offer1 - 4, C)], [w.palm + 2, C]]), 'five'); break;
    case 'touch': W.hand = offer(KF(f, [[w.touches + 3, C], [w.touches + 11, BELOW(w.touches + 11, C)]]), 'five'); break;
    case 'cue': W.hand = offer(KF(f, [[w.offer2 - 2, BELOW(w.offer2 - 2, C)], [w.hand - 6, C], [w.once - 16, C], [w.once - 4, BELOW(w.once - 4, C)]]), 'five'); break;
    case 'wrong': W.hand = offer(WC(), 'five', { side: -0.6, palm: [-0.5, 0, -0.85], fingers: [0, 1, 0.1] }); break;
    case 'noReward': W.hand = offer(KF(f, [[w.dont, WC()], [w.dont + 8, WC()], [w.reset - 8, BELOW(w.reset - 8, WC())]]), 'fist', { mode: 'reach', side: -0.6, ...FISTF }); break;
    case 'fix': W.hand = offer(KF(f, [[w.reset + 4, BELOW(w.reset + 4, C)], [w.reset + 20, C], [w.paw6 + 3, C], [w.paw6 + 10, BELOW(w.paw6 + 10, C)]]), 'five'); break;
    case 'final': { const at = KF(f, [[w.then, BELOW(w.then, MOUTH())], [w.reward5 + 1, MOUTH()]]); W.hand = offer(at, 'pinch', { mode: 'reach', ...FISTO }); W.treat = add(at, [-0.03, 0.01, 0]); break; }
  }
  const WIN = { fist: [w.hold + 1, 9999], lift: [0, w.reward1 + 29], palm: [w.offer1 - 3, 9999], touch: [0, w.touches + 10], cue: [w.offer2 - 1, w.once - 5], noReward: [0, w.reset - 9], fix: [w.reset + 5, w.paw6 + 9], final: [w.then + 1, 9999] };
  const wn = WIN[S.id]; if (wn && (f < wn[0] || f > wn[1])) W.hand = null;
  const TW = { touch: [w.touches + 3, w.touches + 35], fix: [w.paw6 + 4, w.paw6 + 33] }[S.id];
  if (TW && (f < TW[0] || f > TW[1])) { delete W.treat; t = null; }
  if (t && (S.id === 'touch' || S.id === 'fix')) W.hand2 = { at: t, pose: 'pinch', side: 0.26 };
  if (EAT[S.id] && f >= EAT[S.id]) W.treatHide = true;
  if (S.id === 'fist' && f >= w.closed + 2) W.treatHide = true;
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
  const o = { hose: true, kneel: 1, expr: f > 30 ? 'grin' : 'smile', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: f > 40 ? -0.2 : 0.8, headTilt: hi.headTilt, near: { to: [270, 806], hand: 'fist', bend: -1 } };
  if (W.handT) {
    const T = tD(add(W.handT, [0, 0.006 * Math.sin(f * 0.15), 0])), S = trainerShoulder(o, 'far'), ang = Math.atan2(T[1] - S[1], T[0] - S[0]);
    const off = [25, -3], s = 2.08 * 1.05, sy = Math.cos(ang) < 0 ? -1 : 1;
    const Wr = [T[0] - (Math.cos(ang) * off[0] * s - Math.sin(ang) * off[1] * sy * s), T[1] - (Math.sin(ang) * off[0] * s + Math.cos(ang) * off[1] * sy * s)];
    o.far = { to: Wr, hand: 'palm', bend: 1, rot: ang * 180 / Math.PI }; o.lean = 10;
  } else o.far = 'present';
  return o;
};

// ---------- cameras ----------
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  // from the treat jar on the stool down to the puppy sitting on the mat
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.quiet - 8, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },   // jar ... hard cut ...
    { f: w.quiet - 7, pos: [1.22, 0.52, 1.0], look: [0.04, 0.2, 0.0], fov: 38 }, { f: w.hold - 1, pos: [1.1, 0.47, 0.9], look: [0.04, 0.19, 0.0], fov: 38 }],   // ... to the puppy on the mat
  // POV from the dog's right side (3/4 front): the right paw reaches toward the hand on screen right
  fist: [{ f: w.hold, pos: [1.1, 0.74, 0.9], look: [0.27, 0.32, 0.05], fov: 43 }, { f: w.the - 1, pos: [1.02, 0.71, 0.84], look: [0.27, 0.32, 0.05], fov: 43 }],
  lift: [{ f: w.the, pos: [1.12, 0.67, 0.88], look: [0.24, 0.36, 0.04], fov: 42 }, { f: w.next - 1, pos: [1.08, 0.65, 0.84], look: [0.25, 0.36, 0.04], fov: 42 }],
  palm: [{ f: w.next, pos: [1.24, 0.79, 0.84], look: [0.23, 0.35, 0.04], fov: 44 }, { f: w.reward2 - 1, pos: [1.19, 0.76, 0.8], look: [0.24, 0.35, 0.04], fov: 44 }],
  touch: [{ f: w.reward2, pos: [1.12, 0.67, 0.9], look: [0.24, 0.36, 0.04], fov: 42 }, { f: w.now - 1, pos: [1.08, 0.65, 0.86], look: [0.25, 0.36, 0.04], fov: 42 }],
  cue: [{ f: w.now, pos: [1.24, 0.83, 0.84], look: [0.21, 0.38, 0.02], fov: 44 }, { f: w.once - 1, pos: [1.18, 0.8, 0.8], look: [0.22, 0.38, 0.02], fov: 44 }],
  // front, so the left and right paws read on screen right / screen left
  both: [{ f: w.once, pos: [1.34, 0.86, 0.4], look: [0.2, 0.5, 0.0], fov: 46 }, { f: w.if - 1, pos: [1.28, 0.83, 0.38], look: [0.2, 0.5, 0.0], fov: 46 }],
  wrong: [{ f: w.if, pos: [1.34, 0.86, 0.4], look: [0.2, 0.5, 0.0], fov: 46 }, { f: w.dont - 1, pos: [1.28, 0.83, 0.38], look: [0.2, 0.5, 0.0], fov: 46 }],
  noReward: [{ f: w.dont, pos: [1.3, 0.85, 0.4], look: [0.2, 0.5, 0.0], fov: 46 }, { f: w.reset - 1, pos: [1.26, 0.82, 0.38], look: [0.2, 0.5, 0.0], fov: 46 }],
  fix: [{ f: w.reset, pos: [1.12, 0.69, 0.9], look: [0.24, 0.36, 0.04], fov: 42 }, { f: w.say2 - 1, pos: [1.08, 0.66, 0.86], look: [0.25, 0.36, 0.04], fov: 42 }],
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  final: [{ f: w.then, pos: [1.12, 0.69, 0.9], look: [0.24, 0.36, 0.04], fov: 42 }, { f: TOTAL - 1, pos: [1.08, 0.66, 0.86], look: [0.25, 0.36, 0.04], fov: 42 }],
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (HANDSHOTS.includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), head = REF.sit ? REF.sit.head : [0.3, 0.3, 0];
  if (S.id === 'hook' || S.id === 'yes') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'both') return { focus: dist(C.pos, [0.15, 0.25, 0]), cinf: 5 };
  return { focus: dist(C.pos, [0.2, 0.28, 0.05]), cinf: 5 };
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
const BUB_LR = [0.12, 0.56, -0.04], BUB_CUE = [0.3, 0.6, 0.08], BUB_YES = [-0.12, 0.78, -0.45];   // bubble anchor points (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const spark = (t0, at, sc) => { if (f >= t0 && f < t0 + 14) { const k = q(ramp(f, t0, t0 + 14), 2); out.push(FX('sp' + k, (p) => T.fxSpark2(p, k), at, sc, { order: 7 })); } };
  if (S.id === 'hook') { hearts(w.paw1 + 4, SH(add(HEAD(), [-0.08, -0.1, 0])), 3, 0.07); spark(w.paw1 + 2, SH(add(PAWR(0.72), [0.07, 0.07, 0.04])), 0.1); }
  if (S.id === 'setup') badge(T.fxCheck, 'ok', w.quiet + 6, w.hold, [0.5, 0.1, 0.5], 0.11);
  if (S.id === 'lift') { spark(w.lifts + 2, add(CT(), [0.1, 0.12, 0.0]), 0.1); hearts(w.reward1 + 11, HEAD()); }
  if (S.id === 'touch') { spark(w.touches - 2, add(CT(), [0.1, 0.12, 0.0]), 0.1); hearts(w.touches + 16, HEAD()); }
  if (S.id === 'cue') spark(w.hand + 10, add(CT(), [0.1, 0.12, 0.0]), 0.1);
  // cue bubbles (James's look): pop in above the head on the spoken cue / the marker
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'cue') bubble('bd', 'Right paw!', '', '#ffffff', w.right4 - 2, w.before + 14, BUB_CUE, 0.2);
  if (S.id === 'both') { bubble('bl', 'Left!', '', '#ffffff', w.left1 - 2, w.right5 - 6, BUB_LR, 0.2); bubble('br', 'Right!', '', '#ffffff', w.right5 - 2, w.random - 6, BUB_LR, 0.2); }
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'wrong') badge(T.fxCross, 'no', w.wrong - 3, w.they + 2, [0.1, 0.5, -0.2], 0.2);
  if (S.id === 'noReward') badge(T.fxCross, 'no2', w.dont - 2, w.reset - 4, [0.1, 0.5, -0.2], 0.2);
  if (S.id === 'fix') { spark(w.paw6 - 2, add(CT(), [0.1, 0.12, 0.0]), 0.1); hearts(w.paw6 + 13, HEAD()); badge(T.fxCheck, 'ok', w.correct - 2, w.say2 - 6, [0.38, 0.5, 0.08], 0.14); }
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'final') {
    hearts(w.reward5 + 3, HEAD(), 4, 0.06);
    if (f >= w.reward5) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward5 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE(), [0.05, 0.1, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
