// "Down II" — make the down reliable with a cue and a hand signal. 3D puppy (dog-puppy.glb) + the 2D bald trainer, 1296 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3 = ElevenLabs "Holden", voice.mp3.words.json, round(s*30)): Let's 0 teach 8 dog 17 rock 31 solid 40 down 55 |
// Grab 94 treats 104 non-slip 127 floor 142 | Lure 181 first 188 | Hold 225 treat 233 nose 245 slowly 265 lower 277 straight 301 floor 317 |
// Now 353 fade 356 lure 377 | Make 407 same 414 movement 422 empty 446 hand 455 | and 478 reward 482 other 502 hand 509 | Next 540 add 552 cue 562 |
// Say 591 down 596 once 606 | then 640 give 641 hand 653 signal 658 | Reward 690 moment 706 elbows 725 touch 732 floor 754 |
// Practice 785 stand 803 | not 824 just 830 sit 841 | If 866 (whisper says 848; silence says 866) dog 871 pops 877 back 886 up 897 |
// you 917 treated 919 too 935 late 944 or 956 too 962 high 962 | Treat 994 sooner 995 | and 1006 closer 1021 floor 1039 |
// Never 1070 push 1075 down 1095 | Deliver 1127 treats 1132 while 1143 dog 1157 stays 1165 down 1175 | Say 1211 yes 1215 | or 1226 click 1241 | then 1265 reward 1270 | end 1295.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and
// action is keyed to `w` (+/- a few frames), so nothing else needs to change. Pointers: HAND in POV shots, PAW cursor in floating shots.
// Hard cuts only, no flashes. Puppy at the origin, nose toward +x.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1296, DECK = 0;
// key word frames (first frame of the word)
const w = {
  down1: 55, grab: 94, nonslip: 127, floor1: 142, lure: 181, nose: 245, lower: 277, straight: 301, floor2: 317, now: 353, make: 407, empty: 446, hand1: 455,
  reward1: 482, other: 502, next: 540, say1: 591, down2: 596, then1: 640, signal: 658, reward2: 690, elbows: 725, floor3: 754,
  practice: 785, stand: 803, sit: 841, if: 866, pops: 877, up: 897, you: 917, high: 962, treat: 994, closer: 1021, floor4: 1039,
  never: 1070, deliver: 1127, stays: 1165, say2: 1211, yes: 1215, click: 1241, then2: 1265, reward3: 1270, end: TOTAL - 1,
};
const T2 = () => Math.max(w.stays + 2, w.deliver + 46);   // second treat in povStay (needs ~1.5 s after the first)
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },              // trainer lures a full down, chomp
  { id: 'setup', a: w.grab, b: w.lure - 1, light: 'day' },        // glide from the treat jar to the mat, check on "non-slip floor"
  { id: 'povLure', a: w.lure, b: w.now - 1, light: 'day' },       // POV hand: nose -> floor, sit -> down
  { id: 'povFade', a: w.now, b: w.next - 1, light: 'day' },       // POV: empty hand, same movement; other hand rewards
  { id: 'povCue', a: w.next, b: w.reward2 - 1, light: 'day' },    // POV: say "down" (sound rings), then the flat-palm signal
  { id: 'elbows', a: w.reward2, b: w.practice - 1, light: 'day' },// ground-level side: rings on the elbows, paw cursor rewards
  { id: 'stand', a: w.practice, b: w.if - 1, light: 'day' },      // floating: down from a stand (paw cursor)
  { id: 'popUp', a: w.if, b: w.treat - 1, light: 'day' },         // MISTAKE: treat late + high (red), puppy pops up, cross
  { id: 'fix', a: w.treat, b: w.never - 1, light: 'day' },        // treat sooner + low (green), stays down, check
  { id: 'calm', a: w.never, b: w.deliver - 1, light: 'day' },     // relaxed down, hands off (never push)
  { id: 'povStay', a: w.deliver, b: w.say2 - 1, light: 'day' },   // POV: two treats delivered while it stays down
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
const HOOKP = [0, MAT, -0.48];                          // hook: puppy close to the trainer's card plane, so his hand stays visible down at the floor
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
  REF.stand = poseFn({ w: { stand: 1 }, look: far });
  root.position.set(...DOGPOS);
};
const NOSE = (r) => REF[r].nose;
// lure waypoints: just in front of the nose, straight down to the floor, then the reward spot on the floor in front of the down puppy
const N_SIT = () => add(NOSE('sit'), [0.06, -0.005, 0]);
const N_STAND = () => add(NOSE('stand'), [0.06, -0.005, 0]);
const LOW = () => [NOSE('sit')[0] + 0.06, MAT + 0.05, 0];            // straight below the sitting nose
const FLOOR = () => [NOSE('down')[0] + 0.045, MAT + 0.05, 0];      // reward spot: low, right at the down puppy's mouth
const REWARD = () => [NOSE('down')[0] + 0.06, NOSE('down')[1] - 0.09, 0];   // reward spot the down puppy can reach (just below its nose)
const MOUTH = () => add(NOSE('down'), [0.05, -0.02, 0]);             // delivered at the mouth while it stays down

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { down: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  switch (S.id) {
    case 'hook': {
      const dn = sm(ramp(f, w.down1 - 25, w.down1 - 5)), ch = chompAt(f, w.down1 + 1);
      return { ...base, pos: HOOKP, w: { sit: 1 - dn, down: dn }, look: W.treat || SH(add(FLOOR(), [0.1, 0.12, 0])), neck: 1, jaw: f >= w.down1 + 15 ? 0.3 : ch,
        ...(f > w.down1 - 3 ? happy : {}), ears: f > 12 && f < w.down1 - 7 ? -0.4 : 0, blink: f > w.down1 + 1 && f < w.down1 + 7 ? 1 : base.blink };
    }
    case 'setup': {
      return { ...base, w: { sit: 1 }, look: [1.6, 0.12 + 0.03 * Math.sin(f * 0.05), 0.3], neck: 1, headTilt: 10 * Math.sin(Math.PI * ramp(f, 100, 140)), wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    }
    case 'povLure': {
      const dn = sm(ramp(f, w.lower + 3, w.floor2 - 3)), ch = chompAt(f, w.floor2 + 5);
      return { ...base, w: { sit: 1 - dn, down: dn }, look: W.treat || add(FLOOR(), [0.05, 0.08, 0]), neck: 1, jaw: f >= w.floor2 + 19 ? 0.3 : ch, ears: -0.3 * (1 - dn),
        ...(f > w.floor2 + 5 ? happy : {}), blink: f > w.floor2 + 5 && f < w.floor2 + 11 ? 1 : base.blink };
    }
    case 'povFade': {
      const dn = sm(ramp(f, w.empty - 6, w.hand1 + 8)), ch = chompAt(f, w.other + 4);
      return { ...base, w: { sit: 1 - dn, down: dn }, look: W.treat || W.lead || add(FLOOR(), [0.05, 0.08, 0]), neck: 1, jaw: f >= w.other + 18 ? 0.3 : ch,
        ...(f > w.other + 4 ? happy : {}), blink: f > w.other + 4 && f < w.other + 10 ? 1 : base.blink };
    }
    case 'povCue': {
      const dn = sm(ramp(f, w.then1 + 14, w.signal + 16));
      const perk = f >= w.down2 && f < w.down2 + 24 ? -0.7 * Math.sin(Math.PI * ramp(f, w.down2, w.down2 + 24)) : 0;
      return { ...base, w: { sit: 1 - dn, down: dn }, look: f < w.then1 ? [0.95, 0.42, 0.15] : W.lead, neck: 0.75, ears: perk - 0.2, headTilt: f >= w.down2 && f < w.then1 ? 8 * Math.sin(Math.PI * ramp(f, w.down2, w.then1)) : 0,
        wag: 0.5 * Math.sin(f * 0.4) };
    }
    case 'elbows': {
      const dn = sm(ramp(f, w.reward2 + 6, w.elbows + 4)), ch = chompAt(f, w.elbows + 10);
      return { ...base, w: { sit: 1 - dn, down: dn }, look: W.treat || add(FLOOR(), [0.05, 0.08, 0]), neck: 1, jaw: f >= w.elbows + 24 ? 0.3 : ch,
        ...(f > w.elbows + 10 ? happy : {}), blink: f > w.elbows + 10 && f < w.elbows + 16 ? 1 : base.blink };
    }
    case 'stand': {
      const dn = sm(ramp(f, w.practice + 18, w.stand + 26)), ch = chompAt(f, w.stand + 32);
      return { ...base, w: { stand: 1 - dn, down: dn }, look: W.treat || add(FLOOR(), [0.05, 0.08, 0]), neck: 1, jaw: f >= w.stand + 46 ? 0.3 : ch,
        ...(f > w.stand + 32 ? happy : {}), blink: f > w.stand + 32 && f < w.stand + 38 ? 1 : base.blink };
    }
    case 'popUp': {
      const up = M.smooth(M.smooth(ramp(f, w.pops - 10, w.up + 6)));   // slow start, slow settle: no snap
      return { ...base, w: { down: 1 - up, stand: up }, look: W.treat ? [W.treat[0], Math.min(W.treat[1], 0.3 + 0.16 * up), W.treat[2]] : null, neck: 0.4 - 0.08 * up, ears: -0.3 * up, tail: 0.4 * up,
        wag: up > 0.5 ? Math.sin(f * 0.8) : 0.2 * Math.sin(f * 0.3), pos: lerp3(DOGPOS, [0.03, MAT, 0], up), blink: f >= w.up + 2 && f < w.up + 7 ? 1 : base.blink };
    }
    case 'fix': {
      const ch = chompAt(f, w.closer + 4);
      return { ...base, w: { down: 1 }, look: W.treat || add(FLOOR(), [0.05, 0.08, 0]), neck: 1, jaw: f >= w.closer + 18 ? 0.3 : ch,
        ...(f > w.closer + 4 ? happy : {}), blink: f > w.closer + 4 && f < w.closer + 10 ? 1 : base.blink };
    }
    case 'calm': {
      const lid = f > w.never + 12 && f < w.deliver - 6 ? 0.5 + 0.15 * Math.sin(f * 0.05) : blinkAt(f, 8) ? 1 : 0;
      return { ...base, w: { down: 1 }, look: add(NOSE('down'), [0.45, -0.1, 0.05 + 0.04 * Math.sin(f * 0.03)]), neck: 0.7, blink: lid, breath: 0.35 + 0.35 * Math.sin(f * 0.12), ears: 0.4, wag: 0.3 * Math.sin(f * 0.1) };
    }
    case 'povStay': {
      const t1 = w.deliver + 16, t2 = T2(), ch = Math.max(chompAt(f, t1), chompAt(f, t2));
      return { ...base, w: { down: 1 }, look: W.treatHide || !W.treat ? [0.9, 0.24, 0.3] : W.treat, neck: 0.8, jaw: ch, wag: 0.9 * Math.sin(f * 0.6), tail: 0.3,
        blink: (f > t1 && f < t1 + 5) || (f > t2 && f < t2 + 5) ? 1 : base.blink };
    }
    case 'yes': {
      return { ...base, w: { down: 1 }, look: [TRN[0] + 0.05, 0.95, TRN[2]], neck: 1, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0,
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

// ---------- 3D props: hand / paw pointer + biscuit + trail + rings ----------
// treatPath = where the biscuit is (null = none); leadPath = where the EMPTY hand is (fade + cue shots)
const treatPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'hook': return SH(KF(f, [[0, add(N_SIT(), [0.06, 0.02, 0])], [8, N_SIT()], [w.down1 - 11, [LOW()[0], MAT + 0.07, 0]], [w.down1 - 3, [FLOOR()[0], MAT + 0.06, 0]], [w.down1 + 1, REWARD()]]));
    case 'povLure': {
            return KF(f, [[w.lure, [0.75, 0.3, 0.25]], [w.nose - 4, N_SIT()], [w.lower, N_SIT()], [w.straight + 6, LOW()], [w.floor2 + 1, FLOOR()], [w.floor2 + 5, REWARD()], [w.floor2 + 16, REWARD()], [w.floor2 + 30, [0.95, 0.12, 0.45]]]);
    }
    case 'povFade': {   // the OTHER hand brings the treat once the puppy is down
      if (f < w.reward1 - 6) return null;
      const S0 = [0.62, 0.18, 0.34], R = add(REWARD(), [0, 0, 0.02]);
      return KF(f, [[w.reward1 - 6, S0], [w.other + 2, R], [w.other + 16, R], [w.other + 30, [0.8, 0.12, 0.45]]]);
    }
    case 'elbows': return KF(f, [[w.reward2, add(N_SIT(), [0.08, -0.04, 0])], [w.reward2 + 6, N_SIT()], [w.elbows - 6, LOW()], [w.elbows + 2, FLOOR()], [w.elbows + 9, REWARD()]]);
    case 'stand': return KF(f, [[w.practice, add(N_STAND(), [0.12, 0.02, 0])], [w.practice + 12, N_STAND()], [w.stand + 6, [N_STAND()[0] + 0.02, MAT + 0.05, 0]], [w.stand + 22, FLOOR()], [w.stand + 30, REWARD()]]);
    case 'popUp': return KF(f, [[w.if, [0.62, 0.86, 0.1]], [w.pops - 6, [0.46, 0.68, 0.04]], [w.pops + 8, [0.4, 0.5, 0.02]], [w.up + 6, [0.48, 0.52, 0.0]], [w.treat, [0.49, 0.53, 0.0]]]);
    case 'fix': return KF(f, [[w.treat, [0.6, MAT + 0.06, -0.15]], [w.treat + 8, [0.57, MAT + 0.05, -0.1]], [w.closer - 4, FLOOR()], [w.closer + 3, REWARD()]]);
    case 'povStay': {
      const t1 = w.deliver + 16, t2 = T2(), START = [0.95, 0.12, 0.42];   // START is below the frame
      if (f < t1) return KF(f, [[w.deliver, [0.7, 0.18, 0.32]], [t1 - 2, MOUTH()]]);
      if (f < t1 + 10) return MOUTH();                     // held at the mouth while it's eaten
      if (f < t2) return KF(f, [[t1 + 10, MOUTH()], [t1 + 20, START], [t2 - 14, START], [t2 - 2, MOUTH()]]);
      return MOUTH();
    }
    case 'povFinal': return KF(f, [[w.then2, add(MOUTH(), [0.3, 0.14, 0.05])], [w.reward3 + 2, MOUTH()]]);   // hand lingers to the end
  }
  return null;
};
const leadPath = (f) => {
  const S = shotAt(f);
  if (S.id === 'povFade') return KF(f, [[w.now, [0.7, 0.24, -0.25]], [w.make - 4, add(N_SIT(), [0.04, 0.0, -0.04])], [w.empty - 6, add(N_SIT(), [0.04, 0.0, -0.04])], [w.hand1 + 4, add(LOW(), [0.04, 0.02, -0.04])], [w.hand1 + 12, add(FLOOR(), [0.04, 0.02, -0.06])]]);
  if (S.id === 'povCue') { // flat palm held above the nose, then the signal: one smooth sweep down to the floor
    const top = [N_SIT()[0] + 0.18, N_SIT()[1] - 0.12, 0.02], mid = [FLOOR()[0] + 0.1, MAT + 0.15, 0.03];   // beside the chest (screen right), never over the face
    return KF(f, [[w.next, [0.75, 0.25, -0.18]], [w.next + 30, top], [w.then1 + 2, top], [w.signal, mid], [w.signal + 10, [FLOOR()[0] + 0.1, MAT + 0.06, 0.03]]]);
  }
  return null;
};
const EAT = { elbows: w.elbows + 12, stand: w.stand + 34, fix: w.closer + 6 };   // paw shots: frame the treat is eaten
const HANDSHOTS = ['povLure', 'povStay', 'povFinal'];
const PAWSHOTS = { elbows: '#ff8fb0', stand: '#ff8fb0', popUp: '#ff5a5a', fix: '#6fe08a' };
// POV lure/fade/cue + elbows have NO trail: a column of beads straight down in front of the dog paints over its face/chest from a front camera.
const TRAIL = { hook: [8, treatPath],   // elbows: no trail either (front camera: the column of beads crossed its chest)
  stand: [w.practice + 12, treatPath], popUp: [w.if, treatPath], fix: [w.treat, treatPath] };
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f), lead = leadPath(f);
  if (t) W.treat = t;
  if (lead) W.lead = lead;
  const tr = TRAIL[S.id];
  if (tr && f > tr[0] && tr[1](f)) {
    const pts = []; let last = null;
    const stop = { hook: w.down1 - 9, elbows: w.elbows + 2, stand: w.stand + 22, fix: w.closer - 4 }[S.id] ?? f;   // trails end at the floor point: the final lift to the mouth is not trailed (it would paint over the dog)
    for (let g = tr[0]; g <= Math.min(f, stop); g += 0.5) { const p = tr[1](g); if (!p) break; if (!last || Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]) > 0.03) { pts.push(p); last = p; } }
    W.trail = pts.slice(0, -1);
  }
  if (t && HANDSHOTS.includes(S.id)) W.hand = { treat: t, side: S.id === 'povFinal' ? 0.22 : 0.16 };
  if (S.id === 'povFade') {
    W.hand = { at: lead, pose: 'open', mode: 'reach', palm: [0, -1, 0], fingers: [-0.85, -0.35, -0.4], grip: 'palm', side: 0.12 };   // EMPTY: open flat hand, same movement
    if (f >= w.hand1 + 12) W.hand.at = add(FLOOR(), [0.12, 0.0, -0.02]);   // stays at the floor, out of the way of the reward
    if (t) W.hand2 = { at: t, pose: 'pinch', side: -0.1 };
  }
  if (S.id === 'povCue') W.hand = { at: lead, pose: 'five', mode: 'reach', palm: [0, -1, 0], fingers: [-0.85, -0.4, -0.35], grip: 'palm', side: 0.12 };
  const ate = (t0, n) => f >= t0 && f < t0 + n;
  if ((S.id === 'hook' && f > w.down1 + 5) || (S.id === 'povLure' && f >= w.floor2 + 5) || (S.id === 'povFade' && f >= w.other + 4) || (S.id === 'povStay' && (ate(w.deliver + 16, 18) || f >= T2())) || (S.id === 'povFinal' && f >= w.reward3 + 4) || (S.id === 'elbows' && f >= EAT.elbows) || (S.id === 'stand' && f >= EAT.stand) || (S.id === 'fix' && f >= EAT.fix)) W.treatHide = true;
  if (PAWSHOTS[S.id]) {
    W.trailCol = PAWSHOTS[S.id];
    if (t) W.paw = { pos: W.treatHide ? add(t, [0.1 * sm(ramp(f, EAT[S.id], EAT[S.id] + 14)), 0.7 * sm(ramp(f, EAT[S.id], EAT[S.id] + 14)), 0]) : t, s: 0.95 };   // after the chomp the paw flies up and out of frame (never sits on the face)
  }
  if (S.id === 'elbows' && f >= w.elbows - 2) {   // gold rings on both elbows as they touch the floor
    W.rings = REF.down.elb.map((e, i) => { const u = ((f - (w.elbows - 2)) / 22 + i * 0.5) % 1; return { p: [e[0], MAT + 0.006, e[2]], r: 0.04 + 0.1 * u, a: (1 - u) * 0.95 }; });
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
    const kind = f > w.down1 + 5 ? 'palm' : f >= w.down1 - 5 ? 'give' : 'treat', off = kind === 'give' ? [19, -12] : [25, -3], s = 2.08 * 1.05, sy = Math.cos(ang) < 0 ? -1 : 1;
    const Wr = [T[0] - (Math.cos(ang) * off[0] * s - Math.sin(ang) * off[1] * sy * s), T[1] - (Math.sin(ang) * off[0] * s + Math.cos(ang) * off[1] * sy * s)];
    o.far = { to: Wr, hand: kind, bend: 1, rot: ang * 180 / Math.PI }; o.lean = 10;
  } else o.far = 'present';
  return o;
};

// ---------- cameras ----------
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  // from the treat jar on the stool down to the puppy sitting on the non-slip mat
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.nonslip - 8, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },   // jar ... hard cut ...
    { f: w.nonslip - 7, pos: [1.22, 0.52, 1.0], look: [0.04, 0.2, 0.0], fov: 38 }, { f: w.lure - 1, pos: [1.1, 0.47, 0.9], look: [0.04, 0.19, 0.0], fov: 38 }],   // ... to the puppy on the mat
  // POV = the trainer's eyes, kneeling in front of the puppy, looking down
  povLure: [{ f: w.lure, pos: [1.28, 0.88, 0.56], look: [0.2, 0.22, 0.0], fov: 42 }, { f: w.now - 1, pos: [1.22, 0.82, 0.53], look: [0.22, 0.16, 0.0], fov: 42 }],
  povFade: [{ f: w.now, pos: [1.3, 0.9, 0.5], look: [0.22, 0.22, 0.0], fov: 43 }, { f: w.next - 1, pos: [1.24, 0.84, 0.47], look: [0.24, 0.16, 0.0], fov: 43 }],
  povCue: [{ f: w.next, pos: [1.3, 0.9, 0.6], look: [0.2, 0.33, 0.0], fov: 42 }, { f: w.reward2 - 1, pos: [1.24, 0.84, 0.57], look: [0.22, 0.24, 0.0], fov: 42 }],
  // ground level from the side: the elbows touching the mat read clearly
  elbows: [{ f: w.reward2, pos: [1.38, 0.46, 0.74], look: [0.14, 0.24, 0.0], fov: 40 }, { f: w.practice - 1, pos: [1.32, 0.44, 0.71], look: [0.15, 0.22, 0.0], fov: 40 }],
  stand: [{ f: w.practice, pos: [1.32, 0.66, 0.66], look: [0.18, 0.27, 0.0], fov: 42 }, { f: w.if - 1, pos: [1.26, 0.62, 0.63], look: [0.19, 0.23, 0.0], fov: 42 }],
  // low side angle with sky so "too high" reads
  popUp: [{ f: w.if, pos: [0.84, 0.5, 1.3], look: [0.34, 0.36, 0.05], fov: 44 }, { f: w.treat - 1, pos: [0.78, 0.6, 1.45], look: [0.34, 0.42, 0.05], fov: 44 }],
  fix: [{ f: w.treat, pos: [1.32, 0.7, -0.56], look: [0.18, 0.22, 0.0], fov: 40 }, { f: w.never - 1, pos: [1.27, 0.67, -0.53], look: [0.19, 0.21, 0.0], fov: 40 }],
  calm: [{ f: w.never, pos: [1.25, 0.42, 0.95], look: [0.14, 0.18, 0.0], fov: 38 }, { f: w.deliver - 1, pos: [0.3, 0.46, 1.45], look: [0.1, 0.18, 0.0], fov: 38, path: [[0.85, 0.44, 1.3]] }],
  povStay: [{ f: w.deliver, pos: [1.3, 0.8, 0.58], look: [0.24, 0.19, 0.0], fov: 42 }, { f: w.say2 - 1, pos: [1.25, 0.77, 0.55], look: [0.25, 0.18, 0.0], fov: 42 }],
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
  if (S.id === 'elbows') return { focus: dist(C.pos, [0.18, 0.12, 0]), cinf: 8 };
  if (S.id === 'popUp') return { focus: dist(C.pos, [0.1, 0.3, 0]), cinf: 6 };
  if (S.id === 'stand' || S.id === 'fix') return { focus: dist(C.pos, [0.12, 0.15, 0]), cinf: 4 };
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
const BUB_CUE = [0.2, 0.45, -0.02], BUB_YES = [-0.12, 0.78, -0.45];   // bubble anchor points (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  // rewards: hearts pop off the puppy's head
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = add(NOSE('down'), [-0.08, 0.06, 0]);
  if (S.id === 'hook') hearts(w.down1 + 1, [0.38, 0.36, -0.42], 3, 0.07);
  if (S.id === 'setup') badge(T.fxCheck, 'ok', w.nonslip + 6, w.lure, [0.5, 0.1, 0.5], 0.11);
  if (S.id === 'povLure') hearts(w.floor2 + 6, HEAD);
  if (S.id === 'povFade') hearts(w.other + 5, HEAD);
  if (S.id === 'elbows') { hearts(w.elbows + 11, HEAD); badge(T.fxCheck, 'ok', w.floor3, w.practice, [0.2, 0.34, 0.1], 0.12); }
  if (S.id === 'stand') { hearts(w.stand + 33, HEAD); badge(T.fxCheck, 'ok', w.stand + 34, w.if, [0.08, 0.36, 0.05], 0.13); }
  // cue bubbles (James's newer look): pop in near the top of frame on the spoken cue / the marker
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'povCue') bubble('bd', 'Down!', 'just once', '#ffffff', w.down2 - 2, w.then1 + 8, BUB_CUE, 0.2);
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'popUp') badge(T.fxCross, 'no', w.high - 3, w.treat, [0.28, 0.66, 0.1], 0.2);
  if (S.id === 'fix') { hearts(w.closer + 5, HEAD); badge(T.fxCheck, 'ok', w.floor4 - 2, w.never, [0.0, 0.34, 0.12], 0.14); }
  if (S.id === 'calm' && f >= w.never + 8 && f < w.never + 36) { const t = q(ramp(f, w.never + 8, w.never + 36), 2); out.push(FX('si' + t, (p) => T.fxSigh(p, t), add(NOSE('down'), [0.08, 0.02, 0.04]), 0.12)); }
  if (S.id === 'povStay') { hearts(w.deliver + 17, HEAD); hearts(T2() + 1, HEAD); }
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward3 + 3, HEAD, 4, 0.06);
    if (f >= w.reward3) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward3 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('down'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
