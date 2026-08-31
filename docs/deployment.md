# Public deployment

**Live workspace:** <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app>

PitchLab Review is deployed as a public, unauthenticated Cloud Run service in
`ideaslab-gcp` (`us-central1`). It serves the static Vite build; all session analysis runs in the
browser, so this production origin has no upload or GPU-inference backend.

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

On 2026-08-31, revision `pitchlab-webmcp-00001-2bm` received 100% traffic. A cold HTTP check
returned `200` for the application shell and both committed review sessions (`scherzer-delivery-01`
and `skenes-delivery-01`). The response headers did not include `Origin-Agent-Cluster: ?0`.

This proves public static delivery, not live WebMCP host compatibility. The remaining manual
verification is recorded in [`evals/webmcp-live-checklist.md`](../evals/webmcp-live-checklist.md).
