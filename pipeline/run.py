"""End-to-end Tier-A pipeline: clip -> session.json.

Streams frames from the source video, detects the pitcher with torchvision Faster R-CNN,
runs SAM 3D Body per frame with an explicit bbox, smooths the joint trajectories, and
writes web/public/sessions/<sessionId>.json.

We deliberately do NOT use detectron2 (fragile build) or Ultralytics (AGPL). See
pipeline/requirements.txt.

Usage:
    .venv/bin/python pipeline/run.py                       # all clips in clips.json
    .venv/bin/python pipeline/run.py delivery-01             # one clip
    .venv/bin/python pipeline/run.py --stride 4            # every 4th frame (fast preview)
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path

import cv2
import numpy as np
import torch

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "pipeline" / "vendor" / "sam-3d-body"))
sys.path.insert(0, str(REPO / "pipeline"))

from joint_map import BONES, JOINT_NAMES, map_keypoints  # noqa: E402
from sam_3d_body import SAM3DBodyEstimator, load_sam_3d_body  # noqa: E402

CKPT_DIR = REPO / "pipeline" / "checkpoints" / "sam-3d-body-dinov3"
OUT_DIR = REPO / "web" / "public" / "sessions"
SCHEMA_VERSION = "1.0"


# ─────────────────────────── person detection ────────────────────────────────
def build_detector(device: str = "cuda"):
    from torchvision.models.detection import (
        FasterRCNN_ResNet50_FPN_Weights,
        fasterrcnn_resnet50_fpn,
    )

    weights = FasterRCNN_ResNet50_FPN_Weights.DEFAULT
    model = fasterrcnn_resnet50_fpn(weights=weights).to(device).eval()
    return model


@torch.no_grad()
def detect_person(model, img_rgb: np.ndarray, device: str, score_thr: float = 0.7):
    """Return the most plausible pitcher box [x1,y1,x2,y2], or None.

    Selection rule: among confident person detections, maximise area weighted by
    closeness to frame centre. The Scherzer clip has a second player near the
    outfield wall that must never win.
    """
    h, w = img_rgb.shape[:2]
    t = torch.from_numpy(img_rgb).permute(2, 0, 1).float().div(255).to(device)
    out = model([t])[0]

    best, best_score = None, -1.0
    cx0, cy0 = w / 2, h / 2
    for box, label, score in zip(out["boxes"], out["labels"], out["scores"]):
        if int(label) != 1 or float(score) < score_thr:  # COCO class 1 == person
            continue
        x1, y1, x2, y2 = [float(v) for v in box]
        area = (x2 - x1) * (y2 - y1)
        cx, cy = (x1 + x2) / 2, (y1 + y2) / 2
        dist = np.hypot(cx - cx0, cy - cy0) / np.hypot(cx0, cy0)
        rank = area * (1.0 - 0.5 * dist)
        if rank > best_score:
            best_score, best = rank, [x1, y1, x2, y2]
    return best


def smooth_boxes(boxes: list, pad: float = 0.15, win: int = 9) -> np.ndarray:
    """Fill gaps, temporally smooth, and pad the per-frame boxes."""
    arr = np.array([b if b is not None else [np.nan] * 4 for b in boxes], dtype=np.float64)

    # forward/backward fill NaNs
    for c in range(4):
        col = arr[:, c]
        idx = np.arange(len(col))
        good = ~np.isnan(col)
        if good.sum() == 0:
            raise RuntimeError("no person detected in any frame")
        arr[:, c] = np.interp(idx, idx[good], col[good])

    # moving average
    if len(arr) >= win:
        k = np.ones(win) / win
        for c in range(4):
            arr[:, c] = np.convolve(np.pad(arr[:, c], (win // 2, win // 2), mode="edge"),
                                    k, mode="valid")[: len(arr)]

    # pad outward
    cx = (arr[:, 0] + arr[:, 2]) / 2
    cy = (arr[:, 1] + arr[:, 3]) / 2
    bw = (arr[:, 2] - arr[:, 0]) * (1 + pad)
    bh = (arr[:, 3] - arr[:, 1]) * (1 + pad)
    return np.stack([cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2], axis=1)


# ─────────────────────────────── smoothing ───────────────────────────────────
def savgol_smooth(traj: np.ndarray, window: int = 9, polyorder: int = 3) -> np.ndarray:
    """Savitzky-Golay over (T, J, 3). Preserves peak magnitude/timing far better than a
    moving average - critical because we measure maxima (e.g. MER)."""
    from scipy.signal import savgol_filter

    T = traj.shape[0]
    win = min(window, T if T % 2 == 1 else T - 1)
    if win < polyorder + 2:
        return traj
    return savgol_filter(traj, window_length=win, polyorder=polyorder, axis=0)


# ──────────────────────────────── main ───────────────────────────────────────
def run_clip(clip: dict, estimator, detector, device: str, stride: int,
             on_progress=None) -> dict:
    src = REPO / clip["source"]
    if not src.exists():
        raise FileNotFoundError(src)

    cap = cv2.VideoCapture(str(src))
    fps = clip["videoFps"]
    f0 = int(round(clip["startSec"] * fps))
    f1 = int(round(clip["endSec"] * fps))
    cap.set(cv2.CAP_PROP_POS_FRAMES, f0)

    print(f"\n=== {clip['sessionId']} ===")
    print(f"    {src.name}")
    print(f"    frames {f0}..{f1} @ {fps} fps  (stride {stride})")

    raw_frames, boxes, kp2ds, kp3ds, focals = [], [], [], [], []
    t_start = time.time()
    idx = f0
    n_read = 0
    while idx < f1:
        ok, frame_bgr = cap.read()
        if not ok:
            break
        if (idx - f0) % stride == 0:
            rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
            box = detect_person(detector, rgb, device)
            boxes.append(box)
            # NOTE: store RGB. process_one_image() treats an ndarray as RGB and will
            # NOT convert it; passing BGR silently swaps channels.
            raw_frames.append((idx, rgb))
            n_read += 1
            if n_read % 50 == 0:
                print(f"    detect {n_read} frames  ({time.time() - t_start:.0f}s)")
                if on_progress:
                    on_progress("detecting", 0.4 * n_read / max(1, (f1 - f0) / stride))
        idx += 1
    cap.release()

    if not raw_frames:
        raise RuntimeError("no frames read")

    # Duplicate-frame (freeze) detection. Coaching breakdowns often hold a still frame
    # for several seconds; a frozen run silently wrecks event detection and every rate
    # metric downstream, so surface it loudly rather than analysing it.
    diffs = []
    for a, b in zip(raw_frames, raw_frames[1:]):
        ga = cv2.cvtColor(cv2.resize(a[1], (160, 160)), cv2.COLOR_RGB2GRAY).astype(np.float32)
        gb = cv2.cvtColor(cv2.resize(b[1], (160, 160)), cv2.COLOR_RGB2GRAY).astype(np.float32)
        diffs.append(float(np.abs(gb - ga).mean()))
    still = [d < 0.35 for d in diffs]
    runs, i = [], 0
    while i < len(still):
        if still[i]:
            j = i
            while j < len(still) and still[j]:
                j += 1
            if (j - i) >= max(5, int(eff_fps_guess := fps / stride * 0.5)):
                runs.append((i, j))
            i = j
        else:
            i += 1
    if runs:
        total = sum(b - a for a, b in runs)
        print(f"    !! WARNING: {len(runs)} frozen run(s), {total} frames "
              f"({total / (fps / stride):.2f}s) of duplicate video:")
        for a, b in runs:
            print(f"       frames {a}-{b} of this window")
        print("       Event detection and all rate metrics will be wrong. "
              "Adjust startSec/endSec in clips.json to exclude them.")
    print(f"    detected on {len(raw_frames)} frames in {time.time() - t_start:.0f}s")

    sboxes = smooth_boxes(boxes)

    t_start = time.time()
    for i, (fidx, frame_rgb) in enumerate(raw_frames):
        bb = sboxes[i].astype(np.float32).reshape(1, 4)
        out = estimator.process_one_image(frame_rgb, bboxes=bb, inference_type="body")
        if not out:
            kp2ds.append(kp2ds[-1] if kp2ds else np.zeros((70, 2), np.float32))
            kp3ds.append(kp3ds[-1] if kp3ds else np.zeros((70, 3), np.float32))
            focals.append(focals[-1] if focals else 1000.0)
            continue
        o = out[0]
        kp2ds.append(o["pred_keypoints_2d"])
        kp3ds.append(o["pred_keypoints_3d"])
        focals.append(float(o["focal_length"]))
        if (i + 1) % 50 == 0:
            el = time.time() - t_start
            print(f"    infer  {i + 1}/{len(raw_frames)}  ({el:.0f}s, {el / (i + 1) * 1000:.0f} ms/f)")
            if on_progress:
                on_progress("reconstructing", 0.4 + 0.55 * (i + 1) / len(raw_frames))
    print(f"    inference done in {time.time() - t_start:.0f}s")

    # map to our joint subset, then smooth
    j3d = np.stack([map_keypoints(k) for k in kp3ds])  # (T, 24, 3)
    j2d = np.stack([map_keypoints(k) for k in kp2ds])  # (T, 24, 2)
    j3d_s = savgol_smooth(j3d)
    j2d_s = savgol_smooth(j2d)

    eff_fps = fps / stride
    frames = [
        {
            "index": i,
            "sourceFrame": int(raw_frames[i][0]),
            "t": round(i / eff_fps, 5),
            "keypoints3d": [[round(float(v), 4) for v in p] for p in j3d_s[i]],
            "keypoints2d": [[round(float(v), 1) for v in p] for p in j2d_s[i]],
        }
        for i in range(len(raw_frames))
    ]

    if on_progress:
        on_progress("smoothing", 0.96)

    # ── QA overlay: project 2D keypoints back onto the source frames ──────────
    qa_dir = REPO / "pipeline" / "out"
    qa_dir.mkdir(parents=True, exist_ok=True)
    h, w = raw_frames[0][1].shape[:2]
    vw = cv2.VideoWriter(str(qa_dir / f"qa_{clip['sessionId']}.mp4"),
                         cv2.VideoWriter_fourcc(*"mp4v"), min(eff_fps_pre := fps / stride, 30), (w, h))
    for i, (_, frame_rgb) in enumerate(raw_frames):
        vis = cv2.cvtColor(frame_rgb, cv2.COLOR_RGB2BGR)
        x1, y1, x2, y2 = sboxes[i].astype(int)
        cv2.rectangle(vis, (x1, y1), (x2, y2), (255, 160, 0), 1)
        pts = j2d_s[i]
        for a, b in BONES:
            cv2.line(vis, tuple(pts[a].astype(int)), tuple(pts[b].astype(int)), (0, 220, 255), 2)
        for p in pts:
            cv2.circle(vis, tuple(p.astype(int)), 3, (0, 255, 60), -1)
        vw.write(vis)
    vw.release()
    print(f"    QA overlay -> pipeline/out/qa_{clip['sessionId']}.mp4")

    return {
        "schemaVersion": SCHEMA_VERSION,
        "sessionId": clip["sessionId"],
        "source": {
            "label": clip["label"],
            "view": clip.get("view", ""),
            "frameCount": len(frames),
            "resolution": [w, h],
            "attribution": "Third-party footage, development use only. See ATTRIBUTION.md.",
            "videoFile": clip.get("videoFile"),
        },
        "subject": {
            "handedness": clip.get("handedness", "right"),
            "heightMeters": None,
            "heightSource": "unknown",
        },
        "capture": {
            "model": "sam-3d-body-dinov3",
            "cameraFrame": True,
            "focalLengthEstimated": True,
            "focalLengthMedian": round(float(np.median(focals)), 2),
            "smoothing": {"method": "savgol", "window": 9, "polyorder": 3},
        },
        "timebase": {
            "videoFps": eff_fps,
            "slowMotion": bool(clip.get("slowMotion", False)),
            "realTimeScale": clip.get("realTimeScale"),
            "scaleSource": "unknown" if clip.get("realTimeScale") is None else "user",
        },
        "joints": JOINT_NAMES,
        "bones": [list(b) for b in BONES],
        "frames": frames,
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("sessionId", nargs="?", help="run one clip by id (default: all)")
    ap.add_argument("--stride", type=int, default=1, help="process every Nth frame")
    args = ap.parse_args()

    clips = json.loads((REPO / "pipeline" / "clips.json").read_text())["clips"]
    if args.sessionId:
        clips = [c for c in clips if c["sessionId"] == args.sessionId]
        if not clips:
            raise SystemExit(f"no clip with sessionId={args.sessionId}")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"device: {device}")
    print("loading SAM 3D Body …")
    model, cfg = load_sam_3d_body(
        checkpoint_path=str(CKPT_DIR / "model.ckpt"),
        mhr_path=str(CKPT_DIR / "assets" / "mhr_model.pt"),
        device=device,
    )
    estimator = SAM3DBodyEstimator(model, cfg, None, None, None)
    print("loading person detector …")
    detector = build_detector(device)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    index = []
    for clip in clips:
        session = run_clip(clip, estimator, detector, device, args.stride)
        out = OUT_DIR / f"{clip['sessionId']}.json"
        out.write_text(json.dumps(session, separators=(",", ":")))
        size_kb = out.stat().st_size / 1024
        print(f"    -> {out.relative_to(REPO)}  ({size_kb:.0f} KB, {session['source']['frameCount']} frames)")
        index.append({
            "sessionId": clip["sessionId"],
            "label": clip["label"],
            "handedness": clip.get("handedness", "right"),
            "view": clip.get("view", ""),
            "frameCount": session["source"]["frameCount"],
            "file": f"{clip['sessionId']}.json",
        })

    # merge into the session index so the web app can enumerate what's available
    idx_path = OUT_DIR / "index.json"
    existing = json.loads(idx_path.read_text())["sessions"] if idx_path.exists() else []
    by_id = {s["sessionId"]: s for s in existing}
    by_id.update({s["sessionId"]: s for s in index})
    idx_path.write_text(json.dumps({"sessions": list(by_id.values())}, indent=2))
    print(f"\nwrote {idx_path.relative_to(REPO)}  ({len(by_id)} sessions)")


if __name__ == "__main__":
    main()
