(function(){
  if (!window.AI_POD?.mobile) return;
  const isCap = !!window.Capacitor;
  const STORAGE_KEY = 'AIPOD_OFFLINE_QUEUE_V1';
  async function read(){
    try {
      if (isCap && window.Capacitor.Plugins?.SecureStoragePlugin) {
        const { value } = await window.Capacitor.Plugins.SecureStoragePlugin.get({ key: STORAGE_KEY });
        return JSON.parse(value || '[]');
      }
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  }
  async function write(arr){
    const s = JSON.stringify(arr.slice(-50));
    try {
      if (isCap && window.Capacitor.Plugins?.SecureStoragePlugin) {
        await window.Capacitor.Plugins.SecureStoragePlugin.set({ key: STORAGE_KEY, value: s });
      } else {
        localStorage.setItem(STORAGE_KEY, s);
      }
    } catch {}
  }
  const queue = {
    async enqueue(item){ const arr = await read(); arr.push({ ...item, ts: Date.now() }); await write(arr); },
    async drain(handler){ const arr = await read(); const out=[]; for (const it of arr){ try { await handler(it); } catch { out.push(it); } } await write(out); return arr.length - out.length; }
  };
  window.AI_POD.mobile.queue = queue;
})();
