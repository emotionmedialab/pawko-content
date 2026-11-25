const d = window.dbg; const o = [];
for (const f of [250, 266, 270]) { const D = d.dog3At(f); window.renderFrame(f); const p = d.legsAt(f); const paw = d.dog.boneWorld('flB'); const sp = d.legs.shoeTop('R');
 o.push({ f, L: D.P.paws.L.flS[0].toFixed(1)+','+D.P.paws.L.flE[0].toFixed(1), R: D.P.paws.R.flS[0].toFixed(1)+','+D.P.paws.R.flE[0].toFixed(1), pawY: +paw.y.toFixed(3), shoeY: +sp.y.toFixed(3), lift: +p.R.lift.toFixed(3), pitch: +p.R.pitch.toFixed(2), pawX: +paw.x.toFixed(3), shoeX: +sp.x.toFixed(3), rootY: D.pos[1] }); }
return o;
