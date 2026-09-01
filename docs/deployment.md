# Public deployment

**Live workspace:** <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app>

The current public review workspace is a public, unauthenticated Cloud Run service in `ideaslab-gcp`
(`us-central1`). It serves the static Vite build; all session analysis runs in the browser, so this
production origin has no upload or GPU-inference backend.

The stable service identifier remains `pitchlab-webmcp`; the application served from it is the
current Biomech Emcee release-candidate build.

## Reproduce a deployment

The repository contains the complete static-service definition:

- [`web/Dockerfile`](../web/Dockerfile) builds the Vite app with a clean `npm ci` and serves it from
  nginx on Cloud Run's required port 8080.
- [`web/nginx.conf`](../web/nginx.conf) handles SPA routes, static cache headers, and deliberately
  does **not** emit `Origin-Agent-Cluster: ?0`, which would prevent WebMCP registration.
- [`scripts/deploy-gcp.sh`](../scripts/deploy-gcp.sh) deploys from source.

With authenticated gcloud and a billing-enabled project:

```bash
GCP_PROJECT_ID=ideaslab-gcp \
GCP_REGION=us-central1 \
GCP_SERVICE_NAME=pitchlab-webmcp \
./scripts/deploy-gcp.sh
```

The script prints the canonical service URL. Deployments are public by design for hackathon judges;
review Cloud Run billing and access settings before using this configuration for any non-demo data.

## Verification record — licensed-session candidate

On 2026-09-01 at 06:37:35 UTC, revision `pitchlab-webmcp-00008-wfw` received 100% traffic. The
deployed source milestone is commit `06d048c` (`feat: add licensed full-body review session`). The
stable URL and Cloud Run's revision URL both resolve to this service.

Observed checks against the stable URL:

- HTTPS application shell: `200`; secure, top-level document; no iframe dependency.
- Headers omit `Origin-Agent-Cluster: ?0` and include `X-Content-Type-Options: nosniff`.
- `delivery-02` is the first/default session and its JSON contains 288 analysed frames (f0–f287).
- `delivery-02.mp4` is served as `video/mp4`; a one-megabyte range request returned `206`,
  `Content-Range: bytes 0-1048575/31778448`.
- A clean headless render loaded the synchronized full-body 2D reference, 3D reconstruction, event
  anchors, measurement cards, and resizable picture-in-picture layout without runtime errors.
- Both session `i` cards were opened on the public origin. The default card rendered its creator,
  exact Pexels source and license; the legacy card rendered `Rights unverified` and the required
  removal/permission warning.
- Native Chrome 154 exposed exactly 13 unique WebMCP tools after initial load and reload. All 13
  executed with status `Completed`; navigation, joint focus, overlay mutation, annotation paint and
  annotation revisit were visible before their calls completed. Details are in the live checklist.

This is a deployable release candidate, but **not the submission-final evidence set**. The licensed
Pexels session is cleared and attributed. The retained `delivery-01` YouTube-derived reference is
still marked `unverified` in its session information card and blocks final evidence clearance until
it is removed or written redistribution permission is recorded. See [`ATTRIBUTION.md`](../ATTRIBUTION.md).

## Provisional live WebMCP validation

On 2026-09-01, revision `pitchlab-webmcp-00007-tkw` passed native WebMCP discovery and all 13 direct
tool invocations
in a fresh **Google Chrome for Testing 154.0.8035.0** profile with WebMCP enabled. All four writes
visibly changed the rendered application before returning, and the current plain-object return shape
was accepted by the host. An owner-observed **ChatGPT in-app-browser** run also passed exact tool
discovery, natural-language navigation/focus/annotation, human-corrected event readback, construct
limits, and an unsupported-torque refusal. The exact ChatGPT app/build number was not captured.
Revision `pitchlab-webmcp-00008-wfw` subsequently passed the same native Chrome gate against the
licensed default session. The owner must still repeat the natural-language ChatGPT in-app-browser
flow against this exact revision; do not claim that client retest from the earlier build. Full
observations and client caveats are in the live checklist.
