(function(){
  // Marketplaces link builders (MY-first) — keeps UI pixels same, only hrefs change
  function isValidUrl(u){
    try { const x = new URL(u); return !!x.protocol && !!x.host; } catch { return false; }
  }
  function modelString(l){ return `${l.brand || ''} ${l.model || ''}`.trim(); }

  function shopeeSearch(q){
    return `https://shopee.com.my/search?keyword=${encodeURIComponent(q)}`;
  }
  function lazadaSearch(q){
    return `https://www.lazada.com.my/catalog/?q=${encodeURIComponent(q)}`;
  }
  function tiktokSearch(q){
    return `https://www.tiktok.com/search?q=${encodeURIComponent(q + ' Malaysia laptop')}`;
  }

  const api = { isValidUrl, shopeeSearch, lazadaSearch, tiktokSearch, modelString };
  if (typeof window !== 'undefined') window.Marketplaces = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
