# HANDOFF — running project state

> **New session? Read this file first, then [`CLAUDE.md`](CLAUDE.md).** This is the live log of what
> is done, what was learned, and what to do next. Updated at the end of every completed task.

**Last updated:** 2026-09-01, after licensed-session integration and local verification
**Current state:** **CLEARED EVIDENCE GATE.** The owner application review is complete;
its product, UX, and scientific decisions remain preserved below. Tasks 16–18 now advance through
the ordered release gates in [`docs/devpost-resume.md`](docs/devpost-resume.md): live WebMCP proof,
cleared evidence, final deployment reconciliation, then judge-experience validation. The current
Cloud Run build is a provisional validation origin, not submission-final. Native Chrome 154 and an
owner-observed ChatGPT in-app-browser run have now cleared live supported-host validation on the
prior revision. A licensed Pexels session is locally integrated and visually verified; the retained
legacy session's redistribution rights remain unresolved. Do not capture final assets or claim final-build client
compatibility until the corresponding ledger items in
[`evals/webmcp-live-checklist.md`](evals/webmcp-live-checklist.md) are backed by observed evidence.

---

## 0. What is this project? (30-second orientation)

**Biomech Emcee** — a WebMCP-enabled workspace for human-agent review of movement evidence, built for
[The WebMCP Challenge](https://webmcp.devpost.com/) (**deadline Thu Sep 3, 2026, 1:00 PM PDT**;
the live URL must stay up through **Sep 21**).

The pitch: *stop trying to be the coach; be the shared instrument.* A specialist vision model
(currently Meta's SAM 3D Body) reconstructs movement in 3D from video. The browser turns that
reconstruction into deliberately bounded observations and renders them in an interactive 3D
workspace. **WebMCP tools** let an agent inspect the live session, navigate to evidence, explain
limitations, and pin review notes while the human judges the same reconstruction. Baseball pitching
is the only implemented reference workflow, not the intended product boundary; other sports are not
claimed until their domain metrics and validation exist.

**Claim boundary:** this is a review and evidence-navigation tool, not a validated replacement for
marker-based motion capture, a diagnostic system, or an autonomous pitching coach. Comparisons are
shown only when the implementation and published reference use compatible measurement constructs.

**Architecture in one line:** heavy GPU inference happens **offline** (Tier A, Python) and emits
`session.json`; the **web app is a static build** (Tier B) that computes all biomechanics **in the
browser**, presents synchronized 2D/3D review, and registers the WebMCP tools.

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
| Canonical identity, name, and positioning | [`docs/brand-decision.md`](docs/brand-decision.md) |
| How to resume Devpost after the owner app review | [`docs/devpost-resume.md`](docs/devpost-resume.md) |
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
.venv/bin/python pipeline/run.py delivery-01             # one
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
| 3 — Demo footage | 🟡 | Licensed Pexels full-body source integrated as default `delivery-02`; legacy `delivery-01` remains provisional with unresolved YouTube redistribution rights. |
| 4 — Frame extraction + detection | ✅ | `pipeline/run.py`, torchvision Faster R-CNN. |
| 5 — Inference runner | ✅ | **QA gate passed** for the licensed 288-frame Pexels delivery and the retained legacy delivery. The rejected historical 38-frame second view remains removed. |
| 6 — 🔒 Freeze schema | ✅ | **Frozen.** `pipeline/joint_map.py` ↔ `web/src/types.ts`. |
| 7 — Smoothing + export | ✅ | Savitzky–Golay. Proportions validated (§4). |
| 11 — Web app scaffold | ✅ | React 19 + Vite 8 + r3f + Zustand. |
| 12 — 2D/3D viewer + timeline | ✅ | Frame-synchronized source reference beside the 3D reconstruction; playback, scrub, annotation pins, and camera/focus/evidence controls integrated into one transport toolbar. |
| 8–10 — Biomechanics engine | ✅ | `web/src/biomech/`; complete suite currently 85 tests green, including both real-session numerical contracts and synthetic short-clip refusal. |
| 12b — Metrics panel | ✅ | Stable event/live tile grids, confidence/status color, and `i` disclosures for ranges, methods, limitations, and citations. |
| **13–15 — WebMCP tools ★** | ✅ code / ✅ provisional live | Chrome 154 passed all 13 handlers and visible writes; ChatGPT natural-language discovery, navigation, focus, annotation, correction readback, and refusal also passed. |
| 16 — Verification + evals | ✅ provisional origin / 🟡 final retest | Supported-client evidence is recorded in [`evals/webmcp-live-checklist.md`](evals/webmcp-live-checklist.md). Repeat the critical flow after cleared evidence is deployed. |
| 16b — Scientific truth gate | 🟡 phase 2 | Incompatible comparisons removed; branch flips fixed; short-clip event/KSA gates implemented. Human MER review and external validation remain. |
| P1 — Human event correction | ✅ | Reviewers can apply the current frame to FC/MER/BR; analysis and WebMCP reads update together. |
| P1 — Owner-review UX hierarchy | ✅ | Right inspector now reads as event anchors → measurements → shared notes; all four write-tool effects have prominent visible surfaces. |
| P1 — Reference-view legibility | ✅ local | The synchronized 2D source is a resizable lower-right picture-in-picture surface; the 3D canvas retains the full stage, and long joint readouts/pins wrap with compact labels. The licensed portrait reference also renders correctly. 85 tests, typecheck, build, and desktop render pass. |
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

### Numerical truth-audit status (2026-08-31)
`delivery-01` has three construct-compatible event readings inside the cited population ranges:
lead-knee flexion 47.9° at FC [40–49], and lead-knee 37.8° [31.2–41] plus elbow flexion 37.8°
[24–39] at release. Elbow flexion at FC is 39.8° [74–90], an observation below that range. The
automatically nominated MER frame is intentionally `low` confidence, so its elbow comparison must
be reviewed by a human before use.

The usable four-segment KSA for `delivery-01` peaks at pelvis f639 (55.4%), thorax f667 (75.5%),
upper arm f672 (79.1%), and forearm f685 (88.5%) of FC→BR. Consecutive gaps are 28 / 5 / 13 frames,
or 20.1 / 3.6 / 9.4 percentage points. These are descriptive intervals, not ideal targets; absolute
deg/s remains unavailable because the slow-motion factor is unknown.

The previous 180° segment-frame branch jump is fixed by feeding `metricSeries()` the same
continuity-corrected frames used by KSA. `delivery-01` now has no adjacent metric step ≥25°. The
owner removed the 38-frame `delivery-02` because it was too short to support a useful review. The
short-clip boundary refusal remains covered with an in-memory test fixture rather than shipped
professional footage.

**Known open items** (honest state, not hidden):
- The automatic MER event is a peak in an unvalidated upper-arm axial-rotation proxy, not a clinical
  shoulder-external-rotation measurement. It is always low confidence until a human reviews it.
- Hip–shoulder separation, trunk tilts, shoulder rotation/plane values, and foot angle remain visible
  as low-confidence observational proxies. Their absolute values are never compared to clinical
  ranges until this landmark protocol and coordinate convention are externally validated.
- `delivery-02` is now a bundled, sequence-capable licensed Pexels session and the default review.
  `delivery-01` remains bundled only as a visibly provisional legacy session. They depict different
  athletes and viewpoints, so cross-session differences are descriptive only and must never be
  presented as improvement, regression, or a controlled comparison.

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
| `tools.test.ts` | Every handler, retry path, output budget, plain-English review plan, and short-clip KSA refusal |

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
- **`compare_pitches` analyses a second pitch off-screen when one is available** via
  `store.analysisFor()`, which caches into `store.cache`. It never yanks the human's view to the
  other session. The current two-session bundle returns descriptive differences plus explicit
  different-athlete/camera caveats; the single-session structured refusal remains covered by test.
- **`angle_readouts` now does something.** It was a dead toggle; `focus_joint` turns it on and
  `SkeletonViewer` renders the focused joint's angles in 3D. Without that, two write tools would
  have had no visible effect — which would have undermined the whole submission claim.
- **`reference_ghost` does not exist** (PLAN cut list #2). `set_overlay` returns a retryable error
  naming the five real overlays rather than accepting a no-op. Full deviation list in the eval doc §4.

**Task 16 provisional-origin result:** Chrome 154 natively registered and ran all 13 tools; all four
writes visibly changed the screen. The owner-observed ChatGPT in-app-browser run then passed exact
tool discovery, natural-language navigation/focus/annotation, human correction readback, construct
limits, and torque refusal. The exact ChatGPT app/build number was not captured. The final cleared
deployment must repeat the critical flow; a prior revision's pass is not transferable.

## 4d. Owner-review UX convergence (2026-09-01)

The right inspector is now an explicit evidence-review sequence rather than a flat stack:
**1 Review event anchors → 2 Inspect measurements → 3 Shared notes.** Event cards navigate to
their evidence, show frame/confidence, and only enable correction when the inspected frame preserves
FC → MER → BR order. Human corrections still recompute the same `AnalysisStore` read by WebMCP.

At-event measurements now keep every available event-anchored reading visible in one stable,
two-column tile grid. There are no event tabs and no current-frame-driven switching. Each tile leads
with its event, metric, large status-colored value, concise range relationship, and confidence; an
accessible `i` disclosure holds the definition, computation, limitation, exact observed range, and
citation. Live mode uses the same tile language, follows the inspected frame, and deliberately
omits event-reference comparison styling.

Playback, frame/time, shared camera/focus/evidence controls, and speed now form one transport
toolbar directly beneath the synchronized viewers, followed by the scrubber. At wide widths the
shared controls occupy the middle of the playback row; at narrower widths that middle group wraps
within the same toolbar. Its compact live-state indicator and evidence-layer count keep
`focus_joint` and `set_overlay` actions legible without a separate Shared View panel; the five named
layer toggles remain available from the Evidence menu.

Kinematic Sequence now owns the full lower evidence row. Its responsive `800×160` chart coordinate
system uses the available plot width instead of centering a narrow fixed-aspect chart with empty
side gutters. At wide widths the plot sits beside a readable context rail containing current
segment values, the validity boundary, and method disclosure; at narrower widths those elements
become a horizontal rail below the full-width plot. `annotate_frame` still produces a clickable
shared note that returns the human to its frame and joint. The right inspector remains wider, and
event-review instructions and labels are no longer miniature. No WebMCP schema, tool behavior,
biomechanics, or scientific boundary changed.

**Verified:** local production render at 1600×1000 and 1200×900; 79 tests; typecheck; production
build. The existing bundle-size warning remains a deferred P2 concern.

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
A previously removed source clip exposed a **2.90 s freeze**. A frozen run silently destroys event
detection and every rate metric. `pipeline/run.py` therefore **detects duplicate-frame runs and warns
loudly**; always read the pipeline warnings when changing a clip window.

### ⚠️ `timebase` decides which timing metrics are legal
The bundled demo clip is slow-motion at an **unknown** factor, so `realTimeScale: null`.

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

`input_baseball/` holds YouTube-sourced MLB/broadcast clips. The original files are **git-ignored**
and not cleared for redistribution. The owner-review build contains one trimmed 2D reference video
under `web/public/sessions/` so the human can compare source and reconstruction in sync. That file
is provisional and inherits the same unresolved rights problem.

The current public review deployment includes this provisional asset and is **not cleared as the
final submission deployment**. Before Task 18: self-record a pitch (cleanest), remove the 2D asset
and ship 3D-only, or re-run the review on cleared footage. Full table in
[`ATTRIBUTION.md`](ATTRIBUTION.md).

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

## 8. Next: post-owner-review submission convergence

The owner review is complete. Preserve the owner-review history and decisions in §4d; do not reopen
product strategy or perform another redesign pass.

1. **Task 16 — provisional-origin live WebMCP validation: complete.** Chrome 154 and ChatGPT's
   in-app browser passed the observed checks in
   [`evals/webmcp-live-checklist.md`](evals/webmcp-live-checklist.md). Preserve this evidence and
   repeat the critical path on the final revision.
2. **Current gate: cleared evidence, then Task 17 final deployment.** Replace or remove the provisional source
   video, validate the retained evidence path, deploy the exact intended revision, and repeat the
   critical live WebMCP flow after deployment.
3. **Task 18 — submission assets.** The current Cloud Run deployment, README, license, and initial
   Devpost draft are complete. Replace the provisional professional-player session with cleared
   footage, capture final screenshots, and record the public narrated demo under three minutes.
4. **Task 18 — final form.** Reconcile [`devpost-submission.md`](devpost-submission.md) against the
   final app and live official form. **Lead with `annotate_frame`** — the
   agent's reasoning becoming a persistent pin in the human's workspace is the strongest single
   argument in the submission. The line for the Devpost description: *4 of 13 tools are write tools
   that act on the human's live 3D view.*

⚠️ Unresolved and blocking final submission: **source-footage rights** (§6 above). The current
professional-footage session and synchronized 2D file may be used for provisional internal
validation, but not the final deployment or submission assets unless rights are cleared.

The first replacement candidate is the CC0 Wikimedia Commons clip `Gant Windup.webm`; see
[`ATTRIBUTION.md`](ATTRIBUTION.md). Its copyright license is verified, but it remains pending
reconstruction QA and a trademark/identity treatment before it can replace the provisional session.
