# PitchLab Review

**A shared biomechanics evidence workspace for baseball-pitch review.**

PitchLab Review lets a human specialist and an agent inspect the same reconstructed delivery: the
human controls a live 3D view while WebMCP gives the agent structured access to the current session,
evidence definitions, limitations, and visible viewer actions such as seeking, focusing, overlays,
and annotations.

**Live app:** <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app>

Built for [The WebMCP Challenge](https://webmcp.devpost.com/). The product thesis is simple: an
agent should help a reviewer navigate and document evidence, not impersonate a coach or manufacture
clinical conclusions.

## What is working

- Interactive in-browser 3D skeleton review, timeline scrubbing, camera presets, overlays, and
  persistent annotations.
- Two committed, precomputed demo sessions that cold-load without a GPU or backend.
- Thirteen WebMCP tools: nine read tools for session, measurement, and evidence context; four write
  tools that visibly navigate and annotate the shared review surface.
- Published-range comparisons only for construct-compatible direct two-segment elbow and lead-knee
  flexion measurements. Other angles remain exploratory measurements, not rankings.
- A partial four-segment peak-order view, explicitly not a full published five-segment sequence.

## Why WebMCP

The key state lives in the page: current pitch, frame, selection, view, overlays, and review notes.
WebMCP lets the agent read that live state and act on the same visual workspace the human sees. A
useful interaction is: inspect the event list → ask for a bounded measurement with caveats → seek
the viewer to the relevant frame → focus the joint → pin an observation for the human to review.

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

PitchLab Review is not a marker-based motion-capture replacement, diagnostic system, injury-risk
predictor, medical device, or autonomous pitching coach. It uses camera-frame reconstruction and
some demo source footage has unresolved broadcast rights; see [ATTRIBUTION.md](ATTRIBUTION.md).
Do not add a source-video player or use this demo data for clinical decisions. The project’s claim
boundary and technical decisions are in [SPEC.md](SPEC.md) and [HANDOFF.md](HANDOFF.md).

## Repository map

- `web/` — React/Vite app, biomechanics engine, and WebMCP tools.
- `pipeline/` — optional offline inference and session export pipeline.
- `evals/` — tool-level and live-host verification materials.
- `docs/` — challenge facts, WebMCP references, and deployment record.
- `PLAN.md` — pre-submission execution plan and verified milestones.

## License

PitchLab Review’s source code is released under the [MIT License](LICENSE). Third-party model
weights and their terms are not redistributed; see [ATTRIBUTION.md](ATTRIBUTION.md).
