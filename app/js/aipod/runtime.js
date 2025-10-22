// AI POD: runtime namespace
export const AI_POD = {
  persona: {
    voice: 'Direct, Malaysia-first, BM/EN parity, no fluff',
    ui: {
      thinking: { en: 'Thinking…', ms: 'Sedang fikir…' },
      ready:    { en: 'Ready',      ms: 'Sedia' }
    }
  },
  tokens: {
    colors: { teal: '#00E5FF', violet: '#7A5CFF', rose: '#FF4D8C', amber: '#FFB020' },
    radius24: '24px',
    glowWeak: '0 0 24px rgba(0,255,224,.35)'
  },
  prompts: {
    ui: {
      intro: { en: 'AI Bradaa is crunching the playbook for you.', ms: 'AI Bradaa sedang sediakan pelan untuk anda.' }
    },
    intelGlobalMY: `Task: Produce 3 timely consumer-tech headlines (global). For each, return strict JSON fields:\n{"intelligence":[{ "title": "...", "summary":"...", "link":"https://...", "verdict":"SOLID|WAIT|HYPE", "status":{"my_eta":"MMM YYYY or ISO date"}}]}\nUse MYR if quoting price. Timezone Asia/Kuala_Lumpur.`,
    intelMYOnly: `Malaysia market only, consumer-facing. Return:\n{"intelligence":[{ "title":"...", "summary":"(≤1 sentence)", "verdict":"SOLID|WAIT|HYPE", "source":"https://..." }]} Timezone Asia/Kuala_Lumpur.`
  },
  telemetry: {
    emit(name, detail = {}) {
      if (!window.BRADAA_FLAGS?.TELEMETRY) return;
      const payload = { name, t: Date.now(), tz: 'Asia/Kuala_Lumpur', ...detail };
      window.dispatchEvent(new CustomEvent('syeddy:event', { detail: payload }));
      if (navigator.sendBeacon) {
        try { navigator.sendBeacon('/api/telemetry', new Blob([JSON.stringify(payload)], { type: 'application/json' })); } catch {}
      }
    },
    enqueue: (e) => AI_POD.telemetry.emit('queue', e)
  },
  provider: {
    async call(task, system, user, schema, opts = {}) {
      // Try proxy first
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15000);
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ task, system, user, schema }),
          signal: ctrl.signal
        });
        clearTimeout(to);
        if (res.ok) return await res.json();
      } catch {}
      // Fallback mock to keep UI alive
      return { ok: true, data: `[[mock]] ${task} — ${new Date().toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })}` };
    }
  }
};
window.AI_POD = AI_POD;
export default AI_POD;
