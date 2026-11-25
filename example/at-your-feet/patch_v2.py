import json, re, subprocess
ws = json.load(open('work/words.json'))
err = subprocess.run(["ffmpeg", "-i", "voice-hook.mp3", "-af", "silencedetect=n=-38dB:d=0.25", "-f", "null", "-"], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]; en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
for a, b in zip(st, en):
    for w in ws:
        if a < w['s'] < b: w['s'] = round(b, 3); w['e'] = max(w['e'], round(b + 0.12, 3))
json.dump(ws, open('web/words.json', 'w'))
p = 'web/story.js'; s = open(p).read()
s = s.replace("const frame = (f) => {", "const oldFrame = (f) => {", 1)
s = s.replace("export async function build({ THREE, scene, renderer, toon, dog, loadGltf, ndSkin, grad }) {", "const D = 47, HK = 232;   // new hook line = 232 frames; everything after is the v1 timeline shifted by D\nexport async function build({ THREE, scene, renderer, toon, dog, loadGltf, ndSkin, grad }) {", 1)
s = s.replace("hi: ['job',", "hi: ['dangerous', 'pack', 'job',", 1)
s = s.replace("cap.pop({", "P({").replace("cap.title({", "T({")
s = s.replace("  P({ text: 'Zzz', a: 462", "  const P = (o) => cap.pop({ ...o, a: o.a + D, b: o.b + D }), T = (o) => cap.title({ ...o, a: o.a + D, b: o.b + D });\n  P({ text: 'Zzz', a: 462", 1)
assert "const P =" in s

def rep_shot(id_, new):
    global s
    m = re.search(r"    \{ id: '" + re.escape(id_) + r"'[^\n]*\n", s); assert m, id_
    s = s[:m.start()] + new + s[m.end():]

faceCam = """  const faceCam = (off, d0, d1, h, fov, a, b) => (f) => { const hd = dog.headWorld(), yaw = dog.root.rotation.y + off, d = lerp(d0, d1, ramp(f, a, b)); return { pos: [hd.x + Math.sin(yaw) * d, hd.y + h, hd.z + Math.cos(yaw) * d], look: [hd.x, hd.y - 0.02, hd.z], fov }; };
"""
s = s.replace("  // ---------- shots ----------", faceCam + "  // ---------- shots ----------", 1)
rep_shot('7-lies-at-feet-door', """    { id: '7a-medium-profile', a: 904, b: 975, k: 'room', cam: glide(904, 975, C([0.9, 1.4, 3.4], [-0.3, 0.75, 0.2], 44), C([0.7, 1.3, 3.2], [-0.3, 0.8, 0.25], 42)) },
    { id: '7b-face-closer', a: 976, b: 1020, k: 'room', cam: faceCam(0.7, 1.3, 1.1, 0.12, 34, 976, 1020) },
    { id: '7c-face-door', a: 1021, b: 1065, k: 'room', cam: faceCam(-0.6, 1.0, 0.85, 0.1, 32, 1021, 1065) },
""")
rep_shot('8-head-up-creak', """    { id: '8a-wide-door-creak', a: 1066, b: 1087, k: 'room', cam: glide(1066, 1087, C([-0.2, 1.1, 2.9], [-0.3, 1.0, 0.2], 58), C([-0.2, 1.05, 2.7], [-0.3, 1.0, 0.2], 58)) },
    { id: '8b-head-lift-close', a: 1088, b: 1137, k: 'room', cam: faceCam(0.5, 1.05, 0.9, 0.1, 34, 1088, 1137) },
    { id: '8c-wide-vroom', a: 1138, b: 1178, k: 'room', cam: glide(1138, 1178, C([0.5, 1.1, 2.8], [-0.3, 1.0, 0.1], 56), C([0.4, 1.05, 2.6], [-0.3, 1.0, 0.1], 56)) },
""")
rep_shot('9-breathing-calm', """    { id: '9a-owner-breathing', a: 1179, b: 1240, k: 'room', cam: glide(1179, 1240, C([1.4, 1.25, -0.5], [-0.1, 0.75, -0.5], 36), C([1.2, 1.2, -0.5], [-0.1, 0.75, -0.5], 36)) },
    { id: '9b-puppy-resting', a: 1241, b: 1313, k: 'room', cam: faceCam(0.8, 1.0, 0.85, 0.15, 34, 1241, 1313) },
""")
hook = open('hook_part.js').read()
s = s.replace("  return { TOTAL: 1663, frame, shotAt, after: (f) => cap.render(f) };", hook + "  return { TOTAL: 1710, frame, shotAt: shotAtNew, after: (f) => cap.render(f) };", 1)
open(p, 'w').write(s)
