import { STATE } from './state.js';
import { buildPrompts } from './prompts.js';

export function buildAffiliateLink(originalUrl, platform) {
  if (!originalUrl) return '#';
  const { SHOPEE_AFFILIATE_ID } = STATE.affiliate;
  if (platform === 'shopee' && SHOPEE_AFFILIATE_ID) {
    return `${originalUrl}&af_id=${SHOPEE_AFFILIATE_ID}`;
  }
  return originalUrl;
}

export async function fetchMarketIntel() {
  // Layered strategy: Netlify Function -> local JSON -> module fallback -> legacy fallback
  const DEFAULT_IMG = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%231a1a1a%22/%3E%3Ctext x=%22300%22 y=%22205%22 fill=%22%234a4a4a%22 font-family=%22Arial%2CHelvetica%2Csans-serif%22 font-size=%2220%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E';
  const normalizeList = (items) => (Array.isArray(items) ? items : []).map(x => {
    const img = String(x.imageUrl || x.image_url || x.image || '').trim();
    const safeImg = img && !/placehold\.co|placeholder/i.test(img) ? img : DEFAULT_IMG;
    return {
      brand: String(x.brand || 'Unknown'),
      model: String(x.model || 'Unknown Model'),
      price: Number(x.price || 0),
      score: Number(x.score || 0),
      platform: String((x.platform || 'NPU')).toUpperCase(),
      why: String(x.why || x.summary || 'Strategic intel pending.'),
      cpu: String(x.cpu || 'TBD'),
      gpu: String(x.gpu || 'TBD'),
      ram: String(x.ram || 'TBD'),
      storage: String(x.storage || 'TBD'),
      display: String(x.display || 'TBD'),
      scores: x.scores || { ai: 0, thermals: 0, upgrade: 0, linux: 0, portability: 0, value: 0 },
      imageUrl: safeImg,
      price_source_url: x.price_source_url || '#',
      shopee_url: x.shopee_url || null,
      tiktok_url: x.tiktok_url || null,
      lazada_url: x.lazada_url || null,
      best_deal_url: x.best_deal_url || null
    };
  });
  const tryParseItems = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.laptops)) return payload.laptops;
    if (Array.isArray(payload)) return payload;
    return [];
  };
  try {
    // 1) Netlify Function (centralized 73 db)
    const endpoints = ['/.netlify/functions/laptops', '/data/laptops.json'];
    let text = null;
    for (const url of endpoints) {
      try {
        const r = await fetch(url, { cache: 'no-store' });
        if (r.ok) { text = await r.text(); break; }
      } catch (e) { console.debug('fetchMarketIntel endpoint failed:', url, e?.message || e); }
    }
    if (text) {
      const payload = JSON.parse(text);
      const items = tryParseItems(payload);
      if (items.length) {
        STATE.data.allLaptops = normalizeList(items);
        return;
      }
    }
  } catch (e) {
    console.debug('fetchMarketIntel primary layer failed', e?.message || e);
  }
  // 2) Module fallback (centralized) then 3) legacy inline fallback
  try {
    const paths = ['/src/data/fallbackLaptops.js', 'src/data/fallbackLaptops.js', '../src/data/fallbackLaptops.js'];
    let mod = null;
    for (const p of paths) { try { mod = await import(p); if (mod) break; } catch (e) { /* module path miss OK */ } }
    if (mod) {
      const items = Array.isArray(mod?.LAPTOP_FALLBACK?.initial)
        ? mod.LAPTOP_FALLBACK.initial
        : Array.isArray(mod?.LAPTOP_FALLBACK?.all)
          ? mod.LAPTOP_FALLBACK.all
          : Array.isArray(mod?.FALLBACK_LAPTOPS)
            ? mod.FALLBACK_LAPTOPS
            : [];
      if (items.length) {
        STATE.data.allLaptops = normalizeList(items);
        return;
      }
    }
  } catch (e) {
    console.debug('fetchMarketIntel module layer failed', e?.message || e);
  }
  console.warn('Falling back to embedded state fallback dataset.');
  STATE.data.allLaptops = normalizeList(STATE.data.fallbackLaptops);
}

export async function callAIAgent(task, payload, outputElement, callbacks = {}) {
  const { onIntelSuccess, onIntelFallback } = callbacks;

  if (outputElement) {
    outputElement.innerHTML = '<span class="animate-pulse">AI Bradaa is thinking...</span>';
  }

  const { systemPrompt, userPrompt, generationConfig } = buildPrompts(task, payload);
  const apiKey = '';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig,
    tools: task === 'deal-assassin' || task === 'getFutureIntel' ? [{ google_search: {} }] : []
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (task === 'getFutureIntel') {
      try {
        const intelData = JSON.parse(text);
        if (!intelData.intelligence) {
          throw new Error('Formatted JSON not found in AI response for Intel.');
        }
        onIntelSuccess?.(intelData.intelligence);
      } catch (error) {
        console.error('Failed to parse Intel JSON:', error, 'Raw text:', text);
        onIntelFallback?.(text);
      }
      return;
    }

    if (outputElement) {
      outputElement.innerHTML = text || 'Sorry, AI Bradaa could not provide a clear answer. Please try again.';
    }
  } catch (error) {
    console.error('AI Agent Call Failed:', error);
    if (outputElement) {
      outputElement.textContent = 'ERROR: Could not connect to the AI. Please check your connection and try again.';
    }
  }
}
