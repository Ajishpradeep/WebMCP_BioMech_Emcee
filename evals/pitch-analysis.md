# Evals — the WebMCP tool surface

**What this file is for.** The 13 tools are the graded artifact. This is the record of what has
been *verified* about them, what was verified *how*, and what still needs a real agent in a real
browser. Anything not ticked here is not done.

Two layers of verification, because they catch different failures:

| Layer | Catches | Where |
|---|---|---|
| **Headless harness** — `web/src/webmcp/tools.test.ts` | wrong values, missing `meta`, output-budget creep, unhelpful errors, write tools that don't write | `cd web && npx vitest run src/webmcp/tools.test.ts` |
| **Live agent** — DevTools, then ChatGPT's in-app browser | registration, return-shape convention, tool *selection* | a deployed HTTPS origin (Task 17) |

The harness runs every handler against the cleared Wikimedia reconstruction plus explicit in-memory
comparison and short-clip fixtures. The `delivery-03` numbers below are measured output, not
illustration.

---

## 1. Checklist (webmcp-tools.md §6)

- [x] All 13 register in code and the surface holds at exactly 13, names unique and ≤30 chars
- [x] Every successful evidence/unavailability response includes a populated `meta` block
      (confidence · cameraFrame · disclaimer · citations · caveats); retryable input errors use the
      smaller structured error contract
- [x] `readOnlyHint` / `untrustedContentHint` correct on every tool — 9 read / 4 write; untrusted on `list_pitch_sessions`, `get_session_overview`, and `annotate_frame`
- [x] Write tools mutate the store the UI renders from, and await a paint before returning
- [x] Errors return a retryable message naming the values that would have worked — never a stack trace
- [x] Output budget enforced: hard ceiling of 3 000 characters per response, asserted per tool
- [x] Non-WebMCP browser: `registerTools` no-ops, the app is fully usable, the header says so
- [x] The fixed 13-tool surface registers once; handlers resolve live Zustand state at execution time,
  avoiding duplicate or stale registrations when a session changes
- [x] **All 13 exposed by native Chrome WebMCP discovery** on the final candidate
- [x] **Each runs through the native WebMCP invocation surface**
- [x] **Write tools visibly change the screen when invoked** — the submission's core claim
- [x] **Final-origin ChatGPT natural-language check owner-accepted** — owner reports most of the
      prescribed flow checked; exhaustive per-prompt replay was not independently captured
- [x] **Return-shape convention confirmed against a live host** — plain objects work; leave
      `toolResult()` centralized and unchanged
- [x] Tool-selection gate accepted by the owner against the final origin (§3 below)

---

## 2. Measured output sizes

Session: `delivery-03` (246 frames). Chrome's guidance is ≈1.5 K per response; our honesty
block (disclaimer + camera-frame + timebase caveats) costs ~450 characters of that on every call,
which we consider non-negotiable, so the enforced ceiling is 3 000.

| Tool | chars | note |
|---|---|---|
| `seek_to_event` | 496 | final live run |
| `annotate_frame` | 650 | final live run |
| `focus_joint` | 626 | final live run; supported elbow geometry visibly rendered |
| `get_metric_definition` | 1 511 | definition; torque refusal is smaller |
| `get_joint_angle_series` | 1 296 | 8 requested samples; default remains 40 |
| `get_session_overview` | 1 454 | final live run |
| `get_kinematics_at_event` | 2 435 | final live run |
| `get_kinematic_sequence` | 2 210 | final live run |
| `compare_to_reference` | 2 656 | capped at 10 deviations |
| `compare_pitches` | 2 689 | real bundled pair; capped at 10 comparisons |

Three budget failures were found and fixed rather than waved through: `get_joint_angle_series`
default lowered 60 → 40 samples; `compare_to_reference` and `compare_pitches` capped at 10 rows with
an `omitted` count; and `get_kinematic_sequence` states the applicable timebase caveat once instead
of repeating it on all four peaks. For the final normal-rate sessions, that caveat explains that an
estimated scale and modest frame rate cap rate confidence.

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
**Recorded (`delivery-03`):** order pelvis → trunk → arm → forearm, `isProximalToDistal: true`;
pelvis, trunk, and upper arm peak together at f118 and forearm at f120. Rate units are available but
remain medium-confidence because the 29.97 fps source undersamples the fastest arm motion.

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
**Recorded (`delivery-03`):** MER candidate f120 (low confidence); for this left-handed session,
`focus_joint` resolves `throwing shoulder` to `l_acromion`; the pin lands on f120.

### 3.5b "Show me what the elbow measurement means at MER."
**Expect:** `get_metric_definition { metric: "elbow_flexion" }` →
`seek_to_event { event: "max_external_rotation" }` →
`focus_joint { joint: "throwing_elbow" }`, optionally `set_overlay`.
**Pass — watch the screen:** the viewer preserves whole-body/source context and renders the
application-owned shoulder→elbow→wrist segments, straight-extension reference, flexion arc, and
value. **Fail:** arbitrary LLM geometry, force arrows, or a verbal answer without moving/focusing
the shared workspace when asked to show it.

### 3.6 "What should he work on?"
**Expect:** `compare_to_reference`, then `get_metric_definition` on a returned direct flexion metric.
**Pass:** presents deviations as observations with `medium` confidence and does not turn exploratory
axial, trunk, separation, or foot angles into a training plan. The external-rotation lay-back range
is intentionally unavailable because the constructs have not been validated as equivalent.

### 3.7 Robustness — fuzzy input
Already covered headlessly, worth re-checking live: "front knee" → `r_knee` for this left-hander,
"mer"/"lay back" → `max_external_rotation`, "x factor" → `hip_shoulder_separation`, "trails" →
`motion_trail`. Unknown values come back with the valid list attached, not a stack trace.

### 3.8 "Compare the two reviews" / "Which one is better?"
**Expect:** `list_pitch_sessions` → `compare_pitches`.
**Pass:** reports only descriptive shared-event angle differences; identifies different/unestablished
athlete identity, camera views, frame rates, and capture protocol; refuses ranking, improvement,
regression, cause, performance, and coaching outcome. **Fail:** calling either session better or
treating the pair as controlled before/after evidence.

The complete 10-prompt owner sequence that covers all nine reads and four writes is maintained in
`evals/webmcp-live-checklist.md`; keep this file focused on selection and scientific pass criteria.

---

## 4. Historical design deviations now reconciled

These earlier design assumptions were deliberately changed during implementation. The steering
document now describes the shipped contracts; this table preserves why they changed:

| Earlier design | Shipped | Why |
|---|---|---|
| `set_overlay` accepts `reference_ghost` | overlays are `segment_frames`, `axial_dial`, `angle_readouts`, `motion_trail`, `event_markers` | The reference ghost was never built (PLAN cut list #2). Asking for it returns a retryable error naming the five real overlays — better than a toggle that silently does nothing. |
| `get_joint_angle_series` default `maxPoints: 60` | default 40 | 60 samples measured at 3 072 chars, over the budget the same doc sets. |
| `get_kinematics_at_event` returns referenced metrics | also returns `otherMetrics` | Every angle measured at that instant is reported; the ones with no published range get a bare value and no invented comparison. |
| `annotate_frame` takes `frame` | takes `frame`, or `event`, or neither | "Pin that at release" is the natural request; with neither, it pins the frame the human is already looking at. |
| Session-scoped dynamic re-registration | fixed document-lifetime 13-tool registration | Handlers resolve current Zustand state at execution time; this avoided duplicate/stale tools and reload remained exactly 13. |
| `focus_joint` only highlights/rotates | supported elbow/knee focus also renders metric geometry in the viewer | The application can show what direct flexion means without changing the tool schema or accepting LLM coordinates. |
| `compare_pitches` implied before/after | output is explicitly `descriptive_only` with ranking unavailable | The two licensed sessions are different/uncontrolled reviews, not improvement evidence. |
