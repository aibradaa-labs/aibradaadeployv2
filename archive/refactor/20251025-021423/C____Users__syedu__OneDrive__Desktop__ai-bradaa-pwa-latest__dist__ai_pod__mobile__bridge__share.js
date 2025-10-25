(function(){
  if (!window.AI_POD?.mobile) return;
  const share = {};
  share.receive = async function(payload){
    try {
      const outEl = document.getElementById('matchmaker-output') || document.getElementById('toolkit-console');
      const text = (payload?.text || payload?.url || '[shared]');
      const safe = (window.API_MODULE?.sanitizeForOutput ? window.API_MODULE.sanitizeForOutput(text) : String(text));
      if (window.API_MODULE?.renderAIResponseProto) window.API_MODULE.renderAIResponseProto(outEl, safe);
      else if (outEl) outEl.textContent = safe;
      try { window.aiPodTelemetry?.emit?.('mobile.share.receive', { kind: payload?.kind || 'unknown', ts: new Date().toISOString() }); } catch {}
    } catch {}
  };
  share.send = async function({ text, url }){
    try {
      if (navigator.share) { await navigator.share({ text, url }); return true; }
    } catch {}
    return false;
  };
  window.AI_POD.mobile.share = share;
})();
