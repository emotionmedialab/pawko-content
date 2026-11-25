const rot2=([x,y],a,[cx,cy])=>[cx+(x-cx)*Math.cos(a)-(y-cy)*Math.sin(a),cy+(x-cx)*Math.sin(a)+(y-cy)*Math.cos(a)];
const U=2.08, K=0.00225;
for (const [BOB,CS,LEAN,TILT] of [[40,.78,-18,-14],[50,.75,-18,-14],[50,.8,-18,-20],[40,.8,-18,-22],[30,.76,-18,-14],[50,.78,-18,-16]]) {
 const HIP=808+BOB,SHY=HIP-176;
 const e=rot2(rot2([300+6*U-.84*104, SHY-10-98*.78+8*U],TILT*Math.PI/180,[300+8*U,SHY-6]),LEAN*Math.PI/180,[300,HIP]);
 console.log(BOB,CS,LEAN,TILT,'ear design',e.map(Math.round),'worldY',(0.064+(975-e[1])*K*CS).toFixed(2),'x from card centre',((300-e[0])*K*CS).toFixed(2));
}
