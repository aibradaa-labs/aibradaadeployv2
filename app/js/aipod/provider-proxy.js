(function(){
  if (!window.AI_POD) window.AI_POD = {};
  window.AI_POD.clients = window.AI_POD.clients || {};
  const PRIMARY_MODEL = 'gemini-2.5-pro';
  const FALLBACK_MODEL = 'gemini-2.5-flash';
  const ALLOWED_MODELS = new Set([PRIMARY_MODEL, FALLBACK_MODEL]);

  function call(topic, systemPrompt, userPrompt, _generationConfig, _opts){
    try {
      let model = localStorage.getItem('GEMINI_MODEL') || PRIMARY_MODEL;
      if (!ALLOWED_MODELS.has(model)) model = PRIMARY_MODEL;
      const baseUrl = window.__AI_POD_PROXY__ || '/.netlify/functions/ai';
      const text = [systemPrompt || '', userPrompt || ''].filter(Boolean).join('\n\n');
      const client = window.AI_POD.clients.gemini;
      if (!client?.call) return Promise.resolve({ ok: false, error: 'gemini_client_missing' });
      return client.call(model, { text }, { baseUrl, fallbackSequence: [PRIMARY_MODEL, FALLBACK_MODEL] })
        .then(r => ({ ok: true, data: { text: r?.text || '' }, model: r?.model || model }))
        .catch(e => ({ ok: false, error: String(e && e.message || e) }));
    } catch (e) {
      return Promise.resolve({ ok: false, error: String(e && e.message || e) });
    }
  }
  window.AI_POD.provider = { call };
  if (!window.__AI_POD_PROXY__) window.__AI_POD_PROXY__ = '/.netlify/functions/ai';
})();
