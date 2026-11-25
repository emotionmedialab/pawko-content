// ---------- cameras (locked library: keys copied from right-paw / dog-down-ii, only timing changed) ----------
const FRONT = [{ f: 0, pos: [1.34, 0.86, 0.4], look: [0.2, 0.5, 0.0], fov: 46 }, { f: 1, pos: [1.28, 0.83, 0.38], look: [0.2, 0.5, 0.0], fov: 46 }];
const two = (a, b, k0, k1) => [{ ...k0, f: a }, { ...k1, f: b }];
const SIDE0 = { pos: [0.66, 0.5, 1.5], look: [0.14, 0.34, 0.05], fov: 44 }, SIDE1 = { pos: [0.6, 0.54, 1.55], look: [0.14, 0.37, 0.05], fov: 44 };   // the locked 3/4 side shot (dog-down-ii popUp)
const CAMS = {
  hook: [{ f: 0, pos: [0.18, 0.86, 2.4], look: [0.22, 0.56, -0.45], fov: 43 }, { f: w.grab - 1, pos: [0.2, 0.84, 2.25], look: [0.23, 0.56, -0.45], fov: 43 }],
  // from the treat jar on the stool, hard cut to the puppy on the mat
  setup: [{ f: w.grab, pos: [2.45, 0.92, 0.2], look: [1.85, 0.64, -0.75], fov: 40 }, { f: w.tiny - 2, pos: [2.38, 0.9, 0.1], look: [1.85, 0.62, -0.75], fov: 40 },
    { ...SIDE0, f: w.tiny - 1 }, { ...SIDE1, f: w.stick - 1 }],
  // POV from the dog's right side (3/4 front): the right paw swipes across the muzzle toward the camera
  stick: two(w.stick, w.when - 1, SIDE0, SIDE1),
  swipe: two(w.when, w.reward1 - 1, SIDE0, SIDE1),
  reward: two(w.reward1, w.next - 1, { pos: [1.12, 0.67, 0.9], look: [0.24, 0.36, 0.04], fov: 42 }, { pos: [1.08, 0.65, 0.86], look: [0.25, 0.36, 0.04], fov: 42 }),
  small: two(w.next, w.then - 1, SIDE0, SIDE1),
  hand: two(w.then, w.say1 - 1, SIDE0, SIDE1),
  cue: two(w.say1, w.if - 1, SIDE0, SIDE1),
  wrong: two(w.if, w.take - 1, SIDE0, SIDE1),
  fix: two(w.take, w.say2 - 1, SIDE0, SIDE1),
  yes: [{ f: w.say2, pos: [0.08, 0.82, 2.15], look: [0.12, 0.5, -0.3], fov: 42 }, { f: w.then2 - 1, pos: [0.12, 0.78, 1.95], look: [0.14, 0.52, -0.3], fov: 42 }],
  final: two(w.then2, TOTAL - 1, { pos: [1.12, 0.69, 0.9], look: [0.24, 0.36, 0.04], fov: 42 }, { pos: [1.08, 0.66, 0.86], look: [0.25, 0.36, 0.04], fov: 42 }),
};
