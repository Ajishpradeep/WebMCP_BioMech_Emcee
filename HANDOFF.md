# HANDOFF — running project state

> **New session? Read this file first, then [`CLAUDE.md`](CLAUDE.md).** This is the live log of what
> is done, what was learned, and what to do next. It is updated at the end of every completed task.

**Last updated:** 2026-08-30, end of Task 3
**Next task:** [Task 4 — frame extraction + person crop](PLAN.md#task-4--frame-extraction--person-crop)

---

## 0. What is this project? (30-second orientation)

**PitchLab** — a baseball-pitching biomechanics web app built for
[The WebMCP Challenge](https://webmcp.devpost.com/) (**deadline Thu Sep 3, 2026, 1:00 PM PDT**;
the live URL must stay up through **Sep 21**).

The pitch: *stop trying to be the brain; be the instrument.* A specialist vision model
(Meta's SAM 3D Body) reconstructs a pitcher in 3D from ordinary video. We derive rigorous
biomechanics from that, render it in an interactive 3D viewer — and expose the whole analysis as
**WebMCP tools**, so any agent (ChatGPT's in-app browser, Chrome) can read the measurements *and
drive the viewer* while the human watches the same reconstruction.

**The architecture in one line:** heavy GPU inference happens **offline** (Tier A, Python) and emits
`session.json`; the **web app is a static build** (Tier B) that computes all biomechanics **in the
browser** and registers the WebMCP tools.

---

## 1. Where to look for things

| I need… | Read |
|---|---|
| Product scope, non-goals, the honesty contract | [`SPEC.md`](SPEC.md) |
| Task list, day budget, cut list | [`PLAN.md`](PLAN.md) |
| Settled decisions, "do not re-litigate" | [`CLAUDE.md`](CLAUDE.md) |
| Architecture, pipeline, data contract, metrics + citations | [`.claude/steering/tech.md`](.claude/steering/tech.md) |
| **The 13 WebMCP tools — the graded artifact** | [`.claude/steering/webmcp-tools.md`](.claude/steering/webmcp-tools.md) |
| Verified WebMCP API facts (don't re-derive) | [`docs/webmcp-technical-reference.md`](docs/webmcp-technical-reference.md) |
| Contest rules, judging, submission bar | [`docs/webmcp-challenge-brief.md`](docs/webmcp-challenge-brief.md) |
| Model/footage licensing + the video-rights problem | [`ATTRIBUTION.md`](ATTRIBUTION.md) |

**Environment:** the project venv is **`.venv` (Python 3.12)** at the repo root — already provisioned.
Run pipeline scripts as `.venv/bin/python pipeline/<script>.py`. Rebuild from scratch with
`pipeline/setup.sh`.

---

## 2. Task status

| Task | Status | Notes |
|---|---|---|
| 1 — SAM 3D Body access | ✅ **Done** | Access **approved**. `hf auth whoami` → `AjishPradeep`. Checkpoints downloaded (2.7 GB). |
| 2 — Env + install + smoke test | ✅ **Done** | torch 2.6.0+cu124, CUDA on RTX A6000. Model runs; skeleton verified against a real frame. |
| 3 — Demo footage | ✅ **Done** | 2 clips selected + manifested. ⚠️ **Licensing unresolved — see §5.** |
| 4 — Frame extraction + person crop | ⏭️ **Next** | |
| 5 — Per-frame inference runner | | |
| 6 — 🔒 Freeze `session.json` schema | | **Schema needs revision before freezing — see §4.** |
| 7 — Smoothing + export | | |
| 8–10 — Biomechanics engine (TS) | | |
| 11–12b — Web app + 3D viewer | | |
| 13–16 — WebMCP tools ★ | | The graded artifact. Protect this time. |
| 17–18 — Deploy + submit | | |

---

## 3. Verified facts (measured on this machine — trust these over the docs)

### Hardware / performance
- **GPU:** NVIDIA RTX A6000, 48 GB, driver 550.54.15, CUDA 12.4
- **Inference: 160 ms/frame** (6.3 fps), **3.6 GB peak VRAM**, `inference_type="body"`
- **Model load: ~17 s** — amortize it; never reload per frame
- **Full frame budget for both clips: ~5 minutes.** No subsampling needed.

### SAM 3D Body output contract (measured, not from the README)

`estimator.process_one_image(img_bgr, bboxes=..., inference_type="body")` → `list[dict]`, one per box:

| Key | Shape | Use |
|---|---|---|
| `pred_keypoints_3d` | **(70, 3)** | ★ primary input — MHR-70 keypoints, camera frame |
| `pred_keypoints_2d` | **(70, 2)** | overlay + sanity checking, in source-image pixels |
| `pred_joint_coords` | **(127, 3)** | ★ full MHR skeleton joint positions |
| `pred_global_rots` | **(127, 3, 3)** | ★★ **per-joint global rotation matrices** |
| `pred_vertices` | (V, 3) | mesh (unused — skeleton is enough) |
| `pred_cam_t` | (3,) | camera translation |
| `focal_length` | scalar | **estimated**, e.g. 1018.2 — not calibrated |
| `body_pose_params` / `shape_params` / `scale_params` | — | MHR parameters |
| `bbox` | (4,) | the box actually used |

> **★★ Important discovery for Task 8:** `pred_global_rots` gives *per-joint 3×3 rotation matrices*
> across all 127 MHR joints. This is a much better basis for joint angles — especially
> internal/external rotation — than differencing keypoint positions. **Investigate this before
> writing `angles.ts`.** It may let us raise shoulder ER from `low` to `medium` confidence.
> Caveat: the joint *ordering* for the 127-joint rig is not yet mapped; `mhr70` only names the
> first 70 keypoints. Mapping it is an open sub-task.

### MHR-70 keypoint indices (from `sam_3d_body/metadata/mhr70.py` — authoritative)

```
 0 nose            5 left-shoulder    6 right-shoulder   7 left-elbow      8 right-elbow
 9 left-hip       10 right-hip       11 left-knee       12 right-knee     13 left-ankle
14 right-ankle    15 l-big-toe       16 l-small-toe     17 l-heel         18 r-big-toe
19 r-small-toe    20 r-heel          41 right-wrist     62 left-wrist     69 neck
63 l-olecranon    64 r-olecranon     65 l-cubital-fossa 66 r-cubital-fossa
67 left-acromion  68 right-acromion
21–40 right-hand fingers            42–61 left-hand fingers  (out of scope)
```

**There is no pelvis / spine / thorax keypoint.** Derive them:
- `pelvis` = midpoint(9, 10) · `pelvis transverse axis` = kp[10] − kp[9]
- `thorax` = midpoint(67, 68) · `thorax transverse axis` = kp[68] − kp[67]
- **hip–shoulder separation** = angle between those two axes projected on the transverse plane
- Prefer **acromion (67/68)** over shoulder (5/6) as the shoulder joint centre
- `olecranon` + `cubital fossa` (63–66) define the elbow axis → useful for forearm orientation

### Install notes
- **detectron2 is NOT needed** and is not installed. `process_one_image` accepts explicit `bboxes`,
  which bypasses the built-in ViTDet detector entirely. Use **torchvision Faster R-CNN** for
  detection (BSD, no build step, no AGPL).
- pyrender / MoGe / SAM3 also skipped — see `pipeline/requirements.txt` for the reasoning.
- Loading prints a long **"missing keys in source state_dict"** warning listing
  `head_pose.mhr.character_torch.*`. **This is benign** — those buffers come from
  `assets/mhr_model.pt`, loaded separately with `strict=False`. Output is correct. Don't chase it.
- Load the model via `load_sam_3d_body(checkpoint_path=..., mhr_path=...)` with **local paths**.
  `load_sam_3d_body_hf()` calls `snapshot_download` and would fetch a second 2.7 GB copy into the
  HF cache.

---

## 4. ⚠️ Schema changes required before Task 6 freezes it

`.claude/steering/tech.md` §4 sketched `session.json` **before** we knew the real output. Two
corrections are needed:

**(a) The joint list was guessed.** It named `spine`, `thorax`, `l_foot` — none exist in MHR-70.
Replace with the real subset, derived per §3 above.

**(b) Add a `timebase` block — both demo clips are slow-motion at an unknown factor.**

```jsonc
"timebase": {
  "videoFps": 60.0,
  "slowMotion": true,
  "realTimeScale": null,      // multiply video seconds by this for real seconds; null = unknown
  "scaleSource": "unknown"    // "unknown" | "user" | "estimated"
}
```

**Consequences — these are correctness rules, not preferences:**

| Quantity | Valid under unknown slow-motion? |
|---|---|
| Joint angles at events | ✅ Yes — time-independent |
| Kinematic sequence **order** (pelvis→trunk→arm→…) | ✅ Yes — monotonic time reparameterization preserves order |
| **Normalized** timing (% of the foot-contact→release window) | ✅ Yes |
| Absolute angular velocity in °/s | ❌ **No** — report `unavailable` unless `realTimeScale` is set |
| Pelvis→trunk separation time in seconds | ❌ **No** — report as % of the FC→BR window instead |

This *strengthens* the honesty story rather than weakening it: it is another real limit the tools
declare rather than paper over. Fold it into `confidence.ts` (Task 10) and surface it in the `meta`
block of every tool response.

---

## 5. ⚠️ Open risk: source-footage rights

The clips in `input_baseball/` are YouTube-sourced MLB/broadcast footage. They are **git-ignored**
and used only as local development input. They are **not** cleared for redistribution, and
`.claude/steering/tech.md` §7 nominally forbids them.

**Current mitigation (already architectural):** the web app renders the **3D skeleton**, not the
video. Only derived `session.json` ships. **Do not add a video-playback pane without resolving this.**

**Decide before submission** — see [`ATTRIBUTION.md`](ATTRIBUTION.md) for the full table:
self-record a pitch (cleanest), or ship 3D-only with no source imagery anywhere including the demo
video, or re-run on a CC-licensed clip.

---

## 6. What exists on disk

```
pipeline/
  setup.sh              reproduce the whole Tier-A env from scratch
  requirements.txt      deps, with notes on what upstream asks for that we skip and why
  clips.json            ★ clip manifest — declarative input to the pipeline
  smoke_test.py         Task-2 gate: runs the model on one image, dumps the output contract
  bench.py              per-frame timing / VRAM measurement
  checkpoints/          [git-ignored] 2.7 GB SAM 3D Body weights
  vendor/sam-3d-body/   [git-ignored] upstream repo @ b5c765a
  data/frames/          [git-ignored] extracted frames
  out/                  [git-ignored] smoke_overlay.png etc.
input_baseball/         [git-ignored] source video — see §5
```

**Verify the environment is healthy at any time:**

```bash
.venv/bin/python pipeline/smoke_test.py pipeline/data/frames/smoke_scherzer.png
```

Expect: `pred_keypoints_3d (70, 3)`, `focal_length ≈ 1018`, and a written
`pipeline/out/smoke_overlay.png` whose skeleton lands on the pitcher.

---

## 7. Task 4 — what to do next

**Goal:** turn each manifest entry into per-frame images + a per-frame person bounding box.

1. Read `pipeline/clips.json`; extract frames with `ffmpeg` over `[startSec, endSec]`, preserving
   true fps.
2. Run **torchvision Faster R-CNN** per frame; keep COCO class 1 (person); select the
   **largest-area box nearest frame centre** — the Scherzer clip has a second player near the
   outfield wall that must not be selected.
3. Smooth the box across frames (the pitcher translates a long way during the stride) and pad ~15%.
4. Write `pipeline/data/frames/<sessionId>/frame_%05d.png` + a `boxes.json` of per-frame boxes.

**Design note:** feed the **full frame plus an explicit bbox** to `process_one_image` — *not* a
pre-cropped image. Then `pred_keypoints_2d` comes back in original-image pixels, which makes the
Task-5 sanity overlay trivial and removes all crop-offset bookkeeping.

**Verification:** frame count matches `(endSec − startSec) × fps`; render the chosen boxes onto a
sample of frames and confirm every box contains the pitcher head-to-feet.
