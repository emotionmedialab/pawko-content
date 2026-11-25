const d = window.dbg; d.dog.root.position.set(0,0,0); d.dog.root.rotation.set(0,Math.PI/2,0);
const rows = [];
for (const s of [-40,-12,16]) for (const e of [-40,0,40]) { d.dog.pose({ w:{paws:1}, P:{paws:{drop:0,dropF:0,pitch:10,L:{flS:[s,0,0],flE:[e,0,0],flW:[0,0,0]}}}, look:null }); const p = d.dog.boneWorld('flB'); rows.push([s,e,+p.x.toFixed(3),+p.y.toFixed(3)].join(',')); }
return rows;
