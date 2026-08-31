# HANDOFF — running project state

> **New session? Read this file first, then [`CLAUDE.md`](CLAUDE.md).** This is the live log of what
> is done, what was learned, and what to do next. Updated at the end of every completed task.

**Last updated:** 2026-08-31, after initializing the official Devpost workflow and drafting the
submission package
**Next task:** finish Task 16 against the public HTTPS origin, then replace the provisional
professional-player sessions with cleared footage before recording the final demo. The public
workspace is <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app>; the requirements-backed submission
draft is [`devpost-submission.md`](devpost-submission.md), and deployment details are in
[`docs/deployment.md`](docs/deployment.md). Recovery sequence and commit gates: [`PLAN.md`](PLAN.md).

---

## 0. What is this project? (30-second orientation)

**PitchLab Review** — a shared baseball-pitching biomechanics evidence workspace built for
[The WebMCP Challenge](https://webmcp.devpost.com/) (**deadline Thu Sep 3, 2026, 1:00 PM PDT**;
the live URL must stay up through **Sep 21**).

The pitch: *stop trying to be the coach; be the shared instrument.* A specialist vision model
(Meta's SAM 3D Body) reconstructs a pitcher in 3D from video. The browser turns that reconstruction
into a deliberately bounded set of kinematic observations and renders them in an interactive 3D
workspace. **WebMCP tools** let an agent inspect the live session, navigate to evidence, explain
limitations, and pin review notes while the human judges the same reconstruction.

**Claim boundary:** this is a review and evidence-navigation tool, not a validated replacement for
marker-based motion capture, a diagnostic system, or an autonomous pitching coach. Comparisons are
shown only when the implementation and published reference use compatible measurement constructs.

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
| Public URL, GCP service, and reproducible deployment | [`docs/deployment.md`](docs/deployment.md) |
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
| 8–10 — Biomechanics engine | ✅ | `web/src/biomech/`, 27 unit + real-data tests green. |
| 12b — Metrics panel | ✅ | Readings, confidence badges, cited definitions, sequence chart. |
| **13–15 — WebMCP tools ★** | ✅ code / 🟡 live | 13 handlers implemented; registration is one stable document surface with a visible partial/failure state; live registration is still unverified. |
| 16 — Verification + evals | 🟡 | Headless half done ([`evals/pitch-analysis.md`](evals/pitch-analysis.md)); **DevTools + ChatGPT in-app browser still owed.** |
| 16b — Scientific truth gate | 🟡 phase 1 | Incompatible comparisons removed and four-segment sequence labeled; manual event-frame validation remains. |
| P1 — Human event correction | ✅ | Reviewers can apply the current frame to FC/MER/BR; analysis and WebMCP reads update together. |
| 17 — GCP deploy | ✅ | Public Cloud Run origin verified; see [`docs/deployment.md`](docs/deployment.md). |
| 18 — Submission package | 🟡 | README, license, and Devpost draft complete; cleared footage, live-host verification, screenshots, video, and final form answers remain. |

The public UI intentionally shows only precomputed review sessions. The local CUDA upload panel is
available in development but hidden in the deployed static build, so judges do not encounter a
non-functional upload path.

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

> **★★ INVESTIGATED AND REJECTED — do not retry without new information.**
> `pred_global_rots` are valid rotation matrices (det = 1, orthonormal to 2.4e-7), and the 127-joint
> hierarchy *is* recoverable (`joint_parents` in `assets/mhr_model.pt`; chains verified against the
> named keypoints: legs `2,3,4,5` = LEFT / `18,19,20,21` = RIGHT, arms `38–41` = RIGHT /
> `74–77` = LEFT — **arms and legs use opposite L/R index order**).
>
> But they are **not usable as segment frames**. Two tests both fail:
> - Forward kinematics does not close: `J[i] ≈ J[parent] + R[parent]·(s·offset[i])` gives a 4.8%-of-span
>   residual and a *negative* fitted scale.
> - Bone direction is not constant in the joint's own frame (spread 0.4–0.98 on unit vectors), which
>   is the defining property of a rigid segment frame.
>
> They are Momentum rig frames carrying prerotations and a parameter-transform chain we would have to
> reverse-engineer. **Not on the critical path.** We build ISB segment frames from landmarks instead
> (see §9), which is what the biomechanics literature specifies anyway.

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

## 4b. The biomechanics engine — how it actually works

`web/src/biomech/` — pure TypeScript, no React, 27 tests.

| File | Role |
|---|---|
| `vec.ts` | Vector maths, ISB frame construction, Z–X–Y and Y–X–Y Euler decompositions |
| `frames.ts` | **Anatomical segment coordinate systems from landmarks** — the core |
| `angles.ts` | Clinical joint angles, per-frame series, frame continuity pass |
| `events.ts` | Foot contact · MER · ball release |
| `sequence.ts` | Angular speed, peak order, proximal-to-distal check |
| `reference.ts` | Published ranges **with citations** — single source of truth |
| `confidence.ts` | Grading; the worst of plane / timebase / scale wins |
| `analyze.ts` | Orchestrator → `AnalysisResult` (what the WebMCP tools will expose) |

**Convention (ISB):** `ey` = long axis proximal · `ez` = medio-lateral to the subject's right ·
`ex` = anterior. All maths in a Y-up right-handed world.

**Why this beats joint positions:** MHR-70 includes `olecranon` (posterior elbow) and
`cubital_fossa` (anterior elbow). That pair is the elbow's **antero-posterior axis** (verified:
|cos| ≈ 0.15 against the flexion-plane normal, i.e. near-perpendicular). Combined with the humerus
long axis it gives a full 3-DOF arm frame — which is what makes **shoulder axial rotation
observable at all**. A unit test proves it: rotate the forearm about the humeral axis and the joint
centres do not move (< 1e-4°), yet the engine recovers the full 90°.

### ⚠️ Two traps this cost us
1. **Frame flip ambiguity.** `frameFrom` can return a frame or its 180° flip about the long axis —
   both right-handed, both valid. Frame to frame that produced fake ~70°/frame rotations and
   angular speeds of 4278 deg/s. `frameSeries()` runs a **continuity pass** to fix it. Do not remove.
2. **Branch-cut wrap.** atan2-derived angles jump ±360°. `metricSeries()` unwraps the six affected
   metrics. Do not remove.

### Validation status (2026-08-31)
On the clean Skenes clip, six metrics land **within** published reference ranges that were never
tuned to: lead knee flexion 47.9° at FC [40–49], shoulder abduction 97.7° at MER [66–100], lead knee
37.8° [31.2–41] / elbow 37.8° [24–39] / shoulder abduction 92.3° [70–94] / trunk forward tilt 48.3°
[30–55] at BR. Sequence is proximal→distal with 14.4% pelvis→trunk separation. That is meaningful
independent evidence the engine is right.

**Known open items** (honest state, not hidden):
- `hip_shoulder_separation` reads small and negative at FC (−7°) where literature expects +30–60°.
  Sign convention and/or reference-frame definition needs review.
- `shoulder_external_rotation` reads ~85° where the clinical convention reports 166–182°. The ISB
  Y–X–Y axial term is not the same construct as the clinical "lay-back" measure. Already graded
  `low`; needs either a convention change or an explicit note that the two are different quantities.
- `trunk_lateral_tilt` reads ≈0 where 21–29.5° is expected.
- Event detection on the **Scherzer** clip is poor (FC→BR only 13 frames). It is an edited coaching
  breakdown; **Skenes is the reference session.**

## 4c. The WebMCP tool surface — how it actually works

`web/src/webmcp/` — 13 tools, 9 read / 4 write. This is the graded artifact.

| File | Role |
|---|---|
| `registry.ts` | ★ `toolResult()` return-shape choke point · error convention · `meta` builder · `nextPaint()` · `registerTools()` |
| `vocab.ts` | Natural-language → canonical ids. All the fuzziness lives here so handlers stay strict |
| `useWebMCP.ts` | Registration lifecycle: one `AbortController` per loaded pitch |
| `tools/read/session.ts` | A · `list_pitch_sessions` · `get_session_overview` |
| `tools/read/measure.ts` | B · `get_phase_events` · `get_kinematics_at_event` · `get_joint_angle_series` · `get_kinematic_sequence` |
| `tools/read/evidence.ts` | C · `get_metric_definition` (+ the structured refusals) · `compare_to_reference` · `compare_pitches` |
| `tools/write/viewer.ts` | D ★ · `seek_to_event` · `focus_joint` · `set_overlay` · `annotate_frame` |
| `tools.test.ts` | 35 assertions running every handler against both real sessions |

**Things worth knowing before you change any of it:**

- **`toolResult()` is the only place the return shape is decided.** Today it is the identity
  function (plain objects, per the spec's `Promise<any>`). If a live agent turns out to need the
  MCP `{content:[…]}` envelope, wrap it there and nowhere else.
- **Errors are returned, not thrown.** `runTool()` converts a `ToolInputError` into
  `{ ok: false, error, validValues, retryable: true }` so the model gets the list of values that
  would have worked. Unexpected exceptions get a clean message; the stack goes to the console.
- **Write tools `await nextPaint()` before returning** — agents read the page to plan the next
  step, so the UI must have changed by the time they do. It falls back to a timer where rAF never
  fires (hidden tab, Node under test).
- **Output budget is enforced by test**, hard ceiling 3 000 chars. Three tools were over and were
  trimmed; see `evals/pitch-analysis.md` §2 before adding a field to any response.
- **`compare_pitches` analyses the second pitch off-screen** via `store.analysisFor()`, which caches
  into `store.cache`. It never yanks the human's view to the other session.
- **`angle_readouts` now does something.** It was a dead toggle; `focus_joint` turns it on and
  `SkeletonViewer` renders the focused joint's angles in 3D. Without that, two write tools would
  have had no visible effect — which would have undermined the whole submission claim.
- **`reference_ghost` does not exist** (PLAN cut list #2). `set_overlay` returns a retryable error
  naming the five real overlays rather than accepting a no-op. Full deviation list in the eval doc §4.

**Still owed on Task 16:** DevTools registration + "Run tool" for all 13, write tools visibly moving
the screen, and end-to-end in ChatGPT's in-app browser. Those need the deployed HTTPS origin.

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

### ⚠️ Source clips can contain FREEZES
The Scherzer clip freezes for **2.90 s** (frames 333–507 of the raw video). A frozen run silently
destroys event detection and every rate metric. `pipeline/run.py` now **detects duplicate-frame runs
and warns loudly**; `clips.json` windows are set to exclude them. Always read the pipeline warnings.

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
  src/webmcp/                     ★ the 13 WebMCP tools — the graded artifact (§4c)
  public/sessions/                ★ committed static analyses (the deployed data)
evals/pitch-analysis.md           ★ tool-surface verification record + prompt evals
```

---

## 8. Next: finish Task 16, then ship

1. **Task 16, browser half.** Work the unticked boxes in `evals/pitch-analysis.md` §1. The one that
   can silently invalidate the rest is the **return-shape convention** — confirm against a live
   agent before recording the demo, and if it needs the envelope, change `toolResult()` only.
2. **Task 18 — submission assets.** The public Cloud Run deployment, README, license, and initial
   Devpost draft are complete. Replace the provisional professional-player sessions with cleared
   footage, capture final screenshots, and record the public narrated demo under three minutes.
3. **Task 18 — final form.** Use [`devpost-submission.md`](devpost-submission.md) as the controlled
   draft. **Lead with `annotate_frame`** — the
   agent's reasoning becoming a persistent pin in the human's workspace is the strongest single
   argument in the submission. The line for the Devpost description: *4 of 13 tools are write tools
   that act on the human's live 3D view.*

⚠️ Unresolved and blocking final submission: **source-footage rights** (§6 above). The current
professional-player sessions may be used for provisional internal validation, but not the final
submission assets unless rights are cleared.
