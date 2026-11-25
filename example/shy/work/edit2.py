import re
s=open('story.js',encoding='utf8').read()
def rep(a,b):
    global s
    assert a in s,a[:70]; s=s.replace(a,b,1)
rep("  REF.A = poseFn({ w: { swpA: 1 }, look: LK });","  REF.A = poseFn({ w: { swpA: 1 }, look: LK });\n  REF.H = poseFn({ w: { swpA: 0.5, swpB: 0.5 }, look: LK });   // the paw resting on the face (s = 1.5)")
rep("const TAPEP = () => add(NOSE(), [-0.045, 0.03, 0]);","const TAPEP = () => REF.sit.tape;")
rep("const TAPEPAW = () => add(REF.A.bR, [0, 0.02, 0.02]);","const TAPEPAW = () => add(REF.H.bR, [0, 0.02, 0.02]);")
rep("const MOUTH = () => add(NOSE(), [0.12, -0.08, 0.06]);","const MOUTH = () => add(NOSE(), [0.03, 0.0, 0.0]);")
a=s.index("const swipeKeys"); b=s.index("const swipeW")
s=s[:a]+"""// three rubbing strokes over the muzzle (B <-> C), then the paw rests on the face (s = 1.5) with a small wobble until `end`
const strokes = (f, c, end, back = 11) => {
  const keys = [[c - 18, 0], [c - 9, 1], [c, 2], [c + 5, 3], [c + 10, 2.1], [c + 15, 3], [c + 20, 2.1], [c + 25, 3], [c + 31, 1.5]];
  if (end > c + 31) keys.push([end, 1.5]);
  keys.push([end + back, 0]);
  const wob = f > c + 31 && f < end - 26 ? 0.2 * Math.sin((f - c) * 0.4) * Math.min(1, (f - c - 31) / 6) : 0;
  return KF(f, keys) + wob;
};
const swipeKeys = (f) => {
  switch (shotAt(f).id) {
    case 'hook': return KF(f, [[w.act - 9, 0], [w.act - 2, 1], [w.act + 5, 2], [w.act + 10, 3], [w.act + 15, 2.1], [w.act + 20, 3], [w.act + 25, 2.1], [w.act + 30, 3], [w.shy1 + 36, 2.85], [w.grab - 4, 2.9]]);
    case 'swipe': return strokes(f, w.paw1 - 4, w.peel + 22, 11);
    case 'small': return strokes(f, w.each - 1, w.each + 31, 10);
    case 'hand': return strokes(f, w.nose2 + 10, w.nose2 + 41, 8);
    case 'cue': return strokes(f, w.paw2 + 2, w.paw2 + 33, 10);
    case 'fix': return strokes(f, w.paw3 - 3, w.paw3 + 31, 11);
    case 'wrong': return R(f, w.if + 4, w.if + 14) * (1 - R(f, w.take - 14, w.take - 2)) * (2.45 + 0.55 * Math.sin(f * 0.5));   // keeps pawing at the nose, the tape stays on
  }
  return 0;
};
"""+s[b:]
rep("const dip = 0.06 * Math.min(1, s);","const dip = 0.1 * Math.min(1, s);")
rep("""      const k = R(f, w.tape3, w.on + 8);
      return { ...base, look: [1.0, 0.16, 0.5 * Math.sin(f * 0.3) * k + 0.1], neck: 0.9, headTilt: 10 * Math.sin(f * 0.3) * k, ears: -0.45 * k,""","""      const k = R(f, w.if + 4, w.if + 16);
      return { ...base, yaw: base.yaw + 0.09 * Math.sin(f * 0.21) * k, look: [LK[0], LK[1] - 0.08 * k, LK[2] + 0.35 * Math.sin(f * 0.9) * k], neck: 1, headTilt: 12 * Math.sin(f * 0.9) * k, ears: -0.5 * k,""")
W0=s.index("export const worldAt")
head,s=s[:W0],s[W0:]
a=s.index("    case 'stick': {"); b=s.index("    case 'swipe': { const c")
s=s[:a]+"""    case 'stick': {
      const P = HOLD(TAPEP()), AP = add(P, [0.12, 0.03, 0.04]);   // the hand stays ahead of the muzzle, only the fingertips reach the tape spot
      const at = KF(f, [[w.stick, BELOW(w.stick, AP)], [w.lightly + 6, AP], [w.nose1 - 4, P], [w.nose1 + 14, P], [w.nose1 + 30, AP], [w.when - 2, BELOW(w.when - 2, AP)]]);
      W.hand = offer(at, 'pinch', PINCH);
      W.tape = f < w.nose1 + 2 ? { on: 'at', at: add(at, [-0.03, 0.01, 0]), s: 1 } : { on: 'nose', s: 1 };
      break;
    }
"""+s[b:]
rep("    case 'setup': {\n","    case 'setup': {\n      if (f < w.tiny) W.tape = { on: 'at', at: [1.99, 0.545, -0.62], s: 1.6 };   // the tape beside the treat jar\n")
a=s.index("    case 'reward': {"); b=s.index("    case 'final': { const at")
s=s[:a]+"""    case 'reward': {
      const m = KF(f, [[w.reward1 - 2, BELOW(w.reward1 - 2, MOUTH())], [w.reward1 + 5, MOUTH()], [w.reward1 + 14, MOUTH()], [w.reward1 + 26, BELOW(w.reward1 + 26, MOUTH())]]);
      if (f >= w.reward1 - 2 && f <= w.reward1 + 26) { W.treat = add(m, [-0.03, 0.01, 0]); W.hand = offer(add(m, [0.03, -0.01, 0]), 'pinch', PINCH); }
      break;
    }
"""+s[b:]
rep("[w.then2, BELOW(w.then2, MOUTH())], [w.reward2 - 1, MOUTH()]]); W.hand = offer(at, 'pinch', PINCH); W.treat = add(at, [-0.03, 0.01, 0]);","[w.then2, BELOW(w.then2, MOUTH())], [w.reward2 - 2, MOUTH()], [w.reward2 + 6, MOUTH()], [w.reward2 + 17, BELOW(w.reward2 + 17, MOUTH())]]); W.hand = offer(add(at, [0.03, -0.01, 0]), 'pinch', PINCH); W.treat = at;")
rep("  if (S.id === 'final' && f <= w.then2) W.hand = null;\n","") if "  if (S.id === 'final' && f <= w.then2) W.hand = null;\n" in s else None
s=head+s
s=re.sub(r"  reward: two\(.*\n","  reward: two(w.reward1, w.next - 1, SIDE0, SIDE1),\n",s)
s=re.sub(r"  final: two\(.*\n","  final: two(w.then2, TOTAL - 1, SIDE0, SIDE1),\n",s)
open('story.js','w',encoding='utf8').write(s)
