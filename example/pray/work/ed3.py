p='web/story.js'; s=open(p).read()
def R(a,b):
    global s
    assert a in s,a; s=s.replace(a,b)
R("ly = 0.3, lx = 0.22, k = 1.3","ly = 0.5, lx = 0.25, k = 1.5")
R("look: [0.07, 0.3, 0.0], fov: 55 }","look: [0.07, 0.5, 0.0], fov: 55 }")
R("look: [0.07, 0.32, 0.0]","look: [0.07, 0.52, 0.0]")
R("KF(f, [[w.hold, START], [w.low + 8, LV()], [w.under + 3, LOW]])","KF(f, [[w.hold, START], [w.low + 8, LOW], [w.under + 3, LOW]])")
R("[[w.say1, START], [w.say1 + 14, LV()], [w.head2 - 4, LOW], [w.down, LOW2]]","[[w.say1, START], [w.say1 + 14, LOW], [w.head2 - 4, LOW], [w.down, LOW2]]")
R("[[w.a, LV()], [w.plenty, LOW], [w.plenty + 14, LOW2]]","[[w.a, LOW], [w.plenty, LOW], [w.plenty + 14, LOW2]]")
open(p,'w').write(s)
