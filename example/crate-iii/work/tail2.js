const doorAt = (f) => {
  switch (shotAt(f).id) {
    case 'hook': return 0.55 * (1 - sm(ramp(f, w.crate1 - 8, w.crate1 + 18)));
    case 'setup': return 1;
    case 'shut': return 1 - sm(ramp(f, w.close - 4, w.door2 + 6));
    case 'open': return sm(ramp(f, w.calm2 + 6, w.calm2 + 28));
    case 'yes': case 'final': return 1;
  }
  return 0;
};
const doorWorld = (f, y) => add(CR, doorEdge(doorAt(f), y));

// ---------- whining: only the short cue just before "upset" ----------
const whineAt = (f) => (shotAt(f).id === 'upset' && f >= w.gets + 4 && f < w.upset + 22 ? 1 : 0);

// ---------- camera-relative helpers (hands come from below the frame) ----------
const camVec = (f) => {
  const C = camAt(f), fw = C.look.map((v, i) => v - C.pos[i]), n = Math.hypot(...fw), F = fw.map((v) => v / n);
  const R0 = [-F[2], 0, F[0]], rn = Math.hypot(...R0), R = R0.map((v) => v / rn);
  const U = [R[1] * F[2] - R[2] * F[1], R[2] * F[0] - R[0] * F[2], R[0] * F[1] - R[1] * F[0]];
  return { C, F, R, U };
};
const OFF = (f) => { const { C, F, R, U } = camVec(f); return C.pos.map((v, i) => v + F[i] * 0.95 - U[i] * 0.9 + R[i] * 0.25); };
const HK = (f, keys) => KF(f, keys.map(([fr, p]) => [fr, p || OFF(f)]));

// ---------- the puppy ----------
export const dog3At = (f) => {
  if (globalThis.TEST?.dog) return globalThis.TEST.dog;
  const S = shotAt(f);
  const base = { pos: DOGPOS, yaw: DOGYAW, w: { down: 1 }, roll: 0, blink: blinkAt(f, 8) ? 1 : 0, breath: 0.25 + 0.25 * Math.sin(f * 0.2), wag: 0.4 * Math.sin(f * 0.25), tail: 0.1, neck: 0.85, ears: 0.3 * Math.max(0, Math.sin(f * 0.09)) ** 6 - 0.1 };
  const W = worldAt(f);
  const sw = (a, b, c = 0.05) => lerp(a, b, 0.5 + 0.5 * Math.sin(f * c));   // slow sweep
  const toTrainer = [TRN[0] + 0.2, 0.45, TRN[2] + 0.4];
  switch (S.id) {
    case 'hook': {
      return { ...base, look: f < 44 ? toTrainer : f < 60 ? [lerp(toTrainer[0], 1.2, sm(ramp(f, 44, 60))), 0.3, lerp(toTrainer[2], 2.6, sm(ramp(f, 44, 60)))] : [1.2, 0.3, 2.6], neck: 0.6,
        ears: f > w.crate1 + 18 ? 0.3 : -0.1, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2, blink: f > w.crate1 + 24 && f < w.crate1 + 32 ? 1 : base.blink };
    }
    case 'setup': return { ...base, pos: [1.25, MAT, -0.15], yaw: 0.5, w: { sit: 1 }, look: f < w.treats - 8 ? TOY_MAT : [1.85, 0.7, -0.75], neck: 1, wag: 0.7 * Math.sin(f * 0.5), tail: 0.25, ears: -0.2 };
    case 'shut': return { ...base, look: f < w.close + 14 ? [0.8, 0.4, 1.0] : [1.2, 0.4, 0.9], neck: 0.6, wag: 0.4 * Math.sin(f * 0.3), blink: f > w.door2 + 8 && f < w.door2 + 15 ? 1 : base.blink };
    case 'step': return { ...base, look: [TRN[0] + 0.3, 0.5, TRN[2] + 0.5], neck: 0.6, ears: 0.3, wag: 0.3 * Math.sin(f * 0.3), tail: 0.15 };
    case 'alone': {   // ears perk and the head follows where he left (screen left), then it settles with the toy
      const k = sm(ramp(f, w.sight, w.sight + 12)), settle = sm(ramp(f, w.sight + 40, w.thirty + 30));
      return { ...base, w: { down: 1 - 0.0 }, look: [lerp(-1.6, 0.9, settle), 0.3 - 0.1 * settle, lerp(1.1, 1.4, settle)], neck: 0.6, ears: 0.5 * k * (1 - settle) + 0.2 * Math.sin(f * 0.07) ** 2 * (1 - settle), headTilt: 6 * Math.sin(f * 0.1) * (1 - settle),
        wag: 0.15 * Math.sin(f * 0.3), blink: settle > 0.3 && blinkAt(f, 6) ? 1 : base.blink };
    }
    case 'back': return { ...base, look: toTrainer, neck: 0.6, wag: 0.5 * Math.sin(f * 0.3), tail: 0.25, ears: 0.2, blink: f > w.come + 30 && f < w.come + 37 ? 1 : base.blink };
    case 'times': return { ...base, look: [1.4, 0.4, 1.4], neck: 0.6, ears: 0.3, breath: 0.3 + 0.3 * Math.sin(f * 0.12), blink: f > w.t1 + 4 && f < w.t1 + 14 ? 1 : base.blink };
    case 'upset': {
      const sit = sm(ramp(f, w.gets - 4, w.gets + 10)), wh = whineAt(f) ? Math.abs(Math.sin(f * 0.42)) : 0;
      return { ...base, w: { down: 1 - sit, sit }, look: [sw(0.9, 1.4, 0.04), 0.15, 1.3], neck: 0.5, ears: -0.4 * sit, headTilt: 8 * sit * Math.sin(f * 0.21), jaw: 0.2 * wh, tail: 0.1, wag: f < w.gets ? 0.5 * Math.sin(f * 0.4) : 0.1 };
    }
    case 'mixA': return { ...base, look: [sw(0.6, 1.5, 0.06), 0.3, 1.4], neck: 0.6, ears: 0.3, breath: 0.3 + 0.3 * Math.sin(f * 0.12) };
    case 'mixB': {   // can't predict: head tilts left then right, ears swivel
      const t = Math.sin(f * 0.07);
      return { ...base, look: [0.9 + 0.7 * t, 0.3, 1.3], neck: 0.6, headTilt: 14 * Math.sin(f * 0.11), ears: 0.3 + 0.3 * Math.sin(f * 0.15), tail: 0.1 };
    }
    case 'fuss': {
      const up = sm(ramp(f, w.big, w.big + 24)), j = Math.abs(Math.sin(f * 0.5)) * up;
      return { ...base, w: { down: 1 - up, stand: up }, look: toTrainer, neck: 0.6, ears: 0.2, wag: Math.sin(f * 0.9) * 1.2 * up, tail: 0.1 + 0.3 * up, pos: [DOGPOS[0], DOGPOS[1] + 0.1 * j, DOGPOS[2]] };
    }
    case 'excite': {
      const j = Math.abs(Math.sin(f * 0.45));
      return { ...base, w: { stand: 1 }, look: [1.5, 0.4, 0.9], neck: 0.6, ears: 0.1, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, pos: [DOGPOS[0], DOGPOS[1] + 0.1 * j, DOGPOS[2]], jaw: 0.4 };
    }
    case 'calmT': return { ...base, look: toTrainer, neck: 0.6, wag: 0.3 * Math.sin(f * 0.2), ears: 0.2, blink: f > w.calm1 + 14 && f < w.calm1 + 21 ? 1 : base.blink };
    case 'calmP': {
      const lid = f > w.quiet + 6 ? 0.5 + 0.15 * Math.sin(f * 0.05) : base.blink;
      return { ...base, look: [sw(1.0, 1.4, 0.04), 0.15, 1.3], neck: 0.5, blink: lid, breath: 0.35 + 0.35 * Math.sin(f * 0.12), ears: 0.4, wag: 0.25 * Math.sin(f * 0.1) };
    }
    case 'back2': return { ...base, look: toTrainer, neck: 0.6, wag: 0.4 * Math.sin(f * 0.25), tail: 0.2, ears: 0.2, blink: f > w.when + 14 && f < w.when + 21 ? 1 : base.blink };
    case 'open': return { ...base, look: [1.5, 0.35, 0.9], neck: 0.6, wag: 0.5 * Math.sin(f * 0.3), tail: 0.2, ears: 0.3 };
    case 'yes': return { ...base, look: [TRN[0] + 0.3, 0.7, TRN[2] + 0.3], neck: 0.7, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, ears: f > w.click - 2 && f < w.click + 8 ? -0.5 : 0, jaw: f > w.yes && f < w.yes + 16 ? 0.5 : 0.2 };
    case 'final': {
      const t0 = w.reward + 4, ch = f >= t0 && f < t0 + 16 ? Math.abs(Math.sin((f - t0) * 0.75)) : f >= t0 + 16 ? 0.35 : 0;
      return { ...base, look: W.treat && !W.treatHide ? W.treat : [1.2, 0.5, 0.9], neck: 0.85, jaw: ch, wag: Math.sin(f * 0.9) * 1.3, tail: 0.4, blink: f > t0 + 1 && f < t0 + 9 ? 1 : base.blink };
    }
  }
  return base;
};

// ---------- props: toy, treat, hand ----------
const toyPath = (f) => {
  const id = shotAt(f).id;
  if (id === 'setup') return f < w.treats - 8 ? { pos: TOY_MAT, yaw: 0.6 } : null;
  if (id === 'hook') return { pos: TOY_IN, yaw: 0.5 };
  return { pos: TOY_IN, yaw: 0.5 };
};
const treatPath = (f) => (shotAt(f).id === 'final' ? HK(f, [[w.then2, null], [w.reward + 2, MOUTH()]]) : null);
// the hand: below the frame at a, on the door latch from b to c (following the swinging door), below the frame again at d
const follow = (f, a, b, c, d) => {
  const at = (g) => add(doorWorld(g, 0.3), [0.04, 0, 0.0]);
  if (f < b) return HK(f, [[a, null], [b, at(b)]]);
  if (f <= c) return at(f);
  return HK(f, [[c, at(c)], [d, null]]);
};
const handFor = (f) => {
  const S = shotAt(f).id, t = treatPath(f);
  if (S === 'shut') return { at: follow(f, w.close - 14, w.close - 4, w.door2 + 6, w.door2 + 22), pose: 'relax', side: 0.16 };
