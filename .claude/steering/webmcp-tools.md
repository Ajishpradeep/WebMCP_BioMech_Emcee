# Steering — WebMCP Tool Surface

**This is the primary graded artifact.** WebMCP Leverage is the first judging criterion *and the
tiebreaker*, so this file gets more care than any other.

API mechanics: [`../../docs/webmcp-technical-reference.md`](../../docs/webmcp-technical-reference.md).
Do not re-derive signatures — they are already verified there.

---

## 1. Design principles

**The one rule: a tool must not be a mirror of a UI control.** If a tool's only justification is
"there's a button that does this," it is scored as padding. Every tool below has a stated reason an
external agent needs it that the UI does not already serve.

Applying Chrome's [best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices):

- **One function per tool.** No god-tools taking a mode flag.
- **Action-verb names**, ≤30 chars, snake_case.
- **Descriptions ≤500 chars**, parameter descriptions ≤150, outputs ≈≤1.5 K.
- **Natural-language enums, never IDs** — `event: "ball_release"`, not `event_id: 3`.
- **Loose schema, strict code.** Accept fuzzy input, validate hard in the handler, return a
  descriptive error the model can retry against.
- **Positive framing** — say what the tool *does*.
- **Update the UI before returning.** Agents read the page to plan the next step.

**Context cost is real.** There is no hard tool cap, but every tool consumes context and degrades
selection accuracy. **13 is our ceiling.** To add one, delete one.

### The four categories

| # | Category | Why it exists |
|---|---|---|
| **A** | Session & context | Lets the agent orient — "what am I looking at?" |
| **B** | Measurement & query | The instrument readings |
| **C** | Evidence & comparison | Keeps the agent honest: cited ranges, not invented ones |
| **D** | **Viewer control (write)** | **The WebMCP-native category.** The agent acts on the human's view. |

Category D is the differentiator. A backend MCP server can imitate A–C. It cannot do D at all.

---

## 2. Conventions

**Return shape.** The spec's `ToolExecuteCallback` is `Promise<any>` — any JSON-serializable value,
auto-serialized. Sources disagree on the MCP-style `{content:[...]}` envelope (technical reference
§3.4). **We return plain objects.** Verify in ChatGPT's in-app browser during Task 16; if it needs
the envelope, change it in **one place**:

```ts
// src/webmcp/registry.ts — single choke point for the return convention
export function toolResult<T>(data: T) {
  return data;   // ← if the envelope turns out to be required, wrap it HERE only
}
```

**Every response carries a `meta` block.** This is our honesty contract made machine-readable:

```jsonc
"meta": {
  "confidence": "high",              // high | medium | low | unavailable
  "cameraFrame": true,               // reconstruction is camera-frame, not metric world space
  "disclaimer": "Measurement only. Not a diagnosis or injury-risk assessment.",
  "citations": ["Diffendaffer 2023, Sports Health, doi:10.1177/19417381221078537"]
}
```

**Annotations.** Every read-only tool sets `readOnlyHint: true`. Any tool returning user-supplied
text (session labels, coach notes) sets `untrustedContentHint: true`.

**Registration.** Register once on session load via `src/webmcp/registry.ts`, with an
`AbortController` scoped to the session. Loading a new session aborts and re-registers, which fires
`toolchange` — a real, justified use of dynamic registration rather than a gratuitous one. Feature-detect
first and no-op silently in non-WebMCP browsers:

```ts
if (typeof document.modelContext?.registerTool !== "function") return;
```

---

## 3. The tools

### Category A — session & context

#### `list_pitch_sessions`
> Lists the pitch analyses loaded in this browser session, with pitcher handedness, view angle, frame
> count, and capture quality.

`readOnlyHint: true` · `untrustedContentHint: true` (labels are user-supplied)
**Input:** `{}`
**Returns:** `{ sessions: [{ sessionId, label, handedness, view, frameCount, fps, quality }], activeSessionId }`
**Why an agent needs it:** entry point. Without it the agent cannot address anything else by id.

---

#### `get_session_overview`
> Returns what is currently loaded and on screen: the active pitch, the frame the viewer is scrubbed
> to, the selected joint, active overlays, and overall reconstruction quality.

`readOnlyHint: true`
**Input:** `{ sessionId?: string }`
**Returns:** `{ sessionId, label, subject, capture, currentFrame, currentTime, selectedJoint, activeOverlays, eventsDetected, meta }`

**Why an agent needs it — this is the flagship "why WebMCP" tool.** It answers *"what is the human
looking at right now?"* That state lives only in this browser tab. **No backend MCP server can answer
this question.** When demoing, lead with it.

---

### Category B — measurement & query

#### `get_phase_events`
> Returns the detected pitching events — lead foot contact, maximum external rotation, and ball
> release — with frame number, timestamp, detection method, and confidence.

`readOnlyHint: true`
**Input:** `{ sessionId?: string }`
**Returns:**
```jsonc
{ "events": [
    { "name": "foot_contact",  "frame": 41, "t": 0.683, "method": "lead-ankle velocity minimum", "confidence": "high",   "manualOverride": false },
    { "name": "max_external_rotation", "frame": 58, "t": 0.967, "method": "shoulder ER series peak", "confidence": "medium", "manualOverride": false },
    { "name": "ball_release",  "frame": 63, "t": 1.050, "method": "wrist speed peak", "confidence": "medium", "manualOverride": false }
  ], "meta": { … } }
```
**Why:** every other measurement is anchored to these. The agent must be able to reason about *when*
things happen, and to see when detection was uncertain or a human corrected it.

---

#### `get_kinematics_at_event`
> Returns all measured joint angles at a named pitching event, each with its value, published
> reference range, and measurement confidence.

`readOnlyHint: true`
**Input:**
```jsonc
{
  "event": "foot_contact | max_external_rotation | ball_release",   // required, enum
  "sessionId": "optional"
}
```
**Returns:**
```jsonc
{
  "event": "ball_release", "frame": 63, "t": 1.050,
  "metrics": [
    { "name": "lead_knee_flexion", "value": 33.8, "unit": "deg",
      "reference": { "range": [31.2, 41.0], "typical": 35, "sd": 13 },
      "status": "within_reference", "confidence": "high" },
    { "name": "trunk_forward_tilt", "value": 28.1, "unit": "deg",
      "reference": { "range": [30.0, 33.4], "typical": 36, "sd": 7 },
      "status": "below_reference", "confidence": "high" }
  ],
  "meta": { … }
}
```
**Why:** the single highest-value read. One call gives the agent a complete, reference-anchored
snapshot it can reason across — something the UI can only show one panel at a time.

---

#### `get_joint_angle_series`
> Returns the time series for one joint angle across the pitch, downsampled, so an agent can reason
> about the shape of the movement rather than a single instant.

`readOnlyHint: true`
**Input:**
```jsonc
{
  "joint": "shoulder_external_rotation",   // required, enum of supported angles
  "fromEvent": "foot_contact",             // optional, default: whole clip
  "toEvent": "ball_release",               // optional
  "maxPoints": 60                          // optional, default 60 — keeps output under budget
}
```
**Returns:** `{ joint, unit, samples: [{ frame, t, value }], peak: { frame, t, value }, meta }`
**Why:** *when* a peak occurs and how sharp it is is often the whole answer. Cap `maxPoints` — a raw
120-frame series would blow the ~1.5 K output budget.

---

#### `get_kinematic_sequence`
> Returns the order and timing of peak angular velocity across pelvis, trunk, arm, forearm, and hand,
> and how the observed order compares with patterns reported in the literature.

`readOnlyHint: true`
**Input:** `{ sessionId?: string }`
**Returns:**
```jsonc
{
  "observedOrder": ["pelvis", "trunk", "arm", "hand", "forearm"],
  "peaks": [ { "segment": "pelvis", "frame": 44, "tVideo": 0.733, "tNormPct": 8.1,
               "peakAngularVelocity": null,
               "reason": "Slow-motion source at an unknown factor: absolute angular velocity is not derivable (tech.md 3.2b)." } ],
  "pelvisToTrunkSeparationPct": 12.4,   // % of the foot-contact -> ball-release window.
                                        // NOT seconds: clips are slow-motion at an unknown
                                        // factor, so absolute rates are unavailable (tech.md 3.2b).
  "isProximalToDistal": false,
  "literatureNote": "Complete proximal-to-distal sequencing is uncommon: across 208 analysed pitches, no pitch showed a fully proximal-to-distal order and 14 distinct patterns were observed. The most prevalent was pelvis → trunk → arm → hand → forearm. A non-PDS order is therefore not itself a fault.",
  "meta": { "confidence": "medium", … }
}
```
**Why:** the marquee metric of modern pitching analysis, and impossible to read off a static UI.
⚠️ **`literatureNote` is mandatory in the response.** Without it an agent will confidently call a
normal sequence a defect. Shipping the nuance *inside the tool output* is how we prevent that — and it
is a concrete demonstration of designing tools that keep a model honest.

---

### Category C — evidence & comparison

#### `get_metric_definition`
> Explains a biomechanical metric: what it measures, how this app computes it, its published
> reference range with citation, and the known limitations of measuring it from monocular video.

`readOnlyHint: true`
**Input:** `{ "metric": "hip_shoulder_separation" }`
**Returns:** `{ metric, plainLanguage, computation, referenceRange, citations, confidence, limitations, meta }`

**Why — this is the anti-hallucination tool, and a deliberate design statement.** Without it, an agent
asked "is 42° of hip–shoulder separation good?" will invent a range. With it, the agent has a cited
answer and a stated error bar. **Every reference number in the app is served from here**, so the
displayed UI value and the agent's answer can never drift apart.

---

#### `compare_to_reference`
> Compares every measured metric in this pitch against published reference ranges and returns only
> those that fall outside, with the size and direction of the deviation.

`readOnlyHint: true`
**Input:** `{ "event": "optional — restrict to one event", "includeWithinRange": false }`
**Returns:** `{ deviations: [{ metric, event, value, reference, direction: "above"|"below", magnitude, confidence, citation }], summary, meta }`
**Why:** answers "what stands out?" in one call instead of the agent fetching every metric and
diffing by hand. Filtering to deviations keeps the response inside the output budget.

---

#### `compare_pitches`
> Compares two loaded pitches metric by metric and returns the differences, so an agent can reason
> about what changed between attempts.

`readOnlyHint: true`
**Input:** `{ "sessionIdA": "…", "sessionIdB": "…", "event": "optional" }`
**Returns:** `{ comparisons: [{ metric, event, valueA, valueB, delta, confidence }], summary, meta }`
**Why:** before/after is the actual coaching workflow. Note the honest caveat, which the tool
returns: cross-session comparison is only valid when camera setup is similar — `meta.caveat` says so.

---

### Category D — viewer control (write) ★ the WebMCP-native category

These are why this project is a WebMCP project. All are **write** tools (`readOnlyHint: false`) that
mutate the shared `AnalysisStore` — the same store the human's UI renders from. **Each must update the
UI before returning**, per Chrome's best practices.

#### `seek_to_event`
> Scrubs the 3D viewer and video to a named pitching event or a specific frame, so the human sees
> exactly the moment being discussed.

`readOnlyHint: false`
**Input:** `{ "event": "foot_contact | max_external_rotation | ball_release", "frame": 63 }` — exactly one of the two
**Returns:** `{ movedTo: { frame, t, event }, meta }`
**Why:** the agent's words and the human's screen stay in sync. Cannot be done from outside the page.

---

#### `focus_joint`
> Highlights a joint or segment in the 3D viewer and rotates the camera to the plane where that
> angle is most readable.

`readOnlyHint: false`
**Input:** `{ "joint": "lead_knee", "cameraPlane": "sagittal | frontal | transverse | auto" }`
**Returns:** `{ focused: joint, cameraPlane, meta }`
**Why:** a joint angle is only legible from the right viewpoint. The agent knowing *which* view makes
its point is real expertise expressed through the interface — and it looks superb on video.

---

#### `set_overlay`
> Turns viewer overlays on or off: reference-range ghost, joint-angle readouts, motion trails, and
> the event-marker track.

`readOnlyHint: false`
**Input:** `{ "overlay": "reference_ghost | angle_readouts | motion_trail | event_markers", "enabled": true }`
**Returns:** `{ activeOverlays: [...], meta }`
**Why:** lets the agent stage the visual evidence for the point it is making, instead of describing it.

---

#### `annotate_frame`
> Pins a short labeled note to a specific frame and joint in the 3D viewer, where it stays visible to
> the human as part of the analysis.

`readOnlyHint: false` · `untrustedContentHint: true` (text originates outside the page)
**Input:**
```jsonc
{
  "frame": 58,                                  // required
  "joint": "r_shoulder",                        // optional anchor
  "label": "MER 12° below reference",           // required, ≤80 chars
  "severity": "info | attention"                // optional, default "info"
}
```
**Returns:** `{ annotationId, frame, joint, label, totalAnnotations, meta }`

**Why — the strongest single argument in the whole submission.** The agent's reasoning becomes a
**persistent artifact in the human's workspace**. The human scrubs the timeline afterwards and the
agent's observations are still pinned where they belong. That is collaboration, not automation, and it
is *exactly* the "cooperative interplay between a user, a web page, and an agent with shared context"
the explainer names as its goal. **Lead the demo video with this.**

---

## 4. Summary table

| # | Tool | Cat | Write | Why not just the UI |
|---|---|---|---|---|
| 1 | `list_pitch_sessions` | A | | Addressability |
| 2 | `get_session_overview` | A | | **Client-only state; no server can answer it** |
| 3 | `get_phase_events` | B | | Temporal anchors for all reasoning |
| 4 | `get_kinematics_at_event` | B | | Whole snapshot in one call |
| 5 | `get_joint_angle_series` | B | | Shape over time, not one instant |
| 6 | `get_kinematic_sequence` | B | | Marquee metric + literature nuance |
| 7 | `get_metric_definition` | C | | **Anti-hallucination; single source of truth** |
| 8 | `compare_to_reference` | C | | "What stands out?" in one call |
| 9 | `compare_pitches` | C | | Before/after coaching workflow |
| 10 | `seek_to_event` | D | ✎ | **Agent moves the human's view** |
| 11 | `focus_joint` | D | ✎ | **Agent chooses the right viewpoint** |
| 12 | `set_overlay` | D | ✎ | **Agent stages visual evidence** |
| 13 | `annotate_frame` | D | ✎ | **Agent's reasoning persists in the workspace** |

**4 of 13 are write tools that act on the human's live view.** That ratio is the WebMCP Leverage
argument in one line — put it in the Devpost description.

---

## 5. Deliberately excluded

Discipline matters as much as coverage; be ready to say why these are absent.

| Rejected | Why |
|---|---|
| `upload_video` | Inference is offline (tech.md §1). An agent triggering a GPU job that returns in minutes is a bad tool. |
| `get_raw_keypoints` | Hundreds of floats — blows the output budget and the agent cannot reason over raw 3D points anyway. That's what the derived metrics are for. |
| `get_elbow_valgus_torque` | **Not derivable from monocular video.** Handled as a structured refusal inside `get_metric_definition`, not as a tool that returns a fabricated number. |
| `assess_injury_risk` | We do not make medical claims (SPEC §6). |
| `score_pitch` / `grade_mechanics` | A single composite score is exactly the false authority this project argues against. |
| `set_camera_position` | Too low-level; `focus_joint` covers the real intent with better semantics. |
| Declarative form tools | Unsupported in ChatGPT's in-app browser. |

---

## 6. Verification checklist (Task 16)

- [ ] All 13 appear in **DevTools → Application → WebMCP → Available Tools**
- [ ] Each runs from the DevTools **Run tool** button with correct output
- [ ] Every response includes a populated `meta` block
- [ ] `readOnlyHint` / `untrustedContentHint` set correctly on every tool
- [ ] Write tools visibly change the UI **before** returning
- [ ] Errors return a descriptive message the model can retry against, not a raw stack trace
- [ ] Loading a new session fires `toolchange` and re-registers cleanly
- [ ] Non-WebMCP browser: registration no-ops, app fully usable
- [ ] Verified end-to-end in **ChatGPT's in-app browser**, not only Chrome
- [ ] Return-shape convention confirmed against the live agent (§2)
- [ ] Eval pass: ambiguous prompts ("why is he losing velocity?", "what should he work on?") select
      sensible tools in a sensible order
