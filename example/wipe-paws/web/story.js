// "Wipe paws" — paw-scrape on the mat (doormat): touch, wait for the scrape, reward, cue, the mistake (rewarding standing), towel. 3D puppy + the 2D bald trainer, 1013 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3, round(s*30); sentence starts taken from silencedetect silence_end, not whisper):
// Let's 0 wipe 29 paws 41 | Grab 77 treats 80 doormat 112 | Put 148 mat 153 door 185 | Reward 211 paw 229 touches 248 | Next 283 wait 303 scrape 319 |
// The 349 drags 373 across 386 mat 402 reward 419 | Reward 456 scrape 474 soon 503 more 527 | Now 565 wipe 576 paws 585 steps 623 |
// If 666 rewarding 677 standing 683 only 724 standing 740 | Wait 773 scrape 784 then 809 reward 811 fast 820 | Keep 859 towel 866 muddy 892 | Say 930 yes 935 click 961 | then 983 reward 989 | end 1012.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and
// action is keyed to `w` (+/- a few frames). Pointers: HAND in POV shots.
// The rig's paw path is one line (r: 0 sit -> 1 shake). A "scrape" = quick forward lift (r 0->.45) then a slower drag back to the mat (r .45->0).
// Hard cuts only, no flashes. Puppy at the origin, nose toward +x.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1013, DECK = 0;
// key word frames (first frame of the word)
const w = {
  wipe1: 29, paws1: 41, grab: 77, door1: 112, put: 148, door: 185, reward1: 211, touches: 248, next: 283, scrape1: 319,
  the: 349, drags: 373, mat2: 402, reward2: 419, reward3: 456, scrape2: 474, more: 527, now: 565, wipe2: 576, steps: 623,
  if: 666, rewarding: 677, only: 724, wait2: 773, scrape3: 784, then: 809, fast: 820, keep: 859, towel: 866,
  towel2: 897, say2: 930, yes: 935, click: 961, then2: 983, reward5: 989, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },               // trainer + puppy scrapes its paw on the mat
  { id: 'setup', a: w.grab, b: w.put - 1, light: 'day' },          // treat jar, hard cut to the doormat on its own
  { id: 'door', a: w.put, b: w.reward1 - 1, light: 'day' },        // doormat on the floor near the door (prop only): check
  { id: 'touch', a: w.reward1, b: w.next - 1, light: 'day' },      // any paw that touches the mat: reward
  { id: 'wait', a: w.next, b: w.the - 1, light: 'day' },           // wait for a little scrape
  { id: 'scrape', a: w.the, b: w.reward3 - 1, light: 'day' },      // the paw drags across the mat, reward
  { id: 'more', a: w.reward3, b: w.now - 1, light: 'day' },        // reward every scrape: more of them
  { id: 'cue', a: w.now, b: w.if - 1, light: 'day' },              // say "wipe paws" (bubble) as the dog steps on
  { id: 'mistake', a: w.if, b: w.wait2 - 1, light: 'day' },        // MISTAKE: rewarding plain standing (red cross)
  { id: 'fix', a: w.wait2, b: w.keep - 1, light: 'day' },          // wait for the scrape, reward fast (check)
  { id: 'towel', a: w.keep, b: w.towel2 - 1, light: 'day' },       // towel on its stool for muddy days
  { id: 'towel2', a: w.towel2, b: w.say2 - 1, light: 'day' },      // ... second angle
  { id: 'yes', a: w.say2, b: w.then2 - 1, light: 'golden' },       // trainer: "yes" + click
  { id: 'final', a: w.then2, b: TOTAL - 1, light: 'golden' },      // POV: reward
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
// one scrape stroke (22 frames from a): quick forward lift (l), plant the paw on the mat (p), then drag it back under the shoulder
const stroke = (f, a) => (f < a || f >= a + 22 ? { p: 0, l: 0 } : f < a + 6 ? { p: 0, l: R(f, a, a + 6) } : f < a + 9 ? { p: R(f, a + 6, a + 9), l: 1 - R(f, a + 6, a + 9) } : { p: 1 - R(f, a + 9, a + 22), l: 0 });
const strokes = (f, list) => list.reduce((s, a) => { const k = stroke(f, a); return { p: s.p + k.p, l: s.l + k.l }; }, { p: 0, l: 0 });

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
const DOGPOS = [0, MAT, 0], DOGYAW = Math.PI / 2;      // puppy standing on the mat, nose toward +x
const TRN = [0.52, MAT, -0.66];
const HOOKP = [0.16, MAT, 0.0];                           // hook: puppy on the mat beside the trainer
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
  REF.stand = poseFn({ w: { stand: 1 }, look: far });
  REF.pw = poseFn({ w: { wipeR: 1 }, look: far }).bR;   // right paw planted forward on the floor (start of the drag)
  REF.p0 = REF.stand.bR;                                   // ... and under the shoulder (end of the drag)
  root.position.set(...DOGPOS);
};
const NOSE = () => REF.stand.nose;
const MOUTH = () => add(NOSE(), [0.12, -0.08, 0.06]);                    // treat delivered at the standing puppy's mouth
const HEAD = () => add(REF.stand.head, [0.07, 0.1, 0]);                 // hearts anchor above the head
const PAWD = (u) => lerp3(REF.pw, REF.p0, u);                             // paw ball along the drag (u 0 forward .. 1 back)
const PAWUP = () => add(REF.pw, [0, 0.05, 0]);
// a hand waiting / leaving: low and off to the right of the camera, so the arm stays attached to the frame edge on entry / exit
const BELOW = (f, P) => { const c = camAt(f), fw = [c.look[0] - c.pos[0], c.look[2] - c.pos[2]], n = Math.hypot(fw[0], fw[1]), F = [fw[0] / n, fw[1] / n], R3 = [-F[1], F[0]];
  const lat = (P[0] - c.pos[0]) * R3[0] + (P[2] - c.pos[2]) * R3[1] + 0.45;
  return [c.pos[0] + F[0] * 0.45 + R3[0] * lat, 0.1, c.pos[2] + F[1] * 0.45 + R3[1] * lat]; };

// ---------- paw raise: { p: planted-forward weight, l: lifted weight } (blend stand -> lift -> plant -> stand) ----------
const raiseAt = (f) => {
  switch (shotAt(f).id) {
    case 'hook': return strokes(f, [w.wipe1 - 5, w.wipe1 + 17]);
    case 'touch': { const a = w.reward1 + 21, up = R(f, a, a + 8), dn = R(f, w.touches - 4, w.touches + 2), back = R(f, w.touches + 22, w.touches + 36);   // lift, step down onto the mat, back
      return { l: up * (1 - dn), p: dn * (1 - back) }; }
    case 'wait': return { l: 0.2 * Math.sin(Math.PI * ramp(f, w.next + 26, w.the - 4)), p: 0 };                // a hopeful lift while it waits
    case 'scrape': return strokes(f, [w.drags - 8, w.drags + 14]);
    case 'more': return strokes(f, [w.reward3 + 8, w.reward3 + 36, w.reward3 + 64]);
    case 'cue': return strokes(f, [w.steps - 14, w.steps + 8]);
    case 'fix': { const k = strokes(f, [w.scrape3 - 2]); return { l: k.l + 0.2 * Math.sin(Math.PI * ramp(f, w.wait2, w.scrape3 - 4)), p: k.p }; }
  }
  return { p: 0, l: 0 };
};

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f), { p, l } = raiseAt(f);
  const flick = Math.max(0, Math.sin(f * 0.11 + 1)) ** 12;   // an ear flick every ~2 s
  const base = { pos: [0.004 * Math.sin(f * 0.037), MAT, 0.004 * Math.sin(f * 0.029 + 1)], yaw: DOGYAW + 0.035 * Math.sin(f * 0.043), ears: -0.25 * flick, w: { stand: 1 - p - l, wipeR: p, liftR: l }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0,
    breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 1 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const lookC = (P, dy = 0) => [P[0], Math.min(P[1] + dy, 0.34), P[2]];
  const rew = rewardOf(f), eat = rew + 4;                                              // chomp 4 frames after the treat arrives
  const chomp = rew ? { jaw: f >= eat + 14 ? 0.3 : chompAt(f, eat), blink: f > eat && f < eat + 6 ? 1 : base.blink, ...(f > eat ? happy : { wag: 0.8 * Math.sin(f * 0.5) }) } : {};
  const atPaw = lookC(PAWD(0.4), 0.05);
  const toTreat = W.treat ? lookC(W.treat, 0.02) : atPaw;
  switch (S.id) {
    case 'hook': {
      return { ...base, pos: HOOKP, look: [0.5, 0.3, TRN[2]], ...(f > w.paws1 ? happy : { wag: 0.5 * Math.sin(f * 0.4) }), ears: f > 12 ? -0.3 : 0 };
    }
    case 'setup': case 'door': case 'towel': case 'towel2': {
      return { ...base, pos: [6, 0, 6] };   // prop-only shots: the puppy is off camera
    }
    case 'touch': case 'scrape': case 'more': case 'fix': {
      return { ...base, look: toTreat, wag: 0.7 * Math.sin(f * 0.3), ears: -0.25 + 0.3 * Math.sin(f * 0.07), headTilt: 5 * Math.sin(f * 0.045), ...chomp };
    }
    case 'wait': {
      return { ...base, look: lookC(PAWD(0.4), 0.05 + 0.02 * Math.sin(f * 0.17)), wag: 0.7 * Math.sin(f * 0.3), ears: -0.25 + 0.3 * Math.sin(f * 0.07), neck: 0.8 + 0.2 * Math.sin(f * 0.05), headTilt: 6 * Math.sin(f * 0.045) + 6 * Math.sin(Math.PI * ramp(f, w.next + 20, w.the)) };
    }
    case 'cue': {
      const perk = f >= w.now - 4 && f < w.now + 22 ? -0.7 * Math.sin(Math.PI * ramp(f, w.now - 4, w.now + 22)) : 0;
      return { ...base, look: f < w.steps - 16 ? [1.0, 0.1, 0.2 + 0.15 * Math.sin(f * 0.05)] : atPaw, ears: perk - 0.2, headTilt: f >= w.now && f < w.wipe2 + 14 ? 8 * Math.sin(Math.PI * ramp(f, w.now, w.wipe2 + 14)) : 0, wag: 0.5 * Math.sin(f * 0.4) };
    }
    case 'mistake': {
      return { ...base, look: W.treat ? lookC(W.treat, 0.02) : [1.0, 0.15, 0.1], wag: 0.5 * Math.sin(f * 0.3), headTilt: f > w.only ? 7 * Math.sin(f * 0.09) : 0, ears: f > w.only ? -0.35 : -0.2, neck: 0.8, ...chomp };
    }
    case 'yes': {
      return { ...base, look: [TRN[0] + 0.05, 0.5, TRN[2] + 0.2], wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    }
    case 'final': {
      return { ...base, look: f > eat + 16 ? [1.0, 0.4, 0.5] : toTreat, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ...chomp };
    }
  }
  return base;
};

// ---------- 3D props: POV hand + biscuit ----------
// REW = the frame each treat reaches the mouth (the chomp is 4 frames later). hand2 = the trainer's left hand pinching the biscuit (arm from the lower right).
const REW = { touch: [w.touches + 8], scrape: [w.reward2], more: [w.reward3 + 32, w.reward3 + 60, w.reward3 + 88], mistake: [w.if + 24, w.only - 4], fix: [w.then], final: [w.reward5] };
const rewardOf = (f) => (REW[shotAt(f).id] || []).find((r) => f >= r - 6 && f <= r + 16) || 0;
const treatPath = (f) => {
  const r = rewardOf(f); if (!r) return null;
  const Mo = MOUTH();
  return KF(f, [[r - 6, BELOW(r - 6, Mo)], [r + 1, Mo], [r + 9, Mo], [r + 16, BELOW(r + 16, Mo)]]);
};
export const worldAt = (f) => {
  const W = {}, t = treatPath(f), r = rewardOf(f);
  if (t) { W.treat = t; W.hand2 = { at: t, pose: 'pinch', side: 0.26 }; if (f >= r + 3) W.treatHide = true; }
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
  o.far = 'present';
  return o;
};

// ---------- cameras ----------
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  // from the treat jar on the stool, hard cut to the doormat alone
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.door1 - 2, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },   // jar ... hard cut ...
    { f: w.door1 - 1, pos: [2.2, 2.0, 2.2], look: [0.05, 0.03, 0.0], fov: 46 }, { f: w.put - 1, pos: [2.05, 1.85, 2.05], look: [0.05, 0.03, 0.0], fov: 46 }],   // ... the doormat on its own
  // the mat on the floor near the door
  door: [{ f: w.put, pos: [1.8, 1.1, 1.85], look: [-0.45, 0.5, -0.45], fov: 50 }, { f: w.reward1 - 1, pos: [1.7, 1.06, 1.75], look: [-0.45, 0.5, -0.45], fov: 50 }],
  // POV from the dog's right side (3/4 front): the right paw plants and drags back across the mat
  touch: [{ f: w.reward1, pos: [1.12, 0.67, 0.9], look: [0.24, 0.36, 0.04], fov: 42 }, { f: w.next - 1, pos: [1.08, 0.65, 0.86], look: [0.25, 0.36, 0.04], fov: 42 }],
  wait: [{ f: w.next, pos: [1.1, 0.74, 0.9], look: [0.27, 0.32, 0.05], fov: 43 }, { f: w.the - 1, pos: [1.02, 0.71, 0.84], look: [0.27, 0.32, 0.05], fov: 43 }],
  scrape: [{ f: w.the, pos: [1.12, 0.67, 0.88], look: [0.24, 0.36, 0.04], fov: 42 }, { f: w.reward3 - 1, pos: [1.08, 0.65, 0.84], look: [0.25, 0.36, 0.04], fov: 42 }],
  more: [{ f: w.reward3, pos: [1.24, 0.79, 0.84], look: [0.23, 0.35, 0.04], fov: 44 }, { f: w.now - 1, pos: [1.19, 0.76, 0.8], look: [0.24, 0.35, 0.04], fov: 44 }],
  cue: [{ f: w.now, pos: [1.24, 0.83, 0.84], look: [0.21, 0.38, 0.02], fov: 44 }, { f: w.if - 1, pos: [1.18, 0.8, 0.8], look: [0.22, 0.38, 0.02], fov: 44 }],
  mistake: [{ f: w.if, pos: [1.24, 0.79, 0.84], look: [0.23, 0.48, 0.04], fov: 44 }, { f: w.wait2 - 1, pos: [1.19, 0.76, 0.8], look: [0.24, 0.48, 0.04], fov: 44 }],
  fix: [{ f: w.wait2, pos: [1.12, 0.69, 0.9], look: [0.24, 0.44, 0.04], fov: 42 }, { f: w.keep - 1, pos: [1.08, 0.66, 0.86], look: [0.25, 0.44, 0.04], fov: 42 }],
  // the towel on its stool, two short angles
  towel: [{ f: w.keep, pos: [-0.8, 0.8, 3.0], look: [-1.6, 0.42, 1.5], fov: 40 }, { f: w.towel2 - 1, pos: [-0.95, 0.76, 2.8], look: [-1.6, 0.42, 1.5], fov: 40 }],
  towel2: [{ f: w.towel2, pos: [-2.4, 0.55, 3.3], look: [-1.6, 0.42, 1.5], fov: 40 }, { f: w.say2 - 1, pos: [-2.25, 0.53, 3.1], look: [-1.6, 0.42, 1.5], fov: 40 }],
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then2 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  final: [{ f: w.then2, pos: [1.12, 0.69, 0.9], look: [0.24, 0.36, 0.04], fov: 42 }, { f: TOTAL - 1, pos: [1.08, 0.66, 0.86], look: [0.25, 0.36, 0.04], fov: 42 }],
};
const HANDSHOTS = ['touch', 'wait', 'scrape', 'more', 'cue', 'mistake', 'fix', 'final'];
// the standing puppy is longer than the sitting one: shift the POV cameras toward its rear and pull back a little
for (const id of HANDSHOTS) CAMS[id] = CAMS[id].map((k) => { const L = add(k.look, [-0.04, 0, 0.04]); return { ...k, look: L, pos: add(L, k.pos.map((v, i) => (v - k.look[i]) * 1.3)) }; });
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (HANDSHOTS.includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (S.id === 'hook' || S.id === 'yes') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (['setup', 'towel', 'towel2', 'door'].includes(S.id)) return { focus: dist(C.pos, C.look), cinf: 7 };
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
const BUB_CUE = [0.3, 0.6, 0.08], BUB_YES = [-0.12, 0.78, -0.45];   // bubble anchor points (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.02 + k * 0.1, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  // dust puffs on the mat while the planted paw drags back (stroke starting at a)
  const dust = (a, oz = 0) => { for (const t of [a + 10, a + 14, a + 18]) { const k = ramp(f, t, t + 10); if (k > 0 && k < 1) { const u = (t - a - 9) / 13, P = PAWD(u); out.push(FX('du' + t + q(k, 1), (p) => T.fxMatDust(p, k), [P[0] - 0.04, MAT + 0.03, P[2] + oz], 0.17, { alpha: q(0.9 * (1 - k), 2), order: 7 })); } } };
  const strokesAt = { hook: [w.wipe1 - 5, w.wipe1 + 17], scrape: [w.drags - 8, w.drags + 14], more: [w.reward3 + 8, w.reward3 + 36, w.reward3 + 64], cue: [w.steps - 14, w.steps + 8], fix: [w.scrape3 - 2] }[S.id];
  if (strokesAt) for (const a of strokesAt) dust(a, S.id === 'hook' ? HOOKP[2] : 0);
  if (S.id === 'touch') dust(w.touches - 5);
  if (S.id === 'hook') hearts(w.paws1 + 14, SH(add(HEAD(), [-0.08, -0.1, 0])), 3, 0.07);
  if (S.id === 'door') badge(T.fxCheck, 'ok', w.door, w.reward1 - 6, [0.1, 0.45, 0.1], 0.2);
  if (S.id === 'touch') hearts(w.touches + 13, HEAD());
  if (S.id === 'scrape') hearts(w.reward2 + 5, HEAD());
  if (S.id === 'more') for (const r of REW.more) hearts(r + 5, HEAD());
  if (S.id === 'fix') badge(T.fxCheck, 'ok', w.fast, w.keep - 6, add(HEAD(), [0.03, 0.08, 0]), 0.11);
  if (S.id === 'mistake') badge(T.fxCross, 'no', w.only - 2, w.wait2 - 6, add(HEAD(), [0.03, 0.08, 0]), 0.14);
  // cue bubbles (James's look): pop in above the head on the spoken cue / the marker
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'cue') bubble('bd', 'Wipe paws!', '', '#ffffff', w.now - 2, w.steps + 14, BUB_CUE, 0.2);
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'final') {
    hearts(w.reward5 + 3, HEAD(), 4, 0.06);
    if (f >= w.reward5) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward5 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE(), [0.05, 0.1, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
