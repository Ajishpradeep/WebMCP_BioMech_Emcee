# Live WebMCP verification checklist

**Public origin:** <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app>

Use Chrome 149+ with WebMCP enabled or ChatGPT's in-app browser. Complete this record before
submission; headless tests prove handler behavior but cannot prove host registration or tool choice.

## Submission-readiness ledger

Last updated: 2026-09-01. Status values require observed evidence: `PASS`, `FAIL`, `BLOCKED`, or
`PENDING`; source inspection and automated mocks do not count as live-host proof.

| Gate | Item | Status | Evidence |
|---|---|---|---|
| LIVE WEBMCP | Deployed-origin preflight | PASS | HTTPS 200; public top-level page; licensed default plus explicitly retained provisional session; headers/assets verified |
| LIVE WEBMCP | Chrome registration / exactly 13 tools | PASS | Native Chrome 154 WebMCP discovery; exact set, no duplicates; reload remained 13 |
| LIVE WEBMCP | All 13 runtime checks | PASS | Every tool returned native status `Completed`; correct refusals count as passes |
| LIVE WEBMCP | Four visible write effects | PASS | Candidate screens observed: f52→f88; elbow/side focus; 5→4 layers; persistent/revisitable note |
| LIVE WEBMCP | Return shape confirmed | PASS | Plain objects were preserved in native `Completed` outputs; no envelope change needed |
| LIVE WEBMCP | ChatGPT in-app browser / natural-language evals | PENDING | Prior revision passed owner-observed prompts; repeat against `00008-wfw` / licensed default |
| EVIDENCE | Redistribution rights / provenance | BLOCKED | Licensed default is cleared; retained legacy YouTube session remains unverified |
| EVIDENCE | Reconstruction QA / event review / final bundle | PASS | Licensed 288-frame default passed reconstruction QA, event review, numerical gates and deployed-bundle checks; final set still blocked by legacy retention |
| FINAL DEPLOYMENT | Exact revision / HTTPS / headers / cold load | PASS | Commit `06d048c`; revision `00008-wfw`; 100% traffic; clean public render and asset/header checks pass |
| FINAL DEPLOYMENT | Post-deploy WebMCP critical flow | PASS | Chrome 154: inspect → f88 navigate → elbow focus → overlay → persistent annotation/revisit |
| JUDGE EXPERIENCE | Clean-profile and human-only usability | PENDING | Test exact final URL |
| JUDGE EXPERIENCE | Agent journey and refusal path | PENDING | Derive final sequence from validated behavior |
| SUBMISSION | README/repo/license consistency | PENDING | Reconcile against final revision |
| SUBMISSION | Screenshots / public narrated video / Devpost fields | PENDING | Packaging begins only after final runtime is frozen |

## Preconditions

- [x] Fresh ephemeral Chrome profile used by the native GoogleChromeLabs/Puppeteer harness.
- [x] URL cold-loads over HTTPS and licensed `delivery-02` appears as the default session.
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
- The remaining natural-language gate was cleared by the owner-observed ChatGPT in-app-browser run
  below. The exact ChatGPT app/build number was not captured, so do not claim one.

## ChatGPT in-app-browser run — 2026-09-01

- Client: **ChatGPT in-app browser**, opened and observed by the project owner against the public
  HTTPS origin. The exact ChatGPT desktop/mobile app version and build were not captured. The app
  itself requires no login; this run proves that the client exposed and authorized the site's
  capabilities for reads and visible writes, not that an OAuth-style account grant occurred.
- Tool discovery: when asked whether it used WebMCP and which tools were reachable, the agent said
  its answer came from the page's WebMCP tool and listed the exact intended 13 tools—nine reads and
  four writes—with no stale or invented names.
- `What am I looking at?` — **PASS.** The agent reported the right-handed elevated third-base-side
  session, live f562 / lead-foot-contact state, the 3D camera-frame reconstruction, event set,
  overlays, and the non-diagnostic/non-metric-distance boundaries. This contains live structured
  state that is not explained by merely repeating page chrome.
- `Show maximum layback and leave a note for the reviewer.` — **PASS.** The agent navigated to MER
  f675, focused the throwing shoulder, proposed a bounded note, requested confirmation for the
  state-changing annotation, then created the visible persistent note. The confirmation step is
  normal client-side write approval behavior, not a failure of the chain.
- Human correction, then `what are the phase events?` — **PASS.** After the owner moved FC to f635,
  the agent returned FC f635 as manually reviewed, MER f675, and BR f701. Reported times are correct
  at 29.97 fps (21.188 s, 22.523 s, 23.390 s), and `(675-635)/(701-635)` correctly gives 60.6%.
- `Is 42° hip–shoulder separation good?` — **PASS with a wording caveat.** The agent refused the
  good/bad classification, identified the value as an exploratory pelvis-to-trunk proxy, warned
  that the camera-frame convention may not match published constructs, and did not invent a target
  range. “Notable separation” is mildly interpretive; future wording should stay descriptive, and
  pitch-to-pitch use should require the same athlete and compatible capture protocol. This is not a
  product or tool-contract defect.
- `What's his elbow valgus torque?` — **PASS.** The agent returned no number, explained that force
  data and inverse dynamics are unavailable, and offered supported nearby observations.
- Conclusion: a real agent reliably discovered and used the deployed application's WebMCP surface,
  including visible navigation, joint focus, persistent annotation, human-state readback, and a
  scientifically correct refusal. The **LIVE WEBMCP gate is cleared for this provisional origin**.
  Repeat the critical flow after cleared evidence is deployed; this run does not clear that future
  revision automatically.

## Human-agent workflow

- [x] Ask: “Show maximum layback and leave a note for the reviewer.” The agent chains event lookup,
  seek, focus, and annotation; the screen visibly changes.
- [x] Move an event in **Review event frames**, then ask for phase events. The returned frame is the
  human-reviewed frame and `manualOverride` is true.
- [x] Ask: “Is 42° hip–shoulder separation good?” The agent calls `get_metric_definition`, explains
  the construct limitation, and does **not** quote a target range.
- [x] Ask for elbow valgus torque or pitch velocity. The agent refuses rather than fabricating a value.

The owner-observed ChatGPT run confirms **agent selection from natural language** as well as the
underlying native Chrome tool behavior on revision `00007-tkw`. Revision `00008-wfw` still needs
the owner-observed natural-language repeat; native Chrome coverage alone does not satisfy that item.

## Licensed-default post-deployment run — 2026-09-01

- Origin: `https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app/?session=delivery-02`
- Cloud Run: revision `pitchlab-webmcp-00008-wfw`, 100% traffic; deployed source milestone
  `06d048c`; service became ready at 2026-09-01 06:37:35 UTC.
- Static runtime: HTTPS shell `200`; no `Origin-Agent-Cluster: ?0`; 288-frame session JSON loaded;
  the 31,778,448-byte synchronized MP4 returned a valid `206` byte-range response.
- Clean render: licensed full-body 2D source, reconstructed 3D skeleton, event anchors, metrics, and
  the resizable reference window all painted at 1600×1000 without console or page errors.
- Rights UI: both public session `i` controls opened. `delivery-02` showed Tima Miroshnichenko, the
  exact Pexels source and Pexels License; `delivery-01` showed `Rights unverified`, the exact
  PastimeAthletics upload, and the removal/permission warning.
- Native client: Google Chrome for Testing 154.0.8035.0, fresh headless profile,
  `--enable-features=WebMCP`, GoogleChromeLabs/Puppeteer native integration; no polyfill.
- Registration: `document.modelContext` present in a secure top-level document; exactly 13 expected
  unique tools, nine reads/four writes, descriptions/schemas/annotations present; reload again
  produced exactly 13 with no duplicates.
- Runtime: all 13 calls completed. Outputs stayed below 3,500 JSON characters. `compare_pitches`
  now returns `comparisonScope: descriptive_only` because the owner temporarily retained both
  sessions; its caveats explicitly say athlete identity is not encoded and the views differ. Do not
  narrate this as improvement/regression or make it part of the core judge path.
- Visible write chain: `seek_to_event(ball_release)` painted f88; `focus_joint(throwing_elbow)`
  painted the elbow highlight/readout and selected the sagittal side view; disabling `motion_trail`
  painted 5→4 layers; `annotate_frame` painted the f88 note and Shared Notes entry. Clicking the note
  after seeking away returned to f88. Calls completed after the corresponding paint (122–204 ms).
- Boundaries: invalid event input returned the structured retryable contract; elbow-valgus-torque
  returned `available: false` and the force/inverse-dynamics refusal; moving MER to f82 in the UI was
  returned as f82 with `manualOverride: true`.
- Errors: no console or page errors. Three MP4 requests were cancelled during seek/reload and logged
  as `net::ERR_ABORTED`; independent range delivery and visible rendering passed, so these are media
  request replacement/teardown events rather than missing assets.
- Harness correction: the first run reached its final reload but timed out waiting for
  `networkidle2` because the larger MP4 continued streaming. Changing only the reload wait to
  `domcontentloaded` produced the complete passing report; no application code changed.

## Evidence to retain

- [x] Temporary screenshot of the `WebMCP · 13 tools` in-app indication plus native 13-definition
  extraction (not a final cleared-data artifact).
- [ ] Short screen recording of the write-tool chain and the event-review correction.
- [x] Notes on host/browser version, date, return shape, outputs, errors, writes, and caveats above.
