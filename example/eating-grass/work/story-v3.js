// "Why dogs eat grass" reel (54.32 s, 1630 frames). Every frame is a pure function of f. Same show as At Your Feet: redo-parts yard / day forest / living room.
// Word frames (work/words.json via transcribe.py; sentence-start words re-dated to silence_end, PLAYBOOK whisper fix -> web/words.json):
// grass 16 | sick 71 | vomit 110 | But 147 | science 150 | checked 157 | not 190 | Researchers 249 | University 272 | California 292 | looked 308
// Almost 349 | 8 354 | 10 373 | plants 402 | grass 433 | favorite 454 | They 488 | 1,500 506 | owners 542 | fewer 567 | 1 582 | 10 594 | sick 621 | eating 640
// Only 690 | 1 700 | 5 715 | threw 725 | So 778 | why 781 | It 829 | wolves 848 | Wolves 882 | grass 894 | theory 939 | gut 988 | broom 1004 | sweeping 1025
// worms 1044 | That 1083 | still 1103 | right 1136 | couch 1149 | Just 1184 | careful 1191 | Grass 1224 | garden 1247 | chemicals 1253 | sick 1288
// some 1316 | plants 1324 | toxic 1339 | And 1381 | suddenly 1388 | desperately 1418 | vomits 1454 | see 1496 | vet 1505 | Does 1536 | tall 1552 | short 1595 | end 1630
import { createOwner } from './owner3d.js';
import { createYard, CHEW } from './yard3d.js';
import { createForest, greyWolf, CLUMP } from './forest3d.js';
import { createLiving } from './living3d.js';
import { createCaptions } from './captions.js';
import { makeDog } from './dogrig.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const ramp = (f, a, b) => sm((f - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const breathe = (f) => 0.5 + 0.5 * Math.sin(f * 0.16);
const blinkAt = (f) => ((f % 70) < 3 ? 1 : 0);
const C = (pos, look, fov) => ({ pos, look, fov });
// camera glide between two {pos,look,fov} over the shot
const glide = (a, b, A, B) => (f) => { const t = ramp(f, a, b); return { pos: L3(A.pos, B.pos, t), look: L3(A.look, B.look, t), fov: lerp(A.fov, B.fov, t) }; };

const w = { grass: 16, sick: 71, vomit: 110, but: 147, science: 150, checked: 157, research: 249, univ: 272, looked: 308, almost: 349, eight: 354, plants: 402, grass2: 433, fav: 454,
  they: 488, n1500: 506, owners: 542, fewer: 567, one10: 582, sick2: 621, eating: 640, only: 690, one5: 700, threw: 725, so: 778, why: 781, it: 829, wolves: 848, wolves2: 882,
  theory: 939, gut: 988, broom: 1004, sweeping: 1025, worms: 1044, that: 1083, right: 1136, couch: 1149, just: 1184, careful: 1191, grass3: 1224, garden: 1247, sick3: 1288,
  some: 1316, toxic: 1339, and: 1381, desp: 1418, vomits: 1454, see: 1496, does: 1536, tall: 1552, short: 1595, comment: 1636, paw: 1642, cand: 1671, training: 1713, guide: 1724 };
const TOTAL = 1746;   // v3: + CTA tail (voice_cta.wav). CTA words: Comment 1636 | PAW 1642 | and 1671 | complete 1692 | training 1713 | guide 1724

export async function build({ THREE, scene, renderer, toon, dog, loadGltf, ndSkin, grad }) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const yard = createYard(THREE, scene, { toon }), forest = createForest(THREE, scene, { toon }), room = createLiving(THREE, scene, { toon });
  const owner = createOwner(THREE, scene, { toon }); owner.setOutfit('day'); owner.setCap('day'); owner.setShoes(true);
  // day forest: primitive wolves hidden (as At Your Feet did); grey wolves = the recoloured puppy rig
  forest.pack.forEach((x) => { x.g.visible = false; }); forest.watch.g.visible = false;
  const GZ = [CLUMP.x[1] + 0.05, 0.0];   // grazing point: the right edge of the tall clump (the wolf stands in the short grass beside it, facing -x)
  const wolves = [];
  for (const [x, z, yaw, k] of [[GZ[0] + 0.62, GZ[1], -Math.PI / 2, 1.1], [0.15, -0.35, -0.7, 1.05], [0.75, -1.2, -0.45, 1.0], [-0.45, -0.9, 0.5, 1.0]]) {
    const wf = greyWolf(THREE, makeDog, await loadGltf(), { scale: 2.1 * k, grad, ndSkin, day: true }); forest.root.add(wf.root); wolves.push({ w: wf, x, z, yaw });
  }

  // grass strand held in the mouth (3 thin blades across the jaw, attached to the jaw bone like the rig's tongue)
  const strand = new THREE.Group();
  { const m = toon({ color: '#5fae55' });
    for (const [a, l] of [[0.25, 0.16], [-0.15, 0.14], [0.05, 0.18]]) { const c = new THREE.Mesh(new THREE.ConeGeometry(0.006, l, 4), m); c.rotation.z = Math.PI / 2 + a; c.castShadow = true; strand.add(c); }
    dog.root.position.set(0, 0, 0); dog.root.rotation.set(0, 0, 0); dog.root.updateMatrixWorld(true); dog.pose({ w: { stand: 1 }, jaw: 0.2 });
    const SD = ((location.hash.match(/sd=([-0-9.,]+)/) || [])[1] || '0,0.08,0').split(',').map(Number);   // strand offset from the nose (debug: #sd=x,y,z)
    strand.position.copy(dog.noseWorld()).add(V(...SD)); dog.root.add(strand); dog.bones.jaw.attach(strand); strand.visible = false; }

  // broom + worms for "like a broom, sweeping out worms" (a stylised prop on the forest floor)
  const broom = new THREE.Group(), worms = [];
  { const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.1, 8), toon({ color: '#b07a45' })); stick.position.y = 0.62; stick.rotation.z = 0; broom.add(stick);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 12), toon({ color: '#d84f4f' })); band.position.y = 0.2; broom.add(band);
    const brist = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.16, 0.2, 14), toon({ color: '#f2c14e' })); brist.position.y = 0.09; brist.scale.z = 0.45; broom.add(brist);
    broom.traverse((o) => { if (o.isMesh) o.castShadow = true; }); forest.root.add(broom);
    const wm = toon({ color: '#ff8fa3' });
    for (let i = 0; i < 3; i++) { const g = new THREE.Group(); for (let k = 0; k < 4; k++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), wm); s.castShadow = true; g.add(s); } forest.root.add(g); worms.push(g); } }
  const BR = { x0: 0.5, x1: -0.8, z: 0.95 };   // broom sweeps along x at z = BR.z (right -> left), worms 0.12-0.4 ahead of it

  // flat pop icons (copied from At Your Feet's shield): a green check badge and a yellow warning triangle, placed in camera space
  const flat = (g, pts, k, col, z) => { const sh = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? sh.lineTo(x * k, y * k) : sh.moveTo(x * k, y * k))); sh.closePath();
    const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, fog: false })); m.position.z = z; m.userData.ndSkip = true; g.add(m); return m; };
  const circ = (n, r) => Array.from({ length: n }, (_, i) => [r * Math.cos(i / n * 6.283), r * Math.sin(i / n * 6.283)]);
  const check = new THREE.Group(); flat(check, circ(40, 0.5), 1.16, '#1a1226', 0); flat(check, circ(40, 0.5), 1.0, '#ffffff', 0.004); flat(check, circ(40, 0.5), 0.84, '#3fbf6a', 0.008);
  flat(check, [[-0.26, 0.02], [-0.15, 0.12], [-0.06, 0.02], [0.17, 0.25], [0.28, 0.15], [-0.06, -0.2]], 1, '#ffffff', 0.012);
  const warn = new THREE.Group(); const tri = [[0, 0.5], [0.52, -0.4], [-0.52, -0.4]];
  flat(warn, tri, 1.2, '#1a1226', 0); flat(warn, tri, 1.0, '#ffffff', 0.004); flat(warn, tri, 0.82, '#ffd93b', 0.008);
  flat(warn, [[-0.04, 0.22], [0.04, 0.22], [0.025, -0.1], [-0.025, -0.1]], 1, '#1a1226', 0.012); flat(warn, circ(16, 0.045), 1, '#1a1226', 0.012).position.set(0, -0.2, 0.012);
  const arrow = new THREE.Group(); const arr = [[-0.18, 0.5], [0.18, 0.5], [0.18, 0.05], [0.42, 0.05], [0, -0.5], [-0.42, 0.05], [-0.18, 0.05]];   // v3: down-arrow under COMMENT PAW!
  flat(arrow, arr, 1.18, '#1a1226', 0); flat(arrow, arr, 1.0, '#ffd93b', 0.004);
  for (const g of [check, warn, arrow]) { g.visible = false; scene.add(g); }
  const back = (t) => { t = clamp(t) - 1; return t * t * (2.7 * t + 1.7) + 1; };
  // icon at screen offset (sx, sy) in units of the half-height at distance d, popping in at a (overshoot), out at b
  const icon = (g, C0, f, a, b, sx, sy, size = 0.18, d = 1.0) => {
    const sc = f >= a && f < b ? Math.max(0.01, back((f - a) / 8) * clamp((b - f) / 6)) * size : 0; g.visible = sc > 0.01; if (!g.visible) return;
    const pos = V(...C0.pos), fw = V(...C0.look).sub(pos).normalize(), rt = fw.clone().cross(V(0, 1, 0)).normalize(), up = rt.clone().cross(fw), hh = Math.tan(C0.fov * Math.PI / 360) * d;
    g.position.copy(pos).addScaledVector(fw, d).addScaledVector(rt, sx * hh * 9 / 16).addScaledVector(up, sy * hh); g.scale.setScalar(sc * d); g.lookAt(pos);
  };

  // ---------- captions: one word at a time (At Your Feet style) + stat cards / pops ----------
  const words = await (await fetch('words.json')).json();
  const cap = createCaptions(THREE, renderer, { words, hi: ['paw', 'guide', 'training', 'grass', 'sick', 'vomit', 'science', '8', '10', '1', '5', '1,500', 'plants', 'wolves', 'broom', 'worms', 'couch', 'careful', 'chemicals', 'toxic', 'vet', 'tall', 'short'], fps: 30 });
  const P = (o) => cap.pop(o), T = (o) => cap.title(o);
  P({ text: '?', a: w.sick - 2, b: 87, at: [640, 330], angle: 10, size: 190, color: '#ffd93b' });
  T({ text: 'SCIENCE\nCHECKED', a: w.science - 1, b: 196, at: [540, 330], size: 160 });
  T({ text: 'UNIVERSITY OF\nCALIFORNIA', a: w.univ - 1, b: 346, at: [540, 320], size: 120, angle: -5 });
  T({ text: '8 IN 10', a: w.eight - 1, b: 429, at: [540, 300], size: 200 }); P({ text: 'dogs eat plants', a: w.plants - 8, b: 429, at: [540, 470], angle: -4, size: 90 });
  P({ text: '♥', a: w.fav - 2, b: w.fav + 30, at: [190, 560], angle: -10, size: 170, color: '#ff6b8a' }); P({ text: '♥', a: w.fav + 8, b: w.fav + 33, at: [800, 640], angle: 10, size: 140, color: '#ff6b8a' });
  T({ text: '1,500+\nOWNERS', a: w.n1500 - 1, b: 566, at: [540, 320], size: 170 });
  T({ text: '1 IN 10', a: w.one10 - 1, b: 689, at: [540, 300], size: 200 }); P({ text: 'seemed sick before', a: w.sick2 - 2, b: 689, at: [540, 470], angle: -4, size: 86 });
  T({ text: '1 IN 5', a: w.one5 - 1, b: 777, at: [540, 300], size: 200 }); P({ text: 'threw up after', a: w.threw - 2, b: 777, at: [540, 470], angle: -4, size: 90 });
  P({ text: '?', a: w.why - 2, b: 806, at: [770, 470], angle: 10, size: 200, color: '#ffd93b' });
  T({ text: 'LIKE A\nBROOM!', a: w.broom - 1, b: 1040, at: [540, 320], size: 160 });
  P({ text: 'SWEEP!', a: w.sweeping - 2, b: w.sweeping + 18, at: [330, 560], angle: -8, size: 130 });
  P({ text: 'WORMS OUT!', a: w.worms - 1, b: 1082, at: [540, 330], angle: -6, size: 130 });
  T({ text: 'GARDEN\nCHEMICALS', a: w.garden - 1, b: 1315, at: [540, 330], size: 140 });
  T({ text: 'TOXIC\nPLANTS', a: w.toxic - 3, b: 1380, at: [540, 330], size: 160 });
  T({ text: 'SEE A\nVET', a: w.see - 1, b: 1535, at: [540, 300], size: 170 });
  T({ text: 'TALL OR\nSHORT?', a: w.tall - 1, b: 1633, at: [540, 300], size: 180 });
  T({ text: 'COMMENT\nPAW!', a: w.paw - 1, b: TOTAL + 6, at: [540, 255], size: 150, angle: -5 });

  // ---------- yard staging ----------
  const Y0 = -1.2, DIR = V(Math.sin(Y0), 0, Math.cos(Y0)), SIDE = V(Math.cos(Y0), 0, -Math.sin(Y0)).negate();   // SIDE = the puppy's right side, toward +z (camera side)
  const RP = V(CHEW.x, 0, CHEW.z).addScaledVector(DIR, -0.48);   // root when grazing: nose over the inner patch, front paws just outside it
  const GRAZE_LOOK = RP.clone().addScaledVector(DIR, 0.66);
  const OWN = [1.25, -0.75], OF = -0.93;                          // owner stands behind-right of the patch, watching the puppy
  const KN = [1.0, -0.5], KF = -1.05;                             // owner kneeling closer (research beat)
  const BED = V(0.55, 0, -1.3), BEDYAW = Math.PI + 1.2;          // puppy sniffing the flower bed (faces back-left along it)
  const AMT = (f) => 0.2 + 0.5 * ramp(f, 0, 1380) + 0.2 * ramp(f, 1381, 1500);   // patch eaten: slowly, the same in every yard shot (continuity); faster while he eats desperately
  const place = (p, yaw, lift = 0) => { dog.root.position.set(p.x, lift, p.z); dog.root.rotation.set(0, yaw, 0); dog.root.updateMatrixWorld(true); };
  const base = (f) => ({ breath: breathe(f + 9), blink: blinkAt(f + 20), ears: 0.1, tail: 0.3, wag: Math.sin(f * 0.3) * 0.4 });
  const chewJ = (f, k = 1, sp = 0.7) => 0.5 + 0.5 * Math.sin(f * sp * k);
  let tug = 0;
  // puppy grazing at the patch: chewing jaw + the head dips and bobs into the tuft (fast = frantic: quick, deep repeated dips); up 0..1 lifts the head (strand in the mouth) toward `lk`
  const graze = (f, { up = 0, lk = null, fast = 1 } = {}) => {
    const fr = fast > 1.5, ph = f * (fr ? 0.62 : 0.2), bob = (1 - up) * (fr ? 0.6 : 0.22) * Math.pow(0.5 + 0.5 * Math.sin(ph), fr ? 3 : 2), c = chewJ(f, fast, 0.7);
    place(fr ? RP.clone().addScaledVector(DIR, 0.025 * Math.sin(ph)) : RP, Y0);
    const g0 = GRAZE_LOOK.clone().add(V(0, 0.45 * bob, 0)), look = up > 0 && lk ? g0.lerp(lk, up) : g0;
    dog.pose({ ...base(f), w: { stand: up + bob, graze: 1 - up - bob }, look, neck: lerp(1, 0.8, up), aimEyes: up > 0.5, jaw: 0.12 + 0.3 * c, ears: fr ? 0.3 * Math.sin(ph) : 0.1, wag: Math.sin(f * (fr ? 0.6 : 0.3)) * (0.3 + 0.3 * up) });
    strand.visible = up > 0.6; tug = (1 - up) * clamp(0.35 + 0.65 * c) * (fr ? 1 : 0.8) * (1 - 0.6 * bob);
  };
  const ownerArgs = (f, o = {}) => ({ w: { stand: 1 }, at: OWN, face: OF, head: [22, 0, 10], breath: breathe(f), blink: blinkAt(f + 33), smile: 0.08, ...o });
  // kneeling owner strokes the puppy's head/back (redo-parts pet recipe); call after the puppy is posed
  const pet = (f, a) => { const t = ramp(f, a, a + 10); if (t <= 0) return; const hd0 = dog.boneWorld('head'), bk = dog.boneWorld('top');
    owner.reach({ ...ownerArgs(f), w: { kneel: 1 }, at: KN, face: KF, head: [18, 0, 6], smile: 0.4 }, { R: [hd0.clone().lerp(bk, 0.5 + 0.5 * Math.sin((f - a) * 0.25)).add(V(0, 0.12, 0)), t] }); };

  // ---------- shots ----------
  // each shot: k = set ('yard' | 'forest' | 'room'), own = owner visible, run(f) poses everything and returns the camera
  const hd = () => dog.headWorld();
  // face shot: camera glides A -> B, the subject is posed first (it may look at the camera), then the camera aims at its head (head sits just above centre)
  const faceAt = (f, a, b, A, B, fov, poseFn, head = hd, dy = -0.03) => { const pos = L3(A, B, ramp(f, a, b)); poseFn(V(...pos)); const h = head(); return { pos, look: [h.x, h.y + dy, h.z], fov }; };
  // owner camera: from heading hg (radians, 0 = +z) at distance d around his head, aimed at height ly (1.5 keeps his head mid-frame, clear of the top titles)
  const OH = [1.19, 1.53, -0.73];
  const ocam = (hg, d, cy, ly, fov, at = OH) => C([at[0] + Math.sin(hg) * d, cy, at[2] + Math.cos(hg) * d], [at[0], ly, at[2]], fov);
  const wolfHead = () => wolves[0].w.headWorld();
  const BEDLOOK = V(BED.x - 0.35, 0.3, -1.85);
  const bedSniff = (f, lk = null, up = 0) => { place(BED, BEDYAW); strand.visible = false; tug = 0;
    dog.pose({ ...base(f), w: { stand: 1 }, look: lk ? BEDLOOK.clone().lerp(lk, up) : BEDLOOK, neck: 0.9, aimEyes: up > 0.5, ears: 0.2, wag: Math.sin(f * 0.35) * 0.4 }); };
  const SHOTS = [
    // hook: ~1 cut per second
    { id: 'h1-chew-profile', a: 0, b: 29, k: 'yard', own: false, run: (f) => { graze(f); return glide(0, 29, C([1.3, 0.78, 1.5], [0.45, 0.26, -0.05], 36), C([1.22, 0.76, 1.4], [0.45, 0.26, -0.05], 36))(f); } },
    { id: 'h2-owner-worried', a: 30, b: 57, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f, { head: [lerp(14, 24, ramp(f, 30, 50)), 0, lerp(4, 12, ramp(f, 34, 54))] }));
      return glide(30, 57, ocam(-0.33, 2.3, 1.5, 1.42, 40), ocam(-0.33, 2.1, 1.5, 1.42, 40))(f); } },
    { id: 'h3-wide-yard', a: 58, b: 87, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f));
      return glide(58, 87, C([0.4, 1.45, 3.4], [0.75, 0.7, -0.4], 46), C([0.45, 1.4, 3.2], [0.75, 0.7, -0.4], 46))(f); } },
    { id: 'h4-eating-close', a: 88, b: 116, k: 'yard', own: false, run: (f) => { graze(f); return glide(88, 116, C([1.2, 0.58, 1.05], [0.38, 0.24, -0.04], 32), C([1.0, 0.52, 0.85], [0.36, 0.24, -0.04], 32))(f); } },
    { id: 'h5-owner-close', a: 117, b: 146, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f, { head: [26, 0, lerp(8, 14, ramp(f, 117, 140))] }));
      return glide(117, 146, ocam(-1.1, 1.7, 1.12, 1.42, 36), ocam(-1.1, 1.58, 1.12, 1.42, 36))(f); } },
    // science checked -> not quite like that
    { id: 's1-science-high', a: 147, b: 196, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f, { head: [20, 0, 6] }));
      return glide(147, 196, C([0.9, 2.6, 2.7], [0.8, 0.35, -0.45], 44), C([0.85, 2.5, 2.5], [0.8, 0.35, -0.45], 44))(f); }, icons: (f, C0) => icon(check, C0, f, w.checked - 2, 196, -0.5, 0.25, 0.16, 0.5) },
    { id: 's2-happy-lift', a: 197, b: 248, k: 'yard', own: false, run: (f) => faceAt(f, 197, 248, [1.45, 0.8, 1.35], [1.05, 0.68, 0.95], 38, (p) => graze(f, { up: ramp(f, 206, 224), lk: p })) },
    // researchers looked into it
    { id: 'r1-owner-kneels', a: 249, b: 296, k: 'yard', own: true, run: (f) => { owner.pose({ ...ownerArgs(f), w: { kneel: 1 }, at: KN, face: KF, head: [18, 0, 6], smile: 0.2 }); graze(f, { up: ramp(f, 249, 259), lk: owner.info.head.clone() }); pet(f, 266);
      return glide(249, 296, C([2.6, 0.95, 3.35], [0.7, 0.75, -0.3], 42), C([2.35, 0.92, 2.95], [0.7, 0.75, -0.3], 42))(f); } },
    { id: 'r2-low-front', a: 297, b: 346, k: 'yard', own: true, run: (f) => { owner.pose({ ...ownerArgs(f), w: { kneel: 1 }, at: KN, face: KF, head: [18, 0, 6], smile: 0.2 }); graze(f, { up: 1, lk: owner.info.head.clone() }); pet(f, 297);
      return glide(297, 346, C([0.1, 0.95, 4.3], [0.75, 0.62, -0.4], 40), C([0.15, 0.93, 3.85], [0.75, 0.62, -0.4], 40))(f); } },
    // 8 in 10 dogs eat plants, grass is the favourite
    { id: 'st1-8in10-wide', a: 347, b: 399, k: 'yard', own: false, run: (f) => { graze(f);
      return glide(347, 399, C([-0.4, 1.0, 2.5], [0.45, 0.3, -0.3], 40), C([-0.32, 0.98, 2.3], [0.45, 0.3, -0.3], 40))(f); } },
    { id: 'st2-plants-bed', a: 400, b: 429, k: 'yard', own: false, run: (f) => faceAt(f, 400, 429, [-0.85, 0.8, -0.6], [-0.8, 0.78, -0.65], 40, () => bedSniff(f), hd, -0.04) },
    { id: 'st3-favourite', a: 430, b: 487, k: 'yard', own: false, run: (f) => { graze(f);
      return glide(430, 487, C([1.45, 0.85, 1.7], [0.45, 0.28, -0.05], 38), C([1.05, 0.66, 1.15], [0.42, 0.26, -0.05], 36))(f); } },
    // 1,500+ owners
    { id: 'st4-owner-1500', a: 488, b: 533, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f, { face: lerp(OF, -0.3, ramp(f, 488, 506)), head: [lerp(20, 2, ramp(f, 488, 506)), 0, 0], smile: 0.5 }));
      return glide(488, 533, ocam(0.05, 2.5, 1.5, 1.5, 40), ocam(0.05, 2.3, 1.5, 1.5, 40))(f); } },
    { id: 'st5-owners-wide', a: 534, b: 566, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f, { face: -0.3, head: [4, 0, 0], smile: 0.5 }));
      return glide(534, 566, C([2.3, 1.3, 3.3], [0.95, 0.85, -0.5], 46), C([2.2, 1.28, 3.15], [0.95, 0.85, -0.5], 46))(f); } },
    // fewer than 1 in 10 seemed sick: the puppy trots in happily, lowers its head to the patch on "eating grass"
    { id: 'st6-trot-in', a: 567, b: 632, k: 'yard', own: false, run: (f) => { const t = ramp(f, 567, 632), p = RP.clone().addScaledVector(DIR, -1.6 * (1 - t));
      place(p, Y0); const g = t < 0.98 ? 1 : 0;
      dog.pose({ ...base(f), w: { stand: 1 }, gait: g ? { phase: f * 0.09, amp: 24, lift: 1, k: 1 - ramp(f, 622, 632) } : null, look: p.clone().addScaledVector(DIR, 1).add(V(0, 0.25, 0)), neck: 0.8, aimEyes: true, wag: Math.sin(f * 0.5) * 0.6, tail: 0.5 });
      strand.visible = false; tug = 0; const cx = lerp(p.x + 0.1, RP.x - 0.1, 0.3);
      return { pos: [cx + 0.45, 0.8, p.z + 2.0], look: [cx, 0.32, p.z], fov: 40 }; } },
    { id: 'st7-head-down', a: 633, b: 689, k: 'yard', own: false, run: (f) => { const d = ramp(f, 634, 650);
      if (d >= 1) graze(f); else { place(RP, Y0); dog.pose({ ...base(f), w: { stand: 1 - d, graze: d }, look: V(GRAZE_LOOK.x, lerp(0.25, 0, d), GRAZE_LOOK.z), neck: lerp(0.8, 1, d), aimEyes: d < 0.5, jaw: d * (0.12 + 0.3 * chewJ(f)) }); strand.visible = false; tug = d * chewJ(f) * 0.8; }
      return glide(633, 689, C([1.5, 0.85, 1.45], [0.45, 0.28, -0.05], 38), C([1.0, 0.62, 0.95], [0.42, 0.26, -0.05], 36))(f); } },
    // only about 1 in 5 threw up after
    { id: 'st8-1in5-face', a: 690, b: 735, k: 'yard', own: false, run: (f) => faceAt(f, 690, 735, [0.0, 0.62, 1.1], [0.05, 0.6, 1.0], 38, (p) => graze(f, { up: ramp(f, 692, 708), lk: p }), hd, -0.08) },
    { id: 'st9-owner-smile', a: 736, b: 777, k: 'yard', own: true, run: (f) => { owner.pose(ownerArgs(f, { head: [16, 0, lerp(8, 0, ramp(f, 736, 756))], smile: lerp(0.1, 0.6, ramp(f, 736, 756)) }));
      graze(f, { up: 1, lk: owner.info.head.clone() });
      return glide(736, 777, C([0.2, 1.1, 3.2], [0.8, 1.15, -0.5], 42), C([0.35, 1.12, 2.7], [0.82, 1.15, -0.5], 42))(f); } },
    // so why do they do it?
    { id: 'q1-head-tilt', a: 778, b: 806, k: 'yard', own: false, run: (f) => faceAt(f, 778, 806, [-0.15, 0.6, 1.05], [0.05, 0.52, 0.72], 34, (p) => { place(RP, Y0); strand.visible = false; tug = 0;
      dog.pose({ ...base(f), w: { stand: 1 }, look: p.clone().add(V(0.12 * Math.sin(ramp(f, 780, 800) * Math.PI), 0.1 * Math.sin(ramp(f, 782, 800) * Math.PI), 0)), neck: 0.8, aimEyes: true, ears: lerp(0.1, -0.6, ramp(f, 779, 787)) + (f > 796 && f < 800 ? 0.5 : 0), wag: 0.4 * Math.sin(f * 0.35), tail: 0.4 }); }, hd, -0.06) },
    { id: 'q2a-looks-off', a: 807, b: 826, k: 'yard', own: false, run: (f) => faceAt(f, 807, 826, [0.5, 0.62, 1.25], [0.25, 0.6, 1.1], 38, (p) => { place(RP, Y0); strand.visible = false; tug = 0; const tn = ramp(f, 809, 819);
      dog.pose({ ...base(f), w: { stand: 1 }, look: p.clone().lerp(V(-2.5, 0.75, 2.5), tn), neck: 0.8, aimEyes: true, ears: lerp(0.1, -0.4, tn), wag: 0, tail: 0.2 }); }, hd, -0.05) },
    { id: 'q2b-yard-push', a: 827, b: 846, k: 'yard', own: false, run: (f) => { place(RP, Y0); strand.visible = false; tug = 0;
      dog.pose({ ...base(f), w: { stand: 1 }, look: V(-2.5, 0.75, 2.5), neck: 0.8, aimEyes: true, ears: -0.4 + (f % 40 > 35 ? 0.4 : 0), wag: 0, tail: 0.2 });
      return glide(827, 846, C([1.9, 1.4, 2.5], [0.3, 0.3, -0.35], 44), C([1.45, 1.1, 1.7], [0.3, 0.3, -0.3], 42))(f); } },
    // wolves (day forest)
    { id: 'f1-pack-wide', a: 847, b: 881, k: 'forest', run: (f) => glide(847, 881, C([-0.55, 1.8, 4.3], [-0.75, 0.3, 0.1], 48), C([-0.55, 1.72, 4.0], [-0.75, 0.3, 0.1], 48))(f) },
    { id: 'f2-wolf-grazes', a: 882, b: 931, k: 'forest', run: (f) => glide(882, 931, C([-0.4, 1.05, 3.3], [-0.75, 0.32, 0.0], 40), C([-0.6, 0.78, 2.4], [-0.82, 0.3, 0.0], 38))(f) },
    { id: 'f3a-wolf-low', a: 932, b: 966, k: 'forest', run: (f) => glide(932, 966, C([-0.4, 0.8, 1.9], [-0.95, 0.32, 0.0], 38), C([-0.65, 0.68, 1.4], [-1.0, 0.3, 0.0], 38))(f) },
    { id: 'f3b-wolf-front', a: 967, b: 1003, k: 'forest', run: (f) => faceAt(f, 967, 1003, [-1.15, 0.8, 1.6], [-1.3, 0.7, 1.2], 40, () => {}, wolfHead, -0.08) },
    { id: 'f4-broom', a: 1004, b: 1043, k: 'forest', run: (f) => { const bx = broomX(f); return { pos: [bx - 0.15, 1.5, BR.z + 0.75], look: [bx - 0.2, 0.1, BR.z], fov: 42 }; } },
    { id: 'f5-worms-out', a: 1044, b: 1082, k: 'forest', run: (f) => glide(1044, 1082, C([-0.1, 1.0, BR.z + 0.55], [-0.18, 0.0, BR.z], 40), C([-0.55, 0.98, BR.z + 0.5], [-0.62, 0.0, BR.z], 40))(f) },
    // instinct still there: wolf / puppy match cut, then the couch
    { id: 'c1-wolf-match', a: 1083, b: 1108, k: 'forest', run: (f) => glide(1083, 1108, C([-0.45, 0.95, 3.0], [-0.75, 0.32, 0.0], 40), C([-0.62, 0.8, 2.45], [-0.8, 0.3, 0.0], 38))(f) },
    { id: 'c2-puppy-match', a: 1109, b: 1135, k: 'yard', own: false, run: (f) => { graze(f); return glide(1109, 1135, C([1.3, 0.78, 1.5], [0.45, 0.26, -0.05], 36), C([1.22, 0.76, 1.4], [0.45, 0.26, -0.05], 36))(f); } },
    { id: 'c3-couch-wide', a: 1136, b: 1162, k: 'room', own: true, run: (f) => glide(1136, 1162, C([1.35, 1.35, 2.5], [1.4, 0.85, -1.35], 52), C([1.36, 1.33, 2.35], [1.4, 0.85, -1.35], 52))(f) },
    { id: 'c4-couch-close', a: 1163, b: 1183, k: 'room', own: false, run: (f) => faceAt(f, 1163, 1183, [1.45, 0.82, -0.4], [1.38, 0.78, -0.55], 38, () => {}, hd, -0.05) },
    // just be careful: garden chemicals, toxic plants
    { id: 'k1-careful-owner', a: 1184, b: 1223, k: 'yard', own: true, run: (f) => { graze(f); owner.pose(ownerArgs(f, { face: lerp(OF, -0.3, ramp(f, 1184, 1200)), head: [lerp(18, 4, ramp(f, 1184, 1200)), 0, 6], smile: 0.1 }));
      return glide(1184, 1223, ocam(0.15, 2.2, 1.5, 1.45, 40), ocam(0.15, 2.05, 1.5, 1.45, 40))(f); }, icons: (f, C0) => icon(warn, C0, f, w.careful - 2, 1223, 0.4, 0.72, 0.12, 0.5) },
    { id: 'k2-chemicals-lawn', a: 1224, b: 1268, k: 'yard', own: false, run: (f) => { const t = ramp(f, 1224, 1268), p = V(0.3, 0, 1.0).addScaledVector(DIR, 0.25 * t);
      place(p, Y0); dog.pose({ ...base(f), w: { stand: 0.4, graze: 0.6 }, gait: { phase: f * 0.04, amp: 10, lift: 0.6, k: 0.6 }, look: p.clone().addScaledVector(DIR, 0.6), neck: 1, ears: 0.1, wag: 0.2 * Math.sin(f * 0.3) });
      strand.visible = false; tug = 0; return glide(1224, 1268, C([1.0, 1.0, 3.15], [0.15, 0.2, 1.0], 40), C([0.92, 0.98, 3.0], [0.1, 0.2, 1.0], 40))(f); },
      icons: (f, C0) => icon(warn, C0, f, w.garden - 4, 1268, 0.6, 0.2, 0.12, 0.5) },
    { id: 'k3-make-sick', a: 1269, b: 1315, k: 'yard', own: false, run: (f) => { const p = V(0.3, 0, 1.0).addScaledVector(DIR, 0.25);
      return faceAt(f, 1269, 1315, [-0.42, 0.7, 2.3], [-0.3, 0.63, 1.85], 38, (cp) => { place(p, Y0); const up = ramp(f, 1272, 1290); strand.visible = false; tug = 0;
        dog.pose({ ...base(f), w: { stand: 0.4 + 0.6 * up, graze: 0.6 * (1 - up) }, look: p.clone().addScaledVector(DIR, 0.6).lerp(cp, up), neck: 1 - 0.2 * up, aimEyes: up > 0.5, ears: lerp(0.1, -0.3, up) + (f > 1300 && f < 1304 ? 0.5 : 0), wag: 0.3 * up * Math.sin(f * 0.35) }); }, hd, -0.02); } },
    { id: 'k4-toxic-bed', a: 1316, b: 1347, k: 'yard', own: false, run: (f) => faceAt(f, 1316, 1347, [-0.65, 0.75, -0.75], [-0.6, 0.73, -0.8], 40, () => bedSniff(f), hd, -0.04),
      icons: (f, C0) => icon(warn, C0, f, w.toxic - 6, 1347, -0.55, -0.3, 0.12, 0.5) },
    { id: 'k5-toxic-flowers', a: 1348, b: 1380, k: 'yard', own: false, run: (f) => faceAt(f, 1348, 1380, [-0.4, 0.62, -0.7], [-0.36, 0.61, -0.76], 38, (p) => bedSniff(f, p, ramp(f, 1352, 1366)), hd, -0.1),
      icons: (f, C0) => icon(warn, C0, f, 1348, 1380, -0.6, -0.15, 0.11, 0.5) },
    // suddenly eats grass desperately, or vomits every time -> see a vet (phone call)
    { id: 'v1-fast-chew', a: 1381, b: 1417, k: 'yard', own: false, run: (f) => { graze(f, { fast: 2 }); return glide(1381, 1417, C([1.45, 0.9, 1.9], [0.45, 0.28, 0.0], 40), C([1.0, 0.62, 1.2], [0.4, 0.26, -0.05], 36))(f); } },
    { id: 'v2-desperate-close', a: 1418, b: 1453, k: 'yard', own: false, run: (f) => { graze(f, { fast: 2.2 }); return glide(1418, 1453, C([0.95, 0.55, 0.85], [0.3, 0.24, -0.03], 32), C([0.82, 0.5, 0.7], [0.3, 0.24, -0.03], 30))(f); } },
    { id: 'v3-owner-concern', a: 1454, b: 1495, k: 'yard', own: true, run: (f) => { graze(f, { fast: 2 }); owner.pose(ownerArgs(f, { head: [lerp(24, 6, ramp(f, 1470, 1486)), lerp(0, 18, ramp(f, 1470, 1486)), lerp(6, 14, ramp(f, 1454, 1480))], smile: 0.02 }));
      return glide(1454, 1495, ocam(-0.75, 2.0, 1.12, 1.42, 36), ocam(-0.6, 1.55, 1.15, 1.42, 36))(f); } },
    { id: 'v4-vet-call', a: 1496, b: 1535, k: 'yard', own: true, run: (f) => { graze(f); const r = ramp(f, 1497, 1509);
      owner.reach(ownerArgs(f, { face: -0.45, head: [6, 10, 0], smile: 0.1, phone: r > 0.85 }), { R: ['earR', r] });
      return glide(1496, 1535, ocam(0.0, 2.4, 1.5, 1.5, 40), ocam(0.0, 2.25, 1.5, 1.5, 40))(f); } },
    // does yours prefer tall grass or short grass? (warm close on the puppy sitting by the half-eaten patch)
    { id: 'e1-sit-warm', a: 1536, b: 1578, k: 'yard', own: false, run: (f) => { const cam = glide(1536, 1578, C([1.15, 0.7, 1.75], [0.45, 0.32, -0.05], 40), C([1.08, 0.68, 1.62], [0.45, 0.32, -0.05], 40))(f); sitEnd(f, cam); return cam; } },
    { id: 'e2-push-in', a: 1579, b: 1633, k: 'yard', own: false, run: (f) => { const cam = glide(1579, 1633, C([0.85, 0.62, 1.4], [0.5, 0.36, 0.0], 38), C([0.75, 0.58, 1.18], [0.5, 0.36, 0.0], 38))(f); sitEnd(f, cam); return cam; } },
    // CTA: the puppy trots to the camera, wagging ("Comment PAW"), then the owner kneels beside it and pets it (title + drawn arrow up top, faces below)
    { id: 'cta1-trot-to-cam', a: 1634, b: 1690, k: 'yard', own: false, run: (f) => { const t = ramp(f, 1634, 1672), p = V(lerp(0.2, 0.42, t), 0, lerp(-0.7, 0.2, t)), yaw = 0.2;
      place(p, yaw, 0.02 * Math.max(0, Math.sin(f * 0.6)) * (1 - t)); strand.visible = false; tug = 0; const sit = ramp(f, 1672, 1684);
      const cam = L3([0.62, 0.62, 2.35], [0.6, 0.6, 2.0], ramp(f, 1634, 1690));
      dog.pose({ ...base(f), w: { stand: 1 - sit, sit }, gait: t < 1 ? { phase: f * 0.13, amp: 26, lift: 1.1, k: 1 - ramp(f, 1666, 1672) } : null, look: V(...cam), neck: 0.85, aimEyes: true, ears: -0.2, wag: Math.sin(f * 0.6) * 0.9, tail: 0.8, jaw: 0.3, tongue: 0.7 });
      const h = hd(); return { pos: cam, look: [h.x, h.y + 0.04, h.z], fov: 40 }; },
      icons: (f, C0) => icon(arrow, C0, f, w.paw + 2, 1690, 0.0, 0.42, 0.065, 0.5) },
    { id: 'cta2-owner-pets', a: 1691, b: TOTAL - 1, k: 'yard', own: true, run: (f) => { const p = V(0.42, 0, 0.95);
      place(p, 0.2); strand.visible = false; tug = 0;
      const oat = [0.97, 0.92], oface = -1.45;
      owner.pose({ w: { kneel: 1 }, at: oat, face: oface, head: [14, 0, 6], breath: breathe(f), blink: blinkAt(f + 33), smile: 0.6 });
      dog.pose({ ...base(f), w: { sit: 1 }, look: V(0.6, 0.95, 3.9), neck: 0.85, aimEyes: true, ears: -0.2, wag: Math.sin(f * 0.6) * 0.9, tail: 0.8, jaw: 0.3, tongue: 0.7, blink: f % 40 < 6 && f > 1700 ? 1 : 0 });
      const t = ramp(f, 1691, 1700), hd0 = dog.boneWorld('head'), bk = dog.boneWorld('top');
      owner.reach({ w: { kneel: 1 }, at: oat, face: oface, head: [14, 0, 6], breath: breathe(f), blink: blinkAt(f + 33), smile: 0.6 }, { R: [hd0.clone().lerp(bk, 0.5 + 0.5 * Math.sin((f - 1691) * 0.25)).add(V(0, 0.12, 0)), t] });
      return glide(1691, TOTAL - 1, C([0.62, 0.95, 4.1], [0.7, 0.68, 0.9], 42), C([0.66, 0.95, 3.75], [0.7, 0.7, 0.9], 42))(f); },
      icons: (f, C0) => icon(arrow, C0, f, 1691, TOTAL + 10, -0.55, 0.42, 0.065, 0.5) },
  ];
  const SITP = RP.clone().addScaledVector(SIDE, 0.12);
  function sitEnd(f, cam) {
    place(SITP, Y0 + 0.9); strand.visible = false; tug = 0;
    dog.pose({ ...base(f), w: { sit: 1 }, look: V(...cam.pos), neck: 0.9, aimEyes: true, ears: (f % 60 > 54 ? -0.5 : 0.1), wag: Math.sin(f * 0.45) * 0.7, tail: 0.6, jaw: 0.25, tongue: 0.6 });
  }
  const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

  // ---------- per-set state ----------
  const forestFrame = (f) => {
    const t = f / 30, c = 0.5 + 0.5 * Math.sin(f * 0.6);
    forest.set({ t, light: 'day', grass: { at: [GZ[0] - 0.1, GZ[1]], r: 0.35, amt: 0.6, dir: -Math.PI / 2 }, watch: { look: [0, 0, 0] } });
    wolves.forEach(({ w: wf, x, z, yaw }, i) => {
      wf.root.position.set(x, 0, z); wf.root.rotation.set(0, yaw, 0); wf.root.updateMatrixWorld(true);
      const b = { breath: 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7) };
      if (i === 0) {   // grazer: head down chewing; lifts its head to chew in f3 (front shot)
        const up = f >= 967 && f < 1004 ? ramp(f, 970, 984) * (1 - ramp(f, 994, 1003)) : 0, bob = (1 - up) * 0.35 * Math.pow(0.5 + 0.5 * Math.sin(f * 0.19), 2);
        wf.pose({ ...b, w: { graze: 1 - up - bob, stand: up + bob }, look: V(GZ[0] - 0.15, 0.45 * bob, GZ[1]).lerp(V(-1.3, 0.72, 1.3), up), aimEyes: up > 0.5, neck: lerp(1, 0.8, up), jaw: 0.15 + 0.35 * c, blink: blinkAt(f), ears: -0.2, wag: 0, tail: -0.2 });
      } else if (i === 1) wf.pose({ ...b, w: { down: 1 }, look: wf.root.localToWorld(V(0.3, 0.15, 0.8)), neck: 0.7, aimEyes: true, blink: (f % 80) < 40 ? 1 : 0, ears: 0.3 });
      else if (i === 2) wf.pose({ ...b, w: { sit: 1 }, look: V(-1.4, 0.4, 0.4 + Math.sin(f * 0.04) * 0.4), neck: 0.8, aimEyes: true, blink: blinkAt(f + 30), ears: -0.4 });
      else wf.pose({ ...b, w: { down: 1 }, look: wf.root.localToWorld(V(-0.2, 0.1, 0.8)), neck: 0.7, aimEyes: true, blink: blinkAt(f + 50), ears: 0.2 });
    });
    // broom sweeps right -> left (f4/f5), pushing three worms ahead of it
    const bx = broomX(f), sweepOn = f >= 1004 && f < 1083;
    broom.visible = sweepOn; broom.position.set(bx, 0, BR.z); broom.rotation.set(0, 0, 0.35 + 0.12 * Math.sin(f * 0.5)); broom.rotation.y = 0.3;
    worms.forEach((g, i) => {
      g.visible = sweepOn; const wx = Math.min(-0.25 + i * 0.25 - 0.1 * i, bx - 0.14 - 0.1 * i) , wz = BR.z + (i - 1) * 0.09;
      g.children.forEach((s, k) => s.position.set(wx - k * 0.035, 0.022, wz + 0.018 * Math.sin(f * 0.6 + k * 1.3 + i)));
    });
  };
  function broomX(f) { return lerp(BR.x0, BR.x1, sm(clamp((f - 1006) / 95))); }
  const roomFrame = (f) => {
    room.set({ t: f / 30, fan: 0, air: 0 });
    // the puppy lies on the sofa seat; the owner stands beside the sofa arm, smiling down at it
    const SEAT = V(0.62, 0.475, -1.45);
    dog.root.position.copy(SEAT); dog.root.rotation.set(0, Math.PI / 2 - 0.55, 0); dog.root.updateMatrixWorld(true);
    const paws = dog.root.localToWorld(V(0, -0.12, 0.6)), up = f < 1163 ? ramp(f, 1144, 1154) : ramp(f, 1170, 1178), lk = paws.lerp(f < 1163 ? V(0.95, 1.3, 1.75) : V(1.4, 0.8, -0.5), up);
    dog.pose({ ...base(f), w: { down: 1 }, look: lk, neck: lerp(0.45, 0.75, up), aimEyes: up > 0.5, ears: lerp(0.25, 0.0, up), blink: up < 0.3 && f % 50 < 20 ? 1 : blinkAt(f + 20), wag: Math.sin(f * 0.35) * (0.3 + 0.4 * up), tail: 0.3 }); strand.visible = false;
    owner.setShoes(false);
    owner.pose({ w: { stand: 1 }, at: [2.08, -1.3], face: -1.75, head: [24, 0, 4], breath: breathe(f), blink: blinkAt(f + 33), smile: 0.55 });
  };

  const frame = (f) => {
    const S = shotAt(f);
    yard.root.visible = S.k === 'yard'; forest.root.visible = S.k === 'forest'; room.root.visible = S.k === 'room';
    dog.root.visible = S.k !== 'forest'; owner.root.visible = !!S.own; owner.setShoes(true);
    check.visible = warn.visible = arrow.visible = false; tug = 0;
    let C0;
    if (S.k === 'forest') { forestFrame(f); C0 = S.run(f); }
    else if (S.k === 'room') { roomFrame(f); C0 = S.run(f); }
    else { C0 = S.run(f); yard.set({ t: f / 30, chew: { amt: AMT(f), tug } }); }
    if (S.icons) S.icons(f, C0);
    return { ...C0, vig: 0.22 };
  };
  window.dbgS = { owner, dog, V, strand };
  return { TOTAL, frame, shotAt, after: (f) => cap.render(f) };
}
