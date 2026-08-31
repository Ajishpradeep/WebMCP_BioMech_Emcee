# CLAUDE.md — Biomech Emcee

A WebMCP-enabled workspace for human-agent review of movement evidence. Baseball pitching is the
only implemented reference workflow; do not claim completed multi-sport support. Built for
[The WebMCP Challenge](https://webmcp.devpost.com/) — **deadline Thu Sep 3, 2026, 1:00 PM PDT**;
the live URL must stay up through **Sep 21**.

## Read these before working

| File | What it's for |
|---|---|
| [`SPEC.md`](SPEC.md) | Product spec, scope, non-goals, self-score |
| [`PLAN.md`](PLAN.md) | Current recovery plan, commit gates, and historical build record |
| [`.claude/steering/tech.md`](.claude/steering/tech.md) | Architecture, pipeline, data contract, metrics + citations |
| [`.claude/steering/webmcp-tools.md`](.claude/steering/webmcp-tools.md) | The 13-tool surface — the graded artifact |
| [`docs/webmcp-technical-reference.md`](docs/webmcp-technical-reference.md) | Verified WebMCP API facts — **don't re-derive** |
| [`docs/webmcp-challenge-brief.md`](docs/webmcp-challenge-brief.md) | Rules, judging, submission bar |
| [`docs/brand-decision.md`](docs/brand-decision.md) | Locked name, identity, and cross-sport positioning boundary |
| [`docs/devpost-resume.md`](docs/devpost-resume.md) | Full reconciliation after the owner app-review session |

## The one-line thesis

The specialist model perceives (SAM 3D Body → 3D pose). The general agent navigates and explains.
The human validates the evidence because **agent and human are looking at the same 3D reconstruction**
— and the agent can move it and pin review notes.

## Settled decisions — do not re-litigate

- **Baseball pitching is the only implemented workflow.** The review pattern is intended to extend
  to other sports, but each needs its own domain adapter and validation (SPEC §§5, 8).
- **Hard offline/online split.** SAM 3D Body inference is offline on the local RTX A6000; the web app
  is a **static build** with no server in the request path.
- **Dual-mode analysis.** `pipeline/server.py` is a **local-only** FastAPI backend giving a real
  upload → analyse flow for development and the demo video. The **deployed** build has no backend and
  serves pre-computed sessions from `web/public/sessions/`; the upload panel degrades to an
  explanatory state. Never make the deployed app depend on the backend.
- **Biomechanics are computed in the browser.** WebMCP is valuable because the agent reads and writes
  the exact live review state. A backend MCP remains appropriate for future history or team data.
- **Imperative WebMCP API only.** The declarative form API is unsupported in ChatGPT's in-app browser,
  which is our primary judging surface. Top-level page, **no iframes**.
- **React + Vite + react-three-fiber + Zustand.** WebMCP tools read/write the same `AnalysisStore` the
  UI renders from — one state path, not two.
- **`session.json` is a frozen contract** (tech.md §4) once Task 6 lands.
- **MIT for our code.** Model weights are under Meta's SAM License and are **never committed**.

## Hard scientific constraints — these are correctness bugs, not style

SAM 3D Body returns **camera-frame** coordinates with an **estimated** focal length. Therefore:

- ✅ Joint angles, segment-to-segment angles, event timing, height-normalized ratios
- ❌ **No absolute distances in metric units.** Stride length is **% of body height**, never cm.
- ❌ **No kinetics.** No torques, forces, or loading rates — they need force data and a musculoskeletal
  model. Asked for one, we return a **structured refusal**, never a number.
- ❌ **No injury prediction or risk scores.** The prospective evidence base does not support it.
  Deviation from a reference range is an *observation*, not a *diagnosis*.

Every metric carries a confidence grade (`high`/`medium`/`low`/`unavailable`), and every tool response
carries a `meta` block with confidence, citations, and the disclaimer. **This honesty layer is a
product feature — never strip it to save output budget.**

**A confidence label cannot repair a construct mismatch.** Do not compare a computed quantity to a
published range unless the anatomical definition, sign, event, and convention are compatible. When
they are not, report the quantity as experimental or unavailable for reference comparison.

## Conventions

- Reference ranges live **only** in `web/src/biomech/reference.ts`, each with its citation. The UI and
  `get_metric_definition` both read from there so they can never drift.
- `web/src/biomech/` is pure TypeScript — no React imports, unit-tested with Vitest.
- Tool names: snake_case, ≤30 chars. Descriptions ≤500 chars, params ≤150, output ≈≤1.5 K.
- Tool return shape is funneled through `toolResult()` in `src/webmcp/registry.ts` — one choke point.
- Write tools **update the UI before returning**.
- **13 tools is the ceiling.** To add one, delete one.

## Deploy gotchas that fail silently

- HTTPS is mandatory — `document.modelContext` is `SecureContext`-gated.
- **`Origin-Agent-Cluster: ?0` disables WebMCP with no error.** Check `curl -I` on every deploy.
- Verify in **ChatGPT's in-app browser**, not only Chrome DevTools.

## When time is short

Cut features, never finish. Follow the cut list at the bottom of [`PLAN.md`](PLAN.md).
**Never cut Tasks 13–18, the confidence layer, `get_metric_definition`, or any Category D tool.**
