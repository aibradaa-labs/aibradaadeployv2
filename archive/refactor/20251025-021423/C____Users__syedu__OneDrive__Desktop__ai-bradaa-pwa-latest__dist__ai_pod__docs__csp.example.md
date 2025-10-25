# AI POD Content Security Policy (CSP) — Example Template

Apply as <meta http-equiv="Content-Security-Policy" ...> in HTML during development, then move to an HTTP response header in production. This policy is tuned for the current PWA while allowing incremental hardening.

Recommended baseline (copy into <head>):

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self' https: data: blob:;
  base-uri 'self';
  frame-ancestors 'none';
  object-src 'none';
  form-action 'self';
  img-src 'self' https: data: blob:;
  font-src 'self' https: data:;
  media-src 'self' https: data: blob:;
  connect-src 'self' https: blob:;
  script-src 'self' https://cdnjs.cloudflare.com 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  upgrade-insecure-requests;">
```

Notes
- Keep 'unsafe-inline' temporarily due to inline <script> and <style>. Replace with nonces or hashes in a later hardening step.
- Add additional CDNs explicitly to `script-src`/`style-src` if needed.
- Prefer moving this policy to an HTTP header for stronger enforcement.
- Pair with SRI for remote scripts/styles.

SRI Injection Flow
- Maintain `/ai_pod/docs/sri-manifest.example.json` with URL → integrity mappings.
- Use a small build step to inject `integrity` and `crossorigin="anonymous"` attributes for known CDN tags.
- If integrity mismatches, block load as defense-in-depth.

PDPA & Telemetry
- Telemetry must be non‑PII and routed via AI POD. Do not include identifiers.
- Use MYT timestamps and provide BM/EN copy in visible UI.
