s = open('web/story.js', encoding='utf8').read()
def rep(a, b):
    global s
    assert s.count(a) == 1, a
    s = s.replace(a, b)
# calm: pull back ~20% and re-target toward the tail
rep("{ f: w.itwas, pos: [1.25, 0.42, 0.95], look: [0.14, 0.18, 0.0], fov: 38 }, { f: w.every - 1, pos: [0.3, 0.46, 1.45], look: [0.03, 0.18, 0.01], fov: 38, path: [[0.85, 0.44, 1.3]] }",
    "{ f: w.itwas, pos: [1.47, 0.47, 1.14], look: [0.12, 0.18, 0.0], fov: 38 }, { f: w.every - 1, pos: [0.36, 0.52, 1.74], look: [-0.02, 0.18, 0.01], fov: 38, path: [[1.0, 0.49, 1.57]] }")
# toss: a visible bone arcs in from the right, lands ~0.5 m in front, the puppy steps to it, dips its head and eats it
rep("const FLY = { a: w.toss - 3, land: w.treat + 4 };", "const FLY = { a: 741, land: 751, eat: 778 }, LAND = [0.62, MAT + 0.03, 0.05];")
rep("""      if (f < FLY.a) return null;
      const u = clamp((f - FLY.a) / (FLY.land - FLY.a), 0, 1), A = [0.95, 0.7, -0.3], B = CATCH();
      return [lerp(A[0], B[0], u), lerp(A[1], B[1], u) + 0.4 * 4 * u * (1 - u), lerp(A[2], B[2], u)];""",
"""      if (f < FLY.a) return null;
      const u = clamp((f - FLY.a) / (FLY.land - FLY.a), 0, 1), A = [1.3, 0.7, -0.9];
      return [lerp(A[0], LAND[0], u), lerp(A[1], LAND[1], u) + 0.45 * 4 * u * (1 - u), lerp(A[2], LAND[2], u)];""")
rep("(S.id === 'toss' && f >= FLY.land)) W.treatHide = true;", "(S.id === 'toss' && f >= FLY.eat)) W.treatHide = true;\n  if (S.id === 'toss') W.treatS = 2.2;")
i = s.index("    case 'toss': {"); j = s.index("    case 'mistake2': {")
s = s[:i] + """    case 'toss': {
      const up = sm(ramp(f, w.okay + 2, w.okay + 28)), walk = sm(ramp(f, FLY.land + 6, FLY.eat - 4)), ch = chompAt(f, FLY.eat), dip = sm(ramp(f, FLY.land + 4, FLY.eat - 6));
      const tr = f >= FLY.a && !W.treatHide && W.treat ? W.treat : null;
      return { ...base, w: { sit: 1 - up, stand: up }, look: tr ? [tr[0], tr[1], tr[2]] : [0.9, 0.3, 0.4], neck: 0.6 + 0.4 * dip, ears: -0.4 * up, tail: 0.4 * up, wag: up > 0.3 ? Math.sin(f * 0.8) * 0.9 : 0.2 * Math.sin(f * 0.25),
        pos: add(lerp3(DOGPOS, [0.03, MAT, 0], up), [0.19 * walk, 0.006 * Math.abs(Math.sin(f * 0.6)) * walk * (1 - sm(ramp(f, FLY.eat - 4, FLY.eat))), 0]), jaw: f >= FLY.eat + 14 ? 0.3 : ch, blink: f > FLY.eat && f < FLY.eat + 6 ? 1 : base.blink };
    }
""" + s[j:]
rep("hearts(FLY.land + 2, add(NOSE('stand'), [-0.08, 0.06, 0]));", "hearts(FLY.eat + 2, add(NOSE('stand'), [0.1, 0.06, 0]));")
open('web/story.js', 'w', encoding='utf8').write(s)

a = open('audio.py', encoding='utf8').read()
a = a.replace('w["land"] = w["treat"] + 4', 'w["fa"] = 741; w["land"] = 751; w["eat"] = 778')
old = a[a.index('place(sfx, whoosh(0.4, 1400), F(w["toss"] - 4)'):]
old = old[:old.index('\n')]
a = a.replace(old, 'place(sfx, whoosh(0.4, 1400), F(w["fa"]), 0.3); place(sfx, thunk(160, 0.12), F(w["land"]), 0.4); place(sfx, crunch(0.45), F(w["eat"]), 0.55); place(sfx, pop(700, 1300), F(w["eat"] + 3), 0.3)  # toss, lands, eaten')
open('audio.py', 'w', encoding='utf8').write(a)
