// "Relax" — settle onto one hip on a cue. 3D puppy (dog-puppy.glb) + the 2D bald trainer, 1051 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3 = ElevenLabs "Holden", voice.mp3.words.json, round(s*30)): Let's 0 teach 8 dog 17 relax 31 cue 51 |
// Grab 84 treats 90 soft 112 mat 119 | Pick 148 calm 160 walk 200 | Ask 229 down 243 mat 265 |
// Slowly 294 treat 317 nose 337 back 350 toward 363 shoulder 378 | When 408 dog 412 rolls 418 onto 427 one 436 hip 444 reward 464 |
// Then 495 give 497 treat 505 every 512 seconds 530 stay 556 settled 562 | Now 593 say 607 relax 614 softly 624 sink 676 down 680 |
// If 713 dog 717 pops 722 up 729 | the 752 treat 753 too 766 high 774 fast 802 | Keep 836 low 846 slow 868 | Never 901 scared 940 |
// Say 968 yes 974 or 985 click 1000 | then 1027 reward 1030 | end 1050.
// Whisper glitches fixed from silence_end (sentence starts): Grab 84, Ask 229, Slowly 294, When 408, Then 495, Now 593, If 713, Keep 836, then 1027.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and
// action is keyed to `w` (+/- a few frames), so nothing else needs to change. Pointers: HAND in POV shots, PAW cursor in floating/overhead shots.
// Hard cuts only, no flashes. Puppy at the origin, nose toward +x. On the hip it lies on its RIGHT hip (legs toward +z).
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1051, DECK = 0;
// key word frames (first frame of the word)
const w = {
  relax1: 31, grab: 84, soft: 112, mat1: 119, pick: 148, walk: 200, ask: 229, down1: 243, mat2: 265, slowly: 294, treat1: 317, nose: 337, back: 350, shoulder: 378,
  when: 408, rolls: 418, hip: 444, reward1: 464, then1: 495, every: 512, stay: 556, now: 593, say1: 607, relax2: 614, softly: 624, sink: 676,
  if: 713, pops: 722, up: 729, treat2: 753, high: 774, fast: 802, keep: 836, low: 846, slow: 868, never: 901, scared: 940,
  say2: 968, yes: 974, click: 1000, then2: 1027, reward2: 1030, end: TOTAL - 1,
};
const H1 = 36;                       // hook: the chomp frame (just after "relax")
const T1 = w.then1 + 14, T2 = T1 + 44;   // povStay: the two treats (needs ~1.5 s between them)
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },              // trainer lures a down, chomp, the puppy settles onto a hip
  { id: 'setup', a: w.grab, b: w.ask - 1, light: 'day' },         // treat jar, hard cut to the puppy on the soft mat, check on "mat"
  { id: 'povDown', a: w.ask, b: w.slowly - 1, light: 'day' },     // POV hand: stand -> down on the mat
  { id: 'lure', a: w.slowly, b: w.when - 1, light: 'day' },         // floating 3/4, paw cursor: nose -> back toward its right shoulder (head curls round)
  { id: 'overHip', a: w.when, b: w.then1 - 1, light: 'day' },     // overhead push-in, paw cursor + ground rings: rolls onto one hip, reward
  { id: 'povStay', a: w.then1, b: w.now - 1, light: 'day' },      // POV: two treats delivered while it stays settled
  { id: 'calm', a: w.now, b: w.if - 1, light: 'day' },            // low orbit: "Relax" said softly, the puppy sinks down
  { id: 'popUp', a: w.if, b: w.keep - 1, light: 'day' },          // MISTAKE: treat too high / fast (red), puppy pops up, cross
  { id: 'fix', a: w.keep, b: w.never - 1, light: 'day' },         // low and slow (green), stays settled, check
  { id: 'scared', a: w.never, b: w.say2 - 1, light: 'day' },      // ground level, hands off: relaxed, never when scared
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
const MAT = 0.064, K = 0.00225, ST = 1.08;
const DOGPOS = [0, MAT, 0], DOGYAW = Math.PI / 2;      // puppy on the mat, nose toward +x
const TRN = [0.52, MAT, -0.66];
const HOOKP = [0.07, MAT, -0.48];                          // hook: puppy close to the trainer's card plane, so his hand stays visible down at the floor
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
  REF.down = poseFn({ w: { down: 1 }, look: far });
  REF.hip = poseFn({ w: { hip: 1 }, look: far });
  REF.stand = poseFn({ w: { stand: 1 }, look: far });
  root.position.set(...DOGPOS);
};
const NOSE = (r) => REF[r].nose;
// lure waypoints: just in front of the nose, straight down to the floor, then the reward spot in front of the down puppy
const N_SIT = () => add(NOSE('sit'), [0.06, -0.005, 0]);
const N_STAND = () => add(NOSE('stand'), [0.06, -0.005, 0]);
const N_DOWN = () => add(NOSE('down'), [0.06, -0.005, 0]);
const N_HIP = () => add(NOSE('hip'), [0.06, -0.005, 0]);
const LOW = () => [NOSE('sit')[0] + 0.06, MAT + 0.05, 0];            // straight below the sitting nose
const FLOOR = () => [NOSE('down')[0] + 0.045, MAT + 0.05, 0];      // reward spot: low, right at the down puppy's mouth
const REWARD = () => [NOSE('down')[0] + 0.06, NOSE('down')[1] - 0.09, 0];   // reward spot the down puppy can reach (just below its nose)
const REWARD_H = () => add(NOSE('hip'), [0.06, -0.09, 0]);          // same for the hip-settled puppy
const MOUTH_H = () => add(NOSE('hip'), [0.085, -0.025, 0]);           // delivered at the mouth while it stays settled
const SHOULDER = () => add(REF.down.chest, [0.0, 0.06, 0.1]);       // its right shoulder (world +z, our side): it settles onto that hip

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { down: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const hip = { w: { hip: 1 } };
  switch (S.id) {
    case 'hook': {
      const dn = sm(ramp(f, H1 - 25, H1 - 5)), ch = chompAt(f, H1 + 1), hp = M.back(ramp(f, H1 + 14, H1 + 40), 1.1);
      return { ...base, pos: HOOKP, w: { sit: 1 - dn, down: dn * (1 - clamp(hp)), hip: dn * clamp(hp) }, look: W.treat || SH(add(FLOOR(), [0.1, 0.12, 0])), neck: 1, jaw: f >= H1 + 15 ? 0.3 : ch,
        ...(f > H1 - 3 ? happy : {}), ears: f > 12 && f < H1 - 7 ? -0.4 : 0, blink: f > H1 + 1 && f < H1 + 7 ? 1 : f > H1 + 36 ? 0.5 + 0.2 * Math.sin(f * 0.1) : base.blink };
    }
    case 'setup': {   // stands on the mat after a walk: calm, a slow look around
      return { ...base, w: { stand: 1 }, yaw: DOGYAW + 0.06 * Math.sin(f * 0.03), look: [0.9, -0.02 + 0.04 * Math.sin(f * 0.07), 0.45 + 0.7 * Math.sin(f * 0.045)], neck: 0.85, headTilt: 10 * Math.sin(Math.PI * ramp(f, w.mat1 + 4, w.mat1 + 40)) + 7 * Math.sin(Math.PI * ramp(f, w.pick + 30, w.walk + 25)),
        wag: 0.5 * Math.sin(f * 0.35), tail: 0.2, ears: -0.2 + 0.25 * Math.sin(f * 0.09) };
    }
    case 'povDown': {
      const dn = sm(ramp(f, w.down1 + 1, w.mat2 - 2)), ch = chompAt(f, w.mat2 + 3);
      return { ...base, w: { stand: 1 - dn, down: dn }, look: W.treat || add(FLOOR(), [0.05, 0.08, 0]), neck: 1, jaw: f >= w.mat2 + 17 ? 0.3 : ch, ears: -0.3 * (1 - dn),
        ...(f > w.mat2 + 3 ? happy : {}), blink: f > w.mat2 + 3 && f < w.mat2 + 9 ? 1 : base.blink };
    }
    case 'lure': {   // down, head follows the treat back toward the shoulder
      return { ...base, w: { down: 1 }, look: W.treat, neck: 1, ears: -0.2 * sm(ramp(f, w.slowly, w.slowly + 20)), wag: 0.3 * Math.sin(f * 0.3) };
    }
    case 'overHip': {   // rolls onto one hip: overshoot-and-settle, then the reward
      const h = M.back(ramp(f, w.rolls + 2, w.hip + 4), 1.1), ch = chompAt(f, w.reward1);
      return { ...base, w: { down: 1 - clamp(h), hip: clamp(h) }, look: W.treat, neck: 1, jaw: f >= w.reward1 + 14 ? 0.3 : ch, ears: 0.2,
        ...(f > w.reward1 ? { wag: Math.sin(f * 0.6) * 0.9, tail: 0.3 } : { wag: 0.25 * Math.sin(f * 0.15) }), blink: f > w.reward1 && f < w.reward1 + 6 ? 1 : base.blink };
    }
    case 'povStay': {   // settled on the hip, two treats delivered at the mouth
      const ch = Math.max(chompAt(f, T1), chompAt(f, T2));
      return { ...base, ...hip, look: W.treatHide || !W.treat ? [0.9, 0.2, 0.3] : W.treat, neck: 0.8, jaw: ch, wag: 0.7 * Math.sin(f * 0.5), tail: 0.25,
        blink: (f > T1 && f < T1 + 5) || (f > T2 && f < T2 + 5) ? 1 : base.blink };
    }
    case 'calm': {   // "Relax" softly: lids heavy, head sinks, a sigh
      const sink = sm(ramp(f, w.softly + 10, w.sink + 30));
      const lid = f > w.say1 + 10 ? clamp(0.45 + 0.5 * sink + 0.12 * Math.sin(f * 0.07)) : blinkAt(f, 8) ? 1 : 0;
      return { ...base, ...hip, roll: -8 * sink, look: add(NOSE('hip'), [0.45, -0.3 - 0.06 * sink, 0.05 + 0.04 * Math.sin(f * 0.03)]), neck: 0.3 - 0.1 * sink, blink: lid, breath: 0.3 + 0.35 * Math.sin(f * 0.1), ears: 0.4 * (1 - sink) + 0.15 * Math.sin(f * 0.05), wag: 0.25 * Math.sin(f * 0.1) * (1 - sink) };
    }
    case 'popUp': {   // MISTAKE: the treat flicks up and the puppy pops up from the hip
      const up = M.smooth(M.smooth(ramp(f, w.pops - 10, w.up + 8)));
      return { ...base, w: { hip: 1 - up, stand: up }, look: W.treat ? [W.treat[0], Math.min(W.treat[1], 0.1 + 0.04 * up), W.treat[2]] : null, neck: 0.7, ears: -0.3 * up, tail: 0.4 * up,
        wag: up > 0.5 ? Math.sin(f * 0.8) : 0.2 * Math.sin(f * 0.3), pos: lerp3(DOGPOS, [0.03 + 0.02 * Math.sin(f * 0.05) * up, MAT, 0.015 * Math.sin(f * 0.07) * up], up), yaw: DOGYAW + 0.07 * Math.sin(f * 0.045) * up, blink: f >= w.up + 2 && f < w.up + 7 ? 1 : base.blink };
    }
    case 'fix': {   // low and slow: stays on its hip
      const ch = chompAt(f, w.slow + 8);
      return { ...base, ...hip, look: W.treat || add(NOSE('hip'), [0.45, -0.05, 0]), neck: 0.6, jaw: f >= w.slow + 22 ? 0.3 : ch,
        ...(f > w.slow + 8 ? happy : {}), ears: 0.15 * Math.sin(f * 0.07), blink: f > w.slow + 8 && f < w.slow + 14 ? 1 : base.blink };
    }
    case 'scared': {   // relaxed, hands off: sleepy blinks, slow breaths, an ear flick
      const lid = f > w.never + 10 && f < w.say2 - 8 ? 0.55 + 0.2 * Math.sin(f * 0.06) : blinkAt(f, 8) ? 1 : 0;
      return { ...base, ...hip, look: add(NOSE('hip'), [0.45, -0.2, 0.1 + 0.08 * Math.sin(f * 0.04)]), neck: 0.3, blink: lid, breath: 0.35 + 0.35 * Math.sin(f * 0.12), ears: 0.25 + 0.3 * Math.sin(f * 0.11), wag: 0.3 * Math.sin(f * 0.1) };
    }
    case 'yes': {
      return { ...base, ...hip, pos: [0.1, MAT, 0], look: [TRN[0] + 0.05, 0.5, TRN[2]], neck: 0.5, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0,
        jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    }
    case 'povFinal': {
      const t0 = w.reward2 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, ...hip, look: W.treatHide || !W.treat ? [0.9, 0.2, 0.3] : W.treat, neck: 0.8, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4,
        blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: hand / paw pointer + biscuit + trail + rings ----------
// treatPath = where the biscuit is (null = none)
const treatPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'hook': return SH(KF(f, [[0, add(N_SIT(), [0.06, 0.02, 0])], [8, N_SIT()], [H1 - 11, [LOW()[0], MAT + 0.07, 0]], [H1 - 3, [FLOOR()[0], MAT + 0.06, 0]], [H1 + 1, REWARD()]]));
    case 'povDown': return KF(f, [[w.ask, [0.75, 0.36, 0.25]], [w.down1 - 6, N_STAND()], [w.down1 - 1, N_STAND()], [w.down1 + 12, [N_STAND()[0] + 0.02, MAT + 0.06, 0]], [w.mat2 - 1, FLOOR()], [w.mat2 + 3, REWARD()], [w.mat2 + 14, REWARD()], [w.mat2 + 28, [0.95, 0.12, 0.45]]]);
    case 'lure': {
      const n = add(NOSE('down'), [0.035, -0.005, 0]);
      return KF(f, [[w.slowly, [0.5, 0.1, 0.25]], [w.treat1 - 2, n], [w.nose + 8, n], [w.back + 12, add(n, [-0.02, -0.1, 0.1])], [w.shoulder + 2, SHOULDER()], [w.when - 1, add(SHOULDER(), [-0.02, 0.01, -0.01])]]);
    }
    case 'overHip': {
      const sh = SHOULDER(), far = [sh[0] + 0.04, MAT + 0.12, sh[2] - 0.03], R = REWARD_H();
      return KF(f, [[w.when, sh], [w.hip - 10, far], [w.reward1 - 12, far], [w.reward1 - 2, R], [w.reward1 + 14, R]]);
    }
    case 'popUp': return KF(f, [[w.if, N_HIP()], [w.pops - 8, add(N_HIP(), [0.02, 0.01, 0.0])], [w.pops + 4, [0.46, 0.7, 0.04]], [w.up + 6, [0.48, 0.55, 0.02]], [w.treat2, [0.49, 0.53, 0.0]],
      [w.fast - 6, [0.49, 0.56, 0.0]], [w.fast, [0.38, 0.5, 0.08]], [w.fast + 6, [0.56, 0.58, -0.04]], [w.keep - 1, [0.46, 0.54, 0.02]]]);
    case 'fix': return KF(f, [[w.keep, [0.3, MAT + 0.12, -0.12]], [w.low, [0.29, MAT + 0.09, -0.09]], [w.slow - 6, add(NOSE('hip'), [0.1, 0.0, 0.0])], [w.slow + 6, REWARD_H()], [w.slow + 20, REWARD_H()]]);
    case 'povStay': {
      const START = [0.95, 0.12, 0.42];   // START is below the frame
      if (f < T1) return KF(f, [[w.then1, [0.7, 0.18, 0.32]], [T1 - 2, MOUTH_H()]]);
      if (f < T1 + 10) return MOUTH_H();                   // held at the mouth while it's eaten
      if (f < T2) return KF(f, [[T1 + 10, MOUTH_H()], [T1 + 20, START], [T2 - 14, START], [T2 - 2, MOUTH_H()]]);
      if (f < T2 + 10) return MOUTH_H();
      return KF(f, [[T2 + 10, MOUTH_H()], [T2 + 24, START]]);
    }
    case 'povFinal': return KF(f, [[w.then2, add(MOUTH_H(), [0.3, 0.14, 0.05])], [w.reward2 + 2, MOUTH_H()]]);   // hand lingers to the end
  }
  return null;
};
const EAT = { overHip: w.reward1 + 2, fix: w.slow + 10 };   // paw shots: frame the treat is eaten
const HANDSHOTS = ['povDown', 'povStay', 'povFinal'];
const PAWSHOTS = { lure: '#ff8fb0', overHip: '#ff8fb0', popUp: '#ff5a5a', fix: '#6fe08a' };
// POV shots have NO trail (a column of beads paints over the dog from a front camera); the overhead/side paw shots do, ending at the floor point.
const TRAIL = { hook: [8, treatPath], lure: [w.treat1 + 2, treatPath], overHip: [w.when + 4, treatPath], popUp: [w.if, treatPath], fix: [w.keep, treatPath] };
// the paw cursor leads ~8 cm ahead of the treat, away from the head (never over the muzzle)
const lead = (id, t, f) => {
  if (id === 'fix') return add(t, [0.1, 0.03, -0.02]);   // always ahead of / beside the nose, never a jump
  if (id !== 'lure' && id !== 'overHip') return t;
  const h = REF[id === 'lure' ? 'down' : 'hip'].head, d = [t[0] - h[0], t[1] - h[1] + 0.03, t[2] - h[2]], n = Math.hypot(...d) || 1;
  return add(t, d.map((v) => (v / n) * (id === 'overHip' ? 0.14 : id === 'lure' ? 0.01 + 0.17 * sm(ramp(f, w.back, w.shoulder)) : 0.12)));
};
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f);
  if (t) W.treat = t;
  const tr = TRAIL[S.id];
  if (tr && f > tr[0] && tr[1](f)) {
    const pts = []; let last = null;
    const stop = { hook: H1 - 9, overHip: w.reward1 - 12, fix: w.slow - 6 }[S.id] ?? f;   // trails end before the final lift to the mouth (it would paint over the dog)
    for (let g = tr[0]; g <= Math.min(f, stop); g += 0.5) { const p = tr[1](g); if (!p) break; if (!last || Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]) > 0.03) { pts.push(p); last = p; } }
    W.trail = pts.slice(0, -1);
  }
  if (t && HANDSHOTS.includes(S.id)) W.hand = { treat: t, side: S.id === 'povFinal' ? 0.22 : S.id === 'povStay' ? -0.25 : 0.16 };
  const ate = (t0, n) => f >= t0 && f < t0 + n;
  if ((S.id === 'hook' && f > H1 + 5) || (S.id === 'povDown' && f >= w.mat2 + 3) || (S.id === 'povStay' && (ate(T1, 18) || f >= T2)) || (S.id === 'povFinal' && f >= w.reward2 + 4) || (S.id === 'overHip' && f >= EAT.overHip) || (S.id === 'fix' && f >= EAT.fix)) W.treatHide = true;
  if (PAWSHOTS[S.id] || S.id === 'overHip') {
    W.trailCol = PAWSHOTS[S.id];
    if (t) { const k = sm(ramp(f, EAT[S.id] || 1e9, (EAT[S.id] || 1e9) + 16)); W.paw = { pos: W.treatHide ? add(lead(S.id, t, f), S.id === 'overHip' ? [0.05 * k, 0.1 * k, -0.6 * k] : [0.1 * k, 0.7 * k, 0]) : lead(S.id, t, f), s: 0.8 }; }   // after the chomp the paw flies out of frame (never sits on the face)
  }
  if (S.id === 'overHip' && f >= w.hip - 4) {   // pulsing ground rings on the hip it settles onto
    const h = REF.hip.hip, gp = [h[0], MAT + 0.006, h[2] + 0.04];
    W.rings = [0, 1].map((i) => { const u = ((f - (w.hip - 4)) / 26 + i * 0.5) % 1; return { p: gp, r: 0.1 + 0.2 * u, a: (1 - u) * 0.9 }; });
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
    const kind = f > H1 + 5 ? 'palm' : f >= H1 - 5 ? 'give' : 'treat', off = kind === 'give' ? [19, -12] : [25, -3], s = 2.08 * 1.05, sy = Math.cos(ang) < 0 ? -1 : 1;
    const Wr = [T[0] - (Math.cos(ang) * off[0] * s - Math.sin(ang) * off[1] * sy * s), T[1] - (Math.sin(ang) * off[0] * s + Math.cos(ang) * off[1] * sy * s)];
    o.far = { to: Wr, hand: kind, bend: 1, rot: ang * 180 / Math.PI }; o.lean = 10;
  } else o.far = 'present';
  return o;
};

// ---------- cameras ----------
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  // from the treat jar on the stool down to the puppy sitting on the mat
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.soft - 1, pos: [2.4, 0.9, 0.12], look: [1.85, 0.62, -0.75], fov: 40 },   // jar ... hard cut ...
    { f: w.soft, pos: [1.22, 0.52, 1.0], look: [0.04, 0.2, 0.0], fov: 38 }, { f: w.ask - 1, pos: [1.1, 0.47, 0.9], look: [0.04, 0.19, 0.0], fov: 38 }],   // ... to the puppy on the mat
  // POV = the trainer's eyes, kneeling in front of the puppy, looking down
  povDown: [{ f: w.ask, pos: [1.28, 0.88, 0.56], look: [0.2, 0.22, 0.0], fov: 42 }, { f: w.slowly - 1, pos: [1.22, 0.82, 0.53], look: [0.22, 0.16, 0.0], fov: 42 }],
  // floating 3/4 (the gold paw-cursor camera): the near (right) shoulder is on our side
  lure: [{ f: w.slowly, pos: [1.584, 0.746, 0.794], look: [0.12, 0.27, 0.05], fov: 42 }, { f: w.when - 1, pos: [1.509, 0.706, 0.758], look: [0.13, 0.23, 0.05], fov: 42 }],
  // overhead push-in (roll-over device)
  overHip: [{ f: w.when, pos: [-0.1, 2.0, 0.02], look: [0.16, 0.1, 0.0], fov: 42 }, { f: w.then1 - 1, pos: [-0.02, 1.55, 0.0], look: [0.16, 0.1, -0.03], fov: 42 }],
  povStay: [{ f: w.then1, pos: [1.699, 1.032, -0.805], look: [0.15, 0.19, 0.0], fov: 42 }, { f: w.now - 1, pos: [1.638, 0.997, -0.769], look: [0.15, 0.18, 0.0], fov: 42 }],
  calm: [{ f: w.now, pos: [2.21, 1.225, -1.725], look: [0.08, 0.1, 0.0], fov: 38 }, { f: w.if - 1, pos: [-0.34, 1.305, -2.55], look: [0.08, 0.09, 0.0], fov: 38, path: [[1.31, 1.275, -2.325]] }],
  // low side angle with sky so "too high" reads
  popUp: [{ f: w.if, pos: [0.84, 0.55, 1.75], look: [0.16, 0.36, 0.05], fov: 44 }, { f: w.keep - 1, pos: [0.78, 0.62, 1.85], look: [0.16, 0.42, 0.05], fov: 44 }],
  fix: [{ f: w.keep, pos: [1.429, 1.263, -2.093], look: [0.22, 0.1, 0.0], fov: 42 }, { f: w.never - 1, pos: [1.351, 1.216, -2.015], look: [0.22, 0.1, 0.0], fov: 42 }],
  scared: [{ f: w.never, pos: [-0.596, 1.062, -1.8], look: [-0.02, 0.09, 0.0], fov: 42 }, { f: w.say2 - 1, pos: [-0.476, 1.086, -1.8], look: [-0.02, 0.09, 0.0], fov: 42 }],
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then2 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  povFinal: [{ f: w.then2, pos: [1.34, 0.84, 0.72], look: [0.17, 0.2, 0.0], fov: 42 }, { f: TOTAL - 1, pos: [1.29, 0.81, 0.69], look: [0.18, 0.2, 0.0], fov: 42 }],
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (S.id.startsWith('pov')) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), head = REF.down ? REF.down.head : [0.3, 0.3, 0];
  if (S.id === 'hook' || S.id === 'yes') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'calm') return { focus: dist(C.pos, [0.1, 0.22, 0]), cinf: 9 };
  if (S.id === 'scared') return { focus: dist(C.pos, [0.12, 0.15, 0]), cinf: 4 };
  if (S.id === 'overHip') return { focus: dist(C.pos, [-0.1, 0.15, 0]), cinf: 4 };
  if (S.id === 'popUp') return { focus: dist(C.pos, [0.1, 0.3, 0]), cinf: 6 };
  if (S.id === 'lure') return { focus: dist(C.pos, [0.12, 0.15, 0]), cinf: 4 };
  if (S.id === 'fix') return { focus: dist(C.pos, [0.18, 0.12, 0]), cinf: 8 };
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
const BUB_CUE = [0.15, 0.3, 0.0], BUB_YES = [-0.12, 0.78, -0.45];   // bubble anchor points (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  // rewards: hearts pop off the puppy's head
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = add(NOSE('hip'), [-0.08, 0.06, 0]);
  if (S.id === 'hook') hearts(H1 + 1, [0.38, 0.36, -0.42], 3, 0.07);
  if (S.id === 'setup') badge(T.fxCheck, 'ok', w.mat1 + 6, w.pick + 20, [0.5, 0.1, 0.5], 0.11);
  if (S.id === 'povDown') hearts(w.mat2 + 4, add(NOSE('down'), [-0.08, 0.06, 0]));
  if (S.id === 'overHip') hearts(w.reward1 + 3, HEAD, 3, 0.05);
  // cue bubble (James's newer look): pops in on the spoken cue, said softly
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'calm') bubble('bd', 'Relax', 'softly', '#ffffff', w.relax2 - 2, w.softly + 34, BUB_CUE, 0.2);
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'popUp') badge(T.fxCross, 'no', w.high - 3, w.keep, [0.26, 0.6, 0.1], 0.17);
  if (S.id === 'fix') { hearts(w.slow + 9, HEAD); badge(T.fxCheck, 'ok', w.slow - 4, w.never, [0.0, 0.34, 0.12], 0.14); }
  if (S.id === 'calm' && f >= w.sink - 6 && f < w.sink + 24) { const t = q(ramp(f, w.sink - 6, w.sink + 24), 2); out.push(FX('si' + t, (p) => T.fxSigh(p, t), add(NOSE('hip'), [0.08, 0.02, 0.04]), 0.12)); }
  if (S.id === 'povStay') { hearts(T1 + 1, HEAD); hearts(T2 + 1, HEAD); }
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward2 + 3, HEAD, 4, 0.06);
    if (f >= w.reward2) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward2 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('hip'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
