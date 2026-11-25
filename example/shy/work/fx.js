const BUB_CUE = [0.3, 0.62, 0.1], BUB_YES = [-0.12, 0.78, -0.45], BADGE = [0.3, 0.58, 0.08];   // bubble / badge anchors above the head (tuned on stills)
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 6, ...extra });
export const fxAt = (f, T) => {
  CUR = camAt(f).pos;
  const out = [], S = shotAt(f);
  const pop = (a, b) => q(M.back(ramp(f, a, a + 9)) * (1 - sm(ramp(f, b - 6, b))), 2);
  const badge = (fn, key, a, b, pos, s) => { if (f >= a && f < b) { const k = pop(a, b); if (k > 0.02) out.push(FX(key + k, (p) => fn(p, 1), pos, s * k, { roll: q(0.06 * Math.sin(f * 0.2), 2) })); } };
  const hearts = (t0, at, n = 3, sc = 0.06) => { for (let i = 0; i < n; i++) { const a = t0 + i * 4, k = ramp(f, a, a + 24); if (k > 0 && k < 1) out.push(FX('ht', (p) => T.fxHeart2(p), [at[0] + (i - 1) * 0.07, at[1] + 0.06 + k * 0.18, at[2]], sc * M.back(ramp(f, a, a + 7)), { alpha: q(1 - k * k, 2) })); } };
  const spark = (t0, at, sc) => { if (f >= t0 && f < t0 + 14) { const k = q(ramp(f, t0, t0 + 14), 2); out.push(FX('sp' + k, (p) => T.fxSpark2(p, k), at, sc, { order: 7 })); } };
  if (S.id === 'reward') hearts(EAT.reward + 1, HEAD());
  // cue bubbles (James's look): pop in above the head on the spoken cue / the marker
  const bubble = (key, text, sub, fill, a, b, pos, sc) => { if (f >= a && f < b) { const k = q(M.back(ramp(f, a, a + 7)) * (1 - sm(ramp(f, b - 5, b))), 2); if (k > 0.02) out.push(FX(key + k, (p) => T.fxBubble(p, text, sub, fill), [pos[0], pos[1] + 1.07 * sc * (1 - k), pos[2]], sc * k, { order: 8 })); } };
  if (S.id === 'swipe') bubble('bm', 'Yes!', '', '#fbf0b4', w.mark - 2, w.mark + 44, BUB_CUE, 0.2);
  if (S.id === 'cue') bubble('bd', 'Shy!', '', '#ffffff', w.shy2 - 2, w.shy2 + 44, BUB_CUE, 0.2);
  if (S.id === 'yes') bubble('by', 'Yes!', '', '#fbf0b4', w.yes - 3, w.click - 4, BUB_YES, 0.5);
  if (S.id === 'wrong') badge(T.fxCross, 'no', w.on - 3, w.take - 8, BADGE, 0.2);
  if (S.id === 'fix') badge(T.fxCheck, 'ok', w.anything - 2, w.say2 - 6, BADGE, 0.17);
  if (S.id === 'yes' && f >= w.click) { const k = q(ramp(f, w.click, w.click + 16), 2); out.push(FX('ck' + k, (p) => T.fxClick(p, k), [TRN[0] + 0.02, 0.62, TRN[2] + 0.12], 0.26)); }
  if (S.id === 'final') {
    hearts(w.reward2 + 3, HEAD(), 4, 0.06);
    if (f >= w.reward2) for (let i = 0; i < 3; i++) { const t = q(ramp(f, w.reward2 + i * 3, TOTAL - 1), 2); out.push(FX('cf' + i + t, (p) => T.fxConfetti(p, t, i + 1), add(NOSE(), [0.05, 0.1, -0.2 + i * 0.2]), 0.4, { order: 7 })); }
  }
  return out;
};
