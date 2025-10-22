# Architecture Overview

- App entry: `/app/index.html` (root `index.html` is a stub forwarder).
- PWA: `/pwa/manifest.json`, `/pwa/service-worker.js` (scope "/").
- AI: `/ai/providers` (adapters), `/ai/deck` (deck UI only).
- Governance: `/governance` (schemas, policies, playbooks, templates, reports).
- Tests: `/tests` (axe, lighthouse, e2e, deck, fixtures).
- Scripts: `/scripts` (schema_validate, prompt_lint, secrets_scan, data_ttl_sweeper, migrate, rollback, link_check).
- Infra: `/infra/ci/pipeline.yml` (Node 20 gates).

Decisions recorded in `docs/adrs/`.
