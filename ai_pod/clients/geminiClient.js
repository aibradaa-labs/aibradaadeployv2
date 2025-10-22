/* Resilient Gemini client for mobile + web shells via serverless proxy */
(function(global){
  function resolveBaseUrl(){
    if (global.__AI_POD_PROXY__) return global.__AI_POD_PROXY__;
    const origin = typeof global.location === 'object' && global.location ? (global.location.origin || '') : '';
    if (/localhost:5500|127\.0\.0\.1:5500/.test(origin) || origin.startsWith('file:')) return 'http://localhost:8888/.netlify/functions/ai';
    return '/.netlify/functions/ai';
  }
  const DEFAULT = {
    baseUrl: resolveBaseUrl(),
    retries: 3,
    baseDelayMs: 300,
    jitter: 0.4,
    backoff: 2.0,
    connectTimeoutMs: 5000,
    overallTimeoutMs: 40000,
    breaker: { windowMs: 60000, openAfter: 5, halfOpenAfterMs: 30000, closeAfter: 2 }
  };
  const state = { fails: [], open: false, halfUntil: 0, successes: 0 };
  if (!global.__AI_POD_PROXY__) global.__AI_POD_PROXY__ = DEFAULT.baseUrl;
  function jitteredDelay(base){ const j = DEFAULT.jitter; return Math.max(50, base * (1 + (Math.random()*2-1)*j)); }
  function now(){ return Date.now(); }
  function recordFail(){ const t = now(); state.fails.push(t); const cutoff = t - DEFAULT.breaker.windowMs; state.fails = state.fails.filter(x => x >= cutoff); if (state.fails.length >= DEFAULT.breaker.openAfter) { state.open = true; state.halfUntil = t + DEFAULT.breaker.halfOpenAfterMs; state.successes = 0; } }
  function recordSuccess(){ state.successes++; if (state.open && state.successes >= DEFAULT.breaker.closeAfter) { state.open = false; state.fails = []; } }
  function breakerAllows(){ if (!state.open) return true; return now() >= state.halfUntil; }
  function withTimeout(promise, ms){ const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort('timeout'), ms); return { run: (fn) => promise(ctrl.signal).then(v => { clearTimeout(t); return fn(v); }).catch(e => { clearTimeout(t); throw e; }), ctrl } }
  async function call(model, input, opts={}){
    if (!breakerAllows()) throw new Error('circuit_open');
    const baseUrl = opts.baseUrl || DEFAULT.baseUrl;
    const fallbackSequence = Array.isArray(opts.fallbackSequence) && opts.fallbackSequence.length
      ? Array.from(new Set(opts.fallbackSequence))
      : Array.from(new Set([model, 'gemini-2.5-pro', 'gemini-2.5-flash']))
          .filter(Boolean)
          .slice(0, 3);
    const seqIndex = typeof opts.__seqIndex === 'number' ? opts.__seqIndex : 0;
    const activeModel = fallbackSequence[seqIndex] || fallbackSequence[0];
    const url = baseUrl + '?model=' + encodeURIComponent(activeModel || model);
    const payload = { input, meta: { source: 'mobile', ts: new Date().toISOString() } };
    let attempt = 0; let lastErr;
    while (attempt <= DEFAULT.retries) {
      const baseDelay = DEFAULT.baseDelayMs * Math.pow(DEFAULT.backoff, attempt);
      try {
        const { run } = withTimeout(async (signal) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal }), DEFAULT.overallTimeoutMs);
        const res = await run(v => v);
        if (!res.ok) throw new Error('http_' + res.status);
        const data = await res.json();
        recordSuccess();
        try { window.aiPodTelemetry?.emit?.('gemini.usage', { modelUsed: data.model || activeModel, ok: true, ts: new Date().toISOString() }); } catch (emitErr) { /* telemetry optional */ }
        return data;
      } catch (e) {
        lastErr = e;
        recordFail();
        if (attempt === DEFAULT.retries) break;
        await new Promise(r => setTimeout(r, jitteredDelay(baseDelay)));
        attempt++;
      }
    }
    const nextIndex = seqIndex + 1;
    if (nextIndex < fallbackSequence.length) {
      return call(fallbackSequence[nextIndex], input, { ...opts, baseUrl, fallbackSequence, __seqIndex: nextIndex, fallback: false });
    }
    try { window.aiPodTelemetry?.emit?.('gemini.usage', { modelUsed: activeModel || model, ok: false, ts: new Date().toISOString(), error: String(lastErr && (lastErr.message||lastErr)) }); } catch (emitErr) { /* telemetry optional */ }
    throw lastErr || new Error('unknown');
  }
  global.AI_POD = global.AI_POD || {}; global.AI_POD.clients = global.AI_POD.clients || {}; global.AI_POD.clients.gemini = { call };
})(window);
