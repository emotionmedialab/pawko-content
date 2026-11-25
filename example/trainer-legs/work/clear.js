// min clearance between puppy bone spheres and leg tubes, per shot. args via window.ARGS? (hard-coded ranges)
const d = window.dbg, T = d.THREE;
const R = { root: .1, sp1: .1, sp2: .1, sp3: .1, sp4: .1, top: .1, n1: .07, n2: .06, head: .06, jaw: .03, flS: .05, frS: .05, flE: .04, frE: .04, flW: .03, frW: .03, flB: .025, frB: .025, hlH: .06, hrH: .06, hlK: .04, hrK: .04, hlA: .03, hrA: .03, hlB: .025, hrB: .025 };
const segd = (p, a, b) => { const ab = b.clone().sub(a), t = Math.max(0, Math.min(1, p.clone().sub(a).dot(ab) / ab.lengthSq())); return p.distanceTo(a.clone().addScaledVector(ab, t)); };
const out = {};
const ranges = { weave: [0, 107], peek: [108, 215], footsies: [216, 323] };
for (const [name, [a, b]] of Object.entries(ranges)) {
  let worst = { c: 9 }, topMin = 9, tops = 9, slide = 0, prev = null, pawGap = [];
  for (let f = a; f <= b; f++) {
    window.renderFrame(f);
    const segs = d.legs.segments(), pts = Object.keys(R).map((k) => [k, d.dog.boneWorld(k)]); pts.push(['nose', d.dog.noseWorld(), 0.03]);
    // also body-surface samples: the torso between root and top
    for (const [k, p, r] of pts) { const rr = r ?? R[k]; for (const [i, s] of segs.entries()) { const c = segd(p, s[0], s[1]) - s[2] - rr; if (c < worst.c) worst = { c: +c.toFixed(3), f, bone: k, seg: i }; } }
    // top of legs projected: NDC y of the trunk top (must be > 1)
    const tp = d.legs.tops()[0].clone().project(d.camera); topMin = Math.min(topMin, tp.y);
    // planted-foot slide: ankle xz change between frames when lift==0 both frames
    const pl = d.legsAt(f), cur = { L: d.legs.info.L.ankle.clone(), R: d.legs.info.R.ankle.clone() };
    if (prev) for (const k of ['L', 'R']) if (!pl[k].lift && !prev.pl[k].lift) slide = Math.max(slide, Math.hypot(cur[k].x - prev.c[k].x, cur[k].z - prev.c[k].z));
    prev = { pl, c: cur };
    if (name === 'footsies' && f % 6 === 0) { for (const [dk, sk] of [['flB', 'R'], ['frB', 'L']]) { const sp = d.legs.shoeTop(sk), p = d.dog.boneWorld(dk); pawGap.push([f, dk, +(p.y - sp.y).toFixed(3), +Math.hypot(p.x - sp.x, p.z - sp.z).toFixed(3)]); } }
  }
  out[name] = { minClear: worst, trunkTopNdcMin: +topMin.toFixed(2), maxPlantedSlide_mm: +(slide * 1000).toFixed(2), pawGap: pawGap.length ? pawGap : undefined };
}
return out;
