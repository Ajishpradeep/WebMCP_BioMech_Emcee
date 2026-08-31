# Live WebMCP verification checklist

**Public origin:** <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app>

Use Chrome 149+ with WebMCP enabled or ChatGPT's in-app browser. Complete this record before
submission; headless tests prove handler behavior but cannot prove host registration or tool choice.

## Preconditions

- [ ] Fresh browser profile / in-app browser used.
- [ ] URL cold-loads over HTTPS and both sessions appear.
- [ ] Header reports `WebMCP · 13 tools` (not unsupported, partial, or failed).
- [ ] DevTools confirms no `Origin-Agent-Cluster: ?0` response header.

## Registration and execution

- [ ] DevTools Application → WebMCP lists all 13 tools.
- [ ] A read tool (`get_session_overview`) returns the active session and current frame.
- [ ] `seek_to_event` visibly scrubs the viewer.
- [ ] `focus_joint` visibly changes selection, readout, and camera plane.
- [ ] `annotate_frame` creates a visible persistent note.
- [ ] An invalid input returns a structured retryable error, not a stack trace.

## Human-agent workflow

- [ ] Ask: “Show maximum layback and leave a note for the reviewer.” The agent chains event lookup,
  seek, focus, and annotation; the screen visibly changes.
- [ ] Move an event in **Review event frames**, then ask for phase events. The returned frame is the
  human-reviewed frame and `manualOverride` is true.
- [ ] Ask: “Is 42° hip–shoulder separation good?” The agent calls `get_metric_definition`, explains
  the construct limitation, and does **not** quote a target range.
- [ ] Ask for elbow valgus torque or pitch velocity. The agent refuses rather than fabricating a value.

## Evidence to retain

- [ ] Screenshot of the 13-tool DevTools list or equivalent in-app indication.
- [ ] Short screen recording of the write-tool chain and the event-review correction.
- [ ] Notes on host/browser version, date, and any return-shape issue.
