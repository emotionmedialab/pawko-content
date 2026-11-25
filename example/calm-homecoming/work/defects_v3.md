# Calm Homecoming v3: defect audit (from v2)

The audit used every 3rd frame, and close-up/medium shots were checked at 540 px wide (`py work/audit.py stills/qa <shots>` -> `stills/audit/`).
Frames are at 30 fps on the v2/v3 timeline.

| # | Frames | Shot | Problem | Fix |
|---|---|---|---|---|
| 1 | 226–257, 446–531 (every panting beat) | 09, 16, 17, 18 + all part-1 jump shots | **Tongue detached.** The rig's tongue was placed from the neck-top bone at rig build time, so it floated in front of or under the chin, away from the mouth (a pink stick sticking out at the side). A re-seat from the jaw/nose bones also landed outside the muzzle, because the bone positions don't match the skinned mesh. | The tongue is off (`pant()` -> `tongue: 0`). Panting reads from the open jaw plus fast breathing. The project dogrig.js is restored to the redo-parts copy (no rig edit). |
| 2 | 356–414 ("This" ~12.7–13.8 s, Nel's example) | 12, 13, 14 | **Fuss hand on top of the head.** Seen from above and behind, the head read as a squashed blob with a floating ear. | The fussing hand now targets the far side of the neck (`top + (0.16, -0.2, 0)`) and he leans fully (`pour 1.0`), so the hand rubs at cheek/neck level beside the face, not over it. Camera stays 3/4-front (v2). |
| 3 | 91–257 | 04, 06, 07, 09 | The puppy's nose pressed into the owner's resting hand (hands on the thighs at jump height). | The resting hands move up to his hips (`lerp(hip, knee, 0.15)`, 0.2 out), clear of the jump arc. |
| 4 | 54–531, 620–905 | all jump shots | The head was tipped well back when looking up at his waist. | The look target is lowered (0.95 -> 0.8 m, calming 0.72). |
| 5 | 816–834 | 29 shoes-crouch | The puppy's chest went inside the owner's knee/thigh while he crouched. | The puppy backs off 0.15 m while he crouches (804–842). |
| 6 | 869–875 | 31 keys-on-rack | Walking back from the rack, his swinging arm went through the console table edge. | The rack spot moves a step back (0.48, -1.28), and shot 31 ends at 868 (cut to the rack insert at 869, so the walk-back happens off camera). |
| 7 | 1206–1292 + CTA 1293–1406 | 43, 44, 45, 46, 47 | Once the puppy lay down, the "pet" hand hovered above it without touching. | Petting ends as it lies down; his hands rest on his knee. |
| 8 | 1050–1180 | 39, 41, 43 | The pet hand sat on the head top (face visible below). | Strokes shifted 0.1 m back/down the body. The hand can still touch the crown at the start of each stroke (front-side view, face clear). Accepted. |
| 9 | 810 | 29 | The puppy's nose touched the hanging keys for 2–3 frames. | Accepted: the keys are in his hand, a sniffing read, no clipping. |

Keys stay in his hand (part 1, part 2 until 866), then on the rack hook from 866. Shoes appear on the mat at 826 (one-frame swap during the crouch). No floor or door clipping found.

## Camera moves (rule B)
Push-ins are kept only on the emphasis beats: 01 door opens (hook), 04 first jump close-up (hook), 05 "goes crazy" wide, 18 "STRESS!", 19 wall clock (the rule), 21 door opens again, 44 calm two-shot, 45 "CALM DOG, HAPPY DOG!", 46/47 CTA = **10 of 47 shots**.
Every other shot is static or has a 4 cm sideways drift (look point fixed). The puppy close-ups follow the puppy's head position (framing, not a zoom).

# v4 (coordinator / independent full-size review of v3)

Contact rule: wherever owner and puppy touch, nothing may pass through. Contact audit = `py work/contact.py stills/final3 1 <shots>` (every 3rd frame, lower-middle 1080x1080 at 540 px) -> `stills/contact/`.

| # | Was | Fix |
|---|---|---|
| 1 | Head buried in his pant leg, fist sinking into the skull (11.9–17.6), nose pushing into his fist in a reused close-up | Fuss redesigned: from "But" he holds the puppy's two front paws (mittens under the paws, on his side), the puppy stays up on its hind legs; nothing touches the head. Puppy 0.48 m out (head in front of his legs). Resting hands moved up onto his hips (out of the jump arc). Reused fist-sniff close-up removed: the close-ups are now side/two-shots (legs + paws in frame), each angle used once. |
| 2 | Hand over the head / both hands enveloping head, sleeve across the muzzle (35.2–39.9) | Sitting puppy turns side-on to him (its back to his hand, face to camera side) and sits 0.08 m further out; one hand strokes the back only (spine bones sp3–sp1 +0.12 m). Face fully visible in 39/40/41/42/43. |
| 3 | Kneeling owner's face inside the console table / bowl (38.0–39.0) | Shot 42 re-angled from the right-front so his head reads against the door, not the table. |
| 4 | Hand through the closed door (592–595) | Owner not drawn until 596 (door half open). |
| 5 | Countdown badge on his face (27.2–27.6) | Countdown drawn in 3 pieces; it sits top-left for the shoes crouch (808–825), ring scale kept continuous. |
| 6 | Puppy jumping at empty air | Jump shots re-framed side-on/3-4 with his legs in frame; act-2 jump distance 0.45 m so the paws land on his shins. |
| 7 | Snout/paws into legs, rump hole, 90° head twist, top-down noodle, barrel body | Clearance as above; rear-view angles (shots 2, 21) replaced; the arriving puppy now looks where it runs; top-down spin (28) and overhead spin (8) replaced by low side shots; final shot 3/4 from higher. |
| 8 | Keys teleport, visible shoe swap, slippers gone | Hand reaches the peg by 860, keys hop to the hook on the cut to the rack insert (862); shot 29 ends on 825 and the shoe swap (826) happens on the cut; mat shot reframed to include the red pair. |
| 9 | Hand floating above the lying puppy | Lying: both hands rest on his raised knee. |
| 10 | Flat orange band at the bottom | Tiles now cover the whole floor (project entry3d.js copy). |
| 11 | "Panting" with a closed mouth | Jaw set to the rig's widest useful opening, but the jaw bone barely moves the visible mouth (tested up to 2x, no visible change), so a "PANT! PANT!" pop is added on the word (redo-parts proof style). |
| 12 | Owner pure profile (monocle ear) | SIDE2/KNEEL cameras moved toward his 3/4 front. |
