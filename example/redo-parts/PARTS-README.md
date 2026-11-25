# Redo parts (kit pieces) — web/owner3d.js (extended), dogrig.js (extended), street3d.js, props3d.js, living3d.js, entry3d.js, yard3d.js, forest3d.js (day mode), captions.js (+step, +timer)

Reusable daytime parts for three reels: **heatstroke 5 steps**, **calm homecoming / 5-minute rule**, **dogs eat grass**. Same pattern and look as `bedtime-parts/` (At Your Feet): ES modules that take `THREE` + `scene` (+ the kit's `toon()` material helper), set every frame with `set({...})`, inked by the normal/depth post pass, parts add their own lights.
Proof scenes live in `web/proof.js` (harness `web/main.js` = the kit's ink + DOF). Render: `bash proofs.sh [a b c d e f g h]` -> `out/*.mp4`, `out/sheets/<x>/s1.jpg` (every 3rd frame). Coherence still: `out/coherence.jpg`.

## Import
Copy the modules you need (+ `dogrig.js`, `bedroom3d.js` (owner3d imports `BED` from it), `lib/`, `models/`) into the project's `web/` and import from `main.js`/`story.js`. Use **this** `main.js` (or port its two changes):
- the GLB material swap skips meshes with `userData.keep` (the puppy's new tongue mesh), and sets `dog.tongue.material.gradientMap = grad`.
Engine contract (unchanged): `userData.ndSkip = true` meshes (sky domes, sun, heat shimmer, air lines, shade tint, puddle, outside-door card, **grass blades**) are hidden in the normal/depth pass; skinned meshes need `userData.nd = ndSkin`. Each set's `set()` sets `scene.background` and `scene.fog` (fog only outdoors) — call it every frame so cutting between sets is clean; hide the sets you're not in (`x.root.visible = false`).

## owner3d.js — `createOwner(THREE, scene, { toon })` (copy of bedtime-parts, extended)
- Daytime look: `owner.setOutfit('day')` (teal long-sleeve shirt, cream cuffs, denim; `'pyjamas'` = the coral At Your Feet set), `owner.setCap('day')` (trainer cap), `owner.setShoes(true|false)` (brown shoes / cream socks).
- `owner.pose({ w:{...}, at:[x,z], face, walk:{ phase, k, amp }, head:[pitch,yaw,roll], breath, blink, smile, ik:{ L, R }, phone, keys })`
  - Bed poses unchanged (`sleep side sit hug`, no `at`). **Ground poses** (soles on y 0, use `at` + `face`): `stand`, `pour` (knees soft, leaning forward), `crouch` (deep squat; shoes off / bridge to kneel), `kneel` (right knee down, left foot planted; pet / talk to the puppy).
  - `face` = heading in radians (0 = facing +z, PI/2 = facing +x). `walk.phase` = distance / `STRIDE` (exported, 0.816 m per cycle at the default 18° swing) so the feet don't slide; `walk.k` blends the cycle in/out (0 = standing). Arms counter-swing, pelvis dips.
  - `head` adds degrees to the pose's head: **arms folded + look away** = `ik:{ L:'foldL', R:'foldR' }, head:[-8, ±62, ±6]` (+yaw = turn to his left).
  - `ik` hand targets = world `Vector3` or a named target: `'earR' 'earL'` (hand at the ear), `'foldL' 'foldR'` (folded arms). `phone: true` shows a red phone against the RIGHT ear (use with `ik:{ R:'earR' }`, turn it on when the reach is > 0.85 done); `keys: true` hangs a key ring from the LEFT hand.
- `owner.reach(args, { L:[target, t], R:[target, t] })` — poses with hands blended from rest toward targets (Vector3 or HOLD name), t 0..1. Replaces the proof-level `reachPose` helper.
- Recipes (see proof.js): **pet** = `w:{kneel:1}` + `reach(..., { R:[dog head↔top point + 0.12 up, t] })` with a sin stroke; **pour** = `w:{ stand:0.3, pour:0.7 }` + `ik:{ R: bucket.pts().handle, L: bucket.pts().base }`; **shoes off** = `w:{ stand:0.3, crouch:0.7 }` + hands to `owner.info.L.A / R.A` (ankles), then `setShoes(false)` + `hall.set({ shoesOnMat:true })` on the same frame; **phone** = `reach(..., { R:['earR', t] })`.
- `owner.info.L.H` = wrist, `.A` = ankle, `owner.info.head` = head centre (aim the puppy's look at it).

## dogrig.js (copy of at-your-feet's, extended)
- New poses: `pretty`, `hug` (copied from sit-pretty/, hug/), **`jump`** (up on the hind legs, front paws forward-up at a person's thigh; cycle `stand <-> jump` with weight `0.5-0.5cos(2πt/20f)` + a 0.05 m root hop, puppy root ~0.42 m in front of the owner), **`graze`** (chest lowered, nose down: look at a ground point ~0.3 m ahead, `neck:1` -> nose ~0.15 m up, i.e. into a grass tuft).
- **Collapsed on the side** = existing `w:{ flop:1 }, roll: 90, counter: 0, lift: 0, look: null, blink: 1`.
- **`tongue` 0..1** = a pink tongue on the jaw bone. Heavy pant recipe: `jaw: 0.5+0.25*sin(f*0.9), tongue: 1, breath: 0.5+0.5*sin(f*0.9)` (`pant()` in proof.js).
- Spin = turn `dog.root` yaw 2π over ~20 frames with a gait on (proof d).

## street3d.js — `createStreet(THREE, scene, { toon })` (hot park path)
- `street.set({ t, heat 0..1, shade 0..1, focusX, cam:[x,y,z] })` every frame. `heat` = rising heat-line shimmer over the path + sun glare/rays; `shade` = cool blue tint on the shade tree's shadow pool; `focusX` = subject x (the sun's shadow box follows it); `cam` = camera position (shimmer ribbons turn to it).
- Path along x (`PATH`: z 0, half width 0.8, x -9..11), sun-bleached grass, bench + lamp + bin behind at x -2.2..0.8, hedges + round trees behind, sky dome with sun, warm haze. High sun from behind-left + soft front fill, so the **shade tree's real shadow lands on the path at `SHADE.spot`** ([3.0,-0.25]; tree at `SHADE.tree`).
- Cameras (9:16): walk side-on `pos [x, 1.05, 4.7] look [x, 0.88, 0] fov 40` (walk +x, puppy at z 0.42 = owner's right/camera side, owner at z -0.22); shade/water `pos [spot.x+0.7, 1.2, 4.2] look [spot.x-0.15, 0.8, spot.z] fov 44`.

## props3d.js — bucket, water, leash
- `createBucket` -> `set({ at:[x,y,z], yaw, tilt (1.5 = pouring), water 0..1 })`, `pts() -> { handle, base, lip }`.
- `createWater` -> `set({ from: lip, to: puppy back (dog.boneWorld('sp3') + 0.06 up), amt, t, splash, puddle })`: falling arc with running drops, splash drops, spreading puddle.
- `createLeash` -> `set({ a: owner.info.R.H, b: dog.boneWorld('n2'), sag })` (red tube + clip; no collar on the puppy).

## living3d.js — `createLiving(THREE, scene, { toon })` (day living room + electric fan)
- `room.set({ t, fan 0..1 (blade speed), air 0..1 (air-line strength) })`; `room.pts() -> { fanFace, bowl }`.
- Back wall z -2 with window (sky card), blue sofa under it, mustard rug, plant, picture, red water bowl. Standing fan at `FAN.pos` aimed at `SPOT` ([0.1,0.35]) — lay the puppy there; 7 dashed air lines flow from the grille over it.
- Cameras: fan + puppy `pos [0.55, 1.0, 2.9] look [-0.3, 0.45, 0] fov 44`; owner on the phone `pos [0.9, 1.3, 3.6] look [0.35, 0.92, -0.3] fov 42` (owner at [0.85,-0.55], face -0.45 so the phone ear faces the camera).

## entry3d.js — `createEntry(THREE, scene, { toon })` (front-door entryway)
- `hall.set({ door 0..1, keysOnHook, shoesOnMat, clock minutes })`; `hall.pts() -> { rack, bowl, knob, mat }`.
- Front door in the back wall (z -1.8, hinged left, swings in toward the camera) opening onto a sunny garden card; terracotta/cream tiles; console table + key bowl + **key rack** (`RACK`) right of the door; coat hooks + coat on the left wall; analog wall clock; shoe mat (`MAT`) with a red pair always there + the owner's brown pair when `shoesOnMat`.
- Owner walks in `at [0,-2.3] -> [0,-1.3]`, face 0. Keys: `reach(..., { L:[hall.pts().rack, t] })`, `keysOnHook:true` at the end of the reach, `keys:false` on the owner.
- Cameras: door + full body `pos [0.35, 1.25, 2.6] look [0.12, 0.92, -1.0] fov 46`; side medium (owner at [0.05,-1.05] face 1.25, puppy in front of him) `pos [0.3, 1.15, 2.3] look [0.2, 0.92, -1.0] fov 46`; kneel/pet `pos [0.3, 1.0, 1.75] look [0.22, 0.68, -1.0] fov 44`.

## yard3d.js — `createYard(THREE, scene, { toon })` (backyard lawn)
- `yard.set({ t, chew:{ amt 0..1 (patch eaten, middle first), tug 0..1 (blades bend to the mouth; pulse with the jaw) } })`.
- Lawn with short tufts, picket fence back + sides, flower bed, orange shed, round tree, red ball, sky + sun. Tall chew patch at `CHEW` ([0.15,0.05], r 0.28).
- Cameras: chewing close `pos [CHEW.x+1.15, 0.8, CHEW.z+1.8] look [CHEW.x+0.3, 0.28, CHEW.z] fov 42` (puppy yaw -1.2, nose 0.36 m past its root); wide `pos [0.4, 1.35, 3.3] look [0, 0.55, -0.5] fov 46`.

## forest3d.js (copy, + daylight)
- `forest.set({ ..., light:'day' })` = same forest by day (blue haze, warm sun, greener ground/pines/grass, no glowing eyes). Night unchanged.
- `greyWolf(THREE, makeDog, gltf, { scale: 2.1, grad, ndSkin, day:true })` = the At Your Feet grey wolf (recoloured puppy rig); pose it like the puppy, e.g. `w:{ graze:1 }`, jaw chewing, at the `CLUMP` edge with `grass:{ amt }` flattening the bitten patch. Hide the primitive wolves (`forest.pack / watch .g.visible = false`) as At Your Feet did.
- Camera: grazing wolf `pos [-0.5, 1.28, 2.85] look [-0.6, 0.35, -0.2] fov 46`.

## captions.js (+ step, + timer)
- Unchanged `pop`, `title`, word captions. New: `cap.step({ n:1, text:'STOP', a, b, at:[540,300] })` = yellow number badge + white word (same font/outline/pop-in); `cap.timer({ from:300, to:0, a, b, at, size, hold })` = "5:00" m:ss countdown in a draining yellow ring.
- Place steps/titles at y ≈ 250–330 and check they clear the owner's head on the sheet (the walk camera frames his head at ~y 300–450).

## Proofs (out/)
a heat walk -> puppy pants, lies down, flops on its side; owner stops, turns ("1 STOP") · b shade pool + bucket pour ("2 SHADE", "3 WATER") · c fan + air lines ("4 AIR"), cut to owner on the phone ("5 VET") · d homecoming: door, walk in with keys, shoes off while the puppy jumps up, keys on the rack, arms folded + look away with the 5:00 timer, puppy jumps/spins, then sits; owner kneels and pets · e backyard grass chewing ("8 IN 10") · f day forest grey wolf grazing ("1,571 OWNERS") · g owner pose gallery · h puppy pose gallery.

## Known limits (tell the script writers)
- **Owner is a stiff toy figure**: no fingers (mittens), no elbow/shoulder twist, pose blends are lerps. Folded arms read best from the side/3/4; from the front the mitten tips poke out past the elbows. The phone hand can cover his cheek from some angles — keep the phone ear toward the camera (owner turned ~25° away).
- **No real shoe removal**: shoes swap to socks in one frame during a crouch (hands at the ankles), the pair appears on the mat. Don't script a close-up of untying/pulling a shoe off.
- **Owner can't sit on a sofa, pick up / carry the puppy, or crouch-walk.** No lip sync, no facial expressions beyond smile/blink (no frown — "worried" reads only through head tilt + small smile).
- **Walking is a simple leg cycle** for straight lines; turning on the spot is a glide of `face` (no stepping feet). Keep walks side-on or 3/4, 1–3 m.
- **Puppy**: no collar (leash clips to the neck); `graze` nose stops ~0.15 m above the ground (eats from a tuft, not the soil); `jump` paws reach ~0.5 m (thigh/knee, not chest); jumping up is a cycled pose + hop, not physics; collapse on the side is the roll-over rig's flop (legs out stiffly). No drinking from a bowl (head can't reach a floor bowl), no shaking off water, no vomiting.
- **Water**: one stylised stream + drops + flat puddle; the puppy doesn't get visibly wet. No hose (bucket only).
- **Heat feel** = shimmer lines + sun rays + warm palette; no real refraction/distortion.
- **Grass is not inked** (the nd pass has no instancing — the old forest drew one stray blade at the origin; fixed by skipping grass). Side effect: ink lines of a dog/wolf behind tall grass show through the blades (visible on the grazing wolf's head).
- Air lines are dashed tubes; fan blades at ~4 rev/s strobe a little at 30 fps (reads as spinning).
- Entry: door only swings inward toward the camera (hinge left); outside is a painted card (don't film through the door at an angle > ~35°). No vet clinic set (VET = phone call).
- Captions layout only checked at 1080x1920.
