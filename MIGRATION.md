# Stage-2 Restructure Migration

Branch: `stage-2-restructure`
Date: 2025-10-05 00:11 (Asia/Kuala_Lumpur)

## Plan
- Commit A: Add target tree and import rewrites using `git mv`. Add CI gates, governance, scripts, tests, and Netlify config.
- Commit B: Remove legacy paths after all acceptance checks pass on PR.

## Moves
- `manifest.json` → `pwa/manifest.json`
- `service-worker.js` → `pwa/service-worker.js`
- `lib/ai/geminiClient.js` → `ai/providers/geminiClient.js`
- `lib/ui/replyModalDeck.js` → `ai/deck/replyModalDeck.js`
- `lib/ui/replyDeck.js` → `ai/deck/replyDeck.js`
- `index.html` → `app/index.html`

## Root Index Guard
- Root `index.html` becomes a minimal forwarder to `/app/index.html`.

## Acceptance (run in order)
1. `node -v` → v20.x
2. `npm i --save-dev puppeteer @axe-core/puppeteer lighthouse ajv ajv-formats yaml http-server`
3. `node scripts/schema_validate.mjs "Master Operation Config.yaml"` → `[schema] OK`
4. `node scripts/prompt_lint.mjs tests/fixtures/deck_sample.md` → `[prompt_lint] OK`
5. `node scripts/secrets_scan.mjs` → no matches
6. `node tests/a11y/axe.smoke.mjs` → `a11y violations: 0`
7. `node tests/perf/run-lh.mjs` → budgets met; writes `tests/perf/lh.json`
8. `node tests/deck/telemetry-harvest.mjs` → events include deckSlides, timeToTLDR, abortCount, CLS, INP
9. `node scripts/link_check.mjs` → OK (no legacy path refs)

## Rollback
- Preferred: `git revert` of the merge commit.
- Helper: `node scripts/rollback.mjs` (removes moved targets; not needed if you revert).
