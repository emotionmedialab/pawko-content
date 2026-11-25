// Harness + leash prop for the 3D puppy (reusable: copy this file into other leash-walking projects).
//   const L = makeLeash(THREE, scene, dog, { toon });          // call right after makeDog(), before the dog is moved
//   after dog.pose(...) each frame:  dog.root.updateMatrixWorld(true);
//   L.update({ hand: [x,y,z] | null, slack: 0..1, col: '#3a7ec0', floorY: 0, f })
// The harness is parented to the spine bone (sp4), so it follows sit / walk / turn poses.
// The leash runs from the harness back ring to `hand` as a curve. slack 1 = soft J sagging toward the floor, slack 0 = straight line.
export const makeLeash = (THREE, scene, dog, { toon, strap = '#f0a030', metal = '#d9dde2' } = {}) => {
  dog.pose({ w: { stand: 1 } }); dog.root.updateMatrixWorld(true);
  const bone = dog.bones.sp4, bq = bone.getWorldQuaternion(new THREE.Quaternion()), bs = bone.getWorldScale(new THREE.Vector3()).x;
  const origin = bone.getWorldPosition(new THREE.Vector3());
  const G = new THREE.Group(); bone.add(G);       // G's axes = dog space at the stand pose, units = metres, origin = sp4
  G.quaternion.copy(bq).invert().multiply(dog.body.getWorldQuaternion(new THREE.Quaternion())); G.scale.setScalar(1 / bs);
  const mStrap = toon({ color: strap }), mMetal = toon({ color: metal });
  const at = (x, y, z) => [x - origin.x, y - origin.y, z - origin.z];      // stand-pose dog-space point -> G local
  const mesh = (geo, mat, p) => { const m = new THREE.Mesh(geo, mat); m.position.set(...at(...p)); m.castShadow = true; G.add(m); return m; };
  // two flat webbing bands (girth just behind the front legs, chest band in front of it), joined by a flat back strap with the leash ring
  const band = (z, cy, rx, ry, wd) => {
    const g = new THREE.CylinderGeometry(1, 1, wd, 48, 1, true); g.rotateX(Math.PI / 2);
    const m = mesh(g, mStrap, [0, cy, z]); m.scale.set(rx, ry, 1); m.material.side = THREE.DoubleSide; return m;
  };
  band(0.085, 0.276, 0.088, 0.108, 0.05); band(0.152, 0.283, 0.093, 0.148, 0.04);
  const backStrap = mesh(new THREE.BoxGeometry(0.036, 0.008, 0.125), mStrap, [0, 0.392, 0.12]);
  const ring = mesh(new THREE.TorusGeometry(0.02, 0.005, 8, 24), mMetal, [0, 0.412, 0.1]); ring.rotation.y = Math.PI / 2;

  // ---- the leash ----
  const mLeash = toon({ color: '#3a7ec0' });
  const rope = new THREE.Mesh(new THREE.BufferGeometry(), mLeash); rope.castShadow = true; rope.frustumCulled = false; scene.add(rope);
  const R = new THREE.Vector3(), H = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), c = new THREE.Vector3(), v = new THREE.Vector3(), P = new THREE.Vector3();
  const ringWorld = () => ring.getWorldPosition(new THREE.Vector3());
  const update = ({ hand, slack = 1, col = '#3a7ec0', floorY = 0, f = 0, rad = 0.011 } = {}) => {
    rope.visible = !!hand; if (!hand) return;
    mLeash.color.set(col);
    ring.getWorldPosition(R); H.set(...hand);
    const d = R.distanceTo(H), s = Math.max(0.015, slack), N = 44, pts = [];
    A.copy(dog.boneWorld('root')); B.copy(dog.boneWorld('top')); const HD = dog.boneWorld('head');
    const side = new THREE.Vector3(H.z - R.z, 0, -(H.x - R.x)).normalize();       // horizontal, perpendicular to the leash
    for (let i = 0; i <= N; i++) {
      const t = i / N, g = Math.sin(Math.PI * Math.pow(t, 0.75));                  // sag is deepest near the dog: a J
      P.lerpVectors(R, H, t); P.y -= s * (0.06 + 0.5 * d) * g; P.addScaledVector(side, 0.05 * s * g * Math.sin(f * 0.035 + t * 3));
      const hh = P.y - floorY - rad; P.y = floorY + rad + 0.5 * (hh + Math.sqrt(hh * hh + 0.0004));   // smooth floor clamp
      // keep the rope outside the body: push out of an ellipsoidal capsule around root -> top (over the back / down the side)
      const e = B.clone().sub(A), u = Math.max(0, Math.min(1, v.copy(P).sub(A).dot(e) / e.lengthSq()));
      c.copy(A).addScaledVector(e, u); v.copy(P).sub(c);
      const hx = Math.hypot(v.x, v.z) / 0.1, hy = v.y / 0.1, n = Math.hypot(hx, hy);
      if (n < 1.06) { if (n < 1e-4) v.set(0, 0.11, 0); else v.multiplyScalar(1.06 / n); P.copy(c).add(v); }
      v.copy(P).sub(HD); if (v.length() < 0.12) P.copy(HD).addScaledVector(v.normalize(), 0.12);   // never through the head
      if (s < 0.2) P.addScaledVector(side, 0.004 * Math.sin(f * 1.9 + t * 11)).y += 0.003 * Math.sin(f * 2.3 + t * 7) * g;   // taut leash trembles
      pts.push(P.clone());
    }
    rope.geometry.dispose(); rope.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, rad, 8, false);
  };
  return { G, ring, rope, update, ringWorld };
};
