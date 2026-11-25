p='web/story.js'; s=open(p).read()
s=s.replace("const HOOKP = [-0.12, MAT, -0.48]","const HOOKP = [-0.12, MAT, -0.34]")
old=s[s.index("const ELB ="):s.index("const CAMS")]
new='''const ELB = (a, b, ly = 0.2, lx = 0.22, k = 1.12) => { const L = [lx, ly, 0.0], P = (p) => [L[0] + (p[0] - L[0]) * k, L[1] + (p[1] - L[1]) * k, L[2] + (p[2] - L[2]) * k]; return [{ f: a, pos: P([1.38, 0.46, 0.74]), look: L, fov: 40 }, { f: b, pos: P([1.32, 0.44, 0.71]), look: [lx + 0.01, ly - 0.02, 0.0], fov: 40 }]; };
'''
s=s.replace(old,new)
open(p,'w').write(s)
