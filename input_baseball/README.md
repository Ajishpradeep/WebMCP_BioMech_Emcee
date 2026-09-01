# Licensed pitching candidates

**Final judge-facing evidence set:** exactly `delivery-02` and `delivery-03`. The remaining files in
this directory are historical/local candidate records; they are not public-build inputs and must not
appear in screenshots, demo footage, or submission claims.

## Selected clear demo candidate — Pexels 5182923

Downloaded 2026-09-01 from Pexels' own download endpoint:

- Source page: <https://www.pexels.com/video/baseball-player-pitching-a-baseball-5182923/>
- Creator: Tima Miroshnichenko
- License: <https://www.pexels.com/license/>
- Untouched source: `pexels_5182923_fullbody_pitch_uhd.mp4`
- Upload-ready derivative: `../pexels_5182923_demo_pitch_cut.mp4` (0.00–6.75 s,
  pitch through settled follow-through; audio omitted)
- Source properties: 2160×3840, 25 fps, 11.52 s, 288 frames
- Demo-cut properties: 2160×3840, 25 fps, 6.76 s, 169 frames

Visual preflight: a single large subject remains fully visible from the initial set through leg lift,
stride, release, and follow-through. There is no netting, competing person, camera cut, or moving
background. Both files decoded end-to-end and produced no >=0.5-second freeze report under
`freezedetect=n=-50dB:d=0.5`.

This source is integrated as cleared session `delivery-02`. Its main capture limitation is 25 fps,
so event-frame timing and fast joint rotation retain appropriately bounded confidence. Person
detection, SAM 3D Body reconstruction, overlay review, event review, numerical gates, synchronized
video delivery, and the public rights card have passed.

The Pexels license permits free use and modification in apps and online media and does not require
attribution. It prohibits selling unaltered copies, redistribution through another stock platform,
and implying endorsement. Preserve the source/creator record and avoid athlete or uniform
endorsement claims even though attribution is not mandatory.

```text
27c36e8393dcc2ab1ac4cd6f1bc030bb335215ab19248f735108406e9099a90c  pexels_5182923_fullbody_pitch_uhd.mp4
a5c1c447c3e8bb86d9d3ca1ac0ed10cfa68a272493ef0f0a66461a72b751500d  ../pexels_5182923_demo_pitch_cut.mp4
```

## Selected cleared Wikimedia session — Hyun-jin Ryu pitching motion

The owner reopened this candidate on 2026-09-01 and supplied the upload-ready derivative:

- Source page: <https://commons.wikimedia.org/wiki/File:Hyun-jin_Ryu_Pitching_motion.webm>
- Title: `Hyun-jin Ryu Pitching motion`
- Creator: Johnmaxmena2; source is identified as the creator's own work
- Original capture date: 8 April 2019
- License: Creative Commons Attribution-ShareAlike 4.0 International
  (<https://creativecommons.org/licenses/by-sa/4.0/>)
- Original Commons file: 1920×1080 VP8/Vorbis WebM, approximately 15 seconds
- Local derivative: `hyun_jin_ryu_pitching_cc_by_sa_4.mp4`
- Derivative properties: 1920×1080 H.264/AAC, 29.970 fps, 8.25 seconds, 246 frames
- Changes from the Commons source: trimmed to the retained pitching sequence and transcoded to MP4
  for browser delivery
- SHA-256: `5b0a2169e9d16788bdde2ebe74719ccdd81e11a48e853177b26fa25a9ae0afef`

The derivative is distributed under CC BY-SA 4.0. Any copy must preserve appropriate creator
credit, a source link, the license link, the modification notice, and the ShareAlike terms. Credit
must not imply that the creator, depicted athlete, team, or Wikimedia endorses Biomech Emcee.

Pipeline result: the exact uploaded bytes completed all 246 frames with person detection and SAM 3D
Body. The QA overlay keeps the left-handed pitcher tracked through leg lift, foot contact, arm
cocking, release, and follow-through despite protective netting. Automatic event candidates are FC
f95 (medium confidence), MER f120 (low; human review required), and ball release f127 (high). The
normal-rate 29.97 fps source undersamples the fastest arm motion, so rate-derived observations remain
medium-confidence. The cleared public session id is `delivery-03`.

## Remaining Wikimedia candidate set

Downloaded 2026-09-01 from the original Wikimedia Commons file URLs. These are local pipeline
candidates, not approved final evidence. Keep the source page, creator, and license attached to any
derivative. Passing a license check does not replace reconstruction, event, scientific, trademark,
or publicity-rights review.

| Local file | Creator/source | License | Source page | Technical preflight |
|---|---|---|---|---|
| `gant_windup_cc0.webm` | D. Benjamin Miller, own work | CC0 1.0 | <https://commons.wikimedia.org/wiki/File:Gant_Windup.webm> | 1920×1080, 23.976 fps, 14.223 s; full body, small subject |
| `steven_brault_delivery_cc0.webm` | D. Benjamin Miller, own work | CC0 1.0 | <https://commons.wikimedia.org/wiki/File:Steven_Brault%27s_delivery.webm> | 400×300, 23.976 fps, 3.837 s; complete delivery, low resolution and net obstruction |
| `tim_peterson_delivery_cc0.webm` | D. Benjamin Miller, own work | CC0 1.0 | <https://commons.wikimedia.org/wiki/File:Tim_Peterson%27s_delivery.webm> | 600×450, 23.976 fps, 7.007 s; complete delivery, small subject and net obstruction |
| `walter_johnson_pitching_public_domain.webm` | Unattributed archival film | Public domain | <https://commons.wikimedia.org/wiki/File:Walter_Johnson_pitching.webm> | 640×360, 29.97 fps, 61.294 s; multiple shots/cuts and historical image noise |
| `kenta_maeda_pitching_cc_by_sa_3.ogv` | Nesnad, own work | CC BY-SA 3.0 | <https://commons.wikimedia.org/wiki/File:Hiroshima_toyo_carp_2010_number_18.ogv> | 1280×720, 24 fps, 9.708 s; large full-body subject, vignette/stabilization |
| `kyle_harrison_delivery_cc_by_4.mpg` | HRVdriveblue4449, own work | CC BY 4.0 | <https://commons.wikimedia.org/wiki/File:Kyle_Harrison_vs._Rockies_2023.mpg> | 1920×1080, 30 fps, 5.688 s; one clean rear-view delivery, small subject |

All seven files decoded end-to-end with ffmpeg and produced no ≥0.5-second freeze report under a
`freezedetect=n=-50dB:d=0.5` preflight.

## SHA-256

```text
1bb8c10c4eeacd02ee81f74d579bb0787406aa9d8a28f40e9355d5bc91b37611  gant_windup_cc0.webm
8b0195c3539b9d944ef48fe3f395c008381d20febbfc5dc0e2c7e58d1f82dc8c  steven_brault_delivery_cc0.webm
5e1ce62973e049400e1e511fe97b6fe603c2941ab0a4ba6e3ee9e1a5da00cc59  tim_peterson_delivery_cc0.webm
8aeb1c1546619d0a3a2459a35e126a0bd71ecc2dbe35931299dc8a26736b4f96  walter_johnson_pitching_public_domain.webm
2c9b622cb3cde28f83812bb6cdbf0f96225d2b6409f1d43e2d8f961dfa4378ee  kenta_maeda_pitching_cc_by_sa_3.ogv
23513a396e7fb4b5afb3ebff3d7ad672bbac140feb144207ac98b6612c34e31e  kyle_harrison_delivery_cc_by_4.mpg
```

The owner rejected these remaining candidates for demo use on 2026-09-01 because they are too
distant, obstructed, low-resolution, historically noisy, or visually distracting. Do not spend
pipeline time on them unless the owner explicitly reopens a fallback decision. Preserve the
applicable attribution/share-alike notice for any CC BY or CC BY-SA derivative that is reconsidered.
