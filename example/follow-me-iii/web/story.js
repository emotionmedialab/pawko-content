// "Follow me III" — leash walking #3: a long line, call-and-reward, gentle activity, a tug game, a jackpot, the mistake and the fix. 3D puppy + harness/long line (web/leash.js) in the backyard, the 2D kneeling trainer in the hook and the "yes", 1020 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3, round(s*30); sentence-start words from the silence_end before them):
// Let's 0 follow 25 you 33 even 51 busy 59 | Clip 108 long 120 line 125 safe 145 open 152 area 162 | Walk 198 away 201 then 224 call 226 dog 238 | Reward 271 moment 288 catch 302 up 309 |
// Next 348 add 362 gentle 368 activity 377 quiet 407 park 416 path 423 or 434 dog 449 far 457 away 465 | Swap 499 treats 512 quick 530 game 536 tug 547 | Staying 576 becomes 595 best 610 around 626 |
// Ignore 666 big 679 distraction 684 | Give 722 jackpot 727 several 746 treats 752 | If 790 struggles 801 you 825 moved 826 fast 842 | Go 874 back 880 level 885 few 901 reps 905 | Say 941 yes 946 click 967 | then 991 reward 995 | end 1019.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w`. Every shot boundary and action is keyed to `w`.
// Every walking shot is a straight run along +x (the camera tracks from the side); call/reward/tug/jackpot use one fixed front 3/4 camera. The long line is drawn by leash.js.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1020, DECK = 0;
const w = {
  lets: 0, follow: 25, you: 33, clip: 108, long: 120, line: 125, safe: 145, area: 162, walk: 198, then: 224, call: 226, reward: 271, catchW: 302, next: 348, quiet: 407, park: 416, path: 423, dogF: 449, far: 457, swap: 499, game: 536, tug: 547,
  staying: 576, best: 610, around: 626, ignore: 666, big: 679, give: 722, jackpot: 727, several: 746, treats2: 752, if: 790, struggles: 801, moved: 826, fast: 842, go: 874, back: 880, level: 885, reps: 905,
  say: 941, yes: 946, click: 967, then2: 991, reward3: 995, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.clip - 1, light: 'day' },                    // kneeling trainer + puppy on a loose line, check on "follow you"
  { id: 'clip', a: w.clip, b: w.safe - 1, light: 'day' },               // clip-on close-up of the long line, check
  { id: 'lawn', a: w.safe, b: w.then - 1, light: 'day' },               // open lawn: the puppy walks away on the long line, footprint dots
  { id: 'call', a: w.then, b: w.reward - 2, light: 'day' },             // "Come!" bubble: the puppy trots back to us
  { id: 'rewardCall', a: w.reward - 1, b: w.next - 1, light: 'day' },   // reward the moment they catch up
  { id: 'park', a: w.next, b: w.dogF - 1, light: 'day' },               // gentle activity: a quiet park path
  { id: 'farDog', a: w.dogF, b: w.swap - 1, light: 'day' },             // a calm dog far away
  { id: 'tug', a: w.swap, b: w.staying - 1, light: 'day' },             // swap treats for a quick game of tug
  { id: 'stay', a: w.staying, b: w.ignore - 1, light: 'day' },          // staying with you is the best game
  { id: 'ignore', a: w.ignore, b: w.give - 1, light: 'day' },           // the puppy ignores a big bouncing ball
  { id: 'jackpot', a: w.give, b: w.if - 1, light: 'day' },              // jackpot: several treats in a quick burst
  { id: 'struggle', a: w.if, b: w.go - 1, light: 'day' },               // MISTAKE: too fast, eyes on the ball, line tight (red + cross)
  { id: 'fix', a: w.go, b: w.say - 1, light: 'day' },                   // go back a level: quiet path, calm, check
  { id: 'yes', a: w.say, b: w.then2 - 1, light: 'golden' },             // trainer: "yes" + click
  { id: 'povFinal', a: w.then2, b: TOTAL - 1, light: 'golden' },        // POV: reward, confetti
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const sm = M.smooth, lin = (t) => t;
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

// ---------- lights (Down II) ----------
export const LIGHTS = {
  day: { az: 135, el: 50, sky: '#c4d6f2', ground: '#8a8262', hemi: 1.2, sun: '#fff1dc', sunI: 2.4, fog: '#cadcf0', fogNear: 60, fogFar: 700, skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.08, vig: 0.2, shadowExt: 3 },
  golden: { az: 120, el: 30, sky: '#ffe8cc', ground: '#8a7a62', hemi: 1.2, sun: '#ffe2bc', sunI: 2.4, fog: '#f4d6b0', fogNear: 60, fogFar: 650, skyTop: '#6f8fd8', skyHor: '#ffd2a0', sat: 1.04, vig: 0.24, shadowExt: 3, gain: '#fffaf2' },
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });

// ---------- staging ----------
const K = 0.00225, ST = 1.08, DOGYAW = Math.PI / 2, LONG = 3.2, SIDE = 0.5, LOOSE = 0.95;
const TRN = [0.52, 0, -0.66];                           // trainer card (hook / yes)
const HOOKD = [0.1, 0, -0.45];                          // puppy position in the hook / yes (faces the trainer)
const FRONTHAND = [-0.9, 0.75, -0.2];                   // where the line's handle is in the front shots (out of frame, camera side)
const CAMEYE = [-0.56, 0.3, 1.28];                      // the front camera (the puppy looks up at the trainer)
let CUR = [0, 1, 3], TCUR = TRN;
const axisOf = (pos) => { const ry = Math.atan2(CUR[0] - pos[0], CUR[2] - pos[2]); return [Math.cos(ry), 0, -Math.sin(ry)]; };
const tD = (P) => {
  const C = CUR, TR0 = TCUR, ax = axisOf(TR0), n = [-ax[2], 0, ax[0]];
  const d = [P[0] - C[0], P[1] - C[1], P[2] - C[2]], den = d[0] * n[0] + d[2] * n[2] || 1e-6;
  const s = ((TR0[0] - C[0]) * n[0] + (TR0[2] - C[2]) * n[2]) / den, Q = [C[0] + d[0] * s, C[1] + d[1] * s, C[2] + d[2] * s];
  return [300 - ((Q[0] - TR0[0]) * ax[0] + (Q[2] - TR0[2]) * ax[2]) / (K * ST), 975 - (Q[1] - TR0[1]) / (K * ST)];
};
const dP = ([dx, dy]) => { const ax = axisOf(TRN), s = (300 - dx) * K * ST; return [TRN[0] + ax[0] * s, (975 - dy) * K * ST, TRN[2] + ax[2] * s]; };
const REF = {};
export const calibrate = (poseFn, root) => {
  root.position.set(0, 0, 0); root.rotation.set(0, DOGYAW, 0); root.updateMatrixWorld(true);
  const far = [3, 0.3, 0];
  REF.sit = poseFn({ w: { sit: 1 }, look: far }); REF.stand = poseFn({ w: { stand: 1 }, look: far });
};
const noseAt = (x, z, yaw, pose = 'stand', dy = 0) => { const n = REF[pose].nose, c = Math.cos(yaw - DOGYAW), s = Math.sin(yaw - DOGYAW); return [x + n[0] * c + n[2] * s, n[1] + dy, z - n[0] * s + n[2] * c]; };

// ---------- where the puppy is: per-shot straight runs (x along the lawn, z = 0), reset at every hard cut ----------
const RUN = { lawn: [-1.8, 0.3], park: [-1.0, 1.0], farDog: [0.0, 0.9], stay: [-1.2, 1.2], ignore: [-0.8, 0.4], struggle: [0.0, 0.9], fix: [-1.0, 0.2] };
const dogP = (f) => {
  const S = shotAt(f), r = RUN[S.id];
  if (r) return { x: lerp(r[0], r[1], clamp((f - S.a) / (S.b - S.a))), z: 0, hx: 1, hz: 0, yaw: DOGYAW, yr: 0 };
  if (S.id === 'call') { const k = KF(f, [[w.then + 3, 0], [w.reward - 6, 1]], lin), yaw = -0.46 * (1 - sm(ramp(f, w.reward - 18, w.reward - 5))); return { x: lerp(1.0, 0, k), z: lerp(-2.0, 0, k), hx: Math.sin(yaw), hz: Math.cos(yaw), yaw, yr: 0 }; }   // trots along the camera's view axis toward us
  if (['rewardCall', 'tug', 'jackpot', 'povFinal'].includes(S.id)) return { x: 0, z: 0, hx: 0, hz: 1, yaw: 0, yr: 0 };
  return { x: 0, z: 0, hx: 1, hz: 0, yaw: DOGYAW, yr: 0 };
};
const DP = []; { let ph = 0; for (let f = 0; f <= TOTAL; f++) { const a = DP.length ? DP[f - 1] : dogP(0), b = dogP(f), same = f > 0 && shotAt(f).id === shotAt(f - 1).id, d = same ? Math.hypot(b.x - a.x, b.z - a.z) : 0; ph += d / 0.5; DP.push({ ...b, ph, sp: d * 30 }); } }
const DPf = (f) => DP[clamp(Math.round(f), 0, TOTAL)];
// line tension: only in the mistake, while the puppy faces away from the handle
const tension = (f) => (shotAt(f).id === 'struggle' ? sm(ramp(f, w.if + 6, w.if + 24)) * (1 - sm(ramp(f, w.go - 12, w.go - 1))) : 0);
const handOf = (f) => { const d = DPf(f); return [d.x - d.hx * LONG - d.hz * SIDE, 0.75, d.z - d.hz * LONG + d.hx * SIDE]; };   // trailing far behind the puppy, out of frame
const BALLP = (f) => { const d = DPf(f); return [d.x + 0.65 + 0.12 * Math.sin(f * 0.07), 0.1 + 0.2 * Math.abs(Math.sin(f * 0.17)), -0.95]; };   // bounces on the lawn behind the puppy's path

export const PROPS = { cones: [], bush: [0, -60], toy: [0, -60] };   // unused set pieces from the sibling project, never shown
export const propsVis = (f) => { const id = shotAt(f).id; return { cones: false, bush: false, toy: false, path: id === 'park' || id === 'farDog' || id === 'fix' }; };

// ---------- cameras ----------
const trackCam = (f, dist = 2.4, h = 0.8, ly = 0.32) => {   // side tracking rig: the puppy in profile, the world slides behind
  const S = shotAt(f), d = DPf(f), dd = dist - 0.001 * (f - S.a);
  return { pos: [d.x - d.hz * dd, h, d.z + d.hx * dd], look: [d.x + d.hx * 0.1, ly, d.z + d.hz * 0.1], fov: 44 };
};
const frontCam = (key = 0) => ({ pos: [-0.56, 0.88, 1.28 + key], look: [0, 0.32, 0.2], fov: 42 });   // fixed 3/4 front camera at the puppy's final spot
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.clip - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  clip: [{ f: w.clip, pos: [1.0, 0.52, 1.25], look: [0.1, 0.3, 0.0], fov: 38 }, { f: w.safe - 1, pos: [0.93, 0.52, 1.18], look: [0.1, 0.3, 0.0], fov: 38 }],
  yes: [{ f: w.say, pos: [0.3, 0.82, 2.3], look: [0.34, 0.5, -0.35], fov: 43 }, { f: w.then2 - 1, pos: [0.32, 0.78, 2.15], look: [0.35, 0.52, -0.35], fov: 43 }],
};
const FRONT = ['call', 'rewardCall', 'tug', 'jackpot', 'povFinal'];
export const camAt = (f) => {
  const S = shotAt(f); let c;
  if (CAMS[S.id]) c = camFromKeys(CAMS[S.id], f, {});
  else if (S.id === 'call') c = camFromKeys([{ f: S.a, ...frontCam(0.05), look: [0.35, 0.5, -0.9] }, { f: S.b, ...frontCam(0.0) }], f, {});   // tilts down with the puppy as it arrives
  else if (FRONT.includes(S.id)) { c = camFromKeys([{ f: S.a, ...frontCam(0.05) }, { f: S.b, ...frontCam(-0.1) }], f, {}); if (S.id === 'tug') c.look = add(c.look, [0.1, 0, 0]); }
  else if (S.id === 'lawn') c = trackCam(f, 3.4, 0.85, 0.3);
  else if (S.id === 'farDog') c = trackCam(f, 3.2, 0.95, 0.4);
  else if (S.id === 'ignore' || S.id === 'struggle') c = trackCam(f, 3.0, 0.9, 0.34);
  else c = trackCam(f);
  if (!CAMS[S.id]) { c.pos = add(c.pos, [0.005 * Math.sin(f * 0.11), 0.004 * Math.sin(f * 0.07 + 1), 0.005 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 0.5 * Math.sin(f * 0.05); }
  c.shadowAt = [c.look[0], 0.1, c.look[2]];
  return c;
};
const camBasis = (f) => { const C = camAt(f), fw = norm(sub(C.look, C.pos)), rt = norm(cross(fw, [0, 1, 0])), up = cross(rt, fw); return { C, fw, rt, up }; };
const handPt = (f, a, b, c) => { const { C, fw, rt, up } = camBasis(f); return add(C.pos, add(mul(fw, a), add(mul(rt, b), mul(up, c)))); };

// ---------- the puppy ----------
const TUG0 = w.swap + 12, TUG1 = w.staying - 14;   // the tug game: hand arrives, pulls, leaves
const tugPull = (f) => (f >= TUG0 && f < TUG1 ? 0.5 + 0.5 * Math.sin((f - TUG0) * 0.5) : 0);
const JT0 = 731;   // first jackpot treat: one every 8 frames, five treats
const jackpotOn = (f) => f >= JT0 && f < JT0 + 40;
export const dog3At = (f) => {
  const S = shotAt(f), d = DPf(f);
  const base = { pos: [d.x, 0, d.z], yaw: d.yaw, w: { stand: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.7, ears: 0.2 * Math.max(0, Math.sin(f * 0.09)) };
  const W = worldAt(f), happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const gk = clamp(d.sp / 0.5), gait = gk > 0.02 ? { phase: d.ph, amp: 24 + 8 * clamp((d.sp - 0.8) / 0.7), lift: 1.1, k: gk } : undefined;
  const ahead = [d.x + d.hx * 2.2, 0.12, d.z + d.hz * 2.2];
  const walk = { ...base, gait, look: ahead, neck: 0.5, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2 + 0.2 * Math.max(0, Math.sin(f * 0.14)) };
  const mouth = add(noseAt(d.x, d.z, d.yaw), [0.1, 0.05, 0]);
  switch (S.id) {
    case 'hook': return { ...base, pos: HOOKD, yaw: DOGYAW, w: { sit: 1 }, look: [TRN[0] - 0.05, 0.75, TRN[2]], neck: 0.9, wag: 0.8 * Math.sin(f * 0.5), tail: 0.2, ears: -0.2 };
    case 'clip': return { ...base, pos: [0, 0, 0], yaw: DOGYAW, look: [0.9, -0.15, 0.9], neck: 0.6, wag: 0.6 * Math.sin(f * 0.45), tail: 0.2, ears: -0.2, headTilt: 7 * Math.sin(Math.PI * ramp(f, w.clip + 18, w.long + 12)) };
    case 'lawn': case 'park': case 'stay': return walk;
    case 'call': return { ...base, gait, look: CAMEYE, neck: 0.35, wag: f >= w.reward - 8 ? 0.9 * Math.sin(f * 0.6) : 0.5 * Math.sin(f * 0.3), tail: 0.3 + 0.2 * Math.max(0, Math.sin(f * 0.14)), ears: f < w.then + 6 ? 0.5 : 0 };
    case 'rewardCall': {
      const t0 = w.reward + 6, ch = chompAt(f, t0), after = f >= t0 + 14, sit = 0.55 * sm(ramp(f, t0 + 26, t0 + 58));
      const around = lerp3(mouth, [-0.56, 0.12, 1.28], 0.5 + 0.5 * Math.sin((f - t0) * 0.06));
      return { ...base, w: { stand: 1 - sit, sit }, look: f < t0 + 16 ? (W.treat ? add(W.treat, [0, -0.1, 0]) : mouth) : around, neck: 0.45, jaw: ch || (after ? 0.25 : 0), ...(f > t0 ? happy : {}), blink: f > t0 && f < t0 + 6 ? 1 : base.blink, headTilt: after ? 5 * Math.sin(f * 0.09) : 0 };
    }
    case 'farDog': {
      const gl = sm(ramp(f, w.far - 4, w.far + 6)) * (1 - sm(ramp(f, w.far + 22, w.far + 34)));
      return { ...walk, look: lerp3(ahead, [d.x + 0.9, 0.3, -3.6], gl * 0.9) };
    }
    case 'tug': {
      const pull = tugPull(f), tg = W.tug;
      return { ...base, pos: [d.x, 0, d.z - 0.07 * pull], lean: -11 * pull + 2, look: add(noseAt(d.x, d.z, d.yaw), [0.0, -0.14 + 0.03 * pull, 0.35]), neck: 0.2, jaw: tg ? 0.35 : 0.25, headTilt: tg ? 10 * Math.sin(f * 0.5) : 0, wag: Math.sin(f * 0.7) * 1.1, tail: 0.35, ears: -0.1 * pull };
    }
    case 'ignore': {
      const glance = sm(ramp(f, w.big - 2, w.big + 6)) * (1 - sm(ramp(f, w.big + 14, w.big + 24))), b = BALLP(f);
      return { ...walk, look: lerp3(ahead, [b[0], 0.25, b[2]], glance * 0.7) };
    }
    case 'jackpot': return { ...base, look: W.treat ? add(W.treat, [0, -0.1, 0]) : mouth, neck: 1, jaw: jackpotOn(f) ? Math.abs(Math.sin((f - JT0) * Math.PI / 8)) : f >= JT0 + 40 ? 0.25 : 0, ...(f > JT0 - 2 ? happy : {}), headTilt: f > JT0 + 40 ? 5 * Math.sin(f * 0.09) : 0 };
    case 'struggle': {
      const b = BALLP(f), lk = sm(ramp(f, w.if + 2, w.if + 12)), tn = tension(f);
      return { ...base, gait, yaw: DOGYAW + 0.6 * lk, lean: tn * (-8 + 1.5 * Math.sin(f * 0.09)), look: lerp3(ahead, [b[0], 0.25, b[2]], lk), neck: 1.0, wag: 0.1, tail: 0.1 + 0.3 * Math.max(0, Math.sin(f * 0.15)), ears: 0.4 * tn };
    }
    case 'fix': return { ...walk, wag: 0.7 * Math.sin(f * 0.3) };
    case 'yes': return { ...base, pos: HOOKD, yaw: DOGYAW, w: { sit: 1 }, look: [TRN[0] - 0.05, 0.75, TRN[2]], neck: 0.9, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    case 'povFinal': {
      const t0 = w.reward3 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, w: { sit: 1 }, look: W.treatHide || !W.treat ? add(noseAt(d.x, d.z, d.yaw, 'sit'), [0.5 * d.hx, -0.4, 0.5 * d.hz]) : add(W.treat, [0, -0.25, 0]), neck: 0.7, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};
// the far calm dog (same model, recoloured darker): only in the far-dog shot, behind the puppy as seen from the camera
export const dog2At = (f) => {
  if (shotAt(f).id !== 'farDog') return null;
  const d = DPf(f);
  return { pos: [d.x + 0.9, 0, -3.6], yaw: 0.5, w: { sit: 1 }, look: [d.x - 1, 0.2, -3], neck: 0.6, breath: 0.3 + 0.3 * Math.sin(f * 0.12), blink: blinkAt(f, 5) ? 1 : 0, tail: 0.1, wag: 0.2 * Math.sin(f * 0.1), ears: 0.3 * Math.max(0, Math.sin(f * 0.07)) };
};

// ---------- hands, treat, leash, trail ----------
const treatPath = (f) => {
  const S = shotAt(f), d = DPf(f);
  const mouth = (pose = 'stand') => add(noseAt(d.x, d.z, d.yaw, pose), [0.05 * Math.sin(d.yaw), 0.075, 0.07 * Math.cos(d.yaw)]);
  const rest = (g) => handPt(g, 0.75, -0.02, -0.95);
  switch (S.id) {
    case 'rewardCall': { const t0 = w.reward + 6; return KF(f, [[S.a, rest(f)], [t0 - 3, mouth()], [t0 + 12, mouth()], [t0 + 28, rest(f)]]); }
    case 'jackpot': { const p = KF(f, [[S.a, rest(f)], [JT0 - 3, mouth()], [JT0 + 40, mouth()], [JT0 + 56, rest(f)]]), k = f >= JT0 && f < JT0 + 40 ? 0.5 - 0.5 * Math.cos(2 * Math.PI * (f - JT0) / 8) : 0; return add(p, mul([-0.04, -0.12, 0.1], k)); }   // five quick, separate deliveries: the hand dips away between treats
    case 'povFinal': { const t0 = w.reward3 + 2; return KF(f, [[w.then2, rest(f)], [t0 - 3, mouth('sit')], [t0 + 7, mouth('sit')], [t0 + 22, rest(f)]]); }
  }
  return null;
};
// the tug rope: held by the POV hand, bitten by the puppy; a = puppy end, b = hand end
const tugRope = (f) => {
  const S = shotAt(f); if (S.id !== 'tug') return null;
  const d = DPf(f), pull = tugPull(f), off = handPt(f, 0.75, 0.1, -0.95);
  const { rt, up, fw } = camBasis(f), m = add(noseAt(d.x, d.z, d.yaw), [-0.03, 0.005, 0.01 - 0.03 * pull]), dir = norm(add(mul(rt, 0.6), add(mul(up, -0.55), mul(fw, -0.1))));
  const e = sm(ramp(f, S.a, S.a + 12)) * (1 - sm(ramp(f, TUG1, TUG1 + 12)));
  const b = lerp3(off, add(m, mul(dir, 0.27 + 0.06 * pull)), e), a = m, sag = 0.12 * (1 - pull) + 0.01, mid = add(mul(add(a, b), 0.5), [0, -sag, 0]);
  const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, u = 1 - t; pts.push([0, 1, 2].map((k) => u * u * a[k] + 2 * u * t * mid[k] + t * t * b[k])); }
  return { a, b, pts };
};
const frontShot = (f) => FRONT.includes(shotAt(f).id);
const colAt = (f) => {
  const t = tension(f), win = (a, b) => (f >= a && f < b ? sm(ramp(f, a, a + 6)) * (1 - sm(ramp(f, b - 6, b))) : 0);
  const green = Math.max(win(w.park - 8, w.park + 50), win(w.best - 8, w.around + 10), win(w.level - 8, w.reps + 30)), red = sm(ramp(t, 0.5, 0.92));
  const base = [0.24, 0.43, 0.71], g = [0.25, 0.75, 0.42], r = [0.88, 0.25, 0.22];
  const c = lerp3(lerp3(base, g, green * (1 - red)), r, red);
  return '#' + c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
};
// footprint dots along the lawn: the route we are about to walk (lawn shot, from "walk away")
const DOTS = []; for (let x = -1; x < 4; x += 0.26) DOTS.push([x, 0.02, 0]);
export const worldAt = (f) => {
  const S = shotAt(f), W = {}, d = DPf(f);
  CUR = camAt(f).pos;
  const t = treatPath(f); if (t) W.treat = t;
  const slack = LOOSE * (1 - tension(f)) + (S.id === 'struggle' ? 0.14 : 0.02);
  if (S.id === 'hook' || S.id === 'yes') W.leash = { hand: trainerHandWorld(f), slack: 0.4, col: colAt(f) };
  else if (S.id === 'clip') W.leash = { hand: f < w.safe - 4 ? [-0.55, 0.95, 0.65] : [-1.0, 0.75, 0.5], slack: LOOSE, col: colAt(f) };
  else if (frontShot(f)) { W.leash = { hand: FRONTHAND, slack, col: colAt(f) }; if (t) W.hand = { treat: t, pose: 'pinch', side: 0.16 }; }
  else { const h = handOf(f); h[1] = lerp(0.75, 0.08, tension(f)); W.leash = { hand: h, slack, col: colAt(f) }; }
  const tr = tugRope(f); if (tr) { W.tug = tr; W.hand = { at: tr.b, pose: 'fist', side: 0.16 }; }
  if (S.id === 'lawn' && f >= w.walk - 4) { W.trail = DOTS.filter((p) => p[0] > d.x + 0.4); W.trailCol = '#ffffff'; }
  if (S.id === 'ignore' || S.id === 'struggle') W.ball = BALLP(f);
  const hide = (S.id === 'rewardCall' && f >= w.reward + 19) || (S.id === 'povFinal' && f >= w.reward3 + 4)
    || (S.id === 'jackpot' && (f >= JT0 + 40 || (jackpotOn(f) && (f - JT0) % 8 >= 5)));
  if (hide) W.treatHide = true;
  return W;
};
const HANDD = { hook: [272, 810], yes: [272, 810] };
function trainerHandWorld(f) { const S = shotAt(f); CUR = camAt(f).pos; return dP(HANDD[S.id] || HANDD.hook); }

// ---------- the 2D trainer (hook + yes, kneeling) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerHook = (f) => {
  const hi = idle(f, 3); CUR = camAt(f).pos;
  return { hose: true, kneel: 1, expr: f > 36 ? 'grin' : 'smile', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt, bob: hi.bob * 40, lean: 2, near: { to: tD(trainerHandWorld(f)), hand: 'fist', bend: -1 }, far: 'hip' };
};
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5; CUR = camAt(f).pos;
  return { hose: true, kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 3, bob: hi.bob * 40,
    near: { to: tD(trainerHandWorld(f)), hand: 'fist', bend: -1 }, far: { to: [225, 700 - 50 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: 1 }, click: clickOn ? 1 : 0 };
};
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), d = DPf(f);
  if (S.id === 'hook' || S.id === 'yes') return { focus: Math.hypot(C.pos[0] - 0.3, C.pos[1] - 0.5, C.pos[2] + 0.3), cinf: 5 };
  if (S.id === 'clip') return { focus: Math.hypot(C.pos[0] - 0.5, C.pos[1] - 0.3, C.pos[2]), cinf: 6 };
  return { focus: Math.hypot(C.pos[0] - d.x, C.pos[1] - 0.25, C.pos[2] - d.z), cinf: 4 };
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
  const out = [], S = shotAt(f), d = DPf(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.12, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const sparkle = (t0, at, i) => { const k = ramp(f, t0, t0 + 16); if (k > 0 && k < 1) out.push(FX('sp' + i + q(k, 2), (p) => T.fxSpark2(p, 1), [at[0] + 0.12 * Math.cos(i * 2.1), at[1] + 0.05 + 0.1 * Math.sin(i * 1.7) + 0.1 * k, at[2]], 0.07 * Math.sin(Math.PI * k), { alpha: q(1 - k * k, 2) })); };
  const HEAD = add(noseAt(d.x, d.z, d.yaw, S.id === 'povFinal' ? 'sit' : 'stand'), [0, 0.06, 0]);
  const above = [d.x, 0.8, d.z], aboveF = [0.28, 0.5, 0.1];
  if (S.id === 'hook') badge(T.fxCheck, 'ok', w.you + 4, w.you + 40, [0.0, 0.82, -0.42], 0.22);
  if (S.id === 'clip') badge(T.fxCheck, 'ok', w.line + 4, w.safe - 2, [0.0, 0.5, 0.45], 0.11);
  if (S.id === 'lawn') badge(T.fxCheck, 'ok', w.area + 2, w.walk - 6, above, 0.32);
  if (S.id === 'rewardCall') { hearts(w.reward + 7, HEAD); badge(T.fxCheck, 'ok', w.catchW, w.next - 8, aboveF, 0.14); }
  if (S.id === 'park') badge(T.fxCheck, 'ok', w.park, w.dogF - 4, above, 0.23);
  if (S.id === 'farDog') badge(T.fxCheck, 'ok', w.far + 6, w.swap - 6, above, 0.3);
  if (S.id === 'tug') { hearts(w.game + 2, HEAD, 3, 0.06); hearts(w.tug + 6, HEAD, 3, 0.06); }
  if (S.id === 'stay') { badge(T.fxCheck, 'ok', w.best, w.ignore - 14, above, 0.23); }
  if (S.id === 'ignore') badge(T.fxCheck, 'ok', w.big + 10, w.give - 4, above, 0.29);
  if (S.id === 'jackpot') {
    for (const t0 of [JT0 + 2, JT0 + 12, JT0 + 22, JT0 + 32]) hearts(t0, HEAD, 3, 0.07);
    for (let i = 0; i < 5; i++) sparkle(JT0 + 4 + i * 8, HEAD, i);
    if (f >= JT0 + 8) for (let i = 0; i < 2; i++) { const t = q(ramp(f, JT0 + 8 + i * 12, JT0 + 52 + i * 12), 2); if (t > 0 && t < 1) out.push(FX('jc' + i + t, (p) => T.fxConfetti(p, t, i + 3), add(HEAD, [0.0, -0.05, 0.0]), 0.3, { order: 7 })); }
  }
  if (S.id === 'struggle') badge(T.fxCross, 'no', w.struggles + 4, w.go - 8, above, 0.28);
  if (S.id === 'fix') badge(T.fxCheck, 'ok', w.level, w.say - 8, above, 0.23);
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'call') bubble('bc', 'Come!', '', '#ffffff', w.then, w.then + 26, [0.5, 0.7, -1.2], 0.3);
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), add(dP([185, 640]), [0, 0.1, 0.12]), 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward3 + 3, HEAD, 4, 0.06);
    if (f >= w.reward3) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward3 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(noseAt(d.x, d.z, d.yaw, 'sit'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
