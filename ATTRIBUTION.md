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
> own access approval. Biomech Emcee's own code is MIT; Meta's weights remain under Meta's terms.

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
> YouTube. They are **not** cleared for redistribution. The owner-review build includes one
> trimmed, synchronized 2D reference file under `web/public/sessions/`. It is a **provisional review
> asset** in the current public deployment and must be replaced or removed before final submission
> unless permission is confirmed.
>
> `.claude/steering/tech.md` §7 says "no scraped broadcast footage," and strictly these clips
> violate that rule. The pragmatic position taken for the hackathon window:
>
> | Artifact | Ships publicly? | Rationale |
> |---|---|---|
> | Original source `.mp4` files | ❌ **No** — git-ignored | Not ours to redistribute |
> | Trimmed 2D reference `.mp4` file | ⚠️ **Temporary public review deployment** | Useful for synchronized review, but still uncleared and not submission-final |
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
> The synchronized pane is useful for validating whether the reconstruction matches the source,
> but it changes the rights posture. Do not treat the current deployment as final until the
> provisional file is replaced, removed, or cleared.

### Clips currently used for development

| sessionId | Subject | Source file | Res / fps |
|---|---|---|---|
| `delivery-01` | Anonymized in product UI | Elevated side-view delivery | 1920×1080 @ 29.97 fps |

Manifest: [`pipeline/clips.json`](pipeline/clips.json)

### Cleared replacement candidates — licenses verified, reconstruction pending

#### Selected clear demo candidate: Pexels 5182923

[`Baseball Player Pitching a Baseball`](https://www.pexels.com/video/baseball-player-pitching-a-baseball-5182923/)
by **Tima Miroshnichenko** was selected after visual inspection on 2026-09-01.

- License: [Pexels License](https://www.pexels.com/license/). Pexels permits free use and
  modification in websites/apps and online media; attribution is not required. It prohibits selling
  unaltered copies, redistribution on another stock platform, and implied endorsement.
- Original media: 2160×3840, 25 fps, 11.52 seconds, 288 frames.
- Evidence window: a single unobstructed pitcher remains fully visible from set through leg lift,
  stride, release, and settled follow-through. The background and camera are stable, and no other
  person competes for detection.
- Local untouched source:
  `input_baseball/licensed_candidates/pexels_5182923_fullbody_pitch_uhd.mp4`.
- Local upload-ready derivative: `input_baseball/pexels_5182923_demo_pitch_cut.mp4`, trimmed to
  0.00–6.75 seconds with audio omitted (2160×3840, 25 fps, 169 frames).
- Both files decoded end-to-end and produced no >=0.5-second `freezedetect` warning.

The source and derivative are cleared candidates, not yet final evidence. The 25 fps timebase limits
fast-event precision, and the clip still must pass person detection, SAM 3D Body reconstruction,
overlay inspection, event review, and numerical gates. Do not imply that the depicted person or any
uniform mark endorses Biomech Emcee.

SHA-256:

```text
27c36e8393dcc2ab1ac4cd6f1bc030bb335215ab19248f735108406e9099a90c  pexels_5182923_fullbody_pitch_uhd.mp4
a5c1c447c3e8bb86d9d3ca1ac0ed10cfa68a272493ef0f0a66461a72b751500d  pexels_5182923_demo_pitch_cut.mp4
```

#### Rejected Wikimedia fallback set

The first replacement candidate was
[`Gant Windup.webm`](https://commons.wikimedia.org/wiki/File:Gant_Windup.webm) from Wikimedia
Commons:

- Creator/rightsholder: **D. Benjamin Miller**; Commons records it as the creator's own work.
- License: **[CC0 1.0 public-domain dedication](https://creativecommons.org/publicdomain/zero/1.0/)**.
- Source metadata observed 2026-09-01: 1920×1080 VP8, 23.976 fps, 14.223 seconds.
- Evidence suitability: one complete delivery and the whole body remain in frame, but the athlete
  occupies a relatively small part of the image. It is a candidate, not a retained session, until
  person detection, SAM 3D Body reconstruction, overlay review, event review, and numerical gates
  pass.
- Local review copy: `/tmp/gant-windup.webm`; temporary only and not committed.

The WebMCP Challenge does not whitelist particular datasets. Its official rule is that third-party
data must be used in accordance with its terms and licensing requirements. CC0 clears the source
video's copyright license for copying, modification, and redistribution. The footage still depicts
a named professional athlete and a team uniform; CC0 does not independently grant trademark or
publicity rights. If this candidate passes reconstruction QA, remove or obscure identifiable team
marks in the judge-facing 2D reference and avoid any claim of athlete/team endorsement before it is
eligible for the final deployment.

Six more expressly licensed/public-domain candidates were downloaded on 2026-09-01. Exact source
pages, creators, license versions, media properties, SHA-256 hashes, visual preflight notes, and test
order are recorded in `input_baseball/licensed_candidates/README.md`. The local media directory is
git-ignored; provenance remains summarized here so it is not lost:

| Candidate | License | Current assessment |
|---|---|---|
| Gant windup | CC0 1.0 | Copyright-simple; complete delivery, but small subject |
| Steven Brault delivery | CC0 1.0 | Complete but only 400×300 and obstructed by netting |
| Tim Peterson delivery | CC0 1.0 | Complete 600×450 fallback; small subject/netting |
| Walter Johnson pitching | Public domain | Historical multi-shot footage; poor fit for the current single-take pipeline |
| Kenta Maeda pitching | CC BY-SA 3.0 | Large full-body subject; vignette/stabilization and marks need review |
| Hyun-jin Ryu pitching | CC BY-SA 4.0 | Best initial reconstruction candidate; large subject, net/background players |
| Kyle Harrison delivery | CC BY 4.0 | Clean single rear-view delivery; high resolution but small subject |

All seven decoded end-to-end and produced no ≥0.5-second freeze warning in the initial ffmpeg
preflight. The owner rejected this entire set for demo use on 2026-09-01 because of subject scale,
obstruction, noise, or distracting context. Do not spend pipeline time on them unless the Pexels
candidate fails and the fallback decision is explicitly reopened. CC BY and CC BY-SA derivatives
must retain their attribution and applicable share-alike notices; the repository's MIT license does
not replace those asset licenses.

Two generic Mixkit Free-License alternatives (`Baseball pitcher` #881 and `Baseball player pitching
the ball` #856) were inspected and rejected before pipeline work because both crop out the lower
legs during the delivery. Their licenses were adequate, but their evidence coverage was not.

> **The bundled clip is a slow-motion recording at an unknown slowdown factor.** This is recorded as
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
