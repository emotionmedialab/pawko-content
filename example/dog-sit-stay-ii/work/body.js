
// ---------- staging ----------
const MAT = 0.064, K = 0.00225, ST = 1.08;
const DOGPOS = [0, MAT, 0], DOGYAW = Math.PI / 2;      // puppy on the mat, nose toward +x
const TRN = [0.52, MAT, -0.66];
const HOOKP = [0, MAT, -0.48];                          // hook / back / ret: puppy close to the trainer's card plane
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
const MOUTHS = () => add(NOSE('sit'), [0.06, -0.03, 0]);      // a treat delivered to the sitting puppy
const CATCH = () => add(NOSE('stand'), [0.07, -0.03, 0]);     // the tossed treat is caught here

// ---------- trainer card (kneeling; hook / back / ret / yes). He slides in depth, never stands. ----------
const trainerPlace = (f) => {
  const S = shotAt(f);
  let k = 0, z = TRN[2];
  if (S.id === 'hook') { k = sm(ramp(f, w.walk - 2, w.walk + 30)); z = lerp(TRN[2], -1.7, k); }
  if (S.id === 'back') { k = 1 - sm(ramp(f, w.always + 2, w.dog + 2)); z = lerp(TRN[2], -2.6, k); }
  if (S.id === 'ret') { k = 1 - sm(ramp(f, w.every + 3, w.return + 12)); z = lerp(TRN[2], -1.9, k); }
  const moving = k > 0.02 && k < 0.98;
  return { x: lerp(TRN[0], 0.62, k), z, y: MAT + (moving ? 0.02 * Math.abs(Math.sin(f * 0.5)) : 0), s: ST, flip: true, kneel: 1, moving };
};

// ---------- footprints (white beads, same trail system): the trainer's path, off screen ----------
const FP0 = () => NOSE('sit')[0] + 0.2;
const prints = (f, len, o0, o1, r0, r1) => {
  const n = Math.max(1, Math.round(len / 0.06)), pts = [];
  for (let i = 0; i < n; i++) if (f >= o0 + (o1 - o0) * (i + 1) / n) pts.push([FP0() + i * 0.06, MAT + 0.012, 0]);
  for (let j = 0; j < n; j++) if (f >= r0 + (r1 - r0) * (j + 1) / n) pts.push([FP0() + (n - 1 - j) * 0.06, MAT + 0.012, 0.11]);
  return pts;
};
const STEP1 = [0.16, w.take + 7, w.take + 24, w.ret1, w.ret1 + 20];
const SETA = [0.3, w.two, w.two + 15, w.two + 21, w.two + 33], SETB = [0.55, w.five, w.five + 18, w.five + 22, w.five + 33];
const gazeX = (f) => {
  if (f < w.reward1) return KF(f, [[w.take + 7, FP0()], [w.take + 24, FP0() + 0.16], [w.ret1, FP0() + 0.16], [w.ret1 + 20, FP0()]]);
  return KF(f, [[w.two, FP0()], [w.two + 15, FP0() + 0.3], [w.two + 21, FP0() + 0.3], [w.two + 33, FP0()], [w.five, FP0()], [w.five + 18, FP0() + 0.55], [w.five + 22, FP0() + 0.55], [w.five + 33, FP0()]]);
};
// footprint ring around the puppy for "walk a small circle"
const RING = { c: [0.2, 0, -0.04], r: 0.21 };
const ringU = (g) => ramp(g, w.next + 6, w.next + 62);
const ringPt = (g) => { const a = (20 + 360 * ringU(g)) * Math.PI / 180; return [RING.c[0] + RING.r * Math.cos(a), MAT + 0.012, RING.c[2] + RING.r * Math.sin(a)]; };

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { sit: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.3 * Math.sin(f * 0.25), tail: 0.1, neck: 1 };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  switch (S.id) {
    case 'hook': {
      const P = trainerPlace(f);
      return { ...base, pos: HOOKP, look: [P.x + 0.02, 0.8, clamp(P.z, -1.4, -0.3)], ears: f > w.walk - 6 ? -0.4 : -0.2, headTilt: 6 * Math.sin(Math.PI * ramp(f, w.walk - 6, w.walk + 18)), wag: 0.5 * Math.sin(f * 0.3) };
    }
    case 'setup': {
      return { ...base, look: [1.6, 0.12 + 0.03 * Math.sin(f * 0.05), 0.3], headTilt: 10 * Math.sin(Math.PI * ramp(f, w.space - 20, w.space + 20)), wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    }
    case 'ask': {
      const s = sm(ramp(f, w.sit - 6, w.sit + 22)), perk = f >= w.say1 && f < w.say1 + 24 ? -0.7 * Math.sin(Math.PI * ramp(f, w.say1, w.say1 + 24)) : 0;
      return { ...base, w: { stand: 1 - s, sit: s }, look: W.lead || [0.95, 0.42, 0.15], neck: 0.75, ears: perk - 0.2, headTilt: f >= w.say1 - 6 && f < w.say1 + 10 ? 8 * Math.sin(Math.PI * ramp(f, w.say1 - 6, w.say1 + 10)) : 0, wag: 0.5 * Math.sin(f * 0.4) };
    }
    case 'step1': case 'steps': {
      return { ...base, look: [gazeX(f), 0.55, 0], neck: 0.9, ears: -0.2, tail: 0.15 };
    }
    case 'reward1': {
      const t1 = POVT.reward1, ch = chompAt(f, t1 + 2);
      return { ...base, look: W.treatHide || !W.treat ? [0.9, 0.3, 0.3] : W.treat, neck: 0.9, jaw: f >= t1 + 16 ? 0.3 : ch, ...(f > t1 + 2 ? happy : {}), blink: f > t1 + 2 && f < t1 + 8 ? 1 : base.blink };
    }
    case 'back': {
      const P = trainerPlace(f);
      return { ...base, pos: HOOKP, look: [P.x + 0.02, 0.8, clamp(P.z, -1.4, -0.3)], ears: -0.2, wag: 0.4 * Math.sin(f * 0.25) };
    }
    case 'around': {
      const P = ringPt(clamp(f, w.next + 6, w.feed - 8));
      return { ...base, look: [clamp(P[0], 0.2, 1.0), 0.45, clamp(P[2], -0.3, 0.6)], neck: 0.85, ears: -0.1, wag: 0.3 * Math.sin(f * 0.15) };
    }
    case 'povStay': {
      const t1 = POVT.povStay1, t2 = POVT.povStay2, ch = Math.max(chompAt(f, t1 + 2), chompAt(f, t2 + 2));
      return { ...base, look: W.treatHide || !W.treat ? [0.9, 0.3, 0.3] : W.treat, neck: 0.9, jaw: ch, wag: 0.8 * Math.sin(f * 0.5), tail: 0.25, blink: (f > t1 + 2 && f < t1 + 8) || (f > t2 + 2 && f < t2 + 8) ? 1 : base.blink };
    }
    case 'mistake1': {
      const up = M.smooth(M.smooth(ramp(f, w.call + 8, w.call + 36))), settled = ramp(f, w.call + 36, w.call + 50);
      const sway = settled * Math.sin(f * 0.06), turn = sm(ramp(f, w.call, w.call + 14));
      const glance = sm(ramp(f, w.stay2 - 6, w.stay2 + 8)) * (1 - sm(ramp(f, w.stay2 + 22, w.stay2 + 38)));
      return { ...base, w: { sit: 1 - up, stand: up }, look: [0.9, 0.2, lerp(0.15, 0.8, Math.max(0, turn - glance * 0.7))], neck: 0.6 - 0.1 * up, ears: -0.7 * sm(ramp(f, w.call, w.call + 6)) + 0.3 * up, tail: 0.4 * up,
        wag: up > 0.5 ? Math.sin(f * 0.8) : 0.2 * Math.sin(f * 0.3), pos: add(lerp3(DOGPOS, [0.03, MAT, 0], up), [0.012 * sway, 0, 0.01 * sway]), yaw: DOGYAW + 0.07 * sway * settled, headTilt: 5 * turn, blink: f >= w.stay2 + 4 && f < w.stay2 + 9 ? 1 : base.blink };
    }
    case 'toss': {
      const up = sm(ramp(f, w.okay + 2, w.okay + 28)), ch = chompAt(f, FLY.land);
      const tr = W.treat ? [clamp(W.treat[0], 0.3, 1.2), Math.min(W.treat[1], 0.4), W.treat[2]] : null;
      return { ...base, w: { sit: 1 - up, stand: up }, look: f >= w.okay + 26 && !W.treatHide && tr ? tr : [0.9, 0.3, 0.4], neck: 0.6, ears: -0.4 * up, tail: 0.4 * up, wag: up > 0.3 ? Math.sin(f * 0.8) * 0.9 : 0.2 * Math.sin(f * 0.25),
        pos: lerp3(DOGPOS, [0.03, MAT, 0], up), jaw: f >= FLY.land + 14 ? 0.3 : ch, blink: f > FLY.land && f < FLY.land + 6 ? 1 : base.blink };
    }
    case 'mistake2': {
      const up = M.smooth(M.smooth(ramp(f, w.gets - 8, w.up + 18))) * (1 - sm(ramp(f, w.reset + 2, w.reset + 28)));
      const settled = ramp(f, w.up + 18, w.up + 32) * (1 - sm(ramp(f, w.reset - 4, w.reset + 6))), sway = settled * Math.sin(f * 0.06);
      const turn = sm(ramp(f, w.up + 26, w.up + 46)) * (1 - sm(ramp(f, w.up + 60, w.up + 80)));
      return { ...base, w: { sit: 1 - up, stand: up }, look: [0.9, 0.2, lerp(0.55, -0.35, turn)], neck: 0.6 - 0.1 * up, ears: -0.3 * up + (f > w.reset && f < w.reset + 20 ? 0.4 : 0), tail: 0.4 * up,
        wag: up > 0.5 ? Math.sin(f * 0.8) : 0.2 * Math.sin(f * 0.3), pos: add(lerp3(DOGPOS, [0.03, MAT, 0], up), [0.012 * sway, 0, 0.01 * sway]), yaw: DOGYAW + 0.07 * sway, headTilt: f > w.reset + 10 ? 5 : 0, blink: f >= w.up + 8 && f < w.up + 13 ? 1 : base.blink };
    }
    case 'calm': {
      const lid = f > w.itwas + 14 && f < w.every - 10 ? 0.45 + 0.15 * Math.sin(f * 0.05) : blinkAt(f, 8) ? 1 : 0;
      return { ...base, look: add(NOSE('sit'), [0.45, -0.3, 0.05 + 0.04 * Math.sin(f * 0.03)]), neck: 0.7, blink: lid, breath: 0.35 + 0.35 * Math.sin(f * 0.12), ears: 0.3, wag: 0.3 * Math.sin(f * 0.1) };
    }
    case 'ret': {
      const P = trainerPlace(f);
      return { ...base, pos: HOOKP, look: [P.x + 0.02, 0.8, clamp(P.z, -1.4, -0.3)], ears: -0.2, wag: 0.5 * Math.sin(f * 0.3) };
    }
    case 'yes': {
      return { ...base, look: [TRN[0] + 0.05, 0.95, TRN[2]], wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    }
    case 'povFinal': {
      const t0 = w.reward2 + 2, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, look: W.treatHide || !W.treat ? [0.9, 0.3, 0.3] : W.treat, neck: 0.9, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: hand / biscuit / footprints ----------
const POVT = { reward1: w.reward1 + 10, povStay1: w.feed + 12, povStay2: w.feed + 58 };   // frame a treat reaches the mouth
const FLY = { a: w.toss - 3, land: w.treat + 4 };                                         // tossed treat: leaves the hand, caught
const treatPath = (f) => {
  const S = shotAt(f);
  switch (S.id) {
    case 'reward1': { const t1 = POVT.reward1; return KF(f, [[w.reward1, [0.7, 0.18, 0.32]], [t1 - 2, MOUTHS()], [t1 + 10, MOUTHS()], [t1 + 26, START]]); }
    case 'povStay': {
      const t1 = POVT.povStay1, t2 = POVT.povStay2;
      if (f < t1) return KF(f, [[w.feed, [0.7, 0.18, 0.32]], [t1 - 2, MOUTHS()]]);
      if (f < t1 + 10) return MOUTHS();
      if (f < t2) return KF(f, [[t1 + 10, MOUTHS()], [t1 + 20, START], [t2 - 14, START], [t2 - 2, MOUTHS()]]);
      return MOUTHS();
    }
    case 'toss': {
      if (f < FLY.a) return null;
      const u = clamp((f - FLY.a) / (FLY.land - FLY.a), 0, 1), A = [1.0, 0.4, 0.6], B = CATCH();
      return [lerp(A[0], B[0], u), lerp(A[1], B[1], u) + 0.4 * 4 * u * (1 - u), lerp(A[2], B[2], u)];
    }
    case 'povFinal': return KF(f, [[w.then2, add(MOUTHS(), [0.3, 0.14, 0.05])], [w.reward2 + 2, MOUTHS()]]);
  }
  return null;
};
const leadPath = (f) => {
  const S = shotAt(f);
  if (S.id === 'ask') {   // flat palm held beside the chest while it sits and stays, then pulled back below the frame
    const top = [N_SIT()[0] + 0.18, N_SIT()[1] - 0.12, 0.02];
    return KF(f, [[w.ask, [0.75, 0.25, -0.18]], [w.ask + 9, top], [w.say1 + 24, top], [w.say1 + 38, [0.95, 0.12, 0.45]]]);
  }
  return null;
};
const HANDSHOTS = ['reward1', 'povStay', 'povFinal'];
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const t = treatPath(f), lead = leadPath(f);
  if (t) W.treat = t;
  if (lead) W.lead = lead;
  if (t && HANDSHOTS.includes(S.id)) W.hand = { treat: t, side: S.id === 'povFinal' ? 0.22 : 0.16 };
  if (S.id === 'ask') W.hand = { at: lead, pose: 'five', mode: 'reach', palm: [0, -1, 0], fingers: [-0.85, -0.4, -0.35], grip: 'palm', side: 0.12 };
  if ((S.id === 'reward1' && f >= POVT.reward1) || (S.id === 'povStay' && (f >= POVT.povStay1 && f < POVT.povStay1 + 18 || f >= POVT.povStay2)) || (S.id === 'povFinal' && f >= w.reward2 + 4) || (S.id === 'toss' && f >= FLY.land)) W.treatHide = true;
  const bead = (pts) => { W.trail = pts; W.trailS = 1.6; W.trailCol = '#ffffff'; };
  if (S.id === 'step1') bead(prints(f, ...STEP1));
  if (S.id === 'steps') bead(f < w.five ? prints(f, ...SETA) : prints(f, ...SETB));
  if (S.id === 'around' && f >= w.next + 6) {
    const pts = []; let last = null;
    for (let g = w.next + 6; g <= Math.min(f, w.feed - 8); g += 0.5) { const p = ringPt(g); if (!last || Math.hypot(p[0] - last[0], p[2] - last[2]) > 0.055) { pts.push(p); last = p; } }
    bead(pts);
  }
  return W;
};

// ---------- the 2D trainer (hook, back, ret, yes) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5;
  return { kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 4,
    near: { to: [318, 690 - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present', lean: 6 };
};
const trainerAt = (f) => {
  const hi = idle(f, 3), S = shotAt(f), P = trainerPlace(f);
  const o = { hose: true, kneel: P.kneel, expr: 'grin', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.2, headTilt: hi.headTilt, near: 'thumb', far: 'present' };
  if (S.id === 'hook') { o.expr = f > 20 ? 'grin' : 'smile'; o.far = f >= 20 && f < w.walk + 20 ? 'signal' : 'present'; o.look = 0.6; }
  if (S.id === 'back') o.expr = f > w.dog ? 'proud' : 'grin';
  return o;
};

// ---------- cameras (locked keys from dog-down-ii / dog-down-iii) ----------
const STAND = (a, b) => [{ f: a, pos: [1.32, 0.66, 0.66], look: [0.18, 0.27, 0.0], fov: 42 }, { f: b, pos: [1.26, 0.62, 0.63], look: [0.19, 0.23, 0.0], fov: 42 }];
const HOOKC = (a, b) => [{ f: a, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: b, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }];
const POVSIT = (a, b) => [{ f: a, pos: [1.28, 0.88, 0.56], look: [0.2, 0.22, 0.0], fov: 42 }, { f: b, pos: [1.22, 0.82, 0.53], look: [0.22, 0.16, 0.0], fov: 42 }];
const CAMS = {
  hook: HOOKC(0, w.grab - 1),
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.space - 6, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },   // jar ... hard cut ...
    { f: w.space - 5, pos: [1.22, 0.52, 1.0], look: [0.04, 0.2, 0.0], fov: 38 }, { f: w.ask - 1, pos: [1.1, 0.47, 0.9], look: [0.04, 0.19, 0.0], fov: 38 }],         // ... to the puppy on the mat
  ask: [{ f: w.ask, pos: [1.3, 0.9, 0.6], look: [0.2, 0.33, 0.0], fov: 42 }, { f: w.take - 1, pos: [1.24, 0.84, 0.57], look: [0.22, 0.24, 0.0], fov: 42 }],
  step1: STAND(w.take, w.reward1 - 1),
  reward1: POVSIT(w.reward1, w.steps - 1),
  steps: STAND(w.steps, w.always - 1),
  back: HOOKC(w.always, w.next - 1),
  around: STAND(w.next, w.feed - 1),
  povStay: POVSIT(w.feed, w.dont - 1),
  mistake1: [{ f: w.dont, pos: [0.9, 0.5, 1.5], look: [0.22, 0.36, 0.05], fov: 46 }, { f: w.then1 - 1, pos: [0.72, 0.5, 1.34], look: [0.22, 0.34, 0.05], fov: 46 }],
  toss: [{ f: w.then1, pos: [1.32, 0.66, 0.66], look: [0.18, 0.25, 0.0], fov: 42 }, { f: w.if - 1, pos: [1.24, 0.6, 0.62], look: [0.19, 0.23, 0.0], fov: 42 }],
  mistake2: [{ f: w.if, pos: [0.9, 0.5, 1.5], look: [0.22, 0.36, 0.05], fov: 46 }, { f: w.itwas - 1, pos: [0.72, 0.5, 1.34], look: [0.22, 0.34, 0.05], fov: 46 }],
  calm: [{ f: w.itwas, pos: [1.25, 0.42, 0.95], look: [0.14, 0.18, 0.0], fov: 38 }, { f: w.every - 1, pos: [0.3, 0.46, 1.45], look: [0.1, 0.18, 0.0], fov: 38, path: [[0.85, 0.44, 1.3]] }],
  ret: HOOKC(w.every, w.say2 - 1),
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then2 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  povFinal: POVSIT(w.then2, TOTAL - 1),
};
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (S.id.startsWith('pov') || S.id === 'ask' || S.id === 'reward1') { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), head = REF.sit ? REF.sit.head : [0.3, 0.4, 0];
  if (S.id === 'hook' || S.id === 'yes' || S.id === 'back' || S.id === 'ret') return { focus: dist(C.pos, [0.3, 0.35, -0.15]), cinf: 6 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  if (S.id === 'calm') return { focus: dist(C.pos, [0.1, 0.22, 0]), cinf: 9 };
  if (S.id === 'mistake1' || S.id === 'mistake2') return { focus: dist(C.pos, [0.1, 0.3, 0]), cinf: 6 };
  if (S.id === 'step1' || S.id === 'steps' || S.id === 'around' || S.id === 'toss') return { focus: dist(C.pos, [0.12, 0.15, 0]), cinf: 4 };
  return { focus: dist(C.pos, head), cinf: 6 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'yes') { const tO = roundAll({ ...trainerYes(f), mirror: true }); out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: ST, flip: true, order: 1, ground: MAT, blobW: 0.8 }); }
  if (S.id === 'hook' || S.id === 'back' || S.id === 'ret') {
    const P = trainerPlace(f), tO = roundAll({ ...trainerAt(f), mirror: P.flip });
    out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: P.x, y: P.y, z: P.z, s: P.s, flip: P.flip, order: 1, ground: MAT, blobW: 0.8 });
  }
  return out;
};
const BUB_CUE = [0.2, 0.52, -0.02], BUB_OK = [0.14, 0.55, 0.0], BUB_YES = [-0.12, 0.78, -0.45];   // bubble anchor points (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const HEAD = add(NOSE('sit'), [-0.08, 0.06, 0]);
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  const burst = (t0, pos, sc) => { const k = q(ramp(f, t0, t0 + 16), 2); if (k > 0 && k < 1) out.push(FX('ck' + t0 + k, (p) => T.fxClick(p, k), pos, sc)); };
  if (S.id === 'setup') badge(T.fxCheck, 'ok', w.space, w.ask, [0.5, 0.1, 0.5], 0.11);
  if (S.id === 'ask') bubble('bd', 'Stay!', '', '#ffffff', w.say1 - 2, w.say1 + 30, BUB_CUE, 0.2);
  if (S.id === 'reward1') hearts(POVT.reward1 + 3, HEAD);
  if (S.id === 'back') badge(T.fxCheck, 'ok', w.release, w.next, [-0.05, 0.5, HOOKP[2]], 0.2);
  if (S.id === 'povStay') { hearts(POVT.povStay1 + 3, HEAD); hearts(POVT.povStay2 + 3, HEAD); badge(T.fxCheck, 'ok', w.sitting, w.dont, [0.2, 0.62, 0.1], 0.14); }
  if (S.id === 'mistake1') {
    burst(w.call, [0.1, 0.1, 0.2], 0.3); burst(w.call + 9, [0.1, 0.21, 0.2], 0.2);
    badge(T.fxCross, 'no', w.stay2 - 3, w.then1, [0.3, 0.55, 0.1], 0.2);
  }
  if (S.id === 'toss') { bubble('bo', 'Okay!', '', '#fbf0b4', w.okay - 2, w.okay + 30, BUB_OK, 0.2); hearts(FLY.land + 2, add(NOSE('stand'), [-0.08, 0.06, 0])); }
  if (S.id === 'mistake2') {
    badge(T.fxCross, 'no', w.up - 3, w.reset, [0.3, 0.55, 0.1], 0.2);
    if (f >= w.reset + 4 && f < w.reset + 32) { const t = q(ramp(f, w.reset + 4, w.reset + 32), 2); out.push(FX('si' + t, (p) => T.fxSigh(p, t), add(NOSE('sit'), [0.08, 0.02, 0.04]), 0.12)); }
    badge(T.fxCheck, 'ok', w.reset + 26, w.itwas, [0.3, 0.55, 0.1], 0.14);
  }
  if (S.id === 'calm' && f >= w.hard && f < w.hard + 28) { const t = q(ramp(f, w.hard, w.hard + 28), 2); out.push(FX('si' + t, (p) => T.fxSigh(p, t), add(NOSE('sit'), [0.08, 0.02, 0.04]), 0.12)); }
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'povFinal') {
    hearts(w.reward2 + 3, HEAD, 4, 0.06);
    if (f >= w.reward2) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward2 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('sit'), [0.05, 0.05, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
