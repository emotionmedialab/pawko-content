  if (S === 'open') return { at: follow(f, w.calm2 - 2, w.calm2 + 4, w.calm2 + 28, w.calm2 + 33), pose: 'relax', side: 0.16 };
  if (S === 'final') return t && { treat: t, side: 0.22 };
  return null;
};
export const worldAt = (f) => {
  if (globalThis.TEST?.W) return globalThis.TEST.W;
  const S = shotAt(f), W = {};
  W.crate = { pos: CR, yaw: 0, door: doorAt(f) };
  const toy = toyPath(f); if (toy) W.toy = toy;
  const t = treatPath(f); if (t) W.treat = t;
  const hd = handFor(f); if (hd) W.hand = hd;
  if (S.id === 'final' && f >= w.reward + 4) W.treatHide = true;
  return W;
};

// ---------- the 2D trainer (hook, step, back, fuss, calm, yes) ----------
const talkAt = (f) => clamp((VENV[f] || 0) * 1.25);
const trainerYes = (f) => {
  const hi = idle(f, 3), clickOn = f >= w.click && f < w.click + 5;
  return { kneel: 1, expr: f >= w.yes - 4 && f < w.yes + 16 ? 'yes' : f >= w.yes + 16 ? 'proud' : 'grin', talk: talkAt(f) * 0.6, blink: blinkAt(f, 3), look: -0.3, headTilt: hi.headTilt + 4,
    near: { to: [318, 690 - 40 * sm(ramp(f, w.click - 10, w.click - 2))], hand: 'clicker', bend: -1 }, click: clickOn ? 1 : 0, far: f >= w.yes ? 'thumb' : 'present', lean: 6 };
};
const trainerAt = (f) => {
  const hi = idle(f, 3), id = shotAt(f).id;
  const o = { hose: true, kneel: 1, expr: 'smile', talk: talkAt(f) * 0.9, blink: blinkAt(f, 3), look: -0.2, headTilt: hi.headTilt, near: 'thumb', far: 'present', lean: 6 };
  if (id === 'hook') { o.expr = f > 30 ? 'grin' : 'smile'; o.look = f > 40 ? -0.2 : 0.8; o.near = f > w.crate1 + 20 ? 'thumb' : { to: [270, 806], hand: 'fist', bend: -1 }; }
  if (id === 'step') { o.expr = 'smile'; o.far = 'wave'; o.look = 0.9; o.lean = 10; }
  if (id === 'back' || id === 'back2') { o.expr = f < w.come + 12 ? 'grin' : 'smile'; o.talk = talkAt(f) * 0.5; o.lean = 4; }
  if (id === 'fuss') { const k = ramp(f, w.big - 6, w.big + 12); o.expr = 'yes'; o.far = k > 0 ? 'wave' : 'present'; o.near = k > 0 ? 'wave' : 'thumb'; o.lean = 8 + 10 * k * Math.abs(Math.sin(f * 0.5)); o.talk = 1; }
  if (id === 'calmT') { o.expr = f < w.calm1 ? 'oops' : 'smile'; o.talk = talkAt(f) * 0.4; o.far = 'present'; o.lean = 3; }
  return o;
};

// ---------- cameras ----------
const HC = (a, b) => [{ f: a, pos: [1.8, 0.65, 2.3], look: [-0.15, 0.95, 0.1], fov: 50 }, { f: b, pos: [1.62, 0.62, 2.08], look: [-0.2, 0.92, 0.1], fov: 50 }];   // trainer beside the crate (Crate II hook)
const PV = (a, b, l0 = [0.25, 0.28, 0.0], l1 = [0.27, 0.24, 0.0]) => [{ f: a, pos: [1.3, 0.88, 0.56], look: l0, fov: 42 }, { f: b, pos: [1.24, 0.82, 0.53], look: l1, fov: 42 }];   // gold POV keys
const CAMS = {
  hook: [{ f: 0, pos: [1.8, 0.65, 2.3], look: [-0.15, 0.95, 0.1], fov: 50 }, { f: w.crate1 + 24, pos: [1.75, 0.64, 2.25], look: [-0.15, 0.95, 0.1], fov: 50 }, { f: w.grab - 1, pos: [1.6, 0.62, 2.05], look: [-0.2, 0.92, 0.1], fov: 50 }],
  setup: [{ f: w.grab, pos: [1.5, 0.38, 1.25], look: [0.95, 0.07, 0.5], fov: 36 }, { f: w.treats - 9, pos: [1.45, 0.36, 1.2], look: [0.95, 0.07, 0.5], fov: 36 },
    { f: w.treats - 8, pos: [2.75, 0.98, 0.4], look: [1.85, 0.68, -0.75], fov: 40 }, { f: w.close - 1, pos: [2.68, 0.96, 0.3], look: [1.85, 0.66, -0.75], fov: 40 }],
  shut: PV(w.close, w.then1 - 1),
  step: HC(w.then1, w.sight - 1),
  alone: [{ f: w.sight, pos: [3.0, 0.8, 0.2], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.come - 1, pos: [2.8, 0.78, 0.2], look: [0.3, 0.78, 0.0], fov: 42 }],
  back: HC(w.come, w.work - 1),
  times: [{ f: w.work, pos: [2.9, 1.0, 1.3], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.t1 - 1, pos: [2.82, 0.98, 1.27], look: [0.3, 0.78, 0.0], fov: 42 },
    { f: w.t1, pos: [3.0, 0.8, 0.2], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.t2 - 1, pos: [2.92, 0.8, 0.18], look: [0.3, 0.78, 0.0], fov: 42 },
    { f: w.t2, pos: [1.9, 1.4, 2.4], look: [0.1, 0.78, 0.0], fov: 42 }, { f: w.always - 1, pos: [1.85, 1.38, 2.3], look: [0.1, 0.78, 0.0], fov: 42 }],
  upset: PV(w.always, w.mix - 1),
  mixA: [{ f: w.mix, pos: [2.9, 1.0, 1.3], look: [0.3, 0.78, 0.0], fov: 42 }, { f: w.predict - 1, pos: [2.82, 0.98, 1.27], look: [0.3, 0.78, 0.0], fov: 42 }],
  mixB: PV(w.predict, w.if - 1, [0.3, 0.3, 0.0], [0.3, 0.26, 0.0]),
  fuss: HC(w.if, w.coming - 1),
  excite: PV(w.coming, w.keep - 1, [0.25, 0.35, 0.0], [0.27, 0.3, 0.0]),
  calmT: HC(w.keep, w.quiet - 1),
  calmP: PV(w.quiet, w.when - 1, [0.28, 0.25, 0.0], [0.3, 0.22, 0.0]),
  back2: HC(w.when, w.calm2 - 1),
  open: PV(w.calm2, w.say - 1),
  yes: [{ f: w.say, pos: [1.8, 0.65, 2.3], look: [-0.15, 0.95, 0.1], fov: 50 }, { f: w.then2 - 1, pos: [1.65, 0.63, 2.1], look: [-0.18, 0.93, 0.1], fov: 50 }],
  final: PV(w.then2, TOTAL - 1, [0.4, 0.3, 0.0], [0.4, 0.3, 0.0]),
};
const HANDCAMS = ['shut', 'open', 'final'];
export const camAt = (f) => {
  if (globalThis.TEST?.cam) return globalThis.TEST.cam;
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, {});
  if (HANDCAMS.includes(S.id)) { c.pos = add(c.pos, [0.006 * Math.sin(f * 0.11), 0.005 * Math.sin(f * 0.07 + 1), 0.006 * Math.sin(f * 0.09 + 2)]); c.roll = (c.roll || 0) + 1.2 * Math.sin(f * 0.05); }
  c.shadowAt = [0.1, 0.2, 0];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f);
  if (['hook', 'step', 'back', 'fuss', 'calmT', 'back2', 'yes'].includes(S.id)) return { focus: dist(C.pos, [0.3, 0.35, -0.1]), cinf: 5 };
  if (S.id === 'setup') return { focus: dist(C.pos, C.look), cinf: 7 };
  return { focus: dist(C.pos, [0.25, 0.35, 0.0]), cinf: 4 };
};

// ---------- 2D actors + effects ----------
const roundAll = (o) => { const r = {}; for (const k in o) { const v = o[k]; r[k] = typeof v === 'number' ? q(v, 2) : Array.isArray(v) ? v.map((x) => (typeof x === 'number' ? Math.round(x) : x)) : v && typeof v === 'object' ? roundAll(v) : v; } return r; };
const TRAINER_SHOTS = ['hook', 'step', 'back', 'fuss', 'calmT', 'back2'];
export const actorsAt = (f, T) => {
  CUR = camAt(f).pos; TCUR = TRN;
  const S = shotAt(f), out = [];
  const put = (tO) => out.push({ key: 'tr' + JSON.stringify(tO), draw: (p) => T.trainerDraw(p, tO), x: TRN[0], y: TRN[1], z: TRN[2], s: 0.85, flip: false, order: 1, ground: MAT, blobW: 0.8 });
  if (S.id === 'yes') put(roundAll({ ...trainerYes(f), mirror: false }));
  if (TRAINER_SHOTS.includes(S.id)) put(roundAll({ ...trainerAt(f), mirror: false }));
  return out;
};
const BUB_YES = [TRN[0] + 0.45, 0.7, TRN[2] + 0.1];
// cards are anchored at their feet: FXc places the badge CENTRE (design point 300,500) at `pos`
const FXc = (key, draw, pos, s, extra = {}) => FX(key, draw, [pos[0], pos[1] - 1.1 * s, pos[2]], s, extra);
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
const TIMES = [[w.one - 3, w.t1 - 2, '1 min'], [w.two - 3, w.t2 - 2, '2 min'], [w.five - 3, w.always - 2, '5 min']];
const TIMES_MIX = [[w.short - 3, w.long - 3, '15 sec'], [w.long - 3, w.abs + 24, '4 min'], [w.abs + 26, w.predict - 4, '1 min']];
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FXc(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.09) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.09, at[1] + 0.06 + k * 0.22, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const sigh = (a, b, at) => { if (f >= a && f < b) { const t = q(ramp(f, a, b), 2); out.push(FXc('si' + t, (p) => T.fxSigh(p, t), at, 0.16)); } };
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  const timers = (list) => { for (const [a, b, label] of list) if (f >= a && f < b) { const k = pop(a, b), prog = q(ramp(f, a + 4, b - 6), 2); if (k > 0.02) out.push(FXc('tm' + label + k + prog, (p) => T.fxTimer(p, label, prog), [0.2, 1.15, 0.1], 0.5 * k, { roll: 0 })); } };
  const MUZ = add(NOSE('sit'), [0.03, 0.0, -0.12]);
  const FACE = add(NOSE('down'), [0.1, 0.02, 0.1]);
  const TOP = [0.15, 1.1, 0.0];                 // badge anchor above the crate in the wide trainer cameras
  const POVB = [0.5, 0.66, 0.0];                // badge anchor above the puppy in the POV cameras
  if (S.id === 'hook') sigh(w.crate1 + 22, w.crate1 + 52, FACE);
  if (S.id === 'setup') { badge(T.fxCheck, 'ok', w.toy1 + 4, w.treats - 8, [TOY_MAT[0] + 0.1, 0.3, TOY_MAT[2]], 0.14); badge(T.fxCheck, 'ok2', w.treats + 4, w.close, [1.85, 1.0, -0.55], 0.15); }
  if (S.id === 'shut') hearts(w.door2 + 16, HEADP());
  if (S.id === 'alone') { timers([[w.thirty - 3, w.come - 2, '30 sec']]); sigh(w.thirty + 40, w.thirty + 70, FACE); }
  if (S.id === 'back') sigh(w.calmly, w.calmly + 30, FACE);
  if (S.id === 'times') timers(TIMES);
  if (S.id === 'upset') { badge(T.fxCheck, 'ok3', w.ret1, w.gets - 6, POVB, 0.14); if (whineAt(f)) { const t = q((f * 0.045) % 1, 2); out.push(FXc('wh' + t, (p) => T.fxWhine(p, t), MUZ, 0.5)); } }
  if (S.id === 'mixA') timers(TIMES_MIX);
  if (S.id === 'fuss') badge(T.fxCross, 'no', w.big + 6, w.coming, TOP, 0.3);
  if (S.id === 'excite') badge(T.fxCross, 'no2', w.coming, w.keep - 4, POVB, 0.14);
  if (S.id === 'calmT') sigh(w.calm1 + 6, w.calm1 + 36, FACE);
  if (S.id === 'calmP') { badge(T.fxCheck, 'ok4', w.quiet + 6, w.when - 4, POVB, 0.14); sigh(w.quiet + 2, w.quiet + 32, FACE); }
  if (S.id === 'back2') hearts(w.dog, HEADP());
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.55);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FXc('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.5, 1.0, TRN[2] + 0.2], 0.3)); }
  if (S.id === 'final') {
    hearts(w.reward + 5, HEADP(), 4, 0.08);
    if (f >= w.reward) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE('down'), [0.05, 0.15, -0.3 + i * 0.3]), 0.5, { order: 7 })); }
  }
  return out;
};
