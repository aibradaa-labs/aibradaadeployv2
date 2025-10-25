(function(){
  if (!window.AI_POD?.mobile) return;
  // Placeholder: BGTaskScheduler fetch handler (iOS). To be wired in native shell.
  async function fetchIntel(){ try { await window.API_MODULE?.fetchMarketIntel?.(); } catch {} }
  window.AI_POD.mobile.background = window.AI_POD.mobile.background || {};
  window.AI_POD.mobile.background.iosFetchIntel = fetchIntel;
})();
