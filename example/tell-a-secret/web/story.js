// "Tell a Secret" — the puppy rises up on its haunches (sit-pretty pose) to whisper into the kneeling trainer's ear. 3D puppy (dog-puppy.glb) + the 2D bald trainer card, 1030 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3, voice.mp3.words.json, round(s*30); sentence starts from silence_end): Let's 0 tell 29 secret 41 | Grab 72 (silence_end 2.41) quiet 99 room 107 | Kneel 139 (4.64) level 172 |
// Hold 206 (6.85) ear 247 wait 266 sniff 281 | When 320 (10.67) nose 326 touches 333 reward 372 | Next 408 (13.61) take 430 (silence_end 14.34) away 445 | Reward 478 (15.94) moves 506 toward 519 ear 531 |
// Now 564 (18.80) tell 586 secret 594 lean 623 | Keep 658 (21.95) soft 670 | If 704 (23.45) bouncy 722 excited 741 loud 788 | Stay 827 (27.57) calm 853 break 893 | Say 944 (31.46) yes 948 click 970 | then 994 reward 1000 | end 1029.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and action is keyed to `w`.
// Pointers: HAND in the POV shot, none in the card shots (the 2D trainer's own hand does the work). Hard cuts only, no flashes. Camera keys are the locked hook / yes / CALM / popUp / POV ones.
// Card shots: the kneeling trainer card (flipped, faces left) has the puppy beside him on screen right, rising into the sit-pretty reach to his ear. The puppy mirrors the sit-pretty rig (yaw -90).
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1030, DECK = 0;
// key word frames (first frame of the word)
const w = {
  tell1: 29, secret1: 41, grab: 72, quiet: 99, room: 107, kneel: 139, level: 172, hold: 206, ear1: 247, wait: 266, sniff: 281, when: 320, nose1: 326, touches: 333, reward1: 372,
  next: 408, take: 430, away: 445, reward2: 478, moves: 506, toward: 519, ear2: 531, now: 564, tell2: 586, secret2: 594, lean: 623, keep: 658, soft: 670,
  if: 704, bouncy: 722, excited: 741, loud: 788, stay: 827, calm: 853, brk: 893, say: 944, yes: 948, click: 970, then: 994, reward3: 1000, end: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },              // card: fingers by his ear, the puppy rises, nose touches, reward
  { id: 'setup', a: w.grab, b: w.kneel - 1, light: 'day' },       // jar -> mat, check on "quiet room"
  { id: 'kneel', a: w.kneel, b: w.hold - 1, light: 'day' },       // card: kneeling at the puppy's level
  { id: 'ear', a: w.hold, b: w.wait - 1, light: 'day' },          // card: fingers up beside his ear
  { id: 'sniff', a: w.wait, b: w.when - 1, light: 'day' },        // card (closer): wait while the puppy sniffs
  { id: 'touch', a: w.when, b: w.next - 1, light: 'day' },        // card: nose touches the fingers, reward
  { id: 'away', a: w.next, b: w.reward2 - 1, light: 'day' },      // card: fingers taken away
  { id: 'toward', a: w.reward2, b: w.now - 1, light: 'day' },     // card: the puppy moves toward the ear on its own, reward
  { id: 'cue', a: w.now, b: w.keep - 1, light: 'day' },           // card: "Tell a secret" (bubble), he leans in, the puppy whispers
  { id: 'soft', a: w.keep, b: w.if - 1, light: 'day' },           // calm low orbit: soft voice
  { id: 'bouncy', a: w.if, b: w.stay - 1, light: 'day' },         // MISTAKE: bouncy and loud (red cross)
  { id: 'calm', a: w.stay, b: w.say - 1, light: 'day' },          // quiet and calm: the puppy settles for a short break (green check)
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
const MAT = 0.064, K = 0.00225, CS = 1.08, BOB = 0, TILT = -16;       // CS = card scale, BOB = he sits lower on his heel, TILT = head tilted so his ear is toward the puppy
const DOGPOS = [0, MAT, 0], DOGYAW = Math.PI / 2;      // POV / calm shots: puppy on the mat, nose toward +x
let TRN = [-0.23, MAT, -0.66];                         // the kneeling trainer card (flipped: faces screen left, his ear is on screen right)
const PZ = 0.3, CARDYAW = -Math.PI / 2;                // card shots: the puppy sits PZ in front of the card plane, to his right, nose toward -x
let PC = [0.5, MAT, -0.5], F0 = [0.3, 0.55, -0.66], CUR = [0, 1, 3];
const rot2 = ([x, y], a, [cx, cy]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)];
const axisOf = (pos) => { const ry = Math.atan2(pos[0] - TRN[0], pos[2] - TRN[2]); return [Math.cos(ry), 0, -Math.sin(ry)]; };
/** world point -> trainer design point along the camera ray (flipped card) */
const tD = (P) => {
  const C = CUR, ax = axisOf(C), n = [-ax[2], 0, ax[0]];
  const d = [P[0] - C[0], P[1] - C[1], P[2] - C[2]], den = d[0] * n[0] + d[2] * n[2] || 1e-6;
  const s = ((TRN[0] - C[0]) * n[0] + (TRN[2] - C[2]) * n[2]) / den, Q = [C[0] + d[0] * s, C[1] + d[1] * s, C[2] + d[2] * s];
  return [300 - ((Q[0] - TRN[0]) * ax[0] + (Q[2] - TRN[2]) * ax[2]) / (K * CS), 975 - (Q[1] - TRN[1]) / (K * CS)];
};
/** trainer design point -> world point on the card plane (camera at frame f) */
const dW = (f, d) => { const ax = axisOf(camAt(f).pos), u = (300 - d[0]) * K * CS; return [TRN[0] + ax[0] * u, TRN[1] + (975 - d[1]) * K * CS, TRN[2] + ax[2] * u]; };
// trainer landmarks (design units, kneeling, lean 0): his ear (turned to the puppy by TILT) and the fingertip spot beside it
const UD = 2.08, HIP = 808 + BOB, SHY = HIP - 176, LEAN = -18;   // LEAN < 0: his upper body leans back toward the puppy (on screen right)
const earD = (tilt) => rot2(rot2([300 + 6 * UD - 0.84 * 104, SHY - 10 - 98 * 0.78 + 8 * UD], tilt * Math.PI / 180, [300 + 8 * UD, SHY - 6]), LEAN * Math.PI / 180, [300, HIP]);
const FT = add(earD(TILT), [-75, 10]);            // fingertip where the nose meets it
const FE = add(earD(TILT), [-45, -65]);            // fingers held up beside the ear
TRN = [-0.23, 0.52 - (975 - FT[1]) * K * CS, -0.66];   // the card is SUNK into the ground until the fingertip sits just under the puppy's reach (legs below the floor line are hidden)

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
  F0 = dW(0, FT); PC = [F0[0] + REF.pretty.nose[0] - 0.04, MAT, F0[2] + PZ + REF.pretty.nose[2]];   // at full reach the nose meets the fingertip
  console.log('F0', JSON.stringify(F0), 'PC', JSON.stringify(PC), 'noseY', REF.pretty.nose[1]);
};
const NOSE = (r) => REF[r].nose;
const NP = (pr) => lerp3(NOSE('sit'), NOSE('pretty'), pr);                 // nose while rising from a sit (pr 0) to sit pretty (pr 1)
const mir = (p) => [PC[0] - p[0], p[1], PC[2] - p[2]];                     // rig point (puppy at the origin facing +x) -> card-shot puppy (at PC facing -x)
const NPm = (pr) => mir(NP(pr));
const MOUTHm = (pr) => mir(add(NP(pr), [0.03, -0.06, -0.04]));
const START = [0.95, 0.12, 0.45];
const PFZ = 0.1;   // the final POV puppy sits a little to the side so the background cone is not on its head
const HE = 52, TL = w.reward1 + 2, TQ = 550;   // chomp frames
// how far the puppy has risen from the sit (0 sit, 1 sit pretty); each reach is brief and gentle
const PR = {
  hook: (f) => sm(ramp(f, 10, 28)) * (1 - 0.7 * sm(ramp(f, 40, 50))) * (1 - sm(ramp(f, HE + 14, HE + 26))),
  kneel: () => 0,
  ear: (f) => 0.12 * sm(ramp(f, w.hold + 20, w.ear1 + 10)),
  sniff: (f) => KF(f, [[w.wait, 0.12], [w.wait + 22, 0.7], [w.sniff + 14, 0.72], [w.when - 1, 0.55]]),
  touch: (f) => KF(f, [[w.when, 0.55], [w.touches + 1, 1], [w.touches + 15, 1], [TL - 12, 0.3], [TL + 14, 0.3], [TL + 24, 0]]),
  away: (f) => KF(f, [[w.next, 0], [w.away, 0.04], [w.reward2 - 1, 0.35]]),
  toward: (f) => KF(f, [[w.reward2, 0.35], [w.moves + 8, 0.6], [w.ear2 - 4, 0.97], [w.ear2 + 6, 0.97], [TQ - 6, 0.3], [TQ + 14, 0.3], [w.now - 1, 0.05]]),
  cue: (f) => KF(f, [[w.now, 0], [w.now + 30, 0.14], [w.tell2 + 14, 0.04], [w.lean + 4, 0], [w.lean + 22, 0.98], [w.lean + 30, 0.98], [w.keep - 1, 0.55]]),
};
const PRof = (f) => { const id = shotAt(f).id; return PR[id] ? PR[id](f) : 0; };

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
  // card shots: the puppy beside the trainer, nose toward the fingers / ear
  const pov = (pr, extra = {}) => ({ ...base, ...rise(pr), look: lk(pr), neck: 1, ...bal(pr), ...extra });
  const card = (pr, extra = {}) => ({ ...base, ...rise(pr), pos: PC, yaw: CARDYAW, look: mir(lk(pr)), neck: 1, ...bal(pr), ...extra });
  switch (S.id) {
    case 'hook': { const p = PR.hook(f); return card(p, { ...(f >= HE ? eat(HE) : {}), ears: f < HE ? -0.3 : 0 }); }
    case 'kneel': return card(0, { ears: 0.25 * Math.sin(f * 0.13), wag: 0.5 * Math.sin(f * 0.3) });
    case 'ear': return card(PR.ear(f), { ears: -0.15 + 0.25 * Math.sin(f * 0.17) });
    case 'sniff': return pov(PR.sniff(f), { headTilt: 6 * Math.sin(f * 0.19), jaw: 0.12 * Math.max(0, Math.sin(f * 0.5)) });
    case 'touch': return card(PR.touch(f), f >= TL ? eat(TL) : {});
    case 'away': return pov(PR.away(f));
    case 'toward': return card(PR.toward(f), f >= TQ ? eat(TQ) : {});
    case 'cue': return card(PR.cue(f), f >= w.tell2 - 4 && f < w.tell2 + 14 ? { ears: -0.5 } : {});
    case 'soft': {   // quiet: a relaxed sit, slow breath, one sleepy blink
      const flick = Math.max(0, Math.sin(f * 0.21)) ** 6;
      return { ...base, look: lk(0), neck: 1, headTilt: 4 * Math.sin(f * 0.05), ears: 0.25 - 0.5 * flick, wag: 0.12 * Math.sin(f * 0.09), tail: 0.05, breath: 0.35 + 0.3 * Math.sin(f * 0.12), blink: f > w.soft + 10 && f < w.soft + 18 ? 1 : base.blink };
    }
    case 'bouncy': {
      const up = sm(sm(ramp(f, w.bouncy - 4, w.bouncy + 10))), hopK = ramp(f, w.bouncy + 8, w.bouncy + 14) * (1 - ramp(f, w.loud + 14, w.loud + 30));
      const hop = 0.09 * hopK * Math.abs(Math.sin((f - w.bouncy) * 0.28));
      return { ...base, w: { sit: 1 - up, stand: up }, pos: [0, MAT + hop, 0], look: [0.9, 0.35, 0.2], neck: 0.5, ears: -0.4 * up + 0.4 * Math.sin(f * 0.5) * hopK, tail: 0.4 * up,
        wag: up > 0.5 ? Math.sin(f * 0.9) * 1.2 : 0.3 * Math.sin(f * 0.3), jaw: 0.35 * hopK * Math.max(0, Math.sin(f * 0.4)), headTilt: 8 * hopK * Math.sin(f * 0.3), blink: base.blink };
    }
    case 'calm': {   // sit -> down for a short break, a slow yawn
      const dn = sm(ramp(f, w.stay + 8, w.calm + 30)), y = Math.sin(Math.PI * ramp(f, w.brk + 6, w.brk + 34));
      return { ...base, w: { sit: 1 - dn, down: dn }, look: add(NOSE('sit'), [0.5, -0.3, 0.05]), neck: 0.9, jaw: 0.9 * y, blink: y > 0.3 || (dn > 0.9 && f % 90 > 70) ? 1 : base.blink, ears: 0.3 * (1 - dn) + 0.2 * Math.sin(f * 0.1), wag: 0.15 * Math.sin(f * 0.12), breath: 0.35 + 0.3 * Math.sin(f * 0.1) };
    }
    case 'yes': return card(0, { wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 });
    case 'povFinal': {
      const t0 = w.reward3 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, pos: [0, MAT, PFZ], look: W.treatHide || !W.treat ? [0.9, 0.3, 0.3 + PFZ] : W.treat, neck: 0.8, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: only the final POV hand + biscuit (the card shots use the trainer's own 2D hand) ----------
const MOUTH0 = () => add(NP(0), [0.07, -0.02, -0.04]);
const HOLDP = () => add(NP(0.75), [0.1, 0.05, -0.03]);                                  // fingers held just ahead of and above the reaching nose
const OUTP = () => add(HOLDP(), [0.6, 0.1, -0.7]);   // off the right edge of the POV frame
const treatPath = (f) => {
  const id = shotAt(f).id;
  if (id === 'sniff') return KF(f, [[w.wait, OUTP()], [w.wait + 14, HOLDP()]]);
  if (id === 'away') return f < w.take ? HOLDP() : KF(f, [[w.take, HOLDP()], [w.away, OUTP()]]);   // fingers withdrawn below the frame
  if (id === 'povFinal') return add(KF(f, [[w.then, add(MOUTH0(), [0.3, 0.14, 0.05])], [w.reward3 + 2, MOUTH0()]]), [0, 0, PFZ]);   // hand lingers to the end
  return null;
};
const HANDSHOTS = ['sniff', 'away', 'povFinal'];
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f);
  if (t) W.treat = t;
  if (t && HANDSHOTS.includes(S.id)) W.hand = { treat: t, side: 0.22 };
  if ((S.id === 'povFinal' && f >= w.reward3 + 4) || S.id === 'sniff' || S.id === 'away') W.treatHide = true;
  return W;
};

// ---------- the 2D trainer (card shots) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const NEAR = { kneel: 1, bob: BOB, lean: LEAN };
const SN = trainerShoulder(NEAR, 'near');
const REST = { to: rot2([trainerShoulder({ kneel: 1, bob: BOB, lean: 0 }, 'near')[0] - 3 * UD, HIP + 22 * UD], LEAN * Math.PI / 180, [300, HIP]), hand: 'fist', bend: 1, rot: 90 };       // the 'hip' preset as an object (so the arm can travel to and from it)
const OFF = { give: [19, -12], treat: [25, -3], point: [31, -4], palm: [30, 0] };
const norm = (a) => (a < 0 ? a + 360 : a);
/** arm spec whose fingertip / biscuit lands on design point T (hand kind, optional fixed pointing angle in degrees) */
const reach = (kind, T, rot) => {
  const ang = rot !== undefined ? rot * Math.PI / 180 : Math.atan2(T[1] - SN[1], T[0] - SN[0]), s = 2.08 * 1.05, sy = Math.cos(ang) < 0 ? -1 : 1, off = OFF[kind];
  return { to: [T[0] - (Math.cos(ang) * off[0] * s - Math.sin(ang) * off[1] * sy * s), T[1] - (Math.sin(ang) * off[0] * s + Math.cos(ang) * off[1] * sy * s)], hand: kind, bend: -1, rot: norm(ang * 180 / Math.PI) };
};
const EAR = () => reach('point', FE, 192);
const OUT = () => reach('point', FT, 192);
/** travel between arm specs: keys [[frame, spec], ...]; the hand kind flips at the later key's frame */
const HK = (f, keys) => {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [fa, a] = keys[i], [fb, b] = keys[i + 1];
    if (f <= fb) { const t = sm((f - fa) / (fb - fa)); return { ...b, hand: f >= fb ? b.hand : a.hand, to: lerp3(a.to, b.to, t), rot: lerp(a.rot, b.rot, t), bend: b.bend }; }
  }
  return keys[keys.length - 1][1];
};
const mouthD = (fr) => tD(MOUTHm(PRof(fr)));
const trainerAt = (f) => {
  const S = shotAt(f), hi = idle(f, 3);
  const o = { hose: true, kneel: 1, bob: BOB, lean: LEAN, expr: 'smile', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.3, headTilt: TILT + hi.headTilt, far: 'hang', near: REST };
  const give = (fr, kind = 'give') => reach(kind, mouthD(fr));
  switch (S.id) {
    case 'hook':
      o.expr = f > 30 ? 'grin' : 'smile';
      o.near = HK(f, [[0, EAR()], [14, EAR()], [28, OUT()], [38, OUT()], [HE - 6, give(HE)], [HE + 3, give(HE)], [HE + 4, give(HE, 'palm')], [HE + 12, give(HE, 'palm')], [w.grab - 1, REST]]);
      break;
    case 'kneel': o.far = 'present'; o.near = REST; o.headTilt = -12 + hi.headTilt; break;
    case 'ear': o.expr = 'smile'; o.near = HK(f, [[w.hold, REST], [w.ear1, EAR()]]); break;
    case 'sniff': o.expr = 'patient'; o.near = EAR(); break;
    case 'touch':
      o.expr = f > w.touches ? 'grin' : 'patient';
      o.near = HK(f, [[w.when, EAR()], [w.touches - 2, OUT()], [TL - 24, OUT()], [TL - 8, give(TL)], [TL + 3, give(TL)], [TL + 4, give(TL, 'palm')], [TL + 14, give(TL, 'palm')], [w.next - 1, EAR()]]);
      break;
    case 'away': o.expr = 'smile'; o.near = HK(f, [[w.next, EAR()], [w.take - 2, EAR()], [w.away + 6, REST]]); break;
    case 'toward':
      o.expr = f > w.ear2 ? 'grin' : 'patient';
      o.near = HK(f, [[w.reward2, REST], [w.ear2 + 4, REST], [TQ - 4, give(TQ)], [TQ + 3, give(TQ)], [TQ + 4, give(TQ, 'palm')], [TQ + 8, give(TQ, 'palm')], [w.now - 1, REST]]);
      break;
    case 'cue':
      o.expr = 'smile'; o.headTilt = TILT - 9 * sm(ramp(f, w.lean, w.lean + 18)) * (1 - sm(ramp(f, w.keep - 12, w.keep - 1))) + hi.headTilt;
      break;
    case 'yes': {
      const clickOn = f >= w.click && f < w.click + 5;
      Object.assign(o, { expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, headTilt: TILT + 12 + hi.headTilt,
        near: { to: [318, 690 + BOB - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present' });
      break;
    }
  }

  return o;
};

// ---------- cameras: the locked hook / yes / CALM / popUp / POV keys; only look-at targets are nudged ----------
const YESC = (a, b) => [{ f: a, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: b, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }];
const HOOKC = (a, b) => [{ f: a, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: b, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }];
const CALM = (a, b) => [{ f: a, pos: [1.25, 0.42, 0.95], look: [0.14, 0.18, 0.0], fov: 47 }, { f: b, pos: [0.3, 0.46, 1.45], look: [0.1, 0.18, 0.0], fov: 47, path: [[0.85, 0.44, 1.3]] }];
const CAMS = {
  hook: YESC(0, w.grab - 1),
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.quiet - 8, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },
    { f: w.quiet - 7, pos: [1.22, 0.52, 1.0], look: [0.04, 0.2, 0.0], fov: 38 }, { f: w.kneel - 1, pos: [1.1, 0.47, 0.9], look: [0.04, 0.19, 0.0], fov: 38 }],
  kneel: YESC(w.kneel, w.hold - 1),
  ear: YESC(w.hold, w.wait - 1),
  sniff: [{ f: w.wait, pos: [1.3, 0.8, 0.58], look: [0.24, 0.19, 0.0], fov: 42 }, { f: w.when - 1, pos: [1.25, 0.77, 0.55], look: [0.25, 0.18, 0.0], fov: 42 }],
  touch: YESC(w.when, w.next - 1),
  away: [{ f: w.next, pos: [1.28, 0.88, 0.56], look: [0.2, 0.22, 0.0], fov: 42 }, { f: w.reward2 - 1, pos: [1.22, 0.82, 0.53], look: [0.22, 0.16, 0.0], fov: 42 }],
  toward: YESC(w.reward2, w.now - 1),
  cue: YESC(w.now, w.keep - 1),
  soft: CALM(w.keep, w.if - 1),
  bouncy: [{ f: w.if, pos: [0.84, 0.5, 1.3], look: [0.34, 0.36, 0.05], fov: 58 }, { f: w.stay - 1, pos: [0.78, 0.6, 1.45], look: [0.34, 0.42, 0.05], fov: 58 }],
  calm: CALM(w.stay, w.say - 1),
  yes: YESC(w.say, w.then - 1),
  povFinal: [{ f: w.then, pos: [1.34, 0.84, 0.72], look: [0.17, 0.2, 0.0], fov: 42 }, { f: TOTAL - 1, pos: [1.29, 0.81, 0.69], look: [0.18, 0.2, 0.0], fov: 42 }],
};
const BIAS = { bouncy: [-0.2, 0.0, 0], sniff: [0, 0.12, 0], away: [0, 0.1, 0] };   // look-at nudges that keep the whole dog inside the frame
const CARDS = ['hook', 'kneel', 'ear', 'touch', 'toward', 'cue', 'yes'];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  const calm = S.id === 'soft' || S.id === 'calm', a = SHOTS.find((s) => s.id === S.id).a, b = SHOTS.find((s) => s.id === S.id).b;
  const bias = calm ? [-0.1 + 0.1 * ramp(f, a, b), 0.12, 0] : BIAS[S.id];
  if (bias) c.look = add(c.look, bias);
  if (S.id === 'setup' && f >= w.quiet - 7) c.look = add(c.look, [0, 0.22, 0]);   // headroom for the check badge
  if (CARDS.includes(S.id)) c.look = add(c.look, CARDLOOK);
  if (HANDSHOTS.includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const CARDLOOK = [0.03, 0.3, 0];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), head = REF.sit ? REF.sit.head : [0.2, 0.4, 0];
  if (CARDS.includes(S.id)) return { focus: dist(C.pos, [PC[0] - 0.1, 0.4, -0.4]), cinf: 6 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'soft' || S.id === 'calm') return { focus: dist(C.pos, [0.1, 0.22, 0]), cinf: 9 };
  if (S.id === 'bouncy') return { focus: dist(C.pos, [0.1, 0.3, 0]), cinf: 6 };
  return { focus: dist(C.pos, head), cinf: 6 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  CUR = camAt(f).pos;
  const S = shotAt(f), out = [];
  if (CARDS.includes(S.id)) { const tO = roundAll({ ...trainerAt(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: CS, flip: true, order: 1, ground: MAT, blob: false }); }
  return out;
};
const BUB_CUE = [TRN[0] + 0.3, 1.0, TRN[2] + 0.1];   // bubble anchor beside the trainer's face (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.12, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEADm = (p) => add(NPm(p), [0.1, 0.1, 0]);   // above and behind the card puppy's head (never over the face)
  const HEAD = (p) => add(NP(p), [-0.1, 0.1, 0]);
  if (S.id === 'hook') hearts(HE + 1, HEADm(0.1), 3, 0.07);
  if (S.id === 'setup') badge(T.fxCheck, 'ok', w.quiet + 2, w.kneel, [0.2, 0.6, 0.1], 0.14);
  if (S.id === 'touch') hearts(TL + 1, HEADm(0), 3, 0.06);
  if (S.id === 'toward') hearts(TQ + 1, HEADm(0), 3, 0.06);
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'cue') bubble('bd', 'Tell a secret', 'softly', '#ffffff', w.tell2 - 3, w.lean + 6, BUB_CUE, 0.4);
  if (S.id === 'bouncy') badge(T.fxCross, 'no', w.loud - 3, w.stay, [0.2, 0.7, 0.1], 0.2);
  if (S.id === 'calm') badge(T.fxCheck, 'ok', w.calm - 3, w.brk + 20, [0.1, 0.5, 0.1], 0.14);
  if (S.id === 'yes') {
    bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_CUE, 0.4);
    if (f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.95, TRN[2] + 0.12], 0.26)); }
  }
  if (S.id === 'povFinal') {
    hearts(w.reward3 + 3, add(HEAD(0), [0, 0, PFZ]), 4, 0.06);
    if (f >= w.reward3) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward3 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('sit'), [0.05, 0.05, -0.2 + i * 0.2 + PFZ]), 0.4, { order: 7 })); }
  }
  return out;
};
