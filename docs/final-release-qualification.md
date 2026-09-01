# Final release qualification

**Qualification date:** 2026-09-01  
**Scope:** two-session evidence set, descriptive comparison, non-expert evidence presentation, and
the release gates that precede screenshots/video/submission.

## Official challenge frame

Live Devpost data was refreshed on 2026-09-01. Submissions close **2026-09-03 20:00 UTC
(1:00 PM Pacific)**; judging runs 2026-09-04 17:00 UTC through 2026-09-22 00:00 UTC. The four
criteria are WebMCP Leverage, Execution, Potential Impact, and Creativity & Ambition, each on the
same five-point judging scale. Required deliverables include an accessible live URL, the requested
WebMCP/experience description, a public narrated YouTube demo under three minutes, and a public
source repository with a detectable open-source license. The live form also asks for submitter/app
status, countries of residence, tested agents/clients, AI tools used, learning value, live URL,
testing instructions, and repository URL.

The 2026-08-30 host announcement adds the practical freeze boundary: project, video, repository,
team, and live site must not change after the deadline. Official Devpost text overrides this local
summary.

## Final evidence set

| Contract | `delivery-02` | `delivery-03` |
|---|---|---|
| Source | Pexels 5182923, *Baseball Player Pitching a Baseball*, Tima Miroshnichenko | Wikimedia Commons, *Hyun-jin Ryu Pitching motion*, Johnmaxmena2 |
| Redistribution basis | Pexels License | CC BY-SA 4.0 derivative; creator/source/license/change/ShareAlike notices required |
| Public synchronized media | 2160×3840 H.264, 25 fps, 11.52 s, 288/288 decoded frames | 1920×1080 H.264, 29.97 fps, 8.25 s container duration, 246/246 decoded frames |
| Public media SHA-256 | `27c36e8393dcc2ab1ac4cd6f1bc030bb335215ab19248f735108406e9099a90c` | `5b0a2169e9d16788bdde2ebe74719ccdd81e11a48e853177b26fa25a9ae0afef` |
| Analysed contract | 288 reconstructed frames; source frames 0–287 | 246 reconstructed frames; source frames 0–245 |
| Reconstruction QA | Full body retained; overlay stays on the intended subject throughout | Full body retained; overlay stays on the intended left-handed pitcher despite netting/background players |
| Freeze/duplicate gate | No `freezedetect` run ≥0.5 s | No `freezedetect` run ≥0.5 s |
| FC → MER → BR | f52 medium → f81 low/review → f88 high | f95 medium → f120 low/review → f127 high |
| Timebase | Marked normal-rate; `realTimeScale: 1`, `scaleSource: estimated`; 25 fps bounds rates to medium confidence | Marked normal-rate; `realTimeScale: 1`, `scaleSource: estimated`; 29.97 fps bounds rates to medium confidence |
| Partial sequence | thorax → pelvis → upper arm → forearm; medium quality; non-PDS is not a fault | pelvis → thorax → upper arm → forearm; medium quality; PDS is not proof of quality |

Both sessions pass the numerical contract: every series has >95% finite coverage, direct flexion
angles remain within anatomical bounds, events are strictly ordered, exploratory constructs receive
no population ranking, and sequence output remains explicitly partial. MER is an unvalidated
upper-arm axial-rotation event proxy and remains low-confidence until a human reviews the frame.
The source capture and markerless/camera-frame limitations prohibit diagnostic, causal, kinetic,
performance, or coaching conclusions.

The public session directory contains exactly `index.json` and the two JSON/MP4 pairs. Git tracks
no other image/video evidence asset. Historical QA overlays and upload-recovery artefacts remain
git-ignored pipeline records and are neither public-build inputs nor judge-facing media.

## Revived Wikimedia candidate decision

The Wikimedia set was originally rejected because its candidates were variously distant,
obstructed, low-resolution, historically noisy, or visually distracting. The Ryu source specifically
contains protective netting and background players. Licensing did not resolve those concerns.

The retained 8.25-second window was accepted only after the exact derivative decoded without a
freeze, person detection and SAM 3D Body completed all 246 frames, and the QA overlay showed coherent
full-body tracking across leg lift, foot contact, arm cocking, release, and follow-through. Netting
and background activity remain visible limitations, but no longer constitute a material tracking or
event-coverage failure for evidence review. The session adds a genuine second movement review; it
is not retained merely to keep comparison operational.

## Comparison release contract

The sessions use the same application pipeline, metric constructs, event detector, and human-review
contract. They do **not** establish the same athlete, calibrated camera, controlled capture protocol,
handedness, viewpoint, or matched frame rate. Comparison is therefore **descriptive only**.

`compare_pitches` now returns explicit compatibility fields and an unavailable ranking with the
reason that “better” and “worse” are unsupported. A regression test runs the actual bundled pair,
not a cloned fixture, and enforces the output budget. Supported output may name the largest observed
angle differences and their confidence; it may not infer improvement, regression, performance,
causality, or coaching outcome.

## Non-expert evidence-presentation decision

1. **Meaningful weakness:** yes. A focused joint previously became a larger colored dot plus a
   numeric label; a novice could not see which landmarks defined the number.
2. **Judge visibility:** high in the natural “show me the elbow measurement” flow, because the
   agent's navigation was legible but its anatomical evidence was not.
3. **Exposing interaction:** `seek_to_event` followed by `focus_joint("throwing_elbow")`.
4. **Semantic framing:** the current automatic anatomical plane, whole-body context, manual orbit,
   focus selector, and shared-view state are sufficient for this release. Semantic zoom was rejected
   as unnecessary release risk and a possible source of disorientation.
5. **Visual metric explanation:** useful for direct three-landmark flexion geometry only.
6. **Architecture:** viewer behavior driven by existing focus/overlay state; no WebMCP schema change.
7. **Smallest useful solution:** application-owned shoulder→elbow→wrist and hip→knee→ankle segment
   emphasis, a straight-extension reference, and the supported flexion arc while the existing label
   supplies the metric/value.
8. **Explicit non-goals:** no generic drawing canvas, arrows, pixel coordinates, pan/zoom API, new
   camera tool, force/momentum/energy graphics, sequence arrows, causal markers, or new WebMCP tool.
9. **Revalidation risk:** low-to-moderate viewer risk; no registration or input-schema risk. It still
   requires geometry tests, full suite/typecheck/build, affected-flow visual checks, and a deployed
   `focus_joint` smoke test.
10. **Decision:** implement before submission. The visible payoff is material, bounded, and directly
    supports the challenge thesis that an agent can show its evidence inside the shared application.

The first visual pass added a redundant projected label; a 1600×1000 browser check showed it
colliding with the existing angle readout. That label was removed. The retained release behavior is
the segment/reference/arc geometry plus the existing readout, preserving a single clear value.

## Human-facing acceptance case

A non-expert asks about elbow flexion at MER. The agent uses the existing tools to navigate to MER
and focus the throwing elbow. The viewer retains the body and synchronized source context, selects
the appropriate camera plane, emphasizes the two reconstructed segments, shows the flexion arc from
the straight-extension reference to the forearm, and keeps the existing measured value visible.
Confidence and MER review requirements remain in the evidence panel/tool output; the human can orbit,
change focus, scrub, correct the event, or return to the normal view. No geometry or claim is supplied
by the language model.

## Freeze ledger

- [x] Two documented redistribution bases and public rights cards.
- [x] Exact media decode, hash, freeze, reconstruction, event-order, series, and sequence audits.
- [x] Revived-session rejection reason found and explicitly accepted after technical QA.
- [x] Real-pair descriptive comparison regression and explicit ranking refusal.
- [x] Viewer-only supported flexion geometry selected; no WebMCP contract expansion.
- [x] Full suite (89 tests), typecheck, production build, and final repository/build asset audit.
- [ ] Atomic release commit and exact Cloud Run deployment.
- [ ] Post-deploy WebMCP registration/runtime/visible-focus smoke on that revision.
- [ ] Owner-observed ChatGPT natural-language repeat and two comparison prompts on that revision.
- [ ] Clean judge-experience pass, then engineering freeze.
