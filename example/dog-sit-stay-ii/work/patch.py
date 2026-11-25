m = open('web/main.js', encoding='utf8').read()
a = "tmpS.setScalar(k * (W.trailS || 1)); tmpM.compose(new THREE.Vector3(...pts[i]), tmpQ, tmpS);"
assert m.count(a) == 1
m = m.replace(a, "if (W.trailFlat) { tmpS.set(2.2 * k * W.trailS, 0.45 * k * W.trailS, 1.4 * k * W.trailS); tmpQ.setFromAxisAngle(new THREE.Vector3(0, 1, 0), pts[i][3] || 0); } else { tmpS.setScalar(k * (W.trailS || 1)); tmpQ.identity(); } tmpM.compose(new THREE.Vector3(pts[i][0], pts[i][1], pts[i][2]), tmpQ, tmpS);")
open('web/main.js', 'w', encoding='utf8').write(m)

s = open('web/story.js', encoding='utf8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a
    s = s.replace(a, b)
# shots
i = s.index("export const SHOTS = ["); j = s.index("];", i) + 2
s = s[:i] + """export const SHOTS = [
  { id: 'hook', a: 0, b: w.walk - 1, light: 'day' },               // trainer kneels beside the sitting puppy, hand signal
  { id: 'away', a: w.walk, b: w.grab - 1, light: 'day' },          // hard cut: footprints walk away, the puppy stays and watches
  { id: 'setup', a: w.grab, b: w.ask - 1, light: 'day' },          // treat jar, then the puppy on the mat; check on "space"
  { id: 'ask', a: w.ask, b: w.take - 1, light: 'day' },            // POV: stand -> sit, "Stay!" bubble, flat palm held, then pulled away
  { id: 'step1', a: w.take, b: w.reward1 - 1, light: 'day' },      // raised 3/4: footprint pairs out (1 step) and back
  { id: 'reward1', a: w.reward1, b: w.steps - 1, light: 'day' },   // POV: treat for the sitting puppy
  { id: 'steps', a: w.steps, b: w.always - 1, light: 'day' },      // raised 3/4: 2 steps, then 5 steps
  { id: 'backWalk', a: w.always, b: w.dog - 1, light: 'day' },     // footprints walk back to the puppy
  { id: 'back', a: w.dog, b: w.next - 1, light: 'day' },           // hard cut: trainer already beside the puppy; check on "release"
  { id: 'around', a: w.next, b: w.feed - 1, light: 'day' },        // footprint ring around the sitting puppy, which tracks it
  { id: 'povStay', a: w.feed, b: w.dont - 1, light: 'day' },       // POV: two treats while it keeps sitting
  { id: 'mistake1', a: w.dont, b: w.then1 - 1, light: 'day' },     // MISTAKE: called over, gets up, red cross
  { id: 'toss', a: w.then1, b: w.if - 1, light: 'day' },           // "Okay!" releases it; a treat is tossed, chomp
  { id: 'mistake2', a: w.if, b: w.itwas - 1, light: 'day' },       // gets up (cross), quietly sits again (sigh, check)
  { id: 'calm', a: w.itwas, b: w.every - 1, light: 'day' },        // low orbit, relaxed sit, sigh
  { id: 'retWalk', a: w.every, b: w.return - 1, light: 'day' },    // footprints walk back to the puppy
  { id: 'ret', a: w.return, b: w.say2 - 1, light: 'day' },         // hard cut: trainer beside the puppy
  { id: 'yes', a: w.say2, b: w.then2 - 1, light: 'golden' },       // trainer: "yes" + click
  { id: 'povFinal', a: w.then2, b: TOTAL - 1, light: 'golden' },   // POV: reward, confetti
];""" + s[j:]
# trainer static
i = s.index("const trainerPlace = (f) => {"); j = s.index("};", i) + 2
s = s[:i] + "const trainerPlace = () => ({ x: TRN[0], z: TRN[2], y: MAT, s: ST, flip: true, kneel: 1, moving: false });" + s[j:]
# footprints
i = s.index("const FP0 = () =>"); j = s.index("// footprint ring around the puppy")
s = s[:i] + """const SP = 0.1, S0 = 0.2, DIR = [0.894, -0.447], PERP = [0.447, 0.894];
const FPB = () => [NOSE('sit')[0] + 0.05, 0];
const YAW = Math.atan2(-DIR[1], DIR[0]);
// a stage: n footprint pairs out (o0..o1), then back (r0..r1); o0 < 0 = already drawn
const ST1 = { n: 1, o0: w.take + 5, o1: w.take + 17, r0: w.ret1, r1: w.ret1 + 14 }, STA = { n: 2, o0: w.two - 2, o1: w.two + 14, r0: w.two + 21, r1: w.two + 34 };
const STB = { n: 5, o0: w.five - 2, o1: w.five + 22, r0: w.always + 2, r1: w.dog - 4 }, STR = { n: 3, o0: -1, o1: -1, r0: w.every + 1, r1: w.return - 2 }, STAWAY = { n: 3, o0: w.walk + 2, o1: w.walk + 28, r0: 99999, r1: 99999 };
const pairAt = (i, lane) => {
  const B = FPB(), c = [B[0] + DIR[0] * (S0 + i * SP) + PERP[0] * lane, B[1] + DIR[1] * (S0 + i * SP) + PERP[1] * lane];
  return [[c[0] + PERP[0] * 0.03 - DIR[0] * 0.02, MAT + 0.012, c[1] + PERP[1] * 0.03 - DIR[1] * 0.02, YAW], [c[0] - PERP[0] * 0.03 + DIR[0] * 0.02, MAT + 0.012, c[1] - PERP[1] * 0.03 + DIR[1] * 0.02, YAW]];
};
const stagePts = (f, st) => {
  const pts = [];
  for (let i = 0; i < st.n; i++) if (st.o0 < 0 || f >= st.o0 + (st.o1 - st.o0) * (i + 1) / st.n) pts.push(...pairAt(i, 0));
  for (let j = 0; j < st.n; j++) if (f >= st.r0 + (st.r1 - st.r0) * (j + 1) / st.n) pts.push(...pairAt(st.n - 1 - j, 0.13));
  return pts;
};
/** where the (off screen) walker is: distance along the path in metres */
const leadD = (f, st) => {
  const L = st.n * SP;
  if (st.o0 >= 0 && f < st.o0) return 0;
  if (f < st.r0) return st.o0 < 0 ? L : L * clamp((f - st.o0) / (st.o1 - st.o0), 0, 1);
  return L * (1 - clamp((f - st.r0) / (st.r1 - st.r0), 0, 1));
};
const stageAt = (f) => (f < w.grab ? STAWAY : f < w.reward1 ? ST1 : f < w.five ? STA : f < w.dog ? STB : STR);
const leadPt = (f) => { const st = stageAt(f), d = S0 + leadD(f, st), B = FPB(); return [B[0] + DIR[0] * d, 0.3, B[1] + DIR[1] * d]; };
const returning = (f) => { const st = stageAt(f); return f >= st.r0 && f < st.r1 + 8; };
""" + s[j:]
# dog cases
rep("""    case 'hook': {
      const P = trainerPlace(f);
      return { ...base, pos: HOOKP, look: [P.x + 0.02, 0.8, clamp(P.z, -1.4, -0.3)], ears: f > w.walk - 6 ? -0.4 : -0.2, headTilt: 6 * Math.sin(Math.PI * ramp(f, w.walk - 6, w.walk + 18)), wag: 0.5 * Math.sin(f * 0.3) };
    }""", """    case 'hook': case 'back': case 'ret': {
      return { ...base, pos: HOOKP, look: [TRN[0] + 0.02, 0.8, TRN[2]], ears: -0.2, wag: 0.5 * Math.sin(f * 0.3) };
    }
    case 'away': case 'step1': case 'steps': case 'backWalk': case 'retWalk': {
      const L = leadPt(f), ret = returning(f);
      return { ...base, look: [L[0], 0.3, L[2]], neck: 0.8, ears: -0.2, tail: ret ? 0.35 : 0.15, wag: ret ? 1.0 * Math.sin(f * 0.8) : 0.2 * Math.sin(f * 0.25), headTilt: 4 * Math.sin(f * 0.05) };
    }""")
i = s.index("    case 'step1': case 'steps': {"); j = s.index("    case 'reward1': {")
s = s[:i] + s[j:]
i = s.index("    case 'back': {\n      const P = trainerPlace(f);"); j = s.index("    case 'around': {")
s = s[:i] + s[j:]
i = s.index("    case 'ret': {\n      const P = trainerPlace(f);"); j = s.index("    case 'yes': {")
s = s[:i] + s[j:]
# worldAt beads
rep("  if (S.id === 'step1') bead(prints(f, ...STEP1));\n  if (S.id === 'steps') bead(f < w.five ? prints(f, ...SETA) : prints(f, ...SETB));", "  const flat = (pts) => { bead(pts); W.trailFlat = true; W.trailS = 1.15; };\n  if (S.id === 'away') flat(stagePts(f, STAWAY));\n  if (S.id === 'step1') flat(stagePts(f, ST1));\n  if (S.id === 'steps') flat(f < w.five ? stagePts(f, STA) : stagePts(f, STB));\n  if (S.id === 'backWalk') flat(stagePts(f, STB));\n  if (S.id === 'retWalk') flat(stagePts(f, STR));")
rep("if (S.id === 'hook') { o.expr = f > 20 ? 'grin' : 'smile'; o.far = f >= 20 && f < w.walk + 20 ? 'signal' : 'present'; o.look = 0.6; }", "if (S.id === 'hook') { o.expr = f > 20 ? 'grin' : 'smile'; o.far = f >= 20 ? 'signal' : 'present'; o.look = 0.6; }")
# cameras
rep("  step1: POVSIT(w.take, w.reward1 - 1),", "  away: STEPC(w.walk, w.grab - 1), step1: STEPC(w.take, w.reward1 - 1), backWalk: STEPC(w.always, w.dog - 1), retWalk: STEPC(w.every, w.return - 1),")
rep("  steps: POVSIT(w.steps, w.always - 1),", "  steps: STEPC(w.steps, w.always - 1),")
rep("  back: HOOKC(w.always, w.next - 1),", "  back: HOOKC(w.dog, w.next - 1),")
rep("  ret: HOOKC(w.every, w.say2 - 1),", "  ret: HOOKC(w.return, w.say2 - 1),")
rep("const POVSIT =", "const STEPC = (a, b) => [{ f: a, pos: [1.55, 1.0, 0.9], look: [0.22, 0.22, -0.05], fov: 42 }, { f: b, pos: [1.42, 0.94, 0.84], look: [0.22, 0.22, -0.05], fov: 42 }];   // dog-down-ii 'stand' keys, raised for a sitting puppy\nconst POVSIT =")
s = s.replace("pos: [0.9, 0.5, 1.5], look: [0.22, 0.36, 0.05], fov: 46", "pos: [0.74, 0.5, 1.57], look: [0.06, 0.36, 0.13], fov: 46").replace("pos: [0.72, 0.5, 1.34], look: [0.22, 0.34, 0.05], fov: 46", "pos: [0.56, 0.5, 1.41], look: [0.06, 0.34, 0.13], fov: 46").replace("pos: [0.84, 0.5, 1.46], look: [0.22, 0.36, 0.05], fov: 46", "pos: [0.68, 0.5, 1.53], look: [0.06, 0.36, 0.13], fov: 46")
rep("pos: [0.3, 0.46, 1.45], look: [0.1, 0.18, 0.0], fov: 38, path", "pos: [0.3, 0.46, 1.45], look: [-0.05, 0.18, 0.03], fov: 38, path")
rep("if (S.id === 'step1' || S.id === 'steps' || S.id === 'around' || S.id === 'toss')", "if (S.id === 'step1' || S.id === 'steps' || S.id === 'away' || S.id === 'backWalk' || S.id === 'retWalk' || S.id === 'around' || S.id === 'toss')")
rep("  if (S.id === 'back') badge(T.fxCheck", "  if (S.id === 'step1') bubble('c1', '1 step', '', '#ffffff', w.take - 2, w.reward1 - 6, BUB_CNT, 0.2);\n  if (S.id === 'steps') { bubble('c2', '2 steps', '', '#ffffff', w.two - 4, w.five - 4, BUB_CNT, 0.2); bubble('c5', '5 steps', '', '#ffffff', w.five - 2, w.always, BUB_CNT, 0.2); }\n  if (S.id === 'back') badge(T.fxCheck")
rep("BUB_CUE = [0.2, 0.42, -0.02],", "BUB_CNT = [0.22, 0.6, -0.02], BUB_CUE = [0.2, 0.42, -0.02],")
open('web/story.js', 'w', encoding='utf8').write(s)
