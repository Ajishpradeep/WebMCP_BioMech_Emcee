# Title

Biomech Emcee — Shared 3D Movement Review with WebMCP

## One-line Summary

A WebMCP-native biomechanics workspace where an agent can interpret, navigate, and annotate the
same live movement evidence as the human reviewing it.

## Problem

Biomechanics review is visually and technically dense. Evidence is split across source video, a 3D
reconstruction, event frames, measurements, definitions, confidence limits, comparisons, and notes.
A non-expert may not know which anatomical term to search for; a coach may need to mark a precise
moment; and an analyst may need to compare sessions without implying causation. A conventional AI
chat has none of the page's live context. It can describe biomechanics in general, but it does not
reliably know which session, frame, joint, camera view, overlay, or human correction is on screen.

## Solution

Biomech Emcee turns an offline 3D reconstruction into a shared browser workspace and exposes that
workspace through 13 WebMCP tools. Nine read tools give the agent structured access to the active
session, phase events, measurements, definitions, confidence, references, and comparison limits.
Four write tools let it seek the visible timeline, focus anatomy, change evidence overlays, and pin
a note at the frame it describes.

That creates a continuous interaction instead of a detached answer. A person can ask, “Show me what
elbow flexion means at MER and leave a note.” The agent resolves the ordinary-language request,
navigates the application to the evidence, focuses the throwing elbow, and leaves a persistent
evidence-linked observation. The application draws the supported geometry; the agent does not
invent a diagram. A coach can use the same workspace to review and annotate a precise frame, while
a less experienced user can ask the connected GPT model for an explanation at the level they need.

The product deliberately acts as a shared instrument rather than an autonomous coach. It refuses
kinetic quantities that monocular video cannot establish and does not convert exploratory angles
into clinical conclusions.

## Why This Matters — and Why WebMCP Is Essential Here

This is not a generic “read the page and summarize it” integration. The useful state is transient
and visual: what the human is inspecting now, which evidence layers are active, and which event the
human has corrected. WebMCP gives an external agent a stable, typed interface to that state without
forcing Biomech Emcee to embed its own assistant or forcing the agent to guess through screenshots
and DOM clicks. The user can bring a compatible agent and model through the in-app browser; the
specialist website contributes domain tools and evidence, while the agent contributes language,
reasoning, and an explanation shaped to the user's question.

The loop works in both directions. Agent writes visibly change the human's 3D workspace, and human
event corrections immediately change subsequent agent reads because both use the same browser
store. The result is shared evidence with shared control—not two parallel versions of the session.

For the implemented pitching workflow, this reduces several kinds of friction:

- A casual question can become a precise event, joint, view, and supported visual explanation.
- A specialist can turn the same interaction into a persistent frame-linked review note.
- A comparison request can retrieve actual session differences while preserving capture and
  confidence caveats.
- An unsupported request can return a structured refusal plus the nearest observation the evidence
  can support, instead of producing a plausible-sounding biomechanical claim.

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

## What Makes It Distinctive

Biomech Emcee uses WebMCP as an interaction architecture, not as an export button or a chat wrapper.
The read tools are paired with visible, domain-aware writes; the human can correct evidence that the
agent then consumes; and the tool contract encodes what must be refused. The same natural-language
surface therefore supports teaching, specialist review, evidence navigation, annotation, and
cautious comparison without transferring scientific authority to the language model.

Baseball pitching is the working example, not a claim that every sport is already supported. A new
sport would require its own events, measurements, references, and validation. What generalizes is
the WebMCP pattern: a complex specialist website can expose its live state and safe actions to the
agent the user chooses.

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

1. Open <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app> in ChatGPT's in-app browser. For the
   independently verified native path, use Google Chrome for Testing 154.0.8035.0 with native
   WebMCP enabled; do not treat the unsuccessful Chrome 149 feature-switch check as a compatibility
   claim.
2. Confirm the cleared Pexels and Wikimedia review sessions appear and the header reports all 13
   WebMCP tools. No login is required.
3. Ask: “What am I looking at?” The agent should call `get_session_overview` and mention the
   camera-frame and timebase limitations.
4. Ask: “At MER, show me what elbow flexion means and leave a note for the reviewer.” The agent
   should seek to MER, focus the throwing elbow, and pin a visible annotation.
5. Observe that the viewer emphasizes shoulder→elbow→wrist and shows the supported flexion
   arc/value without drawing arbitrary agent-supplied geometry.
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

<https://youtu.be/yAUan4TGnl8>

Verified 2026-09-03 through YouTube metadata: playable and embeddable, title matches Biomech Emcee,
and reported duration is 160–161 seconds. The owner confirms the published recording contains the
required narration. The recording plan and narration are retained in `docs/submission-assets.md`.

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

1. **Captured:** `submission-assets/screenshots/01-main-workspace.png`, the frozen synchronized 2D/3D
   workspace at MER with event anchors, measurements, and the partial sequence.
2. **Captured hero:** `submission-assets/BioMech_EmmCee_Screen_Capture.png`, ChatGPT's in-app browser
   showing 13 registered tools, the synchronized workspace, throwing-elbow focus, and supported
   flexion geometry.
3. **Optional if legible:** two-session `descriptive_only` comparison plus unavailable ranking.
4. **Optional:** exactly-13-tool proof. Omit if it is less understandable than the product images.

## Submission Readiness Notes

### Already verified

- Public HTTPS app is live on Cloud Run without authentication.
- Public GitHub repository is reachable; GitHub detects the MIT license in the About panel.
- The repository contains the WebMCP registration layer, all schemas, and all execution handlers.
- Static deployment loads committed sessions without the optional local GPU backend.
- Tool handlers, error contracts, output budgets, write-state integration, and event correction are
  covered by automated tests.
- Exact application commit `7e0561d` is deployed as Cloud Run revision `00011-26x`; native Chrome
  154 discovered exactly 13 unique tools, executed all 13, showed all four write effects and the
  supported elbow geometry, preserved registration on reload, and produced no browser errors.
- Both final sessions passed rights, decode/freeze, reconstruction, event-order, coverage, timebase,
  series and partial-sequence qualification. `compare_pitches` reports `descriptive_only` and makes
  better/worse ranking unavailable.
- The public YouTube demo is playable/embeddable and 160–161 seconds, within the three-minute limit.
- Final screenshots include the full workspace and a high-resolution ChatGPT/WebMCP focused-elbow
  hero image from the frozen deployment.

### Required before submission

- Keep the configured Cloud Run one-instance floor active through judging. The 2026-09-02 update
  retained the exact qualified revision/image and passed HTTPS plus asset smoke checks.
- Retain the owner-supplied ChatGPT shared record with the evidence. The owner checked most of the
  prescribed final-origin flow and explicitly accepted the gate; do not call it exhaustive replay.
- Run the final Devpost readiness/security check and create the Devpost project.
- Verify the completed form and public project page visually before the explicit submit action.
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
  including visible writes. The owner accepted a final-origin ChatGPT natural-language check; the
  exact ChatGPT build and exhaustive per-prompt replay were not independently captured.
- A transient Cloud Run scale-from-zero 429 window occurred during qualification. A service-level
  one-instance floor was configured on 2026-09-02 and the exact revision/image plus public assets
  were rechecked successfully; keep that floor active through judging.
- Baseball pitching is the only implemented domain workflow. The WebMCP interaction pattern is
  designed for reuse, but no other sport is represented as implemented or validated.

## Official Form Answers

The following labels and options were refreshed from the live Devpost form on 2026-09-03.

| Field | Draft answer / status |
|---|---|
| Submitter Type | **Individual** — the project is being entered by one person, not by the employer |
| Country of residence | **Taiwan** — the form asks residence, not citizenship; Indian citizenship does not change this answer |
| Organization name | Not applicable |
| App Status | **New** — repository history begins Aug 30, 2026, after the submission period opened |
| Existing-project updates | If Existing: document WebMCP tools, shared-state actions, event correction, deployment, and evidence hardening added during the submission period |
| Live URL | https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app |
| Testing instructions / credentials | Use the Testing Instructions above; no credentials required |
| Public code repository | https://github.com/Ajishpradeep/biomech-emcee |
| Demo video | https://youtu.be/yAUan4TGnl8 |
| Agents/clients used to test WebMCP | ChatGPT in-app browser (owner-accepted final-origin check on 2026-09-02; exact app/build and exhaustive replay not captured) and Google Chrome for Testing 154.0.8035.0 with native WebMCP enabled |
| AI tools leveraged | OpenAI Codex; Meta SAM 3D Body |
| Learning level | **Significant** — the project required substantial new work across WebMCP interaction design, live browser tooling, human-agent shared state, scientific claim boundaries, testing, and deployment |
| AI value useful in career | **Yes** — the reusable experience of designing agent-operable specialist interfaces directly applies to work as an AI Research Engineer |

### Official-field IDs for final submission

`28249` submitter type · `28250` country · `28251` organization · `28252` app status · `28253`
existing updates · `28254` live URL · `28255` testing instructions · `28256` repository · `28257`
tested agents/clients · `28258` AI tools · `28259` learning · `28260` career value.
