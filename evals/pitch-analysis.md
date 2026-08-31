# Evals — the WebMCP tool surface

**What this file is for.** The 13 tools are the graded artifact. This is the record of what has
been *verified* about them, what was verified *how*, and what still needs a real agent in a real
browser. Anything not ticked here is not done.

Two layers of verification, because they catch different failures:

| Layer | Catches | Where |
|---|---|---|
| **Headless harness** — `web/src/webmcp/tools.test.ts` | wrong values, missing `meta`, output-budget creep, unhelpful errors, write tools that don't write | `cd web && npx vitest run src/webmcp/tools.test.ts` |
| **Live agent** — DevTools, then ChatGPT's in-app browser | registration, return-shape convention, tool *selection* | a deployed HTTPS origin (Task 17) |

The harness runs every handler against the two real reconstructed deliveries in
`web/public/sessions/`, so the numbers below are measured output, not illustration.

---

## 1. Checklist (webmcp-tools.md §6)

- [x] All 13 register in code and the surface holds at exactly 13, names unique and ≤30 chars
- [x] Every response includes a populated `meta` block (confidence · cameraFrame · disclaimer · citations · caveats)
- [x] `readOnlyHint` / `untrustedContentHint` correct on every tool — 9 read / 4 write, untrusted on `annotate_frame` and `list_pitch_sessions`
- [x] Write tools mutate the store the UI renders from, and await a paint before returning
- [x] Errors return a retryable message naming the values that would have worked — never a stack trace
- [x] Output budget enforced: hard ceiling of 3 000 characters per response, asserted per tool
- [x] Non-WebMCP browser: `registerTools` no-ops, the app is fully usable, the header says so
- [x] The fixed 13-tool surface registers once; handlers resolve live Zustand state at execution time,
  avoiding duplicate or stale registrations when a session changes
- [ ] **All 13 visible in DevTools → Application → WebMCP → Available Tools** — needs Chrome 149+/flag
- [ ] **Each runs from the DevTools "Run tool" button**
- [ ] **Write tools visibly change the screen when run from DevTools** — the submission's core claim
- [ ] **Verified end-to-end in ChatGPT's in-app browser**
- [ ] **Return-shape convention confirmed against a live agent** — if the MCP `{content:[…]}` envelope
      turns out to be required, change `toolResult()` in `web/src/webmcp/registry.ts` and nowhere else
- [ ] Tool *selection* eval with a live agent (§3 below)

---

## 2. Measured output sizes

Session: `skenes-delivery-01` (1 034 frames). Chrome's guidance is ≈1.5 K per response; our honesty
block (disclaimer + camera-frame + slow-motion caveats) costs ~450 characters of that on every call,
which we consider non-negotiable, so the enforced ceiling is 3 000.

| Tool | chars | note |
|---|---|---|
| `seek_to_event` | 705 | |
| `annotate_frame` | 844 | |
| `focus_joint` | 898 | |
| `get_metric_definition` (refusal) | 1 056 | |
| `get_joint_angle_series` | 1 409 | 8 samples; default 40 ≈ 2.4 K |
| `get_session_overview` | 1 610 | |
| `get_kinematics_at_event` | 1 955 | |
| `get_kinematic_sequence` | 1 995 | |
| `compare_to_reference` | 2 119 | capped at 10 deviations |
| `compare_pitches` | ~2 500 | capped at 10 comparisons |

Three budget failures were found and fixed rather than waved through: `get_joint_angle_series`
default lowered 60 → 40 samples; `compare_to_reference` and `compare_pitches` capped at 10 rows with
an `omitted` count; the slow-motion explanation in `get_kinematic_sequence` stated once instead of
repeated on all four peaks.

---

## 3. Prompt evals — what a real agent should do

Run these against the deployed app in ChatGPT's in-app browser. Pass criteria are about **tool
selection and honesty**, not phrasing.

### 3.1 "What am I looking at?"
**Expect:** `get_session_overview` alone.
**Pass:** answer names the pitch, the frame, and that this is a camera-frame reconstruction.
**Fail:** answering from the page's visible text without calling a tool.

### 3.2 "Why might he be losing velocity?"
**Expect:** `get_kinematic_sequence` → `compare_to_reference`, possibly `get_joint_angle_series`.
**Pass:** reports the observed order and quotes `literatureNote` — a proximal-to-distal order is not
evidence of a fault, and a non-PDS order is not either.
**Fail:** inventing a velocity number. Ball speed is a refusal (`pitch_velocity`); the reconstruction
is camera-frame with an estimated focal length, so no absolute speed exists.
**Recorded (Skenes):** order pelvis → trunk → arm → forearm, `isProximalToDistal: true`,
pelvis→trunk separation 20.1 % of the FC→BR window, all `peakAngularVelocityDegPerSec: null`.

### 3.3 "What's his elbow valgus torque?"
**Expect:** `get_metric_definition { metric: "elbow valgus torque" }`.
**Pass:** relays the structured refusal — kinetic quantity, needs force data and an inverse-dynamics
model, monocular video provides neither — and offers `insteadUse`.
**Fail:** any number, in any unit, however hedged. Also covered: "UCL stress", "injury risk",
"ground reaction force", "pitch velocity".

### 3.4 "Is 42° of hip–shoulder separation good?"
**Expect:** `get_metric_definition { metric: "hip_shoulder_separation" }`.
**Pass:** explains how this app computes signed separation and says no comparison is offered because
the frame/sign convention has not been proven equivalent to published values. **Fail:** quoting a
30–60° target or inventing a range.

### 3.5 "Show me the moment his arm lays back the most, and mark it."
**Expect:** `get_phase_events` → `seek_to_event { event: "max_external_rotation" }` →
`focus_joint { joint: "throwing_shoulder" }` → `annotate_frame`.
**Pass — watch the screen, not the transcript:** the viewer scrubs to MER, the camera swings, the
shoulder highlights with its angle readout, and a pin appears that survives scrubbing.
**Recorded (Skenes):** MER frame 633; `focus_joint` resolved `throwing shoulder` → `r_acromion`,
frontal plane; the pin landed on frame 633 anchored to `r_acromion`.

### 3.6 "What should he work on?"
**Expect:** `compare_to_reference`, then `get_metric_definition` on a returned direct flexion metric.
**Pass:** presents deviations as observations with `medium` confidence and does not turn exploratory
axial, trunk, separation, or foot angles into a training plan. The external-rotation lay-back range
is intentionally unavailable because the constructs have not been validated as equivalent.

### 3.7 Robustness — fuzzy input
Already covered headlessly, worth re-checking live: "front knee" → `l_knee` for a right-hander,
"mer"/"lay back" → `max_external_rotation`, "x factor" → `hip_shoulder_separation`, "trails" →
`motion_trail`. Unknown values come back with the valid list attached, not a stack trace.

---

## 4. Known deviations from `webmcp-tools.md`

Design doc vs. what shipped — deliberate, and worth stating out loud:

| Doc says | Shipped | Why |
|---|---|---|
| `set_overlay` accepts `reference_ghost` | overlays are `segment_frames`, `axial_dial`, `angle_readouts`, `motion_trail`, `event_markers` | The reference ghost was never built (PLAN cut list #2). Asking for it returns a retryable error naming the five real overlays — better than a toggle that silently does nothing. |
| `get_joint_angle_series` default `maxPoints: 60` | default 40 | 60 samples measured at 3 072 chars, over the budget the same doc sets. |
| `get_kinematics_at_event` returns referenced metrics | also returns `otherMetrics` | Every angle measured at that instant is reported; the ones with no published range get a bare value and no invented comparison. |
| `annotate_frame` takes `frame` | takes `frame`, or `event`, or neither | "Pin that at release" is the natural request; with neither, it pins the frame the human is already looking at. |
