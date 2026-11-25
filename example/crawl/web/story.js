// "Crawl" — a belly crawl while the puppy stays down (elbows and hips on the mat). 3D puppy (dog-puppy.glb) + the 2D bald trainer, 1157 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3, voice.mp3.words.json, round(s*30)): Let's 0 teach 8 dog 17 crawl 29 | Grab 67 treats 67 soft 88 non-slip 96 surface 121 |
// Ask 155 lie 178 down 182 | Hold 224 treat 232 floor 247 just 255 nose 286 | Slide 322 slowly 337 forward 346 | Reward 395 tiniest 409 scoot 429 stay 452 down 458 |
// Then 494 (silence_end 492; whisper says 498) lure 498 farther 519 time 539 | Say 579 crawl 585 starts 616 moving 624 | If 660 stands 670 up 679 |
// the 704 treat 705 fast 728 too 739 high 763 | Keep 795 floor 808 slower 837 | Only 880 (silence_end 880; whisper says 876) elbows 907 hips 926 down 946 |
// Stop 985 (silence_end 986; whisper says 979) uncomfortable 1017 | Say 1060 (silence_end 1060; whisper says 1064) yes 1065 click 1093 | Then 1128 (silence_end) reward 1132 | end 1156.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and
// action is keyed to `w` (+/- a few frames), so nothing else needs to change. Pointers: HAND in POV shots, PAW cursor in floating shots.
// Hard cuts only, no flashes. Puppy at the origin, nose toward +x. The crawl gait (crawlAt) is the new part: see dogrig.js POSES.crawl.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1157, DECK = 0;
// key word frames (first frame of the word)
const w = {
  crawl1: 29, grab: 67, soft: 88, nonslip: 96, surface: 121, ask: 155, down1: 182, hold: 224, floor1: 247, nose: 286, slide: 322, forward: 346,
  reward1: 395, scoot: 429, stay: 452, then1: 494, farther: 519, say1: 579, crawl2: 585, moving: 624, if: 660, stands: 670, up: 679, treat: 704, fast: 728, high: 763,
  keep: 795, floor2: 808, slower: 837, only: 880, elbows: 907, hips: 926, down2: 946, stop: 985, uncomf: 1017, say2: 1060, yes: 1065, click: 1093, then2: 1128, reward2: 1132, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },               // trainer lures; the puppy crawls three small steps and chomps
  { id: 'setup', a: w.grab, b: w.ask - 1, light: 'day' },          // glide from the treat jar to the mat, check on "non-slip"
  { id: 'lieDown', a: w.ask, b: w.hold - 1, light: 'day' },        // POV: sit -> down on the lure, quick reward
  { id: 'hold', a: w.hold, b: w.slide - 1, light: 'day' },         // POV low: treat on the floor just in front of the nose, check
  { id: 'slide', a: w.slide, b: w.reward1 - 1, light: 'day' },     // POV 3/4: slide it slowly forward, the puppy crawls three steps
  { id: 'reward', a: w.reward1, b: w.then1 - 1, light: 'day' },    // POV: one tiny scoot, reward, check on "stay down"
  { id: 'farther', a: w.then1, b: w.say1 - 1, light: 'day' },      // floating: paw cursor lures a longer crawl (pink trail)
  { id: 'cue', a: w.say1, b: w.if - 1, light: 'day' },             // POV: "Crawl!" bubble, the puppy starts moving, reward
  { id: 'popUp', a: w.if, b: w.keep - 1, light: 'day' },           // MISTAKE: treat too fast + high (red), puppy stands up, cross
  { id: 'fix', a: w.keep, b: w.only - 1, light: 'day' },           // treat on the floor, slower (green), check
  { id: 'elbows', a: w.only, b: w.stop - 1, light: 'day' },        // ground-level: rings on elbows then hips, reward only while they are down
  { id: 'rest', a: w.stop, b: w.say2 - 1, light: 'day' },          // relaxed down, sleepy blink, sigh: stop if uncomfortable
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
const HOOKP = [-0.1, MAT, -0.48];                      // hook: puppy close to the trainer's card plane (his hand reaches the floor), left of him so it has room to crawl
const SH = (P) => [P[0] + HOOKP[0], P[1], P[2] + HOOKP[2]];   // shift a point into the hook position
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
// lure waypoints: just in front of the nose, straight down to the floor, then the reward spot in front of the down puppy
const N_SIT = () => add(NOSE('sit'), [0.06, -0.005, 0]);
const LOW = () => [NOSE('sit')[0] + 0.06, MAT + 0.05, 0];            // straight below the sitting nose
const FLOOR = () => [NOSE('down')[0] + 0.045, MAT + 0.05, 0];      // low, on the floor right in front of the down puppy's nose
const REWARD = () => [NOSE('down')[0] + 0.06, NOSE('down')[1] - 0.09, 0];   // reward spot the down puppy can reach (just below its nose)
const FLs = (s) => add(FLOOR(), [s, 0, 0]);                          // the floor lure point after the puppy has crawled s metres
const RW = (s) => add(REWARD(), [s, 0, 0]);
const START = [0.95, 0.12, 0.45];                                    // a hand parks its treat here: just below the POV frame

// ---------- the crawl gait ----------
// Belly crawl: the puppy stays in `down`. Half 0 = the left front paw reaches (body still). Half n = the other front paw reaches while the
// planted one is pulled back and the body slides forward ZD (the stance sweep IS the slide, so no foot skate). Hind paws (hl/hr, -HK..HK)
// push back the same ZD in step with the diagonal front paw, then settle to neutral. ZD = measured front reach (m). Steps ease in and out.
const ZD = 0.069, HK = 0.38;
const CR = {   // per shot: f0 = first frame, M = number of body slides, half = frames per half-step
  hook: { f0: 2, M: 3, half: 11 }, slide: { f0: 324, M: 3, half: 17 }, reward: { f0: 398, M: 1, half: 15 }, farther: { f0: 500, M: 4, half: 13 },
  cue: { f0: 606, M: 2, half: 14 }, popUp: { f0: 648, M: 1, half: 11 }, fix: { f0: 798, M: 3, half: 17 }, elbows: { f0: 884, M: 3, half: 16 },
};
const legsAt = (n, e, sw, M) => {   // leg parameters for step n >= 1 at eased progress e and lift sw
  const odd = n % 2 === 1, last = n === M, c = { fl: 0, fr: 0, hl: 0, hr: 0, lfl: 0, lfr: 0, lhl: 0, lhr: 0 };
  const st = 1 - e, swg = last ? 0 : e;
  if (odd) { c.fl = st; c.fr = swg; c.lfr = last ? 0 : sw; c.hr = -HK + 2 * HK * e; c.hl = HK - 2 * HK * e; c.lhl = sw; }
  else { c.fr = st; c.fl = swg; c.lfl = last ? 0 : sw; c.hl = -HK + 2 * HK * e; c.hr = HK - 2 * HK * e; c.lhr = sw; }
  return c;
};
const crawlAt = (f, p) => {
  const out = { s: 0, c: null };
  if (!p || f < p.f0) return out;
  const h = (f - p.f0) / p.half, n = Math.floor(h), u = h - n, e = sm(u), sw = Math.sin(Math.PI * u);
  if (n === 0) { out.c = { fl: e, fr: 0, hl: HK * e, hr: -HK * e, lfl: sw, lfr: 0, lhl: sw * 0.5, lhr: sw * 0.5 }; return out; }
  if (n <= p.M) { out.c = legsAt(n, e, sw, p.M); out.s = ZD * (n - 1 + e); return out; }
  out.s = ZD * p.M;
  if (n === p.M + 1) { const c = legsAt(p.M, 1, 0, p.M), k = 1 - e; out.c = { fl: 0, fr: 0, hl: c.hl * k, hr: c.hr * k, lfl: 0, lfr: 0, lhl: sw * 0.5, lhr: sw * 0.5 }; }
  return out;
};
const shiftIn = (id, f) => crawlAt(f, CR[id]).s;
const shiftNow = (f) => shiftIn(shotAt(f).id, f);
// the lure leads the puppy by a few frames; once the crawl is over it lifts to the reward spot at frame tc
const leadTreat = (id, f, tc, lead = 9) => {
  const Sf = CR[id].M * ZD;
  return f < tc - 5 ? FLs(shiftIn(id, f + lead)) : KF(f, [[tc - 5, FLs(Sf)], [tc, RW(Sf)]]);
};
// chomp frames (the reward lands at the mouth at these frames)
const HE = 48, EA1 = w.down1 + 5, TR = w.scoot + 3, TF = w.farther + 51, TC = w.moving + 26, TX = w.slower + 31, TE = w.down2 + 4;

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { down: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85 };
  const W = worldAt(f), cr = crawlAt(f, CR[S.id]);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const onMat = { pos: [cr.s, MAT, 0], crawl: cr.c };
  const eat = (t0) => ({ jaw: f >= t0 + 15 ? 0.3 : chompAt(f, t0), ...(f > t0 + 1 ? happy : {}), blink: f > t0 + 1 && f < t0 + 7 ? 1 : base.blink });
  const lureLook = W.treat || add(FLOOR(), [0.05, 0.08, 0]);
  switch (S.id) {
    case 'hook': return { ...base, pos: [HOOKP[0] + cr.s, MAT, HOOKP[2]], crawl: cr.c, look: W.treat || SH(add(FLOOR(), [0.05, 0.1, 0])), neck: 1, ...eat(HE), ears: f < HE ? -0.3 : 0 };
    case 'setup': {
      return { ...base, w: { sit: 1 }, look: [0.9, -0.1 + 0.03 * Math.sin(f * 0.05), 0.3], neck: 1, headTilt: 10 * Math.sin(Math.PI * ramp(f, 100, 140)), wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    }
    case 'lieDown': {
      const dn = sm(ramp(f, w.ask + 3, w.down1));
      return { ...base, w: { sit: 1 - dn, down: dn }, look: lureLook, neck: 1, ears: -0.3 * (1 - dn), ...eat(EA1) };
    }
    case 'hold': {
      return { ...base, look: lureLook, neck: 1, headTilt: 5 * Math.sin(f * 0.07), wag: 0.5 * Math.sin(f * 0.3), tail: 0.2, ears: -0.15 * Math.sin(Math.PI * ramp(f, w.nose - 4, w.nose + 14)) };
    }
    case 'slide': return { ...base, ...onMat, look: lureLook, neck: 1, wag: 0.3 * Math.sin(f * 0.3), tail: 0.2 };
    case 'reward': return { ...base, ...onMat, look: lureLook, neck: 1, ...eat(TR) };
    case 'farther': return { ...base, ...onMat, look: lureLook, neck: 1, ...eat(TF) };
    case 'cue': {
      const perk = f >= w.crawl2 && f < w.crawl2 + 24 ? -0.7 * Math.sin(Math.PI * ramp(f, w.crawl2, w.crawl2 + 24)) : 0;
      return { ...base, ...onMat, look: lureLook, neck: 1, ears: perk - 0.15, headTilt: f >= w.crawl2 && f < w.crawl2 + 30 ? 8 * Math.sin(Math.PI * ramp(f, w.crawl2, w.crawl2 + 30)) : 0, ...eat(TC) };
    }
    case 'popUp': {
      const up = sm(sm(ramp(f, w.if + 6, w.up + 10)));   // slow start, slow settle: no snap
      return { ...base, ...onMat, pos: lerp3([cr.s, MAT, 0], [cr.s + 0.03, MAT, 0], up), crawl: cr.c, w: { down: 1 - up, stand: up },
        look: W.treat ? [W.treat[0], Math.min(W.treat[1], 0.3 + 0.16 * up), W.treat[2]] : null, neck: f < w.if + 8 ? 1 : 0.3 - 0.06 * up, ears: -0.3 * up + 0.2 * Math.sin(f * 0.13), tail: 0.4 * up,
        wag: up > 0.5 ? Math.sin(f * 0.8) : 0.2 * Math.sin(f * 0.3), blink: f >= w.up + 6 && f < w.up + 11 ? 1 : base.blink };
    }
    case 'fix': return { ...base, ...onMat, look: lureLook, neck: 1, ...eat(TX) };
    case 'elbows': return { ...base, ...onMat, look: lureLook, neck: 1, ...eat(TE) };
    case 'rest': {
      const lid = f > w.stop + 40 && f < w.say2 - 6 ? 0.5 + 0.15 * Math.sin(f * 0.05) : blinkAt(f, 8) ? 1 : 0;
      return { ...base, look: add(NOSE('down'), [0.25, -0.22, 0.05 + 0.04 * Math.sin(f * 0.03)]), neck: 1, blink: lid, breath: 0.35 + 0.35 * Math.sin(f * 0.12), ears: 0.5 * sm(ramp(f, w.stop + 8, w.stop + 30)), wag: 0.2 * Math.sin(f * 0.1) };
    }
    case 'yes': {
      return { ...base, look: [TRN[0] + 0.05, 0.5, TRN[2]], neck: 0.6, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0,
        jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    }
    case 'povFinal': {
      const t0 = w.reward2 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, look: W.treatHide || !W.treat ? [0.9, 0.24, 0.3] : W.treat, neck: 0.8, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4,
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
    case 'hook': { const t = leadTreat('hook', f, HE); return SH(t); }
    case 'lieDown': return KF(f, [[w.ask, [0.75, 0.3, 0.25]], [w.ask + 8, N_SIT()], [w.ask + 16, N_SIT()], [w.down1 - 6, LOW()], [w.down1 + 1, FLs(0)], [EA1, RW(0)], [EA1 + 14, RW(0)], [EA1 + 34, START]]);
    case 'hold': return KF(f, [[w.hold, START], [w.hold + 20, add(FLs(0), [0.07, 0.08, 0.06])], [w.floor1 - 2, FLs(0)]]);
    case 'slide': return FLs(shiftIn('slide', f + 10));
    case 'reward': return f < w.reward1 + 14 ? KF(f, [[w.reward1, START], [w.reward1 + 14, FLs(0)]]) : f < TR + 14 ? leadTreat('reward', f, TR, 8) : KF(f, [[TR + 14, RW(ZD)], [TR + 34, START]]);
    case 'farther': return f < w.then1 + 8 ? KF(f, [[w.then1, add(FLs(0), [0.1, 0.07, 0])], [w.then1 + 8, FLs(0)]]) : leadTreat('farther', f, TF);
    case 'cue': return f < w.say1 + 14 ? KF(f, [[w.say1, START], [w.say1 + 14, FLs(0)]]) : leadTreat('cue', f, TC, 8);
    case 'popUp': return KF(f, [[w.if, FLs(shiftIn('popUp', w.if + 9))], [w.if + 6, add(FLs(ZD), [0.03, 0.0, 0])], [w.up + 4, [0.53, 0.44, 0.0]], [w.fast - 2, [0.54, 0.45, 0.0]], [w.fast + 8, [0.57, 0.47, 0.0]], [w.keep - 1, [0.58, 0.48, 0.0]]]);
    case 'fix': return f < w.keep + 8 ? KF(f, [[w.keep, add(FLs(0), [0.1, 0.03, -0.06])], [w.keep + 8, FLs(0)]]) : leadTreat('fix', f, TX, 10);
    case 'elbows': return f < w.only + 6 ? KF(f, [[w.only, add(FLs(0), [0.1, 0.05, 0.05])], [w.only + 6, FLs(0)]]) : leadTreat('elbows', f, TE, 9);
    case 'povFinal': return KF(f, [[w.then2, add(RW(0), [0.3, 0.14, 0.05])], [w.reward2 + 2, add(NOSE('down'), [0.05, -0.02, 0])]]);   // hand lingers to the end
  }
  return null;
};
const EAT = { farther: TF + 2, fix: TX + 2, elbows: TE + 2 };   // paw shots: frame the treat is eaten
const HANDSHOTS = ['lieDown', 'hold', 'slide', 'reward', 'cue', 'povFinal'];
const PAWSHOTS = { farther: '#ff8fb0', popUp: '#ff5a5a', fix: '#6fe08a', elbows: '#ff8fb0' };
// POV shots and the front-camera hook have NO trail (a column of beads paints over the face/chest). Paw shots trail along the floor.
const TRAIL = { farther: [w.farther - 18, treatPath], popUp: [w.if + 4, treatPath], fix: [w.keep + 8, treatPath] };
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f);
  if (t) W.treat = t;
  const tr = TRAIL[S.id];
  if (tr && f > tr[0] && tr[1](f)) {
    const pts = []; let last = null;
    const stop = { farther: TF - 6, fix: TX - 6 }[S.id] ?? f;   // trails end at the floor point: the final lift to the mouth is not trailed
    for (let g = tr[0]; g <= Math.min(f, stop); g += 0.5) { const p = tr[1](g); if (!p) break; if (!last || Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]) > 0.03) { pts.push(p); last = p; } }
    W.trail = pts.slice(0, -1);
  }
  if (t && HANDSHOTS.includes(S.id)) W.hand = { treat: t, side: S.id === 'povFinal' ? 0.22 : 0.16 };
  const eatAt = { hook: HE, lieDown: EA1, reward: TR, cue: TC, farther: TF, fix: TX, elbows: TE }[S.id];
  if ((eatAt !== undefined && f >= eatAt + 3) || (S.id === 'povFinal' && f >= w.reward2 + 4)) W.treatHide = true;
  if (PAWSHOTS[S.id]) {
    W.trailCol = PAWSHOTS[S.id];
    const pt = t && (S.id === 'popUp' ? t : add(t, [0.04, 0, 0]));   // the cursor stays ahead of the nose, never over the face or legs
    if (t) W.paw = { pos: W.treatHide ? add(pt, [0.3 * sm(ramp(f, EAT[S.id], EAT[S.id] + 14)), 0.7 * sm(ramp(f, EAT[S.id], EAT[S.id] + 14)), 0]) : pt, s: 0.8 };   // after the chomp the paw flies up and out of frame
  }
  if (S.id === 'elbows' && f >= w.elbows - 2 && f < w.down2 - 2) {   // gold rings: both elbows on "elbows", both hips on "hips"
    const s = shiftNow(f), hips = f >= w.hips - 2, base = hips ? REF.down.hip : null;
    const pts = hips ? [[base[0], base[2] - 0.05], [base[0], base[2] + 0.05]] : REF.down.elb.map((e) => [e[0], e[2]]);
    const t0 = hips ? w.hips - 2 : w.elbows - 2;
    W.rings = pts.map((p, i) => { const u = ((f - t0) / 22 + i * 0.5) % 1; return { p: [p[0] + s, MAT + 0.006, p[1]], r: 0.04 + 0.1 * u, a: (1 - u) * 0.95 }; });
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

// ---------- cameras ----------
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  // from the treat jar on the stool down to the puppy sitting on the non-slip mat
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.soft - 1, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },   // jar ... hard cut ...
    { f: w.soft, pos: [1.22, 0.52, 1.0], look: [0.04, 0.2, 0.0], fov: 38 }, { f: w.ask - 1, pos: [1.1, 0.47, 0.9], look: [0.04, 0.19, 0.0], fov: 38 }],   // ... to the puppy on the mat
  // POV = the trainer's eyes, kneeling in front of the puppy, looking down
  lieDown: [{ f: w.ask, pos: [1.28, 0.88, 0.56], look: [0.2, 0.22, 0.0], fov: 42 }, { f: w.hold - 1, pos: [1.22, 0.82, 0.53], look: [0.22, 0.16, 0.0], fov: 42 }],
  hold: [{ f: w.hold, pos: [1.3, 0.8, 0.58], look: [0.24, 0.19, 0.0], fov: 42 }, { f: w.slide - 1, pos: [1.25, 0.77, 0.55], look: [0.25, 0.18, 0.0], fov: 42 }],
  slide: [{ f: w.slide, pos: [1.3, 0.9, 0.5], look: [0.22, 0.22, 0.0], fov: 43 }, { f: w.reward1 - 1, pos: [1.24, 0.84, 0.47], look: [0.24, 0.16, 0.0], fov: 43 }],
  reward: [{ f: w.reward1, pos: [1.3, 0.8, 0.58], look: [0.24, 0.19, 0.0], fov: 42 }, { f: w.then1 - 1, pos: [1.25, 0.77, 0.55], look: [0.25, 0.18, 0.0], fov: 42 }],
  farther: [{ f: w.then1, pos: [1.32, 0.66, 0.66], look: [0.18, 0.27, 0.0], fov: 42 }, { f: w.say1 - 1, pos: [1.26, 0.62, 0.63], look: [0.19, 0.23, 0.0], fov: 42 }],
  cue: [{ f: w.say1, pos: [1.3, 0.9, 0.6], look: [0.2, 0.33, 0.0], fov: 42 }, { f: w.if - 1, pos: [1.24, 0.84, 0.57], look: [0.22, 0.24, 0.0], fov: 42 }],
  // low side angle with sky so "too high" reads
  popUp: [{ f: w.if, pos: [0.84, 0.5, 1.3], look: [0.34, 0.36, 0.05], fov: 44 }, { f: w.keep - 1, pos: [0.78, 0.6, 1.45], look: [0.34, 0.42, 0.05], fov: 44 }],
  fix: [{ f: w.keep, pos: [1.32, 0.7, -0.56], look: [0.18, 0.22, 0.0], fov: 40 }, { f: w.only - 1, pos: [1.27, 0.67, -0.53], look: [0.19, 0.21, 0.0], fov: 40 }],
  // ground level from the side: elbows and hips on the mat read clearly
  elbows: [{ f: w.only, pos: [1.38, 0.46, 0.74], look: [0.14, 0.24, 0.0], fov: 40 }, { f: w.stop - 1, pos: [1.32, 0.44, 0.71], look: [0.15, 0.22, 0.0], fov: 40 }],
  rest: [{ f: w.stop, pos: [1.25, 0.42, 0.95], look: [0.14, 0.18, 0.0], fov: 47 }, { f: w.say2 - 1, pos: [0.3, 0.46, 1.45], look: [0.1, 0.18, 0.0], fov: 47, path: [[0.85, 0.44, 1.3]] }],
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then2 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  povFinal: [{ f: w.then2, pos: [1.34, 0.84, 0.72], look: [0.17, 0.2, 0.0], fov: 42 }, { f: TOTAL - 1, pos: [1.29, 0.81, 0.69], look: [0.18, 0.2, 0.0], fov: 42 }],
};
const FOLLOW = { slide: 0.7, reward: 0.7, farther: 0.7, cue: 0.7, fix: 1.0, elbows: 0.7 };   // only the LOOK-AT target drifts with the crawl (camera keys are the locked Down II ones)
const BIAS = { farther: 0.2, popUp: 0.05, elbows: 0.16, fix: 0.1, rest: -0.12 };   // look-at nudges: keep the dog and the cursor inside the frame
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  const k = FOLLOW[S.id];
  const bias = S.id === 'rest' ? -0.1 + 0.1 * ramp(f, w.stop, w.say2 - 1) : BIAS[S.id] || 0;
  if (k || bias) { const d = [(k || 0) * shiftNow(f) + bias, 0, 0]; c.look = add(c.look, d); }
  if (S.id.startsWith('pov') || HANDSHOTS.includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1 + (k ? shiftNow(f) : 0), 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), s = shiftNow(f), head = REF.down ? add(REF.down.head, [s, 0, 0]) : [0.3, 0.3, 0];
  if (S.id === 'hook' || S.id === 'yes') return { focus: dist(C.pos, [0.3 + (S.id === "hook" ? s - 0.1 : 0), 0.35, -0.15]), cinf: 6 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'rest') return { focus: dist(C.pos, [0.1, 0.22, 0]), cinf: 9 };
  if (S.id === 'elbows') return { focus: dist(C.pos, [0.18 + s, 0.12, 0]), cinf: 8 };
  if (S.id === 'popUp') return { focus: dist(C.pos, [0.1, 0.3, 0]), cinf: 6 };
  if (S.id === 'fix' || S.id === 'farther') return { focus: dist(C.pos, [0.12 + s, 0.15, 0]), cinf: 4 };
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
const BUB_CUE = [0.2, 0.3, -0.02], BUB_YES = [-0.12, 0.78, -0.45];   // bubble anchor points (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  // rewards: hearts pop off the puppy's head
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.12, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = (s) => add(NOSE('down'), [-0.08 + s, 0.06, 0]);
  if (S.id === 'hook') hearts(HE + 1, add(HEAD(CR.hook.M * ZD), [HOOKP[0], 0.0, HOOKP[2] + 0.06]), 3, 0.07);
  if (S.id === 'setup') badge(T.fxCheck, 'ok', w.nonslip + 6, w.ask, [0.5, 0.1, 0.5], 0.11);
  if (S.id === 'lieDown') hearts(EA1 + 1, HEAD(0));
  if (S.id === 'hold') badge(T.fxCheck, 'ok', w.nose + 2, w.slide, [0.2, 0.34, 0.1], 0.13);
  if (S.id === 'reward') { hearts(TR + 1, HEAD(ZD)); badge(T.fxCheck, 'ok', w.stay, w.then1, [0.2 + ZD, 0.4, 0.1], 0.13); }
  if (S.id === 'farther') hearts(TF + 1, HEAD(4 * ZD));
  if (S.id === 'cue') hearts(TC + 1, HEAD(2 * ZD));
  // cue bubbles (James's newer look): pop in near the top of frame on the spoken cue / the marker
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'cue') bubble('bd', 'Crawl!', 'as it moves', '#ffffff', w.crawl2 - 2, w.moving + 8, BUB_CUE, 0.2);
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'popUp') badge(T.fxCross, 'no', w.high - 3, w.keep, [0.2, 0.6, 0.1], 0.2);
  if (S.id === 'fix') { hearts(TX + 1, HEAD(3 * ZD)); badge(T.fxCheck, 'ok', w.floor2 - 2, w.only, [0.1, 0.26, 0.12], 0.14); }
  if (S.id === 'elbows') { hearts(TE + 1, HEAD(3 * ZD)); badge(T.fxCheck, 'ok', w.down2, w.stop, [0.2 + 3 * ZD, 0.34, 0.1], 0.13); }
  if (S.id === 'rest' && f >= w.stop + 28 && f < w.stop + 56) { const t = q(ramp(f, w.stop + 28, w.stop + 56), 2); out.push(FX('si' + t, (p) => T.fxSigh(p, t), add(NOSE('down'), [0.08, 0.02, 0.04]), 0.12)); }
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward2 + 3, HEAD(0), 4, 0.06);
    if (f >= w.reward2) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward2 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('down'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
