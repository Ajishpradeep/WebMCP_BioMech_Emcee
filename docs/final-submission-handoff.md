# Final submission handoff — 2026-09-03

## Current state

- Application engineering is submission-frozen.
- Deployed application artifact: commit `7e0561d7ed766c5d9a6e4adaf084c561829423a0`.
- Cloud Run revision: `pitchlab-webmcp-00011-26x`, 100% traffic, service-level `minScale: 1`.
- Live URL: <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app>.
- Public repository: <https://github.com/Ajishpradeep/biomech-emcee>.
- Public video: <https://youtu.be/yAUan4TGnl8>; playable/embeddable, 160–161 seconds, owner confirms
  narrated audio.
- Registration is live and submissions remain open at the time of this handoff.
- Devpost currently reports no project for Biomech Emcee; nothing has been submitted.
- Official deadline: 2026-09-03 20:00 UTC / 2026-09-04 04:00 Asia/Taipei.

## Read first in the next session

Read these in order:

1. `docs/final-submission-handoff.md`
2. `HANDOFF.md`
3. `CLAUDE.md`
4. `devpost-submission.md`
5. `evals/webmcp-live-checklist.md`
6. `docs/deployment.md`
7. `docs/submission-assets.md`
8. `ATTRIBUTION.md`
9. `README.md`

Use the Devpost Hackathons plugin and its final-submit workflow. Re-fetch requirements, deadline,
registration, projects, and submission status live. Local state is not proof of submission.

## Frozen facts

- Product: Biomech Emcee — shared movement-evidence review, not coaching or diagnosis.
- Implemented workflow: baseball pitching only.
- Exactly 13 WebMCP tools: nine read and four write.
- Agent writes visibly seek, focus, change overlays, and add persistent evidence-linked notes.
- Human event corrections feed back into subsequent agent reads.
- Cross-session comparison is descriptive only; better/worse ranking is unavailable.
- Unsupported kinetics and injury claims return structured refusals.
- Two final evidence sessions only: Pexels `delivery-02` and attributed CC BY-SA 4.0 Wikimedia
  `delivery-03`.
- Form answers: Individual; Taiwan; New; Significant; career AI value Yes; AI tools OpenAI Codex and
  Meta SAM 3D Body.

## Final-session prompt

```text
We are performing the final Devpost preflight and real submission for Biomech Emcee. Do not redesign
the product, change application code, add features, or reopen settled scientific decisions.

Use the Devpost Hackathons plugin and follow its submit-project workflow exactly. Read, in order:
docs/final-submission-handoff.md, HANDOFF.md, CLAUDE.md, devpost-submission.md,
evals/webmcp-live-checklist.md, docs/deployment.md, docs/submission-assets.md, ATTRIBUTION.md, and
README.md.

First inspect git status and preserve all user assets. Refresh the official WebMCP Challenge
requirements, deadline, registration, project list, and submission status live. Verify the public
video https://youtu.be/yAUan4TGnl8, live app, public repository, GitHub MIT-license detection,
Cloud Run minimum-instance setting, frozen revision/image, exactly two session assets, and the
current test/typecheck/build baseline. Run the required redacted secret scan. Check every Devpost
field against devpost-submission.md and ensure the copy, video, screenshots, repository, attribution,
testing instructions, and deployment describe the same frozen artifact.

Do not claim that anything has been submitted from local state. If no live Devpost project exists,
prepare the exact create/update payload from devpost-submission.md and show it to me before any
write. Follow every confirmation gate required by the plugin. When readiness is genuinely ready,
state exactly what will be sent and ask me for the explicit confirmation phrase “yes, submit.” Do
not call submit_project before I provide that confirmation. After submission, verify submitted_at
live and return the public Devpost project URL. If any blocker exists, report only the exact blocker
and the fastest truthful resolution because the deadline is 2026-09-03 20:00 UTC / 2026-09-04
04:00 Asia/Taipei.
```

## Local asset note

`submission-assets/BioMech_EmmCee_Screen_Capture.png` is the high-resolution hero screenshot.
`submission-assets/YouTube Video Subtitle.MD` currently exists as an empty, untracked file. It is
not required by Devpost and should not be committed unless the owner intentionally populates it.
