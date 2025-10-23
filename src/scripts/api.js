import { STATE } from './state.js';
import { buildPrompts } from './prompts.js';
import { normalizeLaptop } from '../../ai_pod/data/normalizeLaptop.js';

export function buildAffiliateLink(originalUrl, platform) {
  if (!originalUrl) return '#';
  const { SHOPEE_AFFILIATE_ID } = STATE.affiliate;
  if (platform === 'shopee' && SHOPEE_AFFILIATE_ID) {
    return `${originalUrl}&af_id=${SHOPEE_AFFILIATE_ID}`;
  }
  return originalUrl;
}

export async function fetchMarketIntel() {
  // New strategy: primary dataset + fallback JSON, then legacy constant as last resort
  const DEFAULT_IMG = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22 viewBox=%220 0 600 400%22%3E%3Crect width=%22600%22 height=%22400%22 fill=%22%231a1a1a%22/%3E%3Ctext x=%22300%22 y=%22205%22 fill=%22%234a4a4a%22 font-family=%22Arial%2CHelvetica%2Csans-serif%22 font-size=%2220%22 text-anchor=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E';
  const normalizeList = (items) => (Array.isArray(items) ? items : [])
    .map(entry => normalizeLaptop(entry, { defaultImage: DEFAULT_IMG }))
    .filter(Boolean);
  const toItems = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.laptops)) return payload.laptops;
    if (Array.isArray(payload)) return payload;
    return [];
  };

  const fetchJson = async (path, label) => {
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) throw new Error(`http_${res.status}`);
      return await res.json();
    } catch (error) {
      console.warn('dataset load failed:', label ?? path, error?.message || error);
      return null;
    }
  };

  const [primaryRaw, fallbackRaw, schemaInfo] = await Promise.all([
    fetchJson('/data/laptops.json', 'laptops.json'),
    fetchJson('/data/fallbackLaptops.json', 'fallbackLaptops.json'),
    fetchJson('/data/laptops.schema.json', 'laptops.schema.json')
  ]);

  const primaryItems = toItems(primaryRaw);
  const fallbackItems = toItems(fallbackRaw);

  const primaryNormalized = normalizeList(primaryItems);
  const fallbackNormalized = normalizeList(fallbackItems);

  if (fallbackNormalized.length) {
    STATE.data.fallbackLaptops = fallbackNormalized;
  }

  const sortByScore = (list) => [...list].sort((a, b) => (Number(b?.score) || 0) - (Number(a?.score) || 0));
  const dedupe = (list) => {
    const out = [];
    const seen = new Set();
    for (const item of list) {
      if (!item) continue;
      const key = `${String(item.brand || '').trim().toLowerCase()}|${String(item.model || '').trim().toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(item);
    }
    return out;
  };

  const rankedPrimary = dedupe(sortByScore(primaryNormalized));
  const rankedFallback = dedupe(sortByScore(fallbackNormalized));
  const useFallbackOnly = rankedPrimary.length === 0 && rankedFallback.length > 0;
  const activeDataset = useFallbackOnly ? rankedFallback : rankedPrimary;

  if (activeDataset.length) {
    STATE.data.allLaptops = activeDataset;
  } else if (STATE.data.fallbackLaptops.length) {
    STATE.data.allLaptops = normalizeList(STATE.data.fallbackLaptops);
  } else {
    STATE.data.allLaptops = [];
  }

  const timestampPool = useFallbackOnly ? fallbackItems : primaryItems;
  const timestampCandidates = (Array.isArray(timestampPool) ? timestampPool : [])
    .map(item => item?.generated_at_myt || item?.generated_at || item?.price_checked_at_myt || null)
    .map(ts => {
      if (!ts) return null;
      const parsed = Date.parse(ts);
      return Number.isFinite(parsed) ? parsed : null;
    })
    .filter(Boolean);
  const latestTs = timestampCandidates.length
    ? new Date(Math.max(...timestampCandidates)).toISOString()
    : new Date().toISOString();
  const sourceLabel = useFallbackOnly ? 'fallbackLaptops.json' : 'laptops.json';
  const schemaVersion = (schemaInfo && typeof schemaInfo === 'object' && 'schema_version' in schemaInfo)
    ? schemaInfo.schema_version
    : undefined;

  STATE.data.datasetMeta = {
    generatedAt: latestTs,
    source: sourceLabel,
    count: STATE.data.allLaptops.length,
    ...(schemaVersion ? { schemaVersion } : {})
  };
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
