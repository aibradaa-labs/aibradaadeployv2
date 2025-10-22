(function(){
  if (!window.AI_POD?.mobile) return;
  const api = window.AI_POD.mobile;
  function parse(loc){
    try {
      const u = new URL(loc.href);
      const route = u.searchParams.get('route') || u.hash.replace(/^#/, '');
      const q = u.searchParams.get('q') || '';
      return { route, q };
    } catch { return { route: '', q: '' }; }
  }
  function scrollTo(id){
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  api.deeplink.route = function(loc){
    const { route, q } = parse(loc || window.location);
    if (!route) return false;
    const map = { matchmaker: 'matchmaker', versus: 'comparison', explore: 'explorer' };
    const target = map[route.toLowerCase()] || route;
    scrollTo(target);
    // Prefill minimal query for matchmaker
    if (target === 'matchmaker' && q) {
      try { const el = document.getElementById('user-query'); if (el) { el.value = q; el.dispatchEvent(new Event('input', { bubbles: true })); } } catch {}
    }
    try { window.aiPodTelemetry?.emit?.('mobile.deeplink', { route: target, q: q ? !!q : false, ts: new Date().toISOString() }); } catch {}
    return true;
  };
})();
