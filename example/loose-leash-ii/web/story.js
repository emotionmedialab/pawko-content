// "Loose leash II" — leash walking #2: new spot (the backyard), curves / sharp turns / stops, sniff breaks, distractions, fading treats. 3D puppy (dog-puppy.glb) with the approved harness + leash (web/leash.js), the 2D trainer in the hook and the "yes", 1147 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3.words.json round(s*30); sentence-start words from the silence_end before them, whisper dates some too early):
// Let's 0 teach 8 dog 17 walk 30 nicely 36 anywhere 66 | Grab 112 leash 119 treats 133 try 153 new 164 spot 167 | Walk 203 curves 215 make 241 sharp 246 turns 254 and 284 stop 289 now 299 then 311 |
// Reward 341 dog 355 staying 370 near 379 you 387 | After 421 good 433 stretch 437 say 458 go 469 sniff 474 and 504 let 505 explore 514 loose 537 leash 543 | Then 582 call 588 back 604 keep 625 walking 631 |
// Next 671 pass 691 interesting 697 smells 707 or 724 few 737 people 742 | Reward 773 each 779 choose 803 you 810 | If 841 cut 846 treats 852 fast 867 | the 894 pulling 895 comes 901 back 911 |
// Fade 942 slowly 952 and 963 use 980 sniff 986 breaks 994 rewards 1011 | Say 1052 yes 1057 or 1070 click 1090 | then 1099 reward 1121 | end 1146.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and action is keyed to `w`.
// Hard cuts only, no flashes. World = the backyard (lawn, fence, bushes). The puppy walks toward +x; the camera is the trainer's eyes on its +z side. The leash is drawn by leash.js: slack 1 = soft J, 0 = straight.
// The puppy's route is simulated once (SIM: heading psi and speed keys, then integrated), so the footprint trail, the camera, the gait and the leash hand all follow the same path.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1147, DECK = 0;
const w = {
  lets: 0, walk0: 30, nicely: 36, any: 66, grab: 112, leash: 119, treats: 133, try: 153, spot: 167, walk1: 203, curves: 215, make: 241, sharp: 246, stop: 289, now: 299, then: 311,
  reward1: 341, near: 379, after: 421, good: 433, say: 458, go: 469, sniff: 474, let: 505, explore: 514, loose: 537, then2: 582, call: 588, back: 604, keep: 625,
  next: 671, pass: 691, smells: 707, people: 742, reward2: 773, choose: 803, if: 841, cut: 846, fast: 867, pull: 895, back2: 911,
  fade: 942, slowly: 952, use: 980, sniff2: 986, breaks: 994, rewards: 1011, say2: 1052, yes: 1057, click: 1090, then3: 1099, reward3: 1121, end: TOTAL - 1,
};
const RN_END = w.reward1 + 50;   // the reward close-up ends, the walk resumes
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },                    // trainer + puppy on a loose leash, backyard
  { id: 'grab', a: w.grab, b: w.try - 1, light: 'day' },               // close on the harness + leash, a treat is shown
  { id: 'newSpot', a: w.try, b: w.walk1 - 1, light: 'day' },           // hard cut: the new spot, the backyard ahead
  { id: 'curves', a: w.walk1, b: w.make - 1, light: 'day' },           // tracking walk, S-curve, footprint trail
  { id: 'turns', a: w.make, b: w.stop - 1, light: 'day' },             // sharp turns, trail zigzags
  { id: 'stops', a: w.stop, b: w.reward1 - 1, light: 'day' },          // stops, glances up, walks on, stops
  { id: 'rewardNear', a: w.reward1, b: RN_END - 1, light: 'day' },     // POV: reward beside us
  { id: 'stretch', a: RN_END, b: w.say - 1, light: 'day' },            // a good stretch on a loose leash, check
  { id: 'sniff', a: w.say, b: w.then2 - 1, light: 'day' },             // "go sniff": nose down, small wander, loose leash
  { id: 'callBack', a: w.then2, b: w.next - 1, light: 'day' },         // called back ("Come!"), trots to us, walks on
  { id: 'passBy', a: w.next, b: w.reward2 - 1, light: 'day' },         // flowers to sniff, then a passer-by (sound + glance)
  { id: 'choose', a: w.reward2, b: w.if - 1, light: 'day' },           // POV: it chooses us, reward
  { id: 'mistake', a: w.if, b: w.fade - 1, light: 'day' },             // MISTAKE: treats cut, pulling comes back (red + cross)
  { id: 'fixTurn', a: w.fade, b: w.use - 1, light: 'day' },            // fade slowly: slack again, green + check
  { id: 'fixSniff', a: w.use, b: w.say2 - 1, light: 'day' },           // sniff break as the reward
  { id: 'yes', a: w.say2, b: w.then3 - 1, light: 'golden' },           // trainer: "yes" + click
  { id: 'povFinal', a: w.then3, b: TOTAL - 1, light: 'golden' },       // POV: reward, confetti
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
const win = (f, a, b, e = 6) => (f >= a && f < b ? sm(ramp(f, a, a + e)) * (1 - sm(ramp(f, b - e, b))) : 0);   // 0 -> 1 -> 0 window

// ---------- lights (same sun as dog-down-ii: one direction for every shot) ----------
export const LIGHTS = {
  day: { az: 135, el: 50, sky: '#c4d6f2', ground: '#8a8262', hemi: 1.2, sun: '#fff1dc', sunI: 2.4, fog: '#cadcf0', fogNear: 60, fogFar: 700,
    skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.08, vig: 0.2, shadowExt: 3 },
  golden: { az: 120, el: 30, sky: '#ffe8cc', ground: '#8a7a62', hemi: 1.2, sun: '#ffe2bc', sunI: 2.4, fog: '#f4d6b0', fogNear: 60, fogFar: 650,
    skyTop: '#6f8fd8', skyHor: '#ffd2a0', sat: 1.04, vig: 0.24, shadowExt: 3, gain: '#fffaf2' },
};
export const lightFor = (S) => ({ ...LIGHTS[S.light] });

// ---------- staging ----------
const K = 0.00225, ST = 1.08, DOGYAW = Math.PI / 2, LOOSE = 0.95;
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

// ---------- the puppy's route: heading psi (deg, 0 = +x, + = away from the camera) and speed (m/frame) keys, integrated once ----------
const X0 = -5.4, Z0 = -0.12, V = 0.024;
const PSI = [
  [w.walk1, 0], [w.walk1 + 11, 0], [w.walk1 + 23, 34], [w.walk1 + 35, -34],                 // "walk in curves": an S
  [w.make + 9, 62], [w.make + 17, 62], [w.make + 25, -58], [w.make + 33, -58], [w.stop - 4, 0],  // "sharp turns": two quick zigzags
  [w.then + 4, 0], [w.then + 18, 16], [w.reward1 - 4, 0], [w.near + 40, 0], [w.after + 6, 8], [w.good + 8, -8], [w.say - 16, 0],
  // sniff break: a small loop of a wander on a loose leash
  [w.sniff + 2, 0], [w.sniff + 14, 38], [w.sniff + 28, 38], [w.sniff + 36, 80], [w.sniff + 52, -80], [w.sniff + 66, -80], [w.sniff + 76, 20], [w.sniff + 92, 150], [w.then2 + 2, 160], [w.then2 + 12, 180],
  // call back: trots toward us, then a U-turn (through the camera side) and walks on
  [w.call + 14, 180], [w.call + 40, 360], [w.keep + 40, 360], [w.pass - 4, 372], [w.smells + 8, 352], [w.people + 6, 360], [w.reward2 - 8, 360], [w.reward2 + 50, 360],
  [w.if + 12, 366], [w.if + 36, 354], [w.pull - 4, 360], [w.fade - 2, 360], [w.fade + 14, 360],
  // second sniff break
  [w.sniff2 - 2, 360], [w.sniff2 + 12, 398], [w.sniff2 + 26, 398], [w.sniff2 + 34, 440], [w.sniff2 + 46, 340], [w.say2 - 4, 360],
];
const SPD = [
  [w.walk1, 0], [w.walk1 + 12, V], [w.stop - 14, V], [w.stop + 1, 0], [w.stop + 25, 0], [w.stop + 37, V], [w.reward1 - 12, V], [w.reward1 - 3, 0],   // walk, stop, walk, stop (reward)
  [RN_END, 0], [RN_END + 14, V], [w.say - 12, V], [w.say + 8, 0],                                                                                     // walks on, then stops for "go sniff"
  [w.sniff + 4, 0], [w.sniff + 14, 0.007], [w.sniff + 30, 0.006], [w.sniff + 36, 0.002], [w.sniff + 44, 0.007], [w.sniff + 66, 0.007], [w.sniff + 76, 0.004], [w.sniff + 92, 0.006], [w.then2 + 4, 0],   // wander
  [w.call + 4, 0.014], [w.call + 36, 0.014], [w.keep + 10, V],                                                                                        // trots back, walks on
  [w.pass - 8, V], [w.smells + 5, 0.013], [w.smells + 24, 0.013], [w.people - 2, V], [w.reward2 - 12, V], [w.reward2 - 1, 0],                          // passes the flowers, the passer-by, stops for the reward
  [w.reward2 + 40, 0], [w.reward2 + 54, V], [w.fast - 4, V], [w.pull - 4, 0.034], [w.fade - 6, 0.034], [w.fade + 8, 0],                                          // treats cut -> forges ahead -> stops
  [w.slowly + 4, 0], [w.slowly + 12, 0.012], [w.use - 8, 0.012], [w.use + 2, 0],
  [w.sniff2 + 4, 0], [w.sniff2 + 14, 0.007], [w.sniff2 + 32, 0.006], [w.sniff2 + 40, 0.003], [w.sniff2 + 48, 0.007], [w.say2 - 8, 0],
];
const SIM = []; { let x = X0, z = Z0;
  for (let f = 0; f <= TOTAL; f++) {
    const psi = f < w.walk1 ? 0 : KF(f, PSI), v = f < w.walk1 ? 0 : KF(f, SPD), r = psi * Math.PI / 180;
    SIM.push({ x, z, psi, v }); x += v * Math.cos(r); z -= v * Math.sin(r);
  } }
const DP = []; { let ph = 0, len = 0;
  for (let f = 0; f <= TOTAL; f++) {
    const a = SIM[Math.max(0, f - 1)], b = SIM[f], dpsi = (b.psi - a.psi) * Math.PI / 180, d = Math.hypot(b.x - a.x, b.z - a.z) + 0.12 * Math.abs(dpsi); ph += d / 0.4; len += Math.hypot(b.x - a.x, b.z - a.z);
    DP.push({ x: b.x, z: b.z, psi: b.psi, yaw: DOGYAW + b.psi * Math.PI / 180, sp: d * 30, ph, len });
  } }
const dogP = (f) => DP[clamp(Math.round(f), 0, TOTAL)];
const head = (d) => { const r = d.psi * Math.PI / 180; return [Math.cos(r), 0, -Math.sin(r)]; };   // heading vector on the ground
export const SMELL = [SIM[w.smells + 8].x + 0.15, SIM[w.smells + 8].z - 0.72];                       // the flowers the puppy sniffs as it passes
const pull = (f) => KF(f, [[w.pull - 6, 0], [w.pull + 4, 1], [w.fade - 2, 1], [w.fade + 6, 0]]);   // leash tension: 0 loose .. 1 taut (only while the puppy faces forward)
const tension = pull;
// footprint trail: flat ovals on the lawn along the route (left/right feet), from 0.45 m behind to 1.5 m ahead of the puppy, ending at the reward stop
const DS = 0.15, PA = w.walk1, PB = w.reward1 - 3;
const printsAt = (f) => {
  const s0 = dogP(f).len, sEnd = dogP(PB).len, out = [];
  for (let j = Math.ceil((s0 - 0.8) / DS); j * DS <= Math.min(s0 + 1.4, sEnd); j++) {
    const s = j * DS; if (s < 0) continue;
    let i = PA; while (i < PB && DP[i + 1].len < s) i++;
    const a = DP[i], b = DP[Math.min(PB, i + 1)], t = b.len > a.len ? (s - a.len) / (b.len - a.len) : 0, x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t), psi = lerp(a.psi, b.psi, t), r = psi * Math.PI / 180, side = (j % 2 ? 1 : -1) * 0.042;
    out.push([q(x + Math.sin(r) * side, 3), q(z + Math.cos(r) * side, 3), q(r, 3)]);
  }
  return out;
};

// ---------- cameras (POV = the trainer's eyes, walking on the puppy's right) ----------
const camBase = (f) => {   // side tracking rig for every walking shot (approved): the puppy in profile, the leash runs out of frame to the trainer's hand. Raised a little so the lawn shows the trail.
  const d = dogP(f), S = shotAt(f), cz = Z0 + 0.5 * (d.z - Z0);
  return { pos: [d.x - 0.08 * head(d)[0], 0.85, cz + 2.3 - 0.0015 * (f - S.a)], look: [d.x - 0.08 * head(d)[0], 0.42, cz], fov: 44 };
};
const frontCam = (f, key = 0) => { const d = dogP(f), x = d.x, z = d.z; return { pos: [x + 1.28 + key, 0.88, z + 0.56], look: [x + 0.2, 0.22, z], fov: 42 }; };   // in front of the puppy (it faces us): face + chest, hands from below
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  grab: [{ f: w.grab, pos: [1.28, 0.88, 0.56], look: [0.2, 0.22, 0], fov: 42 }, { f: w.try - 1, pos: [1.23, 0.88, 0.56], look: [0.2, 0.22, 0], fov: 42 }],
  newSpot: [{ f: w.try, pos: [0.05, 0.85, 2.0], look: [0.05, 0.42, 0], fov: 44 }, { f: w.walk1 - 1, pos: [0.05, 0.85, 1.85], look: [0.05, 0.42, 0], fov: 44 }],
  yes: [{ f: w.say2, pos: [0.38, 0.86, 2.4], look: [0.42, 0.56, -0.45], fov: 43 }, { f: w.then3 - 1, pos: [0.38, 0.84, 2.25], look: [0.42, 0.56, -0.45], fov: 43 }],
};
const FRONT = ['rewardNear', 'choose', 'povFinal'];
export const camAt = (f) => {
  const S = shotAt(f); let c;
  if (CAMS[S.id]) c = camFromKeys(CAMS[S.id], f, {});
  else if (FRONT.includes(S.id)) c = camFromKeys([{ f: S.a, ...frontCam(f) }, { f: S.b, ...frontCam(f, -0.05) }], f, {});
  else c = camFromKeys([{ f, ...camBase(f) }, { f: f + 1, ...camBase(f) }], f, { creep: 0 });
  if (!CAMS[S.id]) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 0.6 * Math.sin(f * 0.05); }
  c.shadowAt = [c.look[0], 0.1, c.look[2]];
  return c;
};
const camBasis = (f) => { const C = camAt(f), fw = norm(sub(C.look, C.pos)), rt = norm(cross(fw, [0, 1, 0])), up = cross(rt, fw); return { C, fw, rt, up }; };
const handPt = (f, a, b, c) => { const { C, fw, rt, up } = camBasis(f); return add(C.pos, add(mul(fw, a), add(mul(rt, b), mul(up, c)))); };   // camera-relative point (forward, right, up)

// the trainer's leash hand in the tracking shots: off-screen, hip height, behind the puppy and on the camera side. It stays put while the puppy sniffs / is called back, then catches up.
const relHand = (f) => { const d = dogP(f); return [d.x - 1.0, 0.75, d.z + 0.57]; };
const FREEZE = [[w.say + 8, w.keep], [w.use + 6, w.say2 - 2]];
const trackHand = (f) => { for (const [a, b] of FREEZE) if (f >= a && f < b + 30) return f < b ? relHand(a) : lerp3(relHand(a), relHand(f), sm(ramp(f, b, b + 30))); return relHand(f); };

// ---------- the puppy ----------
const SNIFF = [[w.sniff - 4, w.then2 + 2], [w.sniff2 - 2, w.say2 - 10]];   // windows with the nose on the grass
const sniffK = (f) => Math.max(...SNIFF.map(([a, b]) => win(f, a, b, 12)));
export const dog3At = (f) => {
  const S = shotAt(f), d = dogP(f), hd = head(d);
  const base = { pos: [d.x, 0, d.z], yaw: d.yaw, w: { stand: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.7, ears: 0 };
  const W = worldAt(f), happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const gk = clamp(d.sp / 0.5), gait = gk > 0.02 ? { phase: d.ph, amp: 24, lift: 1.1, k: gk } : undefined;
  const ahead = [d.x + 2.2 * hd[0], 0.0, d.z + 2.2 * hd[2]], H = trackHand(f), toHand = [H[0], 0.4, H[2]];
  const nose = noseAt(d.x, d.z, d.yaw);
  const grass = (k) => [nose[0] + 0.1 * hd[0] - 0.05 * hd[2] * Math.sin(f * 0.2), -0.2 + 0.04 * Math.sin(f * 0.47), nose[2] + 0.1 * hd[2] + 0.05 * hd[0] * Math.sin(f * 0.2)];   // nose-to-grass target, a little sweep + bob
  const walkPose = (look, extra = {}) => ({ ...base, gait, look, neck: 0.5, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2, ...extra });
  const sn = sniffK(f);   // 0..1: nose down
  const sniffy = (look, extra = {}) => ({ ...base, gait, look: lerp3(look, grass(), sn), neck: lerp(0.5, 1.3, sn), lean: 5 * sn, wag: lerp(0.3, 1.0, sn) * Math.sin(f * 0.6), tail: lerp(0.2, 0.4, sn), ears: 0.2 * (1 - sn), ...extra });
  switch (S.id) {
    case 'hook': {
      const dn = sm(ramp(f, w.walk0 - 8, w.walk0 + 10)), away = sm(ramp(f, w.any - 6, w.any + 10)) * (1 - sm(ramp(f, w.any + 30, w.any + 46)));   // "walk": springs up from a sit; "anywhere": looks out over the yard
      const look = lerp3([TRN[0] - 0.05, 0.75, TRN[2]], [3.5, 0.45, -3], away);
      return { ...base, pos: HOOKD, yaw: DOGYAW, w: { sit: 1 - dn, stand: dn }, look, neck: 0.9, wag: 0.8 * Math.sin(f * 0.5), tail: 0.2 + 0.2 * dn, ears: -0.2 };
    }
    case 'grab': {
      const t = W.treat, tl = win(f, w.treats - 6, w.try - 3, 8);
      return { ...base, pos: [0, 0, 0], yaw: DOGYAW, w: { stand: 1 }, look: t && tl > 0.05 ? lerp3([1.4, 0.2, 0.6], t, tl) : [1.4, 0.2, 0.6], neck: 0.5, wag: 0.6 * Math.sin(f * 0.45), tail: 0.2, ears: -0.2, headTilt: 7 * Math.sin(Math.PI * ramp(f, w.leash + 4, w.treats + 6)) };
    }
    case 'newSpot': {
      const up = sm(ramp(f, w.try + 4, w.try + 22));
      const look = KF(f, [[w.try, [3.5, -0.35, 0.1]], [w.try + 12, [3.5, -0.35, 0.1]], [w.try + 26, [3.0, -0.35, -3.0]], [w.spot - 2, [3.0, -0.35, -3.0]], [w.spot + 12, [3.0, -0.25, 2.5]], [w.walk1 - 14, [3.5, -0.35, 0.1]]]);
      return { ...base, pos: [0, 0, 0], yaw: DOGYAW, w: { sit: 1 - up, stand: up }, look, neck: 0.45, wag: 0.5 * Math.sin(f * 0.35), tail: 0.2 + 0.2 * up, ears: 0.2 * Math.sin(f * 0.13) };
    }
    case 'curves': case 'turns': return walkPose(ahead, { wag: 0.55 * Math.sin(f * 0.3), tail: 0.25 });
    case 'stops': {
      const gl = win(f, w.stop + 2, w.then + 8, 9);   // the stop: it glances back up at the hand
      return walkPose(lerp3(ahead, [toHand[0], 0.5, toHand[2]], gl), { neck: 0.5 + 0.2 * gl, wag: 0.2 + 0.6 * gl, tail: 0.2 + 0.2 * gl, ears: -0.2 * gl });
    }
    case 'rewardNear': {
      const t0 = w.reward1 + 3;
      return { ...base, look: W.treat || add(noseAt(d.x, d.z, d.yaw), [0.1, 0.05, 0]), neck: 1, jaw: chompAt(f, t0) || (f >= t0 + 14 ? 0.25 : 0), ...(f > t0 ? happy : {}), blink: f > t0 && f < t0 + 6 ? 1 : base.blink, gait };
    }
    case 'stretch': return walkPose(ahead, { wag: 0.5 * Math.sin(f * 0.3), tail: 0.25 });
    case 'sniff': case 'fixSniff': return sniffy(ahead);
    case 'callBack': {
      const lk = sm(ramp(f, w.then2, w.then2 + 8)) * (1 - sm(ramp(f, w.keep - 4, w.keep + 10)));   // head up, eyes on us while it comes back
      return sniffy(lerp3(ahead, toHand, lk), { neck: lerp(0.5, 1.3, sn), wag: (0.3 + 0.9 * lk) * Math.sin(f * 0.5), tail: 0.2 + 0.2 * lk, ears: -0.25 * lk });
    }
    case 'passBy': {
      const sk = win(f, w.pass + 4, w.people - 4, 14), pk = win(f, w.people - 6, w.reward2 - 6, 12);   // sniffs the flowers; then a passer-by: glance sideways
      const flowers = [SMELL[0], 0.1, SMELL[1]], passer = [d.x + 1.1, 0.36, d.z + 2.2];
      return walkPose(lerp3(lerp3(ahead, flowers, sk), passer, pk), { neck: 0.5 + 0.4 * sk, wag: 0.4 * Math.sin(f * 0.3) + 0.3 * sk, tail: 0.2 + 0.25 * pk, ears: 0.35 * pk - 0.2 * sk });
    }
    case 'choose': {
      const t0 = w.reward2 + 4, aside = [d.x + 0.3, 0.45, d.z - 2.4], at = sm(ramp(f, w.reward2 - 1, w.reward2 + 3));   // it was watching the passer, then chooses us
      const look = W.treat ? lerp3(aside, W.treat, at) : add(noseAt(d.x, d.z, d.yaw), [0.1, 0.05, 0]);
      return { ...base, look, neck: 1, jaw: chompAt(f, t0) || (f >= t0 + 14 ? 0.25 : 0), ...(f > t0 ? happy : {}), blink: f > t0 && f < t0 + 6 ? 1 : base.blink, gait };
    }
    case 'mistake': {
      const tn = tension(f), gl = win(f, w.cut - 2, w.fast + 4, 8);   // looks back at the hand: nothing comes; then the treats are gone and it surges on
      return { ...base, gait, lean: tn * (5 + 1.5 * Math.sin(f * 0.09)), look: lerp3(ahead, toHand, gl), neck: 0.5 + 0.1 * gl - 0.1 * tn, wag: 0.1 + 0.3 * gl, tail: 0.1 + 0.3 * Math.max(0, Math.sin(f * 0.15)) * tn + 0.15 * gl, ears: 0.4 * tn - 0.3 * gl };
    }
    case 'fixTurn': {
      const gl = win(f, w.fade + 6, w.slowly + 20, 8);   // slack again: a glance back at us
      return walkPose(lerp3(ahead, toHand, gl), { neck: 0.5, wag: 0.2 + 0.7 * gl, tail: 0.15 + 0.25 * gl, ears: -0.2 * gl });
    }
    case 'yes': return { ...base, pos: HOOKD, yaw: DOGYAW, w: { sit: 1 }, look: [TRN[0] - 0.05, 0.75, TRN[2]], neck: 0.9, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    case 'povFinal': {
      const t0 = w.reward3 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, look: W.treatHide || !W.treat ? add(noseAt(d.x, d.z, d.yaw), [0.5, -0.4, 0.1]) : add(W.treat, [0, -0.25, 0]), neck: 0.7, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
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
    case 'grab': { const n = add(noseAt(0, 0, DOGYAW), [0.14, -0.02, 0.12]); return KF(f, [[w.treats - 10, rest(f)], [w.treats + 4, n], [w.try - 8, n], [w.try - 2, rest(f)]]); }   // shows a treat next to the puppy's nose, then away (not eaten)
    case 'rewardNear': { const t0 = w.reward1 + 3; return KF(f, [[S.a, rest(f)], [t0 - 3, mouth()], [t0 + 12, mouth()], [t0 + 28, rest(f)]]); }
    case 'choose': { const t0 = w.reward2 + 4; return KF(f, [[S.a, rest(f)], [t0 - 3, mouth()], [t0 + 12, mouth()], [t0 + 28, rest(f)]]); }
    case 'povFinal': { const t0 = w.reward3 + 2; return KF(f, [[w.then3, add(mouth(), [0.3, 0.14, 0.15])], [t0, mouth()]]); }
  }
  return null;
};
const frontShot = (f) => FRONT.includes(shotAt(f).id);
const colAt = (f) => {   // leash colour: teal-blue; green while a check is up; red when taut
  const t = tension(f), green = Math.max(win(f, w.good, w.say, 6), win(f, w.loose - 2, w.then2, 6), win(f, w.slowly - 1, w.say2 - 6, 6)), red = sm(ramp(t, 0.5, 0.92));
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
  else if (S.id === 'grab') { W.leash = { hand: [-0.55, 0.95, 0.65], slack: LOOSE, col: colAt(f) }; if (t) W.hand = { treat: t, pose: 'pinch', side: 0.16 }; }
  else if (S.id === 'newSpot') W.leash = { hand: [-1.35, 0.55, 0.62], slack: LOOSE, col: colAt(f) };
  else if (frontShot(f)) { W.leash = { hand: [d.x - 0.2, 0.75, d.z + 0.9], slack, col: colAt(f) }; if (t) W.hand = { treat: t, pose: 'pinch', side: 0.16 }; }   // trainer's leash hand is out of frame; the right hand feeds
  else W.leash = { hand: trackHand(f), slack, col: colAt(f) };
  if (f >= w.walk1 && f < w.reward1 - 3) W.prints = printsAt(f);
  const hide = (S.id === 'rewardNear' && f >= w.reward1 + 3 + 10) || (S.id === 'choose' && f >= w.reward2 + 4 + 10) || (S.id === 'povFinal' && f >= w.reward3 + 4);
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
  if (S.id === 'grab') return { focus: Math.hypot(C.pos[0] - 0.5, C.pos[1] - 0.3, C.pos[2]), cinf: 6 };
  if (S.id === 'newSpot') return { focus: Math.hypot(C.pos[0], C.pos[1] - 0.3, C.pos[2]), cinf: 4 };
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
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.03 + k * 0.08, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = add(noseAt(d.x, d.z, d.yaw), [0, S.id === 'povFinal' ? 0.09 : 0.12, 0]);
  const above = [d.x, 0.78, d.z + 0.1];   // badge anchor in the tracking shots
  if (S.id === 'hook') badge(T.fxCheck, 'ok', w.nicely + 4, w.any + 14, [0.0, 0.82, -0.42], 0.22);
  if (S.id === 'stretch') badge(T.fxCheck, 'ok', w.good, w.say - 2, above, 0.14);
  if (S.id === 'rewardNear') hearts(w.reward1 + 4, HEAD);
  if (S.id === 'sniff') badge(T.fxCheck, 'ok', w.loose + 2, w.then2 - 1, above, 0.14);
  if (S.id === 'choose') hearts(w.reward2 + 5, HEAD);
  if (S.id === 'mistake') badge(T.fxCross, 'no', w.pull + 2, w.fade - 2, above, 0.15);
  if (S.id === 'fixTurn' || S.id === 'fixSniff') badge(T.fxCheck, 'ok', w.slowly - 1, w.say2 - 6, above, 0.14);
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'sniff') bubble('gs', 'Go sniff!', '', '#ffffff', w.go - 2, w.go + 44, [d.x + 0.1, 0.62, d.z + 0.1], 0.27);
  if (S.id === 'callBack') bubble('cm', 'Come!', '', '#ffffff', w.call - 2, w.call + 40, [d.x + 0.1, 0.62, d.z + 0.1], 0.27);
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), add(dP([185, 640]), [0, 0.1, 0.12]), 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward3 + 3, HEAD, 4, 0.06);
    if (f >= w.reward3) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward3 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(noseAt(d.x, d.z, d.yaw), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
