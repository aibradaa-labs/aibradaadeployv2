(function(){
  // Gemini Client — unified v1beta adapter (2.5 models, header-auth only)
  // Correct payload: systemInstruction + contents (no "role"), generationConfig for JSON mode
  
  const GEMINI_MODELS = [
    'gemini-2.5-flash', // primary
    'gemini-2.5-pro'    // quality fallback
  ];

  const DIRECT_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';
  const PROXY_ENDPOINT = '/.netlify/functions/ai';
  const DEFAULT_TIMEOUT = 70000; // 70s balanced for mobile + desktop
  const PRECHECK_TIMEOUT = 8000; // 8s

  function getApiKey() {
    if (typeof window !== 'undefined') {
      try { return self.GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY') || ''; } catch { return ''; }
    }
    return '';
  }

  // --- Routing & Transport Helpers -----------------------------------------
  function extractTextFromData(data) {
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  function setRouteProxy() {
    // Do not force proxy on localhost/dev where proxy is unavailable
    try {
      if (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) return;
      sessionStorage.setItem('AI_ROUTE', 'proxy');
    } catch (e) { /* noop */ }
  }
  function clearRoutePref() {
    try { sessionStorage.removeItem('AI_ROUTE'); } catch (e) { /* noop */ }
  }
  function prefersProxy() {
    try {
      const wants = sessionStorage.getItem('AI_ROUTE') === 'proxy';
      // Only prefer proxy if environment supports it
      return wants && HAS_PROXY;
    } catch { return false; }
  }

  async function preflightDirect(key) {
    if (self.__aiPreflightDone) return;
    self.__aiPreflightDone = true;
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), PRECHECK_TIMEOUT);
      const res = await fetch(DIRECT_ENDPOINT, {
        method: 'GET',
        headers: { 'x-goog-api-key': key },
        signal: ctrl.signal
      });
      clearTimeout(to);
      if (!self.__aiRouteLogged) { console.info('AI route → direct'); self.__aiRouteLogged = true; }
      return res.ok || res.status >= 200;
    } catch (e) {
      setRouteProxy();
      if (!self.__aiRouteLogged) { console.info('AI route → proxy (direct path timed out)'); self.__aiRouteLogged = true; }
      return false;
    }
  }

  async function callDirect(body, model, { timeoutMs = DEFAULT_TIMEOUT } = {}) {
    const key = getApiKey();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${DIRECT_ENDPOINT}/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      const status = res.status;
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, route: 'direct', status, errorBody: text };
      }
      const data = await res.json();
      return { ok: true, route: 'direct', status, data, text: extractTextFromData(data) };
    } finally {
      clearTimeout(timeout);
    }
  }

  const HAS_PROXY = (()=>{
    try {
      if (typeof location === 'undefined') return true;
      if (document?.documentElement?.dataset?.netlify === '1') return true;
      if (/\.netlify\.app$/.test(location.hostname)) return true;
      return !(location.hostname === 'localhost' || location.hostname === '127.0.0.1');
    } catch { return true; }
  })();

  async function callProxy(req, model, { timeoutMs = DEFAULT_TIMEOUT } = {}) {
    if (!HAS_PROXY) {
      if (!self.__proxyDisabledLogged) {
        console.info('AI proxy disabled → running direct-only (localhost)');
        self.__proxyDisabledLogged = true;
      }
      return { ok: false, route: 'proxy', status: 405, errorBody: 'proxy_disabled' };
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          systemText: req.systemText || '',
          userText: req.userText,
          json: !!req.json,
          schema: req.schema || null,
          temperature: req.temperature
        }),
        signal: controller.signal
      });
      const status = res.status;
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, route: 'proxy', status, errorBody: text };
      }
      const data = await res.json();
      const text = data?.text ?? extractTextFromData(data);
      return { ok: true, route: 'proxy', status, data, text };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Call Gemini with unified v1beta payload
   * @param {Object} options
   * @param {string} options.systemText - System instruction (optional)
   * @param {string} options.userText - User prompt (required)
   * @param {boolean} options.json - Use JSON output mode (default: false)
   * @param {Object} options.schema - JSON schema for structured output (optional)
   * @param {number} options.temperature - Sampling temperature 0-1 (default: 0.7)
   * @param {number} options.timeoutMs - Request timeout (default: DEFAULT_TIMEOUT)
   * @example
   *   // Text mode
   *   const { text } = await callGemini({ systemText: 'You are...', userText: 'Question?', json: false });
   *   // JSON mode
   *   const { text } = await callGemini({ userText: 'Generate JSON...', json: true });
   *   const data = JSON.parse(text);
   */
  async function callGemini({ 
    systemText = '', 
    userText, 
    json = false, 
    schema = null, 
    temperature = 0.7, 
    timeoutMs = DEFAULT_TIMEOUT 
  }) {
    const key = getApiKey();
    if (!key) throw new Error('NO_API_KEY');

    // Build v1beta-compliant payload (no "role" in contents)
    const body = {
      contents: [{ parts: [{ text: String(userText ?? '') }] }],
      generationConfig: { temperature }
    };
    if (systemText) body.systemInstruction = { parts: [{ text: String(systemText) }] };
    if (json) {
      body.generationConfig.responseMimeType = 'application/json';
      if (schema) body.generationConfig.responseSchema = schema;
    }

    // Proxy request mirror
    const proxyReq = { systemText, userText, json, schema, temperature };

    // Preflight connectivity once to set route preference
    if (!prefersProxy()) await preflightDirect(key);

    const started = performance.now ? performance.now() : Date.now();
    let lastErr;
    for (const model of GEMINI_MODELS) {
      const tryDirectFirst = !prefersProxy();
      try {
        if ((performance.now ? performance.now() : Date.now()) - started > DEFAULT_TIMEOUT * 1.35) {
          throw new Error('TIMEOUT_TOTAL');
        }
        if (tryDirectFirst) {
          const r = await callDirect(body, model, { timeoutMs });
          if (r.ok) {
            if (!self._geminiOK) { console.info('Gemini OK →', model); self._geminiOK = true; }
            return { model, text: r.text, raw: r.data };
          }
          // Transient errors go proxy; 4xx should throw
          if (r.status === 429 || r.status >= 500) {
            // fallthrough to proxy
          } else {
            const msg = `HTTP_${r.status}`;
            console.warn(`Gemini fail → route:direct model:${model} status:${r.status} json:${json}`);
            throw new Error(msg);
          }
        }

        // Proxy path
        const p = await callProxy(proxyReq, model, { timeoutMs });
        if (p.ok) {
          setRouteProxy();
          if (!self.__aiRouteLogged) { console.info('AI route → proxy (direct path timed out)'); self.__aiRouteLogged = true; }
          if (!self._geminiOK) { console.info('Gemini OK →', model); self._geminiOK = true; }
          return { model, text: p.text, raw: p.data };
        }
        // If proxy also failed and it's transient, try next model
        if (p.status === 405 && p.errorBody === 'proxy_disabled') {
          // Proxy unavailable (localhost). Clear route pref and try direct immediately for this model.
          clearRoutePref();
          const r2 = await callDirect(body, model, { timeoutMs });
          if (r2.ok) {
            if (!self._geminiOK) { console.info('Gemini OK →', model); self._geminiOK = true; }
            return { model, text: r2.text, raw: r2.data };
          }
          if (r2.status === 429 || r2.status >= 500) { continue; }
          throw new Error(`HTTP_${r2.status}`);
        } else {
          console.warn(`Gemini fail → route:proxy model:${model} status:${p.status} json:${json}`);
          lastErr = new Error(`HTTP_${p.status}`);
        }
        if (p.status === 429 || p.status >= 500) { continue; }
        throw lastErr;

      } catch (e) {
        lastErr = e;
        if (e.name === 'AbortError') {
          console.warn(`Gemini fail → route:${prefersProxy() ? 'proxy' : 'direct'} model:${model} status:timeout json:${json}`);
          // If direct timed out, prefer proxy for rest of session
          if (!prefersProxy()) setRouteProxy();
          // Try proxy once if direct timed out
          if (!prefersProxy()) {
            const p = await callProxy(proxyReq, model, { timeoutMs });
            if (p.ok) {
              if (!self.__aiRouteLogged) { console.info('AI route → proxy (direct path timed out)'); self.__aiRouteLogged = true; }
              if (!self._geminiOK) { console.info('Gemini OK →', model); self._geminiOK = true; }
              return { model, text: p.text, raw: p.data };
            }
            if (p.status === 405 && p.errorBody === 'proxy_disabled') {
              continue;
            }
            console.warn(`Gemini fail → route:proxy model:${model} status:${p.status} json:${json}`);
            if (p.status === 429 || p.status >= 500) { continue; }
            throw new Error(`HTTP_${p.status}`);
          }
        } else if (e.message === 'TIMEOUT_TOTAL') {
          throw e;
        } else if (e.message && e.message.startsWith('HTTP_4')) {
          throw e;
        }
      }
    }
    throw lastErr || new Error('UNKNOWN_ERROR');
  }

  // UMD-lite export
  const api = { callGemini };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.GeminiClient = api;
})();
