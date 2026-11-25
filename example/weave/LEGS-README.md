# Trainer legs (kit piece) — web/legs3d.js

3D toon lower body: two jeans legs + two sneakers (colours from the 2D trainer card). Inked by the project's post-process, nothing extra to set up.
Scale: hip 0.98 m, knee ~0.5 m, shoe 0.29 m. Puppy shoulder (0.30 m) = mid-shin, head (0.42 m) = just under the knee.

## Import (main.js, once) and key (story.js)
```js
import { createLegs } from './legs3d.js';
const legs = createLegs(THREE, scene, { toon });      // after the puppy; add `legs.pose(legsAt(f))` in worldState
// story.js
import { legsTimeline } from './legs3d.js';
const plan = legsTimeline({ at:[x,z], yaw, y: MAT, stance:'apart',
  steps:[{ foot:'R', a:14, b:38, fwd:0.14 }, { foot:'L', a:44, b:68, fwd:0.14, lift:0.05 }] });
export const legsAt = (f) => plan(f);                  // one plan per shot; pick by shotAt(f)
```
- yaw: 0 faces +z, PI/2 faces +x (same as the puppy). Number or `f => yaw` to turn. Foot 'L' is on the trainer's left (cos yaw, 0, -sin yaw).
- stance: 'together' (0.075 half-width), 'natural' (0.14), 'apart' (0.22, puppy fits between), or a number in metres.
- steps: frames a..b a foot swings from where it stood to `to:[x,z]` (world) or `fwd`/`side` metres (along the heading at frame a). `lift` = peak foot height (default 0.12). Feet are planted exactly between steps (checked: 0 mm slide); the pelvis follows the feet and leans over the planted leg. Keep one step <= ~0.3 m.
- `legs.shoeTop('L'|'R')` = world point on the toe cap (for paws); `legs.segments()` = leg axes + radii (clearance tests); `legs.tops()` = trouser top.
- Dog tools used by the proof (story.js, copy as needed): per-frame paw IK on a shoulder/elbow lookup (`pawIK`), `POSES.paws` front-paws-up pose, and `gait.hindOnly` (added to this project's dogrig.js copy; front legs stay still).
- The mat in main.js was enlarged (1.7 x 1.1 half-extent) so legs and puppy fit.

## Recommended cameras (9:16, trainer legs at origin, mat y=0.064)
- Weave: pos [0.7,0.5,2.9] look [0.2,0.36,0.05] fov 46, legs apart (yaw 0, trainer faces +z). Needs this wide: weave spans ~1 m.
- Peekaboo: pos [0.95,0.4,1.8] look [0.05,0.3,0] fov 42, stance 0.18, trainer yaw 0.15, puppy yaw = trainer yaw + 0.3, start with the nose >0.1 m behind the shins so the near leg hides it, then slide forward ~0.3 m.
- Footsies: side camera pos [0.3,0.45,2.45] look [0.3,0.4,0] fov 40, trainer faces +x, stance 0.065, puppy faces the trainer turned ~0.45 rad toward the camera (else the near leg hides its head), small steps (fwd 0.10, lift 0.04).
- Rule: keep the frame top below ~1.2 m; the trouser tube runs to ~2 m, but the crotch (~0.93 m) shows if the frame goes lower than that.

## Known limits
- Paws ride the shoes by a linear-ish IK lookup: within about +-2 cm (one frame at a step dips ~3 cm into the lifted shoe). Hind feet shuffle by gait phase, not locked.
- Footsies has the puppy backing up facing the trainer; at the step the nose is close to the shin (clearance ~0 in the sphere test, no visible clip). Peek nose grazes the near shin around f141.
- No ankle roll / foot twist beyond toe pitch, no walking turn animation, knees bend only forward. Weave is not a full figure-8 (gap, around left leg, back toward the gap).
- Camera trick only: there is no torso, so the frame must stay low.
