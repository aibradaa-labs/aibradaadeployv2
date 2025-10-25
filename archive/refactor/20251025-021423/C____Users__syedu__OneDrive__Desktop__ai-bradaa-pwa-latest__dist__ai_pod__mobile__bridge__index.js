(function(){
  if (!window.AI_POD) window.AI_POD = {};
  if (!window.AI_POD.mobile) window.AI_POD.mobile = {};
  const mobile = window.AI_POD.mobile;
  try { mobile.env = { platform: (window.Capacitor ? 'capacitor' : 'web') }; } catch { mobile.env = { platform: 'web' }; }
  // Namespaced registries
  mobile.bridge = mobile.bridge || {};
  mobile.deeplink = mobile.deeplink || {};
  mobile.share = mobile.share || {};
  mobile.storage = mobile.storage || {};
  mobile.queue = mobile.queue || {};
})();
