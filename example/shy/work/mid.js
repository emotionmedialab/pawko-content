// ---------- staging ----------
const MAT = 0.064, K = 0.00225, ST = 1.08;
const DOGPOS = [0, MAT, 0], DOGYAW = Math.PI / 2;      // puppy on the mat, nose toward +x
const TRN = [0.52, MAT, -0.66];
const HOOKP = [0, MAT, -0.48];                          // hook: puppy close to the trainer's card plane
let CUR = [0, 1, 3], TCUR = TRN;
const LK = [0.9, 0.12, 0.2];                            // the puppy's resting look target (low, ahead, toward the camera side)

// ---------- reference points from the real rig (filled in by calibrate() once the GLB is loaded) ----------
const REF = {};
export const calibrate = (poseFn, root) => {
  root.position.set(...DOGPOS); root.rotation.set(0, DOGYAW, 0); root.updateMatrixWorld(true);
  REF.sit = poseFn({ w: { sit: 1 }, look: LK });
  REF.A = poseFn({ w: { swpA: 1 }, look: LK });
  root.position.set(...DOGPOS);
};
const NOSE = () => REF.sit.nose;
const TAPEP = () => add(NOSE(), [-0.045, 0.03, 0]);                      // where the tape sits on the muzzle
const TAPEPAW = () => add(REF.A.bR, [0, 0.02, 0.02]);                    // the tape stuck on the raised paw
const MOUTH = () => add(NOSE(), [0.12, -0.08, 0.06]);                    // treat delivered at the sitting puppy's mouth
const HEAD = () => add(REF.sit.head, [0.07, 0.1, 0]);                    // hearts anchor above the head
const HN = () => add(NOSE(), [0.14, 0.0, 0.16]);                         // a hand moving near the nose, clear of the muzzle
const WT = () => add(NOSE(), [0.05, -0.1, 0.04]);                        // setup: the hand holds the tape out to the side, clear of the face
const HOLD = (P) => add(P, [0.03, -0.01, 0]);                            // hand position for a pinch that holds something at P
// a hand waiting / leaving: low on the mat just in front of the camera, below the bottom of the frame (same sideways offset as P)
const BELOW = (f, P) => { const c = camAt(f), fw = [c.look[0] - c.pos[0], c.look[2] - c.pos[2]], n = Math.hypot(fw[0], fw[1]), F = [fw[0] / n, fw[1] / n], R3 = [-F[1], F[0]];
  const lat = (P[0] - c.pos[0]) * R3[0] + (P[2] - c.pos[2]) * R3[1];
  return [c.pos[0] + F[0] * 0.5 + R3[0] * lat, 0.1, c.pos[2] + F[1] * 0.5 + R3[1] * lat]; };

// ---------- the swipe: s = 0 sit, 1 paw beside the face (A), 2 over the muzzle (B), 3 toward the eye (C) ----------
const swipeKeys = (f) => {
  switch (shotAt(f).id) {
    case 'hook': return KF(f, [[w.act - 9, 0], [w.act - 2, 1], [w.act + 5, 2], [w.act + 11, 3], [w.shy1 + 36, 2.85], [w.grab - 4, 2.9]]);
    case 'swipe': { const c = w.paw1 - 4; return KF(f, [[c - 18, 0], [c - 9, 1], [c, 2], [c + 6, 3], [c + 14, 1.1], [w.mark + 30, 1.0], [w.rightaway, 1.0], [w.rightaway + 11, 0]]); }
    case 'small': { const c = w.each - 1; return KF(f, [[c - 18, 0], [c - 9, 1], [c, 2], [c + 6, 3], [c + 15, 1.1], [c + 24, 0]]); }
    case 'hand': { const c = w.nose2 + 10; return KF(f, [[c - 18, 0], [c - 9, 1], [c, 2], [c + 6, 3], [c + 14, 1.2], [w.say1 - 1, 0.3]]); }
    case 'cue': { const c = w.paw2 + 2; return KF(f, [[c - 18, 0], [c - 8, 1], [c, 2], [c + 6, 3], [c + 15, 1.1], [c + 25, 0]]); }
    case 'fix': { const c = w.paw3 - 3; return KF(f, [[c - 18, 0], [c - 9, 1], [c, 2], [c + 6, 3], [c + 14, 1.05], [w.never + 2, 1.0], [w.never + 13, 0]]); }
  }
  return 0;
};
const swipeW = (s) => ({ sit: Math.max(0, 1 - s), swpA: s <= 1 ? s : Math.max(0, 2 - s), swpB: s <= 1 ? 0 : s <= 2 ? s - 1 : Math.max(0, 3 - s), swpC: s > 2 ? s - 2 : 0 });

// ---------- the puppy ----------
export const dog3At = (f) => {
  const S = shotAt(f), s = swipeKeys(f);
  const flick = Math.max(0, Math.sin(f * 0.11 + 1)) ** 12;   // an ear flick every ~2 s
  const base = { pos: [0.004 * Math.sin(f * 0.037), MAT, 0.004 * Math.sin(f * 0.029 + 1)], yaw: DOGYAW + 0.035 * Math.sin(f * 0.043), ears: -0.25 * flick, w: swipeW(s), roll: 0, blink: blinkAt(f, 8) ? 1 : 0,
    breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 1, look: LK };
  const W = worldAt(f);
  const happy = { wag: Math.sin(f * 0.8) * 1.1, tail: 0.35 };
  const lookC = (P, dy = 0) => [P[0], Math.min(P[1] + dy, 0.34), P[2]];
  const dip = 0.06 * Math.min(1, s);                          // the head dips a little as the paw comes up
  const swipeLook = [LK[0], LK[1] - dip, LK[2] + 0.05];
  switch (S.id) {
    case 'hook': {
      const shy = R(f, w.act - 2, w.act + 12);
      return { ...base, pos: HOOKP, look: lerp3([0.5, 0.66, TRN[2]], [0.7, 0.04, 0.1], shy), headTilt: 8 * shy + 3 * Math.sin(f * 0.12) * shy, wag: 0.5 * Math.sin(f * 0.4), ears: f > 12 ? -0.3 : 0 };
    }
    case 'setup': {
      return { ...base, look: f < w.tiny ? [1.6, 0.12 + 0.03 * Math.sin(f * 0.05), 0.3] : lookC(WT(), 0.03), headTilt: 8 * Math.sin(Math.PI * ramp(f, w.tiny, w.stick)), wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    }
    case 'stick': {
      return { ...base, look: f < w.nose1 + 14 && W.hand ? lookC(add(W.hand.at, [0, 0.02, 0]), 0.03) : [LK[0], LK[1] - 0.04, LK[2]], headTilt: 6 * Math.sin(f * 0.07), wag: 0.5 * Math.sin(f * 0.3), ears: f > w.nose1 + 4 ? -0.3 : -0.2, neck: 0.8 };
    }
    case 'swipe': {
      return { ...base, look: swipeLook, headTilt: 5 * Math.sin(f * 0.07), ...(f >= w.mark - 2 ? happy : { wag: 0.5 * Math.sin(f * 0.4) }), ears: -0.2 };
    }
    case 'reward': {
      const ch = chompAt(f, EAT.reward);
      return { ...base, look: W.treat ? lookC(W.treat, 0.02) : LK, jaw: f >= EAT.reward + 14 ? 0.3 : ch, ...(f > EAT.reward ? happy : { wag: 0.8 * Math.sin(f * 0.5) }), blink: f > EAT.reward && f < EAT.reward + 6 ? 1 : base.blink };
    }
    case 'small': return { ...base, look: swipeLook, headTilt: 4 * Math.sin(f * 0.06), wag: f > w.each + 6 ? Math.sin(f * 0.8) : 0.4 * Math.sin(f * 0.3), tail: 0.2 };
    case 'hand': case 'cue': {
      const done = S.id === 'cue' && f > w.paw2 + 12;
      return { ...base, look: s > 0.2 ? swipeLook : lookC(add(HN(), [0, 0.02, -0.02]), 0.03), headTilt: 6 * Math.sin(f * 0.06), wag: done ? Math.sin(f * 0.7) : 0.5 * Math.sin(f * 0.35), ears: -0.25 };
    }
    case 'wrong': {
      const k = R(f, w.tape3, w.on + 8);
      return { ...base, look: [1.0, 0.16, 0.5 * Math.sin(f * 0.3) * k + 0.1], neck: 0.9, headTilt: 10 * Math.sin(f * 0.3) * k, ears: -0.45 * k, wag: 0.1 * Math.sin(f * 0.2), tail: 0.0, jaw: 0.25 * k * (0.5 + 0.5 * Math.sin(f * 0.5)) };
    }
    case 'fix': {
      const calm = f > w.never + 14;
      return { ...base, look: s > 0.1 ? swipeLook : calm ? [LK[0], LK[1] + 0.05, 0.3 + 0.5 * Math.sin(f * 0.04)] : LK, headTilt: calm ? 7 * Math.sin(f * 0.05) : 4 * Math.sin(f * 0.07), ...(f > w.never ? happy : { wag: 0.5 * Math.sin(f * 0.4) }), ears: calm ? -0.15 : -0.2 };
    }
    case 'yes': {
      return { ...base, look: [TRN[0] + 0.05, 0.5, TRN[2] + 0.2], wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    }
    case 'final': {
      const t0 = EAT.final, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, look: W.treat ? lookC(W.treat, 0.02) : lookC(MOUTH(), 0.03), jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- 3D props: POV hands, biscuit, tape ----------
const EAT = { reward: w.reward1 + 8, final: w.reward2 + 2 };
const HANDSHOTS = ['setup', 'stick', 'swipe', 'reward', 'small', 'hand', 'cue', 'fix', 'final'];
export const worldAt = (f) => {
  const S = shotAt(f), W = {};
  const offer = (at0, pose, extra = {}) => ({ at: [at0[0], at0[1] + 0.006 * Math.sin(f * 0.13), at0[2]], pose, mode: 'reach', face: add(TAPEP(), [-0.2, 0, 0]), tilt: 0.12, side: 0.3, ...extra });
  const PINCH = { palm: [0.05, -0.75, -0.6], fingers: [-1, 0.25, -0.1] };         // pinch seen from the side cameras (back of the hand to the camera)
  const jit = (a) => [a * Math.sin(f * 0.09), a * Math.sin(f * 0.07), a * Math.sin(f * 0.05)];
  const peel = (f0) => {              // the hand takes the tape off the raised paw (beside the paw, not over the face)
    const P = HOLD(TAPEPAW()), at = KF(f, [[f0, BELOW(f0, P)], [f0 + 9, P], [f0 + 13, P], [f0 + 34, BELOW(f0 + 34, P)]]);
    W.hand = offer(at, 'pinch', PINCH);
    W.tape = f < f0 + 13 ? { on: 'paw', s: 1 } : f <= f0 + 34 ? { on: 'at', at: add(at, [-0.03, 0.01, 0]), s: 1 } : null;
  };
  const tapeSwipe = (c) => { W.tape = f < c ? { on: 'nose', s: 1 } : f < c + 4 ? { on: 'nose', k: ramp(f, c, c + 4), s: 1 } : { on: 'paw', s: 1 }; };
  switch (S.id) {
    case 'setup': {
      const at = KF(f, [[w.tiny + 4, BELOW(w.tiny + 4, WT())], [w.tiny + 20, WT()], [w.stick - 8, WT()], [w.stick - 1, BELOW(w.stick - 1, WT())]]);
      if (f >= w.tiny + 2) { W.hand = offer(add(at, jit(0.008)), 'pinch', PINCH); W.tape = { on: 'at', at: add(at, [-0.03, 0.01, 0]), s: 1 }; }
      break;
    }
    case 'stick': {
      const P = add(TAPEP(), [0.06, 0.07, 0]), AP = add(P, [0.12, 0.04, 0.04]);   // the hand stays above and ahead of the muzzle, fingertips pointing down at the tape spot
      const at = KF(f, [[w.stick, BELOW(w.stick, AP)], [w.lightly + 6, AP], [w.nose1 - 4, P], [w.nose1 + 14, P], [w.nose1 + 30, AP], [w.when - 2, BELOW(w.when - 2, AP)]]);
      W.hand = offer(at, 'pinch', { ...PINCH, fingers: [-0.9, -0.3, 0] });
      W.tape = f < w.nose1 + 2 ? { on: 'at', at: add(at, [-0.06, -0.07, 0]), s: 1 } : { on: 'nose', s: 1 };
      break;
    }
    case 'swipe': { const c = w.paw1 - 4; tapeSwipe(c); if (f >= w.peel) peel(w.peel); break; }
    case 'small': {
      const c = w.each - 1, k = ramp(f, c, c + 16);
      W.tape = f < c ? { on: 'nose', s: 0.55 } : k < 1 ? { on: 'nose', s: 0.55, off: [0.09 * k, 0.05 * k - 0.3 * k * k, 0.16 * k] } : null;
      break;
    }
    case 'hand': case 'cue': {
      const a = S.id === 'hand' ? w.then + 8 : w.say1 + 2, b = S.id === 'hand' ? w.nose2 + 2 : w.paw2 - 6;
      const sway = [0.03 * Math.sin(f * 0.2), 0.02 * Math.sin(f * 0.27), 0.03 * Math.cos(f * 0.2)], k = R(f, a + 6, a + 12);
      const at = KF(f, [[a - 8, BELOW(a - 8, HN())], [a + 6, HN()], [b, HN()], [b + 8, BELOW(b + 8, HN())]]);
      if (f >= a - 8 && f <= b + 8) W.hand = offer(add(at, sway.map((v) => v * k)), 'point', PINCH);
      break;
    }
    case 'wrong': W.tape = { on: 'nose', s: 1 }; break;
    case 'fix': { const c = w.paw3 - 3; tapeSwipe(c); if (f >= c + 12) peel(c + 12); break; }
    case 'reward': {
      const m = KF(f, [[w.reward1 - 1, BELOW(w.reward1 - 1, MOUTH())], [w.reward1 + 6, MOUTH()], [w.reward1 + 18, MOUTH()], [w.reward1 + 28, BELOW(w.reward1 + 28, MOUTH())]]);
      if (f >= w.reward1 - 1 && f <= w.reward1 + 28) { W.treat = m; W.hand2 = { at: m, pose: 'pinch', side: 0.26 }; }
      break;
    }
    case 'final': { const at = KF(f, [[w.then2, BELOW(w.then2, MOUTH())], [w.reward2 - 1, MOUTH()]]); W.hand = offer(at, 'pinch', PINCH); W.treat = add(at, [-0.03, 0.01, 0]); break; }
  }
  if (S.id === 'final' && f <= w.then2) W.hand = null;
  if (EAT[S.id] && f >= EAT[S.id]) W.treatHide = true;
  return W;
};

