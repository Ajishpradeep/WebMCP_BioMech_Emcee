"""Task 2 verification gate: run SAM 3D Body end-to-end on a single image.

Loads the model from local checkpoints (no detectron2, no MoGe), runs inference on
one frame with an explicit full-image bbox, and dumps the output contract so we can
freeze the session.json schema (Task 6) against reality rather than the README.

Usage:
    .venv/bin/python pipeline/smoke_test.py pipeline/data/frames/smoke_scherzer.png
"""

import sys
from pathlib import Path

import cv2
import numpy as np

REPO = Path(__file__).resolve().parent.parent
VENDOR = REPO / "pipeline" / "vendor" / "sam-3d-body"
CKPT_DIR = REPO / "pipeline" / "checkpoints" / "sam-3d-body-dinov3"

sys.path.insert(0, str(VENDOR))

from sam_3d_body import SAM3DBodyEstimator, load_sam_3d_body  # noqa: E402
from sam_3d_body.metadata.mhr70 import mhr_names  # noqa: E402


def main(image_path: str) -> None:
    print(f"[1/4] loading model from {CKPT_DIR}")
    model, model_cfg = load_sam_3d_body(
        checkpoint_path=str(CKPT_DIR / "model.ckpt"),
        mhr_path=str(CKPT_DIR / "assets" / "mhr_model.pt"),
        device="cuda",
    )

    print("[2/4] building estimator (no detector / segmentor / fov estimator)")
    estimator = SAM3DBodyEstimator(
        sam_3d_body_model=model,
        model_cfg=model_cfg,
        human_detector=None,
        human_segmentor=None,
        fov_estimator=None,
    )

    print(f"[3/4] running inference on {image_path}")
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        raise SystemExit(f"could not read {image_path}")
    h, w = img_bgr.shape[:2]
    print(f"      image {w}x{h}")

    # No detector: pass the full image as the bbox. Task 4 replaces this with a
    # real per-frame person box.
    bboxes = np.array([[0, 0, w, h]], dtype=np.float32)
    outputs = estimator.process_one_image(
        img_bgr, bboxes=bboxes, inference_type="body"
    )

    print(f"[4/4] got {len(outputs)} person(s)")
    if not outputs:
        raise SystemExit("no output — inference produced nothing")

    o = outputs[0]
    print("\n=== OUTPUT CONTRACT ===")
    for k, v in o.items():
        if isinstance(v, np.ndarray):
            print(f"  {k:22s} ndarray shape={str(v.shape):20s} dtype={v.dtype}")
        elif v is None:
            print(f"  {k:22s} None")
        else:
            print(f"  {k:22s} {type(v).__name__} = {v}")

    kp3d = o["pred_keypoints_3d"]
    kp2d = o["pred_keypoints_2d"]
    print(f"\n=== KEYPOINTS ===")
    print(f"  mhr_names entries : {len(mhr_names)}")
    print(f"  pred_keypoints_3d : {kp3d.shape}")
    print(f"  pred_keypoints_2d : {kp2d.shape}")
    print(f"  focal_length      : {o['focal_length']}")
    print(f"  pred_cam_t        : {o['pred_cam_t']}")

    # Landmarks we actually need for pitching biomechanics (mhr70 indices).
    for name, idx in [
        ("nose", 0), ("left-shoulder", 5), ("right-shoulder", 6),
        ("left-elbow", 7), ("right-elbow", 8), ("left-hip", 9), ("right-hip", 10),
        ("left-knee", 11), ("right-knee", 12), ("left-ankle", 13), ("right-ankle", 14),
        ("right-wrist", 41), ("left-wrist", 62),
        ("left-acromion", 67), ("right-acromion", 68), ("neck", 69),
    ]:
        assert mhr_names[idx] == name, f"index drift: {idx} is {mhr_names[idx]} not {name}"
        print(f"  [{idx:2d}] {name:16s} 3d={np.round(kp3d[idx], 4)}  2d={np.round(kp2d[idx], 1)}")

    # Sanity overlay: project 2D keypoints back onto the frame.
    vis = img_bgr.copy()
    for i in range(kp2d.shape[0]):
        x, y = int(kp2d[i, 0]), int(kp2d[i, 1])
        cv2.circle(vis, (x, y), 3, (0, 255, 0), -1)
    for a, b in [(5, 7), (7, 62), (6, 8), (8, 41), (5, 6), (9, 10),
                 (5, 9), (6, 10), (9, 11), (11, 13), (10, 12), (12, 14)]:
        cv2.line(vis, (int(kp2d[a, 0]), int(kp2d[a, 1])),
                 (int(kp2d[b, 0]), int(kp2d[b, 1])), (0, 200, 255), 2)
    out_path = REPO / "pipeline" / "out" / "smoke_overlay.png"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_path), vis)
    print(f"\nwrote sanity overlay -> {out_path}")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "pipeline/data/frames/smoke_scherzer.png")
