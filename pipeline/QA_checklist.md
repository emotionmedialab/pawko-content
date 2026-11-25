# QA checklist

**Mandatory** (there is no second reviewer). Claude checks full-size frames, never thumbnails, does at most 3 fix rounds, then
the builder reviews the flagged frames and decides: fix or keep as a known issue. Log every round in
`work/defects_v<N>.md` (frames | shot | problem | fix; plus "reported but kept, with reason"). Example:
`example/heatstroke/work/defects_v4.md`. Once the builder locks a version, stop the fix rounds.

## Cartoon

Copied verbatim from `PLAYBOOK-DOG-APP.md` (2026-11-20). The PLAYBOOK wins if they ever differ.

**Nel's QA rules (2026-11-20, apply to every video)**
- Review every 3rd frame at ≥540 px wide, full 1080 for close-ups. Thumbnail sheets miss defects.
- On every close-up/medium shot check: the tongue is inside the mouth; held props (grass, keys, leash, bucket, phone) touch the mouth or hand holding them; no head deformation (seal/blob head, underside-of-jaw angles); hands never cover or pass through faces; no clipping.
- Contact between characters is the #1 failure: no head inside a leg, fist inside a skull, hand swallowing a head. Pets go on the back with the face visible. Keep clearance; frame touch moments side-on or 3/4.
- No character through furniture or doors; props never teleport (cut away on a swap). The 3D scene must fill the frame (no empty floor band at the bottom).
- Zoom-ins are the exception: static or gently drifting camera by default, cut to new angles for variety, push-in only on an emphasis beat (≤ ~1 in 4 shots). Never fix a static hold with a push-in; cut or add character action.

**PLAYBOOK section 4 checklist** — open every sheet and look at every tile. Check for:
- [ ] trail beads or effects drawn over the dog
- [ ] hand, arm or paw missing, cut off, floating, vanishing or jumping between tiles; treat not in the hand
- [ ] treat "eaten" away from the mouth; paw cursor left on the face
- [ ] dog clipping into or floating above the mat; head bent back like a snorkel or upside-down; face covered by a hand or arm
- [ ] dog or trainer cropped badly; trainer's face cut; badges or bubbles at the edges
- [ ] mirrored text; pops or snaps between consecutive tiles; empty frames
- [ ] each action lands 0–3 frames before its word; holds are not dead
- [ ] the look matches High-Five.mp4 (framing, bubbles, no POV trails)

**Also (QA lessons from the At Your Feet reel):**
- [ ] head faces the direction of travel (no owl-neck / back-of-head blob)
- [ ] continuity (clock, lamp, day/night)
- [ ] nothing cropped, no too-tight framing

**Final file:**
- [ ] 1080x1920, 30 fps, exactly the voice length, about −14 LUFS, no freeze/black spans (`finish.sh` printout)
- [ ] final per-shot sheets built from the final render, every shot viewed

## Realistic

From `pipeline/realistic/PROMPT-STYLE.md` and the Dog Jumps video lessons.
- [ ] Level framing: phone upright, straight verticals, no tilt
- [ ] Real-world size: standing head ≈ 85% of door height, kneeling head ≈ half; man and dog the right size vs the doors
- [ ] No repeated lines (each line said once, then silent smile); CTA said once
- [ ] Handheld phone feel (real camera motion, not faked in post)
- [ ] Lighting normal and a bit dim, not bright or studio-lit
- [ ] Character matches sheet 2b (bald, white beard, suspenders); dog = the locked golden retriever
- [ ] Lip sync holds; voice is Brian with the 1.3 s lead silence
- [ ] 720p, about −14 LUFS; captions (if any) in the approved style: Arial Black 72, yellow, outline 6, 1–3-word chunks
