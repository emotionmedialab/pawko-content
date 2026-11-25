// "At Your Feet" reel (55.44 s, 1663 frames). Every frame is a pure function of f. Word frames (from work/words.json, sentence-start words re-dated to silence_end):
// job 139 | wild 191 | watch 321 | night 373 | light 411 | blanket 442 | fast 482 | safe 580 | danger 650 | protect 709 | circles 778 | grass 868
// lies 910 | feet 936 | door 1024 | noise 1142 | breathing 1218 | safe2 1273 | alarm 1327 | jumps 1366 | night2 1507 | feet2 1606 | door2 1638
import { createBedroom } from './bedroom3d.js';
import { createOwner } from './owner3d.js';
import { createForest } from './forest3d.js';
import { createCaptions } from './captions.js';
import { makeDog } from './dogrig.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const ramp = (f, a, b) => sm((f - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const breathe = (f) => 0.5 + 0.5 * Math.sin(f * 0.16);
const blinkAt = (f) => ((f % 70) < 3 ? 1 : 0);
const reachPose = (owner, args, key, target, t) => {
  if (t <= 0) return owner.pose(args);
  owner.pose(args); const h0 = owner.info[key].H.clone();
  owner.pose({ ...args, ik: { ...(args.ik || {}), [key]: h0.lerp(target, t) } });
};
// camera glide between two {pos,look,fov} over the shot
const glide = (a, b, A, B) => (f) => { const t = ramp(f, a, b); return { pos: L3(A.pos, B.pos, t), look: L3(A.look, B.look, t), fov: lerp(A.fov, B.fov, t) }; };
const C = (pos, look, fov) => ({ pos, look, fov });
const DOOR = [-1.5, 1.0, -1.9];   // the bedroom's real door (back wall)

export async function build({ THREE, scene, renderer, toon, dog, loadGltf, ndSkin, grad }) {
  const room = createBedroom(THREE, scene, { toon }), owner = createOwner(THREE, scene, { toon }), forest = createForest(THREE, scene, { toon });
  const fog = scene.fog;
  // wolves = the puppy rig recoloured grey/silver (grey-scaled texture, cream belly kept from the lighter parts), 1.3x the puppy; the primitive wolves are hidden
  forest.pack.forEach((w) => { w.g.visible = false; }); forest.watch.g.visible = false;
  const wolves = [];
  for (const [x, z, yaw, k] of [[-0.7, 0.2, 0.3, 1.05], [-0.2, 0.5, -0.25, 1.1], [-0.35, -0.2, 2.5, 1.05], [0.2, 0.1, -1.2, 1], [0.85, -0.5, 1.1, 1.1]]) {
    const g = await loadGltf(), w = makeDog(g, { scale: 2.1 * k });
    g.scene.traverse((o) => {
      if (!o.isMesh) return;
      const img = o.material.map?.image; let map = null;
      if (img) { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const cx = c.getContext('2d'); cx.filter = 'grayscale(1) contrast(1.3) brightness(0.95)'; cx.drawImage(img, 0, 0);
        map = new THREE.CanvasTexture(c); map.flipY = o.material.map.flipY; map.colorSpace = THREE.SRGBColorSpace; }
      o.material = new THREE.MeshToonMaterial({ gradientMap: grad, map, color: '#b4bed6', emissive: '#141c2c', side: THREE.DoubleSide });
      o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; o.userData.nd = ndSkin;
    });
    w.root.position.set(x, 0, z); w.root.rotation.set(0, yaw, 0); forest.root.add(w.root); wolves.push({ w, x, z, yaw });
  }

  const words = await (await fetch('words.json')).json();
  const cap = createCaptions(THREE, renderer, { words, hi: ['job', 'watch', 'danger', 'circles', 'door', 'noise', 'breathing', 'safe', 'night', 'feet', 'grass', 'wild'], fps: 30 });
  cap.pop({ text: 'Zzz', a: 462, b: 534, at: [300, 640], angle: -8, size: 130 });
  cap.pop({ text: 'CREAK!', a: 1070, b: 1112, at: [330, 250], angle: -8, size: 150 });
  cap.pop({ text: 'VROOM', a: 1126, b: 1164, at: [330, 250], angle: 5, size: 150 });
  cap.pop({ text: 'Zzz', a: 700, b: 747, at: [840, 600], angle: 8, size: 120 });
  cap.pop({ text: 'RING!', a: 1328, b: 1352, at: [540, 330], angle: 6, size: 160 });
  cap.pop({ text: '♥', a: 1486, b: 1530, at: [250, 560], angle: -10, size: 170, color: '#ff6b8a' });
  cap.pop({ text: '♥', a: 1500, b: 1545, at: [830, 440], angle: 10, size: 140, color: '#ff6b8a' });
  cap.title({ text: 'AT YOUR\nFEET!', a: 1606, b: 1662, at: [540, 250] });

  const sweep = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.8), new THREE.MeshBasicMaterial({ color: '#fff2c0', transparent: true, opacity: 0, depthWrite: false, fog: false }));
  sweep.userData.ndSkip = true; sweep.position.set(0, 1.4, -1.8); sweep.rotation.z = 0.25; scene.add(sweep);
  const lightDog = (on) => dog.mesh.material.emissive?.set(on ? '#2a2430' : '#000000');
  const place = (x, z, yaw, lift = 0) => { dog.root.position.set(x, room.heightAt(x, z) - 0.005 + lift, z); dog.root.rotation.set(0, yaw, 0); dog.root.updateMatrixWorld(true); };
  // lie ON the duvet: ride on the highest duvet point under the body
  const placeOn = (x, z, yaw) => {
    const fx = Math.sin(yaw), fz = Math.cos(yaw); let h = 0;
    for (const [a, b] of [[0, 0], [0.22, 0], [-0.22, 0], [0, 0.1], [0, -0.1]]) h = Math.max(h, room.heightAt(x + fx * a + fz * b, z + fz * a - fx * b));
    dog.root.position.set(x, h - 0.012, z); dog.root.rotation.set(0, yaw, 0); dog.root.updateMatrixWorld(true);
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---------- shots ----------
  const cam1 = glide(0, 185, C([1.0, 2.2, 3.0], [-0.15, 0.7, 0.05], 42), C([0.55, 1.95, 2.6], [-0.2, 0.68, 0.1], 40));
  const SHOTS = [
    { id: '1-hook-bed-lamp', a: 0, b: 184, k: 'room', cam: cam1 },
    { id: '2a-pack-huddle', a: 185, b: 287, k: 'forest', cam: glide(185, 287, C([0.1, 3.0, 5.0], [0.25, 0.2, -0.2], 48), C([0.3, 2.8, 4.7], [0.25, 0.2, -0.2], 48)) },
    { id: '2b-watcher', a: 288, b: 362, k: 'forest', cam: glide(288, 362, C([1.2, 1.6, 5.8], [0.4, 0.45, -0.3], 46), C([1.1, 1.55, 5.7], [0.4, 0.45, -0.3], 46)) },
    { id: '3a-clock-2300', a: 363, b: 387, k: 'room', dog: false, cam: glide(363, 387, C([-0.6, 0.8, 0.45], [-0.86, 0.6, -0.25], 44), C([-0.68, 0.8, 0.36], [-0.86, 0.6, -0.25], 44)) },
    { id: '3b-lamp-off-blanket', a: 388, b: 533, k: 'room', dog: false, cam: glide(388, 533, C([-1.3, 2.1, 2.9], [-0.6, 0.8, -0.5], 38), C([-1.0, 2.0, 2.6], [-0.5, 0.75, -0.4], 38)) },
    { id: '4-puppy-lifts-head', a: 534, b: 609, k: 'room', cam: glide(534, 609, C([0.2, 1.2, 3.3], [-0.2, 0.8, 0.3], 40), C([0.1, 1.15, 3.0], [-0.2, 0.8, 0.3], 40)) },
    { id: '5a-glowing-eyes', a: 610, b: 688, k: 'forest', cam: glide(610, 688, C([0.3, 2.0, 5.8], [0.2, 0.7, -2.5], 50), C([0.3, 1.9, 5.4], [0.2, 0.7, -2.5], 50)) },
    { id: '5b-owner-defenceless', a: 689, b: 747, k: 'room', cam: glide(689, 747, C([0.9, 2.4, 3.0], [-0.2, 0.8, -0.3], 36), C([0.6, 2.2, 2.6], [-0.2, 0.8, -0.3], 36)) },
    { id: '6a-circles-on-bed', a: 748, b: 821, k: 'room', cam: glide(748, 821, C([0.6, 3.0, 2.7], [0.0, 0.55, 0.4], 42), C([0.4, 2.9, 2.5], [0.0, 0.55, 0.4], 42)) },
    { id: '6b-tall-grass', a: 822, b: 903, k: 'forest', cam: glide(822, 903, C([0.3, 2.6, 5.3], [-0.15, 0.25, -0.1], 52), C([0.1, 2.4, 5.0], [-0.15, 0.25, -0.1], 52)) },
    { id: '7-lies-at-feet-door', a: 904, b: 1065, k: 'room', cam: glide(904, 1065, C([0.9, 1.4, 3.4], [-0.3, 0.75, 0.2], 44), C([0.4, 1.3, 3.0], [-0.5, 0.8, 0.3], 40)) },
    { id: '8-head-up-creak', a: 1066, b: 1178, k: 'room', cam: glide(1066, 1178, C([-0.2, 1.1, 2.9], [-0.3, 1.0, 0.2], 58), C([-0.2, 1.05, 2.6], [-0.3, 1.0, 0.2], 58)) },
    { id: '9-breathing-calm', a: 1179, b: 1313, k: 'room', cam: glide(1179, 1313, C([0.1, 1.9, 3.3], [0.0, 0.65, -0.1], 40), C([0.1, 1.7, 3.0], [0.0, 0.65, -0.1], 40)) },
    { id: '10a-clock-0700', a: 1314, b: 1351, k: 'room', dog: false, cam: glide(1314, 1351, C([-0.6, 0.8, 0.45], [-0.86, 0.6, -0.25], 44), C([-0.68, 0.8, 0.36], [-0.86, 0.6, -0.25], 44)) },
    { id: '10b-sits-up-puppy-jumps', a: 1352, b: 1474, k: 'room', cam: glide(1352, 1474, C([1.7, 1.9, 3.0], [-0.1, 0.7, -0.35], 42), C([0.75, 1.5, 2.2], [-0.1, 0.95, -0.35], 42)) },
    { id: '11-hug-hearts', a: 1475, b: 1548, k: 'room', cam: glide(1475, 1548, C([0.5, 1.2, 1.9], [-0.05, 0.9, -0.3], 42), C([0.3, 1.15, 1.7], [-0.05, 0.93, -0.3], 42)) },
    { id: '12-at-your-feet-title', a: 1549, b: 1662, k: 'room', cam: glide(1549, 1662, C([0.6, 2.3, 2.9], [-0.3, 0.55, -0.15], 42), C([0.35, 2.3, 2.6], [-0.3, 0.55, -0.15], 42)) },
  ];
  const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

  // ---------- owner / room state ----------
  const ownerState = (f) => {
    let o = { light: 'night', lamp: 0, cover: -0.5, clock: '23:00', door: 0, w: { sleep: 1 }, ik: null, blink: 1 };
    if (f < 363) o = { ...o, lamp: 1, cover: -0.05 };
    else if (f < 446) {
      const turn = ramp(f, 388, 402) * (1 - ramp(f, 412, 428)), lamp = f < 404 ? 1 : 0, reach = ramp(f, 394, 404) * (1 - ramp(f, 408, 418)), pull = ramp(f, 430, 446);
      o = { ...o, lamp, cover: lerp(-0.05, -0.5, pull), w: { sleep: 1 - turn, side: turn }, reach, pull, blink: f < 388 ? 1 : f < 430 ? 0.15 : 1 };
    } else if (f >= 1314 && f < 1549) {
      const up = ramp(f, 1352, 1380), hug = ramp(f, 1425, 1452);
      o = { ...o, light: 'day', cover: -0.3, clock: '07:00', w: { sleep: 1 - up, sit: up * (1 - hug), hug: up * hug }, blink: f < 1352 ? 1 : lerp(1, blinkAt(f) * 0.9, ramp(f, 1354, 1368)) };
    }
    if (f >= 1066 && f < 1179) o.door = ramp(f, 1070, 1095) * 0.3 + ramp(f, 1138, 1150) * 0.3 - ramp(f, 1165, 1178) * 0.25;
    return o;
  };

  // ---------- puppy state ----------
  const doorPt = V(...DOOR), nestLook = () => dog.root.localToWorld(V(0.28, 0, -0.28));
  const dogFor = (f, S) => {
    const night = S.light === 'night'; lightDog(night);
    const base = { breath: breathe(f + 9), blink: blinkAt(f + 20), wag: 0, ears: 0.2 };
    const CAMP = V(1.0, 1.0, 3.0), ahead = () => dog.root.localToWorld(V(0.05, 0.12, 0.7)), YD = -1.55;   // YD: lies facing left (toward the door side), profile to the foot-end camera
    if (f < 363) {   // hook: faces the camera at the owner's feet, settles to sleep, lifts his head at "job"
      const up = ramp(f, 139, 168), sleep = ramp(f, 70, 100) * (1 - up);
      placeOn(0.0, 0.55, 0.9);
      dog.pose({ ...base, w: { down: 1 }, look: CAMP.clone().lerp(ahead(), ramp(f, 40, 100) * (1 - up)), neck: 0.8, aimEyes: true, blink: lerp(base.blink, 1, sleep), tail: 0.1, wag: Math.sin(f * 0.3) * 0.3 * (1 - sleep) });
    } else if (f < 534) {   // asleep at the feet
      placeOn(0.0, 0.55, YD); dog.pose({ ...base, w: { down: 1 }, look: ahead(), neck: 0.7, aimEyes: true, blink: 1 });
    } else if (f < 748) {   // wakes, head up toward the door
      const up = ramp(f, 540, 575), wake = ramp(f, 534, 548);
      placeOn(0.0, 0.55, YD);
      const l = ahead().lerp(doorPt, up * 0.5).add(V(0, 0.3 * up, 0));
      dog.pose({ ...base, w: { down: 1 }, look: l, neck: 0.6, aimEyes: true, ears: lerp(0.2, -0.5, up) + (f % 80 > 72 ? 0.5 : 0), blink: lerp(1, base.blink, wake) });
    } else if (f < 822) {   // walks in circles on the duvet
      const t = (f - 748) / 74, th = 2 * Math.PI * 2.1 * sm(t * 0.9 + 0.05), r = 0.2, cx = 0.0, cz = 0.4;
      const x = cx + r * Math.cos(th), z = cz + r * Math.sin(th), yaw = Math.atan2(-Math.sin(th), Math.cos(th));
      place(x, z, yaw); dog.pose({ ...base, w: { stand: 1 }, gait: { phase: th * r / 0.32, amp: 22, lift: 1, k: 1 }, look: null, wag: Math.sin(f * 0.4) * 0.5 });
    } else if (f < 1314) {   // turns, lies down at the feet facing the door side, head up at every noise
      const turn = ramp(f, 904, 928), down = ramp(f, 912, 942);
      placeOn(0.0, 0.55, lerp(1.2, YD, turn));
      const k = f < 930 ? 1 - ramp(f, 914, 930) : 0;
      const alert = f < 1066 ? 0 : Math.max(ramp(f, 1088, 1096) * (1 - ramp(f, 1130, 1140)), ramp(f, 1140, 1147) * (1 - ramp(f, 1168, 1178)));
      const sway = f < 1066 ? ramp(f, 950, 990) * 0.25 * Math.sin((f - 950) * 0.05) : 0;
      const l = ahead().lerp(doorPt, 0.35 * ramp(f, 960, 1000) + 0.35 * alert).add(V(0, 0.3 * alert + 0.05 * sway, 0));
      const calm = f >= 1179 ? ramp(f, 1230, 1280) : 0, slow = breathe(f * 0.6) > 0.6 ? 0.85 : 0;
      dog.pose({ ...base, w: { stand: 1 - down, down }, gait: k > 0 ? { phase: f * 0.05, amp: 12, lift: 1, k } : null, look: l, aimEyes: true, neck: 0.55 + 0.2 * alert, ears: 0.2 - 0.8 * alert + ((f % 70) > 62 ? -0.5 : 0), blink: f < 1179 ? blinkAt(f + 20) * (1 - alert) : lerp(blinkAt(f + 20), slow, calm), wag: f > 1000 && f < 1060 ? Math.sin(f * 0.3) * 0.4 : 0, tail: f > 1000 && f < 1060 ? 0.2 : 0 });
    } else if (f < 1549) {   // alarm: runs up to the owner, hops into the lap, hug
      const walk = ramp(f, 1366, 1400), turn = ramp(f, 1384, 1404), up = ramp(f, 1352, 1366);
      const x = lerp(0.05, -0.05, walk), z = lerp(0.55, -0.12, walk), hop = Math.max(0, Math.sin(clamp((f - 1386) / 14) * Math.PI)) * 0.14 * (f < 1400 ? 1 : 0);
      place(x, z, lerp(Math.PI, 0.3, turn), hop);
      const moving = walk > 0 && walk < 1 ? 1 : 0, hug = ramp(f, 1425, 1452);
      const wsit = ramp(f, 1388, 1402);
      dog.pose({ ...base, w: { down: (1 - up) , stand: up * (1 - wsit), sit: up * wsit }, gait: moving ? { phase: f * 0.09, amp: 26, lift: 1, k: 1 } : null, look: V(0.9, 1.3, 2.4).lerp(V(0.9, 0.85, 2.4), ramp(f, 1400, 1430)), neck: 1, aimEyes: true, jaw: 0.35 * hug, wag: Math.sin(f * 0.5) * 0.7, tail: 0.3, ears: -0.3 });
    } else {   // finale: lies at the feet, looks to the camera, then to the door
      placeOn(0.0, 0.55, -1.2);
      const dl = ramp(f, 1618, 1640);
      dog.pose({ ...base, w: { down: 1 }, look: CAMP.clone().lerp(doorPt, dl), aimEyes: true, neck: 0.7, ears: 0.2 + (f % 60 > 54 ? -0.5 : 0), wag: 0 });
    }
  };

  const frame = (f) => {
    const S = shotAt(f), isRoom = S.k === 'room';
    room.root.visible = owner.root.visible = isRoom; forest.root.visible = !isRoom; dog.root.visible = isRoom && S.dog !== false;
    scene.fog = isRoom ? null : fog;
    const o = ownerState(f);
    { const t = clamp((f - 1128) / 34); sweep.visible = isRoom && t > 0 && t < 1; sweep.position.x = lerp(2.2, -2.2, t); sweep.material.opacity = 0.35 * Math.sin(Math.PI * t); }
    owner.M.skin.emissive.set(o.light === 'night' ? '#4a3a3a' : '#000000');
    if (isRoom) {
      const args = { w: o.w, breath: breathe(f), blink: o.blink, smile: o.w.sit || o.w.hug ? undefined : 0.3 };
      if (f >= 388 && f < 446) {
        if (o.pull > 0) { owner.pose({ ...args, blink: 1 }); room.set({ light: o.light, lamp: o.lamp, cover: o.cover, caps: owner.capsules() }); const pts = room.pts(), H = owner.info;
          owner.pose({ ...args, ik: { L: H.L.H.clone().lerp(pts.edge(1), o.pull), R: H.R.H.clone().lerp(pts.edge(-1), o.pull) } }); }
        else reachPose(owner, args, 'L', room.pts().lampSwitch, o.reach);
      } else owner.pose(args);
      room.set({ light: o.light, lamp: o.lamp, door: o.door, clock: f >= 1314 && f < 1352 ? '07:00' : '23:00', colon: Math.floor(f / 15) % 2 === 0, cover: o.cover, caps: owner.capsules() });
      if (S.dog !== false) {
        dogFor(f, o);
        if (f >= 1425 && f < 1549) {   // hug: the owner's hands go to the puppy's sides
          const c = dog.boneWorld('top');
          owner.pose({ ...args, ik: { L: c.clone().add(V(0.11, -0.04, -0.04)), R: c.clone().add(V(-0.11, -0.04, -0.04)) } });
          room.set({ light: o.light, lamp: 0, cover: o.cover, clock: '07:00', caps: owner.capsules() });
        }
      }
      if (S.id.startsWith('7') || S.id.startsWith('8') || S.id.startsWith('9')) room.set({ light: o.light, lamp: 0, door: o.door, cover: o.cover, caps: owner.capsules() });
    } else {
      scene.background.set('#16244c');
      const look = f < 362 ? { look: [3 + Math.sin(f * 0.07) * 1.2, 0.6, -0.6 - Math.sin(f * 0.07) * 2.5], flick: f % 50 > 44 } : f < 700 ? { look: [3, 0.5, -3 + Math.sin(f * 0.08) * 2], flick: f % 40 > 34 } : { look: [3, 0.6, -0.6], flick: false };
      const eyes = f >= 610 && f < 700 ? ramp(f, 615, 655) : 0;
      const grass = f >= 822 ? { at: [-1.6, -0.3], r: 0.9, amt: ramp(f, 826, 884), dir: 0.9 } : f >= 185 && f < 362 ? { at: [-1.6, -0.3], r: 0.8, amt: 0, dir: 0.9 } : { at: [-1.6, -0.3], r: 0.8, amt: 0, dir: 0.9 };
      forest.set({ t: f / 30, grass, watch: look, eyes });
      wolves.forEach(({ w, x, z, yaw }, i) => {
        const t = f / 30, b = { breath: 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7) };
        w.root.position.set(x, 0, z); w.root.rotation.set(0, yaw, 0); w.root.updateMatrixWorld(true);
        if (i < 4) w.pose({ ...b, w: { down: 1 }, look: w.root.localToWorld(V(0.05, 0.1, 0.8)), neck: 0.7, aimEyes: true, blink: 1, ears: 0.3, wag: 0 });
        else {   // watcher: sits up, head up, scans, ears flick
          const lk = look.look; w.pose({ ...b, w: { sit: 1 }, look: V(lk[0], 0.75, lk[2]), neck: 0.9, aimEyes: true, blink: (f % 70) < 3 ? 1 : 0, ears: -0.4 + (look.flick ? 0.6 : 0), wag: 0 });
        }
      });
    }
    return { ...S.cam(f), vig: 0.22 };
  };
  return { TOTAL: 1663, frame, shotAt, after: (f) => cap.render(f) };
}
