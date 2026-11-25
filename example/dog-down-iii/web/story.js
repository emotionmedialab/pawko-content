// "Down III" — hold a down: add time, distance, a distraction and the "okay" release. 3D puppy (dog-puppy.glb) + the 2D bald trainer, 1119 frames, timed to voice.mp3 (Holden).
// Word frames (voice.mp3, voice.mp3.words.json, round(s*30)): Let's 0 hold 28 down 37 even 55 exciting 80 | Grab 119 treats 125 mat 150 |
// Ask 177 (silence_end 176; whisper 177) down 190 wait 208 three 212 seconds 223 before 236 mark 253 | Build 288 (silence_end 289) slowly 290 ten 314 then 346 twenty 350 |
// Next 388 (silence_end 388; whisper dated it 397) step 402 side 418 | Turn 441 around 445 walk 468 small 480 circle 487 | Reward 521 staying 550 down 557 |
// Now 594 add 598 small 611 distraction 619 like 647 quiet 656 clap 667 | End 706 every 712 down 724 OK 740 | so 775 stays 788 until 799 say 821 |
// If 852 (whisper 847, silence_end 855) gets 866 up 873 you 897 much 917 | Shorten 962 (silence_end 961) time 974 move 995 closer 1001 | Say 1039 yes 1043 or 1054 click 1067 | then 1095 reward 1099 | end 1118.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and
// action is keyed to `w` (+/- a few frames), so nothing else needs to change. Pointers: HAND in POV shots, PAW cursor in floating shots.
// Hard cuts only, no flashes. Puppy at the origin, nose toward +x.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1119, DECK = 0;
// key word frames (first frame of the word)
const w = {
  hold: 28, down1: 37, exciting: 80, grab: 119, mat: 150, ask: 177, down2: 190, wait: 208, mark: 253, build: 288, ten: 314, twenty: 350,
  next: 388, step: 402, turn: 441, walk: 468, circle: 487, reward1: 521, staying: 550, now: 594, distraction: 619, clap: 667,
  end: 706, okay: 740, so: 775, say: 821, if: 852, up: 873, much: 917, shorten: 962, closer: 1001, say2: 1039, yes: 1043, click: 1067, then2: 1095, reward2: 1099, fin: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },              // trainer + puppy: sit -> down, hand signal; sparks on "exciting", the puppy stays down
  { id: 'setup', a: w.grab, b: w.ask - 1, light: 'day' },         // glide from the treat jar to the mat, check on "mat"
  { id: 'ask', a: w.ask, b: w.build - 1, light: 'day' },          // POV: "Down!" bubble, palm sweep, hold (3 pulses), "Yes!" mark + treat
  { id: 'build', a: w.build, b: w.next - 1, light: 'day' },       // floating: longer hold (slow pulses), paw cursor treat waits, reward at "twenty"
  { id: 'around', a: w.next, b: w.reward1 - 1, light: 'day' },    // trainer stands, steps to the side, turns around, walks a small circle
  { id: 'povReward', a: w.reward1, b: w.now - 1, light: 'day' },  // POV: treat delivered while the puppy stays down
  { id: 'clap', a: w.now, b: w.end - 1, light: 'day' },           // quiet clap (off screen): sound burst, ears perk, puppy stays down, check
  { id: 'okay', a: w.end, b: w.so - 1, light: 'day' },            // "Okay!" bubble releases the puppy up
  { id: 'hold', a: w.so, b: w.if - 1, light: 'day' },             // puppy waits in its down, ring pulses, check
  { id: 'popUp', a: w.if, b: w.shorten - 1, light: 'day' },       // MISTAKE: gets up, red cross
  { id: 'fix', a: w.shorten, b: w.say2 - 1, light: 'day' },       // shorter hold + trainer moves closer, check
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
const HOOKP = [0, MAT, -0.48];                          // hook / fix: puppy close to the trainer's card plane
const SH = (P) => [P[0], P[1], P[2] + HOOKP[2]];
const START = [0.95, 0.12, 0.42];                       // hand rest point: below the frame in POV shots

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
const N_SIT = () => add(NOSE('sit'), [0.06, -0.005, 0]);
const FLOOR = () => [NOSE('down')[0] + 0.045, MAT + 0.05, 0];
const REWARD = () => [NOSE('down')[0] + 0.06, NOSE('down')[1] - 0.09, 0];
const MOUTH = () => add(NOSE('down'), [0.05, -0.02, 0]);

// ---------- trainer placement (card slides; hook / around / fix / yes) ----------
// footprint ring around the puppy: where the (off-screen) trainer walks. Step to the side, turn around, walk a small circle.
const RING = { c: [0.2, 0, -0.04], r: 0.21 };
const ringAng = (g) => (g < w.step ? 0 : g < w.turn ? 40 * sm(ramp(g, w.step, w.step + 28))
  : g < w.walk ? 40 - 18 * sm(ramp(g, w.turn, w.turn + 22)) : 22 + 360 * ramp(g, w.walk, w.walk + 50)) * Math.PI / 180;
const ringPt = (g) => { const a = ringAng(g); return [RING.c[0] + RING.r * Math.cos(a), MAT + 0.012, RING.c[2] + RING.r * Math.sin(a)]; };
/** { x, z, y, s, flip, kneel, moving } of the trainer card in the current shot */
const trainerPlace = (f) => {
  const S = shotAt(f);
  if (S.id === 'fix') {
    const k = sm(ramp(f, w.closer - 12, w.closer + 8)), moving = k > 0 && k < 1;
    return { x: lerp(0.62, TRN[0], k), z: lerp(-1.9, TRN[2], k), y: MAT + (moving ? 0.02 * Math.abs(Math.sin(f * 0.5)) : 0), s: ST, flip: true, kneel: 1, moving };
  }
  return { x: TRN[0], z: TRN[2], y: MAT, s: ST, flip: true, kneel: 1, moving: false };
};

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { down: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  switch (S.id) {
    case 'hook': {
      const dn = sm(ramp(f, 12, w.down1 - 2)), exc = f >= w.exciting - 6 && f < w.exciting + 40;
      return { ...base, pos: HOOKP, w: { sit: 1 - dn, down: dn }, look: [TRN[0] + 0.02, 0.8 - 0.25 * dn, TRN[2]], neck: 1,
        ears: exc ? -0.5 : f < w.down1 - 4 ? -0.3 : 0, wag: exc ? Math.sin(f * 0.8) * 1.1 : 0.4 * Math.sin(f * 0.25), tail: exc ? 0.35 : 0.1, jaw: exc ? 0.3 : 0.1 };
    }
    case 'setup': {
      return { ...base, w: { sit: 1 }, look: [1.6, 0.12 + 0.03 * Math.sin(f * 0.05), 0.3], neck: 1, headTilt: 10 * Math.sin(Math.PI * ramp(f, w.mat - 20, w.mat + 20)), wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    }
    case 'ask': {
      const dn = sm(ramp(f, w.down2 + 2, w.down2 + 30)), t1 = POVT.ask, ch = chompAt(f, t1 + 2);
      const perk = f >= w.down2 && f < w.down2 + 24 ? -0.7 * Math.sin(Math.PI * ramp(f, w.down2, w.down2 + 24)) : 0;
      return { ...base, w: { sit: 1 - dn, down: dn }, look: f < w.down2 + 22 ? (W.lead || [0.95, 0.42, 0.15]) : W.treat ? W.treat : [0.9, 0.24, 0.3], neck: f < w.down2 + 22 ? 0.75 : 0.9, ears: perk - 0.2, jaw: f >= t1 + 16 ? 0.3 : ch,
        headTilt: f >= w.down2 - 6 && f < w.down2 + 8 ? 8 * Math.sin(Math.PI * ramp(f, w.down2 - 6, w.down2 + 8)) : 0,
        ...(f > t1 + 2 ? happy : { wag: 0.4 * Math.sin(f * 0.3) }), blink: f > t1 + 2 && f < t1 + 8 ? 1 : base.blink };
    }
    case 'build': {
      const ch = chompAt(f, EAT.build);
      return { ...base, w: { down: 1 }, look: f >= EAT.build + 6 ? lerp3(REWARD(), [0.9, 0.2, 0.4], sm(ramp(f, EAT.build + 6, EAT.build + 26))) : W.treat || add(FLOOR(), [0.05, 0.08, 0]), neck: 1 - 0.2 * sm(ramp(f, EAT.build + 6, EAT.build + 26)), jaw: f >= EAT.build + 14 ? 0.3 : ch,
        ...(f > EAT.build ? happy : {}), blink: f > EAT.build && f < EAT.build + 6 ? 1 : base.blink };
    }
    case 'around': {
      const P = ringPt(clamp(f, w.step, w.reward1 - 6)), g = f < w.step - 6 ? 1 : 0;
      return { ...base, w: { down: 1 }, look: [clamp(P[0], 0.2, 1.0), 0.2, clamp(P[2], -0.3, 0.6)], neck: 0.65, ears: 0.1 + (f > w.step - 4 && f < w.step + 8 ? -0.5 : 0), tail: 0.15, wag: 0.3 * Math.sin(f * 0.15) };
    }
    case 'povReward': {
      const t1 = POVT.povReward, ch = chompAt(f, t1 + 2);
      return { ...base, w: { down: 1 }, look: W.treatHide || !W.treat ? [0.9, 0.24, 0.3] : W.treat, neck: 0.8, jaw: f >= t1 + 16 ? 0.3 : ch,
        ...(f > t1 + 2 ? happy : {}), blink: f > t1 + 2 && f < t1 + 8 ? 1 : base.blink };
    }
    case 'clap': {
      const t = (a, b) => sm(ramp(f, a, b)), hit = f >= w.clap;
      const k = t(w.clap, w.clap + 6) * (1 - t(w.clap + 26, w.clap + 46)), k2 = t(w.distraction, w.distraction + 8) * (1 - t(w.distraction + 18, w.distraction + 30));   // quick head-turn toward the sound and back; a small glance earlier
      const flick = (f >= w.now + 30 && f < w.now + 38) || (f >= w.distraction + 40 && f < w.distraction + 46) ? -0.5 : 0;
      const thump = f >= w.clap + 30 && f < w.clap + 60 ? 0.8 * Math.abs(Math.sin((f - w.clap - 30) * 0.5)) : 0;
      const rest = [0.9, -0.05, 0.28 + 0.1 * Math.sin(f * 0.035)];
      const lk = lerp3(lerp3(rest, [0.55, -0.05, 0.85], 0.6 * k2), [0.45, -0.05, 0.9], k);
      const lid = f < w.distraction - 20 ? 0.35 + 0.15 * Math.sin(f * 0.05) : base.blink;
      return { ...base, w: { down: 1 }, look: lk, neck: 0.3, ears: flick - 0.9 * k - 0.4 * k2, headTilt: 5 * k, blink: hit && f < w.clap + 40 ? 0 : lid, breath: 0.35 + 0.3 * Math.sin(f * 0.12), wag: hit ? 0.7 * Math.sin(f * 0.5) * (1 - 0.6 * k) : 0.2 * Math.sin(f * 0.2), tail: 0.2 + thump };
    }
    case 'okay': {
      const up = sm(ramp(f, w.okay + 2, w.okay + 30));
      return { ...base, w: { down: 1 - up, stand: up }, look: [0.9, lerp(0.22, 0.34, up), 0.5], neck: 0.5 - 0.1 * up, ears: -0.5 * up, tail: 0.4 * up, wag: up > 0.3 ? Math.sin(f * 0.8) : 0.2 * Math.sin(f * 0.25),
        pos: lerp3(DOGPOS, [0.03, MAT, 0], up), jaw: up > 0.3 ? 0.3 : 0, blink: f >= w.okay + 34 && f < w.okay + 40 ? 1 : base.blink };
    }
    case 'hold': {
      return { ...base, w: { down: 1 }, look: [1.0, 0.16, 0.5 + 0.1 * Math.sin(f * 0.04)], neck: 0.6, ears: -0.2 + (f >= w.say - 6 ? -0.4 : 0), wag: 0.5 * Math.sin(f * 0.3), tail: 0.2, breath: 0.35 + 0.3 * Math.sin(f * 0.14) };
    }
    case 'popUp': {
      const up = M.smooth(M.smooth(ramp(f, w.up - 12, w.up + 16))), settled = ramp(f, w.up + 16, w.up + 30);
      const turn = sm(ramp(f, w.up + 24, w.up + 44)) * (1 - sm(ramp(f, w.up + 56, w.up + 76))), turn2 = sm(ramp(f, w.much + 4, w.much + 20)) * (1 - sm(ramp(f, w.much + 34, w.much + 50)));
      const sway = settled * Math.sin(f * 0.06);
      return { ...base, w: { down: 1 - up, stand: up }, look: [0.9, 0.16, lerp(0.55, -0.45, Math.max(turn, turn2))], neck: 0.55 - 0.1 * up, ears: -0.3 * up + (f > w.much - 8 && f < w.much - 2 ? -0.5 : 0), tail: 0.4 * up,
        wag: up > 0.5 ? Math.sin(f * 0.8) : 0.2 * Math.sin(f * 0.3), pos: add(lerp3(DOGPOS, [0.03, MAT, 0], up), [0.012 * sway, 0, 0.01 * sway]), yaw: DOGYAW + 0.07 * sway * settled, blink: f >= w.up + 8 && f < w.up + 13 ? 1 : base.blink };
    }
    case 'fix': {
      const k = sm(ramp(f, w.closer - 12, w.closer + 8));
      return { ...base, pos: HOOKP, w: { down: 1 }, look: [lerp(0.62, TRN[0], k) + 0.02, 0.55, lerp(-1.9, TRN[2], k)], neck: 1, ears: f >= w.closer + 4 ? -0.4 : 0, ...(f > w.closer + 8 ? happy : { wag: 0.4 * Math.sin(f * 0.25) }) };
    }
    case 'yes': {
      return { ...base, w: { down: 1 }, look: [TRN[0] + 0.05, 0.95, TRN[2]], neck: 1, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0,
        jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    }
    case 'povFinal': {
      const t0 = w.reward2 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, w: { down: 1 }, look: W.treatHide || !W.treat ? [0.9, 0.24, 0.3] : W.treat, neck: 0.8, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4,
        blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: hand / paw pointer + biscuit + rings ----------
const POVT = { ask: w.mark + 6, povReward: w.staying - 10 };   // frame the treat reaches the mouth in each POV shot
const EAT = { build: w.twenty + 12 };                          // paw shot: frame the treat is eaten
const treatPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'ask': { const t1 = POVT.ask; if (f < t1 - 14) return null; return KF(f, [[t1 - 14, START], [t1 - 2, MOUTH()], [t1 + 10, MOUTH()], [t1 + 24, START]]); }
    case 'build': return KF(f, [[w.build, [0.63, MAT + 0.12, 0.12]], [w.twenty + 2, [0.63, MAT + 0.12, 0.12]], [w.twenty + 10, REWARD()]]);   // hovers, waits, then rewards
    case 'povReward': { const t1 = POVT.povReward; return KF(f, [[w.reward1, [0.7, 0.18, 0.32]], [t1 - 2, MOUTH()], [t1 + 10, MOUTH()], [t1 + 26, START]]); }
    case 'povFinal': return KF(f, [[w.then2, add(MOUTH(), [0.3, 0.14, 0.05])], [w.reward2 + 2, MOUTH()]]);
  }
  return null;
};
const leadPath = (f) => {
  const S = shotAt(f);
  if (S.id === 'ask') {   // flat palm held beside the chest, then the down signal: one sweep to the floor, hold, pull back below the frame
    const top = [N_SIT()[0] + 0.18, N_SIT()[1] - 0.12, 0.02], mid = [FLOOR()[0] + 0.1, MAT + 0.15, 0.03], fl = [FLOOR()[0] + 0.1, MAT + 0.06, 0.03];
    return KF(f, [[w.ask, [0.75, 0.25, -0.18]], [w.ask + 9, top], [w.down2 - 1, top], [w.down2 + 8, mid], [w.down2 + 16, fl], [w.down2 + 28, fl], [w.down2 + 44, [0.95, 0.12, 0.45]]]);
  }
  return null;
};
const HANDSHOTS = ['povReward', 'povFinal'];
const PAWSHOTS = { build: '#ff8fb0' };
/** gold ground rings pulsing (time passing) at the given start frames; at most 2 alive at once */
const pulses = (f, starts, life, c, rMax) => starts.map((s0) => { const u = (f - s0) / life; return u >= 0 && u < 1 ? { p: [c[0], MAT + 0.006, c[2]], r: 0.1 + (rMax - 0.1) * sm(u), a: (1 - u) * 0.95 } : null; }).filter(Boolean);
const PUL = { ask: [w.wait + 14, w.wait + 26, w.wait + 38], build: [w.build + 6, w.build + 28, w.ten + 6, w.ten + 28, w.twenty - 6], hold: [w.say - 44, w.say - 22, w.say - 2], fix: [w.shorten + 12, w.shorten + 26] };
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f), lead = leadPath(f);
  if (t) W.treat = t;
  if (lead) W.lead = lead;
  if (t && HANDSHOTS.includes(S.id)) W.hand = { treat: t, side: S.id === 'povFinal' ? 0.22 : 0.16 };
  if (S.id === 'ask') {
    W.hand = { at: lead, pose: 'five', mode: 'reach', palm: [0, -1, 0], fingers: [-0.85, -0.4, -0.35], grip: 'palm', side: 0.12 };
    if (t) W.hand2 = { at: t, pose: 'pinch', side: 0.16 };
  }
  if ((S.id === 'ask' && f >= POVT.ask) || (S.id === 'povReward' && f >= POVT.povReward) || (S.id === 'povFinal' && f >= w.reward2 + 4) || (S.id === 'build' && f >= EAT.build)) W.treatHide = true;
  if (PAWSHOTS[S.id]) {
    W.trailCol = PAWSHOTS[S.id];
    if (t) W.paw = { pos: W.treatHide ? add(t, [0.1 * sm(ramp(f, EAT[S.id], EAT[S.id] + 14)), 0.7 * sm(ramp(f, EAT[S.id], EAT[S.id] + 14)), 0]) : t, s: 0.95 };   // after the chomp the paw flies up and out of frame
  }
  if (S.id === 'around' && f >= w.step - 2) {
    const pts = []; let last = null;
    for (let g = w.step - 2; g <= Math.min(f, w.reward1 - 6); g += 0.5) { if (g > w.turn - 2 && g < w.turn + 22 && g % 4 > 2) continue; const p = ringPt(g); if (!last || Math.hypot(p[0] - last[0], p[2] - last[2]) > 0.055) { pts.push(p); last = p; } }
    W.trail = pts; W.trailS = 1.6; W.trailCol = '#ffffff';
  }
  if (S.id === 'fix') W.rings = pulses(f, PUL.fix, 16, [0.15 + HOOKP[0], 0, HOOKP[2]], 0.4);
  else if (PUL[S.id]) W.rings = pulses(f, PUL[S.id], S.id === 'build' ? 22 : 18, [0.15, 0, 0], S.id === 'build' ? 0.5 : 0.42);
  return W;
};

// ---------- the 2D trainer (hook, around, fix, yes) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5;
  return { kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 4,
    near: { to: [318, 690 - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present', lean: 6 };
};
const trainerAt = (f) => {
  const hi = idle(f, 3), S = shotAt(f), P = trainerPlace(f);
  const o = { hose: true, kneel: P.kneel, expr: 'grin', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.2, headTilt: hi.headTilt, near: 'thumb', far: 'present' };
  if (S.id === 'hook') { o.expr = f > 30 ? 'grin' : 'smile'; o.far = f >= 6 && f < w.down1 + 10 ? 'signal' : 'present'; o.look = 0.6; }
  if (S.id === 'fix') { o.expr = f > w.closer + 6 ? 'proud' : 'grin'; }
  return o;
};

// ---------- cameras ----------
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.mat - 6, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },   // jar ... hard cut ...
    { f: w.mat - 5, pos: [1.22, 0.52, 1.0], look: [0.04, 0.2, 0.0], fov: 38 }, { f: w.ask - 1, pos: [1.1, 0.47, 0.9], look: [0.04, 0.19, 0.0], fov: 38 }],         // ... to the puppy on the mat
  ask: [{ f: w.ask, pos: [1.3, 0.9, 0.6], look: [0.2, 0.33, 0.0], fov: 42 }, { f: w.down2 + 30, pos: [1.26, 0.85, 0.58], look: [0.22, 0.22, 0.0], fov: 42 }, { f: w.build - 1, pos: [1.24, 0.82, 0.56], look: [0.23, 0.2, 0.0], fov: 42 }],
  build: [{ f: w.build, pos: [1.32, 0.66, 0.66], look: [0.18, 0.25, 0.0], fov: 42 }, { f: w.next - 1, pos: [1.24, 0.6, 0.62], look: [0.19, 0.23, 0.0], fov: 42 }],
  around: [{ f: w.next, pos: [1.32, 0.66, 0.66], look: [0.18, 0.27, 0.0], fov: 42 }, { f: w.reward1 - 1, pos: [1.26, 0.62, 0.63], look: [0.19, 0.23, 0.0], fov: 42 }],   // dog-down-ii 'stand' keys verbatim
  povReward: [{ f: w.reward1, pos: [1.3, 0.8, 0.58], look: [0.24, 0.19, 0.0], fov: 42 }, { f: w.now - 1, pos: [1.25, 0.77, 0.55], look: [0.25, 0.18, 0.0], fov: 42 }],
  clap: [{ f: w.now, pos: [1.5, 0.55, 0.96], look: [0.12, 0.2, 0.0], fov: 40 }, { f: w.end - 1, pos: [1.2, 0.46, 0.76], look: [0.12, 0.21, 0.0], fov: 40 }],
  okay: [{ f: w.end, pos: [1.3, 0.62, 0.7], look: [0.14, 0.3, 0.1], fov: 46 }, { f: w.so - 1, pos: [1.25, 0.6, 0.68], look: [0.14, 0.3, 0.1], fov: 46 }],
  hold: [{ f: w.so, pos: [1.05, 0.72, 1.0], look: [0.12, 0.24, 0.03], fov: 42 }, { f: w.if - 1, pos: [1.0, 0.7, 0.96], look: [0.13, 0.23, 0.03], fov: 42 }],
  popUp: [{ f: w.if, pos: [0.9, 0.5, 1.5], look: [0.22, 0.36, 0.05], fov: 46 }, { f: w.shorten - 1, pos: [0.72, 0.5, 1.34], look: [0.22, 0.34, 0.05], fov: 46 }],
  fix: [{ f: w.shorten, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.say2 - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then2 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  povFinal: [{ f: w.then2, pos: [1.34, 0.84, 0.72], look: [0.17, 0.2, 0.0], fov: 42 }, { f: TOTAL - 1, pos: [1.29, 0.81, 0.69], look: [0.18, 0.2, 0.0], fov: 42 }],
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (S.id.startsWith('pov') || S.id === 'ask') { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), head = REF.down ? REF.down.head : [0.3, 0.3, 0];
  if (S.id === 'hook' || S.id === 'yes' || S.id === 'fix') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.id === 'around') return { focus: dist(C.pos, [0.1, 0.1, 0]), cinf: 8 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'clap') return { focus: dist(C.pos, [0.1, 0.22, 0]), cinf: 9 };
  if (S.id === 'popUp') return { focus: dist(C.pos, [0.1, 0.3, 0]), cinf: 6 };
  if (S.id === 'build' || S.id === 'okay' || S.id === 'hold') return { focus: dist(C.pos, [0.12, 0.15, 0]), cinf: 4 };
  return { focus: dist(C.pos, head), cinf: 6 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'yes') { const tO = roundAll({ ...trainerYes(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 }); }
  if (S.id === 'hook' || S.id === 'fix') {
    const P = trainerPlace(f), tO = roundAll({ ...trainerAt(f), mirror: P.flip });
    out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: P.x, y: P.y, z: P.z, s: P.s, flip: P.flip, order: 1, ground: MAT, blobW: 0.8 });
  }
  return out;
};
const BUB_CUE = [0.2, 0.45, -0.02], BUB_MARK = [0.22, 0.36, -0.02], BUB_OK = [0.14, 0.46, 0.0], BUB_YES = [-0.12, 0.78, -0.45];   // bubble anchor points (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = add(NOSE('down'), [-0.08, 0.06, 0]);
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'hook') {   // "exciting": sparks around the puppy, which stays down
    [[0.22, 0.5, -0.42, 0], [0.55, 0.34, -0.4, 5], [-0.08, 0.36, -0.4, 9]].forEach(([x, y, z, d], i) => { const a = w.exciting - 4 + d, k = ramp(f, a, a + 22); if (k > 0 && k < 1) out.push(FX('sp' + i + q(k, 2), (p) => T.fxSpark2(p, 1), [x, y + 0.05 * k, z], 0.2 * M.back(ramp(f, a, a + 7)) * (1 - k * k), { alpha: q(1 - k * k, 2) })); });
  }
  if (S.id === 'setup') badge(T.fxCheck, 'ok', w.mat, w.ask, [0.5, 0.1, 0.5], 0.11);
  if (S.id === 'ask') {
    bubble('bd', 'Down!', '', '#ffffff', w.down2 - 2, w.down2 + 24, BUB_CUE, 0.2);
    bubble('by', 'Yes!', '', '#fbf0b4', w.mark - 2, w.mark + 32, BUB_MARK, 0.2);
    hearts(POVT.ask + 3, add(HEAD, [0, 0, -0.2]));
  }
  if (S.id === 'build') hearts(EAT.build + 1, HEAD);
  if (S.id === 'povReward') { hearts(POVT.povReward + 3, HEAD); badge(T.fxCheck, 'ok', w.staying, w.now, [0.2, 0.34, 0.1], 0.12); }
  if (S.id === 'clap') {
    const SND = [0.05, 0.15, 0.2];   // the clap happens off screen to the right
    [[0, 0.3, 0], [9, 0.2, 0.11]].forEach(([d, s, dy], i) => { const k = q(ramp(f, w.clap + d, w.clap + d + 16), 2); if (k > 0 && k < 1) out.push(FX('ck' + i + k, (p) => T.fxClick(p, k), [SND[0], SND[1] + dy, SND[2]], s)); });
    badge(T.fxCheck, 'ok', w.clap + 30, w.end, [0.2, 0.36, 0.1], 0.12);
  }
  if (S.id === 'okay') bubble('bo', 'Okay!', '', '#fbf0b4', w.okay - 2, w.okay + 30, BUB_OK, 0.22);
  if (S.id === 'hold') badge(T.fxCheck, 'ok', w.say + 2, w.if, [0.1, 0.36, 0.1], 0.12);
  if (S.id === 'popUp') badge(T.fxCross, 'no', w.much - 3, w.shorten, [0.3, 0.5, 0.1], 0.2);
  if (S.id === 'fix') { badge(T.fxCheck, 'ok', w.closer + 6, w.say2, [-0.05, 0.5, HOOKP[2]], 0.2); }
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward2 + 3, HEAD, 4, 0.06);
    if (f >= w.reward2) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward2 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('down'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
