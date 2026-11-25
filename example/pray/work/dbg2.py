s=open('lm.mjs').read()
a=s.index("console.log(JSON.stringify(await pg.evaluate(() => { const r=[]")
b=s.index("for (const f of frames) {")
new='''const out=[]; for (let f=0; f<984; f+=3){ out.push(await pg.evaluate((f)=>{window.renderFrame(f); let sm=null; window.__dog.traverse(o=>{if(o.isSkinnedMesh) sm=o;}); sm.updateMatrixWorld(true); sm.skeleton.update(); const v=new sm.position.constructor(); let mn=9, n=0; for(let i=0;i<sm.geometry.attributes.position.count;i++){ sm.getVertexPosition(i,v); v.applyMatrix4(sm.matrixWorld); if(v.y<mn) mn=v.y; if(v.y<0.058) n++; } return [f,+mn.toFixed(3),n]; },f)); }
console.log(JSON.stringify(out.filter(o=>o[1]<0.058)));
'''
open('lm3.mjs','w').write(s[:a]+new+s[b:])
