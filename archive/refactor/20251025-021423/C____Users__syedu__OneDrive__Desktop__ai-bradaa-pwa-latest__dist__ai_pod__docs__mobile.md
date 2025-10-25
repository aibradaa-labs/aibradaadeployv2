# AI POD Mobile Readiness (Apps-first)

- Bridge globals exposed under `window.AI_POD.mobile.*`.
- Deep links: files under `ai_pod/mobile/deeplinks/` (customize package IDs/domains before release).
- Secure storage: `ai_pod/mobile/security/secureStorage.js` (Capacitor Secure Storage if available; falls back to localStorage).
- Offline queue: `ai_pod/mobile/bridge/offlineQueue.js` with 50 item cap.
- Gemini usage: `ai_pod/clients/geminiClient.js` hitting `/.netlify/functions/ai` with retries + circuit-breaker.
- Background tasks: stubs in `ai_pod/mobile/background/*` (to be wired natively).
- Share hooks: `ai_pod/mobile/bridge/share.js` receives/sends payloads.
- Shortcuts/App Intents: samples in `ai_pod/mobile/shortcuts/`.

## Deep link routes
- `?route=matchmaker&q=...` → scrolls to Matchmaker and prefills query.
- `?route=versus` → scrolls to Versus.
- `?route=explore` → scrolls to Explorer.

## Security & PDPA
- No API keys in client. Use the Netlify function proxy.
- Non-PII telemetry only. Suggested retention: ttl_days=14.

## Build
- Capacitor config at `ai_pod/mobile/config/capacitor.config.json`.
- CI static checks: `npm run mobile:check`.
