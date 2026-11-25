// "Calm Homecoming — the 5-minute rule" reel (46.89 s, 1407 frames: voice_cta.mp3 = voice.mp3 + 0.25 s + the CTA take, level-matched). Every frame is a pure function of f. Word frames (web/words.json; sentence-start
// words re-dated to the silence_end before them: Do 70, Your 126, jumping 193, But 322, So 532, Put 854, Wait 899, Then 1003, Now 1096):
// greet 8 | home 41 | do 70 | different 78 | your 126 | crazy 139 | walk 164 | jumping 193 | spinning 208 | panting 226 | told 258 | pure 276 | love 283
// but 322 | fuss 337 | wound 388 | not 420 | rewarding 424 | love2 435 | rewarding2 472 | stress 484 | so 532 | five 546 | rule 561 | when 590 | ignore 615
// look 675 | touch 702 | talk 737 | know 766 | hard 778 | take 808 | shoes 820 | put 854 | keys 867 | wait 899 | calms 915 | four 946 | paws 952 | floor 973
// then 1003 | call 1005 | gently 1017 | calm 1049 | pet 1056 | now 1096 | arrival 1104 | emergency 1136 | its 1174 | normal 1183 | and 1220 | calm2 1225 | happy 1260
// CTA (work/words-cta.json + 43.13 s; Comment re-dated to the silence_end 43.22): comment 1297 | paw 1305 | and 1332 | training 1373 | guide 1386
// Story: act 1 (0..527) the wrong way: door opens, he walks in with keys, the puppy goes crazy, he fusses over it. Reset (528..589): door shut, the puppy waits,
// 5:00 ring. Act 2 (590..): he comes home again, folds his arms + looks away (5:00 counting down), shoes off (one-frame swap in a crouch), keys on the rack,
// the puppy calms to four paws and sits, he kneels and pets it, it lies down. Kit parts from redo-parts (entry3d, owner3d, dogrig, captions).
import { createEntry } from './entry3d.js';
import { createOwner, STRIDE } from './owner3d.js';
import { createCaptions } from './captions.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const ramp = (f, a, b) => sm((f - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const breathe = (f) => 0.5 + 0.5 * Math.sin(f * 0.16);
const blinkAt = (f) => ((f % 70) < 3 ? 1 : 0);
const pant = (f, k = 1) => ({ jaw: k * (0.45 + 0.2 * Math.sin(f * 0.9)), tongue: 0, breath: 0.5 + 0.5 * Math.sin(f * 0.9) });   // redo-parts pant recipe; v3: no tongue (the rig's tongue floats outside the muzzle; open jaw + fast breath reads as panting)
const glide = (a, b, A, B) => (f) => { const t = ramp(f, a, b); return { pos: L3(A.pos, B.pos, t), look: L3(A.look, B.look, t), fov: lerp(A.fov, B.fov, t) }; };
const C = (pos, look, fov) => ({ pos, look, fov });

const w = { greet: 8, home: 41, do: 70, your: 126, crazy: 139, walk: 164, jumping: 193, spinning: 208, panting: 226, told: 258, love: 283, but: 322, fuss: 337, wound: 388,
  not: 415, love2: 435, rewarding2: 467, stress: 484, so: 532, five: 546, rule: 561, when: 590, ignore: 615, look: 671, touch: 697, talk: 731, know: 764, hard: 778,
  take: 808, shoes: 820, put: 854, keys: 867, wait: 899, calms: 915, four: 946, floor: 973, then: 1003, gently: 1017, calm: 1049, now: 1096, emergency: 1136,
  its: 1174, normal: 1183, and: 1220, happy: 1260, comment: 1297, paw: 1305, guide: 1386 };
const TOTAL = 1407;
const A1 = [0.2, -0.85];          // where he stops inside (clear of the door's swing, radius 0.95 from the hinge)
const FACE2 = 1.25;               // act 2: turned side-on to the camera, the puppy in front of him (+x)
const RACKAT = [0.48, -1.28];   // v3: a step back from the console table (his swinging arm went through it)     // standing at the key rack (redo-parts proof d)

export async function build({ THREE, scene, renderer, toon, dog }) {
  const hall = createEntry(THREE, scene, { toon }), owner = createOwner(THREE, scene, { toon });
  owner.setOutfit('day'); owner.setCap('day'); owner.setShoes(true);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  const words = await (await fetch('words.json')).json();
  const cap = createCaptions(THREE, renderer, { words, hi: ['crazy', 'love', 'stress', 'five', 'minute', 'rule', 'ignore', 'look', 'touch', 'talk', 'four', 'paws', 'calm', 'happy', 'paw', 'training', 'guide'], fps: 30 });
  cap.pop({ text: 'YIP! YIP!', a: w.crazy, b: w.crazy + 26, at: [270, 640], angle: -8, size: 110 });
  cap.pop({ text: 'PANT! PANT!', a: w.panting - 2, b: w.panting + 28, at: [560, 330], angle: -6, size: 120 });   // v4: the rig's jaw barely opens on screen, so the pant is spelled out (redo-parts proof a)
  cap.pop({ text: '♥', a: w.love - 2, b: w.love + 34, at: [250, 520], angle: -10, size: 170, color: '#ff6b8a' });
  cap.pop({ text: '♥', a: w.love + 8, b: w.love + 34, at: [830, 430], angle: 10, size: 130, color: '#ff6b8a' });
  cap.pop({ text: 'STRESS!', a: w.stress - 2, b: w.so - 6, at: [540, 300], angle: -6, size: 170, color: '#ffd93b' });
  cap.timer({ from: 300, to: 300, a: w.five - 2, b: w.when - 4, at: [540, 400], size: 150, hold: 0 });     // the rule: a big 5:00
  const tv = (f) => Math.round(300 * (1 - (f - (w.when + 2)) / (w.floor - w.when)));   // countdown value; drawn in 3 pieces so it can dodge his head in the shoes shot
  cap.timer({ from: 300, to: tv(807), a: w.when + 2, b: 807, at: [880, 250], size: 72, hold: 0, total: 300 });
  cap.timer({ from: tv(808), to: tv(825), a: 808, b: 825, at: [200, 250], size: 72, hold: 0, total: 300 });
  cap.timer({ from: tv(826), to: 0, a: 826, b: w.floor + 2, at: [880, 250], size: 72, hold: 14, total: 300 });
  cap.title({ text: 'CALM DOG,\nHAPPY DOG!', a: w.happy - 4, b: w.comment - 6, at: [540, 235], size: 150 });
  cap.pop({ text: '♥', a: w.and + 6, b: w.comment - 6, at: [190, 640], angle: -10, size: 120, color: '#ff6b8a' });
  cap.title({ text: 'COMMENT\nPAW 👇', a: w.paw - 2, b: TOTAL + 5, at: [540, 215], size: 140 });   // CTA title, lands on "PAW"

  // ---------- owner: walk legs [f0, f1, from, to] (he stands still between legs) ----------
  const LEGS1 = [[2, 58, [0, -2.4], A1]];
  const LEGS2 = [[588, 624, [0, -2.05], A1], [838, 856, A1, RACKAT], [876, 894, RACKAT, A1]];
  const walkAt = (f, LEGS) => { let at = LEGS[0][2], dist = 0, k = 0;
    for (const [a, b, P, Q] of LEGS) { if (f < a) break; const t = clamp((f - a) / (b - a)); at = [lerp(P[0], Q[0], t), lerp(P[1], Q[1], t)]; dist += Math.hypot(Q[0] - P[0], Q[1] - P[1]) * t; k = Math.max(k, ramp(f, a, a + 5) * (1 - ramp(f, b - 5, b))); }
    return { at, dist, k }; };
  const face2 = (f) => {   // act 2 heading: walk in (0), turn side-on, face the rack while walking there, face back the way he walks, side-on again
    if (f < 836) return lerp(0, FACE2, ramp(f, 616, 630));
    if (f < 870) return lerp(FACE2, 2.5, ramp(f, 834, 844));
    if (f < 890) return lerp(2.5, -0.6, ramp(f, 868, 878));
    return lerp(-0.6, FACE2, ramp(f, 888, 900));
  };

  const ownerArgs = (f) => {
    if (f < w.so) {   // act 1: walks in smiling with his keys, looks down at the puppy, leans in to fuss over it
      const O = walkAt(f, LEGS1), lean = ramp(f, w.told + 4, w.told + 24);
      return { w: { stand: 1 - lean, pour: lean }, at: O.at, face: 0, walk: { phase: O.dist / STRIDE, k: O.k }, head: [lerp(0, 20, ramp(f, 40, 64)) - 14 * lean, 0, 0], breath: breathe(f), blink: blinkAt(f), smile: 0.55, keys: true };
    }
    const O = walkAt(f, LEGS2);
    const fold = ramp(f, 618, 634) * (1 - ramp(f, 804, 812)) + ramp(f, 900, 912) * (1 - ramp(f, w.then, w.then + 10));
    const crouch = ramp(f, 810, 821) * (1 - ramp(f, 828, 838)), kneel = ramp(f, w.then + 8, w.then + 28);
    const away = ramp(f, 622, 640) * (1 - ramp(f, 804, 812)) + ramp(f, 902, 916) * (1 - ramp(f, w.then, w.then + 12));
    const atRack = ramp(f, 852, 860) * (1 - ramp(f, 866, 874));
    return { w: { stand: 1 - crouch * 0.7 - kneel, crouch: crouch * 0.7, kneel }, at: O.at, face: face2(f), walk: { phase: O.dist / STRIDE, k: O.k }, breath: breathe(f), blink: blinkAt(f),
      head: [lerp(0, 20, crouch) - 8 * away + 10 * kneel + 10 * atRack, -62 * away, -6 * away], smile: away > 0.5 ? 0.05 : 0.45, keys: f < 862, fold, crouch, kneel };
  };

  // ---------- puppy ----------
  const P0 = V(0.5, 0, -0.4), WAIT = V(0.3, 0, -0.35);
  const F2 = V(A1[0] + 0.45 * Math.sin(FACE2), 0, A1[1] + 0.45 * Math.cos(FACE2));   // v4: paws reach his legs
  const yawTo = (p, x, z) => Math.atan2(x - p.x, z - p.z);
  const jumpCyc = (f, f0) => 0.5 - 0.5 * Math.cos(2 * Math.PI * (f - f0) / 20);
  const hopAt = (f, f0) => 0.05 * Math.max(0, Math.sin(2 * Math.PI * (f - f0) / 20 - 0.6));
  const dogFor = (f, ownerHead) => {
    let p, yaw, dw = { stand: 1 }, gait = null, hop = 0, look = ownerHead, k = 1, calm = 0, extra = {}, neck = 0.8;
    if (f < w.so) {   // act 1: waits facing the door, races to his feet, jumps up again and again, spins on "spinning"
      const F1 = V(A1[0] + 0.05, 0, A1[1] + 0.48);   // v4: 0.5 m out so the snout stays in front of his legs (paws reach his thighs)
      if (f < 30) { p = P0.clone(); yaw = yawTo(p, 0, -1.8); hop = 0.03 * Math.max(0, Math.sin(f * 0.6)); look = V(0, 1.0, -2.2); }
      else if (f < 54) { const t = ramp(f, 30, 54); p = P0.clone().lerp(F1, t); yaw = yawTo(P0, F1.x, F1.z); gait = { phase: f * 0.12, amp: 30, lift: 1.2, k: 1 }; yaw = lerp(yaw, Math.PI, ramp(f, 46, 54)); }
      else {
        const s0 = w.spinning, spin = ramp(f, s0, s0 + 20), held = ramp(f, w.but - 10, w.but), j = Math.max(held, jumpCyc(f, 54) * (1 - ramp(f, s0 - 4, s0) + ramp(f, s0 + 20, s0 + 24)));   // v4: from "But" he holds its front paws, so it stays up on its hind legs
        p = F1.clone(); if (spin > 0 && spin < 1) p.add(V(0.1 * Math.sin(spin * Math.PI * 2), 0, 0.1 * (1 - Math.cos(spin * Math.PI * 2))));
        yaw = Math.PI + spin * Math.PI * 2; dw = { stand: 1 - j, jump: j }; hop = hopAt(f, 54) * (spin > 0 && spin < 1 ? 0 : 1) * (1 - held) + 0.02 * held * Math.max(0, Math.sin(f * 0.6));
        if (spin > 0 && spin < 1) gait = { phase: f * 0.15, amp: 20, lift: 1, k: 1 };
        look = V(A1[0], 0.8, A1[1]); neck = 0.6;   // v2: eyes up at his waist, not his face: the jump pose already tips the body up, so the head stays a puppy head (no snout-to-ceiling)
      }
    } else if (f < 596) {   // reset: sits by the door, waiting; ears up when it opens
      p = WAIT.clone(); yaw = yawTo(p, 0, -1.8); dw = { sit: 1 }; look = V(0, 1.0, -2.2); k = 0; extra = { ears: f > 590 ? -0.5 : 0.1 };
    } else if (f < 620) {   // up and over to him
      const t = ramp(f, 598, 620); p = WAIT.clone().lerp(F2, t); const up = ramp(f, 596, 604);
      yaw = lerp(yawTo(WAIT, F2.x, F2.z), yawTo(F2, A1[0], A1[1]), ramp(f, 612, 620)); dw = { sit: 1 - up, stand: up }; gait = t > 0 && t < 1 ? { phase: f * 0.12, amp: 30, lift: 1.2, k: 1 } : null; look = V(p.x + Math.sin(yaw), 0.5, p.z + Math.cos(yaw));   // v4: looks where it runs
    } else {   // act 2 in front of him (F2): jumps, spins on "hard", stays down + hops while he crouches / walks to the rack, calms, four paws, sits, lies down
      const O = walkAt(f, LEGS2); p = F2.clone(); yaw = yawTo(p, O.at[0], O.at[1]);
      const s0 = w.hard + 4, spin = ramp(f, s0, s0 + 20);
      const jumping = clamp(1 - ramp(f, 804, 810) + ramp(f, 880, 888)) * (1 - ramp(f, 902, 910)) * (1 - ramp(f, s0 - 4, s0) + ramp(f, s0 + 20, s0 + 24));
      const j = jumpCyc(f, 620) * jumping;
      if (spin > 0 && spin < 1) { p.add(V(0.1 * Math.sin(spin * Math.PI * 2), 0, 0.1 * (1 - Math.cos(spin * Math.PI * 2)))); yaw += spin * Math.PI * 2; gait = { phase: f * 0.15, amp: 20, lift: 1, k: 1 }; }
      hop = hopAt(f, 620) * jumping + (f > 806 && f < 884 ? 0.025 * Math.max(0, Math.sin(f * 0.5)) : 0) * (spin > 0 && spin < 1 ? 0 : 1);
      calm = ramp(f, 904, 948); const sit = ramp(f, 980, 996), down = ramp(f, w.normal, w.normal + 26);
      p.add(V(Math.sin(FACE2), 0, Math.cos(FACE2)).multiplyScalar(0.08 * sit + 0.06 * down + 0.15 * ramp(f, 804, 812) * (1 - ramp(f, 834, 842))));   // v3: also backs off while he crouches (was inside his knee)   // v2: settles back a step as it sits (not under him when he kneels), shuffles in to his knee as it lies down (in reach of his hand)
      yaw += 1.3 * sit;   // v4: sits side-on to him (its back to his hand, face to the camera side), so stroking its back never covers the head   // v2: sits turned a little toward the camera side (its face reads past his hands), stays turned as it lies down (paws clear of his knee)
      dw = { stand: (1 - j) * (1 - sit), jump: j, sit: sit * (1 - down), down };
      k = 1 - calm;
      look = V(O.at[0], lerp(0.8, 0.72, calm), O.at[1]).lerp(V(p.x + Math.sin(yaw) * 0.8 - 0.25, 0.42, p.z + Math.cos(yaw) * 0.8), sit); neck = 0.6;   // v4: sitting = looks ahead, turned a little toward him   // v2: same as act 1 (eyes at his waist / chest when he kneels), no snout-to-ceiling
      if (down > 0) { look = look.clone().lerp(V(p.x + Math.sin(yaw) * 0.7, 0.3, p.z + Math.cos(yaw) * 0.7), down); extra = { blink: lerp(blinkAt(f + 20), 0.5, down) }; }   // lying: head low, content half-closed eyes
    }
    dog.root.position.copy(p).add(V(0, hop, 0)); dog.root.rotation.set(0, yaw, 0); dog.root.updateMatrixWorld(true);
    const tw = f >= w.so ? ramp(f, 596, 604) : 1;   // excited wag (calm wag later)
    dog.pose({ ...pant(f, k), w: dw, gait, look, neck, aimEyes: true, ears: lerp(-0.4, 0.2, calm), wag: Math.sin(f * lerp(0.9, 0.3, calm)) * lerp(0.9, 0.45, calm) * tw, tail: lerp(0.8, 0.3, calm), blink: blinkAt(f + 20),
      jaw: lerp(0.95 + 0.3 * Math.sin(f * 0.9), 0.12, f >= w.so && f < 596 ? 1 : calm) * (f >= w.so && f < 596 ? 0.4 : 1), ...extra });
  };

  // ---------- cameras ----------
  const headCam = (dir, d, up, fov, push = 0, a = 0, b = 1) => (f) => {   // around the owner's head: dir = world heading of the camera from the head
    const h = owner.info.head, dd = d - push * ramp(f, a, b); return { pos: [h.x + Math.sin(dir) * dd, h.y + up, h.z + Math.cos(dir) * dd], look: [h.x, h.y - 0.08, h.z], fov };
  };
  const pupCam = (dir, d, cy, ly, fov, push = 0, a = 0, b = 1) => (f) => {   // around the puppy (head x/z, fixed heights so the jump doesn't shake the camera): dir = world heading of the camera
    const r = dog.headWorld(), dd = d - push * ramp(f, a, b); return { pos: [r.x + Math.sin(dir) * dd, cy, r.z + Math.cos(dir) * dd], look: [r.x, ly, r.z], fov };
  };
  const WIDE = (a, b) => glide(a, b, C([0.4, 1.25, 2.7], [0.12, 0.95, -1.0], 46), C([0.32, 1.22, 2.45], [0.12, 0.95, -1.0], 46));
  const SIDE2 = (a, b) => glide(a, b, C([1.1, 1.15, 2.4], [0.45, 0.6, -0.8], 46), C([1.14, 1.15, 2.4], [0.45, 0.6, -0.8], 46));   // v4: 3/4 on him, not pure profile
  const KNEEL = (a, b) => glide(a, b, C([1.0, 0.95, 1.9], [0.5, 0.45, -0.7], 44), C([1.04, 0.95, 1.9], [0.5, 0.45, -0.7], 44));
  const SHOTS = [
    // hook: about one cut per 1.2 s
    { id: '01-door-opens-wide', a: 0, b: 28, cam: glide(0, 28, C([0.4, 1.25, 2.8], [0.1, 0.66, -1.2], 46), C([0.35, 1.22, 2.6], [0.1, 0.68, -1.2], 46)) },
    { id: '02-side-puppy-runs', a: 29, b: 52, cam: glide(29, 52, C([1.2, 0.7, 1.4], [0.3, 0.55, -0.8], 48), C([1.24, 0.7, 1.4], [0.3, 0.55, -0.8], 48)) },
    { id: '03-side-jumps-start', a: 53, b: 90, cam: glide(53, 90, C([1.55, 0.75, -0.3], [0.2, 0.62, -0.55], 50), C([1.59, 0.75, -0.3], [0.2, 0.62, -0.55], 50)) },
    { id: '04-jumps-at-legs', a: 91, b: 125, cam: glide(91, 125, C([-0.95, 0.7, -0.15], [0.2, 0.6, -0.6], 46), C([-0.87, 0.69, -0.2], [0.2, 0.6, -0.6], 46)) },
    { id: '05-wide-crazy', a: 126, b: 163, cam: glide(126, 163, C([1.0, 1.35, 2.3], [0.15, 0.57, -0.7], 50), C([0.9, 1.3, 2.1], [0.15, 0.58, -0.7], 50)) },
    { id: '06-low-side-jumps', a: 164, b: 192, cam: glide(164, 192, C([-1.4, 0.45, -0.25], [0.25, 0.55, -0.6], 50), C([-1.36, 0.45, -0.25], [0.25, 0.55, -0.6], 50)) },
    { id: '07-jumping-side', a: 193, b: 207, cam: glide(193, 207, C([1.5, 0.6, -0.4], [0.25, 0.55, -0.55], 48), C([1.54, 0.6, -0.4], [0.25, 0.55, -0.55], 48)) },
    { id: '08-spinning-low', a: 208, b: 225, cam: glide(208, 225, C([0.9, 0.8, 1.6], [0.25, 0.3, -0.5], 50), C([0.94, 0.8, 1.6], [0.25, 0.3, -0.5], 50)) },
    { id: '09-panting-face', a: 226, b: 257, cam: pupCam(4.6, 1.0, 0.62, 0.5, 40, 0, 226, 257) },
    { id: '10-pure-love-lean', a: 258, b: 289, cam: glide(258, 289, C([1.55, 1.0, 2.0], [0.2, 0.58, -0.65], 50), C([1.59, 1, 2], [0.2, 0.58, -0.65], 50)) },
    { id: '11-owner-smiles', a: 290, b: 321, cam: headCam(0.55, 1.6, -0.55, 40, 0, 290, 321) },
    { id: '12-fuss-side', a: 322, b: 355, cam: glide(322, 355, C([-0.95, 1.05, 1.45], [0.2, 0.56, -0.6], 54), C([-0.91, 1.05, 1.45], [0.2, 0.56, -0.6], 54)) },
    { id: '13-fuss-two-shot', a: 356, b: 387, cam: glide(356, 387, C([-0.55, 1.25, 1.0], [0.2, 0.75, -0.55], 48), C([-0.51, 1.25, 1.0], [0.2, 0.75, -0.55], 48)) },
    { id: '14-wound-up-high', a: 388, b: 414, cam: glide(388, 414, C([-0.75, 0.85, 1.9], [0.2, 0.54, -0.6], 54), C([-0.71, 0.85, 1.9], [0.2, 0.54, -0.6], 54)) },
    { id: '15-not-love-wide', a: 415, b: 445, cam: glide(415, 445, C([-0.6, 1.2, 2.2], [0.15, 0.57, -0.7], 50), C([-0.56, 1.2, 2.2], [0.15, 0.57, -0.7], 50)) },
    { id: '16-owner-love', a: 446, b: 466, cam: headCam(0.3, 1.5, -0.4, 40, 0, 446, 466) },
    { id: '17-stress-side', a: 467, b: 497, cam: glide(467, 497, C([-1.35, 0.55, -0.3], [0.2, 0.6, -0.55], 48), C([-1.31, 0.55, -0.3], [0.2, 0.6, -0.55], 48)) },
    { id: '18-stress-side', a: 498, b: 531, cam: glide(498, 531, C([1.5, 0.6, -0.3], [0.22, 0.6, -0.55], 46), C([1.38, 0.6, -0.33], [0.22, 0.6, -0.55], 46)) },
    // reset: the rule
    { id: '19-wall-clock', a: 532, b: 560, cam: glide(532, 560, C([-0.75, 1.62, 0.1], [-1.05, 1.83, -1.72], 40), C([-0.8, 1.64, -0.05], [-1.05, 1.83, -1.72], 38)) },
    { id: '20-puppy-waits-door', a: 561, b: 589, cam: glide(561, 589, C([0.75, 0.75, 1.3], [0.15, 0.3, -1], 46), C([0.79, 0.75, 1.3], [0.15, 0.3, -1], 46)) },
    // act 2
    { id: '21-door-opens-again', a: 590, b: 614, cam: glide(590, 614, C([1.5, 1.2, 1.4], [0.1, 0.7, -1.3], 48), C([1.4, 1.17, 1.25], [0.1, 0.7, -1.3], 48)) },
    { id: '22-ignore-side', a: 615, b: 645, cam: SIDE2(615, 645) },
    { id: '23-jumps-at-folded', a: 646, b: 670, cam: glide(646, 670, C([0.5, 0.6, 0.9], [0.45, 0.55, -0.8], 48), C([0.54, 0.6, 0.9], [0.45, 0.55, -0.8], 48)) },
    { id: '24-dont-look-head', a: 671, b: 696, cam: glide(671, 696, C([1.3, 1.95, 1.7], [0.38, 0.47, -0.8], 50), C([1.34, 1.95, 1.7], [0.38, 0.47, -0.8], 50)) },
    { id: '25-dont-touch-arms', a: 697, b: 730, cam: glide(697, 730, C([0.6, 1.2, 2.1], [0.3, 0.57, -0.85], 48), C([0.64, 1.2, 2.1], [0.3, 0.57, -0.85], 48)) },
    { id: '26-dont-talk-face', a: 731, b: 763, cam: headCam(-0.35, 1.65, 0.2, 38, 0, 731, 763) },
    { id: '27-hard-puppy-34', a: 764, b: 781, cam: glide(764, 781, C([1.4, 1.0, 1.8], [0.42, 0.58, -0.8], 50), C([1.44, 1, 1.8], [0.42, 0.58, -0.8], 50)) },
    { id: '28-hard-spin-low', a: 782, b: 807, cam: glide(782, 807, C([0.45, 0.55, 0.85], [0.6, 0.4, -0.72], 50), C([0.49, 0.55, 0.85], [0.6, 0.4, -0.72], 50)) },
    { id: '29-shoes-crouch', a: 808, b: 825, cam: glide(808, 825, C([0.45, 0.85, 1.65], [0.3, 0.5, -0.85], 44), C([0.49, 0.85, 1.65], [0.3, 0.5, -0.85], 44)) },
    { id: '30-shoes-on-mat', a: 826, b: 853, cam: glide(826, 853, C([-0.35, 0.95, -0.15], [0.05, 0.05, -1.35], 52), C([-0.31, 0.95, -0.15], [0.05, 0.05, -1.35], 52)) },
    { id: '31-keys-on-rack', a: 854, b: 861, cam: glide(854, 861, C([1.6, 1.5, -0.7], [0.7, 1.3, -1.5], 60), C([1.64, 1.5, -0.7], [0.7, 1.3, -1.5], 60)) },
    { id: '32-rack-insert', a: 862, b: 898, cam: glide(862, 898, C([0.9, 1.3, -0.9], [0.95, 1.32, -1.74], 36), C([0.94, 1.3, -0.9], [0.95, 1.32, -1.74], 36)) },
    { id: '33-wait-side', a: 899, b: 925, cam: SIDE2(899, 925) },
    { id: '34-calms-face', a: 926, b: 945, cam: pupCam(-0.3, 1.6, 0.62, 0.48, 44, 0, 926, 945) },
    { id: '35-four-paws-floor', a: 946, b: 975, cam: pupCam(-0.3, 1.7, 0.12, 0.06, 50, 0, 946, 975) },
    { id: '36-sits-medium', a: 976, b: 1002, cam: glide(976, 1002, C([1.35, 1.05, 2.55], [0.42, 0.60, -0.8], 46), C([1.39, 1.05, 2.55], [0.42, 0.60, -0.8], 46)) },
    { id: '37-call-gently-kneel', a: 1003, b: 1030, cam: SIDE2(1003, 1030) },
    { id: '38-owner-calls-gently', a: 1031, b: 1048, cam: headCam(1.1, 1.4, -0.5, 42, 0, 1031, 1048) },
    { id: '39-calm-pet', a: 1049, b: 1075, cam: KNEEL(1049, 1075) },
    { id: '40-pet-close', a: 1076, b: 1095, cam: pupCam(0.2, 1.15, 0.45, 0.42, 44, 0, 1076, 1095) },
    { id: '41-two-shot-34', a: 1096, b: 1135, cam: glide(1096, 1135, C([1.3, 0.75, 0.95], [0.4, 0.45, -0.8], 54), C([1.34, 0.75, 0.95], [0.4, 0.45, -0.8], 54)) },
    { id: '42-calm-34-wide', a: 1136, b: 1173, cam: glide(1136, 1173, C([1.3, 1.1, 1.6], [0.35, 0.6, -0.85], 46), C([1.34, 1.1, 1.6], [0.35, 0.6, -0.85], 46)) },
    { id: '43-normal-lies-down', a: 1174, b: 1219, cam: KNEEL(1174, 1219) },
    { id: '44-calm-two-shot', a: 1220, b: 1255, cam: glide(1220, 1255, C([1.4, 0.95, 1.35], [0.4, 0.34, -0.8], 50), C([1.3, 0.92, 1.2], [0.4, 0.34, -0.8], 50)) },
    { id: '45-happy-puppy-title', a: 1256, b: 1292, cam: pupCam(-1.0, 1.25, 0.55, 0.3, 44, 0.08, 1256, 1292) },
    { id: '46-cta-two-shot', a: 1293, b: 1349, cam: glide(1293, 1349, C([0.6, 0.95, 2.7], [0.45, 0.45, -0.8], 50), C([0.55, 0.92, 2.45], [0.45, 0.45, -0.8], 50)) },
    { id: '47-cta-two-shot-34', a: 1350, b: TOTAL - 1, cam: glide(1350, TOTAL - 1, C([1.6, 0.9, 2.45], [0.45, 0.5, -0.8], 48), C([1.55, 0.88, 2.3], [0.45, 0.5, -0.8], 48)) },
  ];
  const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

  const frame = (f) => {
    const S = shotAt(f), act1 = f < w.so, reset = f >= w.so && f < 588;
    const shoesOff = f >= 826;
    owner.setShoes(!shoesOff);
    const door = act1 ? ramp(f, 0, 14) * (1 - ramp(f, 62, 84)) : ramp(f, 588, 600) * (1 - ramp(f, 628, 650));
    hall.set({ door, keysOnHook: f >= 862, shoesOnMat: shoesOff, clock: 360 + f * 0.02 });
    owner.root.visible = !reset && !(f >= 588 && f < 596);   // v4: hidden until the door is half open
    const args = ownerArgs(f); owner.pose(args);
    dogFor(f, owner.info.head.clone());
    // hands: fuss (act 1), shoes (crouch at the ankles), keys to the rack, folded arms, calm pet
    const tg = {};
    if (act1) {
      const reachP = ramp(f, w.told + 6, w.told + 26), touch = ramp(f, w.but - 6, w.but + 4), hd = dog.boneWorld('head'), top = dog.boneWorld('top');
      
      // v2: once the puppy is at his feet both hands rest on the outside of his thighs (out of the close-ups' line to its face); then the right hand
      // hovers over its head and rubs it fast, the left (keys) stays on the thigh
      const thigh = (k) => { const I = owner.info[k], out = I.hip.clone().sub(owner.info.pelvis).setY(0).normalize(); return I.hip.clone().add(V(0, 0.12, 0)).addScaledVector(out, 0.2); };   // v4: hands on hips, above the jump arc
      const rest = ramp(f, 52, 64);
      if (rest > 0) {   // v4: hands rest on his hips; for the fuss he takes both front paws in his hands (never touches the head, the face stays clear)
        const pa = dog.boneWorld('flB'), pb = dog.boneWorld('frB'), [pl, pr] = pa.x > pb.x ? [pa, pb] : [pb, pa], t = reachP * lerp(0.6, 1, touch);
        const hold = (p, s) => p.clone().add(V(s * 0.04, -0.05 + 0.015 * Math.sin(f * 0.6), -0.06));   // mitten under the paw, on his side (away from the nose)
        tg.L = [thigh('L').lerp(hold(pl, 1), t), rest]; tg.R = [thigh('R').lerp(hold(pr, -1), t), rest];
      }
    } else if (!reset) {
      if (args.crouch > 0) { tg.L = [owner.info.L.A.clone().add(V(0, 0.05, 0)), args.crouch]; tg.R = [owner.info.R.A.clone().add(V(0, 0.05, 0)), args.crouch]; }
      const rk = ramp(f, 848, 860) * (1 - ramp(f, 866, 876));
      if (rk > 0) tg.L = [hall.pts().rack.add(V(0, -0.04, 0.02)), rk];
      if (args.fold > 0) { tg.L = ['foldL', args.fold]; tg.R = ['foldR', args.fold]; }
      const pet = ramp(f, w.calm - 6, w.calm + 6) * (1 - ramp(f, w.normal + 6, w.normal + 24));
      if (pet > 0) { const a = dog.boneWorld('sp3'), b = dog.boneWorld('sp1'); tg.R = [a.clone().lerp(b, 0.5 + 0.5 * Math.sin((f - w.calm) * 0.16)).add(V(0, 0.12, 0)), pet]; }   // v4: strokes along the back only
      const rest2 = ramp(f, w.normal + 6, w.normal + 24);
      if (rest2 > 0) { const K = owner.info.L.K.clone().add(V(0, 0.07, 0)); tg.R = [K.clone().add(V(0.02, 0, 0.06)), rest2]; tg.L = [K.clone().add(V(-0.02, 0, -0.06)), rest2]; }   // v4: lying -> both hands rest on his raised knee
    }
    if (Object.keys(tg).length) owner.reach(args, tg);
    return { ...S.cam(f), vig: 0.22 };
  };
  return { TOTAL, frame, shotAt, after: (f) => cap.render(f), probe: () => ({ dog: dog.headWorld(), owner: owner.info.head.clone(), ownerVis: owner.root.visible }) };   // probe: work/probe.mjs (caption / edge checks)
}
