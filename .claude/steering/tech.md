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

1. **The judged artifact never depends on a GPU.** The live URL must work for a judge in ChatGPT's
   in-app browser and stay up through **Sep 21**. The static nginx/Cloud Run artifact has no
   inference backend in its request path. Hosting availability remains an operational concern;
   §8 records the observed scale-from-zero incident rather than claiming static hosting cannot fail.
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
- Install: Python 3.12 in the current `.venv`, PyTorch, torchvision, pytorch-lightning, pyrender,
  opencv-python, yacs, timm, hydra-core, roma, and the vendored SAM 3D Body requirements. The app's
  person detector is torchvision Faster R-CNN; detectron2 is not installed or required for the
  explicit-bbox path. Optional: MoGe (relative depth), SAM3 (mask prompts). **No CPU-only path is documented.**
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

- ✅ **Direct two-segment flexion angles are scale-invariant** — but still inherit reconstruction
  and event-detection error, so current comparisons are `medium` at best.
- ⚠️ **Frame-dependent rotations are observational proxies** — scale drops out, but anatomical zero,
  sign, target-line orientation, and protocol equivalence do not. They require construct validation
  before comparison to marker-based clinical ranges.
- ⚠️ **Frame order and normalized timing survive a uniform slow-motion factor** — real seconds and
  rates do not, and a cut/short delivery window may not support peak timing at all.
- ⚠️ **Ratios only for lengths** — report stride length as **% of body height**, never in cm.
- ❌ **No absolute distances in metric units.** No vertical oscillation in cm.
- ❌ **No kinetics.** Torques and forces require force data and a musculoskeletal model.

If a task tempts you to output a number in newtons, metres, or N·m — stop. It is out of scope by
construction.

### 3.2b ⚠️ Timebase controls rate validity

Both final bundled sessions are marked normal-rate with `realTimeScale: 1` and
`scaleSource: estimated`: `delivery-02` is 25 fps and `delivery-03` is 29.97 fps. Their frame
timestamps may therefore support real-time rate output, but the modest capture rates undersample
fast arm motion, so rate confidence is capped at `medium`. This is not laboratory timing
validation. Unknown or slow-motion sources remain supported by the contract and must withhold
absolute rates.

| Quantity | Valid under unknown slow motion? |
|---|---|
| Joint angles at events | ✅ Yes — time-independent |
| Kinematic sequence **order** (pelvis→trunk→arm→…) | ✅ Yes — any monotonic time warp preserves order |
| **Normalized** timing (% of the foot-contact→release window) | ✅ Yes |
| Absolute angular velocity (°/s) | ❌ **No** — grade `unavailable` unless `realTimeScale` is set |
| Pelvis→trunk separation time in **seconds** | ❌ **No** — report as **% of the FC→BR window** |

`session.json.timebase.realTimeScale` is the single switch. When it is `null`, `confidence.ts` must
force every rate-derived metric to `unavailable`. An estimated known scale can unlock rates only at
bounded confidence; it is not a direct timing measurement.

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
| Person crop | torchvision Faster R-CNN (COCO-pretrained) | One pitcher per clip |
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
  "sessionId": "delivery-03",
  "source": {
    "label": "Pitch — left-handed center-field view",
    "view": "center-field full-body game view through protective netting",
    "frameCount": 246,
    "resolution": [1920, 1080],
    "attribution": "…license + origin of the clip…",
    "videoFile": "delivery-03.mp4"
  },
  "subject": {
    "handedness": "left",
    "heightMeters": null,          // null unless user-supplied; drives % -height normalization
    "heightSource": "unknown"
  },
  "capture": {
    "model": "sam-3d-body-dinov3",
    "cameraFrame": true,           // ALWAYS true — a permanent reminder of §3.2
    "focalLengthEstimated": true,
    "focalLengthMedian": 2202.91,
    "smoothing": { "method": "savgol", "window": 9, "polyorder": 3 }
  },
  // ── TIMEBASE ── this block decides which timing metrics are legal.
  "timebase": {
    "videoFps": 29.97002997002997,
    "slowMotion": false,
    "realTimeScale": 1,            // video seconds x this = real seconds; null = unknown
    "scaleSource": "estimated"     // "unknown" | "user" | "estimated"
  },
  // Real MHR subset. Names mirror web/src/types.ts EXACTLY.
  // pelvis/thorax are DERIVED (midpoints), not model outputs - see below.
  "joints": ["pelvis", "thorax", "neck", "nose",
             "l_acromion", "l_elbow", "l_wrist", "r_acromion", "r_elbow", "r_wrist",
             "l_olecranon", "r_olecranon", "l_cubital_fossa", "r_cubital_fossa",
             "l_hip", "l_knee", "l_ankle", "l_heel", "l_big_toe",
             "r_hip", "r_knee", "r_ankle", "r_heel", "r_big_toe"],
  "frames": [
    {
      "index": 0,
      "sourceFrame": 0,
      "t": 0.0,
      "keypoints3d": [[x, y, z], /* … one per entry in `joints`, camera frame … */],
      "keypoints2d": [[u, v], /* … */]
    }
  ]
}
```

**Notes.**
- We map MHR's 127 joints down to a **24-joint biomechanical subset**. Store the mapping in
  `pipeline/joint_map.py` and mirror the names exactly in the TS engine.
- Keep `frames` flat and index-aligned to `joints`. Do not nest per-joint objects — this file ships to
  the browser and size matters.
- Current public sessions contain 288 and 246 frames × 24 joints. Round to 4 decimals; nginx serves
  compressible JSON efficiently while source videos use byte-range delivery.
- `heightMeters: null` is the normal case. Every %-height metric must degrade gracefully to
  `unavailable` rather than guessing.

---

## 5. Tier B — the biomechanics engine (TypeScript, in-browser)

`web/src/biomech/` — **pure functions, zero React, fully unit-testable.** This is the scientific core and
the thing the WebMCP tools expose. Treat it as a library.

```
web/src/biomech/
  vec.ts           // vector helpers
  frames.ts        // anatomical coordinate-frame helpers
  angles.ts        // direct angles and observational rotation proxies
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
| **MER candidate** | Peak of the continuity-corrected upper-arm axial-rotation proxy between FC and release; always low confidence until human review |
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
| Partial kinematic sequence order | Report four observed segments only: **pelvis, trunk, upper arm, forearm**; no ideal/quality score | `medium` when the delivery window passes quality gates |
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
Biomechanics. 2020;19(5). PMID 30213227; doi:10.1080/14763141.2018.1503321.

Single-camera validation context (for a different, specifically validated system—not evidence that
this implementation is validated): Dobos et al. *Validation of pitchAI markerless motion capture
using marker-based 3D motion capture.* doi:10.1080/14763141.2022.2137425.

### 5.3 Confidence model

`confidence.ts` grades every metric `high | medium | low | unavailable` per SPEC §6, and **every
tool response carries the grade**. Kinetics are hard-coded `unavailable` with a canned explanation —
if an agent asks for elbow valgus torque, it gets a structured refusal plus the kinematic proxies we
*can* defend. Reported markerless-vs-marker RMSD in sports settings is **6.3–23.0°**, weakest on
internal/external rotation; that is the empirical basis for the grading.

---

## 6. Tier B — frontend

**Stack:** React 19 + TypeScript + **Vite 8** · **three.js via react-three-fiber** + drei ·
plain CSS in `web/src/styles.css` · Zustand · **Vitest** for the
biomech unit tests.

**Rationale.** Vite gives a static build that deploys anywhere with zero server. React because the
UI and shared workspace are stateful. The app uses a document-lifetime imperative WebMCP registry;
tool handlers resolve live Zustand state when invoked, and `AbortSignal` cleans up on document
unmount. react-three-fiber provides the synchronized 3D skeleton viewer and manual camera control.

**Layout — three panes, deliberately simple:**

```
┌───────────────────────────┬───────────────────┐
│  Synchronized source      │  Evidence panel   │
│  video + 3D viewer        │  · session info   │
│  skeleton + supported     │  · FC / MER / BR  │
│  angle geometry           │  · measurements   │
│                           │  · confidence     │
├───────────────────────────┤  · shared notes   │
│  Timeline: scrub +        │                   │
│  FC / MER / BR markers    │                   │
└───────────────────────────┴───────────────────┘
```

**The non-agent UI must stand alone.** Execution is a judging criterion and judges may open the page
in a plain browser with no WebMCP at all. Feature-detect, and degrade to a fully usable manual tool.

**Supported visual geometry is semantic and application-owned.** When the focused landmark is an
elbow or knee with a direct flexion construct, the viewer derives the proximal/joint/distal points
from the active reconstructed frame and renders the two segments, straight-extension reference,
flexion arc, and existing value. The LLM supplies no coordinates. Preserve whole-body and
synchronized-source context; do not add generic drawing, pan, zoom, or camera-coordinate tools.

**State:** one Zustand `AnalysisStore` holding session, current frame, selected
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

- **Static build** → nginx container on **Google Cloud Run** in `ideaslab-gcp/us-central1`.
- **HTTPS required** — `document.modelContext` is `SecureContext`-gated.
- ⚠️ **Verify the response does NOT include `Origin-Agent-Cluster: ?0`.** It silently disables WebMCP.
  This is a deploy-time check with no error message if you get it wrong — put it in the Task 17
  checklist.
- **Top-level page only, no iframes** — ChatGPT's in-app browser does not discover iframe tools.
- Keep it up through **Sep 21** for judging.
- The current service uses the default scale-to-zero floor, concurrency 80, max 100 instances,
  1 vCPU and 512 MiB. A 2026-09-01 scale-from-zero event produced transient 429 responses before
  autoscaling recovered. Treat one minimum instance plus exact-revision smoke testing as the
  preferred release-availability safeguard; it has a small continuous billing cost.

---

## 9. Decisions already made — do not re-litigate

| Decision | Rationale |
|---|---|
| Baseball pitching only | Angle-based metrics survive monocular reconstruction; short clips; 4-day clock |
| Offline inference, static web app | Judged artifact must not depend on GPU uptime |
| Biomechanics computed in-browser | This is *what makes WebMCP the right choice* — it is architectural, not incidental |
| React + Vite + react-three-fiber | Ecosystem fit and speed |
| Imperative WebMCP API only | Declarative API unsupported in ChatGPT's in-app browser |
| Fixed 13-tool registration | Handlers read live Zustand state at execution time; session changes do not re-register or duplicate tools |
| Two licensed final sessions | Pexels `delivery-02`; attributed CC BY-SA 4.0 Wikimedia derivative `delivery-03` |
| Descriptive-only cross-session comparison | Athlete identity, camera and controlled capture protocol are not established |
| App-owned supported flexion geometry | Makes elbow/knee evidence legible without arbitrary LLM drawing or camera-control APIs |
| No kinetics, no injury prediction | Not derivable from monocular video; evidence base does not support it |
| Stride length as % height, never cm | Camera-frame output with estimated focal length |
| MIT for our code; weights never committed | Submission requirement + SAM License compliance |
