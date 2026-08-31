# Steering — Technical Architecture

Read with [`../../SPEC.md`](../../SPEC.md) and
[`webmcp-tools.md`](webmcp-tools.md). API facts come from
[`../../docs/webmcp-technical-reference.md`](../../docs/webmcp-technical-reference.md) — do not
re-derive them.

This document describes Biomech Emcee's implemented baseball-pitching reference workflow. The tier
split and human-agent review pattern are reusable; the event detector, biomechanical metrics,
reference constructs, and validation are not automatically sport-agnostic.

---

## 1. The governing decision: hard offline/online split

**Everything expensive happens offline. The web app is static.**

```
┌─ TIER A — offline, Python, local RTX A6000 ────────────────────┐
│  pitch.mp4                                                      │
│    → ffmpeg frame extraction                                    │
│    → person detect + crop                                       │
│    → SAM 3D Body per-frame inference                            │
│    → temporal smoothing (Kalman / Savitzky-Golay)               │
│    → session.json  (3D joint trajectories + metadata)           │
└─────────────────────────────────────────────────────────────────┘
                              │  committed to repo as a static asset
                              ▼
┌─ TIER B — the web app, static build, no server ────────────────┐
│  session.json                                                   │
│    → biomechanics engine  (TypeScript, IN THE BROWSER)          │
│         events · angles · sequence · reference cmp · confidence │
│    → React UI + three.js 3D viewer                              │
│    → WebMCP tool registration  ← the graded artifact            │
└─────────────────────────────────────────────────────────────────┘
```

**Why this split is non-negotiable:**

1. **The judged artifact never depends on a GPU.** The live URL must work instantly for a judge in
   ChatGPT's in-app browser, and must stay up through **Sep 21**. A static build on Vercel/Netlify
   does that for free and cannot fall over.
2. **It makes the WebMCP story true.** Because the biomechanics engine runs *in the browser*, the
   derived analysis state has no server representation — which is exactly what makes WebMCP the right
   choice over a backend MCP server (SPEC §3). This is an architectural commitment, not a convenience.
   **Do not move the metric computation server-side.**
3. **It de-risks the model.** If SAM 3D Body access, install, or quality disappoints, only Tier A
   changes. Tier B consumes `session.json` and neither knows nor cares what produced it.

**The contract between tiers is `session.json`.** Freeze that schema early (Task 6) and both tiers can
proceed in parallel.

---

## 2. Environment (verified on this machine, 2026-08-30)

| | |
|---|---|
| GPU | **NVIDIA RTX A6000, 48 GB VRAM**, driver 550.54.15, CUDA 12.4 — ample for a 840M-param model |
| System Python | 3.8.10 — **too old**; SAM 3D Body needs 3.11 |
| Package manager | `uv` available at `~/.local/bin/uv` — use it to create the 3.11 env |
| Node | v24.3.0, npm 11.4.2 |
| Disk | 3.1 TB free |

---

## 3. Tier A — the offline pipeline

### 3.1 SAM 3D Body: verified facts

Source: [model card](https://huggingface.co/facebook/sam-3d-body-dinov3),
[repo](https://github.com/facebookresearch/sam-3d-body),
[INSTALL.md](https://github.com/facebookresearch/sam-3d-body/blob/main/INSTALL.md).

- **Single-image** full-body human mesh recovery. **There is no video mode.** Temporal sequence =
  frame extraction + per-frame inference + smoothing. Plan around this.
- Checkpoints: `facebook/sam-3d-body-dinov3` (DINOv3-H+, 840M) and `facebook/sam-3d-body-vith`
  (ViT-H, 631M). **Both are 🔒 gated — you must request access on Hugging Face and be approved.**
  This is the single longest-lead-time item in the project. **Request it first (Task 1).**
- License: **SAM License** (`license:other`), not Apache/MIT. Our code can be MIT; the *model weights*
  stay under Meta's terms and **must not be redistributed in our repo**. Attribute clearly.
- Install: Python 3.11, PyTorch, `detectron2` (pinned commit `a1ce2f9`, `--no-build-isolation
  --no-deps`), plus pytorch-lightning, pyrender, opencv-python, yacs, timm, hydra-core, roma, and
  others. Optional: MoGe (relative depth), SAM3 (mask prompts). **No CPU-only path is documented.**
- Promptable: accepts 2D keypoints and masks as auxiliary prompts, SAM-family style.

**Inference call:**

```python
import cv2
from notebook.utils import setup_sam_3d_body

estimator = setup_sam_3d_body(hf_repo_id="facebook/sam-3d-body-dinov3")
img_bgr = cv2.imread("frame_0001.jpg")
outputs = estimator.process_one_image(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
```

**Per-person output dict:**

| Key | Meaning |
|---|---|
| `pred_vertices` | 3D mesh vertices, **camera coordinates** |
| `pred_keypoints_3d` | **3D pose keypoints ← this is our primary input** |
| `pred_keypoints_2d` | 2D keypoints projected to image (use for overlay + sanity check) |
| `pred_cam_t` | Camera translation |
| `focal_length` | **Estimated**, not calibrated |
| `body_pose_params` | MHR body pose parameters |
| `hand_pose_params` | MHR hand pose parameters (out of scope) |
| `shape_params` | MHR shape parameters |

Underlying rig: **[Momentum Human Rig (MHR)](https://github.com/facebookresearch/MHR)** — 127 joints,
45 shape parameters, 204 pose parameters, decoupled skeleton and surface shape. Exports FBX/glTF.

### 3.2 ⚠️ The constraint that shapes every metric

**Output is camera-frame with an *estimated* focal length — not calibrated metric world space.**

Consequences, which are already baked into SPEC §6 and must be respected in code:

- ✅ **Joint angles are fine** — scale-invariant, computed from 3D keypoint vectors.
- ✅ **Segment-to-segment angles are fine** — hip–shoulder separation is the angle between the pelvis
  and thorax transverse axes. Scale drops out.
- ✅ **Timing is fine** — derived from frame indices and the known fps.
- ⚠️ **Ratios only for lengths** — report stride length as **% of body height**, never in cm.
- ❌ **No absolute distances in metric units.** No vertical oscillation in cm.
- ❌ **No kinetics.** Torques and forces require force data and a musculoskeletal model.

If a task tempts you to output a number in newtons, metres, or N·m — stop. It is out of scope by
construction.

### 3.2b ⚠️ Slow motion breaks absolute timing

**Both demo clips are slow-motion recordings at an unknown slowdown factor** (verified 2026-08-30;
see `pipeline/clips.json`). Frame timestamps are therefore in *video* seconds, not real seconds.

| Quantity | Valid under unknown slow motion? |
|---|---|
| Joint angles at events | ✅ Yes — time-independent |
| Kinematic sequence **order** (pelvis→trunk→arm→…) | ✅ Yes — any monotonic time warp preserves order |
| **Normalized** timing (% of the foot-contact→release window) | ✅ Yes |
| Absolute angular velocity (°/s) | ❌ **No** — grade `unavailable` unless `realTimeScale` is set |
| Pelvis→trunk separation time in **seconds** | ❌ **No** — report as **% of the FC→BR window** |

`session.json.timebase.realTimeScale` is the single switch. When it is `null`, `confidence.ts` must
force every rate-derived metric to `unavailable`. When a user supplies it, those metrics unlock at
`low` confidence (a user estimate is not a measurement).

This is another real limit the tools *declare* rather than paper over — it strengthens the honesty
contract rather than weakening it.

### 3.3 Temporal consistency

Per-frame HMR on video flickers and can shift identity. Prior art to follow (not to install —
we implement the lightweight parts):
[SAM-Body4D](https://github.com/gaomingqi/sam-body4d) is a training-free 4D HMR framework that guides
SAM 3D Body with identity-consistent masklets and applies **test-time smoothing (e.g. Kalman
filtering) to pose and hand parameters to reduce jitter**.

**Our approach, in ascending order of effort — stop as soon as quality is acceptable:**

1. **Savitzky–Golay filter** over joint-angle time series. Cheap, preserves peaks (important: we care
   about *maximum* external rotation, and an over-aggressive filter destroys the peak we're measuring).
2. **Kalman / constant-velocity smoothing** on 3D keypoint positions before angle computation.
3. Only if needed: SAM3 mask prompts for identity consistency. Requires a second gated checkpoint
   (`facebook/sam3`) — **avoid unless quality forces it.**

**Do not over-smooth.** Every metric we report is measured at an event or a peak.

### 3.4 Pipeline stages

| Stage | Tool | Note |
|---|---|---|
| Trim + normalize | `ffmpeg` | Target ~2 s around the pitch, ≤60 fps |
| Frame extraction | `ffmpeg` | Record true fps in metadata — all timing depends on it |
| Person crop | detectron2 (already a dependency) | One pitcher per clip |
| Inference | SAM 3D Body | Batch the folder; ~2 s clip @ 60 fps = ~120 frames |
| Smoothing | scipy | §3.3 |
| Export | Python | `session.json` per §4 |

**Sanity gate after Task 5:** render `pred_keypoints_2d` back over the source frames. If the overlay
doesn't track the pitcher, no downstream metric is worth computing.

---

## 4. The data contract: `session.json`

Frozen in **Task 6**. Both tiers depend on it; changing it later is expensive.

```jsonc
{
  "schemaVersion": "1.0",
  "sessionId": "demo-fastball-01",
  "source": {
    "label": "Right-handed fastball, side view",
    "fps": 60,
    "frameCount": 118,
    "resolution": [1920, 1080],
    "attribution": "…license + origin of the clip…"
  },
  "subject": {
    "handedness": "right",
    "heightMeters": null,          // null unless user-supplied; drives % -height normalization
    "heightSource": "unknown"
  },
  "capture": {
    "model": "sam-3d-body-dinov3",
    "cameraFrame": true,           // ALWAYS true — a permanent reminder of §3.2
    "focalLengthEstimated": true,
    "smoothing": { "method": "savgol", "window": 9, "polyorder": 3 }
  },
  // ── TIMEBASE ── both demo clips are slow-motion at an unknown factor.
  // See §3.2b. This block decides which timing metrics are legal.
  "timebase": {
    "videoFps": 60.0,
    "slowMotion": true,
    "realTimeScale": null,         // video seconds x this = real seconds; null = unknown
    "scaleSource": "unknown"       // "unknown" | "user" | "estimated"
  },
  // Real MHR-70 subset. Names mirror src/biomech/joints.ts EXACTLY.
  // pelvis/thorax are DERIVED (midpoints), not model outputs - see below.
  "joints": ["pelvis", "thorax", "neck", "nose",
             "l_acromion", "l_elbow", "l_wrist", "r_acromion", "r_elbow", "r_wrist",
             "l_olecranon", "r_olecranon", "l_cubital_fossa", "r_cubital_fossa",
             "l_hip", "l_knee", "l_ankle", "l_heel", "l_big_toe",
             "r_hip", "r_knee", "r_ankle", "r_heel", "r_big_toe"],
  "frames": [
    {
      "index": 0,
      "t": 0.0,
      "keypoints3d": [[x, y, z], /* … one per entry in `joints`, camera frame … */],
      "keypoints2d": [[u, v], /* … */],
      "confidence": [0.97, /* … per joint … */]
    }
  ]
}
```

**Notes.**
- We map MHR's 127 joints down to a **~19-joint biomechanical subset**. Store the mapping in
  `pipeline/joint_map.py` and mirror the names exactly in the TS engine.
- Keep `frames` flat and index-aligned to `joints`. Do not nest per-joint objects — this file ships to
  the browser and size matters.
- Budget: ~120 frames × 19 joints × 3 floats ≈ small. Round to 4 decimals. Gzip on the wire.
- `heightMeters: null` is the normal case. Every %-height metric must degrade gracefully to
  `unavailable` rather than guessing.

---

## 5. Tier B — the biomechanics engine (TypeScript, in-browser)

`src/biomech/` — **pure functions, zero React, fully unit-testable.** This is the scientific core and
the thing the WebMCP tools expose. Treat it as a library.

```
src/biomech/
  joints.ts        // joint name constants + vector helpers
  angles.ts        // signed joint angles from 3D keypoints
  events.ts        // foot contact, MER, ball release detection
  sequence.ts      // angular velocity, peak timing, PDS ordering
  reference.ts     // published reference ranges + citations
  confidence.ts    // per-metric confidence grading
  analyze.ts       // orchestrator: session.json → AnalysisResult
```

### 5.1 Event detection

Three events, in the order they are easiest to find:

| Event | Detection heuristic |
|---|---|
| **Lead foot contact (FC)** | Lead ankle vertical velocity → ~0 and stays; lowest lead-foot position sustained |
| **Maximum external rotation (MER)** | Peak of the shoulder external-rotation series between FC and release |
| **Ball release (BR)** | Peak throwing-hand/wrist linear speed, immediately after MER |

Every event returns `{ frame, t, method, confidence }`. **Expose a manual override in the UI** — event
detection from monocular video will sometimes be wrong, and a coach correcting the marker is a
legitimate, honest interaction (and a nice demo beat when the agent then re-reads the corrected value).

### 5.2 Metrics and their published reference values

All values from open-access clinical reviews. **Every number below must ship with its citation in
`reference.ts`** — the `get_metric_definition` tool returns these verbatim, which is what keeps the
agent from inventing ranges.

**At lead foot contact:**

| Metric | Reference | Confidence |
|---|---|---|
| Stride length (% height) | 66–85%; ~85%; 77–90% (source-dependent — report the spread, don't average) | `medium` |
| Shoulder abduction | 78–95°; 93 ± 11°; ~90° | `high` |
| Shoulder external rotation | ~45° | `low` |
| Elbow flexion | 74–85°; 90 ± 15°; ~90° | `high` |
| Lead knee flexion | 40–49°; 43 ± 10°; ~45° | `high` |
| Foot angle | 14–21.6°; 17 ± 9° | `medium` |

**At maximum external rotation:**

| Metric | Reference | Confidence |
|---|---|---|
| Max shoulder external rotation | 166–178.2°; 182 ± 8°; ~170° | `low` |
| Elbow flexion | 95–100.8°; 102 ± 11° | `high` |
| Shoulder abduction | 66–92°; 90–100° | `high` |
| Lead knee flexion | — (extension from FC→BR is the meaningful quantity) | `high` |

**At ball release:**

| Metric | Reference | Confidence |
|---|---|---|
| Shoulder abduction | 70–94°; 94 ± 8° | `high` |
| Elbow flexion | 24–39°; 24 ± 5° | `high` |
| Forward trunk tilt | 30–33.4°; 32–55°; 36 ± 7° | `high` |
| Lateral trunk tilt | 21–29.5°; 23 ± 10° | `high` |
| Lead knee flexion | 31.2–41°; 35 ± 13°; ~30° | `high` |

**Sequence / timing:**

| Metric | Reference | Confidence |
|---|---|---|
| Hip–shoulder separation at FC | Pelvis–thorax transverse angle; larger separation associates with greater trunk rotation velocity and ball velocity | `medium` |
| Kinematic sequence order | Ideal is proximal-to-distal: **pelvis → trunk → arm → forearm → hand** | `medium` |
| Pelvis→trunk separation time | Timing between pelvis and trunk peak angular velocities. **Report as % of the FC→BR window, not seconds** (§3.2b) | `medium` |

> **Critical nuance — do not build a "sequence score."** In a study of 208 pitches across 22 pitchers,
> **not one pitch showed a complete proximal-to-distal sequence**; 14 distinct patterns appeared, the
> most common being pelvis → trunk → arm → **hand → forearm**. So deviation from textbook PDS is the
> *norm*. `get_kinematic_sequence` must **report the observed order and note how common it is** — never
> grade it as a fault. Getting this right is a genuine credibility signal to anyone who knows the field.

**Sources:** Christoffer DJ, Melugin HP, Cherny CE. *A Clinician's Guide to Analysis of the Pitching
Motion.* Curr Rev Musculoskelet Med. 2019;12(2):98–104. doi:10.1007/s12178-019-09556-4 ·
Diffendaffer AZ, Bagwell MS, Fleisig GS, et al. *The Clinician's Guide to Baseball Pitching
Biomechanics.* Sports Health. 2023;15(2):274–281. doi:10.1177/19417381221078537 ·
Kinematic-sequence data: *Kinematic sequence patterns in the overhead baseball pitch.* Sports
Biomechanics. 2020;19(5). PMID 30213227.

### 5.3 Confidence model

`confidence.ts` grades every metric `high | medium | low | unavailable` per SPEC §6, and **every
tool response carries the grade**. Kinetics are hard-coded `unavailable` with a canned explanation —
if an agent asks for elbow valgus torque, it gets a structured refusal plus the kinematic proxies we
*can* defend. Reported markerless-vs-marker RMSD in sports settings is **6.3–23.0°**, weakest on
internal/external rotation; that is the empirical basis for the grading.

---

## 6. Tier B — frontend

**Stack:** React 18 + TypeScript + **Vite** · **three.js via react-three-fiber** + drei ·
plain CSS modules or Tailwind (your call — do not spend time on a design system) · **Vitest** for the
biomech unit tests.

**Rationale.** Vite gives a static build that deploys anywhere with zero server. React because the
`use-webmcp-tool` hook exists in the ecosystem and component-scoped tool lifetime maps cleanly onto
`AbortSignal` unregistration. react-three-fiber is the shortest path to a credible 3D skeleton viewer
with camera control.

**Layout — three panes, deliberately simple:**

```
┌───────────────────────────┬───────────────────┐
│                           │  Metrics panel    │
│   3D viewer (r3f)         │  · at FC / MER /  │
│   skeleton + joint        │    BR             │
│   highlights + agent pins │  · vs reference   │
│                           │  · confidence     │
├───────────────────────────┤    badges         │
│  Timeline: scrub +        │                   │
│  FC / MER / BR markers    │  Agent activity   │
└───────────────────────────┴───────────────────┘
```

**The non-agent UI must stand alone.** Execution is a judging criterion and judges may open the page
in a plain browser with no WebMCP at all. Feature-detect, and degrade to a fully usable manual tool.

**State:** one `AnalysisStore` (Zustand or a Context reducer) holding session, current frame, selected
joint, overlays, and agent annotations. **The WebMCP tools read from and write to this same store** —
that identity is the entire point (SPEC §3). Do not create a parallel state path for tools.

---

## 7. Safety, claims, and licensing

- **Medical claims:** none. Persistent UI disclaimer; `disclaimer` field in tool metadata. Deviation
  from a reference range is an *observation*, not a diagnosis. Rationale: the prospective evidence
  base linking biomechanics to injury is weak, and a meta-analysis of prospective studies found the
  literature does not generally support biomechanical measures as injury risk factors in non-elite
  runners. Overclaiming here is both scientifically wrong and reputationally expensive.
- **Video/PII:** demo clips must be properly licensed or self-recorded — record the provenance in
  `session.json.source.attribution`. **Do not commit scraped broadcast footage.**
- **Model weights:** SAM License. **Never commit checkpoints.** Attribute Meta in the README.
- **Our code:** MIT, `LICENSE` at repo root, auto-detected by GitHub so it shows in the About sidebar
  (a hard submission requirement).
- **Untrusted content:** any tool returning user-supplied text (session labels, notes) sets
  `untrustedContentHint: true`.

---

## 8. Deployment

- **Static build** → **Vercel** or **Netlify** (both sponsors; both offer participant credits).
- **HTTPS required** — `document.modelContext` is `SecureContext`-gated.
- ⚠️ **Verify the response does NOT include `Origin-Agent-Cluster: ?0`.** It silently disables WebMCP.
  This is a deploy-time check with no error message if you get it wrong — put it in the Task 17
  checklist.
- **Top-level page only, no iframes** — ChatGPT's in-app browser does not discover iframe tools.
- Keep it up through **Sep 21** for judging.

---

## 9. Decisions already made — do not re-litigate

| Decision | Rationale |
|---|---|
| Baseball pitching only | Angle-based metrics survive monocular reconstruction; short clips; 4-day clock |
| Offline inference, static web app | Judged artifact must not depend on GPU uptime |
| Biomechanics computed in-browser | This is *what makes WebMCP the right choice* — it is architectural, not incidental |
| React + Vite + react-three-fiber | Ecosystem fit and speed |
| Imperative WebMCP API only | Declarative API unsupported in ChatGPT's in-app browser |
| No kinetics, no injury prediction | Not derivable from monocular video; evidence base does not support it |
| Stride length as % height, never cm | Camera-frame output with estimated focal length |
| MIT for our code; weights never committed | Submission requirement + SAM License compliance |
