# Public deployment

**Live workspace:** <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app>

The current public review workspace is a public, unauthenticated Cloud Run service in `ideaslab-gcp`
(`us-central1`). It serves the static Vite build; all session analysis runs in the browser, so this
production origin has no upload or GPU-inference backend.

The stable legacy service identifier remains `pitchlab-webmcp`; the application served from it is
the current Biomech Emcee owner-review build.

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

## Verification record

On 2026-09-01, revision `pitchlab-webmcp-00007-tkw` received 100% traffic. Checks against the stable
URL returned `200` for the application shell and the retained `delivery-01` session; the removed
`delivery-02` returned `404`. The page title is Biomech Emcee, the deployed bundle contains all 13
expected WebMCP tool names, and the response headers do not include `Origin-Agent-Cluster: ?0`.
A headless cold render loaded the synchronized 2D/3D review workspace successfully.

This proves public static delivery, not live WebMCP host compatibility. The remaining manual
verification is recorded in [`evals/webmcp-live-checklist.md`](../evals/webmcp-live-checklist.md).
The retained synchronized source video remains provisional because its redistribution rights are
unresolved; this deployment is not cleared as the final submission asset. See
[`ATTRIBUTION.md`](../ATTRIBUTION.md).

## Provisional live WebMCP validation

On 2026-09-01, the same revision passed native WebMCP discovery and all 13 direct tool invocations
in a fresh **Google Chrome for Testing 154.0.8035.0** profile with WebMCP enabled. All four writes
visibly changed the rendered application before returning, and the current plain-object return shape
was accepted by the host. An owner-observed **ChatGPT in-app-browser** run also passed exact tool
discovery, natural-language navigation/focus/annotation, human-corrected event readback, construct
limits, and an unsupported-torque refusal. The exact ChatGPT app/build number was not captured.
This clears live WebMCP for the provisional origin but does not make it submission-final: cleared
evidence and a post-deployment repeat are still blocking. Full observations and client caveats are
in the live checklist.
