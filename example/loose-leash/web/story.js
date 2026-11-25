// "Loose leash" — leash walking #1: a loose leash makes the walk go. 3D puppy (dog-puppy.glb) with a harness + leash (web/leash.js) in a hallway, the 2D trainer in the hook and the "yes", 1001 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3, voice.mp3.words.json round(s*30); sentence-start words from the silence_end before them, whisper dates some too early):
// Let's 0 teach 8 dog 17 loose 33 leash 40 makes 47 walk 73 go 79 | Put 119 comfy 128 harness 138 leash 154 start 175 quiet 191 hallway 199 | Keep 234 treats 236 hip 256 |
// Every 283 few 285 steps 296 when 305 dog 323 beside 337 loose 362 leash 368 | reward 395 at 401 your 412 leg 416 | The 452 moment 454 leash 466 gets 472 tight 477 |
// stand 501 still 508 | Wait 543 dog 555 look 569 back 574 or 581 step 594 toward 601 | As 637 soon 638 leash 653 goes 660 slack 666 | reward 691 and 720 walk 725 on 735 |
// Never 766 yank 776 leash 790 back 796 | Just 825 stop 829 and 837 let 852 slack 857 restart 866 walk 890 | Say 920 yes 925 or 935 click 950 | then 974 reward 979 | end 1000.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and action is keyed to `w`.
// Hard cuts only, no flashes. Puppy walks toward +x along the hallway; the trainer (camera) walks on its right (+z side). The leash is drawn by leash.js: slack 1 = soft J, 0 = straight.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1001, DECK = 0;
const w = {
  lets: 0, loose1: 33, walk1: 73, put: 119, harness: 138, start: 175, keep: 234, hip: 256, every: 283, loose2: 362, reward1: 395, leg: 416, the: 452, tight: 477, stand: 501,
  wait: 543, look: 569, step: 594, toward: 601, as: 637, slack1: 666, reward2: 691, walk2: 725, never: 766, yank: 776, back2: 790, just: 825, stop: 829, slack2: 857, restart: 866, walk3: 890,
  say: 920, yes: 925, click: 950, then: 974, reward3: 979, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.put - 1, light: 'hall' },              // trainer + puppy on a loose leash
  { id: 'setup', a: w.put, b: w.keep - 1, light: 'hall' },        // close on the harness, then the quiet hallway
  { id: 'hip', a: w.keep, b: w.every - 1, light: 'hall' },        // POV: treat held low at the hip, puppy beside
  { id: 'walkLoose', a: w.every, b: w.reward1 - 4, light: 'hall' }, // tracking walk: loose J, check on "loose leash"
  { id: 'rewardLeg', a: w.reward1 - 3, b: w.the - 1, light: 'hall' }, // reward at the leg
  { id: 'tightWalk', a: w.the, b: w.stand - 1, light: 'hall' },   // puppy forges ahead, leash goes tight (red), cross
  { id: 'standStill', a: w.stand, b: w.wait - 1, light: 'hall' }, // we stand still, leash stays tight
  { id: 'wait', a: w.wait, b: w.as - 1, light: 'hall' },          // puppy looks back, steps toward us, slack returns
  { id: 'slackOk', a: w.as, b: w.reward2 - 1, light: 'hall' },    // slack again: loose J + check
  { id: 'rewardWalk', a: w.reward2, b: w.never - 1, light: 'hall' }, // reward, then walk on
  { id: 'never', a: w.never, b: w.just - 1, light: 'hall' },      // MISTAKE: tight leash, red + cross (never yank)
  { id: 'stopSlack', a: w.just, b: w.say - 1, light: 'hall' },    // just stop; slack restarts the walk
  { id: 'yes', a: w.say, b: w.then - 1, light: 'golden' },        // trainer: "yes" + click
  { id: 'povFinal', a: w.then, b: TOTAL - 1, light: 'golden' },   // POV: reward, confetti
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const sm = M.smooth;
const KF = (f, keys, ease = sm) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) { const [fa, va] = keys[i], [fb, vb] = keys[i + 1]; if (f <= fb) { const t = ease((f - fa) / (fb - fa)); return Array.isArray(va) ? va.map((v, k) => lerp(v, vb[k], t)) : lerp(va, vb, t); } }
  return keys[keys.length - 1][1];
};
const add = (a, b) => a.map((v, i) => v + b[i]);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const mul = (a, k) => a.map((v) => v * k);
const norm = (a) => mul(a, 1 / (Math.hypot(...a) || 1));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const chompAt = (f, t0, n = 14) => (f >= t0 && f < t0 + n ? Math.abs(Math.sin((f - t0) * 0.75)) : 0);

// ---------- lights ----------
export const LIGHTS = {
  hall: { az: 135, el: 52, sky: '#fff1dc', ground: '#c4a880', hemi: 1.25, sun: '#fff0d8', sunI: 2.1, fog: '#f3eadb', fogNear: 60, fogFar: 700,
    skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.08, vig: 0.2, shadowExt: 3 },
  golden: { az: 120, el: 32, sky: '#ffe6c8', ground: '#c4a078', hemi: 1.2, sun: '#ffe2bc', sunI: 2.2, fog: '#f4d6b0', fogNear: 60, fogFar: 650,
    skyTop: '#6f8fd8', skyHor: '#ffd2a0', sat: 1.04, vig: 0.24, shadowExt: 3, gain: '#fffaf2' },
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });

// ---------- staging ----------
const K = 0.00225, ST = 1.08, DOGYAW = Math.PI / 2, TZ = 0.45, DZ = -0.12, HEEL = 0.5, TAUT = 1.12, LOOSE = 0.95;
const TRN = [0.52, 0, -0.66];                           // trainer card (hook / yes)
const HOOKD = [0.1, 0, -0.45];                         // puppy position in the hook / yes (faces the trainer)
let CUR = [0, 1, 3], TCUR = TRN;
const axisOf = (pos) => { const ry = Math.atan2(CUR[0] - pos[0], CUR[2] - pos[2]); return [Math.cos(ry), 0, -Math.sin(ry)]; };
const tD = (P) => {     // world point -> trainer design point along the camera ray (flipped card)
  const C = CUR, TR0 = TCUR, ax = axisOf(TR0), n = [-ax[2], 0, ax[0]];
  const d = [P[0] - C[0], P[1] - C[1], P[2] - C[2]], den = d[0] * n[0] + d[2] * n[2] || 1e-6;
  const s = ((TR0[0] - C[0]) * n[0] + (TR0[2] - C[2]) * n[2]) / den, Q = [C[0] + d[0] * s, C[1] + d[1] * s, C[2] + d[2] * s];
  return [300 - ((Q[0] - TR0[0]) * ax[0] + (Q[2] - TR0[2]) * ax[2]) / (K * ST), 975 - (Q[1] - TR0[1]) / (K * ST)];
};
const dP = ([dx, dy]) => { const ax = axisOf(TRN), s = (300 - dx) * K * ST; return [TRN[0] + ax[0] * s, (975 - dy) * K * ST, TRN[2] + ax[2] * s]; };   // design point -> world, on the card plane

// ---------- reference points from the real rig ----------
const REF = {};
export const calibrate = (poseFn, root) => {
  root.position.set(0, 0, 0); root.rotation.set(0, DOGYAW, 0); root.updateMatrixWorld(true);
  const far = [3, 0.3, 0];
  REF.sit = poseFn({ w: { sit: 1 }, look: far });
  REF.stand = poseFn({ w: { stand: 1 }, look: far });
};
// puppy nose (stand pose) for a puppy at (x, z) with heading yaw
const noseAt = (x, z, yaw, pose = 'stand', dy = 0) => { const n = REF[pose].nose, c = Math.cos(yaw - DOGYAW), s = Math.sin(yaw - DOGYAW); return [x + n[0] * c + n[2] * s, n[1] + dy, z - n[0] * s + n[2] * c]; };
const ringAt = (x, z, yaw, y = 0.41) => [x + 0.103 * Math.sin(yaw), y, z + 0.103 * Math.cos(yaw)];

// ---------- walking: trainer x(f), puppy path ----------
const WALKS = [[w.every, w.reward1 - 3, 14, 16], [w.the, w.stand - 2, 10, 20], [w.walk2 - 3, w.never - 1, 14, 0], [w.walk3, w.end, 12, 0]];
const SPEED = 0.026;   // m per frame (0.78 m/s)
const TXS = [0]; for (let f = 1; f <= TOTAL; f++) { let s = 0; for (const [a, b, up, dn] of WALKS) if (f >= a && f <= b) s = Math.max(s, sm(ramp(f, a, a + up)) * (dn ? 1 - sm(ramp(f, b - dn, b)) : 1)); TXS.push(TXS[f - 1] + SPEED * s); }
const TX = (f) => TXS[clamp(Math.round(f), 0, TOTAL)];
// puppy turns round to look back and walks to us, twice (wait / stopSlack). Returns { off, yaw, look }; t0 = start frame, sc = time scale.
const TURN = (f, t0, sc) => {
  const t = (f - t0) / sc;
  const yaw = KF(t, [[0, 0], [14, 0], [34, -170], [66, -170], [92, -360]]) * Math.PI / 180;      // + DOGYAW
  const off = KF(t, [[0, TAUT], [34, TAUT], [70, HEEL]]);
  return { off, yaw, back: sm(ramp(t, 0, 14)) * (1 - sm(ramp(t, 70, 92))), mv: t > 30 && t < 96 };
};
const T_WAIT = 572, T_STOP = 826;
// offset of the puppy ahead of the heel position (m), yaw, and gait weight for each frame
const dogPath = (f) => {
  let off = HEEL, yaw = 0, back = 0;
  if (f >= w.the) off = KF(f, [[w.the, HEEL], [w.tight - 3, TAUT], [10000, TAUT]]);
  if (f >= w.wait) { const t = TURN(f, T_WAIT, 1.0); off = t.off; yaw = t.yaw; back = t.back; }
  if (f >= w.as + 30) { off = HEEL; yaw = 0; back = 0; }
  if (f >= w.walk2 + 14) off = KF(f, [[w.walk2 + 14, HEEL], [w.never - 3, 0.95]]);
  if (f >= w.never) off = KF(f, [[w.never, 0.95], [w.never + 12, TAUT]]);
  if (f >= w.just) { const t = TURN(f, T_STOP, 0.7); off = t.off; yaw = t.yaw; back = t.back; if (f >= w.walk3 - 2) { off = HEEL; yaw = 0; back = 0; } }
  const tx = TX(f), x = tx + off, z = DZ;
  return { x, z, yaw: DOGYAW + yaw, off, back };
};
const DP = []; { let ph = 0; for (let f = 0; f <= TOTAL; f++) { const a = dogPath(Math.max(0, f - 1)), b = dogPath(f), d = Math.hypot(b.x - a.x, b.z - a.z) + 0.12 * Math.abs(b.yaw - a.yaw); ph += d / 0.4; DP.push({ ...b, ph, sp: d * 30 }); } }
const dogP = (f) => DP[clamp(Math.round(f), 0, TOTAL)];
// leash tension from how far ahead the puppy is: 0 loose .. 1 taut
const tension = (f) => {   // taut only while the puppy is ahead AND still facing forward: turning toward the hand slackens the leash within ~6 frames
  const d = dogP(f), t = sm(ramp(d.off, 0.7, 1.08)), yd = d.yaw - DOGYAW;
  return yd < -0.01 ? Math.min(t, 1 - sm(ramp(-yd, 0.12, 1.0))) : t;
};

// ---------- cameras (POV = the trainer's eyes, walking on the puppy's right) ----------
const camBase = (f) => {   // side tracking rig for every walking shot: the puppy in profile, the leash runs out of frame to the trainer's hand
  const d = dogP(f);
  const S = shotAt(f); return { pos: [d.x + 0.12 * Math.sin(d.yaw), 0.6, DZ + 1.85 - 0.0015 * (f - S.a)], look: [d.x + 0.12 * Math.sin(d.yaw), 0.5, DZ], fov: 44 };
};
const frontCam = (f, key = 0) => { const d = dogP(f), x = d.x, z = d.z; return { pos: [x + 1.28 + key, 0.88, z + 0.56], look: [x + 0.2, 0.22, z], fov: 42 }; };   // in front of the puppy (it faces us): face + chest, hands from below
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.put - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  // close on the harness (3/4 front), then a hard cut to the quiet hallway (low, from behind)
  setup: [{ f: w.put, pos: [1.0, 0.52, 1.25], look: [0.1, 0.3, 0.0], fov: 38 }, { f: w.start - 5, pos: [0.93, 0.52, 1.18], look: [0.1, 0.3, 0.0], fov: 38 },
    { f: w.start - 4, pos: [-1.9, 0.62, 0.3], look: [3.5, 0.45, -0.05], fov: 46 }, { f: w.keep - 1, pos: [-1.4, 0.6, 0.28], look: [3.5, 0.45, -0.05], fov: 46 }],
  yes: [{ f: w.say, pos: [0.38, 0.86, 2.4], look: [0.42, 0.56, -0.45], fov: 43 }, { f: w.then - 1, pos: [0.38, 0.84, 2.25], look: [0.42, 0.56, -0.45], fov: 43 }],
};
export const camAt = (f) => {
  const S = shotAt(f); let c;
  if (CAMS[S.id]) c = camFromKeys(CAMS[S.id], f, {});
  else if (S.id === 'rewardLeg' || S.id === 'povFinal' || S.id === 'hip') { const k = camFromKeys([{ f: S.a, ...frontCam(f) }, { f: S.b, ...frontCam(f, -0.05) }], f, {}); c = k; }
  else if (S.id === 'rewardWalk' && f < w.walk2 - 4) c = camFromKeys([{ f: S.a, ...frontCam(f) }, { f: w.walk2 - 4, ...frontCam(f, -0.05) }], f, {});
  else c = camFromKeys([{ f, ...camBase(f) }, { f: f + 1, ...camBase(f) }], f, { creep: 0 });
  if (!CAMS[S.id]) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 0.6 * Math.sin(f * 0.05); }
  c.shadowAt = [c.look[0], 0.1, c.look[2]];
  return c;
};
const camBasis = (f) => { const C = camAt(f), fw = norm(sub(C.look, C.pos)), rt = norm(cross(fw, [0, 1, 0])), up = cross(rt, fw); return { C, fw, rt, up }; };
const handPt = (f, a, b, c) => { const { C, fw, rt, up } = camBasis(f); return add(C.pos, add(mul(fw, a), add(mul(rt, b), mul(up, c)))); };   // camera-relative point (forward, right, up)
const HAND1 = (f) => handPt(f, 0.95, 0.11, -0.29);        // right hand: holds the leash handle
const HAND2 = (f) => handPt(f, 0.85, -0.14, -0.3);        // left hand: treats at the hip (below frame in the walking shots)

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f), d = dogP(f);
  const base = { pos: [d.x, 0, d.z], yaw: d.yaw, w: { stand: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.7, ears: 0 };
  const W = worldAt(f), happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const gk = clamp(d.sp / 0.5), gait = gk > 0.02 ? { phase: d.ph, amp: 24, lift: 1.1, k: gk } : undefined;
  const ahead = [d.x + 2.2, 0.12, d.z];
  switch (S.id) {
    case 'hook': {
      const dn = sm(ramp(f, w.walk1 - 14, w.walk1 + 6));   // "makes the walk go": it springs up from a sit
      return { ...base, pos: HOOKD, yaw: DOGYAW, w: { sit: 1 - dn, stand: dn }, look: [TRN[0] - 0.05, 0.75, TRN[2]], neck: 0.9, wag: 0.8 * Math.sin(f * 0.5), tail: 0.2 + 0.2 * dn, ears: -0.2 };
    }
    case 'setup': {
      if (f < w.start - 4) return { ...base, pos: [0, 0, 0], yaw: DOGYAW, w: { stand: 1 }, look: [0.9, -0.15, 0.9], neck: 0.6, wag: 0.6 * Math.sin(f * 0.45), tail: 0.2, ears: -0.2, headTilt: 7 * Math.sin(Math.PI * ramp(f, w.put + 18, w.harness + 12)) };
      return { ...base, pos: [0, 0, 0], yaw: DOGYAW, w: { sit: 1 }, look: [3, 0.35, 0.2], neck: 0.8, wag: 0.5 * Math.sin(f * 0.35), tail: 0.2 };
    }
    case 'walkLoose': return { ...base, gait, look: ahead, neck: 0.5, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2 };
    case 'rewardLeg': {
      const t0 = w.reward1 + 3;
      return { ...base, w: { stand: 1 }, look: W.treat || add(noseAt(d.x, d.z, d.yaw), [0.1, 0.05, 0]), neck: 1, jaw: chompAt(f, t0) || (f >= t0 + 14 ? 0.25 : 0), ...(f > t0 ? happy : {}), blink: f > t0 && f < t0 + 6 ? 1 : base.blink, gait };
    }
    case 'hip': return { ...base, look: W.treat ? [W.treat[0], 0.3, W.treat[2]] : ahead, neck: 0.9, wag: 0.6 * Math.sin(f * 0.4), tail: 0.2, ears: -0.2 + 0.3 * Math.max(0, Math.sin(f * 0.13)) };
    case 'tightWalk': case 'standStill': {
      const lean = tension(f), bump = (a, b) => sm(ramp(f, a, a + 8)) * (1 - sm(ramp(f, b - 8, b))), gl = S.id === 'standStill' ? bump(w.stand + 12, w.stand + 34) : 0;
      return { ...base, gait, lean: lean * (5 + 1.5 * Math.sin(f * 0.09)), look: lerp3([d.x + 2.2, 0.12 - 0.06 * lean, d.z], add(camAt(f).pos, [0, -0.5, 0]), gl), neck: 0.5 + 0.1 * gl, wag: 0.1, tail: 0.15 + 0.3 * Math.max(0, Math.sin(f * 0.17)), ears: 0.3 * lean - 0.4 * gl };
    }
    case 'wait': case 'slackOk': {
      const ph = f >= w.wait ? TURN(f, T_WAIT, 1.0) : { back: 0 }, cam = camAt(f).pos;
      const back = f >= w.as + 30 ? 0 : ph.back;
      return { ...base, gait, look: back > 0.05 ? lerp3(ahead, add(cam, [0, -0.5, 0]), back) : ahead, neck: 0.5 - 0.15 * back, ears: 0.25 * (1 - back) - 0.2 * back, wag: 0.1 + 0.7 * back, tail: 0.15 + 0.25 * back, headTilt: 6 * Math.sin(Math.PI * ramp(f, w.look, w.look + 26)) };
    }
    case 'rewardWalk': {
      const t0 = w.reward2 + 4, cm = camAt(f).pos;
      if (f < w.walk2 - 4) return { ...base, look: W.treat || add(noseAt(d.x, d.z, d.yaw), [0.1, 0.05, 0]), neck: 1, jaw: chompAt(f, t0) || (f >= t0 + 14 ? 0.25 : 0), ...(f > t0 ? happy : {}), blink: f > t0 && f < t0 + 6 ? 1 : base.blink };
      return { ...base, gait, look: ahead, neck: 0.5, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2 };
    }
    case 'never': {
      const gl = sm(ramp(f, w.back2 + 2, w.back2 + 10)) * (1 - sm(ramp(f, w.just - 12, w.just - 2))), tn = tension(f);
      return { ...base, gait, lean: tn * (5 + 1.5 * Math.sin(f * 0.09)), look: lerp3(ahead, add(camAt(f).pos, [0, -0.5, 0]), gl), neck: 0.5 + 0.1 * gl, wag: 0.1, tail: 0.1 + 0.3 * Math.max(0, Math.sin(f * 0.15)), ears: 0.4 * tn - 0.4 * gl };
    }
    case 'stopSlack': {
      const ph = TURN(f, T_STOP, 0.7), cam = camAt(f).pos, back = f >= w.walk3 - 2 ? 0 : ph.back;
      return { ...base, gait, look: back > 0.05 ? lerp3(ahead, add(cam, [0, -0.5, 0]), back) : ahead, neck: 0.5 - 0.15 * back, ears: 0.3 * (1 - back) - 0.2 * back, wag: 0.1 + 0.7 * back, tail: 0.15 + 0.25 * back };
    }
    case 'yes': return { ...base, pos: HOOKD, yaw: DOGYAW, w: { sit: 1 }, look: [TRN[0] - 0.05, 0.75, TRN[2]], neck: 0.9, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    case 'povFinal': {
      const t0 = w.reward3 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, w: { sit: 1 }, pos: [d.x, 0, d.z], look: W.treatHide || !W.treat ? add(noseAt(d.x, d.z, d.yaw, 'sit'), [0.5, -0.4, 0.1]) : add(W.treat, [0, -0.25, 0]), neck: 0.7, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- hands, treat, leash ----------
const treatPath = (f) => {
  const S = shotAt(f), d = dogP(f);
  const mouth = (pose = 'stand') => add(noseAt(d.x, d.z, d.yaw, pose), [0.05 * Math.sin(d.yaw), -0.035, 0.05 * Math.cos(d.yaw)]);
  const rest = (g) => handPt(g, 0.75, 0.2, -0.42);   // below the frame (the right hand feeds in the front shots)
  switch (S.id) {
    case 'hip': return KF(f, [[w.keep, rest(f)], [w.keep + 16, handPt(f, 0.95, 0.08, -0.17)], [w.every - 1, handPt(f, 0.95, 0.08, -0.16)]]);
    case 'rewardLeg': { const t0 = w.reward1 + 3; return KF(f, [[S.a, rest(f)], [t0 - 3, mouth()], [t0 + 12, mouth()], [t0 + 28, rest(f)]]); }
    case 'rewardWalk': { if (f >= w.walk2 - 4) return null; const t0 = w.reward2 + 4; return KF(f, [[S.a, rest(f)], [t0 - 3, mouth()], [t0 + 12, mouth()], [w.walk2 - 5, rest(f)]]); }
    case 'povFinal': { const t0 = w.reward3 + 2; return KF(f, [[w.then, add(mouth('sit'), [0.3, 0.14, 0.15])], [t0, mouth('sit')]]); }
  }
  return null;
};
const frontShot = (f) => { const S = shotAt(f); return S.id === 'rewardLeg' || S.id === 'povFinal' || S.id === 'hip' || (S.id === 'rewardWalk' && f < w.walk2 - 4); };
const colAt = (f) => {   // leash colour: blue; green while a check is up; red when taut
  const S = shotAt(f), t = tension(f);
  const win = (a, b) => (f >= a && f < b ? sm(ramp(f, a, a + 6)) * (1 - sm(ramp(f, b - 6, b))) : 0);
  const green = Math.max(win(w.loose2 - 2, w.reward1 + 6), win(w.slack1 - 10, w.reward2 + 4), win(w.slack2 - 4, w.walk3 + 10)), red = sm(ramp(t, 0.5, 0.92));
  const base = [0.24, 0.43, 0.71], g = [0.25, 0.75, 0.42], r = [0.88, 0.25, 0.22];
  const c = lerp3(lerp3(base, g, green * (1 - red)), r, red);
  return '#' + c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
};
export const worldAt = (f) => {
  const S = shotAt(f), W = {}, d = dogP(f);
  CUR = camAt(f).pos;
  const t = treatPath(f);
  if (t) W.treat = t;
  const slack = LOOSE * (1 - tension(f)) + 0.02;
  if (S.id === 'hook' || S.id === 'yes') W.leash = { hand: trainerHandWorld(f), slack: 0.4, col: colAt(f) };
  else if (S.id === 'setup') W.leash = { hand: f < w.start - 4 ? [-0.55, 0.95, 0.65] : [-1.35, 0.55, 0.62], slack: LOOSE, col: colAt(f) };
  else if (frontShot(f)) { W.leash = { hand: [d.x - 0.2, 0.75, d.z + 0.9], slack, col: colAt(f) }; if (t) W.hand = { treat: t, pose: 'pinch', side: 0.16 }; }   // trainer's leash hand is out of frame; the right hand feeds
  else W.leash = { hand: [Math.min(TX(f) + 0.05, d.x - 1.0), 0.75, TZ], slack, col: colAt(f) };   // tracking shots: the trainer's hand is out of frame, up and behind
  const hide = (S.id === 'rewardLeg' && f >= w.reward1 + 3 + 10) || (S.id === 'rewardWalk' && f >= w.reward2 + 4 + 10) || (S.id === 'povFinal' && f >= w.reward3 + 4);
  if (hide) W.treatHide = true;
  return W;
};
// the trainer's hand (hook / yes): a point on his card plane, in design coordinates
const HANDD = { hook: [272, 810], yes: [272, 810] };
function trainerHandWorld(f) { const S = shotAt(f); CUR = camAt(f).pos; return dP(HANDD[S.id] || HANDD.hook); }

// ---------- the 2D trainer (hook + yes) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerHook = (f) => {
  const hi = idle(f, 3); CUR = camAt(f).pos;
  return { hose: true, kneel: 1, expr: f > 36 ? 'grin' : 'smile', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt, bob: hi.bob * 40, lean: 2,
    near: { to: tD(trainerHandWorld(f)), hand: 'fist', bend: -1 }, far: 'hip' };
};
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5; CUR = camAt(f).pos;
  return { hose: true, kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 3, bob: hi.bob * 40,
    near: { to: tD(trainerHandWorld(f)), hand: 'fist', bend: -1 }, far: { to: [225, 700 - 50 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: 1 }, click: clickOn ? 1 : 0 };
};
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), d = dogP(f);
  if (S.id === 'hook' || S.id === 'yes') return { focus: Math.hypot(C.pos[0] - 0.3, C.pos[1] - 0.5, C.pos[2] + 0.3), cinf: 5 };
  if (S.id === 'setup' && f >= w.start - 4) return { focus: Math.hypot(C.pos[0] - 0.5, C.pos[1] - 0.3, C.pos[2]), cinf: 6 };
  return { focus: Math.hypot(C.pos[0] - d.x - 0.1, C.pos[1] - 0.25, C.pos[2] - d.z), cinf: 4 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  CUR = camAt(f).pos; TCUR = TRN;
  const S = shotAt(f), out = [];
  const card = (o) => out.push({ key: 'tr' + JSON.stringify(o), draw: (p) => T.trainerDraw(p, o), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: 0, blobW: 0.8 });
  if (S.id === 'yes') card(roundAll({ ...trainerYes(f), mirror: true }));
  if (S.id === 'hook') card(roundAll({ ...trainerHook(f), mirror: true }));
  return out;
};
const BUB_YES = [0.0, 0.74, -0.45];
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f), d = dogP(f), W = worldAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = add(noseAt(d.x, d.z, d.yaw, S.id === 'povFinal' ? 'sit' : 'stand'), [0, 0.12, 0]);
  const above = [d.x, 0.78, d.z + 0.1], leashAt = [d.x, 0.78, d.z + 0.1];   // badge anchors in the tracking shots
  if (S.id === 'hook') badge(T.fxCheck, 'ok', w.loose1 + 6, w.walk1 - 4, [0.0, 0.82, -0.42], 0.22);
  if (S.id === 'setup' && f < w.start - 4) badge(T.fxCheck, 'ok', w.harness + 4, w.start - 4, [0.0, 0.62, 0.1], 0.1);
  if (S.id === 'walkLoose') badge(T.fxCheck, 'ok', w.loose2 + 2, w.reward1 - 2, above, 0.14);
  if (S.id === 'rewardLeg') hearts(w.reward1 + 4, HEAD);
  if (S.id === 'tightWalk') badge(T.fxCross, 'no', w.tight - 2, w.wait - 2, leashAt, 0.15);
  if (S.id === 'slackOk') badge(T.fxCheck, 'ok', w.slack1 - 1, w.reward2 - 2, above, 0.14);
  if (S.id === 'rewardWalk' && f < w.walk2) hearts(w.reward2 + 5, HEAD);
  if (S.id === 'never') badge(T.fxCross, 'no', w.yank - 3, w.just - 2, leashAt, 0.15);
  if (S.id === 'stopSlack') badge(T.fxCheck, 'ok', w.slack2 - 1, w.walk3 + 4, above, 0.14);
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), add(dP([185, 640]), [0, 0.1, 0.12]), 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward3 + 3, HEAD, 4, 0.06);
    if (f >= w.reward3) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward3 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(noseAt(d.x, d.z, d.yaw, 'sit'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
