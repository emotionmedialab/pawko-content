# Heatstroke v4 defect audit

Method: every 3rd frame at 540 px wide (`work/auditpages.py` -> `stills/audit/`, 94 pages of 6 frames, labelled frame + shot). Four independent reviewers covered pages 1-24 / 25-48 / 49-72 / 73-94. I checked the high/med findings myself on full-size crops (`work/tongue630.jpg`, `work/verify1.jpg`, `work/verify2.jpg`, `stills/v4c.jpg`).

## Pass 1: v3 shots + v4 camera list, before the defect fixes

| Frames | Shot | Problem | Fix |
|---|---|---|---|
| all panting shots (h2, s2, g2, g3, g4-g6, a2, r2-r6, i1-v6, CTA) | - | **Tongue detached from the mouth.** From the front it floated on the chin/chest under a closed mouth line, e.g. a2 "act fast" f620-642, r4 f1098-1143, r6a f1230-1257. | Root fix in `web/dogrig.js`: the tongue is still parented to the jaw bone, but its root moved from 0.085 fwd / 0.045 down to 0.112 fwd / 0.02 down (on the lower lip), hangs steeper and is shorter. Verified front + side + 3/4. |
| 620-642 | a2 | Puppy looked up at the camera: underside of the jaw, flat snout | Camera lowered to head height (y 0.34); look target at y 0.08 with `neck: 1` |
| 1098-1143, 1230-1285 | r4, r6a/b (sitting puppy) | Nose pointing up (the rig's sit pose lifts the head) | Look target y 0.12 + `neck: 1` (PLAYBOOK workaround); r4 camera raised 0.30 -> 0.45 |
| 1286-1576 | i1, i3, v3, v5, v6 (living room) | Nose up / jaw underside when looking toward the fan face | Look target capped at y 0.12, `neck: 1` |
| 1584-1686 | c1 CTA | Puppy sat inside the owner's knee; hand over the puppy's head; puppy only seen from behind; owner's face hidden under the brim | Puppy sits 0.55 m in front (was 0.42); hand strokes the back (top -> sp3); owner head pitch -8; camera moved side-on (profile two-shot) |
| 732-774 | p2 | Owner's knee/shoe clipped through the lying puppy; leash collapsed to a stub when the leash hand petted | Crouch spot moved back (DX-0.2, z -0.08); pets with the LEFT hand, leash stays in the right |
| 720-729 | p2 | Owner's head cut off at the top while still standing | Crouch starts at the cut (712-728); camera pulled back |
| 777-783 | d1 | Owl-neck: torso to camera, back of the head shown while getting up from the crouch | Head pitch blends -15 -> +12 as he stands (was a fixed +10 on top of the crouch's head-down) |
| 783-858 | d1/d2 | Owner's legs passed through the puppy on the walk to the shade | Separate walking lines (crouch spot moved back); puppy's shade spot moved +0.1 |
| 984-1023 | r2 | "One hand on the bucket, other hand hanging" (the base was out of arm's reach at hip height) | Carried one-handed by the handle at the hip (a normal carry) until the pour; for the pour it is lifted to chest height (y 0.72) so both hands hold it (handle + base) |
| 1137-1143 | r4 | Bucket came down into the top of the puppy's head as the pour ended | Puppy sits 0.1 m further out (D2), bucket held closer (0.40) |
| 951-981 | r1 | Bucket base sank into the curb | Bucket moved onto the grass (z -1.08) |
| 984-1284 | r2-r6 | Dropped leash ended at the paws / flank, not the neck | Ground end placed beside the puppy, sag 0.2, so it rises to the neck |
| 270-300 | e1 | Caption covered the puppy's head | Camera raised, look target lowered (puppy sits above the caption) |
| 438-465 | g1 | Puppy's head cut by the bottom edge | Camera pulled back |
| 597-618 | a1 | Owner's hat cut at the top | Camera pulled back |
| 336-369 | e3 | Top of the cap cut | Camera pulled back |
| 1446-1479 | v2 | Owner jammed against the right edge | Camera pulled back, look x +0.1 |
| 1296-1338, 1482-1497 | i1, v3 | Puppy's tail cut at the right edge | Look x -0.3 -> -0.2 |
| 864-897 | d3 | Owner looked up at the sky while walking | Head pitch +12 while walking |

Reported but kept, with reason:
- 1023-1143 "cap turns into a fedora": it's the same cap seen from above while he leans over the bucket. Not a model change.
- 1428-1443 v1 phone at the temple rather than the ear: kit's phone pose (redo-parts limit "phone hand can cover his cheek"); the face stays clear.
- 1230-1284 thin dashed ink line across the background bucket: ink-pass seam on the far bucket, low.
- 204-264 s3: puppy looks long from the high angle (rig proportions, low).
- 495-501 g3: leash end reads at the top of the skull in the extreme close-up (the leash clip sits on neck bone n2, seen from above), low.
- 669-717 p1: puppy's head overlaps the owner's shoe in 2D (it's 0.6 m in front of him, no 3D contact), low.

## Pass 2: full re-audit after the pass-1 fixes (4 reviewers, all 94 pages)

| Frames | Shot | Problem | Fix |
|---|---|---|---|
| all front-facing pant shots (a2 620-642, r4 1098-1143, r6a 1230-1257) | - | Tongue still under the closed mouth line, with a chin gap | `dogrig.js`: root moved forward/up to 0.14 fwd / 0.003 down (just outside the lip at mouth height), hangs mostly down. Higher roots disappeared inside the head because the mesh mouth barely opens. Verified on crops: side (f490), front (f630, f1120), 3/4 (f1390). |
| 270-300 | e1 | Caption still on the puppy's head | e1 is now a sun/sky shot, characters at the bottom below the caption |
| 69-99 | h3 | Caption on the puppy's ear | Look target lowered |
| 984-1047 | r2 | "3 WATER" card on the owner's cap | Camera pulled back, look raised |
| 1026-1095 | r2/r3 | Bucket pressed into the belly while pouring | Held further out (0.52) at y 0.66 |
| 1098-1285 | r2-r6b | Dropped leash read as a stiff stick / a red tail | Leash is unclipped when he picks up the bucket (hidden from "Water."). The puppy has no collar in the kit, so there is nothing left at the neck. |
| 1260-1284 | r6b | Puppy's head cut at the right edge | Look x +0.15 |
| 1368-1413, 1545-1560 | i3, v5 | Body cut at the right edge, too much empty rug | Camera further back, look raised |
| 1584-1686 | c1 CTA | Puppy faced the owner = back of its head to camera; first camera fix showed the owner from behind | Camera back to the v3 front 3/4; puppy now sits beside him facing the camera, looks around, wags; his hand rests on its head/neck |
| 720-774 | p2 | Knee through the puppy at the closer crouch spot; stroking hand hovered | Crouch spot back to DX-0.2 / z -0.08; left hand reaches to the head/back |

## Pass 3: full audit of the final render (4 reviewers, all 94 pages) + my own full-size checks

Fixed after pass 3: the water-section leash (hidden, see above) and the p2 pet target (head/back). The final frames were then re-rendered.

Remaining, accepted (low, kit limits or 2D overlaps):
- i3/v5/v6 close-ups: the rig's lower jaw reads as a separate "pouty" flap with a seam under the snout (rig mesh; the tongue sits at that lip line).
- p1 669-717, g5 540-555: puppy's snout overlaps the owner's shoe in 2D. They're about 0.6 m apart in depth, with no contact.
- p2 738-774: the stroking hand rests at the head/neck but contact reads light; there's no fingers rig.
- CTA 1584-1686: the owner is 3/4 profile (one eye plus the ear ring visible); the hand rests on the puppy's head.
- v1 1428-1443: phone at the temple (kit's phone pose).
- e5 417-429: lamp post lines up with the owner's head in 2D.
- a2: frontal snout looks short (rig proportions head-on).
- i2: fan blades poke slightly past the guard at 30 fps.
- h2/e4: the hook puppy pants lightly (mouth mostly closed); heavy pant starts at "Watch for heavy panting".
