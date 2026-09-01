# Devpost, testing, and validation resume protocol

**Status:** active — post-owner-review submission convergence

**Resume trigger satisfied:** the owner explicitly declared the application review complete on
2026-09-01. Tasks 16–18 are active.

This document is the execution protocol for the post-owner-review convergence session. It prevents
the submission packet from drifting away from the reviewed product. Do not assume the current
Devpost draft, screenshots, deployment, test counts, feature list, or claims remain correct.

## Locked identity and positioning

- Formal participant name: **Pradeep Rajasekar**
- Preferred conversational name: **Ajish**
- Product name: **Biomech Emcee**
- Submission title: **Biomech Emcee — Shared 3D Movement Review with WebMCP**
- Implemented reference workflow: **baseball pitching**
- Product direction: the human-agent movement-review interaction pattern may support other sports
- Claim boundary: this is not yet a completed multi-sport platform; every new sport needs domain
  events, metrics, references, UI review, and validation
- Product/WebMCP naming: one brand; call the integration the **Biomech Emcee WebMCP tool surface**

If the owner deliberately changes any locked item during app review, update
[`brand-decision.md`](brand-decision.md), `SPEC.md`, and this file before proceeding.

## Fresh-session startup

1. Read `HANDOFF.md`, `CLAUDE.md`, `SPEC.md`, `PLAN.md`, `docs/brand-decision.md`, this file, and
   `devpost-submission.md`.
2. Inspect `git status`, recent commits, and the actual implementation. Treat the app-review commits
   as source of truth over the older draft.
3. Ask the owner for the app-review outcome only if it is not recorded in `HANDOFF.md`; do not repeat
   already completed product work.
4. Re-run the official Devpost preparation workflow. Fetch live requirements and judging criteria;
   do not rely only on the August 31 snapshot.
5. Confirm registration live. Do not create, update, or send a Devpost project without the workflow's
   required confirmation gates.

## Full reconciliation audit

Audit the entire final product, not only renamed headings:

- UI product name, page title, metadata, loading/error states, and any screenshots
- README, specification, plan, handoff, attribution, license, deployment notes, and evaluation docs
- all WebMCP names, descriptions, schemas, handlers, tool counts, state mutations, and error contracts
- current user flow and every claim in `devpost-submission.md`
- public repository URL, GitHub About description, detected license, and reproducibility instructions
- Cloud Run source, service configuration, live URL, response headers, cold load, and deployed revision
- automated test count, typecheck, production build, and any tests added or removed during app review
- provisional footage, player names, attribution, derived sessions, screenshots, and demo-video rights
- accessibility, narrow-screen behavior, failure handling, and unsupported-browser behavior

Run a repository-wide search for obsolete names and framing, including `PitchLab`, `MoundFrame`, and
the former repository URL. Legacy Cloud Run identifiers may remain only when clearly documented as
infrastructure identifiers rather than product branding.

## Required verification pipeline

1. Run TypeScript typecheck, the complete unit/integration suite, and the production build.
2. Test the production build locally in an ordinary browser and capture any owner-visible regressions.
3. Deploy the reviewed source only after the owner approves the app changes.
4. Verify the public origin has HTTPS, no disabling `Origin-Agent-Cluster: ?0` header, no auth gate,
   no dead upload path, and all required static sessions/assets.
5. Verify judge-facing availability after an idle period. The final candidate exposed a transient
   Cloud Run scale-from-zero 429 window; prefer one minimum instance and smoke-test the resulting
   configuration revision before freezing.
6. Complete `evals/webmcp-live-checklist.md` in an exact supported host and record the host/version.
7. Re-run the prompt/tool evals against the live build, including reads, visible writes, human event
   correction, structured refusals, and tool-result shape.
8. Validate final cleared footage and manually reviewed event frames before making accuracy claims.
9. Capture 3–5 screenshots only after the deployed build and data are frozen.
10. Record a public narrated YouTube demo shorter than three minutes; show the same build and claims
   that appear in the repository and Devpost draft.

## Devpost reconciliation

Rebuild the draft from the final evidence and the live official form. At minimum, verify:

- why WebMCP is necessary for client-side live state and visible write-back
- how the product improves the human review experience
- what the human and agent can do together that was previously difficult
- how the 13-tool imperative WebMCP surface is implemented
- that the cross-sport vision is presented as a direction while pitching is the working proof
- exact public app, repository, and video URLs
- exact client(s) and version(s) used for live WebMCP tests
- exact AI tools used
- submitter type, country, app status, learning level, and career-value answers
- formal Devpost profile/name consistency

The official August 31 form snapshot required a public repository with a detectable open-source
license, a working live URL, and a public YouTube demo with audio under three minutes. Re-fetch these
requirements because the live form remains authoritative.

## Completion rule

Do not call the packet ready merely because code tests pass. Readiness requires aligned source,
deployment, live WebMCP evidence, cleared assets, screenshots, video, repository metadata, and form
answers. Keep the local workflow at `prepare-submission` until only minor gaps remain. Actual Devpost
submission requires the separate final readiness workflow and the owner's explicit confirmation.
