# PLAYBOOK: dog-app training videos (3D puppy), Windows

The gold standard is **`example/dog-down-ii/`** (out/Down-II.mp4, 43.2 s, the client approved it). Build every new video from it,
not from roll-over-3d. `SKILL-TRAINING-3D.md` still applies. Where the two disagree, this file wins.
Reference look: James's `..\reference\james-training-style\High-Five.mp4`.

**Nel's QA rules (2026-11-20, apply to every video)**
- Review every 3rd frame at ≥540 px wide, full 1080 for close-ups. Thumbnail sheets miss defects.
- On every close-up/medium shot check: the tongue is inside the mouth; held props (grass, keys, leash, bucket, phone) touch the mouth or hand holding them; no head deformation (seal/blob head, underside-of-jaw angles); hands never cover or pass through faces; no clipping.
- Contact between characters is the #1 failure: no head inside a leg, fist inside a skull, hand swallowing a head. Pets go on the back with the face visible. Keep clearance; frame touch moments side-on or 3/4.
- No character through furniture or doors; props never teleport (cut away on a swap). The 3D scene must fill the frame (no empty floor band at the bottom).
- Zoom-ins are the exception: static or gently drifting camera by default, cut to new angles for variety, push-in only on an emphasis beat (≤ ~1 in 4 shots). Never fix a static hold with a push-in; cut or add character action.

**Hard rules**
- Never call paid tools or services: no ElevenLabs, Higgsfield, Suno or paid MCPs.
- Never upload, commit or push, edit the Google Sheet, or message anyone.
- Stay inside `cartoon-short-kit\`. Don't edit `characters/` or `tools/`; fix things in the project copy.
- Write the script, then **hand it to the coordinator**. The coordinator supplies the narrator file (ElevenLabs "Holden").
  Save it as `example/<slug>/voice.mp3`. Don't build the final timing on a TTS stand-in.

---

## 1. Windows setup (once per machine, then once per project)
The machine has Git Bash, `py` (Python 3.14 with numpy and Pillow), Node 24, ffmpeg 8 and global Playwright 1.64.
`python3` is a broken Windows Store stub: **always use `py`**.

```bash
py -m pip install faster-whisper          # once per machine; installs fine on 3.14
```

Run **`tools/setup.sh` and `tools/add-puppy3d.sh` do not work on Windows**. setup.sh passes a `/c/...` path to `node -e`, so
`toonbase.js` and `toon.js` are never written, and `set -e` exits before the Playwright link. Do the setup by copying the gold project:

```bash
cd /c/Users/admin/Desktop/Work/dog-app/cartoon-short-kit/example
S=dog-<slug>; G=dog-down-ii
mkdir -p $S/web $S/work $S/stills $S/out
cp -r $G/web/. $S/web/                      # story.js, main.js, tutorfx.js (with fxBubble), toon.js, three, GLB, hand, rig, lib/
cp $G/{audio.py,mix.py,finish.sh,render.mjs,snap.mjs,shot.mjs,sheet.py,qasheets.py,transcribe.py,make_voiceenv.py,timing.py,posetest.sh,build.sh} $S/
rm -f $S/web/voiceenv.js
```

If you ever do need to rebuild toon.js, run this inside the project:
```bash
node -e "const m=require('node:module'),fs=require('fs');fs.writeFileSync('web/toonbase.js',m.stripTypeScriptTypes(fs.readFileSync('../../vendor/toon.ts','utf8'),{mode:'strip'}))"
cat web/toonbase.js web/roman.js web/trainer.js web/rolldog.js web/tutorfx.js > web/toon.js
```

Playwright: `ln -s` in Git Bash copies instead of linking, so make a **junction** (PowerShell):
```powershell
$p="C:\Users\admin\Desktop\Work\dog-app\cartoon-short-kit\example\dog-<slug>"; New-Item -ItemType Directory -Force "$p\node_modules" | Out-Null
cmd /c mklink /J "$p\node_modules\playwright" "C:\Users\admin\AppData\Roaming\npm\node_modules\playwright"
```

The project copies already contain these fixes (keep them):
- `render.mjs` and `snap.mjs`: GPU=1 uses `--use-angle=d3d11` on win32 (Metal on Mac). GPU rendering takes **about 0.1 s/frame**.
- `render.mjs`: `SHOTS=1` also writes `work/shots.json` (shot id and frame range) for `qasheets.py`.
- `transcribe.py`: `WhisperModel("base.en", device="cpu", compute_type="int8")`. Without `device="cpu"` it fails on the missing `cublas64_12.dll`.
- `posetest.sh` and `finish.sh` call `py -c`, not `python3 -c`.
- Ignore the `X3595 gradient instruction` shader warnings from D3D. They are harmless.

## 2. Start a new video from dog-down-ii
1. Copy the project as in section 1. Write `script.txt` (SKILL Stage 3: hook "Let's teach your dog ...", about 110 words, ends with
   marker + reward). Send it to the coordinator and wait for `voice.mp3`.
2. Time it:
   ```bash
   py transcribe.py voice.mp3            # -> voice.mp3.words.json
   ffmpeg -i voice.mp3 -af silencedetect=n=-40dB:d=0.2 -f null - 2>&1 | grep -oE "silence_(start|end): [0-9.]+"
   py make_voiceenv.py voice.mp3         # -> web/voiceenv.js (trainer lip sync)
   ```
   **Whisper glitch:** a sentence's first word ("If", "Hold", "and") is often dated 10–20 frames too early. Take any
   sentence-start word from the `silence_end` before it (seconds × 30). Note it in the story.js header.
3. In `web/story.js`:
   - Set `TOTAL = round(duration*30)`.
   - Fill the word table `w` (the first frame of each key word).
   - Put every word frame in the header comment.
   - Rewrite `SHOTS`, `dog3At`, `treatPath`/`leadPath`, `worldAt`, `CAMS` and `fxAt` for the new trick.
   - Key **every** frame to `w` (`w.word ± n`), never to a literal number. That way re-timing for a new voice just means updating `w` + `TOTAL`.
4. In `audio.py`: copy the same `w` table, set `TOTAL`/`DUR`, rewrite the cue table, then:
   ```bash
   py audio.py && py mix.py voice.mp3 music.wav sfx.wav     # check the printout: music -6.0 dB vs voice
   ```
5. Keep these helpers from dog-down-ii and reuse them:
   - `fxBubble` (web/tutorfx.js) and the `bubble()` helper in `fxAt`: pops in with its centre fixed.
   - `calibrate()`: REF.sit/down/stand get nose/head/hip/chest/**elb** (main.js returns the elbow bones).
   - Lure points `N_SIT N_STAND LOW FLOOR REWARD MOUTH`.
   - `HOOKP`/`SH`: the hook puppy sits near the trainer's card plane.
   - `EAT`: the chomp frame per paw shot. `T2`: spacing between repeated treats.
   - The trail `stop` table. `KF` keyframes. `chompAt`.
   - The POV/floating camera numbers in `CAMS`.
   - Lights: only `day` (and `golden` for the "yes"/final shots). There is no `dayB`: one sun direction for every shot.

## 3. Look rules (learned the hard way)
**Framing**
- **POV (hand) shots:** camera about 1.3 m from the dog, 0.8–0.9 m high, fov 42, a 3/4 front view. Aim the look point at the dog's
  middle (look y about 0.2; for a down puppy shift look x to about 0.25 so the face isn't at the edge). Face and chest fill the upper-middle of the frame, like James's.
  - Hand `side` is 0.16 (0.22 when feeding at the mouth). Arms come up from the lower right.
  - The empty or flat hand uses `fingers` along the view direction (e.g. `[-0.85,-0.35,-0.4]`) so the arm rises from below the frame.
- **Floating paw shots:** camera about 1.4 m, 3/4 front, look y 0.22–0.27. Shoot side-on only for "too high" (with sky in frame).
  Shoot from the **lit side** (camera +z with the default sun), never by flipping the sun.
- **Trainer:** in the hook and the "yes" only. His whole face and cap stay in frame. In the hook, the puppy stands about 0.18 m in front
  of his card (HOOKP) so his drawn hand reaches the floor without disappearing below the mat.
- **Badges, bubbles and cursors stay inside the frame.** Check every one on the sheets.
- **No white flashes, no whooshes.** Hard cuts only. A camera move that sweeps over empty grass should become a hard cut.

**Treat, hands and pointers**
- **No trails in POV or hand shots** (lure, fade, cue) or in front-camera paw shots. From the front, a column of beads always
  paints over the face or chest. The hand or paw shows the path.
- **Where trails are allowed, they stop at the floor point.** The final lift to the mouth is never trailed.
- **The reward goes to `REWARD()`** (just under the down puppy's nose). The rig can't lower its nose to the floor, so a treat on the floor is never
  "eaten". Lure to `FLOOR()`, then lift to `REWARD()` over 4–7 frames.
- **The treat disappears on the chomp** (`treatHide`).
- **After the reward, the paw cursor flies up and out of frame** (about 14 frames). Never leave it hovering in front of the face.
- **Hands never vanish:** after a reward they hold for about 10 frames, then pull back below the frame (`[0.95,0.12,0.45]`).
  A new treat appears below the frame.
- **Bubbles** (`fxBubble`): only for the **spoken cue** ("Down!" with small line "just once", white) and the marker **"Yes!"** (pale yellow `#fbf0b4`).
  - Place them above the head, or beside the trainer's face.
  - Scale 0.2 in POV and 0.5 on the trainer shot.
  - Show them from word−2 for about 1.5 s.
  - No other captions.

**Puppy pose**
- Watch the neck when the puppy looks high: cap the look height and use `neck` ≤ 0.4 (popUp: `min(t.y, 0.3+0.16*up)`, neck `0.4-0.08*up`).
  Never hold a nose-straight-up pose for more than about 0.5 s.
- **Pose changes ease over 25–35 frames.** Use a double smooth for a pop-up; never snap.
- **Long holds:** keep the camera creeping (two keys per shot) and the puppy alive (blink, breath, wag, ear). With a real narrator the holds get longer; check them.

## 4. QA: frame by frame, required before the final render
```bash
SHOTS=1 GPU=1 node render.mjs stills/qa "0-<TOTAL-1>" 3     # every 3rd frame + work/shots.json
py qasheets.py stills/qa stills/qa_sheets                    # one labelled sheet per shot
# re-check a range after a fix:
GPU=1 node render.mjs stills/qa2 "<a>-<b>" 3 && py sheet.py stills/qa2 stills/qa2.jpg 12
```
Open every sheet and look at every tile. Check for:
- [ ] trail beads or effects drawn over the dog
- [ ] hand, arm or paw missing, cut off, floating, vanishing or jumping between tiles; treat not in the hand
- [ ] treat "eaten" away from the mouth; paw cursor left on the face
- [ ] dog clipping into or floating above the mat; head bent back like a snorkel or upside-down; face covered by a hand or arm
- [ ] dog or trainer cropped badly; trainer's face cut; badges or bubbles at the edges
- [ ] mirrored text; pops or snaps between consecutive tiles; empty frames
- [ ] each action lands 0–3 frames before its word; holds are not dead
- [ ] the look matches High-Five.mp4 (framing, bubbles, no POV trails)

Fix, re-render the affected range, check again, and repeat until clean. Then render and finish:
```bash
SHOTS=1 GPU=1 node render.mjs frames "0-<TOTAL-1>"
bash finish.sh "Title"            # about -14 LUFS (Holden voice: -14.4), freeze/black QA, out/qa_sheet.jpg (first 30 s)
mkdir -p stills/final3 && for i in $(seq 0 3 <TOTAL-1>); do cp frames/f$(printf %04d $i).jpg stills/final3/; done
py qasheets.py stills/final3 stills/final_sheets          # final per-shot sheets from the real frames
```

## 5. Known rig limits and workarounds
| Limit | Workaround |
|---|---|
| A down puppy can't reach the floor (nose stays about 0.34 m up) | Lure to `FLOOR()`, reward at `REWARD()` |
| The sit pose keeps the head tilted up, even when it looks low | Accept it as "looking at the trainer". Use `neck: 1` and a low look target |
| No real "pop up" pose | Blend `down -> stand` over about 30 frames with a double smooth; cap the look height |
| The rig's "elbow" bone (`flE`/`frE`) sits about 0.16 m up in the down pose | Put elbow rings on the floor below it (`[e.x, MAT+0.006, e.z]`) |
| The trainer card's hand vanishes below the mat when the target is in front of his plane | Keep the target within about 0.18 m of his card plane (HOOKP) |
| No fade on the pointers (they're on or off) | Move them out of frame instead of hiding them |
| `M.inOut` doesn't exist in motion.js | Use `M.smooth` (`sm`) |
| mix.py caps SFX peaks at 0.7× the voice peak, so with Holden SFX sit about −19 dB vs voice | Accept it (kit rule); don't hand-mix |

## 6. Definition of done
- [ ] `out/<Title>.mp4`: 1080x1920, 30 fps, exactly the voice length, about −14 LUFS, no freeze/black spans
- [ ] music −6.0 dB vs voice (mix.py printout)
- [ ] every 3rd frame checked on per-shot sheets and clean; `stills/final_sheets/` built from the final frames
- [ ] every look rule in section 3 respected; trainer only in the hook and the payoff; no flashes or captions except the two bubbles
- [ ] story.js keyed to `w`; the header lists every word frame; PLAN.md updated
- [ ] nothing uploaded, committed or messaged; no paid tools used

**Report back** (short):
1. MP4 path, length, resolution, LUFS
2. Script text
3. Table: shot → frames → what it shows
4. Contact sheet paths (`stills/final_sheets/*`, `out/qa_sheet.jpg`)
5. Fixes made during QA (shot → problem → fix)
6. Render s/frame and wall time
7. What's still weak, honestly

## Coordinator review notes (added 2026-11-17, from reviewing Down III)
1. Never show the trainer as a full-body standing card that slides, hops or flips: it reads as a paper cut-out. Keep him kneeling (as in Down II) or out of frame. Show his movement through the puppy's eye/head tracking plus a dotted footprint path; for walking, use POV hand + camera glide.
2. No head pointed steeply up for more than ~1 s. Keep look targets low; the head turns sideways toward sounds.
3. No static holds over ~1.5 s: add weight shifts, ear flicks, tail, slow push-ins.
4. Check/cross badges always full size, above the dog, inside the frame.
5. Before reporting, view the FINAL per-shot sheets for EVERY shot, built from the final render.

## LOCKED SHOT LIBRARY (coordinator rule, 2026-11-17) — overrides creative freedom
Most bugs so far came from inventing new camera paths/staging. From now on:
1. Use ONLY shot types that exist in `example/dog-down-ii/web/story.js`: hook (kneeling trainer + puppy, front), setup (prop close-up, hard cut), POV hand (front 3/4, ≈1.3 m, 0.8–0.9 m high, fov 42, arm from lower-right), paw-cursor floating 3/4, elbows/ground 3/4, side mistake shot, low orbit calm, yes (golden, kneeling trainer), POV final.
2. Copy that shot's camera keys VERBATIM from dog-down-ii; only change the look-at target / dog position and the timing. No new camera paths, orbits or glides unless the training is impossible to show otherwise — then keep the move short, and check that NOTHING (props, trees, doghouse, crate, trainer card) ever comes between camera and subject.
3. Props (crate, leash, toys, mats) are placed so they never cover the trainer or the dog's face from the locked cameras. The trainer is never behind bars or a prop.
4. Once a sibling video is APPROVED by the coordinator, clone THAT project (not dog-down-ii) and change only the shots that differ.
6. (added after Sit & stay II) No sliding trainer card in ANY direction — not sideways, not toward/away from camera. Use cuts, footprint PAIRS (two ovals, mid-frame, never touching an edge) or the POV hand.
7. Never crop the puppy's body (rear/tail) at a frame edge in side shots; re-target so the whole dog fits.
8. Paw-meets-hand moments: 3/4 side camera from the raised paw's side (client's High-Five framing), arm to the frame edge, contact clearly visible.
