# Public deployment

**Live workspace:** <https://pitchlab-webmcp-rv45k2kgyq-uc.a.run.app>

The public, unauthenticated Cloud Run service is hosted in `ideaslab-gcp` (`us-central1`). It serves
the static Vite build; session analysis runs in the browser, so production has no upload or
GPU-inference backend.

## Reproduce a deployment

The repository contains the complete static-service definition:

- [`web/Dockerfile`](../web/Dockerfile) builds with `npm ci` and serves the app through nginx on
  Cloud Run's required port 8080.
- [`web/nginx.conf`](../web/nginx.conf) handles SPA routes and static caching. It deliberately does
  not emit `Origin-Agent-Cluster: ?0`, which would prevent WebMCP registration.
- [`scripts/deploy-gcp.sh`](../scripts/deploy-gcp.sh) deploys from source.

With authenticated gcloud and a billing-enabled project:

```bash
GCP_PROJECT_ID=ideaslab-gcp \
GCP_REGION=us-central1 \
GCP_SERVICE_NAME=pitchlab-webmcp \
./scripts/deploy-gcp.sh
```

The script prints the canonical service URL. The service is public by design for hackathon judges;
review billing and access settings before using this configuration with non-demo data.

## Final-candidate verification record

On 2026-09-01 at 15:17:15 UTC, revision `pitchlab-webmcp-00011-26x` became ready and received 100%
of traffic. Its application source milestone is commit
`7e0561d7ed766c5d9a6e4adaf084c561829423a0` (`release: qualify two-session evidence review`).
Documentation-only commits after that milestone do not alter the deployed web artifact.

Observed against the stable URL:

- HTTPS application shell: `200`; secure top-level document; no iframe dependency.
- Headers omit `Origin-Agent-Cluster: ?0` and include `X-Content-Type-Options: nosniff`.
- The public index contains exactly the cleared `delivery-02` Pexels session and attributed
  `delivery-03` CC BY-SA 4.0 Wikimedia derivative.
- `delivery-02.json` returned `200`, `application/json`, 947,715 bytes; a range request for its MP4
  returned `206` with a total object size of 31,778,448 bytes.
- `delivery-03.json` returned `200`, `application/json`, 802,942 bytes.
- A range request for `delivery-03.mp4` returned `206`; total object size is 6,781,930 bytes.
- Removed-session JSON/video and an internal upload-recovery URL returned `404`.
- A clean render loaded the synchronized 16:9 source, 3D reconstruction, event anchors,
  measurements, annotations and top-left aspect-preserving resize control without runtime errors.
- Manual event confirmation visibly changed the control to `Confirmed f120`, marked the event
  reviewed and announced that measurements and agent reads were updated.
- Both session `i` cards rendered creator, source, license and modification/provenance information.

### Post-deployment WebMCP retest

In a fresh **Google Chrome for Testing 154.0.8035.0** profile with native WebMCP enabled,
`document.modelContext` was present and exactly 13 unique tools registered (nine reads/four writes).
All 13 completed; reload again produced exactly 13 with no stale registration. Plain object handler
results were accepted, so the centralized `toolResult()` return shape was not changed.

The critical chain visibly completed before each tool result:

1. inspect the left-handed Wikimedia session;
2. seek from foot contact f95 to ball release f127;
3. focus the throwing left elbow in the sagittal view;
4. disable the motion trail, changing five visible layers to four;
5. create a persistent f127 left-elbow annotation and revisit it after seeking away.

A UI correction of MER to f121 was returned by `get_phase_events` with
`manualOverride: true`. Invalid events returned structured recovery values. Elbow valgus torque
returned an unavailable response explaining the missing force data/inverse dynamics and did not
invent a number. The focused elbow visibly showed the supported shoulder→elbow→wrist geometry,
straight-arm reference and flexion arc/value. `compare_pitches` returned `descriptive_only`, an
unavailable better/worse ranking and the athlete/camera/timebase/protocol compatibility caveats.
There were no console errors, page errors or failed requests.

Full per-tool output sizes and client caveats are recorded in
[`evals/webmcp-live-checklist.md`](../evals/webmcp-live-checklist.md). The remaining release gate is
an owner-observed natural-language repeat in ChatGPT's in-app browser against this exact revision;
do not claim final ChatGPT compatibility until that run is recorded.
