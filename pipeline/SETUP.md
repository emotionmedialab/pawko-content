# One-time setup for a new builder machine

Do this once per computer, then use `/pawko-video` in Claude Code. Paths are relative to the kit root (`cartoon-short-kit/`).
Sources: `README.md` ("0. Install the tools"), `PLAYBOOK-DOG-APP.md` (section 1, Windows setup) and `tools/setup.sh`. If they disagree, the PLAYBOOK wins.

## 1. Get the kit and the media

```bash
git clone https://github.com/emotionmedialab/pawko-content.git cartoon-short-kit
cd cartoon-short-kit
```
- Git holds the code and docs only. **Big media comes from the Drive folder:** reference reels, voices/music/SFX (`*.mp3`, `*.wav`), finals (`*.mp4`), the realistic character images.
- Open `cartoon-short-kit/` as the project folder in Claude Code (that is where `/pawko-video` lives).

## 2. Install

| Tool | Version | Notes |
|---|---|---|
| Claude Code | latest | |
| Node | 22.6 or newer (Nel's machine: Node 24) | |
| Python 3 | with `numpy`, `Pillow`, `faster-whisper` | `pip install numpy pillow faster-whisper` |
| ffmpeg | any recent (Nel's machine: ffmpeg 8) | must be on PATH; `ffmpeg -version` |
| Playwright + Chromium | Nel's machine: 1.64, installed globally | `npm i -g playwright && npx playwright install chromium` |
| Git Bash (Windows only) | comes with Git for Windows | the kit's `.sh` scripts run in bash |

## 3. Restore the files git leaves out (per project you open)

`.gitignore` skips each project's `web/models/`, `web/lib/three.module.js` and `out/`. Restore them from the kit (same sources as `tools/setup.sh`):
```bash
P=example/<slug>
cp -r characters/puppy-3d/models "$P/web/"
T=$(mktemp -d) && (cd "$T" && npm pack three@0.160.0 && tar xzf three-0.160.0.tgz)
mkdir -p "$P/web/lib" "$P/out" && cp "$T/package/build/three.module.js" "$P/web/lib/"
```
(`tar` with a `C:\...` path fails in Git Bash, hence the `cd`. `finish.sh` fails without `out/`.)
Then link Playwright into the project: on Mac `mkdir -p $P/node_modules && ln -s "$(npm root -g)/playwright" $P/node_modules/playwright`; on Windows see below.

## 4. Windows-only fixes (from the PLAYBOOK; skip on Mac)

- Use **`py`**, not `python3` (on Windows `python3` is a broken Microsoft Store stub). Install packages with `py -m pip install ...`.
- `tools/setup.sh` and `tools/add-puppy3d.sh` **don't work on Windows**. Start new projects by copying the last approved sibling project (PLAYBOOK section 1).
- `ln -s` in Git Bash copies instead of linking, so link Playwright as a **junction** (PowerShell, from the kit root):
  ```powershell
  $p = "example\<slug>"; New-Item -ItemType Directory -Force "$p\node_modules" | Out-Null
  cmd /c mklink /J "$p\node_modules\playwright" "$env:APPDATA\npm\node_modules\playwright"
  ```
- GPU rendering (`GPU=1`) uses `--use-angle=d3d11` on Windows (Metal on Mac); already in each project's `render.mjs`. Ignore the `X3595 gradient instruction` shader warnings.
- `transcribe.py` must use `device="cpu"` (otherwise it fails on the missing `cublas64_12.dll`); already set in the project copies.
- `posetest.sh` and `finish.sh` call `py -c`; on Mac change it to `python3 -c` in your project copy.

## 5. Logins

- **Higgsfield:** the shared credit account (Ultra plan). Log every spend in the tracker; cap ≈ 240 cr per realistic video.
- **ElevenLabs:** voices "Holden" (cartoon narrator) and "Brian – Relatable Everyman" (realistic trainer). Never clone a voice into Higgsfield.
- **Google Drive:** write access to the PawkoMarketing folder (delivery + media), and edit access to the tracker sheet. View access to James's "Videos to Redo Pawko" sheet (ideas; green row = approved to make): https://docs.google.com/spreadsheets/d/1Z3wrKaSvrv6-7nDRYcMHl1WxzV9xxoYEU41pglR0iwE

## 6. First test: render an existing example

In Git Bash, from the kit root, after step 3 for `example/redo-parts`:
```bash
cd example/redo-parts
HASH="#h" GPU=1 node render.mjs stills/setup-test "0-60" 6
```
- Expect `done 11 frames` and JPGs of the puppy pose gallery in `stills/setup-test/` (Nel's machine: ~0.1–0.9 s/frame on GPU).
- Drop `GPU=1` if it fails: the CPU path (SwiftShader) works on any machine, just slower.
- Then check ffmpeg and transcription: `ffmpeg -version` and `py -c "import faster_whisper, numpy, PIL"`.
- Delete `stills/setup-test/` afterwards.

## 7. Full test: re-render Heatstroke

After step 3 for `example/heatstroke`, copy the Drive folder's `example/heatstroke/*` (voice, CTA, music, SFX) into `example/heatstroke/`, then in Git Bash:
```bash
cd example/heatstroke
bash voice_v3.sh && py audio.py && py mix.py voice_v3.wav music.wav sfx.wav
SHOTS=1 GPU=1 node render.mjs frames "0-1686"      # ~3 min on GPU
bash finish.sh "Heatstroke"                         # -> out/Heatstroke.mp4, 56.23 s, about -14.6 LUFS
```
Compare it with the delivered `Heatstroke_v4.mp4`: same length and loudness, frames look the same (tested 2026-11-25: SSIM 0.995).
