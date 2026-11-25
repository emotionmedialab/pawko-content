import sys
Y = sys.argv[1]
p='web/story.js'; s=open(p).read()
def R(a,b):
    global s
    assert a in s, a[:60]; s=s.replace(a,b,1)
R("place(x, z, lerp(Math.PI, 0.3, turn), hop);","place(x, z, lerp(Math.PI, SITYAW, turn), hop);")
R("wag: Math.sin(f * 0.5) * 0.7, tail: 0.3, ears: -0.3 });","wag: ramp(f, 1394, 1400) * (1 - ramp(f, 1528, 1548)) * Math.sin((f - 1394) * 0.75) * 0.62, tail: 0.3, ears: -0.3 });")   # fast wag from the word \"tail\" (old frame 1394), eased out by the end of the hug
R("c.clone().add(V(0.11, -0.04, -0.04)), R: c.clone().add(V(-0.11, -0.04, -0.04))","c.clone().add(V(0.11 * Math.cos(SITYAW), -0.04, -0.04 - 0.11 * Math.sin(SITYAW))), R: c.clone().add(V(-0.11 * Math.cos(SITYAW), -0.04, -0.04 + 0.11 * Math.sin(SITYAW)))")
R("const D = 47, HK = 232;","const D = 47, HK = 232, SITYAW = %s;" % Y)
open(p,'w').write(s)
