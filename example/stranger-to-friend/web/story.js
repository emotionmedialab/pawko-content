// "Stranger to friend protocol" — visitor appears and leaves (door + doorbell rings), distance by footprint pairs, bark -> calm -> choice, "too fast" fix.
// 3D puppy (dog-puppy.glb) + the 2D bald trainer + a recoloured kneeling visitor card, 1154 frames, timed to voice.mp3 (Holden). Cloned from sit-stay-iii (approved): same hook / setup / POV / yes cameras, bubbles, badges.
// Word frames (voice.mp3, voice.mp3.words.json, round(s*30); sentence starts taken from silence_end): Let's 0 visitors 32 | Grab 104 (silence_end 104) helper 112 best 128 treats 134 |
// Start 179 (silence_end 179) far 184 notices 224 visitor 244 calm 272 | The 312 (silence_end 312) visitor 328 appears 335 feed 365 treat 371 after 380 treat 394 | When 428 (silence_end 428) leave 433 the 458 treats 459 stop 465 |
// Slowly 516 closer 536 relaxes 566 | Ask 604 (silence_end 604) visitor 614 ignore 630 calm 685 | Let 719 (silence_end 719) choose 733 hello 756 ready 771 | Never 793 (silence_end 793) force 800 greeting 818 |
// If 856 (silence_end 856) barks 867 backs 887 | you 921 (silence_end 921) moving 929 fast 944 | Add 980 (silence_end 980) distance 985 slow 1015 | Say 1062 (silence_end 1062) yes 1067 click 1094 | then 1124 reward 1127 | end 1153.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and
// action is keyed to `w`. Camera keys are the locked ones (hook / POV from sit-stay-iii). Hard cuts only, no flashes. Puppy nose toward +x.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1154, DECK = 0;
// key word frames (first frame of the word)
const w = {
  grab: 104, helper: 112, best: 128, jar: 140, start: 179, far: 184, vis1: 184, notices: 224, calm1: 272, the: 312, bell1: 320, vis2: 332, feed: 365, t1: 371, after: 380, t2: 394, when: 428, leave: 433, stopS: 458, stop: 465,
  slowly: 516, closer: 536, relaxes: 566, ask: 604, ignore: 630, calm2: 685, let: 719, choose: 733, hello: 756, ready: 771, never: 793, force: 800, greeting: 818,
  if: 856, barks: 867, backs: 887, you: 921, fast: 944, add: 980, slow: 1015, say: 1062, yes: 1067, click: 1094, then2: 1124, reward2: 1127, fin: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },                 // trainer kneels beside the sitting puppy, hand signal
  { id: 'setup', a: w.grab, b: w.start - 1, light: 'day' },          // puppy + check on "helper", then the treat jar
  { id: 'far', a: w.start, b: w.the - 1, light: 'day' },             // footprint pairs mark the distance; the visitor appears by the door; puppy notices, stays calm (check)
  { id: 'appear', a: w.the, b: w.feed - 1, light: 'day' },           // doorbell rings, the visitor appears (hard cut), puppy perks up
  { id: 'feed', a: w.feed, b: w.when - 1, light: 'day' },            // POV: treat after treat
  { id: 'leave', a: w.when, b: w.stopS - 1, light: 'day' },          // visitor waves and leaves (hard cut), footprints to the door
  { id: 'nogo', a: w.stopS, b: w.slowly - 1, light: 'day' },         // POV: an empty open hand, no more treats
  { id: 'closer', a: w.slowly, b: w.ask - 1, light: 'day' },         // visitor appears nearer in steps (far, mid, near); puppy relaxes
  { id: 'ignore', a: w.ask, b: w.let - 1, light: 'day' },            // visitor turned away; puppy calm (check)
  { id: 'choose', a: w.let, b: w.never - 1, light: 'day' },          // puppy stands and steps over by choice; check
  { id: 'never', a: w.never, b: w.if - 1, light: 'day' },            // greeting stays gentle: hearts
  { id: 'bark', a: w.if, b: w.add - 1, light: 'day' },               // MISTAKE: visitor reaches in, puppy barks (arcs), backs away; cross
  { id: 'add', a: w.add, b: w.say - 1, light: 'day' },               // visitor far again, puppy settles; check
  { id: 'yes', a: w.say, b: w.then2 - 1, light: 'golden' },          // trainer: "yes" + click
  { id: 'povFinal', a: w.then2, b: TOTAL - 1, light: 'golden' },     // POV: reward, confetti
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
const bump = (f, a, b, c, d) => sm(ramp(f, a, b)) * (1 - sm(ramp(f, c, d)));

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 135, el: 50, sky: '#c4d6f2', ground: '#8a8262', hemi: 1.2, sun: '#fff1dc', sunI: 2.4, fog: '#cadcf0', fogNear: 60, fogFar: 700,
    skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.08, vig: 0.2, shadowExt: 3 },
  golden: { az: 120, el: 30, sky: '#ffe8cc', ground: '#8a7a62', hemi: 1.2, sun: '#ffe2bc', sunI: 2.4, fog: '#f4d6b0', fogNear: 60, fogFar: 650,
    skyTop: '#6f8fd8', skyHor: '#ffd2a0', sat: 1.04, vig: 0.24, shadowExt: 3, gain: '#fffaf2' },
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });

// ---------- staging ----------
const MAT = 0.064;
const ST = 1.08;
const DOGPOS = [0, MAT, 0], DOGYAW = Math.PI / 2;      // puppy on the mat, nose toward +x
const TRN = [0.52, MAT, -0.66];
const HOOKP = [0, MAT, -0.48];                          // hook-camera shots: puppy close to the trainer's card plane
const SX = 0.07;                                         // puppy x offset in the near-visitor shots
const START = [0.95, -0.22, 0.5];                       // hand rest point: below the frame in POV shots
const HPD = [HOOKP[0] - DOGPOS[0], 0, HOOKP[2] - DOGPOS[2]];   // shift from the POV puppy position to the hook puppy position

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
const MOUTHS = () => add(NOSE('sit'), [0.06, -0.03, 0]);      // a treat delivered to the sitting puppy

// ---------- trainer card (kneeling; hook / yes). He never moves. ----------
const trainerPlace = () => ({ x: TRN[0], z: TRN[2], y: MAT, s: ST, flip: true, kneel: 1 });

// ---------- the visitor: a second kneeling card (other jacket + cap colours), cut in and out, never slides ----------
const SPOT = { far: [0.75, 0, -1.7], mid: [0.62, 0, -1.15], near: [0.5, MAT, TRN[2]] };
const VIS = { vest: '#2f8f9d', vestD: '#1d5f6a', cap: '#c43b3b', capD: '#8a2626' };
const VT = (f) => {   // who is at the door / on the lawn at frame f
  if (f >= w.far && f < w.the) return { spot: 'far', wave: f < w.far + 22 };
  if (f >= w.vis2 && f < w.feed) return { spot: 'far', wave: f < w.vis2 + 18 };
  if (f >= w.when && f < w.leave + 7) return { spot: 'far', wave: true };
  if (f >= w.slowly && f < w.closer) return { spot: 'far', wave: f < w.slowly + 14 };
  if (f >= w.closer && f < w.relaxes) return { spot: 'mid', wave: f < w.closer + 14 };
  if (f >= w.relaxes && f < w.ask) return { spot: 'near', wave: f < w.relaxes + 14 };
  if (f >= w.ask && f < w.ready) return { spot: 'near', away: true };
  if (f >= w.ready && f < w.if) return { spot: 'near', wave: f < w.ready + 20 };
  if (f >= w.if && f < w.add) return { spot: 'near', reach: true };
  if (f >= w.add && f < w.say) return { spot: 'far', wave: f < w.add + 16 };
  return null;
};
const CHEST = (v) => [SPOT[v.spot][0], 0.3, SPOT[v.spot][2]];
const visitorAt = (f, v) => {
  const hi = idle(f, 5);
  return { hose: true, kneel: 1, expr: v.reach ? 'oops' : v.away ? 'patient' : 'smile', talk: 0, blink: blinkAt(f, 5), look: v.away ? 1 : -0.2, lookY: v.away && f >= w.ignore + 30 ? 0.6 : 0, headTilt: hi.headTilt + (v.away ? (f < w.ignore + 30 ? 12 : -10) : 0),
    near: 'hang', far: v.reach ? 'present' : v.wave ? 'wave' : v.away ? 'hip' : 'hang', patch: false, vis: 1, lean: v.reach ? 10 : v.away ? -8 : 0 };
};

const DOORSHOTS = ['far', 'appear', 'leave', 'closer', 'ignore', 'choose', 'never', 'bark', 'add'];
const BELLP = [0.04, 0.95, -2.15];                      // doorbell button on the wall (rings are drawn here)

// ---------- the puppy ----------
const LOOKD = (f) => [0.9, 0.06, 0.25 * Math.sin(f * 0.03)];   // default gaze: low, drifting a little
const REW = { feed: [380, 392, 404] };                         // frames a treat reaches the mouth
const BARKS = [w.barks, w.barks + 9, w.barks + 18];
const barkAt = (f) => { for (const t of BARKS) if (f >= t && f < t + 6) return Math.sin(Math.PI * (f - t) / 6); return 0; };
const NGP = (f) => KF(f, [[w.stopS + 4, START], [w.stopS + 20, add(MOUTHS(), [0.02, -0.13, 0.04])], [w.stopS + 44, add(MOUTHS(), [0.02, -0.13, 0.04])], [w.slowly - 2, START]]);   // the empty hand
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { sit: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.3 * Math.sin(f * 0.25), tail: 0.1, neck: 1, aimEyes: true, headTilt: 3 * Math.sin(f * 0.04), ears: -0.05 * Math.sin(f * 0.07) };
  const W = worldAt(f), V = VT(f), side = { ...base, pos: HOOKP, neck: 0.6 };
  const vc = V ? CHEST(V) : null;
  switch (S.id) {
    case 'hook': return { ...base, pos: HOOKP, look: [TRN[0] + 0.02, 0.42, TRN[2]], neck: 0.7, ears: -0.2, wag: 0.5 * Math.sin(f * 0.3), tail: 0.1 };
    case 'setup': return { ...base, look: [1.3, -0.3, 0.7 + 0.1 * Math.sin(f * 0.05)], neck: 0.3, headTilt: 10 * Math.sin(Math.PI * ramp(f, w.helper - 10, w.helper + 30)), wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    case 'far': {   // looks off, then notices the visitor (ears up, a little tilt), then settles
      const al = bump(f, w.notices, w.notices + 10, w.notices + 30, w.calm1 + 8), look = f < w.notices ? [0.9, 0.08, -0.4 + 0.2 * Math.sin(f * 0.05)] : vc;
      return { ...side, look, ears: -0.3 * al + 0.1 * sm(ramp(f, w.calm1 + 6, w.calm1 + 24)), headTilt: 8 * al + 3 * Math.sin(f * 0.05), wag: 0.25 * Math.sin(f * 0.25), tail: 0.12 };
    }
    case 'appear': {
      const door = bump(f, w.bell1, w.bell1 + 6, w.vis2 - 1, w.vis2 + 1), hi = f >= w.vis2;
      return { ...side, look: vc ? vc : door > 0.5 ? [0.62, 0.45, -2.2] : [0.8, 0.1, -0.3 + 0.3 * Math.sin(f * 0.05)], ears: -0.3 * (door > 0.3 || hi ? 1 : 0), headTilt: hi ? 6 : 0, wag: hi ? 0.9 * Math.sin(f * 0.6) : 0.2 * Math.sin(f * 0.25), tail: hi ? 0.3 : 0.1 };
    }
    case 'feed': case 'povFinal': {
      const ts = S.id === 'feed' ? REW.feed : [w.reward2 + 2], t0 = ts[ts.length - 1] + 2;
      const ch = Math.max(...ts.map((t) => chompAt(f, t + 2))), bl = ts.some((t) => f > t + 2 && f < t + 8), after = ts.some((t) => f > t + 2);
      return { ...base, look: W.treatHide || !W.treat ? LOOKD(f) : W.treat, neck: 0.9, jaw: S.id === 'povFinal' ? (f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0) : ch,
        wag: after || S.id === 'povFinal' ? Math.sin(f * 0.8) * 0.9 : 0.4 * Math.sin(f * 0.4), tail: after ? 0.3 : 0.15, blink: bl ? 1 : base.blink };
    }
    case 'leave': {
      const u = sm(ramp(f, w.leave + 7, w.leave + 28));
      return { ...side, look: vc ? vc : lerp3([0.62, 0.3, -1.7], [0.62, 0.3, -2.15], u), ears: -0.25 * (1 - u) + 0.1 * u, wag: 0.5 * Math.sin(f * 0.4) * (1 - u), tail: 0.15, headTilt: 5 * (1 - u) };
    }
    case 'nogo': return { ...base, look: NGP(f), neck: 0.9, ears: 0.1, wag: 0.3 * Math.sin(f * 0.3), headTilt: 5 * bump(f, w.stopS + 14, w.stopS + 24, w.stopS + 44, w.stopS + 54) };
    case 'closer': {
      const rl = sm(ramp(f, w.relaxes, w.relaxes + 20));
      return { ...side, look: vc ? vc : CHEST({ spot: 'far' }), neck: 0.6 - 0.1 * rl, ears: -0.2 * (1 - rl) + 0.15 * rl, headTilt: 5 * (1 - rl), wag: 0.3 * Math.sin(f * 0.3), blink: blinkAt(f, rl > 0.5 ? 5 : 8) ? 1 : 0 };
    }
    case 'ignore': {   // glances, a ground sniff, ear flicks, a weight shift and a tail change: something new about every second
      const vis = CHEST({ spot: 'near' }), away = [0.9, 0.08, -0.2], snf = [0.5, 0.0, -0.45];
      const look = KF(f, [[604, away], [624, away], [634, vis], [652, vis], [662, snf], [684, snf], [694, vis], [708, vis], [718, [0.0, 0.1, -0.2]]]);
      const fl = (t) => bump(f, t, t + 3, t + 6, t + 12), sn = bump(f, 660, 666, 682, 688);
      return { ...side, pos: add(HOOKP, [SX + 0.012 * Math.sin(f * 0.08), 0, 0]), yaw: DOGYAW + 0.05 * Math.sin(f * 0.06), look, neck: 0.5 + 0.4 * sn, ears: 0.15 - 0.45 * (fl(628) + fl(672) + fl(704)), headTilt: 8 * Math.sin(f * 0.1), wag: (f > 696 ? 0.9 : 0.2) * Math.sin(f * 0.35), blink: blinkAt(f, 5) ? 1 : 0 };
    }
    case 'choose': case 'never': {
      const nv = S.id === 'never', up = nv ? 1 - sm(ramp(f, w.greeting + 14, w.greeting + 36)) : sm(ramp(f, w.choose + 2, w.choose + 24)), walk = sm(ramp(f, w.hello, w.ready));
      const vis = [SPOT.near[0] - 0.05, 0.22, SPOT.near[2]], snf = [SPOT.near[0] - 0.1, 0.0, -0.5], gone = [SPOT.near[0] - 0.3, 0.1, -0.4];
      const look = nv ? KF(f, [[793, vis], [800, vis], [808, snf], [820, snf], [828, vis], [848, vis], [855, gone]]) : KF(f, [[719, [0.9, 0.1, -0.3]], [728, vis], [744, vis], [750, snf], [762, snf], [772, vis]]);
      const sn = nv ? bump(f, 802, 808, 818, 824) : bump(f, 748, 752, 760, 766), fl = (t) => bump(f, t, t + 3, t + 6, t + 12);
      return { ...side, w: { sit: 1 - up, stand: up }, pos: add(HOOKP, [SX + 0.05 * walk, nv ? 0 : 0.006 * Math.abs(Math.sin(f * 0.6)) * up, 0]), look, neck: 0.6 + 0.3 * sn, ears: -0.15 * up + 0.05 - 0.4 * (fl(725) + fl(782) + fl(838)), tail: 0.3 * up, wag: up > 0.3 ? Math.sin(f * (nv && f > 830 ? 0.4 : 0.8)) * (nv ? 0.8 : 1.0) : 0.3 * Math.sin(f * 0.3), headTilt: 5 * Math.sin(f * 0.07) };
    }
    case 'bark': {   // stands, lunges forward barking (mouth open, head forward), then steps back with ears flat
      const st = bump(f, w.barks - 9, w.barks - 1, w.fast + 1, w.fast + 31), back = sm(ramp(f, w.backs - 2, w.backs + 18)) * (1 - 0.4 * sm(ramp(f, w.fast, w.fast + 30)));
      const bk = barkAt(f), fw = bump(f, w.barks - 3, w.barks + 3, w.barks + 20, w.backs);
      return { ...side, w: { sit: 1 - st, stand: st }, pos: add(HOOKP, [0.14 + 0.03 * fw - 0.1 * back, 0, 0.33]), yaw: DOGYAW - 0.6 * st + 0.45 * back, look: [0.55, 0.3 + 0.06 * bk, -0.1], neck: 0.8 - 0.35 * back, ears: -0.2 * st * (1 - back) + 0.4 * back, tail: 0.0, wag: 0.1 * Math.sin(f * 0.3), jaw: 1.8 * bk, headTilt: 5 * back, blink: back > 0.3 && back < 0.5 ? 1 : 0 };
    }
    case 'add': {
      const rl = sm(ramp(f, w.add + 6, w.add + 26));
      return { ...side, look: vc ? vc : CHEST({ spot: 'far' }), neck: 0.55, ears: 0.1 * rl, headTilt: 4 * (1 - rl) + 2 * Math.sin(f * 0.05), wag: 0.4 * rl * Math.sin(f * 0.3), tail: 0.15, blink: blinkAt(f, 5) ? 1 : 0 };
    }
    case 'yes': return { ...base, look: [TRN[0] + 0.05, 0.5, TRN[2]], neck: 0.7, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
  }
  return base;
};

// ---------- 3D props: hand / biscuit / footprints ----------
const treatPath = (f) => {
  const S = shotAt(f), ts = REW[S.id];
  if (ts) {   // each treat: enters from below, reaches the mouth, then the hand pulls away (the last one hides on the chomp)
    for (let i = 0; i < ts.length; i++) {
      const t = ts[i], last = i === ts.length - 1, next = last ? 1e9 : ts[i + 1] - 14;
      if (f < t - 14) return i === 0 ? null : START;
      if (f < next) return KF(f, [[t - 14, START], [t - 2, MOUTHS()], [t + 10, MOUTHS()], [t + (last ? 22 : 20), START]]);
    }
    return START;
  }
  if (S.id === 'povFinal') return KF(f, [[w.then2, add(MOUTHS(), [0.3, 0.14, 0.05])], [w.reward2 + 2, MOUTHS()]]);
  return null;
};
const HANDSHOTS = ['feed', 'povFinal'];
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f);
  if (t) W.treat = t;
  if (t && HANDSHOTS.includes(S.id)) W.hand = { treat: t, side: S.id === 'povFinal' ? 0.22 : 0.16 };
  if (S.id === 'nogo') W.hand = { at: NGP(f), pose: 'cup', side: 0.16 };
  const ts = REW[S.id];
  if ((ts && ts.some((x, i) => f >= x && (i === ts.length - 1 || f < x + 18))) || (S.id === 'povFinal' && f >= w.reward2 + 4)) W.treatHide = true;
  if (DOORSHOTS.includes(S.id)) W.door = true;
  return W;
};

// ---------- the 2D trainer (hook, yes) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5;
  return { kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 4,
    near: { to: [318, 690 - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present', lean: 6 };
};
const trainerAt = (f) => {
  const hi = idle(f, 3), P = trainerPlace(f);
  return { hose: true, kneel: P.kneel, expr: f > 20 ? 'grin' : 'smile', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: 0.6, headTilt: hi.headTilt, near: 'thumb', far: f >= 20 ? 'signal' : 'present' };
};

// ---------- cameras (locked keys from dog-down-ii / sit-stay-iii) ----------
const HOOKC = (a, b) => [{ f: a, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: b, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }];
const POVSIT = (a, b) => [{ f: a, pos: [1.02, 0.78, 0.46], look: [0.2, 0.46, 0.0], fov: 42 }, { f: b, pos: [0.98, 0.75, 0.44], look: [0.2, 0.44, 0.0], fov: 42 }];   // dog mid-frame, room above the head for badges
const CAMS = {
  hook: HOOKC(0, w.grab - 1),
  setup: [{ f: w.grab, pos: [1.3, 0.7, 1.05], look: [0.1, 0.34, 0.0], fov: 40 }, { f: w.jar - 1, pos: [1.22, 0.66, 0.98], look: [0.1, 0.34, 0.0], fov: 40 },   // the puppy on the mat ... hard cut ...
    { f: w.jar, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.start - 1, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 }],       // ... to the treat jar
  feed: POVSIT(w.feed, w.when - 1),
  nogo: POVSIT(w.stopS, w.slowly - 1),
  yes: [{ f: w.say, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then2 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  povFinal: POVSIT(w.then2, TOTAL - 1),
};
const DCAM = (a, b) => [{ f: a, pos: [0.33, 0.5, 2.75], look: [0.33, 0.85, -0.5], fov: 43 }, { f: b, pos: [0.34, 0.5, 2.6], look: [0.34, 0.85, -0.5], fov: 43 }];   // hook camera lowered and shifted right so the puppy and the whole visitor card fill the frame
for (const s of SHOTS) if (DOORSHOTS.includes(s.id)) CAMS[s.id] = DCAM(s.a, s.b);
const POVIDS = ['feed', 'nogo', 'povFinal'];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (POVIDS.includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), head = REF.sit ? REF.sit.head : [0.3, 0.4, 0];
  if (S.id === 'hook' || S.id === 'yes') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (DOORSHOTS.includes(S.id)) return { focus: dist(C.pos, [0.15, 0.3, -0.48]), cinf: 5 };
  return { focus: dist(C.pos, head), cinf: 6 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'yes') { const tO = roundAll({ ...trainerYes(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 }); }
  if (S.id === 'hook') {
    const P = trainerPlace(f), tO = roundAll({ ...trainerAt(f), mirror: P.flip });
    out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: P.x, y: P.y, z: P.z, s: P.s, flip: P.flip, order: 1, ground: MAT, blobW: 0.8 });
  }
  const V = DOORSHOTS.includes(S.id) ? VT(f) : null;
  if (V) {   // the visitor: the trainer card with a teal jacket and a red cap, no Pawko patch; it is in the world at its spot, facing the puppy (or turned away)
    const sp = SPOT[V.spot], fl = !V.away, vO = roundAll({ ...visitorAt(f, V), mirror: fl });
    const draw = (p) => { const sv = {}; for (const k in VIS) { sv[k] = T.TRAINER[k]; T.TRAINER[k] = VIS[k]; } try { T.trainerDraw(p, vO); } finally { Object.assign(T.TRAINER, sv); } };
    out.push({ key: 'vi' + JSON.stringify(vO), draw, x: sp[0], y: sp[1], z: sp[2], s: ST, flip: fl, order: 1, ground: sp[1], blobW: 0.8 });
  }
  return out;
};
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] - 0.06 + k * 0.06, at[2] - 0.12], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = add(NOSE('sit'), [-0.08, 0.06, 0]);
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  // sound rings (a pulse every 16 frames); c = where the icon centre sits (the card origin is 1.125*s below it)
  const sound = (a, b, c, s, roll = 0) => { if (f >= a && f < b) { const k = pop(a, b), ph = q(((f - a) % 16) / 16, 2); if (k > 0.02) out.push(FX('sr' + k + ph, (p) => T.fxSound(p, ph, 1), [c[0] + 1.125 * s * k * Math.sin(roll), c[1] - 1.125 * s * k * Math.cos(roll), c[2]], s * k, { order: 8, roll })); } };
  const CK = [0.1, 0.5, HOOKP[2]], CKI = [0.1 + SX, 0.5, HOOKP[2]];   // check badges: above the puppy's head (origin is 1.125*s below the icon)   // check badge: above and left of the sitting puppy's head
  if (S.id === 'setup') badge(T.fxCheck, 'ok', w.helper, w.jar, [0.1, 0.62, 0.1], 0.14);
  if (S.id === 'far') { sound(w.far - 8, w.far + 14, BELLP, 0.45); badge(T.fxCheck, 'ok', w.calm1, w.the, CK, 0.2); }
  if (S.id === 'appear') sound(w.bell1, w.vis2 + 14, BELLP, 0.45);
  if (S.id === 'feed') for (const t of REW.feed) hearts(t + 3, HEAD);
  if (S.id === 'closer' && f >= w.relaxes + 4 && f < w.ask - 8) { const t = q(ramp(f, w.relaxes + 4, w.ask - 8), 2); out.push(FX('si' + t, (p) => T.fxSigh(p, t), add(NOSE('sit'), [0.14 + HPD[0], -0.05, 0.04 + HPD[2]]), 0.12)); }
  if (S.id === 'ignore') badge(T.fxCheck, 'ok', w.calm2, w.let, CKI, 0.2);
  if (S.id === 'choose') badge(T.fxCheck, 'ok', w.ready, w.never, [0.1 + SX + 0.05, 0.5, HOOKP[2]], 0.2);
  if (S.id === 'never') hearts(w.force + 4, add(NOSE('stand'), [HPD[0] + SX + 0.02, 0.12, HPD[2]]), 3, 0.06);
  if (S.id === 'bark') {
    for (const t of BARKS) sound(t - 1, t + 11, [0.1, 0.62, -0.1], 0.3, 1.2);
    badge(T.fxCross, 'no', w.you + 4, w.add, [0.08, 0.38, -0.1], 0.2);
  }
  if (S.id === 'add') {
    if (f >= w.add + 14 && f < w.slow - 4) { const t = q(ramp(f, w.add + 14, w.slow - 4), 2); out.push(FX('si' + t, (p) => T.fxSigh(p, t), add(NOSE('sit'), [0.14 + HPD[0], -0.05, 0.04 + HPD[2]]), 0.12)); }
    badge(T.fxCheck, 'ok', w.slow, w.say, CK, 0.2);
  }
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, [-0.12, 0.78, -0.45], 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward2 + 3, HEAD, 4, 0.06);
    if (f >= w.reward2) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward2 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('sit'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
