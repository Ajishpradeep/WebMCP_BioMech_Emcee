"""Measure SAM 3D Body per-frame inference cost so we can size the batch runs."""

import sys
import time
from pathlib import Path

import cv2
import numpy as np

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "pipeline" / "vendor" / "sam-3d-body"))
CKPT_DIR = REPO / "pipeline" / "checkpoints" / "sam-3d-body-dinov3"

from sam_3d_body import SAM3DBodyEstimator, load_sam_3d_body  # noqa: E402

t0 = time.time()
model, cfg = load_sam_3d_body(
    checkpoint_path=str(CKPT_DIR / "model.ckpt"),
    mhr_path=str(CKPT_DIR / "assets" / "mhr_model.pt"),
    device="cuda",
)
est = SAM3DBodyEstimator(model, cfg, None, None, None)
print(f"model load: {time.time() - t0:.1f}s")

img = cv2.imread(str(REPO / "pipeline/data/frames/smoke_scherzer.png"))
h, w = img.shape[:2]
bbox = np.array([[0, 0, w, h]], dtype=np.float32)

for label, n in [("warmup", 2), ("timed", 10)]:
    t0 = time.time()
    for _ in range(n):
        est.process_one_image(img, bboxes=bbox, inference_type="body")
    dt = time.time() - t0
    print(f"{label}: {n} frames in {dt:.2f}s -> {dt / n * 1000:.0f} ms/frame ({n / dt:.1f} fps)")

import torch  # noqa: E402

print(f"peak VRAM: {torch.cuda.max_memory_allocated() / 1e9:.2f} GB")
