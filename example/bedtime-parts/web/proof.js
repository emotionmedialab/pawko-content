// Proof scenes for the bedtime parts. Each PROOFS[x](ctx) builds its scene and returns { TOTAL, frame(f) -> camera, after?(f) }.
import { createBedroom } from './bedroom3d.js';
import { createOwner } from './owner3d.js';
import { createForest } from './forest3d.js';
import { createCaptions } from './captions.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const ramp = (f, a, b) => sm((f - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const rad = (d) => d * Math.PI / 180;
const breathe = (f) => 0.5 + 0.5 * Math.sin(f * 0.16);
const blinkAt = (f) => ((f % 70) < 3 ? 1 : 0);
// owner pose with a hand reaching a world target: pose once for the rest hand, then again with the hand blended toward the target
const reachPose = (owner, args, key, target, t) => {
  if (t <= 0) return owner.pose(args);
  owner.pose(args); const h0 = owner.info[key].H.clone();
  owner.pose({ ...args, ik: { ...(args.ik || {}), [key]: h0.lerp(target, t) } });
};
// puppy brighter at night (toon-lit brown goes almost black): a little self-light on its material
const lightDog = (dog, on) => dog.mesh.material.emissive?.set(on ? '#2a2430' : '#000000');

export const PROOFS = {
  // face test (not a deliverable): sleeping face, side-lying face, sitting face
  async z({ THREE, scene, toon, dog }) {
    const room = createBedroom(THREE, scene, { toon }), owner = createOwner(THREE, scene, { toon }); dog.root.visible = false;
    const W = [{ sleep: 1 }, { side: 1 }, { sit: 1 }], C = [[-0.1, 1.5, -0.1], [-1.0, 1.4, -0.3], [0.2, 1.4, 0.8]], L = [[-0.1, 0.85, -0.8], [-0.35, 0.85, -0.8], [-0.05, 1.3, -0.58]];
    return { TOTAL: 3, frame(f) { owner.pose({ w: W[f], blink: f === 2 ? 0 : 1, smile: 0.6 }); room.set({ light: 'night', lamp: 1, cover: -0.05, caps: owner.capsules() }); return { pos: C[f], look: L[f], fov: 30 }; } };
  },

  // (a) owner asleep in bed -> turns toward the lamp, reaches, lamp off, back, pulls the blanket up, asleep in the dark
  async a({ THREE, scene, toon, dog }) {
    const room = createBedroom(THREE, scene, { toon }), owner = createOwner(THREE, scene, { toon });
    dog.root.visible = false;
    return { TOTAL: 120, frame(f) {
      const turn = ramp(f, 12, 36) * (1 - ramp(f, 74, 94)), lamp = 1 - ramp(f, 58, 62);
      const reach = ramp(f, 30, 50) * (1 - ramp(f, 64, 78)), pull = ramp(f, 96, 110);
      const cover = lerp(-0.05, -0.5, pull);
      const args = { w: { sleep: 1 - turn, side: turn }, breath: breathe(f), blink: f < 30 ? 1 : f < 80 ? 0.15 : 1 };
      if (pull > 0) { owner.pose({ ...args, blink: 1 }); room.set({ light: 'night', lamp, cover, caps: owner.capsules() }); const pts = room.pts(), H = owner.info;
        owner.pose({ ...args, ik: { L: H.L.H.clone().lerp(pts.edge(1), pull), R: H.R.H.clone().lerp(pts.edge(-1), pull) } }); }
      else reachPose(owner, args, 'L', room.pts().lampSwitch, reach);
      room.set({ light: 'night', lamp, cover, caps: owner.capsules() });
      const c = ramp(f, 0, 120);
      return { pos: [lerp(-1.3, -1.0, c), 2.1, lerp(2.9, 2.6, c)], look: [-0.6, 0.8, -0.5], fov: 38 };
    } };
  },

  // (b) owner sits up, the puppy trots to the lap and turns to the camera, the owner hugs it
  async b({ THREE, scene, toon, dog }) {
    const room = createBedroom(THREE, scene, { toon }), owner = createOwner(THREE, scene, { toon });
    lightDog(dog, true); dog.root.visible = true;
    return { TOTAL: 120, frame(f) {
      const up = ramp(f, 6, 36), hug = ramp(f, 62, 90);
      const args = { w: { sleep: 1 - up, sit: up * (1 - hug), hug: up * hug }, breath: breathe(f), blink: lerp(1, blinkAt(f) * 0.9, ramp(f, 8, 22)) };
      owner.pose(args); room.set({ light: 'night', lamp: 1, cover: lerp(-0.3, -0.3, up), caps: owner.capsules() });
      // puppy on the duvet: starts at the foot facing the owner, walks to the lap and turns to face the camera (3/4 front)
      const walk = ramp(f, 30, 66), turn = ramp(f, 50, 70);
      const p = new THREE.Vector3(lerp(0.05, -0.05, walk), 0, lerp(0.55, -0.12, walk)); p.y = room.heightAt(p.x, p.z) - 0.005;
      dog.root.position.copy(p); dog.root.rotation.set(0, lerp(Math.PI, 0.3, turn), 0); dog.root.updateMatrixWorld(true);
      dog.pose({ w: { sit: 1 }, look: new THREE.Vector3(0.9, 1.3, 2.4), neck: 1, aimEyes: true, jaw: 0.35 * hug, wag: Math.sin(f * 0.5) * 0.7, tail: 0.3, blink: blinkAt(f + 20), breath: breathe(f), ears: -0.3 });
      if (hug > 0) {
        const c = dog.boneWorld('top');
        owner.pose({ ...args, ik: { L: c.clone().add(new THREE.Vector3(0.11, -0.04, -0.04)), R: c.clone().add(new THREE.Vector3(-0.11, -0.04, -0.04)) } });
        room.set({ light: 'night', lamp: 1, cover: -0.3, caps: owner.capsules() });
      }
      const cc = ramp(f, 30, 110);
      return { pos: [lerp(1.7, 0.75, cc), lerp(1.9, 1.5, cc), lerp(3.0, 2.2, cc)], look: [-0.1, lerp(0.7, 0.95, up), -0.35], fov: 42 };
    } };
  },

  // (c) night forest: sleeping wolf pack, one watcher, glowing eyes, a grass patch flattening
  async c({ THREE, scene, toon, dog }) {
    dog.root.visible = false;
    const forest = createForest(THREE, scene, { toon });
    return { TOTAL: 90, frame(f) {
      forest.set({ t: f / 30, grass: { at: [-1.6, -0.3], r: 0.8, amt: ramp(f, 40, 66), dir: 0.9 }, watch: { look: [3 + Math.sin(f * 0.07) * 1.2, 0.6, -0.6 - Math.sin(f * 0.07) * 2.5], flick: f % 50 > 44 }, eyes: ramp(f, 5, 40) });
      const c = ramp(f, 0, 90);
      return { pos: [lerp(-0.3, 0.1, c), lerp(3.3, 3.1, c), lerp(5.5, 5.1, c)], look: [-0.15, 0.2, -0.4], fov: 48 };
    } };
  },

  // (d) alarm clock: 23:00 at night, hard cut to 07:00 in daylight
  async d({ THREE, scene, toon, dog }) {
    const room = createBedroom(THREE, scene, { toon }); dog.root.visible = false;
    return { TOTAL: 90, frame(f) {
      const day = f >= 45;
      room.set({ light: day ? 'day' : 'night', lamp: day ? 0 : 1, clock: day ? '07:00' : '23:00', colon: Math.floor(f / 15) % 2 === 0 });
      const c = (f % 45) / 45;
      return { pos: [lerp(-0.6, -0.68, c), 0.8, lerp(0.45, 0.36, c)], look: [-0.86, 0.6, -0.25], fov: 44 };
    } };
  },

  // (e) captions + pop text + title card over the bedroom (door creaks open)
  async e({ THREE, scene, renderer, toon, dog }) {
    const room = createBedroom(THREE, scene, { toon }), owner = createOwner(THREE, scene, { toon });
    lightDog(dog, true);
    const words = [['Dogs', 0.15, 0.5], ['sleep', 0.5, 0.85], ['right', 0.9, 1.15], ['at', 1.15, 1.3], ['your', 1.3, 1.55], ['feet.', 1.6, 2.1], ['Always.', 2.9, 3.5]].map(([w, s, e]) => ({ w, s, e }));
    const cap = createCaptions(THREE, renderer, { words, hi: ['feet', 'always'] });
    cap.pop({ text: 'CREAK!', a: 20, b: 58, at: [400, 300], angle: -8, size: 150 });
    cap.title({ text: 'AT YOUR\nFEET!', a: 70, b: 119, at: [540, 330] });
    return { TOTAL: 120, after: (f) => cap.render(f), frame(f) {
      owner.pose({ w: { sleep: 1 }, breath: breathe(f), blink: 1 });
      room.set({ light: 'night', lamp: 0, door: ramp(f, 18, 60) * 0.3, cover: -0.3, caps: owner.capsules() });
      const p = new THREE.Vector3(0.1, 0, 0.5); p.y = room.heightAt(p.x, p.z) - 0.005;   // the puppy lies on the duvet at the owner's feet, head on its paws, facing the camera
      dog.root.visible = true; dog.root.position.copy(p); dog.root.rotation.set(0, 0.3, 0); dog.root.updateMatrixWorld(true);
      dog.pose({ w: { down: 1 }, look: new THREE.Vector3(0.5, p.y + 0.1, 2.4), neck: 0.6, breath: breathe(f + 9), blink: 1, wag: 0, ears: 0.2 });
      const c = ramp(f, 0, 120);
      return { pos: [lerp(0.6, 0.35, c), 2.3, lerp(2.9, 2.6, c)], look: [-0.3, 0.7, -0.15], fov: 42 };
    } };
  },
};
