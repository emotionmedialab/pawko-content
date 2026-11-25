// "Heatstroke — 5 steps" reel v3 (voice_v3.wav, 56.23 s, 1687 frames). Every frame is a pure function of f. Word frames (web/words.json = work/words.json fixed by
// work/fix_words.py: sentence-start words re-dated to silence_end, numbers spelled out):
// heat 29 | now 54 | would 77 | do 99 | save 132 | because 163 | theres 204 | it 269 | normal 334 | hot 370 | enough 399 | watch 437 | heavy 448 | panting 457
// drooling 484 | collapsing 504 | refusing 533 | walk 558 | ifsee 595 | act 620 | one 667 | stop 690 | theWalk 718 | two 775 | shade 801 | get 838 | sun 860
// hot2 896 | ground 901 | three 949 | water 983 | pour 1019 | over 1065 | notJust 1098 | paws 1114 | no 1146 | ice 1149 | noWet 1172 | towels 1184 | they 1230
// four 1286 | air 1312 | fan 1342 | ac 1367 | five 1416 | call 1446 | vet 1456 | cooling 1480 | go 1508 | fine 1545 | comment 1577 | paw 1584 | training 1654 | guide 1665 (v3 CTA tail: work/words_tail.json)
import { createOwner, STRIDE } from './owner3d.js';
import { createStreet, SHADE } from './street3d.js';
import { createBucket, createWater, createLeash } from './props3d.js';
import { createLiving, FAN, SPOT } from './living3d.js';
import { createCaptions } from './captions.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const ramp = (f, a, b) => sm((f - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const breathe = (f) => 0.5 + 0.5 * Math.sin(f * 0.16);
const blinkAt = (f) => ((f % 70) < 3 ? 1 : 0);
const pant = (f, k = 1) => ({ jaw: k * (0.5 + 0.25 * Math.sin(f * 0.9)), tongue: k, breath: 0.5 + 0.5 * Math.sin(f * 0.9) });   // heavy panting recipe (redo-parts)
const glide = (a, b, A, B) => (f) => { const t = ramp(f, a, b); return { pos: L3(A.pos, B.pos, t), look: L3(A.look, B.look, t), fov: lerp(A.fov, B.fov, t) }; };
const C = (pos, look, fov) => ({ pos, look, fov });

const w = { heat: 29, now: 54, would: 77, do: 99, save: 132, because: 163, theres: 204, it: 269, normal: 334, hot: 370, enough: 399, watch: 437, heavy: 448, panting: 457,
  drooling: 484, collapsing: 504, refusing: 533, walk: 558, ifsee: 595, act: 620, one: 667, stop: 690, theWalk: 718, two: 775, shade: 801, get: 838, sun: 860,
  hot2: 896, ground: 901, three: 949, water: 983, pour: 1019, over: 1065, notJust: 1098, paws: 1114, no: 1146, ice: 1149, noWet: 1172, towels: 1184, they: 1230,
  four: 1286, air: 1312, fan: 1342, ac: 1367, five: 1416, call: 1446, vet: 1456, cooling: 1480, go: 1508, fine: 1545, comment: 1577, paw: 1584, training: 1654, guide: 1665 };
const TOTAL = 1687;

export async function build({ THREE, scene, renderer, toon, dog }) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const street = createStreet(THREE, scene, { toon }), room = createLiving(THREE, scene, { toon });
  const owner = createOwner(THREE, scene, { toon }); owner.setOutfit('day'); owner.setCap('day');
  const leash = createLeash(THREE, scene, { toon }), bucket = createBucket(THREE, scene, { toon }), water = createWater(THREE, scene, { toon });
  // drool: two small drops falling from the mouth (the rig has no drool)
  const drops = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 8), toon({ color: '#d6f1ff' })); m.scale.set(1, 1.5, 1); scene.add(m); return m; });

  // ---------- captions ----------
  const words = await (await fetch('words.json')).json();
  const cap = createCaptions(THREE, renderer, { words, fps: 30, hi: ['heat', 'stroke', 'save', 'heavy', 'panting', 'drooling', 'collapsing', 'refusing', 'stop', 'shade', 'sun', 'water', 'ice', 'wet', 'towels', 'air', 'fan', 'vet', 'paw', 'training', 'guide'] });
  cap.title({ text: 'SAVE\nTHIS!', a: w.save, b: w.because - 2, at: [540, 250], size: 150 });
  cap.pop({ text: 'PANT! PANT!', a: 467, b: w.drooling - 3, at: [560, 330], angle: -6, size: 120 });
  cap.step({ n: 1, text: 'STOP', a: w.one, b: w.theWalk - 2, at: [540, 300] });
  cap.step({ n: 2, text: 'SHADE', a: w.two, b: w.get + 18, at: [540, 300] });
  cap.step({ n: 3, text: 'WATER', a: w.three, b: 1053, at: [540, 300] });
  cap.pop({ text: 'ICE', a: w.no, b: w.they - 4, at: [330, 300], angle: -6, size: 140 });
  cap.pop({ text: '—————', a: w.ice, b: w.they - 4, at: [330, 298], angle: -6, size: 64, color: '#ff4b4b' });
  cap.pop({ text: 'WET\nTOWELS', a: w.noWet, b: w.they - 4, at: [760, 320], angle: 6, size: 110 });
  cap.pop({ text: '————', a: w.towels, b: w.they - 4, at: [760, 264], angle: 6, size: 64, color: '#ff4b4b' });
  cap.pop({ text: '———————', a: w.towels, b: w.they - 4, at: [760, 376], angle: 6, size: 64, color: '#ff4b4b' });
  cap.step({ n: 4, text: 'AIR', a: w.four, b: w.ac + 30, at: [540, 300] });
  cap.step({ n: 5, text: 'VET', a: w.five, b: w.go - 6, at: [540, 300] });
  cap.pop({ text: '♥', a: w.paw + 24, b: TOTAL + 10, at: [230, 600], angle: -10, size: 170, color: '#ff6b8a' });
  cap.pop({ text: '♥', a: w.paw + 40, b: TOTAL + 10, at: [850, 520], angle: 10, size: 140, color: '#ff6b8a' });
  cap.title({ text: 'COMMENT\nPAW 👇', a: w.paw - 2, b: TOTAL + 10, at: [540, 215], size: 135 });

  // ---------- the walk (street, f < shade): owner + puppy side by side along the path (walk +x), puppy on the owner's right (camera side) ----------
  const SPD = 0.018, X0 = -8.5, DZ = 0.42, OZ = -0.22;
  const OD = [0], DD = [0];
  for (let i = 0; i < TOTAL; i++) { OD.push(OD[i] + SPD * (1 - ramp(i, 540, 560))); DD.push(DD[i] + SPD * (1 - ramp(i, 494, 508))); }
  const ox = (f) => X0 + OD[Math.min(f, w.two)], dxAt = (f) => X0 + 0.45 + DD[Math.min(f, w.two)];
  const DX = dxAt(w.ifsee), OX = ox(w.ifsee);   // where the puppy collapsed / where the owner stopped
  const [sx, sz] = SHADE.spot;
  const KNEEL = [DX - 0.02, 0.1];                       // owner kneels behind the collapsed puppy's back ("the walk is over")
  const O2 = [sx - 0.5, sz - 0.25], D2 = [sx + 0.15, sz + 0.15], DYAW = -0.35, OFACE = 1.25;   // shade spots (proof b)
  const BUCKET0 = [2.95, 0, -0.95];                       // bucket waiting by the shade tree
  const leg = (f, a, b, A, B) => { const t = ramp(f, a, b), L = Math.hypot(B[0] - A[0], B[1] - A[1]); return { at: [lerp(A[0], B[0], t), lerp(A[1], B[1], t)], dist: L * t, k: ramp(f, a, a + 8) * (1 - ramp(f, b - 8, b)), head: Math.atan2(B[0] - A[0], B[1] - A[1]) }; };
  const faceTo = (from, to) => Math.atan2(to[0] - from[0], to[1] - from[1]);

  // ---------- shots ----------
  const track = (fx, off, lk, fov) => (f) => { const x = fx(f); return { pos: [x + off[0], off[1], off[2]], look: [x + lk[0], lk[1], lk[2]], fov }; };
  const push = (cam, a, b, k) => (f) => { const c = cam(f), t = ramp(f, a, b) * k; return { ...c, pos: L3(c.pos, c.look, t) }; };   // creep toward the look point
  const faceCam = (off, d0, d1, h, fov, a, b, ly = -0.02) => (f) => { const hd = dog.headWorld(), yaw = dog.root.rotation.y + off, d = lerp(d0, d1, ramp(f, a, b)); return { pos: [hd.x + Math.sin(yaw) * d, hd.y + h, hd.z + Math.cos(yaw) * d], look: [hd.x, hd.y + ly, hd.z], fov }; };
  const SHOTS = [
    // hook: hot sunny walk, a cut about every 1.1 s
    { id: 'h1-wide-walk', a: 0, b: 35, k: 'street', cam: push(track(ox, [0.25, 0.95, 4.7], [0.25, 0.6, 0], 40), 0, 35, 0.06) },
    { id: 'h2-puppy-low-pant', a: 36, b: 66, k: 'street', cam: push(track(dxAt, [1.5, 0.5, 1.9], [0.05, 0.3, DZ], 40), 36, 66, 0.08) },
    { id: 'h3-low-sun-hero', a: 67, b: 100, k: 'street', cam: track(ox, [0.9, 0.32, 2.5], [0.1, 1.05, -1.0], 52) },
    { id: 'h4-owner-glance', a: 101, b: 131, k: 'street', cam: push(track(ox, [1.7, 1.05, 3.1], [0.35, 0.72, 0.15], 40), 101, 131, 0.08) },
    { id: 's1-front-wide-save', a: 132, b: 162, k: 'street', cam: track(ox, [3.6, 0.9, 3.4], [0.35, 0.68, 0.1], 42) },
    { id: 's2-puppy-side-close', a: 163, b: 203, k: 'street', cam: push(track(dxAt, [0.45, 0.5, 2.3], [0.15, 0.32, DZ], 38), 163, 203, 0.06) },
    { id: 's3-high-wide', a: 204, b: 266, k: 'street', cam: track(ox, [1.4, 3.0, 3.6], [0.4, 0.2, 0], 44) },
    // not an extreme day: normal walk, hot afternoon
    { id: 'e1-sun-park', a: 267, b: 300, k: 'street', cam: track(ox, [0.6, 0.75, 3.6], [0.6, 1.6, -6], 50) },
    { id: 'e2-side-medium', a: 301, b: 333, k: 'street', cam: push(track(ox, [0.3, 0.9, 4.1], [0.3, 0.55, 0], 40), 301, 333, 0.05) },
    { id: 'e3-front-low-normal', a: 334, b: 369, k: 'street', cam: track(dxAt, [2.2, 0.5, 2.5], [-0.25, 0.32, 0.1], 44) },
    { id: 'e4-low-paws-heat', a: 370, b: 404, k: 'street', cam: track(dxAt, [1.3, 0.26, 1.9], [-0.1, 0.25, 0.25], 44) },
    { id: 'e5-wide-shimmer', a: 405, b: 436, k: 'street', cam: push(track(ox, [0.25, 0.95, 4.7], [0.25, 0.6, 0], 40), 405, 436, 0.06) },
    // warning signs
    { id: 'g1-owner-looks-down', a: 437, b: 466, k: 'street', cam: track(ox, [1.4, 1.35, 2.3], [0.25, 1.05, 0.05], 38) },
    { id: 'g2-panting-close', a: 467, b: 483, k: 'street', cam: track(dxAt, [1.1, 0.5, 1.6], [0.2, 0.36, DZ], 36) },
    { id: 'g3-drool-face', a: 484, b: 503, k: 'street', cam: faceCam(-0.7, 0.9, 0.8, 0.02, 34, 484, 503, -0.11) },
    { id: 'g4-collapse-low', a: 504, b: 532, k: 'street', cam: glide(504, 532, C([DX + 0.2, 0.45, 2.3], [DX + 0.05, 0.22, DZ], 42), C([DX + 0.2, 0.42, 2.15], [DX + 0.05, 0.2, DZ], 42)) },
    { id: 'g5-refuse-leash', a: 533, b: 571, k: 'street', cam: glide(533, 571, C([DX + 0.3, 1.0, 4.1], [DX + 0.2, 0.45, 0.1], 40), C([DX + 0.3, 0.98, 3.9], [DX + 0.2, 0.45, 0.1], 40)) },
    { id: 'g6-chin-down', a: 572, b: 594, k: 'street', cam: glide(572, 594, C([DX + 0.45, 0.55, 2.25], [DX + 0.15, 0.22, DZ], 40), C([DX + 0.42, 0.53, 2.15], [DX + 0.15, 0.22, DZ], 40)) },
    // act fast, 1 STOP, the walk is over
    { id: 'a1-owner-turns', a: 595, b: 619, k: 'street', cam: glide(595, 619, C([OX + 1.2, 1.25, 3.3], [OX - 0.25, 0.42, 0.1], 40), C([OX + 1.15, 1.24, 3.15], [OX - 0.25, 0.42, 0.1], 40)) },
    { id: 'a2-puppy-down-pushin', a: 620, b: 642, k: 'street', cam: glide(620, 642, C([DX + 1.0, 0.5, 1.75], [DX + 0.12, 0.2, DZ], 40), C([DX + 0.75, 0.42, 1.35], [DX + 0.12, 0.2, DZ], 40)) },
    { id: 'a3-owner-reacts', a: 643, b: 666, k: 'street', cam: glide(643, 666, C([OX - 1.95, 1.22, 2.25], [OX, 1.22, OZ], 38), C([OX - 1.45, 1.27, 1.65], [OX, 1.28, OZ], 38)) },
    { id: 'p1-stop-front', a: 667, b: 717, k: 'street', cam: glide(667, 717, C([OX + 0.2, 1.1, 4.8], [OX - 0.15, 1.1, 0.1], 42), C([OX + 0.15, 1.12, 4.0], [OX - 0.15, 1.1, 0.1], 42)) },
    { id: 'p2-kneel-pet', a: 718, b: 774, k: 'street', cam: glide(718, 774, C([DX + 1.6, 0.7, 3.6], [DX + 0.05, 0.33, 0.2], 40), C([DX + 1.5, 0.68, 3.45], [DX + 0.05, 0.33, 0.2], 40)) },
    // 2 SHADE: get up, walk on into the shade tree's cool shadow, lie down there
    { id: 'd1-wide-shade-tree', a: 775, b: 806, k: 'street', cam: glide(775, 806, C([1.9, 1.5, 6.6], [1.9, 1.05, -0.4], 46), C([1.95, 1.45, 6.3], [1.95, 1.05, -0.4], 46)) },
    { id: 'd2-walk-to-shade', a: 807, b: 859, k: 'street', cam: (f) => { const x = lerp(DX, sx, ramp(f, 805, 902)); return { pos: [x + 0.15, 1.0, 5.0], look: [x + 0.15, 0.85, 0], fov: 40 }; } },
    { id: 'd3-front-low-into-shade', a: 860, b: 900, k: 'street', cam: glide(860, 900, C([sx + 1.6, 0.85, 3.8], [sx - 0.3, 0.5, -0.1], 44), C([sx + 1.5, 0.85, 3.7], [sx - 0.3, 0.5, -0.1], 44)) },
    { id: 'd4-lies-in-shade', a: 901, b: 948, k: 'street', cam: glide(901, 948, C([sx + 0.75, 1.1, 4.4], [sx - 0.15, 0.45, sz], 44), C([sx + 0.68, 1.1, 4.2], [sx - 0.15, 0.45, sz], 44)) },
    // 3 WATER: bucket, pour over the whole body, no ice / no wet towels, they trap the heat
    { id: 'r1-bucket-insert', a: 949, b: 982, k: 'street', cam: glide(949, 982, C([BUCKET0[0] + 0.9, 0.6, BUCKET0[2] + 0.6], [BUCKET0[0], 0.28, BUCKET0[2]], 40), C([BUCKET0[0] + 0.62, 0.48, BUCKET0[2] + 0.42], [BUCKET0[0], 0.28, BUCKET0[2]], 40)) },
    { id: 'r2-pour-wide', a: 983, b: 1053, k: 'street', cam: glide(983, 1053, C([sx + 0.75, 1.1, 4.4], [sx - 0.15, 0.45, sz], 44), C([sx + 0.62, 1.1, 4.1], [sx - 0.15, 0.45, sz], 44)) },
    { id: 'r3-pour-body-close', a: 1054, b: 1097, k: 'street', cam: glide(1054, 1097, C([sx + 1.8, 0.7, 3.6], [sx - 0.2, 0.5, sz], 42), C([sx + 1.7, 0.7, 3.45], [sx - 0.2, 0.5, sz], 42)) },
    { id: 'r4-not-just-paws', a: 1098, b: 1143, k: 'street', cam: glide(1098, 1143, C([sx + 0.55, 0.3, 1.25], [sx + 0.1, 0.18, sz], 42), C([sx + 0.5, 0.3, 1.15], [sx + 0.1, 0.18, sz], 42)) },
    { id: 'r5-no-ice-towels', a: 1144, b: 1229, k: 'street', cam: glide(1144, 1229, C([sx + 0.3, 1.05, 4.9], [sx - 0.1, 0.55, sz], 44), C([sx + 0.25, 1.03, 4.7], [sx - 0.1, 0.55, sz], 44)) },
    { id: 'r6a-trap-heat-face', a: 1230, b: 1257, k: 'street', cam: faceCam(0.25, 1.3, 0.95, 0.12, 36, 1230, 1257, -0.1) },
    { id: 'r6b-heat-low-side', a: 1258, b: 1285, k: 'street', cam: glide(1258, 1285, C([sx - 0.9, 0.4, sz + 1.45], [sx + 0.15, 0.32, sz + 0.15], 40), C([sx - 0.75, 0.38, sz + 1.25], [sx + 0.15, 0.32, sz + 0.15], 40)) },
    // 4 AIR: living room, fan on the puppy
    { id: 'i1-fan-wide', a: 1286, b: 1339, k: 'room', cam: glide(1286, 1339, C([0.6, 1.0, 3.0], [-0.3, 0.3, 0.0], 44), C([0.5, 1.0, 2.8], [-0.3, 0.3, 0.0], 44)) },
    { id: 'i2-fan-close', a: 1340, b: 1366, k: 'room', cam: glide(1340, 1366, C([-0.2, 0.95, 0.75], [FAN.pos[0], 0.9, FAN.pos[1]], 40), C([-0.25, 0.95, 0.65], [FAN.pos[0], 0.9, FAN.pos[1]], 40)) },
    { id: 'i3-puppy-in-air', a: 1367, b: 1415, k: 'room', cam: faceCam(1.3, 1.5, 1.35, 0.15, 38, 1367, 1415, -0.06) },
    // 5 VET: owner phones the vet, still beside the puppy in the fan
    { id: 'v1-owner-phone', a: 1416, b: 1445, k: 'room', cam: glide(1416, 1445, C([1.4, 1.45, 2.4], [0.8, 1.42, -0.5], 38), C([1.35, 1.45, 2.25], [0.8, 1.42, -0.5], 38)) },
    { id: 'v2-phone-and-puppy', a: 1446, b: 1479, k: 'room', cam: glide(1446, 1479, C([0.85, 1.3, 3.7], [0.25, 0.92, -0.3], 42), C([0.8, 1.3, 3.55], [0.25, 0.92, -0.3], 42)) },
    { id: 'v3-keep-cooling', a: 1480, b: 1507, k: 'room', cam: glide(1480, 1507, C([0.55, 1.0, 2.9], [-0.3, 0.3, 0.0], 44), C([0.5, 0.98, 2.75], [-0.3, 0.3, 0.0], 44)) },
    { id: 'v4-wide-go', a: 1508, b: 1544, k: 'room', cam: glide(1508, 1544, C([0.0, 1.2, 4.6], [0.3, 0.45, -0.2], 42), C([0.05, 1.18, 4.4], [0.3, 0.45, -0.2], 42)) },
    { id: 'v5-puppy-seems-fine', a: 1545, b: 1560, k: 'room', cam: faceCam(1.5, 1.3, 1.0, 0.12, 38, 1545, 1560, -0.08) },
    { id: 'v6-puppy-wag-low', a: 1561, b: 1576, k: 'room', cam: glide(1561, 1576, C([-0.75, 0.55, 1.45], [0.0, 0.3, 0.35], 40), C([-0.62, 0.5, 1.25], [0.0, 0.3, 0.35], 40)) },
    // CTA: owner kneels and pets the recovered puppy
    { id: 'c1-kneel-pet-cta', a: 1577, b: 1686, k: 'room', cam: glide(1577, 1686, C([0.3, 0.95, 4.45], [0.05, 0.56, 0.25], 40), C([-0.05, 0.9, 4.05], [0.05, 0.56, 0.25], 40)) },
  ];
  const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

  // ---------- street: owner ----------
  const ownerStreet = (f) => {
    const base = { breath: breathe(f), blink: blinkAt(f), smile: f < w.watch ? 0.35 : 0.08 };
    if (f < w.ifsee) {   // walking; slows to a stop a step past the puppy, turns half back to look at it
      const back = ramp(f, 548, 566);
      const look = f >= w.watch && f < w.drooling ? 1 : 0;   // "watch for": glances down at the puppy
      owner.pose({ ...base, w: { stand: 1 }, at: [ox(f), OZ], face: lerp(Math.PI / 2, Math.PI / 2 - 0.9, back), walk: { phase: OD[f] / STRIDE, k: 1 - ramp(f, 540, 560) },
        head: [lerp(0, 24, Math.max(look * ramp(f, w.watch, w.watch + 8), back)), lerp(0, -25, Math.max(look * ramp(f, w.watch, w.watch + 8), back)), 0] });
      return;
    }
    if (f < w.theWalk) {   // act fast: turns around to the puppy (fast), looks down
      const tf = faceTo([OX, OZ], [DX, DZ]), turn = ramp(f, 597, 611);
      const args = { ...base, w: { stand: 1 }, at: [OX, OZ], face: lerp(Math.PI / 2 - 0.9, tf, turn), head: [lerp(24, 26, turn) - 14 * ramp(f, 668, 680), lerp(-25, 0, turn), lerp(0, 8, ramp(f, 640, 660))] };
      const stop = ramp(f, 669, 681) * (1 - ramp(f, 704, 716));   // "stop": left palm up and out
      owner.pose(args);
      const fw = V(Math.sin(args.face), 0, Math.cos(args.face));
      owner.reach(args, stop > 0 ? { L: [owner.info.chest.clone().addScaledVector(fw, 0.38).add(V(0, 0.12, 0)), stop] } : {});
      return;
    }
    if (f < w.two + 4) {   // the walk is over: kneels behind the puppy's back and strokes it
      const kn = ramp(f, 720, 740), pet = ramp(f, 738, 748);
      const args = { ...base, w: { stand: 1 - kn * 0.8, crouch: kn * 0.8 }, at: KNEEL, face: 0.6, head: [-15, -6, 6], smile: 0.1 };
      const top = dog.boneWorld('top'), sp = dog.boneWorld('sp3');
      owner.reach(args, pet > 0 ? { R: [top.clone().lerp(sp, 0.5 + 0.5 * Math.sin((f - 738) * 0.2)).add(V(0, 0.06, 0)), pet] } : {});
      return;
    }
    if (f < w.ground) {   // gets up and leads the puppy on into the shade
      const up = 1 - ramp(f, 779, 796), L = leg(f, 800, 898, KNEEL, O2);
      owner.pose({ ...base, w: { stand: 1 - up * 0.8, crouch: up * 0.8 }, at: L.at, face: f < 800 ? lerp(0.5, L.head, ramp(f, 790, 802)) : lerp(L.head, OFACE, ramp(f, 890, 905)), walk: { phase: L.dist / STRIDE, k: L.k }, head: [10, -10, 0] });
      return;
    }
    // shade + water: holds the bucket at the hips (picked up by the tree off-screen), tips it over the puppy
    const pour = ramp(f, 1015, 1035) * (1 - ramp(f, 1132, 1146));
    const at = O2, fw = V(Math.sin(OFACE), 0, Math.cos(OFACE));
    const bpos = V(at[0], 0, at[1]).addScaledVector(fw, 0.42 + 0.1 * pour); bpos.y = lerp(0.42, 0.55, pour);
    if (f < w.water) { owner.pose({ ...base, w: { stand: 1 }, at, face: OFACE, head: [18, 0, 4] }); bucket.set({ at: BUCKET0, yaw: 0.4, tilt: 0, water: 1 }); return null; }
    bucket.set({ at: [bpos.x, bpos.y, bpos.z], yaw: OFACE, tilt: 1.5 * pour, water: 1 - 0.8 * ramp(f, 1030, 1135) });
    const bp = bucket.pts();
    owner.pose({ ...base, w: { stand: 1 - pour * 0.7, pour: pour * 0.7 }, at, face: OFACE, head: [lerp(14, 30, pour), 0, 4], smile: 0.2, ik: { R: bp.handle, L: bp.base } });
    return { pour, bp };
  };

  // ---------- street: puppy ----------
  const dogStreet = (f) => {
    const fwdLook = (y = 0.1) => dog.root.localToWorld(V(0, y, 1.0));
    const base = { blink: blinkAt(f + 20), ears: 0.4, tail: -0.1, wag: 0, aimEyes: true, neck: 0.7 };
    if (f < w.refusing) {   // trots beside the owner, panting harder; legs give out on "collapsing"
      const x = dxAt(f), go = 1 - ramp(f, 494, 508), down = ramp(f, 504, 518), k = lerp(0.55, 1, ramp(f, 400, 437));
      dog.root.position.set(x, 0, DZ); dog.root.rotation.set(0, Math.PI / 2, 0); dog.root.updateMatrixWorld(true);
      const happy = 1 - ramp(f, 360, 437);
      dog.pose({ ...base, ...pant(f, k), w: { stand: 1 - down, down }, gait: go > 0.02 ? { phase: DD[f] / 0.3, amp: 22 * go, lift: go, k: 1 } : null,
        look: fwdLook(lerp(0.1, -0.25, down)), tail: lerp(0.3, -0.2, 1 - happy), wag: happy * Math.sin(f * 0.45) * 0.5, blink: down > 0.5 ? 0.4 : base.blink });
      return;
    }
    if (f < w.two) {   // exhausted, belly-down, eyes open, heavy panting: refuses the pull (head turned away), rests its chin low, lifts its head again
      const away = 1 - ramp(f, 566, 580), rest = ramp(f, 576, 590) * (1 - ramp(f, 600, 614)), bob = 0.03 * Math.sin(f * 0.9);
      dog.root.position.set(DX, 0, DZ); dog.root.rotation.set(0, Math.PI / 2, 0); dog.root.updateMatrixWorld(true);
      dog.pose({ ...base, ...pant(f, 1), w: { down: 1 }, look: f >= 614 ? V(DX + 1.0, 0.3 + bob, 1.75) : dog.root.localToWorld(V(0.35 * away, lerp(0.02, -0.14, rest) + bob, 0.8)), neck: lerp(0.7, 0.5, rest), ears: 0.5 });
      return;
    }
    if (f < w.ground) {   // gets back up, walks slowly on the leash into the shade
      const up = ramp(f, 779, 800), L = leg(f, 804, 900, [DX, DZ], D2);
      dog.root.position.set(L.at[0], 0, L.at[1]); dog.root.rotation.set(0, lerp(Math.PI / 2, L.head, ramp(f, 798, 808)), 0); dog.root.updateMatrixWorld(true);
      dog.pose({ ...base, ...pant(f, 1), w: { down: 1 - up, stand: up },
        gait: L.k > 0.02 ? { phase: L.dist / 0.3, amp: 18 * L.k, lift: L.k, k: 1 } : null, look: fwdLook(0.0) });
      return;
    }
    // lies down in the cool shadow pool, panting less once the water is on it
    const turn = ramp(f, 901, 916), down = ramp(f, 912, 932), H = Math.atan2(D2[0] - DX, D2[1] - DZ);
    dog.root.position.set(D2[0], 0, D2[1]); dog.root.rotation.set(0, lerp(H, DYAW, turn), 0); dog.root.updateMatrixWorld(true);
    const cool = ramp(f, 1060, 1200);
    const sway = f > 1230 ? 0.7 * Math.sin((f - 1230) * 0.07) : 0;
    dog.pose({ ...base, ...pant(f, lerp(1, 0.55, cool)), w: { stand: 1 - down, sit: down }, gait: turn > 0 && turn < 1 ? { phase: f * 0.08, amp: 14, lift: 1, k: 1 } : null,
      look: V(sx + 1.2 + sway, 0.45, sz + 2.5), neck: 0.6, ears: 0.3, blink: blinkAt(f + 20), wag: ramp(f, 1180, 1200) * Math.sin(f * 0.5) * 0.3 });
  };

  // ---------- living room: puppy in the fan's air, owner on the phone, then the recovered puppy sits for a pat ----------
  const DYAWR = Math.atan2(FAN.pos[0] - SPOT[0], FAN.pos[1] - SPOT[1]) + 0.5;
  const OPH = [0.85, -0.55], OK = [-0.2, 0.15], OKF = 1.25, okFw = [Math.sin(OKF), Math.cos(OKF)], DSIT = [OK[0] + okFw[0] * 0.42, OK[1] + okFw[1] * 0.42];
  const roomFrame = (f, S) => {
    room.set({ t: f / 30, fan: 1, air: f < w.comment ? 1 : 0.6 });
    const cta = f >= w.comment, fine = ramp(f, 1530, 1550);
    owner.root.visible = S.id[0] === 'v' || cta; owner.setShoes(false);
    if (!cta) {
      const reach = ramp(f, w.five + 2, w.five + 16);
      owner.reach({ w: { stand: 1 }, at: OPH, face: -0.45, head: [6, 10, 0], breath: breathe(f), blink: blinkAt(f), smile: 0.05, phone: reach > 0.85 }, { R: ['earR', reach] });
      dog.root.position.set(SPOT[0], 0, SPOT[1]); dog.root.rotation.set(0, DYAWR, 0); dog.root.updateMatrixWorld(true);
      const lk = room.pts().fanFace.clone().lerp(V(0.6, 0.4, 3), 0.55).lerp(V(-0.2 + 0.5 * Math.sin((f - 1530) * 0.08) * fine, 0.3, 2.0), fine);
      dog.pose({ ...pant(f, lerp(0.9, 0.3, ramp(f, 1300, 1500))), w: { down: 1 }, look: lk, neck: 0.6, aimEyes: true,
        ears: 0.5 + 0.35 * Math.sin(f * 1.7), blink: blinkAt(f + 20), wag: fine * Math.sin(f * 0.5) * 0.8, tail: 0.5 * fine });
      return;
    }
    const kn = ramp(f, w.comment, w.comment + 14), pet = ramp(f, w.comment + 10, w.comment + 20);
    const args = { w: { stand: 1 - kn, kneel: kn }, at: OK, face: OKF, head: [6, 0, 0], breath: breathe(f), blink: blinkAt(f), smile: 0.5 };
    owner.pose(args);
    dog.root.position.set(DSIT[0], 0, DSIT[1]); dog.root.rotation.set(0, Math.atan2(OK[0] - DSIT[0], OK[1] - DSIT[1]), 0); dog.root.updateMatrixWorld(true);
    dog.pose({ w: { sit: 1 }, look: owner.info.head.clone(), neck: 0.8, aimEyes: true, jaw: 0.3, tongue: 0.4, breath: breathe(f), blink: blinkAt(f + 20), ears: 0.1, wag: Math.sin(f * 0.5) * 0.8, tail: 0.6 });
    const hd = dog.boneWorld('head'), top = dog.boneWorld('top');
    owner.reach(args, pet > 0 ? { R: [hd.clone().lerp(top, 0.5 + 0.5 * Math.sin((f - w.comment - 10) * 0.22)).add(V(0, 0.12, 0)), pet] } : {});
  };

  const frame = (f) => {
    const S = shotAt(f), out = S.k === 'street';
    street.root.visible = out; room.root.visible = !out; owner.root.visible = true;
    leash.root.visible = out; bucket.root.visible = out; water.root.visible = out;
    let pourSt = null;
    if (out) {
      owner.setShoes(true);
      dogStreet(f);
      pourSt = ownerStreet(f);
      if (f < w.ground) bucket.set({ at: BUCKET0, yaw: 0.4, tilt: 0, water: 1 });
      leash.set({ a: f < w.water ? owner.info.R.H : V(O2[0] + 0.25, 0.02, O2[1] + 0.2), b: dog.boneWorld('n2'), sag: f >= w.refusing && f < 566 ? 0.05 : f < 494 ? 0.35 : 0.7 });
      // water stream sweeps neck -> back -> hips ("all over their body")
      const flow = ramp(f, 1027, 1035) * (1 - ramp(f, 1128, 1136));
      if (pourSt && flow > 0) {
        const n2 = dog.boneWorld('n2'), sp = dog.boneWorld('sp3'), hip = sp.clone().add(sp.clone().sub(n2).multiplyScalar(0.4)), u = 0.5 + 0.5 * Math.sin((f - 1027) * 0.09);
        const to = (u < 0.5 ? n2.clone().lerp(sp, u * 2) : sp.clone().lerp(hip, u * 2 - 1)).add(V(0, 0.06, 0));
        water.set({ from: pourSt.bp.lip, to, amt: flow, t: f / 30, splash: flow, puddle: ramp(f, 1035, 1100) });
      } else water.set({ from: V(0, -5, 0), to: V(D2[0], 0.1, D2[1]), amt: 0, t: f / 30, splash: 0, puddle: f >= 1035 ? ramp(f, 1035, 1100) : 0 });
      const C0 = S.cam(f), heat = f < w.two ? 1 : f < w.ground ? lerp(1, 0.35, ramp(f, 830, 900)) : 0.25;
      street.set({ t: f / 30, heat, shade: f < w.two ? 0 : ramp(f, 780, 805), focusX: f < w.two ? lerp(ox(Math.min(f, w.ifsee)), DX, 0.5) : lerp(DX, sx, ramp(f, 800, 900)), cam: C0.pos });
    } else roomFrame(f, S);
    // drool drops from the mouth on "drooling"
    const dr = f >= 470 && f < w.refusing;
    drops.forEach((m, i) => { m.visible = dr; if (!dr) return; const tip = dog.tongue.localToWorld(V(0, 0, 1)), k = ((f + i * 9) % 18) / 18;
      m.position.copy(tip).add(V(0, -0.01 - 0.16 * k * k, 0)); m.visible = dr && m.position.y > 0.01; });
    return { ...S.cam(f), vig: 0.22 };
  };
  return { TOTAL, frame, shotAt, after: (f) => cap.render(f) };
}
