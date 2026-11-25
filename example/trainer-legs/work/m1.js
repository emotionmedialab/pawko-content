const r = window.REF, d = window.dbg;
const o = {};
d.dog.root.position.set(0,0,0); d.dog.root.rotation.set(0,Math.PI/2,0);
for (const k of ['stand','sit']) { d.dog.pose({ w: { [k]: 1 }, look: null }); const B = (n) => d.dog.boneWorld(n).toArray().map(x=>+x.toFixed(3)); o[k] = { root: B('root'), top: B('top'), head: B('head'), nose: d.dog.noseWorld().toArray().map(x=>+x.toFixed(3)), flB: B('flB'), frB: B('frB'), hlB: B('hlB'), hrB: B('hrB'), flS: B('flS'), frS: B('frS'), hlH: B('hlH'), hrH: B('hrH') }; }
return o;
