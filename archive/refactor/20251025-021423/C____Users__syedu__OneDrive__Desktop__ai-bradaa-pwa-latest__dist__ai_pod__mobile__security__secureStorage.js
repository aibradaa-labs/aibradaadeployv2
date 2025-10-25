(function(){
  if (!window.AI_POD?.mobile) return;
  const isCap = !!window.Capacitor;
  const SECURE = window.Capacitor?.Plugins?.SecureStoragePlugin;
  const storage = {
    async get(key){ try { if (SECURE) { const { value } = await SECURE.get({ key }); return value; } return localStorage.getItem(key); } catch { return null; } },
    async set(key, value){ try { if (SECURE) return SECURE.set({ key, value: String(value||'') }); localStorage.setItem(key, String(value||'')); } catch {} },
    async remove(key){ try { if (SECURE) return SECURE.remove({ key }); localStorage.removeItem(key); } catch {} }
  };
  window.AI_POD.mobile.storage.secure = storage;
})();
