
  // ---------- new hook (5 cuts, frames 0..HK-1) ----------
  const HOOK = [{ id: 'h1-wide-blanket', a: 0, b: 19 }, { id: 'h2-side-hop', a: 20, b: 55 }, { id: 'h3-overhead', a: 56, b: 91 }, { id: 'h4-face-closeup', a: 92, b: 128 }, { id: 'h5-low-pushin-door', a: 129, b: HK - 1 }];
  const hookShot = (F) => HOOK.find((h) => F >= h.a && F <= h.b);
  const hookCam = (F) => {
    const id = hookShot(F).id;
    if (id === 'h1-wide-blanket') return glide(0, 19, C([1.0, 2.2, 3.0], [-0.15, 0.7, 0.05], 42), C([0.9, 2.15, 2.9], [-0.15, 0.7, 0.05], 42))(F);
    if (id === 'h2-side-hop') return glide(20, 55, C([2.1, 0.85, 1.6], [0.0, 0.7, 0.95], 46), C([1.9, 0.85, 1.4], [0.0, 0.7, 0.8], 46))(F);
    if (id === 'h3-overhead') return glide(56, 91, C([0.0, 3.0, 1.25], [0.0, 0.55, 0.45], 40), C([0.05, 2.8, 1.15], [0.0, 0.55, 0.45], 40))(F);
    if (id === 'h4-face-closeup') return faceCam(0.15, 1.15, 0.95, 0.05, 32, 92, 128)(F);
    return glide(129, HK - 1, C([-0.05, 0.85, 2.7], [-0.15, 0.85, 0.5], 40), C([-0.1, 0.9, 1.9], [-0.2, 0.92, 0.5], 34))(F);
  };
  const back = (t) => { t = clamp(t) - 1; return t * t * (2.7 * t + 1.7) + 1; };
  const shield = new THREE.Group();
  {
    const pts = [[-0.4, 0.45], [0.4, 0.45], [0.4, 0.05], [0, -0.5], [-0.4, 0.05]];
    const mk = (k, col, z) => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x * k, y * k) : sh.moveTo(x * k, y * k))); sh.closePath(); const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, fog: false })); m.position.z = z; m.userData.ndSkip = true; shield.add(m); };
    mk(1.18, '#1a1226', 0); mk(1.0, '#ffffff', 0.004); mk(0.82, '#3b6fe0', 0.008);
    for (const [w, h, x, y, r] of [[0.1, 0.34, -0.1, -0.02, 0.8], [0.1, 0.5, 0.08, 0.04, -0.7]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.DoubleSide, fog: false })); m.position.set(x, y, 0.012); m.rotation.z = r; m.userData.ndSkip = true; shield.add(m); }
  }
  shield.visible = false; scene.add(shield);
  const hookFrame = (F) => {
    room.root.visible = owner.root.visible = true; forest.root.visible = false; scene.fog = null; sweep.visible = false;
    owner.M.skin.emissive.set('#4a3a3a'); lightDog(true);
    const pull = ramp(F, 0, 30), cover = lerp(-0.05, -0.5, pull), args = { w: { sleep: 1 }, breath: breathe(F), blink: F < 30 ? 0.15 : 1, smile: 0.3 };
    if (pull > 0 && pull < 1) {
      owner.pose({ ...args, blink: 1 }); room.set({ light: 'night', lamp: 1, cover, caps: owner.capsules() }); const pts = room.pts(), H = owner.info;
      owner.pose({ ...args, ik: { L: H.L.H.clone().lerp(pts.edge(1), pull), R: H.R.H.clone().lerp(pts.edge(-1), pull) } });
    } else owner.pose(args);
    room.set({ light: 'night', lamp: 1, cover, clock: '23:00', colon: true, caps: owner.capsules() });
    const base = { breath: breathe(F + 9), blink: blinkAt(F + 20), wag: 0, ears: 0.2 }, id = hookShot(F).id, camp = V(1.0, 1.0, 1.6);
    dog.root.visible = F >= 20;
    const ahead = () => dog.root.localToWorld(V(0.05, 0.12, 0.7));
    if (id === 'h2-side-hop') {
      const t = ramp(F, 22, 46);
      placeOn(0.0, 0.55, 0.9); const top = dog.root.position.y;
      const y = top * sm(clamp((t - 0.1) / 0.5)) + 0.3 * Math.sin(Math.PI * clamp((t - 0.1) / 0.6));
      dog.root.position.set(0, y, lerp(1.6, 0.55, t)); dog.root.rotation.set(0, lerp(Math.PI, 0.9, ramp(F, 40, 56)), 0); dog.root.updateMatrixWorld(true);
      const d = ramp(F, 44, 54);
      dog.pose({ ...base, w: { stand: 1 - d, down: d }, gait: F < 48 ? { phase: F * 0.12, amp: 24, lift: 1, k: 1 } : null, look: camp, neck: 0.8, aimEyes: true, tail: 0.2, wag: Math.sin(F * 0.5) * 0.6 });
    } else if (id === 'h3-overhead') {
      placeOn(0.0, 0.55, 0.9); dog.pose({ ...base, w: { down: 1 }, look: ahead(), neck: 0.8, aimEyes: true, ears: 0.2 + (F % 40 > 34 ? -0.5 : 0) });
    } else if (id === 'h4-face-closeup') {
      placeOn(0.0, 0.55, 0.9); dog.pose({ ...base, w: { down: 1 }, look: camp, neck: 0.9, aimEyes: true, ears: -0.6, blink: F % 50 > 46 ? 1 : 0 });
    } else if (id === 'h5-low-pushin-door') {
      const up = ramp(F, 148, 178);
      placeOn(0.0, 0.55, -1.55);
      dog.pose({ ...base, w: { down: 1 }, look: ahead().lerp(doorPt, 0.55 * up).add(V(0, 0.3 * up, 0)), neck: 0.6, aimEyes: true, ears: lerp(0.1, -0.6, up) + (F % 70 > 64 ? 0.5 : 0) });
    }
    const C0 = hookCam(F);
    // shield icon beside (left of) his head on "dangerous", popping in with overshoot
    const sc = F >= 153 && F < 212 ? Math.max(0.01, back((F - 153) / 8) * clamp((212 - F) / 8)) * 0.3 : 0;
    shield.visible = sc > 0.02 && id === 'h5-low-pushin-door';
    if (shield.visible) {
      const hd = dog.headWorld(), pos = V(...C0.pos), look = V(...C0.look), right = look.clone().sub(pos).cross(V(0, 1, 0)).normalize();
      shield.position.copy(hd).addScaledVector(right, -0.4).add(V(0, 0.16, 0)); shield.scale.setScalar(sc); shield.lookAt(pos);
    }
    return { ...C0, vig: 0.22 };
  };
  const frame = (F) => { if (F < HK) return hookFrame(F); shield.visible = false; return oldFrame(F - D); };
  const shotAtNew = (F) => (F < HK ? hookShot(F) : shotAt(F - D));
