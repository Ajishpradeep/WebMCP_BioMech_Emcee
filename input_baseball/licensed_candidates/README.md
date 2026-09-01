# Licensed pitching candidates

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
| `hyun_jin_ryu_pitching_cc_by_sa_4.webm` | Johnmaxmena2, own work | CC BY-SA 4.0 | <https://commons.wikimedia.org/wiki/File:Hyun-jin_Ryu_Pitching_motion.webm> | 1920×1080, 29.97 fps, 14.659 s; large full-body subject, net and background players |
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
ccafe6b9f1768d8a0266517fe3e53ed26e9fdca295c7d281a46077a3339c4296  hyun_jin_ryu_pitching_cc_by_sa_4.webm
23513a396e7fb4b5afb3ebff3d7ad672bbac140feb144207ac98b6612c34e31e  kyle_harrison_delivery_cc_by_4.mpg
```

## Recommended test order

1. `hyun_jin_ryu_pitching_cc_by_sa_4.webm` — strongest subject scale and source resolution.
2. `kenta_maeda_pitching_cc_by_sa_3.ogv` — strong subject scale; inspect stabilization/vignette.
3. `gant_windup_cc0.webm` — simplest copyright posture; test whether detection overcomes scale.
4. `kyle_harrison_delivery_cc_by_4.mpg` — clean single delivery but rear view and small subject.
5. `tim_peterson_delivery_cc0.webm` — lower-resolution fallback.

Do not spend pipeline time on the Steven Brault or Walter Johnson files unless the higher-ranked
clips fail. Before final deployment, obscure identifiable team marks where necessary and preserve
the applicable attribution/share-alike notice for every retained CC BY/CC BY-SA derivative.
