# Identity and naming decision

**Decision date:** 2026-08-31
**Workflow state:** owner review hold; current source is live, but do not advance Devpost yet

## Participant identity

| Context | Name to use |
|---|---|
| Eligibility, license, Devpost author, and other formal records | **Pradeep Rajasekar** |
| Given name | **Pradeep** |
| Surname | **Rajasekar** |
| Conversational greeting or informal credit | **Ajish** |

The local Devpost workflow state records `Pradeep Rajasekar` as the participant name and `Ajish` as
the preferred display name. The repository license and future local Git commit author name use the
formal name. Existing Git history is not rewritten.

The connected Devpost account currently reports **Ajish Pradeep Rajasekar**. The Devpost MCP exposes
identity read access but no profile-edit operation, so the account record was not silently changed.
Before final submission, manually update the Devpost profile to **Pradeep Rajasekar** if the name on
the submission must match formal identification. Registration itself is confirmed; no Devpost
project has been created and nothing has been sent for judging.

## Canonical product name

**Product:** Biomech Emcee

**Submission title:** Biomech Emcee — Shared 3D Movement Review with WebMCP

**Short descriptor:** An agent-ready biomechanics workspace where people and agents review the same
motion evidence.

The web application and WebMCP integration use one product name. The WebMCP capability is described
as the **Biomech Emcee WebMCP tool surface**, not as a separate product. A second brand would make
judges spend time decoding the relationship instead of seeing the central interaction: the human and
agent work from the same state, evidence, and annotations.

### Why this name

- **Biomech** establishes the movement-analysis domain without limiting the product to one sport.
- **Emcee** is pronounced like “MC,” creating a restrained association with MCP while describing the
  agent's real role: it coordinates domain analysis, browser state, evidence navigation, visible
  actions, annotations, and human review. It is not expanded as a false acronym.
- The name avoids claims of diagnosis, coaching, accuracy, or performance gains.
- It is distinctive enough to remember and short enough for the UI and demo narration. The subtitle
  supplies the function immediately, so the wordplay does not have to carry the product explanation.

`PitchLab` was rejected because an active baseball analytics company and App Store product already
uses that exact name in the same category. `MoundFrame` was considered and rejected because it was
easy to misread as “Mount Frame,” narrowed the identity to baseball, and did not communicate
biomechanics clearly enough. A web, GitHub, Devpost, and software-oriented exact-name search found no
competing application called `Biomech Emcee` on 2026-08-31. The lowercase name `emcee` is also used
by a Python MCMC library, so the product should always use the full two-word name and descriptor.
This is a practical collision screen, not legal trademark clearance.

## Product framing lock

Biomech Emcee is a WebMCP-enabled workspace for human-agent review of movement evidence. Baseball
pitching is its **first fully implemented reference workflow**, not the intended product boundary.
This distinction is mandatory in every judge-facing surface:

- Say the interaction pattern is designed to generalize across sports-analysis applications.
- Say pitching is the only implemented domain workflow today.
- Do not call the current build a completed multi-sport platform.
- Do not imply that another sport needs only a label change. Each requires a domain event taxonomy,
  metrics, compatible references, UI review, and independent validation.
- Keep the concrete pitching workflow prominent in the demo because judges score credible execution
  and impact, not only architectural possibility.

The durable pitch is:

> Biomech Emcee is an agent-ready biomechanics workspace where people and agents review the same
> motion evidence. Its first end-to-end workflow applies the pattern to baseball pitching.

## What changed

- Product-facing UI metadata and headings now use Biomech Emcee.
- README, specification, plan, handoff, attribution, deployment notes, and Devpost draft use the
  canonical name and the reference-workflow framing.
- The local Devpost state uses the formal participant name, preferred display name, and new project
  name.
- The MIT copyright line uses the formal name.
- The public GitHub repository is `Ajishpradeep/biomech-emcee`; GitHub redirects from the previous
  URL after the rename, but all judge-facing links use the canonical URL.

## Owner checks before work resumes

- [ ] Open the local production build and inspect **Biomech Emcee** in the actual UI.
- [ ] Record desired application changes in a fresh owner-review session.
- [ ] Manually correct the Devpost profile name if formal-name consistency is required.
- [ ] Review any GitHub profile display-name preference separately; it is account-wide and was not
      changed as part of this repository decision.
- [x] Keep the stable legacy Cloud Run URL; it now serves the current Biomech Emcee build.
- [ ] Replace or clear the provisional professional-player footage before final screenshots/video.
- [ ] Run the live WebMCP host checklist only after the desired manual application changes are made.

When the owner declares the app review complete, follow [`devpost-resume.md`](devpost-resume.md).
The source rename and owner-requested deployment are complete; final compliance remains pending.
