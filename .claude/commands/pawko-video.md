---
description: Make or edit one Pawko video (cartoon or realistic) — one builder, start to finish, stopping at every self-review point
argument-hint: new <sheet row> | edit <topic>
---

You are running the **Pawko video pipeline**: `$ARGUMENTS`

The procedure, credit cap, failure rules and edit flow live in `pipeline/README.md`. Read it first and follow it; this file only sets the order and the stops. Paths are relative to the kit root. One person builds and reviews; never wait for anyone else.

## 0. Before anything

Ask, and wait for the answers:
1. **Who is building?** (David, Nel or James.) They approve every stop below.
2. **Which lane?** cartoon or realistic (suggest one from the source reel if obvious).
3. **Is the row claimed in the tracker** ("Builder" column)? If someone else claimed it, stop.

Read `PLAYBOOK-DOG-APP.md` (cartoon) or `pipeline/realistic/PROMPT-STYLE.md` (realistic).
Video folder: cartoon `example/<slug>/`, realistic `pipeline/realistic/<slug>/`.
If `brief.md` already exists there, read its **Status:** line and the latest `work/defects_v<N>.md` and continue from there.

## `new <row>`

Copy `pipeline/Brief_template.md` into the video folder as `brief.md`; update its **Status:** line at every step.

1. **Claim** — the row must be **green** in James's "Videos to Redo Pawko" sheet (https://docs.google.com/spreadsheets/d/1Z3wrKaSvrv6-7nDRYcMHl1WxzV9xxoYEU41pglR0iwE); fill the brief from it (source URL, hook, angle); cite the tracker hooks/formats that performed if the builder pastes them in.
2. **Reference** — the builder downloads the IG reel into `reference/`. Transcribe it with `transcribe.py`.
3. **Script** — line 1 word for word, ~3.7 words/s, ends with the Comment PAW CTA. **STOP: builder approves.**
4. **Voice** — the builder generates it in ElevenLabs (cartoon: Holden; realistic: Brian). Never call ElevenLabs or Higgsfield yourself. Realistic: pace the pauses + add 1.3 s lead silence.
5. **Shot list** — fill `pipeline/Shotlist_template.md` as `shotlist.md`. **STOP: builder approves.**
6. **Build** —
   - Cartoon: copy the last approved sibling in `example/`; one builder agent per job.
   - Realistic: give the builder the copy-paste JSON prompt, the reference IDs and the duration. **STOP: builder approves the spend** (cap ≈ 240 cr: one 720p take + max 1 retry). Ask for the shared balance; warn if below 500 cr.
7. **QA** — mandatory: every 3rd frame at full size with `pipeline/QA_checklist.md`; up to 3 fix rounds; log `work/defects_v<N>.md`. **STOP: builder reviews the flagged frames** and decides fix or keep.
8. **Final** — **STOP: builder locks it.** Name `<Topic>.mp4`. Cartoon: copy the editing pack (`voice.mp3`/`voice.wav`, `music.wav`, `sfx.wav`) next to it.
9. **Deliver** — fill `pipeline/Delivery_template.md` as `delivery.md`. The builder uploads to Drive and **confirms the files are there**.
10. **Log** — remind the builder to fill the tracker row (status, Drive link, **credits**). Done at "delivered to Drive".

## `edit <topic>`

1. Find the video folder and its `brief.md`; confirm the **Change request** from the tracker with the builder.
2. Cartoon: edit the project and re-render **only the affected shots**, then `finish.sh`. Realistic: fix in post (trim, cut, captions, audio), or a new take within the cap (**STOP: builder approves the spend**).
3. QA the changed part with `pipeline/QA_checklist.md`. **STOP: builder reviews.**
4. Save as the next version (`_v2`, `_v3` …). **STOP: builder locks it.** Redeliver as in step 9 and remind them to set Status = Delivered and clear **Change request**.

## Never

- Upload, edit Google Drive or Sheets, post, or message anyone — the builder does that.
- Spend credits or call paid tools yourself; never regenerate a locked final.
- Touch FINAL videos, or any kit project other than this video's.
