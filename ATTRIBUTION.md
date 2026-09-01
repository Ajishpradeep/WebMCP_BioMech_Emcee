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

Both bundled sessions use sources with documented redistribution terms. Each public 2D reference
has a session-level information card with creator, source, license, modification notice, and
non-endorsement language. The source licenses apply to their respective video assets and do not
replace the repository's MIT code license or Meta's separate model terms.

### Final bundled evidence sessions

| sessionId | Subject | Source file | Res / fps | Rights state |
|---|---|---|---|---|
| `delivery-02` | Anonymized in product UI | Pexels 5182923 full-body field view | 2160×3840 @ 25 fps | Pexels License; QA passed |
| `delivery-03` | Hyun-jin Ryu | Wikimedia Commons center-field view | 1920×1080 @ 29.97 fps | CC BY-SA 4.0; QA passed |

Manifest: [`pipeline/clips.json`](pipeline/clips.json)

### Cleared bundled sessions

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

The full source is the synchronized public reference for `delivery-02`. Person detection, SAM 3D
Body reconstruction, overlay inspection, event review, numerical gates, and public asset delivery
passed. The 25 fps timebase still limits fast-event precision. Do not imply that the depicted person
or any uniform mark endorses Biomech Emcee.

SHA-256:

```text
27c36e8393dcc2ab1ac4cd6f1bc030bb335215ab19248f735108406e9099a90c  pexels_5182923_fullbody_pitch_uhd.mp4
a5c1c447c3e8bb86d9d3ca1ac0ed10cfa68a272493ef0f0a66461a72b751500d  pexels_5182923_demo_pitch_cut.mp4
```

#### Wikimedia Commons: Hyun-jin Ryu pitching motion

[`Hyun-jin Ryu Pitching motion`](https://commons.wikimedia.org/wiki/File:Hyun-jin_Ryu_Pitching_motion.webm)
was created and uploaded as the creator's own work by **Johnmaxmena2**. Wikimedia records the
capture date as 8 April 2019 and the license as
[Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).

- Original Commons media: 1920×1080 VP8/Vorbis WebM, approximately 15 seconds.
- Public derivative: `delivery-03.mp4`, 1920×1080 H.264/AAC, 29.970 fps, 8.25 seconds, 246 frames.
- Changes: trimmed to the retained pitching sequence and transcoded to MP4 for browser delivery.
- SHA-256 of the derivative:
  `5b0a2169e9d16788bdde2ebe74719ccdd81e11a48e853177b26fa25a9ae0afef`.
- License notice: the derivative is distributed under CC BY-SA 4.0. Preserve the creator credit,
  source link, license link, change notice, and ShareAlike terms with any redistributed copy.
- No endorsement by the creator, depicted athlete, team, or Wikimedia is stated or implied.

The exact derivative completed all 246 person-detection and SAM 3D Body frames. QA passed through
the full left-handed delivery despite protective netting. Automatic candidates are FC f95 (medium),
MER f120 (low; human review required), and ball release f127 (high). At 29.97 fps, fast arm motion is
undersampled; rate-derived observations remain medium-confidence rather than laboratory-validated.

The other locally reviewed candidates and their provenance remain recorded in
`input_baseball/README.md`; they are not bundled or judge-facing assets.

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
