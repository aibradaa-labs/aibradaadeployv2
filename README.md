# AI Bradaa PWA

Malaysia-first PWA with AI Bradaa (VAB) persona. Built for lean, scalable execution with PDPA-safe defaults.

## Quick start

1. Install Node (LTS).
2. In this folder: `npm install`
3. Build static bundle: `npm run build`
4. Preview locally (after build): `npm run serve`

> Check package.json → "scripts" to confirm/adjust the commands above.

## PDPA / Safety

- No secrets in repo (.env ignored).
- Minimum data collection; Barakah-safe examples.
- Logs exclude personal data by default.

## Structure (high level)

- `src/` — app code
- `functions/` or `api/` — backend handlers (if present)
- `tests/` — unit tests
