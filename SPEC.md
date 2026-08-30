# SPEC — PitchLab: Agent-Native Biomechanics

> **Working name:** PitchLab. The POC is baseball-only; the platform layer underneath is
> sport-agnostic. Rename freely before submission.
>
> **Target:** [The WebMCP Challenge](https://webmcp.devpost.com/) · deadline **Sep 3, 2026 @ 1:00 PM PDT**
> · live URL must stay up through **Sep 21, 2026**.
> Context: [`docs/webmcp-challenge-brief.md`](docs/webmcp-challenge-brief.md),
> [`docs/webmcp-technical-reference.md`](docs/webmcp-technical-reference.md).

---

## 1. Problem statement

3D biomechanical analysis of athletic movement is locked behind marker-based motion-capture labs:
expensive, appointment-only, and the output is a static PDF a coach reads once. Meanwhile, the
consumer alternative — phone-video apps — reports a handful of scalar numbers with no 3D
reconstruction, no traceability to literature, and no way to ask a follow-up question.

Both failure modes share a root cause: **the analysis is trapped in whatever screens the vendor
decided to build.** A pitching coach with a specific question — *"is his separation timing the reason
the velocity dropped, or is it the front knee?"* — has no way to ask it. There is no screen for that
question, and there never will be, because the space of useful questions about a pitch is unbounded.

## 2. The core insight

Biomechanical analysis produces a **small, dense, highly structured dataset** (joint angles over
time) that is **useless without expert interpretation**. That is precisely the shape of problem a
general-purpose reasoning agent is good at — and precisely the shape of data a fixed UI is bad at
exposing.

So: **stop trying to be the brain.** Be the instrument.

PitchLab runs the specialist model (SAM 3D Body → 3D human mesh per frame), derives rigorous
biomechanics from it, renders it in an interactive 3D viewer for the human — and exposes the whole
analysis as **WebMCP tools** so that whatever agent the user already trusts can read it, reason over
it, cross-reference it, and *drive the viewer* while the human watches.

The specialist model handles perception. The general agent handles interpretation. The human stays
in the loop because they are looking at the same 3D reconstruction the agent is reading.

## 3. Why WebMCP specifically — and not a backend MCP server

This is the question a judge will ask first, so it is the question the product must answer by
construction. **Three things here are only possible because the agent is inside the page:**

1. **The analysis state is client-side and has no server representation.** Joint angles, event
   detection, reference comparison, and confidence scoring are all computed **in the browser** from a
   raw joint-trajectory file. Which pitch is loaded, which frame is scrubbed to, which smoothing
   window is active, which reference cohort is selected — none of it exists on any server. An agent
   asking *"what am I looking at right now?"* can only be answered from inside the page.
   A backend MCP server structurally cannot serve this.

2. **The agent can write back into the human's view.** Tools like `seek_to_event`, `focus_joint`,
   and `annotate_frame` let the agent *move the 3D viewer and pin annotations into it*. When the
   agent says "the problem is at maximum external rotation," the viewer scrubs there, the shoulder
   highlights, and a labeled pin appears. The agent's reasoning becomes a visible artifact in the
   human's workspace. This is the "cooperative interplay between a user, a web page, and an agent
   with shared context" the WebMCP explainer names as its goal — and it is the single hardest thing
   to fake with any other integration style.

3. **Zero-integration reach.** No API keys, no OAuth, no server for the user to trust with their
   video. Open the page in an agentic browser and the tools are simply *there*, scoped to the session
   the user is already looking at.

**Honest boundary:** a backend MCP server would be the *right* choice for a multi-user athlete
database with historical trend queries. We say so explicitly rather than pretending WebMCP dominates
everywhere — that's §8 future work, and it is the case where you'd run both, as OpenAI's guide notes
a site can.

## 4. Target users

| User | What they get |
|---|---|
| **Pitching coach / P&C coach** (primary) | Ask open-ended questions of a pitch in natural language and see the answer materialize in the 3D view. No new software to learn — they bring their own agent. |
| **Athlete** | A plain-language read on their own mechanics, with the ability to ask "why" and get a cited answer rather than a score. |
| **Sports-science / PT student** | A traceable instrument: every metric links to its definition, computation, literature source, and measurement uncertainty. |
| **Agent developers** (meta-audience) | A reference implementation of a WebMCP tool surface over a specialist ML model — the pattern generalizes far past baseball. |

## 5. In scope for this hackathon cycle

**Sport:** baseball pitching only. Chosen because the discriminating metrics
(hip–shoulder separation, kinematic-sequence timing, joint angles at discrete events) are
**angle-based and segment-relative**, which is exactly what survives monocular camera-frame
reconstruction. A pitch is also a short discrete event — a ~2-second clip, not a 60-second gait
capture — which keeps per-frame inference cheap.

**Capabilities:**

- Offline pipeline: pitch video → per-frame SAM 3D Body inference → smoothed 3D joint trajectories
- Automatic detection of the canonical pitching events: **lead foot contact**, **maximum external
  rotation (MER)**, **ball release**
- Derived kinematics at each event: shoulder abduction / external rotation, elbow flexion, lead knee
  flexion, trunk forward and lateral tilt, hip–shoulder (pelvis–thorax) separation, stride length as
  % of height
- **Kinematic sequence analysis**: peak angular velocity ordering across pelvis → trunk → arm →
  forearm → hand, plus pelvis-to-trunk separation time
- Comparison against **published reference ranges**, each carrying its literature citation
- **Per-metric confidence grading** and explicit refusal to report quantities monocular video cannot
  support (see §6)
- Interactive 3D viewer: skeleton/mesh playback, timeline scrub, event markers, joint highlighting
- **A WebMCP tool surface** covering query, comparison, evidence lookup, and viewer control
  — see [`.claude/steering/webmcp-tools.md`](.claude/steering/webmcp-tools.md)
- 2–3 pre-analyzed demo pitches shipped as static assets so the app works instantly, with no GPU in
  the request path

## 6. The honesty contract (a product feature, not a disclaimer)

This is a differentiator, and it is enforced in code — not just written in a footer.

**Every metric carries a confidence grade:**

| Grade | Applies to | Basis |
|---|---|---|
| `high` | Sagittal/frontal-plane joint angles (knee flexion, elbow flexion, trunk tilt) | Markerless-vs-marker-based agreement is best here |
| `medium` | Transverse-plane segment separation (hip–shoulder separation), event timing | Derived from segment vectors; sensitive to reconstruction noise |
| `low` | Internal/external rotation | Literature consistently reports weakest markerless agreement on IR/ER |
| `unavailable` | **All kinetics** — elbow valgus/varus torque, joint forces, loading rates | Not derivable from monocular video without force data and a musculoskeletal model |

Reported markerless-vs-marker-based RMSD in sports settings is **6.3°–23.0°**; agreement is weakest
in internal/external rotation. Absolute distances in metric units are treated as **unreliable** —
SAM 3D Body returns camera-frame coordinates with an *estimated* focal length, so PitchLab reports
**stride length normalized to body height**, never in centimetres.

**PitchLab will refuse to answer some questions, on purpose.** Ask it for elbow valgus torque and the
tool returns a structured refusal explaining why monocular video cannot support the number, and
offers the kinematic proxies it *can* stand behind. An instrument that knows its own error bars is
more useful than one that doesn't — and in a demo, an agent that says "I can't tell you that, here's
why" is far more credible than one that invents a number.

**Not a medical device.** PitchLab measures and compares against published ranges. It does not
diagnose, predict injury, or clear anyone to play. Deviation from a reference range is an
*observation*, not a *finding*. This is stated in the UI and returned in tool metadata. The
supporting rationale is in [`.claude/steering/tech.md`](.claude/steering/tech.md) §7.

## 7. Explicit non-goals for this cycle

- ❌ **Injury prediction or risk scoring.** The prospective evidence linking biomechanical measures to
  injury is weak; a meta-analysis of prospective studies found the literature *does not generally
  support* biomechanical measures as injury risk factors in non-elite runners. We will not build a
  "risk score."
- ❌ **Kinetics.** No torques, no forces, no loading rates. See §6.
- ❌ **Running gait.** Deferred. Many headline running metrics need metric scale or force plates.
- ❌ **Live in-browser pose inference.** SAM 3D Body is 631M–840M params and Linux+CUDA only.
  Inference stays offline. See [`tech.md`](.claude/steering/tech.md) §3.
- ❌ **Real-time / streaming analysis.** Upload-and-analyze only.
- ❌ **Multi-person tracking.** One pitcher per clip.
- ❌ **User accounts, databases, persistence across devices.** Static app + local session state.
- ❌ **Hand/finger detail, grip, or pitch-type classification.** SAM 3D Body's hand decoder exists but
  is out of scope.
- ❌ **The declarative WebMCP API.** Unsupported in ChatGPT's in-app browser, which is our primary
  judging surface. Imperative only.

## 8. Future work (mention in the submission, do not build)

- Running gait, golf, tennis serve, olympic lifts — the tool surface is sport-agnostic; only the
  metric library and reference ranges change
- Longitudinal athlete tracking — *this is where a companion backend MCP server belongs*, with WebMCP
  handling the live session and MCP handling history
- Multi-camera capture to lift the transverse-plane and IR/ER confidence grades
- Force-plate / IMU fusion to unlock the kinetics currently graded `unavailable`
- `outputSchema` on every tool once WebMCP ships it (currently an open question in the spec)

## 9. Self-score against the judging criteria

Rubric: [`docs/webmcp-challenge-brief.md`](docs/webmcp-challenge-brief.md) §6.
**WebMCP Leverage is the tiebreaker criterion** and is weighted accordingly in our effort allocation.

| Criterion | Self-assessment | Why |
|---|---|---|
| **WebMCP Leverage** | **Strong** | ~13 tools across four functional categories, not a mirror of the UI. Bidirectional: the agent both reads analysis *and* drives the 3D viewer. Uses the real API surface — `inputSchema`, `annotations`, `readOnlyHint`, `untrustedContentHint`, `AbortSignal`, `toolchange` on session load. Derived state is genuinely client-side-only, so the "why not a backend MCP server" question answers itself. |
| **Execution** | **Medium–strong, and the main risk** | Mitigated by the hard offline/online split: the graded artifact never depends on GPU uptime, and the live URL is a static build. Scope cut to one sport specifically to protect finish quality. |
| **Potential Impact** | **Strong** | Real audience (coaches, athletes, PTs), real barrier (mocap labs cost thousands and take appointments), credible mechanism. The honesty contract makes the impact claim defensible instead of hype. |
| **Creativity & Ambition** | **Strong** | Nothing in the sponsor examples or Chrome demos is remotely near this — those are shopping, form-filling, filtering, and reordering. Chrome's own use-cases page names exactly those four, so they are the field's baseline. A specialist 3D vision model exposed as an agent-callable instrument, with the agent manipulating a live 3D reconstruction, is in different territory. |

**Where we are weakest:** Execution, on a 4-day clock. Every scoping decision in this spec is made in
service of finishing. When in doubt: **cut features, never finish.**
