# Live WebMCP verification checklist

**Public origin:** <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app>

This record covers the cleared-evidence release deployed on 2026-09-01. A status is `PASS` only
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
| LIVE WEBMCP | ChatGPT natural-language evals | PENDING | Prior deployed revision passed; owner must repeat against revision `00010-d65` |
| EVIDENCE | Redistribution rights / provenance | PASS | Pexels License and attributed CC BY-SA 4.0 Wikimedia derivative; no unverified session ships |
| EVIDENCE | Reconstruction QA / event review / bundle | PASS | 288-frame Pexels and 246-frame Wikimedia sessions passed QA and numerical gates |
| FINAL DEPLOYMENT | Exact revision / HTTPS / cold load | PASS | Commit `dc4fdf3`; revision `00010-d65`; 100% traffic; current session set and assets verified |
| FINAL DEPLOYMENT | Post-deploy WebMCP critical flow | PASS | Chrome 154: inspect → navigate → focus → overlay → annotate/revisit |
| JUDGE EXPERIENCE | Clean-profile and human-only usability | PASS | Cleared 2D/3D sync, aspect-ratio resize, event confirmation and rights cards observed without errors |
| JUDGE EXPERIENCE | ChatGPT agent journey and refusal | PENDING | Repeat the prompt set below against the exact final candidate |
| SUBMISSION | README/repo/license consistency | PASS | Two cleared sessions and current limitations reconciled locally |
| SUBMISSION | Screenshots / narrated video / Devpost fields | PENDING | Begin only after the final ChatGPT repeat |

## Environment and deployed artifact

- Date: 2026-09-01.
- Origin tested: `https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app/?session=delivery-03`.
- Deployed code commit: `dc4fdf3` (`docs: reconcile cleared release evidence`).
- Cloud Run revision: `pitchlab-webmcp-00010-d65`, 100% traffic; ready at
  2026-09-01 10:28:43 UTC.
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
| `list_pitch_sessions` | PASS | 952 chars; both cleared sessions and rights state |
| `get_session_overview` | PASS | 1,454 chars; live frame, view, focus, layers and capture caveats |
| `get_phase_events` | PASS | 1,341 chars; FC/MER/BR; correction retest returned MER f121 with `manualOverride: true` |
| `get_kinematics_at_event` | PASS | 2,435 chars; event readings, other metrics, confidence and `meta` |
| `get_joint_angle_series` | PASS | 1,296 chars; bounded FC→BR elbow-flexion series |
| `get_kinematic_sequence` | PASS | 2,210 chars; partial order and known-timebase rate qualification |
| `get_metric_definition` | PASS | 1,511 chars; torque refusal separately passed without a fabricated value |
| `compare_to_reference` | PASS | 2,656 chars; compatible flexion constructs and bounded review plan |
| `compare_pitches` | PASS | 2,145 chars; descriptive-only cross-session result with compatibility warnings |
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
  (116 ms).
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
Run these on `?session=delivery-03` and record the client/build if visible:

1. “What am I looking at?” — agent should call `get_session_overview` and identify the live
   left-handed, camera-frame reconstruction.
2. “Show maximum layback and leave a note for the reviewer.” — viewer must seek to MER f120,
   focus the throwing (left) shoulder and paint a persistent annotation.
3. Manually confirm a different MER frame, then ask “What are the phase events?” — response must
   return that frame with `manualOverride: true`.
4. “Is 42° hip–shoulder separation good?” — explain the construct limit; do not quote a target.
5. “What is his elbow valgus torque?” — structured refusal; no number.
6. “Which WebMCP tools can you reach?” — exactly the intended 13, with no stale names.

Do not mark the ChatGPT gate complete from a transcript alone for the write prompt: observe the
shared viewer changing and the annotation remaining revisitable.

## Evidence to retain

- [x] Native 13-definition/runtime extraction and temporary validation captures.
- [x] Browser/client version, deployed revision, output sizes, writes and caveats recorded here.
- [ ] Owner-observed ChatGPT repeat against revision `00010-d65`.
- [ ] Final screenshot set and short screen recording of the critical write chain.
