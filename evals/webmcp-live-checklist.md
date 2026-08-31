# Live WebMCP verification checklist

**Public origin:** <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app>

Use Chrome 149+ with WebMCP enabled or ChatGPT's in-app browser. Complete this record before
submission; headless tests prove handler behavior but cannot prove host registration or tool choice.

## Submission-readiness ledger

Last updated: 2026-09-01. Status values require observed evidence: `PASS`, `FAIL`, `BLOCKED`, or
`PENDING`; source inspection and automated mocks do not count as live-host proof.

| Gate | Item | Status | Evidence |
|---|---|---|---|
| LIVE WEBMCP | Deployed-origin preflight | PASS | HTTPS 200; public top-level page; one intended session; headers/assets verified |
| LIVE WEBMCP | Chrome registration / exactly 13 tools | PASS | Native Chrome 154 WebMCP discovery; exact set, no duplicates; reload remained 13 |
| LIVE WEBMCP | All 13 runtime checks | PASS | Every tool returned native status `Completed`; correct refusals count as passes |
| LIVE WEBMCP | Four visible write effects | PASS | Screens observed: frame 562→701; elbow/side focus; 5→4 layers; persistent note |
| LIVE WEBMCP | Return shape confirmed | PASS | Plain objects were preserved in native `Completed` outputs; no envelope change needed |
| LIVE WEBMCP | ChatGPT in-app browser / natural-language evals | BLOCKED | ChatGPT Desktop/in-app browser is unavailable from this Codex environment |
| EVIDENCE | Redistribution rights / provenance | BLOCKED | Current synchronized source video is provisional |
| EVIDENCE | Reconstruction QA / event review / final bundle | PENDING | Run only on retained cleared evidence path |
| FINAL DEPLOYMENT | Exact revision / HTTPS / headers / cold load | PENDING | Retest after evidence clearance |
| FINAL DEPLOYMENT | Post-deploy WebMCP critical flow | PENDING | Inspect → navigate → focus → annotate |
| JUDGE EXPERIENCE | Clean-profile and human-only usability | PENDING | Test exact final URL |
| JUDGE EXPERIENCE | Agent journey and refusal path | PENDING | Derive final sequence from validated behavior |
| SUBMISSION | README/repo/license consistency | PENDING | Reconcile against final revision |
| SUBMISSION | Screenshots / public narrated video / Devpost fields | PENDING | Packaging begins only after final runtime is frozen |

## Preconditions

- [x] Fresh ephemeral Chrome profile used by the native GoogleChromeLabs/Puppeteer harness.
- [x] URL cold-loads over HTTPS and the intended single `delivery-01` session appears.
- [x] Header reports `WebMCP · 13 tools` (not unsupported, partial, or failed).
- [x] Response-header check confirms no `Origin-Agent-Cluster: ?0`.

## Registration and execution

- [ ] Graphical DevTools Application → WebMCP list capture. The native Chrome WebMCP inspection API
  returned the exact 13 definitions; retain this UI-specific capture for the final cleared build.
- [x] A read tool (`get_session_overview`) returns the active session and current frame.
- [x] `seek_to_event` visibly scrubs the viewer.
- [x] `focus_joint` visibly changes selection, readout, and camera plane.
- [x] `set_overlay` visibly changes the active evidence layers.
- [x] `annotate_frame` creates a visible persistent note; clicking it after scrubbing away returns to
  its evidence frame.
- [x] An invalid input returns a structured retryable error, not a stack trace.

### Per-tool runtime record

| Tool | Runtime status | Output / boundary notes |
|---|---|---|
| `list_pitch_sessions` | PASS | 910 chars; one analysed session; `meta`; untrusted hint preserved |
| `get_session_overview` | PASS | 1,607 chars; live frame/view/focus/layers; `meta` and capture caveats |
| `get_phase_events` | PASS | 1,545 chars; FC/MER/BR; UI correction retest returned MER f676 with `manualOverride: true` |
| `get_kinematics_at_event` | PASS | 2,640 chars at ball release; readings, other metrics, confidence, and `meta` |
| `get_joint_angle_series` | PASS | 1,547 chars for bounded eight-point FC→BR elbow-flexion request |
| `get_kinematic_sequence` | PASS | 2,576 chars; partial sequence and absolute-rate unavailability preserved |
| `get_metric_definition` | PASS | 1,709 chars supported definition; torque refusal separately passed at 976 chars |
| `compare_to_reference` | PASS | 2,336 chars; compatible flexion constructs only; causal and event-review limits preserved |
| `compare_pitches` | PASS | Correct 173-char structured retryable refusal for the single-session bundle |
| `seek_to_event` | PASS | 694 chars; native call moved visible frame 562→701 before completion |
| `focus_joint` | PASS | 824 chars; visible throwing-elbow highlight/readout and free→sagittal camera change |
| `set_overlay` | PASS | 796 chars; motion trail disabled and visible layer count changed 5→4 |
| `annotate_frame` | PASS | 848 chars; note visible at f701, listed in Shared Notes, clickable and revisitable |

## Chrome native run — 2026-09-01

- Origin: `https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app/?session=delivery-01`
- Cloud Run revision: `pitchlab-webmcp-00007-tkw`, 100% traffic. Repository HEAD during the run:
  `12a3e9d`; this is the documented provisional owner-review deployment, not submission-final.
- Passing client: **Google Chrome for Testing 154.0.8035.0**, fresh ephemeral profile, native
  `--enable-features=WebMCP`; discovery/invocation used GoogleChromeLabs `webmcp-evals` 0.0.4's
  Puppeteer WebMCP integration. No polyfill was injected.
- Registration: `document.modelContext` was present in a secure, top-level document; all 13 intended
  names, descriptions, input schemas, and annotations were exposed. Native annotations resolved to
  nine read-only and four write tools; untrusted content was preserved on `list_pitch_sessions`,
  `get_session_overview`, and `annotate_frame`. A reload again exposed 13 unique tools.
- Runtime: all 13 invocations received native status `Completed`. Every successful evidence result
  carried `meta`; the structured invalid-input and unavailable-second-session results intentionally
  returned the retryable error contract. All observed outputs remained under 3,000 JSON characters.
- Return shape: the host preserved the handlers' plain-object outputs. **Do not wrap `toolResult()`
  in an MCP content envelope.**
- Visible write chain: `seek_to_event(ball_release)` changed f562→f701; `focus_joint(throwing_elbow)`
  selected the right elbow, showed its 37.8° readout, and changed Free→Side; disabling `motion_trail`
  changed 5→4 layers; `annotate_frame` painted a labelled pin and Shared Notes entry. After seeking
  away, clicking the note returned to f701. Results arrived after those paints (72–179 ms).
- Human correction readback: the UI set MER to f676; the next native `get_phase_events` output
  returned f676 with `manualOverride: true`.
- Scientific/error boundaries: unsupported elbow valgus torque returned `available: false`, the
  force/inverse-dynamics reason, alternatives, and `meta.confidence: unavailable`; invalid event
  input returned the valid event list; one-session pitch comparison returned the expected refusal.
- Runtime errors: none in the console or page. Headless Chrome reported cancelled MP4 requests on
  page reload/teardown, but the video rendered visibly and independent checks returned MP4 `200`
  plus valid byte-range `206`; this is recorded as harness teardown noise, not an asset failure.
- Preliminary client caveat: Chrome for Testing 149.0.7827.155 did not expose
  `document.modelContext` under the same command-line feature switch. Do not claim that exact build
  as tested-compatible. Chrome 154 is the only passing Chrome client currently evidenced.
- Temporary visual captures live under `/tmp/biomech-webmcp-*.png`. They are validation-only and
  must not be committed or reused as final submission assets because the current 2D footage remains
  uncleared.
- Remaining gate: run the natural-language prompt suite in **ChatGPT Desktop's in-app browser** and
  capture exact client/version behavior. This environment cannot launch that client, so Stage Two
  remains blocked even though deterministic native Chrome interoperability passed.

## Human-agent workflow

- [ ] Ask: “Show maximum layback and leave a note for the reviewer.” The agent chains event lookup,
  seek, focus, and annotation; the screen visibly changes.
- [ ] Move an event in **Review event frames**, then ask for phase events. The returned frame is the
  human-reviewed frame and `manualOverride` is true.
- [ ] Ask: “Is 42° hip–shoulder separation good?” The agent calls `get_metric_definition`, explains
  the construct limitation, and does **not** quote a target range.
- [ ] Ask for elbow valgus torque or pitch velocity. The agent refuses rather than fabricating a value.

The underlying native tool calls, visible writes, human correction readback, construct limitation,
and torque refusal passed in Chrome. These boxes remain open because they test **agent selection from
natural language**, not whether a manually chosen tool works.

## Evidence to retain

- [x] Temporary screenshot of the `WebMCP · 13 tools` in-app indication plus native 13-definition
  extraction (not a final cleared-data artifact).
- [ ] Short screen recording of the write-tool chain and the event-review correction.
- [x] Notes on host/browser version, date, return shape, outputs, errors, writes, and caveats above.
