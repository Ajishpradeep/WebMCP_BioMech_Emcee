# HANDOFF — running project state

> **New session? Read this file first, then [`CLAUDE.md`](CLAUDE.md).** This is the live log of what
> is done, what was learned, and what to do next. Updated at the end of every completed task.

**Last updated:** 2026-08-30, end of the web-app build
**Next task:** [Tasks 8–10 — the TypeScript biomechanics engine](PLAN.md#phase-2--biomechanics-engine-tue-am)

---

## 0. What is this project? (30-second orientation)

**PitchLab** — a baseball-pitching biomechanics web app built for
[The WebMCP Challenge](https://webmcp.devpost.com/) (**deadline Thu Sep 3, 2026, 1:00 PM PDT**;
the live URL must stay up through **Sep 21**).

The pitch: *stop trying to be the brain; be the instrument.* A specialist vision model
(Meta's SAM 3D Body) reconstructs a pitcher in 3D from ordinary video. We derive rigorous
biomechanics from that, render it in an interactive 3D viewer — and expose the whole analysis as
**WebMCP tools**, so any agent can read the measurements *and drive the viewer* while the human
watches the same reconstruction.

**Architecture in one line:** heavy GPU inference happens **offline** (Tier A, Python) and emits
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

---

## 2. How to run it

```bash
# 1. Web app (this is the product — works with no GPU and no backend)
cd web && npm install && npm run dev          # → http://localhost:5173

# 2. OPTIONAL: local analysis backend, for real upload → analyse
.venv/bin/python pipeline/server.py           # → http://127.0.0.1:8000  (vite proxies /api)

# 3. Batch-analyse the manifested demo clips
.venv/bin/python pipeline/run.py                          # all clips
.venv/bin/python pipeline/run.py scherzer-delivery-01     # one
.venv/bin/python pipeline/run.py --stride 8               # fast preview

# 4. Health check for the model env
.venv/bin/python pipeline/smoke_test.py pipeline/data/frames/smoke_scherzer.png
```

**Useful dev URLs:** `?session=<id>` opens a specific session, `?frame=640` deep-links a moment.

Python env is **`.venv` (3.12)** at the repo root. Rebuild everything with `pipeline/setup.sh`.

---

## 3. Task status

| Task | Status | Notes |
|---|---|---|
| 1 — SAM 3D Body access | ✅ | Approved. Checkpoints local (2.7 GB, git-ignored). |
| 2 — Env + smoke test | ✅ | torch 2.6.0+cu124, RTX A6000. |
| 3 — Demo footage | ✅ | 2 clips in `pipeline/clips.json`. ⚠️ **Rights unresolved — §6.** |
| 4 — Frame extraction + detection | ✅ | `pipeline/run.py`, torchvision Faster R-CNN. |
| 5 — Inference runner | ✅ | **QA gate passed** — see `pipeline/out/qa_scherzer-delivery-01.mp4`. |
| 6 — 🔒 Freeze schema | ✅ | **Frozen.** `pipeline/joint_map.py` ↔ `web/src/types.ts`. |
| 7 — Smoothing + export | ✅ | Savitzky–Golay. Proportions validated (§4). |
| 11 — Web app scaffold | ✅ | React 19 + Vite 8 + r3f + Zustand. |
| 12 — 3D viewer + timeline | ✅ | Playback, scrub, camera presets, trail, annotation pins. |
| **8–10 — Biomechanics engine** | ⏭️ **NEXT** | Pure TS in `web/src/biomech/`. |
| 12b — Metrics panel | ⏳ | Blocked on 8–10. |
| 13–16 — WebMCP tools ★ | ⏳ | **The graded artifact. Protect this time.** |
| 17–18 — Deploy + submit | ⏳ | |

**Reordered vs PLAN.md**: 4–7 and 11–12 were done together because inference turned out to be
~5 min of compute, and a viewer can't be verified without real data. See the callout in `PLAN.md`.

---

## 4. Verified facts (measured — trust these over docs)

### Performance
- **160–180 ms/frame** inference, **3.6 GB VRAM**, ~17 s model load (RTX A6000).
- Person detection adds ~27 ms/frame.
- Full 869-frame Scherzer clip: **~3 min end-to-end**.

### Reconstruction quality — validated, not assumed
Segment lengths vs. standard anthropometry (fraction of stature), median over 869 frames:

| Segment | measured | expected | |
|---|---|---|---|
| thorax–pelvis | 0.332 | 0.288 | ok (our "thorax" is the acromion midpoint, which sits high) |
| hip–knee | 0.261 | 0.245 | ok |
| knee–ankle | 0.250 | 0.246 | ok |
| acromion–elbow | 0.191 | 0.186 | ok |
| elbow–wrist | 0.160 | 0.146 | ok |

Per-frame segment-length **CV is 3–5%** (a rigid segment should be constant) — good for markerless.
**The reconstruction is anatomically sound.** Re-run the check in
`pipeline/` if you ever change smoothing.

### SAM 3D Body output contract (measured)
`process_one_image(img_rgb, bboxes=…, inference_type="body")` → `list[dict]`:

| Key | Shape | Use |
|---|---|---|
| `pred_keypoints_3d` | (70, 3) | ★ primary — MHR-70, camera frame |
| `pred_keypoints_2d` | (70, 2) | overlay / QA |
| `pred_joint_coords` | (127, 3) | full MHR skeleton |
| `pred_global_rots` | (127, 3, 3) | ★★ per-joint global rotation matrices |
| `focal_length` | scalar | **estimated**, not calibrated |

> **★★ Still unexploited — read before Task 8.** `pred_global_rots` gives per-joint 3×3 rotation
> matrices. That is a better basis for joint angles (especially internal/external rotation) than
> differencing keypoint positions, and could raise shoulder ER from `low` to `medium` confidence.
> **Not yet in `session.json`** — the 127-joint ordering is unmapped (`mhr70.py` names only the
> first 70). Decide in Task 8 whether it's worth the mapping work.

### ⚠️ Two traps that cost time
1. **`process_one_image` treats an ndarray as RGB and will not convert it.** Passing BGR silently
   swaps channels and degrades accuracy with no error. `pipeline/run.py` passes RGB — keep it that way.
2. Model loading prints a long **"missing keys in source state_dict"** warning about
   `head_pose.mhr.character_torch.*`. **Benign** — those buffers load from `assets/mhr_model.pt`
   separately with `strict=False`. Don't chase it.

### Install notes
- **detectron2 is not installed and not needed** — `process_one_image` accepts explicit `bboxes`.
  Person detection uses **torchvision Faster R-CNN** (BSD; avoids Ultralytics' AGPL).
- pyrender / MoGe / SAM3 skipped — see `pipeline/requirements.txt` for why.
- Load via `load_sam_3d_body(checkpoint_path=…, mhr_path=…)` with **local paths**;
  `load_sam_3d_body_hf()` would download a second 2.7 GB copy.

---

## 5. The `session.json` contract (FROZEN)

`pipeline/joint_map.py` `JOINT_NAMES` ↔ `web/src/types.ts` `JOINT_NAMES` must match **exactly, in
order** — `keypoints3d` rows are index-aligned to it. 24 joints, 19 bones.

```
pelvis thorax neck nose
l_acromion l_elbow l_wrist  r_acromion r_elbow r_wrist
l_olecranon r_olecranon  l_cubital_fossa r_cubital_fossa
l_hip l_knee l_ankle l_heel l_big_toe
r_hip r_knee r_ankle r_heel r_big_toe
```

`pelvis` = midpoint(l_hip, r_hip); `thorax` = midpoint(l_acromion, r_acromion). Neither is a model
output. Prefer **acromion** over shoulder as the shoulder centre. `olecranon` + `cubital_fossa`
define the elbow axis — useful for forearm orientation.

**Coordinates are camera-frame**: +X right, **+Y down**, +Z away. The viewer flips Y and Z
(`web/src/viewer/geometry.ts`); that is a *viewing* transform only — never read distances off it.

### ⚠️ `timebase` decides which timing metrics are legal
Both demo clips are slow-motion at an **unknown** factor, so `realTimeScale: null`.

| Quantity | Legal? |
|---|---|
| Joint angles at events | ✅ |
| Sequence **order** (pelvis→trunk→arm→…) | ✅ |
| **Normalized** timing (% of FC→BR window) | ✅ |
| Absolute angular velocity (°/s) | ❌ `unavailable` |
| Separation time in **seconds** | ❌ report as **% of FC→BR** |

`confidence.ts` (Task 10) must force rate metrics to `unavailable` while `realTimeScale` is null.

---

## 6. ⚠️ Open risk: source-footage rights

`input_baseball/` holds YouTube-sourced MLB/broadcast clips. **Git-ignored**, local dev only, not
cleared for redistribution. The architecture already helps — the app renders the **3D skeleton**, not
the video, and only derived `session.json` ships.

**The demo video is where this bites.** Decide before Task 18: self-record a pitch (cleanest), ship
3D-only with no source imagery anywhere, or re-run on a CC-licensed clip. Full table in
[`ATTRIBUTION.md`](ATTRIBUTION.md). **Do not add a video-playback pane without resolving this.**

---

## 7. What exists on disk

```
pipeline/
  setup.sh  requirements.txt      reproduce the Tier-A env
  clips.json                      ★ clip manifest (declarative pipeline input)
  joint_map.py                    ★ MHR-70 → 24-joint contract + bone topology
  run.py                          ★ end-to-end: clip → session.json (+ QA overlay video)
  server.py                       local-only FastAPI upload→analyse backend
  smoke_test.py  bench.py         env health check / timing
  checkpoints/ vendor/ data/ out/ [git-ignored]
web/
  src/types.ts                    ★ session.json types (mirrors joint_map.py)
  src/store.ts                    ★ AnalysisStore — WebMCP tools will read/write THIS
  src/viewer/geometry.ts          camera-frame → viewer-space transform
  src/viewer/SkeletonViewer.tsx   r3f scene, imperative per-frame updates
  src/components/                 Timeline · SidePanel · UploadPanel
  public/sessions/                ★ committed static analyses (the deployed data)
```

---

## 8. Next: Tasks 8–10 — the biomechanics engine

Pure TypeScript in `web/src/biomech/`, **no React imports**, unit-tested with Vitest (not yet
installed — `npm i -D vitest`).

1. **`joints.ts` + `angles.ts`** — signed joint angles from `keypoints3d`. Knee/elbow flexion,
   shoulder abduction + external rotation, trunk forward/lateral tilt, and **hip–shoulder
   separation** (angle between the pelvis axis `r_hip − l_hip` and the thorax axis
   `r_acromion − l_acromion`, projected on the transverse plane).
   *Verify with unit tests on synthetic poses with known angles — every number in the app rests here.*
2. **`events.ts`** — foot contact, MER, ball release (tech.md §5.1). Return
   `{ frame, t, method, confidence }`; write into `store.events` so the timeline markers light up.
3. **`reference.ts` / `confidence.ts` / `sequence.ts` / `analyze.ts`** — published ranges **with
   citations** (tech.md §5.2), confidence grading, kinematic sequence with the mandatory
   `literatureNote`.

**Decide first:** whether to plumb `pred_global_rots` through (see §4 ★★). It is the single biggest
available accuracy win, but costs a 127-joint mapping. If you do, it is a **schema change** — bump
`schemaVersion` and re-run the pipeline.

The store, the viewer, and the timeline are already wired to consume `events` and `annotations`, so
the engine should light up the existing UI without new plumbing.
