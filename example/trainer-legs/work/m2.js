const d = window.dbg; const out = [];
d.dog.root.position.set(0,0,0); d.dog.root.rotation.set(0,Math.PI/2,0);
const B = (n) => d.dog.boneWorld(n).toArray();
for (const p of [0, 10, 16]) for (const fs of [0, -25, -50]) for (const fe of [0, -30, 30]) {
  const P = { paws: { drop: 0, dropF: 0, pitch: p, L: { flS: [fs,0,0], flE: [fe,0,0], flW: [0,0,0] } } };
  d.dog.pose({ w: { paws: 1 }, P, look: null });
  const a = B('flB'), h = B('hlB'), t = B('top'), hd = B('head'), n = d.dog.noseWorld().toArray();
  out.push([p, fs, fe, 'flB', +(a[0]).toFixed(3), +a[1].toFixed(3), 'hlB', +h[0].toFixed(3), +h[1].toFixed(3), 'top', +t[1].toFixed(3), 'head', +hd[0].toFixed(3), +hd[1].toFixed(3)].join(' '));
}
return out;
