s = open('web/story.js', encoding='utf8').read()
a = s.index('  // ---------- shots ----------'); b = s.index('  const SITP')
s = s[:a] + open('work/shots_block.js', encoding='utf8').read() + s[b:]
R = [
 ("const BED = V(0.55, 0, -1.25), BEDYAW = Math.PI;                // puppy sniffing the flower bed (faces the back fence)",
  "const BED = V(0.55, 0, -1.3), BEDYAW = Math.PI + 0.7;          // puppy sniffing the flower bed (faces back-left along it)"),
 ("const BR = { x0: 1.2, x1: -1.1, z: 1.0 };", "const BR = { x0: 0.5, x1: -0.8, z: 0.6 };"),
 ("const bt = clamp((f - 1006) / 70), bx = lerp(BR.x0, BR.x1, sm(bt)), sweepOn", "const bx = broomX(f), sweepOn"),
 ("  const roomFrame", "  function broomX(f) { return lerp(BR.x0, BR.x1, sm(clamp((f - 1006) / 70))); }\n  const roomFrame"),
 ("owner.pose({ w: { stand: 1 }, at: [1.95, -0.95], face: -1.25,", "owner.pose({ w: { stand: 1 }, at: [1.75, -0.95], face: -1.6,"),
 ("const lk = f < 1163 ? V(0.2, 1.3, 2.6) : V(0.36, 0.85, -0.23);", "const lk = f < 1163 ? V(0.8, 1.3, 1.6) : V(1.12, 0.9, -0.6);"),
 ("owner.root.visible = S.k === 'room' || !!S.own;", "owner.root.visible = !!S.own;"),
 ("look: V(GZ[0], lerp(0, 0.5, up), GZ[1] - 0.1 + 0.6 * up)", "look: V(GZ[0], 0, GZ[1] - 0.1).lerp(V(-0.5, 0.72, 0.74), up), aimEyes: up > 0.5"),
]
for x, y in R:
    assert x in s, x
    s = s.replace(x, y)
open('web/story.js', 'w', encoding='utf8').write(s)
print('ok')
