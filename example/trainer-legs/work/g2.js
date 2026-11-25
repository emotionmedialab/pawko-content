const d = window.dbg; window.renderFrame(240); const r = (v) => v.toArray().map((x) => +x.toFixed(3));
const o = { head: r(d.dog.boneWorld('head')), nose: r(d.dog.noseWorld()), top: r(d.dog.boneWorld('top')), root: r(d.dog.boneWorld('root')), n1: r(d.dog.boneWorld('n1')) };
for (const k of ['L', 'R']) o[k] = { hip: r(d.legs.info[k].hip), knee: r(d.legs.info[k].knee), ankle: r(d.legs.info[k].ankle) };
return o;
