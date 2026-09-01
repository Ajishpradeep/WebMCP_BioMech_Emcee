# Title

Biomech Emcee — Shared 3D Movement Review with WebMCP

## One-line Summary

An agent-ready biomechanics workspace where people and agents inspect, navigate, correct, and
annotate the same motion evidence; baseball pitching is the first end-to-end workflow.

## Problem

Sports-analysis applications split evidence across video, charts, measurements, notes, and
conversation. A human can see the movement, but an agent normally has to guess from pixels or rely
on a separate backend that does not know which motion, frame, camera view, overlay, or observation
the reviewer is currently using. That makes collaboration slow and makes it easy to discuss the
wrong moment or overstate uncertain measurements.

## Solution

Biomech Emcee turns an offline 3D reconstruction into a shared browser workspace. Its first complete
workflow applies the pattern to baseball pitching: the reviewer can scrub the delivery, change
anatomical views, inspect bounded kinematic measurements, correct three pitching event frames, and
see evidence notes in context. Thirteen WebMCP tools let an agent read the live review state,
retrieve definitions and caveats, navigate the visible viewer, focus relevant joints, toggle
evidence overlays, show application-owned flexion geometry, compare only compatible measurements,
and pin notes at the moment they describe.

The product deliberately acts as a shared instrument rather than an autonomous coach. It refuses
kinetic quantities that monocular video cannot establish and does not convert exploratory angles
into clinical conclusions.

## Why This Matters

The target users are movement specialists, coaches, athletes, sports-science practitioners, and
technical reviewers who need to discuss motion evidence together. WebMCP reduces the gap between an
agent's explanation and the evidence the human is viewing: agent actions visibly move the same
interface, and human corrections immediately become the source used by the agent tools.

Without WebMCP, the agent would need brittle UI interpretation or a separate server-side context
that cannot reliably represent transient browser state. With WebMCP, the page exposes a precise,
bounded vocabulary for collaborative review.

## How We Used AI

- Meta SAM 3D Body reconstructs 3D body landmarks from pitching footage in an offline GPU pipeline.
- The implemented pitching adapter derives deliberately bounded measurements, event signals, and a
  partial four-segment peak-order view from the reconstructed landmarks in the browser.
- WebMCP exposes structured capabilities to an agent. The agent can inspect evidence, explain limits,
  navigate the viewer, and leave review notes while the human remains the final interpreter.
- The tool surface contains structured refusals for unsupported quantities such as elbow valgus
  torque, ground-reaction force, pitch velocity, and injury risk.

## How We Used Codex

Codex was used as a critical product and engineering collaborator: auditing the repository and
hackathon fit, tracing browser and analysis flows, challenging scientific claims, implementing and
testing WebMCP handlers, tightening tool error contracts, adding the human event-correction loop,
building reproducible Cloud Run deployment, and keeping the public documentation aligned with what
the code actually proves. Each solid milestone was verified and committed separately.

## Key Features

The following features work today in the baseball-pitching reference workflow. Other sports would
need their own event taxonomy, measurements, references, and validation.

- Interactive 3D skeleton viewer with timeline, anatomical camera presets, motion trail, segment
  frames, axial dial, angle readouts, and landmark-grounded elbow/knee flexion arcs.
- Nine WebMCP read tools for session context, event and metric inspection, evidence definitions,
  cautious reference comparisons, and descriptive cross-session differences.
- Four WebMCP write tools that visibly seek the viewer, focus a joint, toggle an overlay, and pin an
  annotation in the shared workspace.
- Human-reviewed event correction: setting foot contact, maximum external rotation, or ball release
  recomputes dependent analysis and changes subsequent agent reads.
- Evidence contract shared by UI and tools, including confidence, citations, camera-frame caveats,
  timebase limitations, and structured refusals.
- Static public deployment with precomputed sessions; no GPU or backend is needed for judging.

## Architecture

```text
movement footage (pitching in the implemented workflow)
  → offline Python / SAM 3D Body reconstruction
  → frozen session.json contract
  → React + Three.js browser workspace
      ├─ browser-side biomechanics analysis
      ├─ Zustand live review state
      └─ 13 document.modelContext WebMCP tools
            ↕
         human + agent share the same visible evidence surface
```

The public build is a Vite application served by nginx on Google Cloud Run. Heavy model inference is
offline; session review and WebMCP execution are browser-local.

## Testing Instructions

1. Open <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app> in ChatGPT's in-app browser or Chrome
   149+ with `chrome://flags/#enable-webmcp-testing` enabled.
2. Confirm the cleared Pexels and Wikimedia review sessions appear and the header reports all 13
   WebMCP tools. No login is required.
3. Ask: “What am I looking at?” The agent should call `get_session_overview` and mention the
   camera-frame and timebase limitations.
4. Ask: “Show maximum layback and leave a note for the reviewer.” The agent should seek to MER,
   focus the throwing shoulder, and pin a visible annotation.
5. Ask: “Show me what the elbow measurement means at MER.” The agent should seek to MER and focus
   the throwing elbow; the viewer should emphasize shoulder→elbow→wrist and show the supported
   flexion arc/value without drawing arbitrary agent-supplied geometry.
6. Scrub to a nearby frame and select **Use f123** (with the displayed frame number) for an event
   in **Review event frames**.
   Ask for the phase events again; the changed frame should return with `manualOverride: true`.
7. Ask: “Compare the two reviews and show the most meaningful differences you can support,” then
   “Which one is better?” Differences must remain descriptive; ranking must be refused/reframed.
8. Ask for elbow valgus torque or pitch velocity. The agent should return a structured refusal, not
   invent a value.
9. Ask whether a hip–shoulder separation value is good. The agent should explain the unvalidated
   construct and avoid quoting a target range.

Automated verification from the repository:

```bash
cd web
npm ci
npm run typecheck
npx vitest run
npm run build
```

Current verified baseline: 89 tests pass, TypeScript typecheck passes, and the production build
completes. The final-candidate native live-host results are recorded in
`evals/webmcp-live-checklist.md`.

## Public Demo Link

<https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app>

## Public Repository Link

<https://github.com/Ajishpradeep/biomech-emcee>

## Demo Video

**TODO before submission:** add a public YouTube URL for an audio demo shorter than three minutes.

Suggested outline:

- **0:00–0:15 — Working product first:** open on the 3D delivery and ask the agent what is on screen.
- **0:15–0:45 — Problem and shared workspace:** show that the agent reads the exact live session,
  frame, camera state, events, and evidence limits.
- **0:45–1:25 — WebMCP wow moment:** ask the agent to find MER, focus the elbow, show the
  reconstructed segments/angle arc, and pin a note while the viewer visibly responds.
- **1:25–1:55 — Human-in-the-loop:** correct an event frame and show that the next agent read uses
  the reviewed event.
- **1:55–2:25 — Trust boundary:** request torque or injury risk and show the structured refusal;
  explain why only compatible constructs are compared.
- **2:25–2:45 — Architecture and impact:** briefly show the 13-tool surface, offline-to-browser
  architecture, explain pitching as the first reference workflow, and show how the same WebMCP
  interaction pattern can support future domain-specific sports adapters.
- **2:45–2:55 — Close:** live URL, public repository, and the phrase “shared evidence, not automated
  coaching.”

## Screenshot Shot List

1. Full 3D workspace at an event, including timeline, evidence chart, and measurements.
2. WebMCP-capable browser showing all 13 registered tools.
3. Agent-driven focused-elbow view with supported flexion geometry and an annotation pinned at MER.
4. Human event-review control displaying a `reviewed` event.
5. Evidence/refusal result showing a limitation communicated honestly.

## Submission Readiness Notes

### Already verified

- Public HTTPS app is live on Cloud Run without authentication.
- Public GitHub repository is reachable; GitHub detects the MIT license in the About panel.
- The repository contains the WebMCP registration layer, all schemas, and all execution handlers.
- Static deployment loads committed sessions without the optional local GPU backend.
- Tool handlers, error contracts, output budgets, write-state integration, and event correction are
  covered by automated tests.

### Required before submission

- Repeat the critical natural-language WebMCP flow in ChatGPT's in-app browser against deployed
  revision `00010-d65`; the native Chrome retest already passes and is recorded in
  `evals/webmcp-live-checklist.md`.
- Capture 3–5 final screenshots from the cleared-data build.
- Record and publish the narrated under-three-minute YouTube demo.
- Confirm the official form answers listed below.
- Freeze the submitted repository and deployment after the deadline until judging ends.

## Known Limitations

- Both bundled sources have documented redistribution terms: Pexels License for `delivery-02` and
  CC BY-SA 4.0 for the attributed, modified Wikimedia derivative in `delivery-03`.
- Monocular reconstruction is camera-frame with an estimated focal length; distances are not metric.
- The 25 and 29.97 fps demo clips undersample fast arm motion, so event timing and rate-derived
  observations are bounded rather than treated as laboratory-grade.
- Only direct two-segment elbow and lead-knee flexion measurements are compared with published
  ranges. Other measurements are exploratory until their constructs and conventions are validated.
- The kinematic display is a partial four-segment order, not a complete published five-segment
  sequence.
- Event detection is heuristic. Humans can correct events, but a manually labelled accuracy
  benchmark for the final dataset remains required.
- The cleared-evidence revision passed native Chrome 154 registration and all 13 executions,
  including visible writes. An earlier revision passed owner-observed ChatGPT in-app-browser tool
  selection; the exact ChatGPT build was not captured, and revision `00010-d65` requires the same
  owner-observed natural-language repeat.
- Baseball pitching is the only implemented domain workflow. The WebMCP interaction pattern is
  designed for reuse, but no other sport is represented as implemented or validated.

## TODO Official Form Fields

The following labels and options are copied from the live Devpost form. Do not infer the remaining
personal answers.

| Field | Draft answer / status |
|---|---|
| Submitter Type | **TODO confirm:** Individual / Team of Individuals / Organization |
| Country of residence | **TODO confirm** |
| Organization name | Not applicable unless submitting as an organization |
| App Status | **TODO confirm:** likely New; choose Existing only if Biomech Emcee predates Aug 25, 2026 |
| Existing-project updates | If Existing: document WebMCP tools, shared-state actions, event correction, deployment, and evidence hardening added during the submission period |
| Live URL | https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app |
| Testing instructions / credentials | Use the Testing Instructions above; no credentials required |
| Public code repository | https://github.com/Ajishpradeep/biomech-emcee |
| Agents/clients used to test WebMCP | ChatGPT in-app browser (owner-tested 2026-09-01; exact app/build not captured) and Google Chrome for Testing 154.0.8035.0 with native WebMCP enabled |
| AI tools leveraged | OpenAI Codex; Meta SAM 3D Body; **TODO add any others actually used** |
| Learning level | **TODO choose:** None / Moderate / Significant |
| AI value useful in career | **TODO choose:** Yes / No |

### Official-field IDs for final submission

`28249` submitter type · `28250` country · `28251` organization · `28252` app status · `28253`
existing updates · `28254` live URL · `28255` testing instructions · `28256` repository · `28257`
tested agents/clients · `28258` AI tools · `28259` learning · `28260` career value.
