# PLAN — Biomech Emcee → verified WebMCP submission

This file is the durable execution plan. Work in atomic, verifiable milestones and create a normal
Git commit after each solid checkpoint. Commit messages must not contain AI-agent signatures,
co-author trailers, or generated-by notices.

Read first: [`SPEC.md`](SPEC.md) · [`.claude/steering/tech.md`](.claude/steering/tech.md) ·
[`.claude/steering/webmcp-tools.md`](.claude/steering/webmcp-tools.md)

---

## 2026-08-31 pre-submission recovery plan — current source of truth

The ground-up review found a strong WebMCP-native foundation but two blocking risks: the submission
package and live integration were incomplete, and several scientific comparisons exceeded what the
implementation validates. The final product is therefore framed as **Biomech Emcee, shared 3D
movement review with WebMCP**, not an autonomous coach or a motion-capture replacement. Baseball
pitching is the only implemented reference workflow; multi-sport support remains a product direction.

### Post-owner-review submission convergence (active 2026-09-01)

The owner application review is complete. Its product, UX, naming, and scientific decisions are
preserved in the repository history and `HANDOFF.md` §4d. Tasks 16–18 now proceed in this strict
order: **live WebMCP validation → cleared evidence → final deployment reconciliation → judge
experience validation**. Use [`docs/devpost-resume.md`](docs/devpost-resume.md) and the live ledger
in [`evals/webmcp-live-checklist.md`](evals/webmcp-live-checklist.md). A critical live WebMCP failure
stops later submission work until the smallest fix is deployed and retested.

**Freeze closed (2026-09-02):** application commit `7e0561d` remains deployed as Cloud Run revision
`00011-26x`; native Chrome 154 passed the exact 13-tool runtime and visible supported-elbow flow.
The owner accepted the final-origin ChatGPT natural-language check. A service-level one-instance
floor is configured, and the exact revision/image plus public assets passed follow-up smoke tests.
Application code is submission-frozen; only submission copy and assets may change absent a blocker.

### Execution rules

1. **Viability before expansion.** Public repo, license, README, HTTPS deployment, live WebMCP test,
   video, and submission materials outrank new features.
2. **WebMCP collaboration is the product.** Preserve live state reads, visible viewer actions, and
   persistent evidence notes.
3. **Truth before confidence.** A low-confidence badge does not make an incompatible reference
   comparison valid.
4. **One commit per verified milestone.** Typecheck, tests, build, and milestone-specific checks must
   pass before each commit.
5. **No hidden demo dependency.** The public app must work from precomputed sessions without a GPU or
   local backend.

### Ordered commit gates

| Gate | Priority | Deliverable | Verification | Status |
|---|---|---|---|---|
| A | P0 | Preserve and publish the current WebMCP implementation | 62 tests, typecheck, build, public GitHub repo | ✅ `eb6526a` |
| B | P0 | Reframe product documents and replace stale execution assumptions | Cross-doc terminology/claim audit | ✅ |
| C | P0 | Add minimal reproducible GCP static deployment | Container image builds from a clean dependency install | ✅ |
| D | P0 | Deploy public HTTPS origin | Cold-load assets; no `Origin-Agent-Cluster: ?0`; service public | ✅ `pitchlab-webmcp-00007-tkw` |
| E | P0 | Scientific truth gate | Incompatible comparisons removed and partial sequence labeled; manual event-frame validation remains | 🟡 `truth gate, phase 1` |
| F | P0 | Judge-facing UX | No dead production upload CTA; first-paint loader; narrow layout usable | ✅ local production visual check |
| G | P0 | WebMCP runtime hardening | Exactly 13 tools or visible failure; success/error contract tests | ✅ native Chrome pass; owner-accepted final-origin ChatGPT check |
| H | P1 | Human event correction loop | Human changes FC/MER/BR; dependent analysis and agent reads update | ✅ store + tool regression test |
| I | P0 | Submission package | README, license, final screenshots, 160–161 s public YouTube demo, Devpost copy, and form answers reconciled | ✅ |
| J | P0 | Post-app-review compliance reconciliation | Two-session evidence, deployment, availability, native validation, and owner-accepted ChatGPT gate complete | ✅ `7e0561d` / `00011-26x` |

### P0 acceptance decisions

- `shoulder_external_rotation` must not be compared with the 166–182° clinical lay-back range until
  both quantities use the same construct and convention.
- Hip–shoulder separation and trunk-tilt signs/conventions must be audited before they can be ranked.
- **Completed 2026-08-31:** the app no longer ranks external rotation, shoulder/trunk angles,
  hip–shoulder separation, or lead-foot angle against clinical ranges. Only direct two-segment elbow
  and lead-knee flexion comparisons remain, at `medium` confidence.
- Kinematic sequence is a **partial four-segment order**, not the published five-segment sequence.
- Event tests must compare against manually reviewed frames, not only assert ordering.
- **Implemented 2026-08-31:** reviewers can set FC/MER/BR to the currently inspected frame. The
  event order is protected, dependent browser analysis is recomputed, and WebMCP reads report the
  reviewed event. A manually labelled benchmark for the committed clips is still required before
  claiming event-detection accuracy.
- The public build presents precomputed review sessions; local CUDA upload is development tooling.
- Future before/after comparison data should be the same athlete and camera setup, using
  self-recorded or clearly licensed footage. The short cross-view second session was removed during
  owner review. Cleared Pexels `delivery-02` and CC BY-SA 4.0 Wikimedia `delivery-03`
  reconstructions are now the intended review sessions. They depict different athletes, handedness,
  and viewpoints, so any tool comparison is
  descriptive only and cannot support improvement/regression claims.
- **Completed 2026-08-31:** `compare_pitches` now labels every result `descriptive_only` and refuses
  to imply improvement/regression without independently established athlete identity and protocol.

### P1 after the stable submission baseline

- Add draggable or explicit “set current frame as event” controls and recompute the live analysis.
- 🟡 Pinned observations and shared viewer state now have prominent persistent surfaces. A
  chronological tool-call activity log remains deferred unless owner review proves it necessary.
- Add runtime session-schema validation and cancellation for stale fetches.
- ✅ Viewer-only supported flexion geometry now explains focused elbow/knee measurements using
  application-owned landmarks, segments, extension reference, and arc; no tool/schema expansion.

### P2 / post-submission

- Cache derived frame/metric series; harden the offline pipeline against freezes and missing poses.
- Improve accessibility, annotation spatial semantics, anatomical camera presets, and bundle splitting.
- Add a backend MCP only for longitudinal athlete history; keep WebMCP responsible for the live
  visual review session.

---

## Historical build plan

The sections below record how the prototype was built. Where they conflict with the recovery plan
above, the recovery plan is authoritative.

## Clock

**Now:** Sun Aug 30, evening · **Deadline:** Thu Sep 3, 1:00 PM PDT · **≈3.5 working days.**

| Day | Tasks | Milestone |
|---|---|---|
| **Sun night** | 1–3 | Access requested, env built, footage in hand |
| **Mon Aug 31** | 4–7 | `session.json` exists for one real pitch |
| **Tue Sep 1** | 8–12 | Metrics correct; 3D viewer plays |
| **Wed Sep 2** | 13–16 | **All 13 WebMCP tools working in ChatGPT** |
| **Thu Sep 3 AM** | 17–18 | Deployed, video cut, submitted by 1 PM |

**Buffer discipline.** If you reach Wed morning without a working `session.json`, **fall back to the
Task 5b escape hatch** and keep going. Tier B is the graded artifact; Tier A is a means to it.

> ### 🔄 Reordered 2026-08-30 (after Task 3)
> Tasks **4–7 and 11–12 were pulled forward and completed together**. Rationale: SAM 3D Body turned
> out to run at 160 ms/frame, so the whole offline pipeline was ~5 minutes of compute rather than a
> day of work — and a 3D viewer cannot be built or verified against data that does not exist yet.
> Building the app on a real `session.json` was strictly cheaper than building it on fixtures and
> swapping later.
>
> **Done:** 1, 2, 3, 4, 5, 6, 7, 11, 12 (viewer; 12b metrics panel still pending the engine).
> **Next:** Tasks 8–10 (the TypeScript biomechanics engine), then 13–16 (WebMCP tools ★).
>
> A third mode was added that the plan did not anticipate: a **local FastAPI backend**
> (`pipeline/server.py`) giving a real upload → analyse → session flow for demos, while the
> deployed build stays static. See tech.md §1 — the static path is still the one judges use.

---

## Phase 0 — de-risk (Sun night)

### Task 1 — Request SAM 3D Body checkpoint access ⛔ BLOCKING, DO THIS FIRST
**Goal:** unblock the longest-lead-time dependency before anything else.
**Do:** With the `AjishPradeep` HF account, request access at
[`facebook/sam-3d-body-dinov3`](https://huggingface.co/facebook/sam-3d-body-dinov3). The gate asks for
name, DOB, country, affiliation, job title. Create a token and `export HF_TOKEN=…`.
**Verify:** `hf auth whoami` succeeds; the model page shows access granted or pending.
> ⚠️ Approval latency is **unknown and outside our control**. If not granted by **Mon evening**, go to
> **Task 5b**. Do not sit and wait.

---

### Task 2 — Python 3.11 environment + SAM 3D Body install
> ✅ **DONE** — the active repository environment is `.venv` on Python 3.12; the vendored SAM 3D
> Body path runs with the approved checkpoints. Person detection uses torchvision Faster R-CNN;
> detectron2 was not required.
**Goal:** run the model end-to-end on a single still image.
**Do:** create the isolated environment, install PyTorch for CUDA 12.4 and the dependencies in
tech.md §3.1, and clone/vendor `facebookresearch/sam-3d-body` without committing checkpoints.
**Files:** `pipeline/requirements.txt`, `pipeline/README.md`
**Verify:** the model card's `process_one_image` snippet runs on one photo of a person and
`visualize_sample_together` writes a recognisable mesh overlay. **Do not proceed until this renders.**

---

### Task 3 — Source and prepare demo footage
> ✅ **DONE** — the final public set is exactly two qualified sources: Pexels `delivery-02` and the
> attributed CC BY-SA 4.0 Wikimedia derivative `delivery-03`.
**Goal:** two properly licensed pitching clips.
**Do:** Self-record, or use clearly-licensed CC footage. **No scraped broadcast video** (tech.md §7).
Target: side-on or 45°, whole body in frame, ~2 s around the pitch, ≥60 fps if possible. Ideally two
pitches from the *same* pitcher so `compare_pitches` has real data.
`ffmpeg` trim + normalize; record true fps.
**Files:** `pipeline/data/raw/`, `ATTRIBUTION.md`
**Verify:** clips play; fps confirmed via `ffprobe`; provenance written down for every clip.

---

## Phase 1 — offline pipeline (Mon)

### Task 4 — Frame extraction + person crop
> ✅ **DONE** — implemented in `pipeline/run.py` (streams frames, no intermediate dump). Uses **torchvision Faster R-CNN**, not detectron2.
**Goal:** video → cropped per-frame images ready for inference.
**Do:** stream decoded frames; torchvision Faster R-CNN person detection; pick the largest/most
central person; crop with padding; keep crop offsets so 2D keypoints can be mapped back to the
original frame.
**Files:** `pipeline/extract.py`
**Verify:** frame count matches `fps × duration`; crops contain the whole pitcher including feet.

---

### Task 5 — Per-frame SAM 3D Body inference runner
> ✅ **DONE** — `pipeline/run.py`. Sanity gates passed for both cleared bundled reconstructions;
> their QA overlays track the pitcher through the whole delivery.
**Goal:** raw model output for every frame.
**Do:** Batch over the frame folder, persist per-frame `pred_keypoints_3d`, `pred_keypoints_2d`,
`pred_cam_t`, `focal_length`, `shape_params`. Cache to disk so reruns are free.
**Files:** `pipeline/infer.py`
**Verify (mandatory sanity gate):** render `pred_keypoints_2d` back over the source frames as a video.
**If the skeleton does not track the pitcher, stop — no downstream metric is meaningful.**

---

### Task 5b — ESCAPE HATCH (only if Task 1 access is still pending)
**Goal:** unblock Tier B regardless of Meta's approval queue.
**Options, in order of preference:**
1. Call a public SAM3D Space via `gradio_client` (e.g. `akhaliq/sam-3d-body`,
   `pablovela5620/sam3d-body-rerun`) — checkpoint access already resolved on their side.
2. Swap in an ungated 3D pose model to produce the same `session.json` shape.
3. **Hand-author one `session.json`** from a public mocap sequence to unblock Tasks 8–16 entirely.
**Verify:** a schema-valid `session.json` exists. That is the only thing Tier B needs.
> The whole point of freezing the schema in Task 6 is that this swap costs hours, not days.

---

### Task 6 — 🔒 Freeze the `session.json` schema
> ✅ **DONE** — `pipeline/joint_map.py` (24 joints) + `web/src/types.ts` mirror each other. **Schema is now frozen.**
**Goal:** lock the contract between tiers so they can proceed in parallel.
**Do:** Implement the schema in tech.md §4. Write `pipeline/joint_map.py` mapping MHR's 127 joints to
our 24-joint biomechanical subset. **Mirror the joint names exactly in the TS engine.** Round to 4
decimals.
**Files:** `pipeline/joint_map.py`, `pipeline/schema.py`, `schema/session.schema.json`
**Verify:** a JSON-Schema validator passes on a real output. **After this task, treat the schema as
frozen** — changing it later breaks both tiers at once.

---

### Task 7 — Temporal smoothing + `session.json` export
> ✅ **DONE** — Savitzky–Golay (window 9, order 3). Segment-length CV is 3–5%, proportions within 5% of standard anthropometry.
**Goal:** one committed, jitter-free `session.json` per demo clip.
**Do:** Savitzky–Golay over joint-angle series first (tech.md §3.3). Escalate to Kalman on 3D
positions only if visibly jittery. **Do not over-smooth — we measure peaks, and an aggressive filter
destroys the very maximum we report.** Export to `web/public/sessions/`.
**Files:** `pipeline/smooth.py`, `pipeline/export.py`
**Verify:** plot raw vs smoothed shoulder-ER series — jitter gone, **peak magnitude and timing
preserved**.

---

## Phase 2 — biomechanics engine (Tue AM)

> Pure TypeScript, zero React, fully unit-tested. This is the scientific core.

### Task 8 — Angle computation library
**Goal:** correct, signed joint angles from 3D keypoints.
**Do:** `src/biomech/joints.ts` + `angles.ts`. Implement: knee flexion, elbow flexion, shoulder
abduction, shoulder external rotation, trunk forward tilt, trunk lateral tilt, **hip–shoulder
(pelvis–thorax) separation**. Define a consistent anatomical frame from pelvis/thorax segments.
**Files:** `web/src/biomech/{joints,angles}.ts` + `angles.test.ts`
**Verify:** **unit tests on synthetic poses with known angles** (a straight leg is 0° flexion; a
90° elbow is 90°). Do not skip — every number in the app rests on this file.

---

### Task 9 — Event detection
**Goal:** foot contact, MER, ball release, with confidence.
**Do:** Implement per tech.md §5.1. Return `{ frame, t, method, confidence }`. Support manual override.
**Files:** `web/src/biomech/events.ts` + tests
**Verify:** detected frames match visual inspection of the demo clips within ±2 frames.

---

### Task 10 — Kinematic sequence + reference ranges + confidence
**Goal:** the metric layer the tools expose.
**Do:** `sequence.ts` (angular velocity, peak timing, PDS ordering, pelvis→trunk separation time);
`reference.ts` (**every published range from tech.md §5.2 with its citation** — this is the single
source of truth for both the UI and `get_metric_definition`); `confidence.ts` (grading per SPEC §6,
kinetics hard-coded `unavailable`); `analyze.ts` orchestrator.
**Files:** `web/src/biomech/{sequence,reference,confidence,analyze}.ts` + tests
**Verify:** `analyze(session)` returns a complete `AnalysisResult`; every metric has a confidence
grade and a citation; **`get_kinematic_sequence`'s `literatureNote` is present** (webmcp-tools.md §3).

---

## Phase 3 — web app (Tue PM)

### Task 11 — Vite + React + TypeScript scaffold
> ✅ **DONE** — `web/`. React 19 + Vite 8 + r3f + drei + Zustand. `npm run build` and `tsc --noEmit` both clean.
**Goal:** app boots, loads a session, runs the engine.
**Do:** `npm create vite@latest web -- --template react-ts`; add react-three-fiber, drei, Zustand,
Vitest. Build the `AnalysisStore` (session, currentFrame, selectedJoint, overlays, annotations).
**Files:** `web/` scaffold, `web/src/store/analysis.ts`
**Verify:** `npm run dev` serves; a session loads; analysis results log to console; `npm test` green.

---

### Task 12 — 3D viewer + timeline
> ✅ **DONE** — `web/src/viewer/`. Imperative `useFrame` updates (no per-frame React reconciliation), orbit controls, camera-plane presets, motion trail, annotation pins, scrub timeline, keyboard shortcuts.
**Goal:** the visual centrepiece.
**Do:** r3f scene rendering the skeleton from `keypoints3d`; orbit controls; playback + scrub timeline
with FC/MER/BR markers; joint highlighting; overlay layers (reference ghost, angle readouts, motion
trail, event markers); **agent annotation pins**.
**Files:** `web/src/viewer/*`, `web/src/components/Timeline.tsx`
**Verify:** playback is smooth; scrubbing updates the pose; every overlay toggles; **all of it is
driven through `AnalysisStore`, not local component state** — the tools depend on that.

---

### Task 12b — Metrics panel
**Goal:** the app is a complete product without any agent.
**Do:** Per-event metric tables, reference comparison, **confidence badges**, medical disclaimer.
**Verify:** open in a browser with **no** WebMCP — the app is fully usable on its own. Execution is a
judging criterion and judges may never enable an agent.

---

## Phase 4 — WebMCP (Wed) ★ the graded artifact

### Task 13 — Registration layer
> ✅ **DONE** — the fixed 13-tool surface registers once for the document; handlers read live
> Zustand state at invocation time, and the document-lifetime abort signal owns cleanup.
**Goal:** infrastructure for all 13 tools.
**Do:** `web/src/webmcp/registry.ts` — feature detection, document-lifetime `AbortController`, the
`toolResult()` return-shape choke point, shared `meta` builder, error formatting (webmcp-tools.md §2).
**Files:** `web/src/webmcp/registry.ts`
**Verify:** one trivial tool appears in **DevTools → Application → WebMCP**; non-WebMCP browsers no-op
silently.

---

### Task 14 — Read tools (Categories A–C, 9 tools)
**Goal:** `list_pitch_sessions`, `get_session_overview`, `get_phase_events`,
`get_kinematics_at_event`, `get_joint_angle_series`, `get_kinematic_sequence`,
`get_metric_definition`, `compare_to_reference`, `compare_pitches`.
**Do:** Exact names, descriptions, and schemas from webmcp-tools.md §3. `readOnlyHint: true` on all;
`untrustedContentHint` where labels are user-supplied. Respect the output budget — cap
`get_joint_angle_series` at `maxPoints`.
**Files:** `web/src/webmcp/tools/read/*.ts`
**Verify:** each runs from DevTools **Run tool** with correct output and a populated `meta` block.

---

### Task 15 — Viewer-control tools (Category D, 4 tools) ★
**Goal:** `seek_to_event`, `focus_joint`, `set_overlay`, `annotate_frame`.
**Do:** Mutate `AnalysisStore`. **Update the UI before returning** (Chrome best practice — agents read
the page to plan the next step). `annotate_frame` sets `untrustedContentHint: true`.
**Files:** `web/src/webmcp/tools/write/*.ts`
**Verify:** running each from DevTools **visibly changes the screen**. This is the differentiator —
if the viewer doesn't move, the submission's core claim is unproven.

---

### Task 16 — Verification + evals
**Goal:** it actually works with a real agent, not just DevTools.
**Do:** Work the full checklist in webmcp-tools.md §6. **Confirm the return-shape convention against
ChatGPT's in-app browser** and adjust `toolResult()` if needed. Run ambiguous prompts — *"why is he
losing velocity?"*, *"what should he work on?"*, *"what's his elbow valgus torque?"* (must produce the
structured refusal) — and check tool selection and ordering.
**Files:** `evals/pitch-analysis.md`
**Verify:** every checklist box ticked, **including end-to-end in ChatGPT's in-app browser**.

---

## Phase 5 — ship (Thu AM)

### Task 17 — Deploy
> ✅ **APPLICATION ARTIFACT DEPLOYED** — commit `7e0561d`, Cloud Run revision `00011-26x`, 100%
> traffic. HTTPS/assets/native Chrome 154 WebMCP passed. Availability remains 🟡 because a recovered
> scale-from-zero 429 incident needs a one-instance floor plus smoke test or explicit risk acceptance.
**Goal:** a live URL that survives until Sep 21.
**Do:** Static build → nginx on the existing Google Cloud Run service.
**Verify — every box, this is where submissions silently die:**
- [x] HTTPS (required: `document.modelContext` is `SecureContext`-gated)
- [x] **`curl -I <url>` shows NO `Origin-Agent-Cluster: ?0`** — it disables WebMCP with no error
- [x] Exactly 13 tools register and execute on the deployed origin in native Chrome 154
- [x] Top-level page, **no iframes**
- [x] Cold load in a fresh profile works when an instance is available
- [x] No auth required
- [x] Owner-accepted ChatGPT natural-language check on the final origin
- [x] One minimum instance configured; exact revision/image and public assets retested

---

### Task 18 — Submission package
**Goal:** clear Stage One and score well.
**Do:**
- [x] `LICENSE` (MIT) at repo root, **auto-detected and visible in GitHub's About sidebar** — hard requirement
- [x] README: what it is, setup instructions someone else can follow, SAM 3D Body attribution + SAM License note, **no committed checkpoints**
- [x] **Demo video, <3 min, with audio, public YouTube.** Structure: problem (20 s) → app solo (30 s) →
      **agent asks a question, viewer scrubs, pin appears** (60 s) → the honest refusal on valgus torque
      (20 s) → tool surface in DevTools (20 s). **Lead with `annotate_frame`.**
- [x] Devpost description covering all four required points: WebMCP fit · UX improvement · new
      human+agent capability · implementation. Reuse SPEC §3 and the "4 of 13 are write tools" line.
- [x] App matches the video and description exactly
- [ ] Submit **before Thu Sep 3, 1:00 PM PDT**

---

## Historical cut list — closed after release qualification

This was the implementation-time contingency order. It is retained as history, not authorization to
remove qualified release features. The final two-session, 13-tool surface is now locked pending the
remaining availability and ChatGPT gates.

1. `compare_pitches` (needs a second analyzed clip)
2. `motion_trail` and `reference_ghost` overlays
3. Manual event-override UI (keep the tool field, drop the control)
4. Third demo clip
5. Mesh rendering → skeleton only *(skeleton reads more clearly on video anyway)*
6. `get_joint_angle_series` (the least essential read tool)

**Never cut:** the honesty/confidence layer, `get_metric_definition`, or any Category D tool.
Those *are* the submission.
