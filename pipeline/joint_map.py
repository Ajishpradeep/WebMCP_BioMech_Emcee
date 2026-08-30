"""MHR-70 -> PitchLab biomechanical joint subset.

SAM 3D Body returns 70 keypoints in `mhr70` order (see
pipeline/vendor/sam-3d-body/sam_3d_body/metadata/mhr70.py). We keep a 24-joint subset
relevant to pitching biomechanics and drop the 40 finger keypoints.

⚠️ JOINT_NAMES is the frozen contract. web/src/biomech/joints.ts MUST mirror it exactly,
in this order. See .claude/steering/tech.md §4.
"""

from __future__ import annotations

import numpy as np

# --- indices into the raw 70-keypoint MHR array -----------------------------
MHR = {
    "nose": 0,
    "l_shoulder": 5, "r_shoulder": 6,
    "l_elbow": 7, "r_elbow": 8,
    "l_hip": 9, "r_hip": 10,
    "l_knee": 11, "r_knee": 12,
    "l_ankle": 13, "r_ankle": 14,
    "l_big_toe": 15, "l_heel": 17,
    "r_big_toe": 18, "r_heel": 20,
    "r_wrist": 41, "l_wrist": 62,
    "l_olecranon": 63, "r_olecranon": 64,
    "l_cubital_fossa": 65, "r_cubital_fossa": 66,
    "l_acromion": 67, "r_acromion": 68,
    "neck": 69,
}

# --- the frozen output contract ---------------------------------------------
# Order matters: session.json `keypoints3d` rows are index-aligned to this list.
JOINT_NAMES: list[str] = [
    # derived (midpoints) — no direct MHR keypoint exists for these
    "pelvis", "thorax",
    # axial
    "neck", "nose",
    # upper limb
    "l_acromion", "l_elbow", "l_wrist",
    "r_acromion", "r_elbow", "r_wrist",
    "l_olecranon", "r_olecranon",
    "l_cubital_fossa", "r_cubital_fossa",
    # lower limb
    "l_hip", "l_knee", "l_ankle", "l_heel", "l_big_toe",
    "r_hip", "r_knee", "r_ankle", "r_heel", "r_big_toe",
]

# Bones for rendering (indices into JOINT_NAMES). Kept here so the pipeline and the
# web viewer cannot disagree about the skeleton topology.
def _i(name: str) -> int:
    return JOINT_NAMES.index(name)


BONES: list[tuple[int, int]] = [
    (_i("pelvis"), _i("thorax")), (_i("thorax"), _i("neck")), (_i("neck"), _i("nose")),
    (_i("thorax"), _i("l_acromion")), (_i("thorax"), _i("r_acromion")),
    (_i("l_acromion"), _i("l_elbow")), (_i("l_elbow"), _i("l_wrist")),
    (_i("r_acromion"), _i("r_elbow")), (_i("r_elbow"), _i("r_wrist")),
    (_i("pelvis"), _i("l_hip")), (_i("pelvis"), _i("r_hip")),
    (_i("l_hip"), _i("l_knee")), (_i("l_knee"), _i("l_ankle")),
    (_i("l_ankle"), _i("l_heel")), (_i("l_ankle"), _i("l_big_toe")),
    (_i("r_hip"), _i("r_knee")), (_i("r_knee"), _i("r_ankle")),
    (_i("r_ankle"), _i("r_heel")), (_i("r_ankle"), _i("r_big_toe")),
]


def map_keypoints(kp: np.ndarray) -> np.ndarray:
    """(70, D) MHR keypoints -> (24, D) PitchLab joints. Works for 2D or 3D.

    `pelvis` and `thorax` are derived as midpoints; every other joint is a direct copy.
    """
    assert kp.shape[0] == 70, f"expected 70 MHR keypoints, got {kp.shape[0]}"
    d = kp.shape[1]
    out = np.zeros((len(JOINT_NAMES), d), dtype=np.float32)
    for i, name in enumerate(JOINT_NAMES):
        if name == "pelvis":
            out[i] = (kp[MHR["l_hip"]] + kp[MHR["r_hip"]]) / 2.0
        elif name == "thorax":
            out[i] = (kp[MHR["l_acromion"]] + kp[MHR["r_acromion"]]) / 2.0
        else:
            out[i] = kp[MHR[name]]
    return out
