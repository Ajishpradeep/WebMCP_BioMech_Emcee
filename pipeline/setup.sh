#!/usr/bin/env bash
# Reproduce the Biomech Emcee offline pipeline environment (Tier A).
#
# Prerequisites:
#   - Linux + NVIDIA GPU with CUDA 12.x  (verified on RTX A6000, 48 GB)
#   - `uv` and `ffmpeg` on PATH
#   - A Hugging Face account with APPROVED access to facebook/sam-3d-body-dinov3
#     (gated: https://huggingface.co/facebook/sam-3d-body-dinov3) and `hf auth login` done
set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> [1/4] creating .venv (Python 3.12)"
[ -d .venv ] || uv venv --python 3.12 .venv

echo "==> [2/4] installing PyTorch (cu124) + pipeline deps"
uv pip install --python .venv/bin/python torch torchvision \
  --index-url https://download.pytorch.org/whl/cu124
uv pip install --python .venv/bin/python -r pipeline/requirements.txt

echo "==> [3/4] vendoring facebookresearch/sam-3d-body"
mkdir -p pipeline/vendor
[ -d pipeline/vendor/sam-3d-body ] || \
  git clone https://github.com/facebookresearch/sam-3d-body.git pipeline/vendor/sam-3d-body

echo "==> [4/4] downloading gated checkpoints (~2.7 GB)"
# Requires approved access. Weights are NEVER committed — see ATTRIBUTION.md.
hf download facebook/sam-3d-body-dinov3 \
  --local-dir pipeline/checkpoints/sam-3d-body-dinov3

echo
echo "Done. Verify with:"
echo "  .venv/bin/python pipeline/smoke_test.py pipeline/data/frames/smoke_scherzer.png"
