# Bedtime parts (kit pieces) — web/owner3d.js, bedroom3d.js, forest3d.js, captions.js

Reusable parts for the night-bedroom / wolf-pack marketing reel. Same pattern as `trainer-legs/legs3d.js`: ES modules that take `THREE` + `scene` (+ the kit's `toon()` material helper) and are inked by the project's normal/depth post pass.
Proof scenes live in `web/proof.js` (harness `web/main.js` = the kit's ink + DOF). Render: `bash proofs.sh [a b c d e]` -> `out/*.mp4`, `out/sheets/<x>/s1.jpg`.

## Import
Copy the four modules (+ `dogrig.js`, `lib/`, `models/` as usual) into the project's `web/` and import from `main.js`/`story.js`.
Engine contract the host must keep: meshes with `userData.ndSkip = true` (glows, eyes, lamp halo, sky pane) are hidden in the normal/depth pass; skinned meshes need `userData.nd = ndSkin` (forest3d sets it from the `ndSkin` option). Parts add their own lights; `bedroom3d.set()` / `forest3d` set `scene.background` (+ fog for the forest).

## owner3d.js — `createOwner(THREE, scene, { toon })`
- `owner.pose({ w:{sleep|side|sit|hug: weight}, breath 0..1, blink 0..1, smile 0..1, ik:{L:Vector3, R:Vector3} })` — weighted blend of named poses (like dogrig); `ik` = world point each hand must reach (2-bone IK).
- `owner.capsules()` -> pass to `room.set({caps})`; `owner.points()` -> chest/head/pelvis/hands; `owner.info.L.H` = hand world pos (blend IK from it for smooth reaches, see `reachPose` in proof.js).
- Poses are in bedroom room space (bed at origin). Left = owner's left (+x when lying on his back, head to the headboard). `side` = rolled onto the right side toward the lamp (-x), left arm free.
- Design (modelled on the Pawko trainer card): round head, rosy cheeks, big oval eyes with highlights, open smile, chubby coral pyjamas, rounded mitten hands. `owner.setCap('sleep'|'day')`: soft white sleep cap with brown band + bobble (default) or the trainer's white-front / brown-back cap with brown brim. Colours in `COL`.

## bedroom3d.js — `createBedroom(THREE, scene, { toon })`
- `room.set({ light:'night'|'day', lamp:0..1, door:0..1 (0.2 = creak), clock:'23:00', colon:bool, cover:z of the duvet edge (-0.4 default, -0.56 = chin), caps })` every frame.
- `room.heightAt(x,z)` = duvet top (place the puppy there); `room.pts()` = `{ lampSwitch, doorKnob, clockFace, edge(side) }` hand targets.
- Duvet is a height-field mesh rebuilt each `set()` over the owner's capsules, so it cannot clip the body. Bed: x ±0.68, z -1..1, mattress top y 0.52 (`BED`). Door is in the back wall left of the bed; window + moon right of the headboard; lamp, drawers and alarm clock on the -x table.

## forest3d.js — `createForest(THREE, scene, { toon })` (sync, no GLB)
- `forest.set({ t:seconds, grass:{at:[x,z], r, amt 0..1, dir}, watch:{look:[x,y,z], flick}, eyes 0..1 })` every frame.
- 4 sleeping wolves + 1 sitting watcher (`WATCH`) built from primitives: grey fur, dark ears/saddle, light belly/muzzle/paws, long snout, tall pointed ears, bushy tail. 8 pairs of glowing eyes (`EYES`), ~100 small pines in 6 depth rows (fog fades the far ones), 1900 grass blades (tall clump `CLUMP` that flattens, low foreground and background grass), rocks.
- Camera that frames it in 9:16: pos [0,3.3,5.5], look [-0.15,0.2,-0.4], fov 48 (see proof c).

## captions.js — `createCaptions(THREE, renderer, { words, hi:[...], fps })`
- `words` = `work/words.json` from `timing.py` (`[{w,s,e}]`, seconds). One word at a time, white, `hi` words yellow `#ffd93b`, centred at y 1360 of 1920, 4-frame pop-in, held until the next word (max 0.3 s after its end).
- `cap.pop({ text, a, b, at:[x,y], angle, size, color })` SFX word frames a..b; `cap.title({ text:'AT YOUR\nFEET!', a, b })` big angled white title (size 190, -7°).
- `cap.render(f)` after the last render pass (draws straight to the screen). Font = Arial Rounded / Segoe UI Black / Arial Black fallback chain; on this machine it resolves to Arial-family bold with a thick round-joined outline.

## Known limits
- Wolves are low-poly primitives with a toy look (ink lines between overlapping shapes are busy in the huddle; no leg animation, only breathing, head swing and ear flick). The dogrig puppy is not used for them.
- Owner is a stiff toy figure: no finger animation, pose blends are simple lerps, reach IK is a straight-line path (the sleeve is one long tube). Face reads best from the front/side; lying on the back the closed eyes are thin lines.
- Duvet covers pelvis/legs/feet/arms/(torso when lying); the head is never covered. One cover model: edge z moves, no folding. Hem is a row of beads.
- Puppy hug (proof b) = dogrig 'sit' placed on the duvet in front of the owner, hands IK'd to its sides; the puppy has a little self-light (`emissive`) at night, set by the proof (`lightDog`), not by the parts.
- Door opens with `door` 0..1 only to 0.9 rad; window `day` pane is a painted card. Walls are open-topped (very tall); lighting is stylised.
- Captions: layout only checked at 1080x1920; word timing = whatever words.json says (Whisper sentence-start glitch applies, see SKILL.md/PLAYBOOK). Font resolves to Arial-family bold (no rounded font installed).
- `web/proof.js` proof `z` is a face test, not a deliverable.
