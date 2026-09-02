# Biomech Emcee

**Shared 3D movement review for people and agents, powered by WebMCP.**

Biomech Emcee is an agent-ready biomechanics workspace where a human specialist and an agent inspect
the same motion evidence. The current end-to-end reference workflow is baseball pitching: the human
controls a live 3D reconstruction while WebMCP gives the agent structured access to the current
session, evidence definitions, limitations, and visible viewer actions such as seeking, focusing,
overlays, and annotations.

**Live app:** <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app>

**Demo video:** <https://youtu.be/yAUan4TGnl8>

Built for [The WebMCP Challenge](https://webmcp.devpost.com/). The product thesis is simple: an
agent should help a reviewer navigate and document movement evidence, not impersonate a coach or
manufacture clinical conclusions. Baseball is the implemented reference workflow, not the intended
boundary of the human-agent review pattern.

## What is working

Everything currently implemented below is for the baseball-pitching workflow. Other sports would
require their own event taxonomy, metric definitions, references, and validation; they are a product
direction, not a current feature.

- Interactive in-browser 3D skeleton review, timeline scrubbing, camera presets, overlays,
  application-owned flexion geometry for focused elbows/knees, and persistent annotations.
- Two committed, precomputed review sessions that load without a GPU or analysis backend. The licensed
  Pexels full-body session is the default; the second session is an attributed, trimmed/transcoded
  Wikimedia derivative distributed under CC BY-SA 4.0.
- Thirteen WebMCP tools: nine read tools for session, measurement, and evidence context; four write
  tools that visibly navigate and annotate the shared review surface.
- Published-range comparisons only for construct-compatible direct two-segment elbow and lead-knee
  flexion measurements. Other angles remain exploratory measurements, not rankings.
- A partial four-segment peak-order view with normalized intervals and clip-quality refusal,
  explicitly not a full published five-segment sequence or a quality score.
- Plain-English review routing: “what stands out?” / “where did I mess up?” returns bounded
  observations and suggested seek/focus/annotation calls using the existing WebMCP tools.
- Cross-session questions are descriptive only: the shipped reviews depict different athletes and
  camera protocols, so the tool exposes compatibility limits and refuses better/worse ranking.

## Why WebMCP

The key state lives in the page: current pitch, frame, selection, view, overlays, and review notes.
WebMCP lets the agent read that live state and act on the same visual workspace the human sees. A
useful interaction is: inspect the event list → ask for a bounded measurement with caveats → seek
the viewer to the relevant frame → focus the joint and show its supported geometry → pin an
observation for the human to review.

The app remains useful in ordinary browsers. In a WebMCP-capable HTTPS host, the header reports
whether all 13 tools registered; a partial registration is surfaced instead of being hidden.

## Run locally

Prerequisites: Node 24+ and npm.

```bash
cd web
npm ci
npm run dev
```

Open the printed Vite URL. The static app loads session data from `web/public/sessions/`; it does
not require the Python inference environment to review the included sessions.

```bash
cd web
npm run typecheck
npx vitest run
npm run build
```

## Deploy

The production app is a static Vite build served by nginx on Cloud Run. With authenticated gcloud:

```bash
GCP_PROJECT_ID=ideaslab-gcp GCP_REGION=us-central1 \
GCP_SERVICE_NAME=pitchlab-webmcp ./scripts/deploy-gcp.sh
```

See [deployment details](docs/deployment.md), including the WebMCP-critical response-header check.

The submission-frozen application artifact is commit `7e0561d` on Cloud Run revision
`pitchlab-webmcp-00011-26x`. Native Chrome 154 passed all 13 tools on that revision, the owner
accepted the final-origin ChatGPT natural-language check, and Cloud Run has a service-level
one-instance floor for judge-facing availability. Post-freeze changes are limited to submission
copy and assets unless a genuine blocker is found.

## Architecture

```text
video → offline SAM 3D Body pipeline → session.json → static React review workspace
                                                     ↕
                                     WebMCP tools read and act on live page state
```

The heavyweight reconstruction pipeline runs offline and writes the frozen `session.json` contract.
The deployed review application computes its bounded kinematic display in the browser. This keeps
the public demo reproducible and makes WebMCP appropriate for the live, human-visible workspace.

## Important boundaries

Biomech Emcee is not a marker-based motion-capture replacement, diagnostic system, injury-risk
predictor, medical device, or autonomous pitching coach. It uses camera-frame reconstruction. The
two synchronized sources are cleared through the Pexels License and CC BY-SA 4.0 respectively.
Their creator, source, license, and modification details are available from each session's `i` card
and [ATTRIBUTION.md](ATTRIBUTION.md). The demo data must not be used for clinical decisions. The
project’s claim boundary and technical decisions are in
[SPEC.md](SPEC.md) and [HANDOFF.md](HANDOFF.md).

Focused elbow and knee arcs visualize only reconstructed landmark geometry already used by the
measurement. They do not represent force, momentum, energy transfer, causality, injury risk, or a
recommended technique.

## Repository map

- `web/` — React/Vite app, biomechanics engine, and WebMCP tools.
- `pipeline/` — optional offline inference and session export pipeline.
- `evals/` — tool-level and live-host verification materials.
- `docs/` — challenge facts, WebMCP references, and deployment record.
- `PLAN.md` — pre-submission execution plan and verified milestones.
- `docs/brand-decision.md` — locked product identity and positioning boundary.
- `docs/devpost-resume.md` — complete reconciliation protocol after the owner app review.
- `docs/final-release-qualification.md` — final evidence, comparison, presentation, and freeze ledger.

## License

Biomech Emcee’s source code is released under the [MIT License](LICENSE). Third-party model
weights and their terms are not redistributed; see [ATTRIBUTION.md](ATTRIBUTION.md).
