"""Local analysis backend — upload a clip, get a session.json.

This exists ONLY for local development and demos. The deployed PitchLab build is a static
bundle with no backend: it serves pre-computed sessions from web/public/sessions/ so a
judge with no GPU gets a working app instantly. See .claude/steering/tech.md §1.

SAM 3D Body is 840M params and needs CUDA, so it can never sit in the request path of a
free static deployment.

Run:
    .venv/bin/python pipeline/server.py
Then start the web app (`npm run dev` in web/) — vite proxies /api to :8000.
"""

from __future__ import annotations

import shutil
import sys
import threading
import uuid
from pathlib import Path
from typing import Any

import cv2
import torch
import uvicorn
from fastapi import BackgroundTasks, FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "pipeline"))
sys.path.insert(0, str(REPO / "pipeline" / "vendor" / "sam-3d-body"))

import json  # noqa: E402

from run import CKPT_DIR, OUT_DIR, build_detector, run_clip  # noqa: E402
from sam_3d_body import SAM3DBodyEstimator, load_sam_3d_body  # noqa: E402

UPLOAD_DIR = REPO / "pipeline" / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="PitchLab analysis backend")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

JOBS: dict[str, dict[str, Any]] = {}
_MODELS: dict[str, Any] = {}
_LOCK = threading.Lock()  # one GPU, one job at a time


def models():
    """Load once, reuse forever — model load is ~17 s."""
    if not _MODELS:
        print("loading SAM 3D Body …")
        model, cfg = load_sam_3d_body(
            checkpoint_path=str(CKPT_DIR / "model.ckpt"),
            mhr_path=str(CKPT_DIR / "assets" / "mhr_model.pt"),
            device="cuda",
        )
        _MODELS["estimator"] = SAM3DBodyEstimator(model, cfg, None, None, None)
        print("loading person detector …")
        _MODELS["detector"] = build_detector("cuda")
        print("ready.")
    return _MODELS


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "gpu": torch.cuda.is_available(),
        "device": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "model": "sam-3d-body-dinov3",
        "warm": bool(_MODELS),
    }


def _analyze(job_id: str, video_path: Path, session_id: str) -> None:
    job = JOBS[job_id]
    try:
        with _LOCK:
            job.update(status="running", stage="loading model", progress=0.02)
            m = models()

            cap = cv2.VideoCapture(str(video_path))
            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
            cap.release()
            if n <= 0:
                raise RuntimeError("could not read the video (0 frames)")

            # Cap the work so an accidental 10-minute upload can't wedge the GPU.
            duration = n / fps
            stride = max(1, round(n / 900))

            clip = {
                "sessionId": session_id,
                "label": f"Uploaded — {video_path.stem[:48]}",
                "source": str(video_path.relative_to(REPO)),
                "startSec": 0.0,
                "endSec": duration,
                "videoFps": fps,
                "handedness": "right",
                "view": "uploaded",
                # Unknown for an arbitrary upload; assume real time unless told otherwise.
                # A wrong guess here would silently corrupt every rate metric, so we mark
                # it unknown rather than assuming (tech.md §3.2b).
                "slowMotion": False,
                "realTimeScale": None,
            }

            def progress(stage: str, p: float) -> None:
                job.update(stage=stage, progress=min(0.99, p))

            job.update(stage="reading video", progress=0.05)
            session = run_clip(clip, m["estimator"], m["detector"], "cuda", stride, progress)

            OUT_DIR.mkdir(parents=True, exist_ok=True)
            (OUT_DIR / f"{session_id}.json").write_text(json.dumps(session, separators=(",", ":")))

            idx_path = OUT_DIR / "index.json"
            existing = json.loads(idx_path.read_text())["sessions"] if idx_path.exists() else []
            entry = {
                "sessionId": session_id,
                "label": clip["label"],
                "handedness": "right",
                "view": "uploaded",
                "frameCount": session["source"]["frameCount"],
                "file": f"{session_id}.json",
            }
            by_id = {s["sessionId"]: s for s in existing}
            by_id[session_id] = entry
            idx_path.write_text(json.dumps({"sessions": list(by_id.values())}, indent=2))

            job.update(status="done", stage="complete", progress=1.0, sessionId=session_id)
    except Exception as e:  # noqa: BLE001 - surface anything to the UI
        import traceback

        traceback.print_exc()
        job.update(status="error", stage="failed", error=str(e))


@app.post("/api/analyze")
async def analyze(video: UploadFile, background: BackgroundTasks):
    if not video.filename:
        raise HTTPException(400, "no file")

    job_id = uuid.uuid4().hex[:12]
    session_id = f"upload-{job_id}"
    dest = UPLOAD_DIR / f"{session_id}{Path(video.filename).suffix or '.mp4'}"
    with dest.open("wb") as f:
        shutil.copyfileobj(video.file, f)

    JOBS[job_id] = {
        "id": job_id, "status": "queued", "stage": "queued",
        "progress": 0.0, "sessionId": None, "error": None,
    }
    background.add_task(_analyze, job_id, dest, session_id)
    return {"jobId": job_id}


@app.get("/api/jobs/{job_id}")
def job_status(job_id: str):
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(404, "unknown job")
    return job


if __name__ == "__main__":
    print("PitchLab analysis backend — http://127.0.0.1:8000")
    print("Model loads lazily on the first upload (~20 s).")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
