p='web/story.js'; s=open(p).read()
def R(a,b):
    global s
    assert a in s, a[:60]; s=s.replace(a,b,1)
R("{ id: 'h5-low-pushin-door', a: 129, b: HK - 1 }","{ id: 'h5a-low-pushin', a: 129, b: 192 }, { id: 'h5b-medium-door', a: 193, b: HK - 1 }")
R("if (id === 'h2-side-hop') return glide(20, 55, C([2.1, 0.85, 1.6], [0.0, 0.7, 0.95], 46), C([1.9, 0.85, 1.4], [0.0, 0.7, 0.8], 46))(F);","if (id === 'h2-side-hop') return glide(20, 55, C([1.5, 1.4, 2.7], [0.0, 0.65, 0.7], 40), C([1.3, 1.35, 2.5], [0.0, 0.65, 0.6], 40))(F);")
R("if (id === 'h3-overhead') return glide(56, 91, C([0.0, 3.0, 1.25], [0.0, 0.55, 0.45], 40), C([0.05, 2.8, 1.15], [0.0, 0.55, 0.45], 40))(F);","if (id === 'h3-overhead') return glide(56, 91, C([0.9, 2.0, 2.4], [0.0, 0.6, 0.3], 38), C([0.8, 1.9, 2.2], [0.0, 0.6, 0.3], 38))(F);\n    if (id === 'h5b-medium-door') return glide(193, HK - 1, C([0.7, 1.3, 3.1], [-0.3, 0.8, 0.3], 42), C([0.5, 1.2, 2.8], [-0.3, 0.85, 0.3], 42))(F);")
R("id: 'h2-side-hop'","id: 'h2-side-hop'") if False else None
# h2 dog: step onto the duvet, no flight
a=s.index("    if (id === 'h2-side-hop') {"); b=s.index("    } else if (id === 'h3-overhead') {")
s=s[:a]+"""    if (id === 'h2-side-hop') {
      const t = ramp(F, 22, 46), z = lerp(0.98, 0.55, t);
      placeOn(0.0, z, lerp(Math.PI, 0.9, ramp(F, 38, 56))); dog.root.position.y += 0.07 * Math.sin(Math.PI * clamp((F - 20) / 7));   // short step-up hop, paws down within 7 frames
      dog.root.updateMatrixWorld(true);
      const d = ramp(F, 44, 54);
      dog.pose({ ...base, w: { stand: 1 - d, down: d }, gait: F < 48 ? { phase: F * 0.12, amp: 24, lift: 1, k: 1 } : null, look: camp, neck: 0.8, aimEyes: true, tail: 0.2, wag: Math.sin(F * 0.5) * 0.6 });
"""+s[b:]
R("else if (id === 'h5-low-pushin-door') {","else if (id === 'h5a-low-pushin' || id === 'h5b-medium-door') {")
R("shield.visible = sc > 0.02 && id === 'h5-low-pushin-door';","shield.visible = sc > 0.02 && id === 'h5a-low-pushin';")
R("C([1.6, 1.6, -0.2], [-0.1, 0.7, -0.85], 40), C([1.4, 1.5, -0.2], [-0.1, 0.7, -0.85], 40)","C([0.9, 1.7, 0.9], [-0.1, 0.85, -0.8], 30), C([0.8, 1.65, 0.8], [-0.1, 0.85, -0.8], 30)")
open(p,'w').write(s)
