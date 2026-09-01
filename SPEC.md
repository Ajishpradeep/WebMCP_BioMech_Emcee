# SPEC — Biomech Emcee: Shared 3D Movement Review with WebMCP

> **Canonical product name:** Biomech Emcee. **Submission title:** *Biomech Emcee — Shared 3D
> Movement Review with WebMCP.* Baseball pitching is the only implemented reference workflow; the
> human-agent review pattern is intended to generalize, but a finished multi-sport platform is not
> claimed. Naming and positioning rationale: [`docs/brand-decision.md`](docs/brand-decision.md).
>
> **Target:** [The WebMCP Challenge](https://webmcp.devpost.com/) · deadline **Sep 3, 2026 @ 1:00 PM PDT**
> · live URL must stay up through **Sep 21, 2026**.
> Context: [`docs/webmcp-challenge-brief.md`](docs/webmcp-challenge-brief.md),
> [`docs/webmcp-technical-reference.md`](docs/webmcp-technical-reference.md).

---

## 1. Problem statement

Biomechanical analysis is difficult to review collaboratively. Laboratory systems are expensive and
specialized, while consumer video tools often reduce a movement to unexplained scalar scores. In
both cases the evidence is trapped in a fixed interface: a coach cannot ask a question, inspect the
supporting frame, and leave a visual note in the same workspace.

Biomech Emcee addresses the review problem rather than claiming to replace a motion-capture lab.
In its implemented pitching workflow, it gives a coach and an agent shared access to the same 3D
reconstruction, timeline, measurements, definitions, uncertainty, and annotations. The broader
product idea is a reusable interaction model for evidence-grounded movement review.

## 2. The core insight

Biomechanical analysis produces a **small, dense, highly structured dataset** that is difficult to
interrogate through a fixed UI. A general-purpose agent is useful for translating intent into a
sequence of evidence lookups and viewer actions; the human remains responsible for judging whether
the reconstructed pose and event frame are credible.

So: **stop trying to be the coach. Be the shared instrument.**

Biomech Emcee runs a specialist model (currently SAM 3D Body → 3D human pose per frame), derives a
bounded set of domain observations, renders them in an interactive 3D viewer, and exposes the live
review state as **WebMCP tools**. An agent can read the session, navigate to evidence, explain
definitions and limits, and *drive the viewer* while the human watches.

The specialist model handles perception. The general agent handles intent and orchestration. The
human validates the visual evidence and owns the conclusion.

## 3. Why WebMCP specifically — and not a backend MCP server

This is the question a judge will ask first, so it is the question the product must answer by
construction. **Three things are materially better because the agent is inside the page:**

1. **The analysis state is client-side and has no server representation.** Joint angles, event
   detection, reference comparison, and confidence scoring are all computed **in the browser** from a
   raw joint-trajectory file. Which pitch is loaded, which frame is scrubbed to, which smoothing
   window is active, which reference cohort is selected — none of it exists on any server. An agent
   asking *"what am I looking at right now?"* is answered against the exact browser state rather
   than a separate server-side copy.

2. **The agent can write back into the human's view.** Tools like `seek_to_event`, `focus_joint`,
   and `annotate_frame` let the agent *move the 3D viewer and pin annotations into it*. When the
   agent identifies an elbow observation at maximum external rotation, the viewer scrubs there, the
   elbow highlights with application-owned measurement geometry, and a labeled pin appears. The
   agent's reasoning becomes a visible artifact in the human's workspace. This is the "cooperative
   interplay between a user, a web page, and an agent
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
| **Movement specialist** (product direction) | Ask open-ended review questions and see supporting events, joints, definitions, and notes materialize in the same visual workspace. |
| **Pitching coach / P&C coach** (implemented workflow) | Review a reconstructed delivery with pitching events and deliberately bounded measurements. |
| **Athlete** | Review a specialist-approved evidence trail with plain-language definitions and explicit limits rather than an unexplained score. |
| **Sports-science / PT student** | Use a traceable instrument where every metric links to its definition, computation, literature source, and measurement uncertainty. |
| **Agent developers** (meta-audience) | Study a working WebMCP tool surface over a specialist ML model and client-side analysis state. |

## 5. In scope for this hackathon cycle

**Implemented reference workflow:** baseball pitching only. Chosen because the discriminating metrics
(hip–shoulder separation, kinematic-sequence timing, joint angles at discrete events) are
**angle-based and segment-relative**, which is exactly what survives monocular camera-frame
reconstruction. A pitch is also a short discrete event — a ~2-second clip, not a 60-second gait
capture — which keeps per-frame inference cheap. The current event detector, metrics, references,
tool vocabulary, and validation are pitching-specific. Supporting another sport requires an actual
domain adapter and evidence set; generality is architectural intent, not a completed feature.

**Capabilities:**

- Offline pipeline: pitch video → per-frame SAM 3D Body inference → smoothed 3D joint trajectories
- Automatic detection of the canonical pitching events: **lead foot contact**, **maximum external
  rotation (MER)**, **ball release**
- Selected kinematics at each event, limited to constructs whose definitions and conventions are
  compatible with the implementation
- **Partial four-segment kinematic sequence analysis** across pelvis → thorax → upper arm → forearm;
  it is not presented as the five-segment sequence used by the cited study
- Comparison against **published reference ranges** only where the measurement construct matches,
  with a citation and limitations attached
- **Per-metric confidence grading** and explicit refusal to report quantities monocular video cannot
  support (see §6)
- Interactive 3D viewer: skeleton/mesh playback, timeline scrub, event markers, joint highlighting
- Application-owned flexion explanation for a focused elbow or knee: proximal/distal reconstructed
  segments, straight-extension reference, angle arc, and value, with whole-body/source context kept.
- **A WebMCP tool surface** covering query, comparison, evidence lookup, and viewer control
  — see [`.claude/steering/webmcp-tools.md`](.claude/steering/webmcp-tools.md)
- Exactly two licensed, pre-analyzed demo pitches shipped as static assets so the app works without
  a GPU in the request path: Pexels `delivery-02` and a CC BY-SA 4.0 Wikimedia derivative
  `delivery-03`
- Descriptive-only cross-session comparison. Because athlete identity, camera setup, and controlled
  protocol are not established, better/worse, improvement/regression, causality, and coaching
  outcome are unavailable by contract

## 6. The honesty contract (a product feature, not a disclaimer)

This is a differentiator, and it is enforced in code — not just written in a footer. The current
grades describe expected conditioning and known derivability limits; they are **not empirical error
bounds for SAM 3D Body on baseball pitching**.

**Every metric carries a confidence grade:**

| Grade | Applies to | Basis |
|---|---|---|
| `high` | Better-conditioned sagittal/frontal-plane joint angles | Geometrically better conditioned; still not system-validated on these clips |
| `medium` | Transverse-plane segment separation (hip–shoulder separation), event timing | Derived from segment vectors; sensitive to reconstruction noise |
| `low` | Internal/external rotation | Literature consistently reports weakest markerless agreement on IR/ER |
| `unavailable` | **All kinetics** — elbow valgus/varus torque, joint forces, loading rates | Not derivable from monocular video without force data and a musculoskeletal model |

A small markerless-versus-marker study in boxing reported RMSD of **6.3°–23.0°**, with the weakest
agreement in internal/external rotation. That study provides context, not validation of this model,
sport, or implementation. Absolute distances in metric units are treated as **unreliable** — SAM 3D
Body returns camera-frame coordinates with an *estimated* focal length, so Biomech Emcee reports
height-normalized quantities rather than centimetres.

**Biomech Emcee will refuse to answer some questions, on purpose.** Ask it for elbow valgus torque and the
tool returns a structured refusal explaining why monocular video cannot support the number, and
offers the kinematic proxies it *can* stand behind. An instrument that knows its own error bars is
more useful than one that doesn't — and in a demo, an agent that says "I can't tell you that, here's
why" is far more credible than one that invents a number.

**Not a medical device.** Biomech Emcee measures and compares against published ranges. It does not
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
- ❌ **Real-time / streaming analysis.** Demo sessions are precomputed; optional local analysis is
  offline preprocessing rather than part of the public request path.
- ❌ **Multi-person tracking.** One pitcher per clip.
- ❌ **User accounts, databases, persistence across devices.** Static app + local session state.
- ❌ **Hand/finger detail, grip, or pitch-type classification.** SAM 3D Body's hand decoder exists but
  is out of scope.
- ❌ **The declarative WebMCP API.** Unsupported in ChatGPT's in-app browser, which is our primary
  judging surface. Imperative only.
- ❌ **Generic agent camera or drawing control.** No pixel coordinates, pan/zoom commands, freehand
  geometry, arbitrary arrows, or LLM-authored anatomical constructions. The application owns
  semantic framing and supported measurement geometry.

## 8. Future work (mention in the submission, do not build)

- Running gait, golf, tennis serve, and olympic lifts — candidate future workflows. Each needs a
  domain event taxonomy, metric library, compatible references, UI review, and independent
  validation; the current pitching implementation does not prove them automatically.
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
| **WebMCP Leverage** | **Strong** | Exactly 13 tools across four functional categories, not a mirror of the UI. Bidirectional: the agent both reads analysis *and* drives the 3D viewer. Uses the imperative API surface — `inputSchema`, annotations and `AbortSignal`. Tools resolve current client state at execution time, so the fixed registration remains correct across session changes. Semantic focus now makes supported geometry visible without adding generic camera/drawing tools. |
| **Execution** | **Medium–strong, and the main risk** | Mitigated by the hard offline/online split: the graded artifact never depends on GPU uptime, and the live URL is a static build. Scope cut to one sport specifically to protect finish quality. |
| **Potential Impact** | **Strong** | Real audience (coaches, athletes, PTs), real barrier (mocap labs cost thousands and take appointments), credible mechanism. The honesty contract makes the impact claim defensible instead of hype. |
| **Creativity & Ambition** | **Strong** | Nothing in the sponsor examples or Chrome demos is remotely near this — those are shopping, form-filling, filtering, and reordering. Chrome's own use-cases page names exactly those four, so they are the field's baseline. A specialist 3D vision model exposed as an agent-callable instrument, with the agent manipulating a live 3D reconstruction, is in different territory. |

**Where we are weakest:** Execution, on a 4-day clock. Every scoping decision in this spec is made in
service of finishing. When in doubt: **cut features, never finish.**
