# Eating Grass v4 – defect audit (Nel's rules)

Every 3rd frame was reviewed at ≥540 px (810 px for close-ups) on `stills/audit/*.jpg`, built from `stills/qa4`. There were two full passes over all 44 shots and a third pass on the reworked shots, plus spot checks of single frames at 540 px.
Frame numbers below are v3/v4 frames (identical timeline; v4 total 1746 frames).

| Frames | Shot | Problem | Fix |
|---|---|---|---|
| 88–116, 197–248, 690–735, 736–777, 249–346 (all strand shots) | h4, s2, st8, st9, r1/r2, st3 | Grass strand floated at the puppy's neck/chest (it was placed from the rig's nose bone, which sits ~8 cm below the visible mouth). | Strand re-placed at nose + (0, 0.075, 0) at build time and parented to the jaw bone. Checked at 540–1080 px in profile, 3/4 and head-dip poses: it sits at the mouth line. |
| — | all grazing shots | The strand only showed with the head up, so the puppy never read as eating. | The strand now shows during all grazing; the chewing jaw, head-dips and blade tug stay. |
| 1536–1745 | e1, e2, cta1, cta2 | The pink tongue hung below the chin, outside the mouth. | Tongue removed (jaw slightly open instead). |
| 199–248, 400–429, 690–735, 778–826, 967–1003, 1163–1183, 1269–1380, 1536–1745 | s2, st2, st8, q1, q2a, f3b, c4, k3, k4, k5, e1, e2, cta1, cta2 | Strong chin-up / underside-of-jaw views and flattened frontal snouts (pug/seal faces). | Face shots now use a level 3/4 face: the subject looks low, 0.6 m beside the camera (eye-aim where needed). Sitting/CTA shots use a higher camera and a low look target. The stand weight is softened (graze blend) in head-up poses. |
| 210→213, 696→702, 1275→1284, 810→813, 1356→1359 | s2, st8, k3, q2a, k5 | Head snapped or swung between consecutive frames. Cause 1: aimEyes toggled mid-blend. Cause 2: the look target was computed from the previous frame's head, a feedback loop. | aimEyes is constant per pose. faceAt does a first pass to place the subject, then takes a stable head reference, so there is no frame-to-frame feedback. k5 starts already turned. |
| 147–196 | s1 | The "SCIENCE CHECKED" title covered the owner's face; the check badge had scene ink lines across it and hid the puppy. | s1 is now a puppy-only high wide. Icons are no longer ink-skipped (they occlude the scene's outlines). The badge moved to the upper right, clear of the puppy. |
| 255–346 | r1, r2 | The puppy looked straight up at the owner (goat-like chin), and the owner's hand hovered in front of the snout. r2 was a near jump cut of r1, with the hand over the puppy's face. | The puppy looks level toward camera-right. Both petting hands rest on the back. r2 is now a puppy close-up (no owner). |
| 738–777 | st9 | The puppy's head was cranked back toward the owner (back-of-head blob). | The puppy keeps grazing. |
| 849–1108 | f1, f2, c1, f3b | Wolves interpenetrated: the lead wolf's tail ran through the head of a pack-mate. | Pack-mates moved apart and out of the tail line. |
| 1062–1080 | f5 | About 0.6 s of empty grass after the broom left the frame. | The camera tracks the broom sideways, so the broom and worms stay in frame. |
| 1163–1183 | c4 | Sausage/seal puppy on the sofa, chin-up. | Higher 3/4 camera; the head stays down on its paws. |
| 1348–1380 | k5 | The "TOXIC PLANTS" title covered the nose; the warning icon sat on the face/ear. | Head lower in frame; icon moved to the lower left, clear of the face. |
| 453–486 | st3 | The hearts appeared on the flower bed, far from the puppy. | Hearts moved next to the puppy's head, off its face. |
| 0–29, 1109–1135 | h1, c2 | The rear was cut at the right edge (tight). | Wider (fov 40, look shifted). |
| 567–632, 1224–1268 | st6, k2 | The snout reached the left frame edge. | Camera re-centred on the head side. |
| whole film | camera | Almost every shot pushed in. | Default is now a sideways drift of at most 8 cm with no zoom. Push-ins are kept only on h4 (hook "eating"), v1 and v2 ("desperately"), cta1 and cta2. |

## Remaining, accepted or kit limits
- **Grass outlines:** thin outlines of legs show through tall grass. Grass is not inked (kit limit).
- **Grazing head:** stays fairly level (graze pose nose ~0.2 m up); eating reads through the jaw, the strand and the head-dips.
- **Wolves:** they read as grey puppies; it is the recoloured puppy rig.
- **v4 phone:** the phone appears in the hand when the reach completes (1503→1506) and sits at the temple, under the cap brim. Kit limit, as documented in redo-parts.
- **c3 couch wide:** the lying puppy is still long and low (down pose) at wide size. The owner stands at the sofa arm by the wall.
- **Static holds:** a few short stretches are static apart from breathing/blinks: k4 (~1 s), st2 (~1 s). There is no push-in by rule.
- **Owner face:** the owner's cheek blush decal has a small notch in close-ups, and his eyes are closed arcs when looking down.
