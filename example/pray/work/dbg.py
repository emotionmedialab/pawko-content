s=open('lm.mjs').read()
a=s.index("console.log(JSON.stringify(await pg.evaluate(() => { const r=[]")
b=s.index("for (const f of frames) {")
new='''await pg.evaluate(()=>window.renderFrame(815));
console.log(JSON.stringify(await pg.evaluate(() => { let sm=null; window.__dog.traverse(o=>{if(o.isSkinnedMesh) sm=o;}); sm.updateMatrixWorld(true); sm.skeleton.update(); const v=new sm.position.constructor(); const names=sm.skeleton.bones.map(b=>b.name); const sk=sm.geometry.attributes.skinIndex, sw=sm.geometry.attributes.skinWeight; const res={}; const pts=[]; for(let i=0;i<sm.geometry.attributes.position.count;i++){ sm.getVertexPosition(i,v); v.applyMatrix4(sm.matrixWorld); if(v.y<0.1){ let bi=0,bw=0; for(let k=0;k<4;k++){ if(sw.getComponent(i,k)>bw){bw=sw.getComponent(i,k); bi=sk.getComponent(i,k);} } const n=names[bi]; res[n]=(res[n]||0)+1; if(pts.length<400) pts.push([n,+v.x.toFixed(2),+v.y.toFixed(3),+v.z.toFixed(2)]); } } return {res, pts: pts.filter((p,i)=>i%6==0)}; })));
'''
open('lm2.mjs','w').write(s[:a]+new+s[b:])
