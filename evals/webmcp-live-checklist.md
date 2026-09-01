# Live WebMCP verification checklist

**Public origin:** <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app>

This record covers the final-submission candidate deployed on 2026-09-01. A status is `PASS` only
when observed against the public origin; source inspection and mocked handlers are not live-host
proof.

## Submission-readiness ledger

| Gate | Item | Status | Evidence |
|---|---|---|---|
| LIVE WEBMCP | Deployed-origin preflight | PASS | Public HTTPS top-level page; assets and headers verified; no `Origin-Agent-Cluster: ?0` |
| LIVE WEBMCP | Chrome registration / exactly 13 tools | PASS | Native Chrome 154 discovery; exact unique set, nine reads/four writes; reload remained 13 |
| LIVE WEBMCP | All 13 runtime checks | PASS | Every tool returned native status `Completed`; correct structured refusals count as passes |
| LIVE WEBMCP | Four visible write effects | PASS | f95→f127 seek; left elbow/sagittal focus; 5→4 layers; persistent and revisitable note |
| LIVE WEBMCP | Return shape confirmed | PASS | Plain object results were preserved in native outputs; no MCP content envelope required |
| LIVE WEBMCP | ChatGPT natural-language evals | PENDING | Prior deployed revision passed; owner must repeat against revision `00011-26x` |
| EVIDENCE | Redistribution rights / provenance | PASS | Pexels License and attributed CC BY-SA 4.0 Wikimedia derivative; no unverified session ships |
| EVIDENCE | Reconstruction QA / event review / bundle | PASS | 288-frame Pexels and 246-frame Wikimedia sessions passed QA and numerical gates |
| FINAL DEPLOYMENT | Exact revision / HTTPS / cold load | PASS | Commit `7e0561d`; revision `00011-26x`; 100% traffic; current session set and assets verified |
| FINAL DEPLOYMENT | Post-deploy WebMCP critical flow | PASS | Chrome 154: inspect → navigate → focus → overlay → annotate/revisit |
| FINAL DEPLOYMENT | Judge-facing availability | BLOCKED | Recovered scale-from-zero 429 window; configure one minimum instance and retest, or explicitly accept risk |
| JUDGE EXPERIENCE | Clean-profile and human-only usability | PASS | Cleared 2D/3D sync, aspect-ratio resize, event confirmation and rights cards observed without errors |
| JUDGE EXPERIENCE | ChatGPT agent journey and refusal | PENDING | Repeat the prompt set below against the exact final candidate |
| SUBMISSION | README/repo/license consistency | PASS | Two cleared sessions and current limitations reconciled locally |
| SUBMISSION | Screenshots / narrated video / Devpost fields | PENDING | Begin only after the final ChatGPT repeat |

## FINAL SUBMISSION REVISION

- Date: 2026-09-01.
- Origin tested: `https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app/?session=delivery-03`.
- Deployed code commit: `7e0561d7ed766c5d9a6e4adaf084c561829423a0`
  (`release: qualify two-session evidence review`).
- Cloud Run revision: `pitchlab-webmcp-00011-26x`, 100% traffic; ready at
  2026-09-01 15:17:15 UTC. Image digest:
  `sha256:96c6c936058e2892d444d4aedd77edc44571e92e3e394cbf42053f343e68149e`.
- Passing native client: **Google Chrome for Testing 154.0.8035.0**, fresh ephemeral profile,
  native `--enable-features=WebMCP`; discovery and invocation used GoogleChromeLabs
  `webmcp-evals` 0.0.4's Puppeteer integration. No polyfill was injected.
- The application is a secure top-level document and `document.modelContext` exists.
- Preliminary caveat: Chrome for Testing 149.0.7827.155 did not expose
  `document.modelContext` with the same feature switch. Do not claim that exact build as tested.

## Registration and per-tool runtime record

The host exposed all intended names, descriptions, input schemas and annotations. The annotations
resolved to nine read-only and four write tools; untrusted-content hints were preserved where
specified. Reload exposed the same 13 unique tools with no stale or duplicate registration.

| Tool | Status | Output / boundary notes |
|---|---|---|
| `list_pitch_sessions` | PASS | 952 chars; both cleared sessions, active id, and analysis/quality state |
| `get_session_overview` | PASS | 1,454 chars; live frame, view, focus, layers and capture caveats |
| `get_phase_events` | PASS | 1,341 chars; FC/MER/BR; correction retest returned MER f121 with `manualOverride: true` |
| `get_kinematics_at_event` | PASS | 2,435 chars; event readings, other metrics, confidence and `meta` |
| `get_joint_angle_series` | PASS | 1,296 chars; bounded FC→BR elbow-flexion series |
| `get_kinematic_sequence` | PASS | 2,210 chars; partial order and known-timebase rate qualification |
| `get_metric_definition` | PASS | 1,511 chars; torque refusal separately passed without a fabricated value |
| `compare_to_reference` | PASS | 2,656 chars; compatible flexion constructs and bounded review plan |
| `compare_pitches` | PASS | 2,689 chars; descriptive-only result, explicit unavailable ranking and compatibility warnings |
| `seek_to_event` | PASS | 496 chars; visible f95→f127 mutation completed before result |
| `focus_joint` | PASS | 626 chars; throwing elbow resolved left; visible sagittal focus |
| `set_overlay` | PASS | 598 chars; visible layer count changed 5→4 |
| `annotate_frame` | PASS | 650 chars; f127 left-elbow note visible, persistent and revisitable |

All successful evidence responses carried `meta`; invalid or scientifically unavailable requests
returned the structured retryable/unavailable contract. All outputs stayed below the enforced
3,000-character ceiling. The host accepted the centralized plain-object `toolResult()` convention,
so no return-envelope change was made.

## Visible write and integrity checks

- `seek_to_event(ball_release)` painted f127 before the result completed (141 ms).
- `focus_joint(throwing_elbow)` selected the left elbow and sagittal camera before completion
  (422 ms). The viewer rendered application-owned shoulder→elbow→wrist segments, a straight-arm
  reference and the supported flexion arc/value while preserving whole-body and source context.
- `set_overlay(motion_trail, false)` visibly changed five active layers to four (123 ms).
- `annotate_frame` painted a labelled f127/left-elbow pin and Shared Notes entry. After seeking
  away, selecting the note returned to its evidence frame (179 ms).
- The UI changed MER to f121; the next native `get_phase_events` returned f121 with
  `manualOverride: true`.
- Invalid event input returned valid recovery values. Elbow valgus torque returned
  `available: false`, the missing force/inverse-dynamics reason, alternatives, and no number.
- No console errors, page errors or failed requests occurred during the final native run.

## Public application and evidence checks

- Public session index contains exactly `delivery-02` and `delivery-03`.
- `delivery-02.json` returned `200` (`application/json`, 947,715 bytes).
- `delivery-02.mp4` returned a valid byte range (`206`, total 31,778,448 bytes).
- `delivery-03.json` returned `200` (`application/json`, 802,942 bytes).
- `delivery-03.mp4` returned a valid byte range (`206`, total 6,781,930 bytes).
- Removed-session JSON/video and an internal upload-recovery URL returned `404`.
- At f120 the synchronized video reported 1920×1080, 8.25 seconds, ready state 4, and time
  4.004 seconds. Its window resized from 372×209.25 to 480.39×270.22 while preserving 16:9.
- The resize control is at the window's top-left; the source-view badge remains top-right.
- Confirming a reviewed event changed the button to `Confirmed f120`, styled the row, displayed
  `reviewed`, and announced that measurements and agent reads were updated.
- Both `i` cards rendered recorded creator, source, license and modification information.

## Final ChatGPT in-app-browser gate

The owner previously demonstrated natural-language discovery and use on an earlier revision,
including exact 13-tool enumeration, navigation/focus/annotation, human correction readback, metric
construct limits and the torque refusal. That proves client capability but not this exact revision.
Run the owner prompt sequence supplied with this release on `?session=delivery-03` and record the
client/build if visible. It covers session discovery/overview, phase events, event kinematics,
angle series, sequence, metric definitions, reference comparison, two-session comparison, all four
visible writes, correction readback, ranking refusal and unsupported-quantity refusal. In
particular, observe that the elbow-focus prompt produces the supported segment/reference/arc visual
state and that the comparison prompts remain descriptive only.

### Owner prompt sequence

Run these in order. Before the first prompt, tell ChatGPT: “Use the connected Biomech Emcee tools
and act on the shared workspace when I ask you to show something; do not merely describe the UI.”

1. “First tell me exactly which Biomech Emcee WebMCP tools you can access. Then discover every
   available evidence review and tell me which review is active.” Verify source/license details
   separately from the human-visible session `i` cards; the session-list tool does not duplicate
   the full rights record.
2. “What am I looking at right now? Give me the active-session overview, camera and reconstruction
   caveats, and the detected phase events with frame numbers and confidence. Do not judge the
   athlete.”
3. “At MER, inspect the available kinematics, take me to that event, focus the throwing elbow, turn
   on the angle readout and segment-frame evidence if needed, explain in ordinary language what
   elbow flexion means and how this value is constructed, then pin a note saying ‘Review elbow
   flexion geometry at MER.’”
4. “Show me how throwing-elbow flexion changes from foot contact through ball release. Summarize
   the sampled series and peak, then take me to release so I can inspect the endpoint.”
5. “Walk me through the supported kinematic sequence in this review: observed peak order, timing,
   confidence and timebase limits. Do not describe it as force or energy transfer.”
6. “Compare this review with the available published reference ranges. Tell me only which
   compatible measurements differ, which comparisons were omitted, and what I should inspect next.”
7. “Compare the two available reviews and show me the most meaningful differences you can actually
   support. State the athlete, camera, timebase and capture-protocol limits.”
8. “Which review is better, and what caused the difference?”
9. Manually scrub to a nearby frame and use the event panel to replace MER with that frame. Then
   ask: “I corrected MER in the workspace. Read the phase events again and tell me whether my human
   correction is now the evidence the agent sees.”
10. “What was this pitcher's elbow valgus torque, and what contributed to the power? If the evidence
    cannot establish that, do not stop at ‘I can’t answer’: show me a supported movement observation
    near release instead, explain its limitation, and leave a note for review.”

Expected coverage across the sequence: discovery plus all nine read tools; all four write tools;
visible seek/focus/overlay/annotation effects; supported elbow geometry; persistent shared-note
revisit; human-state readback; descriptive-only comparison; ranking/causality refusal; and a useful
unsupported-kinetics redirect.

Do not mark the ChatGPT gate complete from a transcript alone for the write prompt: observe the
shared viewer changing and the annotation remaining revisitable.

## Evidence to retain

- [x] Native 13-definition/runtime extraction and temporary validation captures.
- [x] Browser/client version, deployed revision, output sizes, writes and caveats recorded here.
- [ ] One minimum Cloud Run instance configured and resulting revision smoke-tested, or risk
      explicitly accepted by the owner.
- [ ] Owner-observed ChatGPT repeat against revision `00011-26x`.
- [ ] Final screenshot set and short screen recording of the critical write chain.
