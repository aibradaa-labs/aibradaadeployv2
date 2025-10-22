(function(){
  if (!window.AI_POD?.mobile) return;
  // Placeholder: WorkManager periodic work (Android). To be wired in native shell.
  async function fetchIntel(){ try { await window.API_MODULE?.fetchMarketIntel?.(); } catch {} }
  window.AI_POD.mobile.background = window.AI_POD.mobile.background || {};
  window.AI_POD.mobile.background.androidFetchIntel = fetchIntel;
})();
