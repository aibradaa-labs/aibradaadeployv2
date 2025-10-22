# Provider Adapter Spec

## Interface
- `init(opts)` → initialize provider. Pure function, idempotent.
- `call({ systemText, userText, json=false, schema=null, temperature=0.7, timeoutMs })` → Promise<{ model, text, raw }>.
- `stream(req)` → Async iterator of tokens (optional).
- `cancel(token)` → cancel in-flight (optional).
- `backoff(meta)` → jitter/backoff strategy on 429/5xx (optional).

## Errors
- Throw `NO_API_KEY`, `HTTP_###`, `TIMEOUT_TOTAL` consistently.

## Notes
- Vendor-agnostic; avoid UI in this layer.
- Use Asia/Kuala_Lumpur timestamps in prompts where relevant.
