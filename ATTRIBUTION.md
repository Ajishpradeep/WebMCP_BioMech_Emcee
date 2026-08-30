# Attribution & Licensing

## Models

### SAM 3D Body — Meta (Superintelligence Labs)

- Checkpoint: [`facebook/sam-3d-body-dinov3`](https://huggingface.co/facebook/sam-3d-body-dinov3) (DINOv3-H+ backbone)
- Code: [`facebookresearch/sam-3d-body`](https://github.com/facebookresearch/sam-3d-body) @ `b5c765a`
- Rig: [Momentum Human Rig (MHR)](https://github.com/facebookresearch/MHR)
- **License: [SAM License](https://huggingface.co/facebook/sam-3d-body-dinov3/blob/main/LICENSE)** — *not* Apache/MIT.
  Access is gated; you must request approval on Hugging Face.

> ⚠️ **Model weights are NOT redistributed in this repository.** `pipeline/checkpoints/` and
> `pipeline/vendor/` are git-ignored. Reproduce them with `pipeline/setup.sh` after obtaining your
> own access approval. PitchLab's own code is MIT; Meta's weights remain under Meta's terms.

**Citation:**

```bibtex
@article{yang2025sam3dbody,
  title={SAM 3D Body: Robust Full-Body Human Mesh Recovery},
  author={Yang, Xitong and Kukreja, Devansh and Pinkus, Don and Sagar, Anushka and Fan, Taosha
          and Park, Jinhyung and Shin, Soyong and Cao, Jinkun and Liu, Jiawei and Ugrinovic, Nicolas
          and Feiszli, Matt and Malik, Jitendra and Dollar, Piotr and Kitani, Kris},
  journal={arXiv preprint},
  year={2025}
}
```

### Person detection

`torchvision` Faster R-CNN (COCO-pretrained), BSD-3-Clause — bundled with PyTorch.

> We deliberately do **not** use detectron2 (fragile build, and the vendored code path is optional
> once bboxes are supplied) or Ultralytics YOLO (AGPL-3.0, incompatible with shipping this repo
> under MIT).

---

## Source footage

> ### ⚠️ Unresolved licensing — read before publishing
>
> The clips in `input_baseball/` are **third-party MLB/broadcast-derived videos** obtained from
> YouTube. They are used here **only as local development input** and are **excluded from git**
> (see `.gitignore`). They are **not** cleared for redistribution.
>
> `.claude/steering/tech.md` §7 says "no scraped broadcast footage," and strictly these clips
> violate that rule. The pragmatic position taken for the hackathon window:
>
> | Artifact | Ships publicly? | Rationale |
> |---|---|---|
> | Source `.mp4` files | ❌ **No** — git-ignored | Not ours to redistribute |
> | Derived `session.json` (3D joint coordinates) | ✅ Yes | Numerical measurements derived from observation, not a copy of the work |
> | Rendered 2D overlays on source frames | ❌ No | Contains the source imagery |
> | 3D skeleton renders (no source imagery) | ✅ Yes | Contains no copyrighted footage |
>
> **Before submission, do one of:**
> 1. **Self-record** a pitch (best — fully clean, and removes the question entirely), or
> 2. Ship only the derived `session.json` + 3D skeleton view, with **no source video** in the repo
>    or the demo video, or
> 3. Source a Creative Commons / public-domain pitching clip and re-run the pipeline.
>
> Option 2 is already what the architecture does by default — the web app renders the 3D
> reconstruction, not the video. **Do not add a video-playback pane without resolving this.**

### Clips currently used for development

| sessionId | Subject | Source file | Res / fps |
|---|---|---|---|
| `scherzer-delivery-01` | Max Scherzer | *Max Scherzer Ground Force Application — ROBBY ROWLAND BREAKDOWNS* | 720×720 @ 60 fps |
| `skenes-delivery-01` | Paul Skenes | *Paul Skenes Slow Motion Pitching Mechanics …* | 1920×1080 @ 29.97 fps |

Manifest: [`pipeline/clips.json`](pipeline/clips.json)

> **Both clips are slow-motion recordings at an unknown slowdown factor.** This is recorded as
> `slowMotion: true` / `realTimeScale: null` in the manifest and carried into `session.json`.
> Consequence: kinematic-sequence **order** and **normalized timing** remain valid, but **absolute
> angular velocities in °/s are not derivable** and are reported as `unavailable`. See
> `.claude/steering/tech.md` §3.2.

---

## Scientific references

Reference ranges in `web/src/biomech/reference.ts` are drawn from:

- Christoffer DJ, Melugin HP, Cherny CE. **A Clinician's Guide to Analysis of the Pitching Motion.**
  *Curr Rev Musculoskelet Med.* 2019;12(2):98–104. [doi:10.1007/s12178-019-09556-4](https://doi.org/10.1007/s12178-019-09556-4)
- Diffendaffer AZ, Bagwell MS, Fleisig GS, et al. **The Clinician's Guide to Baseball Pitching
  Biomechanics.** *Sports Health.* 2023;15(2):274–281. [doi:10.1177/19417381221078537](https://doi.org/10.1177/19417381221078537)
- **Kinematic sequence patterns in the overhead baseball pitch.** *Sports Biomechanics.* 2020;19(5).
  [PMID 30213227](https://pubmed.ncbi.nlm.nih.gov/30213227/)

Measurement-uncertainty framing (markerless vs marker-based agreement, RMSD 6.3–23.0° in sports
settings, weakest on internal/external rotation) is summarized in `SPEC.md` §6.
