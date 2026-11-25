// "Weave" — teach the dog to weave through the trainer's legs. 3D puppy + 3D trainer legs (legs3d.js) in the training shots, 2D kneeling trainer card in the hook + yes. 1049 frames, timed to voice.mp3.
// Word frames (voice.mp3 = approved narrator, voice.mp3.words.json, round(s*30); sentence-start words taken from silence_end because whisper dates them early):
// Let's 0 teach 8 dog 17 weave 28 legs 46 | Grab 83 treats 88 space 104 walk 118 | Stand 153 feet 169 wide 175 apart 182 |
// Hold 217 (whisper 214) treat 223 behind 229 leg 246 guide 265 dog 277 through 284 gap 295 | Reward 326 (whisper 322) other 344 side 348 |
// Next 389 (whisper 381) step 404 forward 414 foot 437 pass 453 under 459 | Reward 495 each 499 pass 511 | Now 551 switch 553 hands 562 lure 584 walk 644 |
// Say 679 weave 684 go 711 | If 745 hesitates 757 bumps 779 legs 792 steps 815 big 834 | Take 866 small 868 slow 878 bigger 938 dogs 944 | Say 979 yes 985 click 1002 reward 1024 | end 1048.
// RE-TIME: update TOTAL + the word table `w` (every shot / action is keyed to `w`). Hard cuts only, one sun (day; golden in yes + final).
// Legs shots (stand..fix): ONE legs timeline for the whole stretch (feet planted exactly), the camera tracks the trainer's pelvis; the puppy's path is in the trainer's frame (follows the feet while it moves,
// stays put in the world while it stands, so nothing skates). The lure hand hangs from above the frame (arm to the top edge), never from the camera.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { legsTimeline } from './legs3d.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1049, DECK = 0;
const w = {
  legs: 46, grab: 83, space: 104, stand1: 153, hold: 217, hes: 757, guide: 265, reward1: 326, next: 389, reward2: 495, now: 551, say: 679, weave: 684, if: 745, bumps: 779, big: 834,
  take: 866, slow: 878, say2: 979, yes: 985, click: 1002, reward3: 1024, end: 1048,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },               // trainer leads the puppy to a treat, chomp
  { id: 'setup', a: w.grab, b: w.stand1 - 1, light: 'day' },       // treat jar, hard cut to the puppy walking on the mat
  { id: 'stand', a: w.stand1, b: w.hold - 1, light: 'day' },       // legs: feet step wide apart
  { id: 'guide', a: w.hold, b: w.reward1 - 1, light: 'day' },      // hand behind the leg, puppy goes through the gap and around the left leg
  { id: 'reward', a: w.reward1, b: w.next - 1, light: 'day' },     // reward on the other side
  { id: 'step', a: w.next, b: w.reward2 - 1, light: 'day' },       // trainer steps forward as the puppy passes under, around the other leg
  { id: 'pass', a: w.reward2, b: w.now - 1, light: 'day' },        // reward each pass
  { id: 'switch', a: w.now, b: w.say - 1, light: 'day' },          // other hand, lure back through as the trainer walks
  { id: 'cue', a: w.say, b: w.if - 1, light: 'day' },              // cue "weave" bubble, keeps weaving
  { id: 'mistake', a: w.if, b: w.take - 1, light: 'day' },         // MISTAKE: big steps, puppy hesitates, cross
  { id: 'fix', a: w.take, b: w.say2 - 1, light: 'day' },           // small slow steps, smooth pass, check
  { id: 'yes', a: w.say2, b: w.reward3 - 1, light: 'golden' },     // trainer: "yes" + click
  { id: 'povFinal', a: w.reward3, b: TOTAL - 1, light: 'golden' }, // POV: reward, confetti
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
const HOOKP = [0, MAT, -0.48];
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
  REF.stand = poseFn({ w: { stand: 1 }, look: far });
  root.position.set(...DOGPOS);
};
const NOSE = (r) => REF[r].nose;
const MOUTH = () => add(NOSE('sit'), [0.05, -0.02, 0]);   // final reward at the sitting puppy's mouth

// ---------- the trainer's legs: ONE timeline for the training shots (trainer faces +z, toward the camera) ----------
const Z0 = -0.5, HW = 0.21;
const st = (foot, a, b, fwd, lift, side) => ({ foot, a, b, fwd, lift, side });
const PLAN = legsTimeline({ at: [0, Z0], yaw: 0, y: MAT, stance: 0.14, steps: [
  st('R', 166, 182, 0, 0.06, -(HW - 0.14)), st('L', 184, 200, 0, 0.06, HW - 0.14),   // stand: feet wide apart
  st('R', 400, 424, 0.14), st('L', 436, 462, 0.14),                                   // step forward as the puppy passes under
  st('R', 575, 599, 0.14), st('L', 611, 635, 0.14), st('R', 646, 670, 0.14), st('L', 686, 710, 0.14),   // walking while it weaves
  st('R', 772, 802, 0.18, 0.12), st('L', 816, 842, 0.18, 0.12),                         // MISTAKE: big steps
  st('R', 884, 920, 0.07, 0.05), st('L', 926, 962, 0.07, 0.05),                       // small slow steps
] });
const LEGS_A = w.stand1, LEGS_B = w.say2 - 1;
export const legsAt = (f) => (f >= LEGS_A && f <= LEGS_B ? PLAN(f) : null);
const Zm = (f) => { const p = PLAN(f); return (p.L.z + p.R.z) / 2; };   // pelvis z (feet midpoint; x stays 0)

// ---------- the puppy's path: segments in the trainer's frame (v = across, u = toward the camera) ----------
// 'follow': moves with the feet; 'fixed': pinned to the world at the segment start. Each segment's first point is re-anchored so the puppy never jumps.
const LAP = (s) => [[0.38 * s, 0.18], [0.2 * s, 0.12], [0.02 * s, 0.08], [0, -0.12], [0, -0.3], [-0.2 * s, -0.36], [-0.38 * s, -0.28], [-0.42 * s, -0.06], [-0.4 * s, 0.12], [-0.38 * s, 0.18]];   // front -> gap -> behind -> around the other leg -> front, shallow so the puppy stays visible
const SEGS = [
  { a: w.stand1, b: w.stand1, pts: [[-0.2, 0.2]], mode: 'fixed' },
  { a: 254, b: 338, pts: [[-0.2, 0.2], [-0.16, 0.2], [-0.1, 0.14], [0, 0.08], [0, -0.12], [0, -0.3], [0.2, -0.36], [0.38, -0.28], [0.42, -0.06], [0.4, 0.12], [0.38, 0.18]], mode: 'follow' },   // through the gap, around the left leg
  { a: 380, b: 486, pts: LAP(1), mode: 'follow' },        // through the gap again, around the right leg
  { a: 548, b: 636, pts: LAP(-1), mode: 'follow' },       // other hand: through the gap, around the left leg
  { a: 648, b: 736, pts: LAP(1), mode: 'follow' },        // cue + weave: around the right leg
  { a: 742, b: 772, pts: [[-0.38, 0.18], [-0.28, 0.3], [-0.1, 0.4], [0, 0.4]], mode: 'follow' },   // walks up to the gap and stops (hesitates)
  { a: 884, b: 966, pts: [[0, 0.4], [0, 0.25], [0, 0.08], [0, -0.12], [0, -0.3], [-0.2, -0.36], [-0.38, -0.28], [-0.42, -0.06], [-0.4, 0.12], [-0.38, 0.18]], mode: 'follow' },   // small steps: smooth pass
];
const prog = (t) => 0.55 * t + 0.45 * sm(t);
{ let prev = null;   // re-anchor each segment's first point to where the previous one ended
  for (const s of SEGS) {
    s.anchA = Zm(s.a);
    if (prev) s.pts[0] = [prev.v, prev.u + prev.anch - s.anchA];
    const e = s.pts[s.pts.length - 1]; prev = { v: e[0], u: e[1], anch: s.mode === 'fixed' ? s.anchA : Zm(s.b) };
    s.end = [e[0], e[1] + prev.anch];
  } }
const segPos = (s, f) => { const t = clamp((f - s.a) / Math.max(1, s.b - s.a)), [v, u] = spline(s.pts, prog(t)); return [v, u + (s.mode === 'fixed' ? s.anchA : Zm(f))]; };
const posAt = (f) => {   // world x,z of the puppy in the legs shots
  let s = SEGS[0];
  for (const g of SEGS) if (f >= g.a) s = g;
  return f >= s.b ? s.end : segPos(s, f);
};
const PW = [], SPD = [], HD = [], PH = [], FX = [];   // per frame: position, speed (m/s), heading, gait phase, smoothed x (camera follows it)
{ let ph = 0, prev = posAt(LEGS_A);
  for (let f = 0; f < TOTAL; f++) {
    const p = posAt(clamp(f, LEGS_A, LEGS_B)), d = Math.hypot(p[0] - prev[0], p[1] - prev[1]); ph += d / 0.5; PW.push(p); SPD.push(d * 30); PH.push(ph); prev = p;
  }
  let h = null; const raw = [];
  for (let f = 0; f < TOTAL; f++) { const a = PW[Math.max(0, f - 3)], b = PW[Math.min(TOTAL - 1, f + 3)]; raw.push(Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.012 ? Math.atan2(b[0] - a[0], b[1] - a[1]) : null); }
  for (let f = 0; f < TOTAL; f++) { if (raw[f] !== null) h = raw[f]; HD.push(h); }
  const first = HD.find((x) => x !== null) ?? 0; for (let f = 0; f < TOTAL && HD[f] === null; f++) HD[f] = first;
  for (let f = 1; f < TOTAL; f++) { let d = HD[f] - HD[f - 1]; d -= Math.round(d / (2 * Math.PI)) * 2 * Math.PI; HD[f] = HD[f - 1] + d; }   // unwrap
  for (let f = 0; f < TOTAL; f++) { let s = 0, n = 0; for (let g = f - 8; g <= f + 8; g++) { s += PW[clamp(g, 0, TOTAL - 1)][0]; n++; } FX.push(s / n); }
}
const ROOT = (f) => { const p = PW[clamp(f, 0, TOTAL - 1)]; return [p[0], MAT, p[1]]; };
const DIR = (f) => [Math.sin(HD[f]), Math.cos(HD[f])];
const NF = () => REF.stand.nose[0], NY = () => REF.stand.nose[1];

// ---------- the lure: the POV hand (arm up from the bottom edge) holds a treat just ahead of the nose; it slides in, leads, rewards, then drops out toward the camera ----------
// The hand is only shown while the puppy is in FRONT of the legs (never reaching through them); `show` = frame ranges where it is in.
const LURE = [
  { eat: 342, side: 1, show: [[230, 262], [322, 366]] },          // treat held out, then the reward on the other side
  { eat: 500, side: 1, show: [[390, 412], [466, 520]] },          // step forward + reward each pass
  { eat: null, side: 2, show: [[552, 596], [622, 676], [712, 738]] },   // other hand: lure back through while it walks
  { eat: null, side: 1, show: [[872, 912], [944, 978]] },         // small slow steps
];
const lureAt = (f) => {
  let L = null, A = 0;
  for (const l of LURE) for (const [a, b] of l.show) { const k = sm(ramp(f, a, a + 6)) * (1 - ramp(f, b - 3, b)); if (k > A) { A = k; L = l; } }
  if (!L) return null;
  const lead = clamp(f + (L.eat && f > L.eat - 6 ? 0 : 9), 0, TOTAL - 1), r = ROOT(lead), d = DIR(lead);
  A *= sm(clamp((d[1] - 0.5) / 0.3));   // the hand only shows while the puppy faces the camera (never hidden behind the dog with a bare arm)
  if (A < 0.02) return null;
  const off = L.eat ? 0.1 - 0.07 * ramp(f, L.eat - 12, L.eat) : 0.1, sx = L.side === 1 ? 1 : -1;
  const tip = [r[0] + d[0] * (NF() + off) + 0.1 * sx, NY() - 0.08, r[2] + d[1] * (NF() + off)];   // beside the nose (the hand never covers the face)
  const away = [tip[0], -0.2, tip[2]];   // where the hand waits, below the frame toward the camera
  return { p: [lerp(away[0], tip[0], A), lerp(away[1], tip[1], A), lerp(away[2], tip[2], A)], A, side: L.side };
};
const EATING = (f) => LURE.find((l) => l.eat && f >= l.eat + 2 && f < l.eat + 24);

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { stand: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85 };
  const W = worldAt(f);
  if (S.id === 'hook') {
    const x = lerp(-0.14, 0.16, sm(ramp(f, 6, 40))), sp = (lerp(-0.14, 0.16, sm(ramp(f + 1, 6, 40))) - x) * 30, ch = chompAt(f, w.legs + 3), gk = clamp(Math.abs(sp) / 0.3);
    return { ...base, pos: [x, MAT, HOOKP[2]], gait: gk > 0.02 ? { phase: (x + 0.14) / 0.5, amp: 24, lift: 1.1, k: gk } : undefined, look: W.treat || [0.5, 0.1, HOOKP[2]], neck: 0.9, jaw: f >= w.legs + 17 ? 0.3 : ch,
      wag: Math.sin(f * 0.8) * (f > w.legs ? 1.1 : 0.5), tail: f > w.legs ? 0.35 : 0.15, blink: f > w.legs + 3 && f < w.legs + 9 ? 1 : base.blink };
  }
  if (S.id === 'setup') {
    const n = f - w.space, T1 = w.stand1 - w.space - 8, x = lerp(-0.25, 0.05, sm(ramp(n, 0, T1))), sp = (lerp(-0.25, 0.05, sm(ramp(n + 1, 0, T1))) - x) * 30, gk = clamp(sp / 0.3);
    return { ...base, pos: [x, MAT, 0], yaw: Math.PI / 2 - 0.25, gait: f >= w.space && gk > 0.02 ? { phase: (x + 0.25) / 0.5, amp: 24, lift: 1.1, k: gk } : undefined, look: [x + 1.5, 0.1, 0.5], neck: 0.5, aimEyes: true, wag: 0.6 * Math.sin(f * 0.5), tail: 0.25, ears: 0.1 * Math.sin(f * 0.1) };
  }
  if (S.id === 'yes') {
    return { ...base, w: { sit: 1 }, look: [TRN[0] + 0.05, 0.95, TRN[2]], neck: 1, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
  }
  if (S.id === 'povFinal') {
    const t0 = w.reward3 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
    return { ...base, w: { sit: 1 }, look: W.treatHide || !W.treat ? [0.9, 0.24, 0.3] : W.treat, neck: 0.8, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
  }
  // ----- legs shots: the puppy follows PW (position), HD (heading), SPD (gait) -----
  const r = ROOT(f), gk = clamp(SPD[f] / 0.4), tr = W.lureA > 0.5 ? W.treat : null;
  const d = { ...base, pos: r, yaw: HD[f], gait: gk > 0.02 ? { phase: PH[f], amp: 24, lift: 1.1, k: gk } : undefined, aimEyes: true, neck: 0.6, wag: 0.6 * Math.sin(f * 0.35), tail: 0.2,
    look: tr ? [tr[0], Math.min(tr[1], 0.3), tr[2]] : [r[0] + Math.sin(HD[f]) * 2, 0.15, r[2] + Math.cos(HD[f]) * 2] };
  if (f < 262) { d.neck = 1; d.headTilt = f < 232 ? 10 * Math.sin(Math.PI * ramp(f, 170, 215)) : 0; if (!tr) d.look = [r[0] + 0.3, 0.2, r[2] - 1.5]; }   // stands and watches the feet step apart
  for (const L of LURE) if (L.eat && f >= L.eat && f < L.eat + 40) { d.jaw = f >= L.eat + 16 ? 0.3 : chompAt(f, L.eat); d.blink = f > L.eat && f < L.eat + 6 ? 1 : d.blink; d.wag = Math.sin(f * 0.8) * 1.1; d.tail = 0.35; }
  if (f >= 790 && f < 896) { const k = sm(ramp(f, 790, 812)) * (1 - sm(ramp(f, 842, 864))); d.w = { stand: 1 - k, sit: k }; }
  if (S.id === 'mistake') {   // hesitates: ears back, tail down, head low, a small head tilt; flinches when the big shoe swings past
    const fl = Math.sin(Math.PI * ramp(f, w.bumps - 6, w.bumps + 12));
    d.ears = -0.5; d.tail = -0.1; d.wag = 0.1 * Math.sin(f * 0.3); d.neck = 0.45; d.headTilt = 8 * Math.sin(Math.PI * ramp(f, w.hes, w.hes + 40)) - 6 * fl;
    if (f >= 742 && f < 866) d.look = f < 806 ? [r[0] - 0.1 * Math.sin(f * 0.05), 0.12, r[2] - 1] : [camAt(f).pos[0], 0.3, camAt(f).pos[2]];   // after the shoe, it looks back at you
    d.ears = -0.5 + 0.3 * Math.sin(f * 0.17); d.wag = 0.35 * Math.sin(f * 0.22); d.tail = 0.05; d.neck = 0.6; d.blink = f % 41 < 4 ? 1 : d.blink;
  }
  if (S.id === 'fix') { d.wag = 0.9 * Math.sin(f * 0.6); d.tail = 0.3; d.ears = 0.1; }
  return d;
};

// ---------- 3D props: lure hand + treat ----------
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  if (S.id === 'hook') {
    const x = lerp(-0.14, 0.16, sm(ramp(f, 6, 40)));
    W.treat = add([x, 0, HOOKP[2]], [REF.stand.nose[0] + 0.1, REF.stand.nose[1] - 0.08, 0]);
    if (f >= w.legs + 3) W.treatHide = true;
  }
  if (S.id === 'povFinal') {
    const M0 = MOUTH(); W.treat = KF(f, [[w.reward3, add(M0, [0.3, 0.14, 0.05])], [w.reward3 + 2, M0], [w.reward3 + 14, M0], [w.reward3 + 30, add(M0, [0.3, -0.12, 0.3])]]);
    W.hand = { treat: W.treat, side: 0.22 }; if (f >= w.reward3 + 6) W.treatHide = true;
  }
  const t = f >= LEGS_A && f <= LEGS_B ? lureAt(f) : null;
  if (t && t.A > 0.85) {
    W.treat = t.p; W.lureA = t.A; if (EATING(f)) W.treatHide = true;
    if (t.side === 1) W.hand = { treat: t.p, side: 0.24 }; else W.hand2 = { treat: t.p, side: -0.24 };
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
    const kind = f > w.legs + 5 ? 'palm' : f >= w.legs - 5 ? 'give' : 'treat', off = kind === 'give' ? [19, -12] : [25, -3], s = 2.08 * 1.05, sy = Math.cos(ang) < 0 ? -1 : 1;
    const Wr = [T[0] - (Math.cos(ang) * off[0] * s - Math.sin(ang) * off[1] * sy * s), T[1] - (Math.sin(ang) * off[0] * s + Math.cos(ang) * off[1] * sy * s)];
    o.far = { to: Wr, hand: kind, bend: 1, rot: ang * 180 / Math.PI }; o.lean = 10;
  } else o.far = 'present';
  return o;
};

// ---------- cameras ----------
// Legs shots: keys are RELATIVE to the trainer's pelvis (z) and 0.45 x the puppy's smoothed x (see camAt). Low and close; the top of the frame stays below the trousers' crotch.
// relative camera key: x follow of the puppy + pelvis z. camY = camera height, D = distance to the legs; the look-at is solved so the frame top stays at YTOP (below the trousers' crotch, ~0.93 m).
const YTOP = 0.86, DEG = Math.PI / 180;
const LC = (camY, D, lz = 0, fov = 44) => { const e = Math.atan((YTOP - camY) / D) / DEG, pitch = fov / 2 - e; return { pos: [0, camY, D], look: [0, camY - (D - lz) * Math.tan(pitch * DEG), lz], fov }; };
const lk = (f, A, B, b) => [{ f, ...A }, { f: b, ...B }];
const WALK = (f0, f1) => lk(f0, LC(0.3, 1.65), LC(0.3, 1.6), f1);
const WALK2 = (f0, f1, dx) => lk(f0, { ...LC(0.3, 1.65), pos: [dx, 0.3, 1.65] }, { ...LC(0.3, 1.6), pos: [dx * 0.9, 0.3, 1.6] }, f1);
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.space - 2, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },   // jar ... hard cut ...
    { f: w.space - 1, pos: [1.22, 0.52, 1.0], look: [0.04, 0.2, 0.0], fov: 38 }, { f: w.stand1 - 1, pos: [1.1, 0.47, 0.9], look: [0.04, 0.19, 0.0], fov: 38 }],   // ... to the puppy on the mat
  stand: lk(w.stand1, LC(0.3, 1.8), LC(0.3, 1.75), w.hold - 1),
  guide: WALK(w.hold, w.reward1 - 1),
  reward: WALK2(w.reward1, w.next - 1, 0.1),
  step: WALK2(w.next, w.reward2 - 1, -0.1),
  pass: WALK2(w.reward2, w.now - 1, 0.1),
  switch: WALK2(w.now, w.say - 1, -0.1),
  cue: WALK(w.say, w.if - 1),
  mistake: lk(w.if, { ...LC(0.3, 1.9), pos: [0.1, 0.3, 1.9] }, { ...LC(0.3, 1.85), pos: [0.09, 0.3, 1.85] }, w.take - 1),
  fix: WALK(w.take, w.say2 - 1),
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.reward3 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  povFinal: [{ f: w.reward3, pos: [1.34, 0.84, 0.72], look: [0.17, 0.26, 0.0], fov: 42 }, { f: TOTAL - 1, pos: [1.29, 0.81, 0.69], look: [0.18, 0.26, 0.0], fov: 42 }],
};
const FOL = { stand: 0.4 };   // how much the camera follows the puppy sideways (default 0.9)
const LEGSHOT = (id) => !['hook', 'setup', 'yes', 'povFinal'].includes(id);
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (LEGSHOT(S.id)) { const z = Zm(f); let x = (FOL[S.id] ?? 0.4) * FX[f]; const lean = 0;   // the frame leans toward the hand so it never touches the edge
    c.pos = [c.pos[0] + x, c.pos[1], c.pos[2] + z]; c.look = [c.look[0] + x, c.look[1], c.look[2] + z]; c.shadowAt = [PW[f][0], 0.2, PW[f][1]]; }
  else c.shadowAt = [0.1, 0.2, 0];
  if (S.id === 'povFinal') { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (S.id === 'hook' || S.id === 'yes') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'povFinal') return { focus: dist(C.pos, [0.3, 0.3, 0]), cinf: 6 };
  return { focus: dist(C.pos, ROOT(f)), cinf: 3 };
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
const BUB_YES = [-0.12, 0.78, -0.45];
const FXC = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  // badges / bubble sit above the puppy's head (follow its path), full size, pop in place
  const C = camAt(f), fw = (() => { const v = C.look.map((x, i) => x - C.pos[i]), n = Math.hypot(...v); return v.map((x) => x / n); })(), rt = (() => { const v = [-fw[2], 0, fw[0]], n = Math.hypot(...v); return v.map((x) => x / n); })(), up2 = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
  const ndcY = (P) => { const d = P.map((x, i) => x - C.pos[i]), z = d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2]; return (d[0] * up2[0] + d[1] * up2[1] + d[2] * up2[2]) / (z * Math.tan(C.fov * DEG / 2)); };
  const lowered = (P, cap, sc) => { let y = P[1]; while (y > 0.2 && ndcY([P[0], y + 1.1 * sc, P[2]]) > cap) y -= 0.02; return [P[0], y, P[2]]; };   // keep the badge inside the frame (top margin)
  const badge = (fn, key, a, b, s) => { if (f >= a && f < b) { const k = pop(a, b), r = ROOT(a); if (k > 0.02) out.push(FXC(key + k, (p) => fn(p, 1), lowered([ROOT(f)[0], 0.9, ROOT(f)[2]], 0.92, s), s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FXC('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FXC(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'hook') hearts(w.legs + 4, [0.38, 0.36, -0.42], 3, 0.07);
  for (const L of LURE) if (L.eat && f >= L.eat + 2 && f < L.eat + 32) { const r = ROOT(L.eat + 2); hearts(L.eat + 2, [r[0], 0.4, r[2]], 3, 0.1); }
  if (S.id === 'cue') { const r = ROOT(w.weave); bubble('bd', 'Weave!', 'as they go', '#ffffff', w.weave - 2, w.weave + 40, lowered([C.look[0], 0.7, ROOT(f)[2]], 0.75, 0.26), 0.26); }
  if (S.id === 'mistake') badge(T.fxCross, 'no', w.bumps - 2, w.bumps + 34, 0.26);
  if (S.id === 'fix') badge(T.fxCheck, 'ok', w.slow + 4, w.slow + 70, 0.26);
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FXC('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    const HEAD = add(NOSE('sit'), [-0.08, 0.06, 0]);
    hearts(w.reward3 + 3, HEAD, 4, 0.06);
    if (f >= w.reward3) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward3 + i * 3, TOTAL - 1), 2); out.push(FXC('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('sit'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
