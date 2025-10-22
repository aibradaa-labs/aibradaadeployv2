// AI POD runtime — minimal, safe, and namespaced
const DEFAULT_PROXY = "/api/ai";

let __AIPOD_LAST_FAIL_AT = 0;
const __AIPOD_FAIL_COOLDOWN_MS = 15000;

async function callGemini(task, system, user, schema, opts = {}) {
  const key = (typeof localStorage !== 'undefined') ? localStorage.getItem('GEMINI_API_KEY') : null;

  let userModel = (typeof localStorage !== 'undefined' && localStorage.getItem('GEMINI_MODEL')) || '';
  // Force to 2.5 family only; ignore any prior 1.5 selections
  if (userModel && !/^gemini-2\.5-(flash|pro)/.test(userModel)) userModel = '';
  const preferredVersion = (() => {
    try { return (localStorage.getItem('GEMINI_API_VERSION') || 'v1beta').toLowerCase().trim(); }
    catch (e) { return 'v1beta'; }
  })();
  const versionMode = preferredVersion === 'v1'
    ? 'v1'
    : preferredVersion === 'both'
      ? 'both'
      : 'v1beta';
  const versions = versionMode === 'both'
    ? ['v1beta', 'v1']
    : versionMode === 'v1'
      ? ['v1']
      : ['v1beta'];

  const modelCandidates = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    userModel
  ].filter(Boolean);
  const models = [...new Set(modelCandidates)];

  const responseMime = schema?.responseMimeType || schema?.response_mime_type || null;
  const segments = [];
  if (system) segments.push(String(system));
  if (user) segments.push(String(user));
  const userText = segments.join('\n\n') || '';
  const baseBody = {
    contents: [{ role: 'user', parts: [{ text: userText }]}]
  };

  let lastErr = null;
  for (const model of models) {
    for (const version of versions) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
      const variants = version === 'v1'
        ? ['minimal']
        : ['snake', 'minimal'];
      for (const variant of variants) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), opts.timeout ?? 12000);

          const body = {
            contents: JSON.parse(JSON.stringify(baseBody.contents))
          };
          if (variant === 'snake') {
            if (system) body.system_instruction = { role: 'system', parts: [{ text: String(system) }] };
            if (responseMime) body.generation_config = { response_mime_type: responseMime };
          }

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key, 'Accept': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
          });
          clearTimeout(timeout);

          if (!res.ok) {
            let errMsg = '';
            try { const ej = await res.json(); errMsg = ej?.error?.message || ''; }
            catch (err) { void 0; }
            const formatted = `gemini_http_${res.status}${errMsg ? ': ' + errMsg : ''}`;
            lastErr = new Error(formatted);
            console.warn('[AI POD] Gemini error', { model, version, variant, status: res.status, message: errMsg });
            if (res.status === 400 || res.status === 404 || res.status === 429 || res.status === 500 || res.status === 503) {
              continue; // try next variant / combination
            }
            throw lastErr;
          }

          const json = await res.json();
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? json?.text ?? JSON.stringify(json);
          return { ok: true, data: text };
        } catch (error) {
          lastErr = error;
          // try next variant or combination
        }
      }
    }
  }

  __AIPOD_LAST_FAIL_AT = Date.now();
  throw lastErr || new Error('gemini_unknown_error');
}

// Removed all mock responses for production

function shouldBypassProxy() {
  if (window.__AI_POD_FORCE_PROXY) return false;
  const proxy = window.__AI_POD_PROXY__;
  if (proxy === false || proxy === "mock") return true;
  const protocol = window.location?.protocol ?? "";
  if (protocol === "file:") return true;
  const host = window.location?.hostname ?? "";
  const port = window.location?.port ?? "";
  if ((host === "127.0.0.1" || host === "localhost") && (port === "" || port === "5500")) {
    return proxy == null; // only auto-bypass when default proxy would be used
  }
  return false;
}

export const AI_POD = {
  flags: (window.BRADAA_FLAGS ??= { AIPOD: true, INTEL: true, TELEMETRY: false }),
  persona: { voice: "direct, Malaysian tone, no fluff", product: "AI Bradaa" },
  provider: {
    async call(task, system, user, schema, opts = {}) {
      // Cooldown after repeated failures to avoid console/network flood
      if (Date.now() - __AIPOD_LAST_FAIL_AT < __AIPOD_FAIL_COOLDOWN_MS) {
        return { ok: false, error: new Error('cooldown'), data: null };
      }
      const meta = (opts && opts.meta) || {};
      const shouldTrack = !!meta.track && !meta.silent;
      const callId = `aipod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
      if (shouldTrack) {
        try { window.dispatchEvent(new CustomEvent('aipod:task', { detail: { id: callId, state: 'start', task, scope: meta.scope || 'deck', label: meta.label || task } })); } catch (e) { void 0; }
      }
      // If a local Gemini API key is present, prefer direct Gemini call for dev/Netlify static deploys
      try {
        const hasKey = typeof localStorage !== 'undefined' && !!localStorage.getItem('GEMINI_API_KEY');
        if (hasKey) {
          const res = await callGemini(task, system, user, schema, opts);
          if (shouldTrack) { try { window.dispatchEvent(new CustomEvent('aipod:task', { detail: { id: callId, state: 'end', ok: !!res?.ok } })); } catch (e) { void 0; } }
          return res;
        }
      } catch (e) { void 0; }
      if (shouldBypassProxy()) return { ok: false, error: new Error('ai_provider_not_configured'), data: null };

      const proxyUrl = typeof window.__AI_POD_PROXY__ === "string" && window.__AI_POD_PROXY__.length
        ? window.__AI_POD_PROXY__
        : DEFAULT_PROXY;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), opts.timeout ?? 12000);
        const res = await fetch(proxyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task, system, user, schema, opts }),
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`proxy ${res.status}`);
        const out = await res.json();
        if (shouldTrack) { try { window.dispatchEvent(new CustomEvent('aipod:task', { detail: { id: callId, state: 'end', ok: true } })); } catch (e) { void 0; } }
        return out;
      } catch (error) {
        console.warn("[AI POD] proxy error:", error.message);
        __AIPOD_LAST_FAIL_AT = Date.now();
        if (shouldTrack) { try { window.dispatchEvent(new CustomEvent('aipod:task', { detail: { id: callId, state: 'end', ok: false } })); } catch (e) { void 0; } }
        return { ok: false, error, data: null };
      }
    }
  },
  telemetry: {
    emit: (name, detail = {}) => {
      if (!AI_POD.flags.TELEMETRY) return;
      window.dispatchEvent(new CustomEvent("syeddy:event", { detail: { name, ...detail } }));
    }
  }
};

window.AI_POD = window.AI_POD ?? AI_POD;
export default AI_POD;
