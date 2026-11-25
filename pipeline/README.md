# Pawko video pipeline: one person, one video, start to finish

One procedure for both lanes: **cartoon** (3D code kit) and **realistic** (Higgsfield / Seedance trainer).
It writes down what we already do; it is not a new process. Paths are relative to the kit root (`cartoon-short-kit/`).
New machine? Do `SETUP.md` once. In Claude Code, run `/pawko-video new <row>` or `/pawko-video edit <topic>`.

## Who does what

- **One builder per video** (David, Nel or James). The builder runs it alone, start to finish, and is also the reviewer:
  they approve the script, shot list, credit spend, QA findings, final lock and edits. Nobody else is waited on.
- **Claude** does the work and pre-checks it. **The builder looks and decides.**
- **David** pays for credit top-ups.
- The system ends at **"delivered to Drive"**. Posting is up to whoever has Instagram access.
- **Trade-off:** there is no second reviewer, so the QA checklist is **mandatory**, on full-size frames, never thumbnails.

## New video

| # | Step | Cartoon lane | Realistic lane |
|---|---|---|---|
| 1 | **Claim** | Pick a row from the "Videos to Redo Pawko" sheet (green rows), or the hooks/formats that performed in the tracker. Fill "Claimed by / date" first so two people never build the same row. | same |
| 2 | **Reference** | Download the IG reel into `<video folder>/reference/`. Claude transcribes it (`transcribe.py`). | same |
| 3 | **Script** | Line 1 copied **word for word** from the original. About 3.7 words/s. Ends with "Comment PAW and I'll send you my complete dog training guide." **Builder approves.** | same |
| 4 | **Voice** | ElevenLabs "Holden", saved as `voice.mp3`. The CTA reuses `cta-comment-paw.mp3` (in `example/heatstroke/`, from Drive). | ElevenLabs "Brian – Relatable Everyman". Claude paces the pauses and adds 1.3 s of lead silence. **Never clone the voice into Higgsfield** (ToS). |
| 5 | **Shot list** | Only shot types from the locked shot library (`PLAYBOOK-DOG-APP.md`). | Timed beats, plus a JSON prompt that follows `pipeline/realistic/PROMPT-STYLE.md`. **Builder approves (~2 min).** |
| 6 | **Build** | Copy the **last approved sibling** project in `example/`. One builder agent per job. | One 720p take (~119 cr). **Builder approves the spend first**, within the credit cap. |
| 7 | **QA** | Claude checks every 3rd frame at full size against `QA_checklist.md` (mandatory). It does up to 3 fix rounds and logs them in `work/defects_v<N>.md`. **The builder reviews the flagged frames** and decides: fix, or keep as a known issue. | same; realistic section of the checklist |
| 8 | **Final** | The builder locks it. Name: `<Topic>.mp4` (first approved has no `_vN`). Copy the **editing pack** next to it. | same (no editing pack) |
| 9 | **Deliver** | Upload to the Drive folder, one per video (e.g. `Cartoon 02 – Heatstroke`). **Open Drive and check the file actually landed** (an upload failed silently on 2026-11-20). Fill `delivery.md`. | same (e.g. `Realistic 02 – <Topic>`) |
| 10 | **Log** | Fill the tracker row: status, Drive link, current version, **credits spent**. Claude never edits Google Sheets. | same |

Each video has a `brief.md` (from `Brief_template.md`) whose **Status:** line is updated at every step.
Video folder: cartoon = `example/<slug>/`; realistic = `pipeline/realistic/<slug>/`.

## Edit an existing video

1. Write the change in the tracker (**Change request**, **Change status** = Open).
2. Make it:
   - **Cartoon:** Claude edits the project and re-renders **only the affected shots** (frame ranges), then re-runs `finish.sh`.
   - **Realistic:** fix it in post (trim, cut, captions, audio), or, if post can't fix it, make a new take within the credit cap.
3. Run the same QA on the changed part.
4. Save as `<Topic>_v2.mp4` (then `_v3` …), redeliver to the same Drive folder, verify it landed, and update **Current version** and **Change status** = Done.

## Editing pack (cartoon)

Next to each cartoon final, copy `voice.mp3` (or `voice.wav`), `music.wav` and `sfx.wav` from the project folder, and upload them with the video. That way anyone can re-mix by hand in CapCut without the kit.

## Credits (shared Higgsfield balance)

- **Cap per realistic video:** one 720p take plus at most one retry, **about 240 cr**. Cartoon videos use no Higgsfield video credits.
- Log every spend in the tracker (Credits spent).
- **Shared balance below 500 cr: warn in the delivery note and the tracker.** Top-ups are David's money call.
- At 3 videos a week (2 cartoon + 1 realistic) ≈ **125–165 cr/week**. The Ultra plan adds about 3,000 cr/month.
- **Upgrade trigger:** 5+ videos a week → a template project plus parallel builds.

## When something goes wrong

- Never "finalize" a 480p draft: it costs 208–224 cr, more than a fresh 720p take.
- No video edit mode (128 cr; it keeps the old camera path and risks the face and lip sync).
- Never use a video reference to change the camera style: it copies the camera too (a 119 cr lesson).
- At most **1** Higgsfield retry per video, inside the cap.
- Never regenerate a locked final. Fix it in post, or use the edit flow.
- A render fails: re-run only the failed frame range.
- An agent drops mid-job: a fresh agent reads the brief's Status line and the latest `defects_v<N>.md`, and continues.

## Files here

- `SETUP.md`: one-time setup for a new builder machine
- `Brief_template.md`, `Shotlist_template.md`, `QA_checklist.md`, `Delivery_template.md`: copy into the video folder as `brief.md`, `shotlist.md`, `delivery.md`
- `Tracker_columns.md`: the Google Sheet columns (Nel creates the sheet)
- `realistic/PROMPT-STYLE.md`: locked Higgsfield references and prompt style. The character images come from the Drive folder.
- Claude command: `.claude/commands/pawko-video.md`

Sources: `PLAYBOOK-DOG-APP.md`, `example/redo-parts/PARTS-README.md`, `example/heatstroke/work/defects_v4.md`, `pipeline/realistic/PROMPT-STYLE.md`.
