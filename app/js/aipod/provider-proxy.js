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
      const text = [systemPrompt || '', userPrompt || ''].filter(Boolean).join('\n\n');
      const adapter = window.AI_POD?.callAI;
      if (typeof adapter !== 'function') {
        return Promise.resolve({ ok: false, error: 'ai_adapter_missing' });
      }
      return adapter({ provider: 'gemini', model, payload: { prompt: text, topic } })
        .then(result => ({
          ok: result?.ok !== false,
          mocked: !!result?.mocked,
          data: result?.output?.text ?? result?.raw?.text ?? '',
          model: result?.model || model,
          raw: result
        }))
        .catch(e => ({ ok: false, error: String(e && e.message || e) }));
    } catch (e) {
      return Promise.resolve({ ok: false, error: String(e && e.message || e) });
    }
  }
  window.AI_POD.provider = { call };
  if (!window.__AI_POD_PROXY__) window.__AI_POD_PROXY__ = '/.netlify/functions/ai';
})();
