(function(){
  if (!window.AI_POD?.mobile) return;
  async function fetchIntel(){
    try {
      await window.API_MODULE?.fetchMarketIntel?.();
    } catch (error) {
      console.warn('[AI POD] android background fetch failed', error?.message ?? error);
    }
  }
  window.AI_POD.mobile.background = window.AI_POD.mobile.background || {};
  window.AI_POD.mobile.background.androidFetchIntel = fetchIntel;
})();
