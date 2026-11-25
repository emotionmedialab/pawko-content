// "Impulse control II" — a treat on the mat under the POV hand: the puppy backs away -> reward from the other hand; wait longer (ring pulses); "Okay!" release;
// one temptation (a red ball); daily use (cuts); the mistake (dives, red cross, hand covers again calmly); the fix (easier). 3D puppy + 2D kneeling trainer, 1097 frames, voice.mp3 (Holden).
// Word frames (voice.mp3.words.json, round(s*30); sentence starts taken from silence_end): Let's 0 wait 28 even 45 there 89 | Grab 139 (silence_end 138.9; whisper 138) treats 143 quiet 164 |
// Drop 208 (silence_end 208.2; whisper 206) treat 217 floor 230 cover 248 hand 269 | When 300 backs 310 away 320 | reward 345 (silence_end 345) other 367 hand 372 |
// Next 408 (silence_end 408) wait 430 (silence_end 430) seconds 443 longer 453 time 473 | Then 503 (silence_end 503) okay 524 release 548 |
// Now 592 (silence_end 592) one 605 temptation 613 toy 652 floor 670 | Then 704 (silence_end 704) every 718 day 724 before 744 meals 749 before 769 greeting 776 people 785 |
// If 821 (silence_end 821; whisper 813) dives 830 in 841 you 864 much 883 | Change 932 (silence_end 932) one 943 thing 952 make 975 easier 986 | Say 1015 (silence_end 1015) yes 1019 click 1045 | then 1070 reward 1072 | end 1096.
// RE-TIME (real narrator): run transcribe.py on the new voice, update TOTAL and the word table `w` below. Every shot boundary and
// action is keyed to `w` (+/- a few frames). Pointers: HAND in POV shots. Hard cuts only, no flashes. Puppy near the origin, nose toward +x.
import { M, camFromKeys, idle, blinkAt, q, clamp, lerp, lerp3, ramp, spline } from './motion.js';
import { trainerShoulder } from './toon.js';
import { VENV } from './voiceenv.js';
export const FPS = 30, TOTAL = 1097, DECK = 0;
// key word frames (first frame of the word)
const w = {
  wait1: 28, there: 89, grab: 139, quiet: 164, drop: 208, treat: 217, floor: 230, cover: 248, when: 300, backs: 310, away: 320, reward: 345, other: 367,
  next: 408, wait2: 430, seconds: 443, longer: 453, time: 473, then: 503, okay: 524, release: 548, now: 592, one: 605, temptation: 613, toy: 652, floor2: 670,
  then2: 704, day: 724, before: 744, meals: 749, before2: 769, greeting: 776, people: 785, if: 821, dives: 830, in: 841, you: 864, much: 883,
  change: 932, one2: 943, thing: 952, make: 975, easier: 986, say: 1015, yes: 1019, click: 1045, then3: 1070, reward2: 1072, fin: TOTAL - 1,
};
export const SHOTS = [
  { id: 'hook', a: 0, b: w.grab - 1, light: 'day' },              // kneeling trainer + puppy (sit, stays), sparks on "right there"
  { id: 'setup', a: w.grab, b: w.drop - 1, light: 'day' },        // treat jar -> hard cut to the puppy on the mat, check on "quiet"
  { id: 'drop', a: w.drop, b: w.when - 1, light: 'day' },         // POV: the hand drops a treat on the mat and covers it, palm down
  { id: 'back', a: w.when, b: w.reward - 1, light: 'day' },       // POV: sniffs, pulls its head back and steps back
  { id: 'reward', a: w.reward, b: w.next - 1, light: 'day' },     // POV: reward from the OTHER hand (lower right), check
  { id: 'wait', a: w.next, b: w.then - 1, light: 'day' },         // POV: longer wait, ring pulses, then the reward
  { id: 'release', a: w.then, b: w.now - 1, light: 'day' },       // POV: "Okay!" bubble, the hand lifts, the puppy takes the treat
  { id: 'toy', a: w.now, b: w.then2 - 1, light: 'day' },          // POV: a red ball on the mat, looks at it, back at you, reward
  { id: 'daily', a: w.then2, b: w.before - 1, light: 'day' },     // quick cut: the same wait, ring pulses
  { id: 'bowl', a: w.before, b: w.greeting - 1, light: 'day' },    // quick cut: a food bowl before meals, the puppy waits
  { id: 'greet', a: w.greeting, b: w.if - 1, light: 'day' },       // quick cut: the kneeling trainer greets, the puppy waits
  { id: 'dive', a: w.if, b: w.change - 1, light: 'day' },         // MISTAKE: dives at the treat, red cross, the hand covers it again calmly
  { id: 'fix', a: w.change, b: w.say - 1, light: 'day' },         // FIX: the ball is gone (one thing), easier, reward, check
  { id: 'yes', a: w.say, b: w.then3 - 1, light: 'golden' },       // trainer: "yes" + click
  { id: 'povFinal', a: w.then3, b: TOTAL - 1, light: 'golden' },  // POV: reward, confetti
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
const MAT = 0.064, ST = 1.08;
const DOGPOS = [0, MAT, 0], DOGYAW = Math.PI / 2;      // puppy on the mat, nose toward +x
const TRN = [0.52, MAT, -0.66];
const HOOKP = [0, MAT, -0.48];                          // hook / greet: puppy close to the trainer's card plane
const START = [0.95, 0.12, 0.42];                       // hand rest point: below the frame in POV shots
const X0 = -0.02, XB = X0 - 0.14, XM = X0 - 0.08, XE = X0 + 0.03;   // standing puppy x: at the hand, backed away, mid, at the treat

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
const TS = () => [NOSE('stand')[0] + X0 + 0.04, MAT + 0.02, 0.0];                     // the treat on the mat
const COV = () => add(TS(), [0.0, 0.045, 0.0]);                                    // the covering palm
const DOWNW = [0.95, 0.12, 0.45];

// ---------- the standing puppy's x along the mat (one place for every shot) ----------
const xAt = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'drop': return lerp(0, X0, sm(ramp(f, w.drop, w.drop + 28)));
    case 'back': return KF(f, [[w.when, X0], [w.when + 8, X0 + 0.02], [w.backs + 4, X0 + 0.02], [w.backs + 32, XB]]);
    case 'reward': case 'wait': return XB;
    case 'release': return KF(f, [[w.okay + 14, XB], [w.okay + 46, XE]]);
    case 'toy': return KF(f, [[w.now, XE], [w.now + 22, XM]]);
    case 'daily': case 'bowl': return XM;
    case 'dive': return KF(f, [[w.dives - 4, XM], [w.dives + 10, XM + 0.07], [w.dives + 16, XM + 0.07], [w.dives + 44, XM], [w.much + 14, XM], [w.much + 36, XM - 0.05]]);
    case 'fix': return KF(f, [[w.thing + 2, XM], [w.thing + 24, XM - 0.07]]);
    case 'povFinal': return XM - 0.03;
  }
  return 0;
};
const STRIDE = 0.15;
const xIn = (f, g) => (shotAt(g).id === shotAt(f).id ? xAt(g) : xAt(f));   // never look across a cut (no phantom step)
const moveK = (f) => clamp(Math.abs(xIn(f, f + 3) - xIn(f, f - 3)) / 0.012);
const pupPos = (f) => [xAt(f), MAT, 0];
const noseAt = (f) => add(NOSE('stand'), [xAt(f), 0, 0]);                           // nose of the standing puppy (rest pose)
const MOUTH = (f) => add(noseAt(f), [0.05, -0.03, 0]);
const HEADP = (f) => add(noseAt(f), [-0.02, 0.1, 0]);
const BALL = [0.2, MAT + 0.05, 0.2];                                              // the temptation: screen-left of the treat

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { down: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const flick = Math.max(0, Math.sin(f * 0.11 + 1)) ** 12;
  const x = xAt(f), mk = moveK(f);
  const stand = { ...base, w: { stand: 1 }, pos: pupPos(f), gait: mk > 0.02 ? { phase: x / STRIDE, amp: 30, lift: 1.1, k: mk } : undefined, ears: -0.25 * flick };
  const sway = { pos: add(stand.pos, [0.004 * Math.sin(f * 0.037), 0, 0.004 * Math.sin(f * 0.029 + 1)]) };
  const lk = (P, dy = 0) => [P[0], Math.min(P[1] + dy, 0.3), P[2]];
  const TSf = TS();
  switch (S.id) {
    case 'hook': {
      const exc = f >= w.there - 8 && f < w.there + 30;
      return { ...base, pos: HOOKP, w: { sit: 1 }, look: [TRN[0] + 0.02, 0.4, TRN[2]], neck: 0.4, ears: exc ? -0.5 : -0.1 + 0.15 * Math.sin(f * 0.05), headTilt: 6 * Math.sin(f * 0.045),
        wag: exc ? Math.sin(f * 0.8) * 1.1 : 0.4 * Math.sin(f * 0.25), tail: exc ? 0.35 : 0.1, jaw: exc ? 0.3 : 0.1 };
    }
    case 'setup': return { ...base, pos: [-0.04, MAT, 0.02], w: { down: 1 }, look: [1.2, -0.2 + 0.03 * Math.sin(f * 0.05), 0.4], neck: 0.2, headTilt: 10 * Math.sin(Math.PI * ramp(f, w.quiet - 20, w.quiet + 20)), wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    case 'drop': {
      const dn = sm(ramp(f, w.drop + 2, w.drop + 30)), land = f >= w.floor + 4;
      return { ...stand, w: { down: 1 - dn, stand: dn }, look: lk(W.treat || TSf, 0.04), neck: 0.8, ears: -0.2 + (f >= w.cover - 4 && f < w.cover + 8 ? -0.4 : 0), headTilt: land ? 7 * Math.sin(f * 0.07) : 0,
        wag: 0.5 * Math.sin(f * 0.3), tail: 0.2 };
    }
    case 'back': {
      const lean = sm(ramp(f, w.backs - 2, w.backs + 12));
      return { ...stand, look: [TSf[0] + 0.1 + 0.2 * lean, 0.1 + 0.05 * lean, 0.12 * lean], neck: 0.85 - 0.4 * lean + 0.25 * sm(ramp(f, w.away, w.away + 20)), ears: -0.3 - 0.3 * lean, headTilt: 5 * lean * (1 - sm(ramp(f, w.away, w.away + 20))), wag: 0.3 * Math.sin(f * 0.2), tail: 0.15 };
    }
    case 'reward': {
      const t1 = EAT.reward, ch = chompAt(f, t1);
      return { ...stand, look: f < t1 + 2 ? lk(W.treat || [TSf[0], 0.2, 0.2], 0) : lerp3(add(MOUTH(f), [0.15, -0.04, 0.05]), [0.6, 0.2, 0.35], sm(ramp(f, t1 + 8, t1 + 28))), neck: 0.75, jaw: f >= t1 + 16 ? 0.3 : ch,
        ...(f > t1 ? happy : { wag: 0.4 * Math.sin(f * 0.3) }), blink: f > t1 && f < t1 + 6 ? 1 : base.blink };
    }
    case 'wait': {
      const t1 = EAT.wait, ch = chompAt(f, t1), sw = 0.01 * Math.sin(f * 0.045);
      const pre = [TSf[0] + 0.02, 0.12 + 0.02 * Math.sin(f * 0.05), 0.04 + 0.06 * Math.sin(f * 0.031)];
      return { ...stand, pos: add(stand.pos, [sw, 0, 0.006 * Math.sin(f * 0.03)]), look: f < t1 - 4 ? pre : W.treat ? lk(W.treat) : lerp3(add(MOUTH(f), [0.15, -0.04, 0.05]), [0.6, 0.2, 0.35], sm(ramp(f, t1 + 8, t1 + 26))), neck: 0.8, headTilt: f < t1 - 6 ? 7 * Math.sin(f * 0.04) : 0,
        jaw: f >= t1 + 16 ? 0.3 : ch, ears: -0.3 * flick - 0.15, ...(f > t1 ? happy : { wag: 0.3 * Math.sin(f * 0.2) }), blink: f > t1 && f < t1 + 6 ? 1 : base.blink };
    }
    case 'release': {
      const up = sm(ramp(f, w.okay + 8, w.okay + 24)), eat = EAT.release, ch = chompAt(f, eat);
      const look = f < w.okay + 8 ? [TSf[0] + 0.02, 0.14 + 0.02 * Math.sin(f * 0.05), 0.05] : f < eat ? lk(TSf, 0.0) : lerp3(add(MOUTH(f), [0.15, -0.04, 0.05]), [0.6, 0.2, 0.35], sm(ramp(f, eat + 10, eat + 28)));
      return { ...stand, look, neck: 0.85 - 0.1 * up, jaw: f >= eat + 16 ? 0.3 : ch, ears: f > w.okay && f < w.okay + 14 ? -0.5 : -0.2, headTilt: f < w.okay ? 6 * Math.sin(f * 0.04) : 0,
        ...(f > w.okay + 20 ? { wag: Math.sin(f * 0.8), tail: 0.35 } : { wag: 0.3 * Math.sin(f * 0.2) }), blink: f > eat && f < eat + 6 ? 1 : base.blink };
    }
    case 'toy': {
      const t1 = EAT.toy, ch = chompAt(f, t1);
      const toB = sm(ramp(f, w.toy - 4, w.toy + 10)) * (1 - sm(ramp(f, w.toy + 28, w.toy + 44))), cam = [1.3, 0.5, 0.6];
      const look = f < w.toy - 6 ? [TSf[0] + 0.02, 0.14 + 0.02 * Math.sin(f * 0.05), 0.05] : f < t1 - 6 ? lerp3(lerp3([TSf[0] + 0.02, 0.14, 0.05], [BALL[0], 0.1, BALL[2]], toB), cam, sm(ramp(f, w.toy + 28, w.toy + 44))) : lerp3(add(MOUTH(f), [0.15, -0.04, 0.05]), [0.6, 0.2, 0.35], sm(ramp(f, t1 + 8, t1 + 26)));
      return { ...stand, look, neck: 0.8, headTilt: 8 * toB, ears: -0.2 - 0.2 * toB, jaw: f >= t1 + 16 ? 0.3 : ch, ...(f > t1 ? happy : { wag: 0.3 * Math.sin(f * 0.2) + 0.3 * toB }), blink: f > t1 && f < t1 + 6 ? 1 : base.blink };
    }
    case 'daily': return { ...stand, pos: add(stand.pos, [0.008 * Math.sin(f * 0.05), 0, 0.005 * Math.sin(f * 0.04)]), look: [TSf[0] + 0.02, 0.14, 0.04 + 0.04 * Math.sin(f * 0.07)], neck: 0.8, headTilt: 6 * Math.sin(f * 0.06), ears: -0.15 - 0.3 * flick, wag: 0.5 * Math.sin(f * 0.3) };
    case 'bowl': return { ...stand, pos: add(stand.pos, [0.006 * Math.sin(f * 0.05), 0, 0]), look: [BOWL[0], 0.1, BOWL[2]], neck: 0.75, headTilt: 5 * Math.sin(f * 0.1), ears: -0.2, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2 };
    case 'greet': return { ...base, pos: HOOKP, w: { sit: 1 }, look: [TRN[0] + 0.02, 0.4, TRN[2]], neck: 0.4, ears: -0.1 + 0.15 * Math.sin(f * 0.05), headTilt: 6 * Math.sin(f * 0.05), wag: 0.5 * Math.sin(f * 0.3), tail: 0.15, ...(f >= w.greeting ? { wag: Math.sin(f * 0.6) * 0.8, tail: 0.3 } : {}) };
    case 'dive': {
      const lunge = sm(ramp(f, w.dives - 4, w.dives + 10)) * (1 - sm(ramp(f, w.dives + 16, w.dives + 44)));
      const sad = sm(ramp(f, w.dives + 40, w.you));
      const look = lerp3([TSf[0] + 0.02, 0.14, 0.05], [TSf[0] - 0.02, 0.06, 0.0], lunge);
      return { ...stand, w: { down: 0.5 * lunge, stand: 1 - 0.5 * lunge }, pos: add(stand.pos, f > w.dives + 44 ? [0.006 * Math.sin(f * 0.05), 0, 0.012 * Math.sin(f * 0.04)] : [0, 0, 0]), look: lerp3(look, [TSf[0] - 0.05, 0.1, 0.05], sad * 0.6), neck: 0.85 - 0.3 * sad + 0.3 * lunge, ears: -0.4 * lunge - 0.5 * sad - (f > w.dives + 44 ? 0.4 * flick : 0), tail: 0.3 - 0.2 * sad,
        headTilt: 7 * sad * Math.sin(f * 0.05), wag: 0.5 * Math.sin(f * 0.4) * (1 - sad), jaw: lunge > 0.5 ? 0.4 : 0 };
    }
    case 'fix': {
      const t1 = EAT.fix, ch = chompAt(f, t1), back = sm(ramp(f, w.thing + 2, w.thing + 24));
      const look = f < t1 - 6 ? [TSf[0] + 0.02, 0.14 + 0.02 * Math.sin(f * 0.05), 0.04 - 0.1 * back] : lerp3(add(MOUTH(f), [0.15, -0.04, 0.05]), [0.6, 0.2, 0.35], sm(ramp(f, t1 + 8, t1 + 26)));
      return { ...stand, look, neck: 0.8, headTilt: 6 * Math.sin(f * 0.05), ears: -0.2, jaw: f >= t1 + 16 ? 0.3 : ch, ...(f > t1 ? happy : { wag: 0.3 * Math.sin(f * 0.2) }), blink: f > t1 && f < t1 + 6 ? 1 : base.blink };
    }
    case 'yes': return { ...base, w: { down: 1 }, look: [TRN[0] + 0.05, 0.95, TRN[2]], neck: 1, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    case 'povFinal': {
      const t0 = w.reward2 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...stand, look: W.treatHide || !W.treat ? [0.9, 0.24, 0.3] : W.treat, neck: 0.8, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: hands, biscuits, ball, bowl, rings ----------
const BOWL = [0.3, MAT, -0.1];
const EAT = { reward: w.reward + 18, wait: w.time + 10, release: w.okay + 48, toy: w.floor2 + 16, fix: w.easier - 2 };   // frame the treat reaches the mouth
const feedKeys = (f, t1) => KF(f, [[t1 - 16, START], [t1 - 2, MOUTH(f)], [t1 + 3, MOUTH(f)], [t1 + 10, add(MOUTH(f), [0.05, -0.22, 0.12])], [t1 + 22, START]]);   // takes the treat, drops straight down, leaves below the frame
/** hand with a biscuit (right hand): the treat is dropped on the mat in 'drop'; fed to the mouth in the reward shots */
const feedPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'drop': { const T = TS(), hov = add(T, [0.02, 0.2, 0.02]); return KF(f, [[w.drop, START], [w.treat + 4, hov], [w.floor + 6, add(T, [0, 0.035, 0])], [w.floor + 24, START]]); }
    case 'reward': return feedKeys(f, EAT.reward);
    case 'wait': return feedKeys(f, EAT.wait);
    case 'toy': return feedKeys(f, EAT.toy);
    case 'fix': return feedKeys(f, EAT.fix);
    case 'povFinal': return KF(f, [[w.then3, add(MOUTH(f), [0.3, 0.14, 0.05])], [w.reward2 + 2, MOUTH(f)]]);
  }
  return null;
};
/** the covering hand (left, palm down): on the mat over the treat in every POV shot; lifts at "Okay!"; lifts a little on the dive */
const coverPath = (f) => {
  const S = shotAt(f), C = COV(), up = (k) => add(C, [0, k, 0]);
  switch (S.id) {
    case 'drop': return KF(f, [[w.floor + 14, [0.75, 0.25, -0.18]], [w.cover + 8, up(0.03)], [w.cover + 20, C]]);
    case 'back': return add(C, [0, 0.004 * Math.sin(f * 0.1), 0]);
    case 'reward': return C;
    case 'wait': return C;
    case 'release': return KF(f, [[w.then, C], [w.okay + 2, C], [w.okay + 12, up(0.1)], [w.okay + 26, DOWNW]]);
    case 'toy': return C;
    case 'daily': case 'bowl': return f < w.before ? C : null;
    case 'dive': return C;
    case 'fix': return C;
  }
  return null;
};
const pulses = (f, starts, life, c, rMax) => starts.map((s0) => { const u = (f - s0) / life; return u >= 0 && u < 1 ? { p: [c[0], MAT + 0.006, c[2]], r: 0.1 + (rMax - 0.1) * sm(u), a: (1 - u) * 0.95 } : null; }).filter(Boolean);
const PUL = { wait: [w.wait2 + 2, w.wait2 + 26, w.seconds + 14, w.longer + 10, w.longer + 38], toy: [w.now + 8, w.now + 30], daily: [w.then2 + 6, w.then2 + 24], bowl: [w.before + 4], fix: [w.change + 8] };
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const feed = feedPath(f), cov = coverPath(f), T = TS();
  const POV = ['drop', 'back', 'reward', 'wait', 'release', 'toy', 'daily', 'fix', 'dive', 'povFinal'];
  const holds = ['drop', 'reward', 'wait', 'toy', 'fix'].includes(S.id) && f < (S.id === 'drop' ? w.floor + 6 : EAT[S.id]);
  const eaten = (S.id === 'reward' || S.id === 'wait' || S.id === 'toy' || S.id === 'fix') && f >= EAT[S.id] || (S.id === 'povFinal' && f >= w.reward2 + 4);
  if (feed && holds) W.treat = feed;
  else if (S.id === 'povFinal' && feed && !eaten) W.treat = feed;
  if (eaten) W.treatHide = true;
  // the biscuit lying on the mat (from the drop until it is eaten in 'release')
  const floorOn = (S.id === 'drop' && f >= w.floor + 6) || ['back', 'reward', 'wait', 'toy', 'daily', 'dive', 'fix'].includes(S.id) || (S.id === 'release' && f < EAT.release);
  if (floorOn) W.floorTreat = S.id === 'release' ? lerp3(T, MOUTH(EAT.release), sm(ramp(f, EAT.release - 8, EAT.release))) : T;   // the puppy snaps it up
  if (S.id === 'release' && f >= EAT.release) W.floorHide = true;
  if (feed && POV.includes(S.id)) { const holding = W.treat && !W.treatHide; W.hand = holding ? { treat: feed, side: 0.16 } : { at: feed, pose: 'pinch', side: 0.16 }; if (S.id === 'povFinal') W.hand.side = 0.22; if (S.id === 'drop' && f > w.floor + 6) W.hand.pose = 'pinch'; }
  if (cov) W.hand2 = { at: cov, pose: 'five', mode: 'reach', palm: [0, -1, 0], fingers: [-0.85, -0.4, -0.35], grip: 'palm', side: -0.12 };
  if (S.id === 'toy') { const k = sm(ramp(f, w.toy - 12, w.toy - 2)); if (k > 0) { W.ball = BALL; W.ballS = M.back(ramp(f, w.toy - 12, w.toy - 2)); } }
  if (S.id === 'dive') W.ball = BALL;
  if (S.id === 'fix') { const k = 1 - sm(ramp(f, w.one2, w.one2 + 8)); if (k > 0.02) { W.ball = BALL; W.ballS = k; } }
  if (S.id === 'bowl') W.bowl = BOWL;
  if (PUL[S.id]) W.rings = pulses(f, PUL[S.id], S.id === 'wait' ? 24 : 18, [xAt(f) + 0.12, 0, 0], S.id === 'wait' ? 0.5 : 0.42);
  return W;
};

// ---------- the 2D trainer (hook, greet, yes) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5;
  return { kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 4,
    near: { to: [318, 690 - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present', lean: 6 };
};
const trainerAt = (f) => {
  const hi = idle(f, 3), S = shotAt(f);
  const o = { hose: true, kneel: 1, expr: 'grin', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.2, headTilt: hi.headTilt, near: 'thumb', far: 'present' };
  if (S.id === 'hook') { o.expr = f > 30 ? 'grin' : 'smile'; o.far = f >= 6 && f < 60 ? 'signal' : 'present'; o.look = 0.6; }
  if (S.id === 'greet') { o.expr = 'grin'; o.far = f >= w.greeting + 2 && f < w.if - 14 ? 'wave' : 'present'; o.look = 0.4; }
  return o;
};

// ---------- cameras ----------
const POVK = (a, b, c0, c1) => [{ f: a, pos: c0.pos, look: c0.look, fov: 42 }, { f: b, pos: c1.pos, look: c1.look, fov: 42 }];
const P0 = { pos: [1.3, 0.75, 0.6], look: [0.15, 0.19, 0.0] }, P1 = { pos: [1.25, 0.72, 0.57], look: [0.16, 0.19, 0.0] };
const HOOKC = (a, b) => [{ f: a, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: b, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }];
const CAMS = {
  hook: HOOKC(0, w.grab - 1),
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.quiet - 6, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },   // jar ... hard cut ...
    { f: w.quiet - 5, pos: [1.22, 0.52, 1.0], look: [0.04, 0.2, 0.0], fov: 38 }, { f: w.drop - 1, pos: [1.17, 0.5, 0.96], look: [0.04, 0.19, 0.0], fov: 38 }],         // ... to the puppy on the mat
  drop: POVK(w.drop, w.when - 1, P0, P1),
  back: POVK(w.when, w.reward - 1, P1, { pos: [1.22, 0.79, 0.57], look: [0.07, 0.25, 0.0] }),
  reward: POVK(w.reward, w.next - 1, { pos: [1.3, 0.83, 0.6], look: [0.04, 0.24, 0.0] }, { pos: [1.25, 0.8, 0.58], look: [0.05, 0.24, 0.0] }),
  wait: POVK(w.next, w.then - 1, { pos: [1.3, 0.8, 0.6], look: [0.04, 0.23, 0.0] }, { pos: [1.22, 0.77, 0.57], look: [0.05, 0.23, 0.0] }),
  release: POVK(w.then, w.now - 1, { pos: [1.3, 0.8, 0.6], look: [0.04, 0.23, 0.0] }, { pos: [1.24, 0.78, 0.58], look: [0.12, 0.23, -0.06] }),
  toy: POVK(w.now, w.then2 - 1, { pos: [1.3, 0.82, 0.6], look: [0.1, 0.23, 0.06] }, { pos: [1.24, 0.78, 0.57], look: [0.1, 0.23, 0.06] }),
  daily: POVK(w.then2, w.before - 1, { pos: [1.3, 0.82, 0.62], look: [0.06, 0.24, 0.0] }, { pos: [1.25, 0.79, 0.6], look: [0.07, 0.24, 0.0] }),
  bowl: [{ f: w.before, pos: [1.32, 0.66, 0.66], look: [0.16, 0.22, -0.05], fov: 42 }, { f: w.greeting - 1, pos: [1.27, 0.63, 0.63], look: [0.17, 0.22, -0.05], fov: 42 }],
  greet: HOOKC(w.greeting, w.if - 1),
  dive: POVK(w.if, w.change - 1, { pos: [1.3, 0.82, 0.6], look: [0.06, 0.24, 0.0] }, { pos: [1.24, 0.78, 0.57], look: [0.07, 0.24, 0.0] }),
  fix: POVK(w.change, w.say - 1, { pos: [1.3, 0.82, 0.6], look: [0.08, 0.23, 0.04] }, { pos: [1.24, 0.78, 0.57], look: [0.07, 0.23, 0.04] }),
  yes: [{ f: w.say, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then3 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  povFinal: [{ f: w.then3, pos: [1.3, 0.8, 0.62], look: [0.08, 0.2, 0.0], fov: 42 }, { f: TOTAL - 1, pos: [1.25, 0.77, 0.59], look: [0.09, 0.2, 0.0], fov: 42 }],
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (!['hook', 'setup', 'greet', 'yes', 'bowl'].includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  if (!['hook', 'setup', 'greet', 'yes', 'bowl'].includes(S.id)) { c.look = add(c.look, [0, 0.04, 0.07]); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), head = REF.stand ? noseAt(f) : [0.3, 0.3, 0];
  if (S.id === 'hook' || S.id === 'yes' || S.id === 'greet') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'bowl') return { focus: dist(C.pos, [0.1, 0.15, 0]), cinf: 5 };
  return { focus: dist(C.pos, head), cinf: 6 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'yes') { const tO = roundAll({ ...trainerYes(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 }); }
  if (S.id === 'hook' || S.id === 'greet') {
    const tO = roundAll({ ...trainerAt(f), mirror: true });
    out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 });
  }
  return out;
};
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
const BUB_YES = [-0.12, 0.78, -0.45];
export const fxAt = (f, T) => {
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - ramp(f, b - 4, b)), 2);   // pops out in 4 frames
  // badge: `pos` is the badge CENTRE, fixed on screen; the card origin is its bottom edge, so lift it by 1.07*scale to keep the centre still while it pops
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), [pos[0], pos[1] - 1.07 * s * k, pos[2]], s * k, { roll: q(0.04 * Math.sin(f * 0.2), 2) })); } };
  const timer = (a, b, pos, s, lab, pr) => { if (f >= a && f < b) { const k = pop(a, b), L = lab(f), P = q(pr(f), 2); if (k > 0.02) out.push(FX('tm' + L + P + k, (p) => T.fxTimer(p, L, P), [pos[0], pos[1] - 1.07 * s * k, pos[2]], s * k)); } };
  const hearts = (t0, at0, n = 3, sc = 0.06) => { const at = add(at0, HOFF); { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] - 0.02 + k * 0.1, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } } };
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  const HOFF = [0, 0.01, 0.13];   // hearts sit to the left of the head, never under the badge
  const TP = (g) => add(noseAt(g), [0.0, 0.17, 0.2]);   // timer: above-left of the head, full size
  const BP = (g) => add(noseAt(g), [-0.02, 0.2, 0.0]);   // badge centre: fixed point above the head   // badge anchor: above-left of the head        // anchor above the standing head
  if (S.id === 'hook') {   // "right there": sparks around the puppy, which stays put
    [[0.22, 0.5, -0.42, 0], [0.55, 0.34, -0.4, 5], [-0.08, 0.36, -0.4, 9]].forEach(([x, y, z, d], i) => { const a = w.there - 8 + d, k = ramp(f, a, a + 22); if (k > 0 && k < 1) out.push(FX('sp' + i + q(k, 2), (p) => T.fxSpark2(p, 1), [x, y + 0.05 * k, z], 0.2 * M.back(ramp(f, a, a + 7)) * (1 - k * k), { alpha: q(1 - k * k, 2) })); });
  }
  if (S.id === 'setup') badge(T.fxCheck, 'ok', w.quiet, w.drop, [0.0, 0.54, -0.05], 0.11);
  if (S.id === 'reward') { hearts(EAT.reward + 1, add(HEADP(f), [-0.06, 0, 0.06])); badge(T.fxCheck, 'ok', EAT.reward + 12, w.next, BP(w.next - 1), 0.12); }
  if (S.id === 'wait') {
    timer(w.next + 6, EAT.wait - 1, TP(w.next), 0.12, (g) => (g < w.longer ? '3s' : '5s'), (g) => (g < w.longer ? ramp(g, w.next + 10, w.longer - 4) : ramp(g, w.longer, EAT.wait - 5)));
    hearts(EAT.wait + 1, add(HEADP(f), [-0.06, 0, 0.06])); badge(T.fxCheck, 'ok', EAT.wait + 10, w.then, BP(w.then - 1), 0.12);
  }
  if (S.id === 'release') { bubble('bo', 'Okay!', '', '#fbf0b4', w.okay - 2, w.okay + 30, add(noseAt(f), [0.0, 0.03, -0.03]), 0.18); hearts(EAT.release + 1, add(HEADP(f), [-0.06, 0, 0.06])); badge(T.fxCheck, 'ok', EAT.release + 12, w.now, BP(w.now - 1), 0.12); }
  if (S.id === 'toy') { hearts(EAT.toy + 1, add(HEADP(f), [-0.06, 0, 0.06])); badge(T.fxCheck, 'ok', EAT.toy + 10, w.then2, BP(w.then2 - 1), 0.12); }
  if (S.id === 'daily') timer(w.then2 + 2, w.day, TP(w.then2), 0.12, () => '5s', (g) => ramp(g, w.then2 + 6, w.day - 2));
  if (S.id === 'daily') badge(T.fxCheck, 'ok', w.day, w.before, BP(w.before - 1), 0.12);
  if (S.id === 'bowl') badge(T.fxCheck, 'ok', w.meals + 4, w.greeting, BP(w.greeting - 1), 0.12);
  if (S.id === 'greet') badge(T.fxCheck, 'ok', w.greeting + 14, w.if, [-0.08, 0.714, HOOKP[2]], 0.2);
  if (S.id === 'dive') badge(T.fxCross, 'no', w.in + 3, w.change, add(noseAt(w.much), [-0.03, 0.17, 0.0]), 0.14);
  if (S.id === 'fix') { hearts(EAT.fix + 1, add(HEADP(f), [-0.06, 0, 0.06])); badge(T.fxCheck, 'ok', w.easier + 8, w.say, BP(w.say - 1), 0.12); }
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward2 + 3, add(HEADP(f), [-0.06, 0, 0.06]), 4, 0.06);
    if (f >= w.reward2) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward2 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(noseAt(f), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
