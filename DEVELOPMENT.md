# Development and offline inference

This guide covers two separate workflows:

1. Run the static judge-facing application with its included sessions.
2. Reconstruct a local video with SAM 3D Body and review the generated session locally.

The deployed application uses workflow 1. GPU inference is never in its request path.

## Repository layout

```text
web/                         React, Three.js, biomechanics engine, and WebMCP tools
web/public/sessions/         committed input videos and generated session payloads
pipeline/                    offline detection, SAM 3D Body inference, smoothing, and export
pipeline/checkpoints/        local gated weights; ignored by Git
pipeline/vendor/             local upstream SAM 3D Body checkout; ignored by Git
pipeline/data/               local frames, uploads, and scratch inputs; ignored by Git
pipeline/out/                local QA videos; ignored by Git
scripts/deploy-gcp.sh        reproducible Cloud Run deployment
```

## Static web application

Requirements: Node.js 24 or newer and npm.

```bash
cd web
npm ci
npm run dev
```

The app reads `web/public/sessions/index.json`; each entry points to a committed session JSON and
source MP4. Review works without Python, CUDA, or a backend.

```bash
cd web
npm run typecheck
npx vitest run
npm run build
```

## Offline video-to-3D environment

The verified environment uses Linux, Python 3.12, an NVIDIA GPU with CUDA 12.x, `uv`, `ffmpeg`, and
a Hugging Face account approved for
[`facebook/sam-3d-body-dinov3`](https://huggingface.co/facebook/sam-3d-body-dinov3). It was tested on
an RTX A6000; other CUDA GPUs may have different memory and performance limits.

SAM 3D Body access is gated. Request access on the model page, then run:

```bash
hf auth login
./pipeline/setup.sh
```

The setup script creates `.venv`, installs CUDA PyTorch and pipeline dependencies, clones upstream
SAM 3D Body into ignored `pipeline/vendor/`, and downloads gated weights into ignored
`pipeline/checkpoints/`.

Expected checkpoint layout:

```text
pipeline/checkpoints/sam-3d-body-dinov3/
  model.ckpt
  assets/mhr_model.pt
```

Verify model loading with a local person image:

```bash
.venv/bin/python pipeline/smoke_test.py /absolute/path/to/person-image.png
```

## Prepare an input clip

Use footage you have the right to process and redistribute. Keep the subject fully visible, prefer a
stable side or oblique view, preserve the true frame rate, and avoid freeze-frame edits. Higher frame
rates improve fast-event timing.

Place the source under an ignored local path such as `input_baseball/` or `pipeline/data/raw/`, then
add an entry to `pipeline/clips.json`:

```json
{
  "sessionId": "my-session",
  "label": "Pitch — side view",
  "source": "pipeline/data/raw/my-pitch.mp4",
  "startSec": 0.0,
  "endSec": 3.0,
  "videoFps": 60.0,
  "videoFile": "my-session.mp4",
  "handedness": "right",
  "view": "side full-body view",
  "slowMotion": false,
  "realTimeScale": 1.0,
  "notes": "Record source, creator, license, and modifications."
}
```

`videoFps` must describe the encoded source. If a clip is slow motion, record the known real-time
scale; do not guess, because it changes every rate-derived measurement.

## Run reconstruction

```bash
.venv/bin/python pipeline/run.py
.venv/bin/python pipeline/run.py my-session
.venv/bin/python pipeline/run.py my-session --stride 4
```

The pipeline decodes the selected window, detects the subject with torchvision Faster R-CNN, runs
SAM 3D Body with explicit boxes, maps MHR-70 output to the application's 24-joint contract, smooths
2D/3D trajectories, and writes `web/public/sessions/<sessionId>.json`. It also writes
`pipeline/out/qa_<sessionId>.mp4` for local overlay inspection.

Copy or transcode the corresponding source clip to `web/public/sessions/<videoFile>`, add its entry
to `web/public/sessions/index.json`, and document its rights in `ATTRIBUTION.md`. Inspect the QA
overlay before trusting any downstream observation.

## Local upload-to-analysis mode

The optional FastAPI service provides a development-only upload path and requires the CUDA
environment above.

```bash
# terminal 1
.venv/bin/python pipeline/server.py

# terminal 2
cd web
npm run dev
```

Vite proxies `/api` to `http://127.0.0.1:8000`. The backend stores uploads under ignored
`pipeline/data/uploads/`, runs one GPU job at a time, writes a session JSON, and updates the local
session index. This backend is not deployed with the public application.

## WebMCP implementation

The integration is under `web/src/webmcp/`:

- `registry.ts` defines registration, error handling, output shaping, and paint synchronization.
- `tools/read/` contains nine evidence-reading tools.
- `tools/write/viewer.ts` contains four visible workspace actions.
- `useWebMCP.ts` manages registration lifecycle for the active session.
- `vocab.ts` maps ordinary language to canonical events, joints, and metrics.

Tools read and mutate the same Zustand store rendered by React. Write tools wait for a browser paint
before resolving so the workspace is visibly updated when the agent receives its result. Tests in
`web/src/webmcp/tools.test.ts` cover handlers, structured refusals, output budgets, and mutations.

## Cloud Run deployment

```bash
GCP_PROJECT_ID=your-project \
GCP_REGION=us-central1 \
GCP_SERVICE_NAME=biomech-emcee \
./scripts/deploy-gcp.sh
```

After deploying, confirm HTTPS and ensure responses do not include `Origin-Agent-Cluster: ?0`, which
disables WebMCP registration. Configure an appropriate minimum-instance policy for reliability and
test from a fresh WebMCP-capable browser.

The public judging service keeps one minimum instance configured. Its Quick-start prompts guide
is presentation-only UI; it does not change the 13 tools, scientific analysis, or two bundled sessions.
Demo narration and caption tooling are not application dependencies and need not be installed.

## Data and license responsibilities

- Do not commit Meta model checkpoints or the vendored upstream repository.
- Do not commit footage without documented redistribution rights.
- Preserve the Wikimedia derivative's creator, source, modification, and CC BY-SA 4.0 notices.
- Preserve the Pexels source/license record and do not imply endorsement.
- Treat generated landmarks as camera-frame estimates, not laboratory-grade ground truth.

See [ATTRIBUTION.md](ATTRIBUTION.md) for exact bundled sources and third-party terms.
