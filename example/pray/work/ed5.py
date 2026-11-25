p='web/story.js'; s=open(p).read()
def R(a,b):
    global s
    assert a in s,a; s=s.replace(a,b)
R("pos: [0, MAT + 0.05 * Math.sin(Math.PI * p), 0], look: lookT(b),","look: lookT(b),")
R("const base = { bow: 10, pos: DOGPOS,","const base = { bow: 10, pos: [0, MAT + 0.05 * Math.sin(Math.PI * PU(f)), 0],")   # lift mid-blend so the tucked hind feet never poke through the mat (loose brown slivers)
R("pos: [px, MAT + hop, 0]","pos: [px, MAT + hop + 0.05 * (Math.sin(Math.PI * up) + Math.sin(Math.PI * sit2)), 0]")
R("add(tc, [0.14, -0.07, 0.08])","add(tc, [0.2, -0.08, 0.12])")
open(p,'w').write(s)
